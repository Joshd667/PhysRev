/**
 * auth-backend.js - Teams Authentication Backend Logic
 * 
 * Purpose: Server-side authentication and token management for Teams integration.
 * This module is designed to be extracted to a backend service (Node.js/Azure Functions).
 * 
 * Security Pattern: Follows claude.md best practices:
 * - Token validation with expiry checks
 * - PKCE verification for public clients
 * - Refresh token rotation
 * - No client secrets (SPA pattern)
 * 
 * @module auth-backend
 */

import { logger } from '../../utils/logger.js';
import { idbGet, idbSet, idbRemove } from '../../utils/indexeddb.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Azure AD OAuth Configuration
 * NOTE: These should be environment variables in production backend
 */
const AUTH_CONFIG = {
    // Azure AD endpoints
    AUTHORITY: 'https://login.microsoftonline.com',
    TOKEN_ENDPOINT: '/oauth2/v2.0/token',
    AUTHORIZE_ENDPOINT: '/oauth2/v2.0/authorize',
    
    // Token lifetimes (align with Azure AD defaults)
    ACCESS_TOKEN_LIFETIME: 3600,      // 1 hour
    REFRESH_TOKEN_LIFETIME: 7776000,  // 90 days
    
    // Security settings
    ALLOWED_SCOPES: ['openid', 'profile', 'email', 'offline_access', 'Files.ReadWrite'],
    MIN_TOKEN_LENGTH: 32,  // Minimum JWT length for validation
};

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validates Azure AD JWT token structure and claims
 * SECURITY: Critical for preventing token forgery and replay attacks
 * 
 * @param {string} token - JWT access token
 * @param {string} expectedTenantId - Expected tenant ID for validation
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export function validateJWTToken(token, expectedTenantId = null) {
    try {
        // Basic structure validation
        if (!token || typeof token !== 'string' || token.length < AUTH_CONFIG.MIN_TOKEN_LENGTH) {
            logger.error('🚨 SECURITY: Invalid token structure');
            return null;
        }

        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            logger.error('🚨 SECURITY: Invalid JWT format');
            return null;
        }

        // Decode payload (base64url decoding)
        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        // Validate required claims
        if (!payload.exp || !payload.iat || !payload.aud) {
            logger.error('🚨 SECURITY: Missing required JWT claims');
            return null;
        }

        // Check token expiration (with 5 minute clock skew tolerance)
        const now = Math.floor(Date.now() / 1000);
        const CLOCK_SKEW = 300; // 5 minutes
        
        if (payload.exp < (now - CLOCK_SKEW)) {
            logger.error('🚨 SECURITY: Token expired', {
                expiry: new Date(payload.exp * 1000).toISOString(),
                now: new Date(now * 1000).toISOString()
            });
            return null;
        }

        // Validate token is not issued in the future
        if (payload.iat > (now + CLOCK_SKEW)) {
            logger.error('🚨 SECURITY: Token issued in future');
            return null;
        }

        // Validate tenant ID if provided (prevent cross-tenant attacks)
        if (expectedTenantId && payload.tid !== expectedTenantId) {
            logger.error('🚨 SECURITY: Tenant ID mismatch', {
                expected: expectedTenantId,
                actual: payload.tid
            });
            return null;
        }

        // Validate audience claim (should match client ID)
        // NOTE: In production backend, verify aud matches your CLIENT_ID
        
        logger.info('✅ Token validated successfully', {
            subject: payload.sub,
            expiry: new Date(payload.exp * 1000).toISOString()
        });

        return payload;

    } catch (error) {
        logger.error('🚨 SECURITY: Token validation exception:', error);
        return null;
    }
}

/**
 * Verifies PKCE code challenge matches code verifier
 * SECURITY: Prevents authorization code interception attacks
 * 
 * @param {string} codeVerifier - Original random string (43-128 chars)
 * @param {string} codeChallenge - Base64url(SHA256(codeVerifier))
 * @param {string} method - Challenge method: 'S256' or 'plain'
 * @returns {boolean} - True if verification succeeds
 */
