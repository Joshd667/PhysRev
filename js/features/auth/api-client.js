/**
 * api-client.js - Backend API Client
 * 
 * Purpose: Client-side API communication with backend server for data sync.
 * Implements offline-first pattern with background synchronization.
 * 
 * Architecture Pattern:
 * - IndexedDB is primary storage (claude.md Performance Pattern)
 * - Background sync to SQL Server when online
 * - Conflict resolution: Last-write-wins with timestamp
 * - Automatic retry with exponential backoff
 * 
 * @module api-client
 */

import { logger } from '../../utils/logger.js';
import { authBackend } from './auth-backend.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * API Configuration
 * NOTE: BASE_URL can be configured at runtime via window.PHYSICS_AUDIT_CONFIG
 * 
 * Example usage in index.html before loading this module:
 * <script>
 *   window.PHYSICS_AUDIT_CONFIG = {
 *     API_BASE_URL: 'https://your-production-backend.azurewebsites.net'
 *   };
 * </script>
 */
const API_CONFIG = {
    // Backend base URL (can be overridden via window.PHYSICS_AUDIT_CONFIG.API_BASE_URL)
    BASE_URL: (typeof window !== 'undefined' && window.PHYSICS_AUDIT_CONFIG?.API_BASE_URL)
        || 'https://your-backend.azurewebsites.net',

    // API version
    API_VERSION: 'v1',

    // Timeouts
    REQUEST_TIMEOUT: 30000,  // 30 seconds

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE: 1000,  // 1 second base delay

    // Batch sizes for sync
    MAX_BATCH_SIZE: 100,  // Maximum items per sync request
};

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * Makes authenticated HTTP request to backend API
 * SECURITY: Automatically includes access token in Authorization header
 * 
 * @param {string} endpoint - API endpoint (e.g., '/user/data')
 * @param {Object} options - Fetch options
 * @param {boolean} requiresAuth - Whether endpoint requires authentication
 * @returns {Promise<Object>} - Response data or error
 */