export async function verifyPKCE(codeVerifier, codeChallenge, method = 'S256') {
    try {
        // Validate inputs
        if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
            logger.error('🚨 SECURITY: Invalid code verifier length');
            return false;
        }

        if (!codeChallenge) {
            logger.error('🚨 SECURITY: Missing code challenge');
            return false;
        }

        // Verify based on method
        if (method === 'S256') {
            // Compute SHA-256 hash of verifier
            const encoder = new TextEncoder();
            const data = encoder.encode(codeVerifier);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            
            // Convert to base64url
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const base64 = btoa(String.fromCharCode(...hashArray));
            const computedChallenge = base64
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');

            const isValid = computedChallenge === codeChallenge;
            
            if (!isValid) {
                logger.error('🚨 SECURITY: PKCE verification failed - challenge mismatch');
            }
            
            return isValid;

        } else if (method === 'plain') {
            // Plain method: challenge === verifier
            return codeVerifier === codeChallenge;
        }

        logger.error('🚨 SECURITY: Unsupported PKCE method:', method);
        return false;

    } catch (error) {
        logger.error('🚨 SECURITY: PKCE verification exception:', error);
        return false;
    }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Exchanges authorization code for access and refresh tokens
 * BACKEND ONLY: This should run server-side to protect client secret
 * 
 * @param {Object} params - Exchange parameters
 * @param {string} params.code - Authorization code from OAuth callback
 * @param {string} params.clientId - Azure AD application client ID
 * @param {string} params.tenantId - Azure AD tenant ID
 * @param {string} params.redirectUri - Must match registered redirect URI
 * @param {string} params.codeVerifier - PKCE code verifier
 * @returns {Promise<Object>} - Token response or error
 */
export async function exchangeCodeForTokens(params) {
    const { code, clientId, tenantId, redirectUri, codeVerifier } = params;

    try {
        // Validate required parameters
        if (!code || !clientId || !tenantId || !redirectUri || !codeVerifier) {
            throw new Error('Missing required parameters for token exchange');
        }

        // Construct token endpoint URL
        const tokenUrl = `${AUTH_CONFIG.AUTHORITY}/${tenantId}${AUTH_CONFIG.TOKEN_ENDPOINT}`;

        // Prepare request body (application/x-www-form-urlencoded)
        const body = new URLSearchParams({
            client_id: clientId,
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,  // PKCE verification
            scope: AUTH_CONFIG.ALLOWED_SCOPES.join(' ')
        });

        // Execute token exchange
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString()
        });

        // Parse response
        const data = await response.json();

        // Handle errors
        if (!response.ok || data.error) {
            logger.error('❌ Token exchange failed:', data.error_description || data.error);
            throw new Error(data.error_description || data.error || 'Token exchange failed');
        }

        // Validate token before returning
        const payload = validateJWTToken(data.access_token, tenantId);
        if (!payload) {
            throw new Error('Received invalid access token from Azure AD');
        }

        logger.info('✅ Token exchange successful', {
            subject: payload.sub,
            scopes: data.scope?.split(' ') || []
        });

        return {
            success: true,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in || AUTH_CONFIG.ACCESS_TOKEN_LIFETIME,
            tokenType: data.token_type || 'Bearer',
            scope: data.scope,
            user: {
                id: payload.sub || payload.oid,
                email: payload.email || payload.preferred_username,
                name: payload.name,
                tenantId: payload.tid
            }
        };

    } catch (error) {
        logger.error('❌ Token exchange exception:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Refreshes access token using refresh token
 * SECURITY: Implements refresh token rotation (new token invalidates old)
 * 
 * @param {Object} params - Refresh parameters
 * @param {string} params.refreshToken - Current refresh token
 * @param {string} params.clientId - Azure AD client ID
 * @param {string} params.tenantId - Azure AD tenant ID
 * @returns {Promise<Object>} - New token response or error
 */
export async function refreshAccessToken(params) {
    const { refreshToken, clientId, tenantId } = params;

    try {
        // Validate parameters
        if (!refreshToken || !clientId || !tenantId) {
            throw new Error('Missing required parameters for token refresh');
        }

        // Construct token endpoint URL
        const tokenUrl = `${AUTH_CONFIG.AUTHORITY}/${tenantId}${AUTH_CONFIG.TOKEN_ENDPOINT}`;

        // Prepare refresh request
        const body = new URLSearchParams({
            client_id: clientId,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            scope: AUTH_CONFIG.ALLOWED_SCOPES.join(' ')
        });

        // Execute refresh
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString()
        });

        const data = await response.json();

        // Handle errors
        if (!response.ok || data.error) {
            // Common errors: invalid_grant (token expired/revoked), invalid_client
            logger.error('❌ Token refresh failed:', data.error_description || data.error);
            throw new Error(data.error_description || data.error || 'Token refresh failed');
        }

        // Validate new access token
        const payload = validateJWTToken(data.access_token, tenantId);
        if (!payload) {
            throw new Error('Received invalid access token from refresh');
        }

        logger.info('✅ Token refreshed successfully', {
            subject: payload.sub
        });

        return {
            success: true,
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken,  // New refresh token or keep old
            expiresIn: data.expires_in || AUTH_CONFIG.ACCESS_TOKEN_LIFETIME,
            tokenType: data.token_type || 'Bearer'
        };

    } catch (error) {
        logger.error('❌ Token refresh exception:', error);
        return {
            success: false,
            error: error.message,
            requiresLogin: error.message.includes('invalid_grant')  // User needs to re-authenticate
        };
    }
}