async function apiRequest(endpoint, options = {}, requiresAuth = true) {
    try {
        // Construct full URL
        const url = `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${endpoint}`;

        // Get authentication session if required
        let session = null;
        if (requiresAuth) {
            session = await authBackend.getSession();

            if (!session) {
                throw new Error('No active session - user must login');
            }

            // Check if token needs refresh
            if (session.needsRefresh && session.refreshToken) {
                logger.info('🔄 Refreshing token before API request...');

                // Attempt token refresh
                const refreshResult = await authBackend.refreshAccessToken({
                    refreshToken: session.refreshToken,
                    clientId: session.user.clientId,  // Should be stored in session
                    tenantId: session.user.tenantId
                });

                if (refreshResult.success) {
                    // Update session with new tokens
                    await authBackend.storeSession({
                        accessToken: refreshResult.accessToken,
                        refreshToken: refreshResult.refreshToken,
                        expiresIn: refreshResult.expiresIn,
                        user: session.user
                    });

                    // Get updated session
                    session = await authBackend.getSession();
                } else if (refreshResult.requiresLogin) {
                    // Refresh failed, user needs to re-login
                    throw new Error('Session expired - please login again');
                }
            }
        }

        // Prepare request headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add authorization header if authenticated
        if (session) {
            headers['Authorization'] = `Bearer ${session.accessToken}`;
        }

        // Set timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

        // Execute request
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse response
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Handle HTTP errors
        if (!response.ok) {
            const errorMessage = data.error || data.message || `HTTP ${response.status}`;
            logger.error(`❌ API request failed [${response.status}]:`, errorMessage);

            throw new Error(errorMessage);
        }

        return {
            success: true,
            data: data,
            status: response.status
        };

    } catch (error) {
        if (error.name === 'AbortError') {
            logger.error('❌ API request timeout:', endpoint);
            return {
                success: false,
                error: 'Request timeout',
                timeout: true
            };
        }

        logger.error('❌ API request exception:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Retries API request with exponential backoff
 * 
 * @param {Function} requestFn - API request function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - Request result
 */
async function retryWithBackoff(requestFn, maxRetries = API_CONFIG.MAX_RETRIES) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            lastError = error;

            // Don't retry on authentication errors
            if (error.message.includes('login') || error.message.includes('401')) {
                throw error;
            }

            // Calculate backoff delay (exponential: 1s, 2s, 4s, 8s...)
            const delay = API_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt);

            if (attempt < maxRetries) {
                logger.warn(`⚠️ API request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Authentication API
 */
export const authAPI = {
    /**
     * Exchange authorization code for tokens
     * NOTE: This should be handled backend-side in production
     */
    async login(authCode, codeVerifier, redirectUri) {
        return await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ authCode, codeVerifier, redirectUri })
        }, false);
    },

    /**
     * Refresh access token
     */
    async refresh(refreshToken) {
        return await apiRequest('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        }, false);
    },

    /**
     * Logout and invalidate session
     */
    async logout() {
        const result = await apiRequest('/auth/logout', {
            method: 'POST'
        });

        // Clear local session regardless of backend response
        await authBackend.clearSession();

        return result;
    }
};

/**
 * User Data API
 */
export const userDataAPI = {
    /**
     * Get user profile
     */
    async getProfile() {
        return await apiRequest('/user/profile', {
            method: 'GET'
        });
    },

    /**
     * Get all user data (confidence, notes, flashcards, mindmaps)
     * Used for initial sync on login
     */
    async getAllData() {
        return await retryWithBackoff(() =>
            apiRequest('/user/data', {
                method: 'GET'
            })
        );
    },

    /**
     * Sync local data to server
     * Implements optimistic updates - local changes sent to backend
     * 
     * @param {Object} dataPackage - User data to sync
     * @param {Object} dataPackage.confidenceLevels - Confidence ratings
     * @param {Object} dataPackage.notes - User notes
     * @param {Object} dataPackage.flashcards - Flashcard decks
     * @param {Object} dataPackage.mindmaps - Mind maps
     * @param {Array} dataPackage.analytics - Analytics history
     * @param {string} dataPackage.lastUpdated - ISO timestamp
     */
    async syncData(dataPackage) {
        return await retryWithBackoff(() =>
            apiRequest('/user/data/sync', {
                method: 'POST',
                body: JSON.stringify(dataPackage)
            })
        );
    },

    /**
     * Update confidence levels only
     * Optimized for frequent updates during rating sessions
     */
    async updateConfidence(confidenceLevels) {
        return await apiRequest('/user/confidence', {
            method: 'PUT',
            body: JSON.stringify({ confidenceLevels })
        });
    },

    /**
     * Update notes
     * SECURITY: Content should be DOMPurify-sanitized client-side before sending
     */
    async updateNotes(notes) {
        return await apiRequest('/user/notes', {
            method: 'PUT',
            body: JSON.stringify({ notes })
        });
    },

    /**
     * Update flashcard decks
     */
    async updateFlashcards(flashcardDecks) {
        return await apiRequest('/user/flashcards', {
            method: 'PUT',
            body: JSON.stringify({ flashcardDecks })
        });
    },

    /**
     * Update mind maps
     */
    async updateMindmaps(mindmaps) {
        return await apiRequest('/user/mindmaps', {
            method: 'PUT',
            body: JSON.stringify({ mindmaps })
        });
    },

    /**
     * Add analytics history entry
     * Backend appends to history, client doesn't need full array
     */
    async addAnalytics(entry) {
        return await apiRequest('/user/analytics', {
            method: 'POST',
            body: JSON.stringify(entry)
        });
    }
};

// ============================================================================
// BACKGROUND SYNC MANAGER
// ============================================================================

/**
 * Background synchronization manager
 * Handles periodic sync of local IndexedDB data to backend SQL Server
 */
export class BackgroundSyncManager {
    constructor() {
        this.syncInterval = null;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncIntervalMs = 60000;  // 1 minute
    }

    /**
     * Start automatic background sync
     */
    start() {
        if (this.syncInterval) {
            logger.warn('⚠️ Background sync already running');
            return;
        }

        logger.info('✅ Starting background sync manager');

        // Initial sync
        this.performSync();

        // Set up periodic sync
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, this.syncIntervalMs);
    }

    /**
     * Stop automatic background sync
     */
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            logger.info('✅ Background sync stopped');
        }
    }

    /**
     * Perform sync operation
     * PATTERN: IndexedDB is source of truth, backend is backup
     */
    async performSync() {
        // Skip if already syncing
        if (this.isSyncing) {
            logger.info('⏭️ Sync already in progress, skipping');
            return;
        }

        // Check if user is authenticated
        const session = await authBackend.getSession();
        if (!session) {
            logger.info('⏭️ No active session, skipping sync');
            return;
        }

        this.isSyncing = true;

        try {
            // NOTE: This assumes app context has access to data
            // In production, this should be injected or accessed via global state
            const app = window.Alpine?.store?.('app');

            if (!app) {
                logger.warn('⚠️ App state not available for sync');
                return;
            }

            // Prepare data package
            const dataPackage = {
                confidenceLevels: app.confidenceLevels || {},
                notes: app.userNotes || {},
                flashcards: app.flashcardDecks || {},
                mindmaps: app.mindmaps || {},
                analytics: app.analyticsHistoryData || [],
                lastUpdated: new Date().toISOString()
            };

            // Send to backend
            const result = await userDataAPI.syncData(dataPackage);

            if (result.success) {
                this.lastSyncTime = Date.now();
                logger.info('✅ Background sync completed', {
                    timestamp: new Date().toISOString()
                });
            } else {
                logger.warn('⚠️ Background sync failed:', result.error);
            }

        } catch (error) {
            logger.error('❌ Background sync exception:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Force immediate sync
     */
    async forceSync() {
        logger.info('🔄 Force sync initiated');
        await this.performSync();
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            isRunning: this.syncInterval !== null,
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            lastSyncAgo: this.lastSyncTime
                ? Date.now() - this.lastSyncTime
                : null
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const apiClient = {
    authAPI,
    userDataAPI,
    BackgroundSyncManager,
    API_CONFIG
};

export default apiClient;