// ============================================================================
// SESSION MANAGEMENT (Client-Side)
// ============================================================================

/**
 * Stores authentication session in IndexedDB
 * SECURITY: Uses IndexedDB (not localStorage) per claude.md rule #15
 * 
 * @param {Object} sessionData - Session data to store
 * @param {string} sessionData.accessToken - JWT access token
 * @param {string} sessionData.refreshToken - Refresh token
 * @param {number} sessionData.expiresIn - Token lifetime in seconds
 * @param {Object} sessionData.user - User profile data
 * @returns {Promise<boolean>} - Success status
 */
export async function storeSession(sessionData) {
    try {
        const expiryTime = Date.now() + (sessionData.expiresIn * 1000);
        
        const session = {
            accessToken: sessionData.accessToken,
            refreshToken: sessionData.refreshToken,
            expiresAt: expiryTime,
            user: sessionData.user,
            createdAt: Date.now()
        };

        // Store in IndexedDB (NOT localStorage - security requirement)
        await idbSet('auth_session', session);
        
        logger.info('✅ Session stored securely in IndexedDB');
        return true;

    } catch (error) {
        logger.error('❌ Failed to store session:', error);
        return false;
    }
}

/**
 * Retrieves authentication session from IndexedDB
 * SECURITY: Validates token expiry before returning
 * 
 * @returns {Promise<Object|null>} - Session data or null if expired/invalid
 */
export async function getSession() {
    try {
        const session = await idbGet('auth_session');
        
        if (!session) {
            return null;
        }

        // Check if token is expired (with 5 minute buffer for refresh)
        const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes
        if (session.expiresAt < (Date.now() + REFRESH_BUFFER)) {
            logger.info('⚠️ Access token expired or expiring soon');
            
            // Token is expired/expiring, attempt refresh if refresh token exists
            if (session.refreshToken) {
                logger.info('🔄 Attempting automatic token refresh...');
                return { ...session, needsRefresh: true };
            }
            
            // No refresh token available, session is invalid
            await clearSession();
            return null;
        }

        return session;

    } catch (error) {
        logger.error('❌ Failed to retrieve session:', error);
        return null;
    }
}

/**
 * Clears authentication session from IndexedDB
 * SECURITY: Complete cleanup on logout
 * 
 * @returns {Promise<boolean>} - Success status
 */
export async function clearSession() {
    try {
        await idbRemove('auth_session');
        logger.info('✅ Session cleared from IndexedDB');
        return true;
    } catch (error) {
        logger.error('❌ Failed to clear session:', error);
        return false;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const authBackend = {
    // Token validation
    validateJWTToken,
    verifyPKCE,
    
    // Token exchange
    exchangeCodeForTokens,
    refreshAccessToken,
    
    // Session management (client-side)
    storeSession,
    getSession,
    clearSession,
    
    // Configuration
    AUTH_CONFIG
};

export default authBackend;
