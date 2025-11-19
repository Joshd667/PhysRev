// js/features/auth/teams.js - Microsoft Teams Authentication

import { idbGet, idbSet, idbRemove } from '../../utils/indexeddb.js';

// Configuration for Microsoft Teams/Azure AD
const TEAMS_CONFIG = {
    // Replace with your actual Azure AD application configuration
    CLIENT_ID: 'your-teams-app-client-id', // Get from Azure AD App Registration
    TENANT_ID: 'your-tenant-id', // Your organization's tenant ID
    REDIRECT_URI: window.location.origin + '/auth-callback.html', // Create this page
    SCOPES: ['openid', 'profile', 'email', 'offline_access'],
    
    // File storage configuration for Teams
    DATA_FILENAME: 'physics-audit-data.json',
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
};

export const teamsAuthMethods = {
    // Internal state for Teams authentication
    teamsToken: null,
    autoSaveTimer: null,

    async completeLogin() {
        // Serialize to plain object to avoid DataCloneError with Alpine.js proxies
        const authData = JSON.parse(JSON.stringify({
            user: this.user,
            method: this.authMethod,
            expires: Date.now() + (24 * 60 * 60 * 1000)
        }));
        await idbSet('physicsAuditAuth', authData);
        this.isAuthenticated = true;
        this.showLoginScreen = false;
        await this.loadSavedData();

        // Check and show privacy notice if first time user
        await this.checkAndShowPrivacyNotice();
    },

    async loginWithTeams() {
        this.isLoading = true;
        this.loginError = null;

        try {
            console.log('🔐 Authenticating with Microsoft Teams...');
            
            // Check if we're in Teams context
            if (this.isInTeamsContext()) {
                await this.authenticateInTeams();
            } else {
                // Fallback to web-based OAuth flow
                await this.authenticateWithAzureAD();
            }

            console.log('✅ Teams authentication successful');

        } catch (error) {
            console.error('❌ Teams authentication failed:', error);
            this.loginError = error.message;
        } finally {
            this.isLoading = false;
        }
    },

    // Check if running inside Microsoft Teams
    isInTeamsContext() {
        return window.parent !== window.self && 
               (window.location.hostname.includes('teams.microsoft.com') || 
                window.navigator.userAgent.includes('Teams/'));
    },

    // Authenticate using Teams JavaScript SDK
    async authenticateInTeams() {
        // Load Teams SDK if not already loaded
        if (!window.microsoftTeams) {
            await this.loadTeamsSDK();
        }

        return new Promise((resolve, reject) => {
            window.microsoftTeams.initialize();
            
            // Get Teams context
            window.microsoftTeams.getContext((context) => {
                console.log('Teams context:', context);
                
                // Use Teams SSO
                window.microsoftTeams.authentication.getAuthToken({
                    resources: [TEAMS_CONFIG.CLIENT_ID],
                    silent: false,
                    failureCallback: (error) => {
                        console.error('Teams SSO failed:', error);
                        reject(new Error('Teams authentication failed: ' + error));
                    },
                    successCallback: async (token) => {
                        try {
                            this.teamsToken = token;
                            
                            // Decode the token to get user info
                            const userInfo = this.decodeJWTToken(token);
                            
                            this.user = {
                                id: userInfo.sub || userInfo.oid,
                                username: userInfo.preferred_username || userInfo.upn,
                                name: userInfo.name,
                                email: userInfo.email || userInfo.preferred_username,
                                tenantId: context.tid,
                                teamsToken: token,
                                teamsContext: context
                            };

                            this.authMethod = 'teams';
                            
                            // Load existing data
                            await this.loadDataFromTeams();

                            await this.completeLogin();
                            this.startAutoSave();
                            
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            });
        });
    },

    // Fallback web-based OAuth flow
    async authenticateWithAzureAD() {
        // Construct Azure AD OAuth URL
        const authUrl = new URL('https://login.microsoftonline.com/' + TEAMS_CONFIG.TENANT_ID + '/oauth2/v2.0/authorize');
        authUrl.searchParams.append('client_id', TEAMS_CONFIG.CLIENT_ID);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', TEAMS_CONFIG.REDIRECT_URI);
        authUrl.searchParams.append('scope', TEAMS_CONFIG.SCOPES.join(' '));
        authUrl.searchParams.append('state', this.generateState());

        // Store state for verification
        sessionStorage.setItem('oauth_state', authUrl.searchParams.get('state'));

        // Open popup for authentication
        const popup = window.open(authUrl.toString(), 'teamsAuth', 'width=500,height=600');
        
        return new Promise((resolve, reject) => {
            const pollTimer = setInterval(() => {
                try {
                    if (popup.closed) {
                        clearInterval(pollTimer);
                        reject(new Error('Authentication popup was closed'));
                        return;
                    }

                    // Check if popup has navigated to redirect URI
                    if (popup.location.href.includes(TEAMS_CONFIG.REDIRECT_URI)) {
                        const url = new URL(popup.location.href);
                        const code = url.searchParams.get('code');
                        const state = url.searchParams.get('state');
                        
                        popup.close();
                        clearInterval(pollTimer);
                        
                        if (state !== sessionStorage.getItem('oauth_state')) {
                            reject(new Error('Invalid state parameter'));
                            return;
                        }
                        
                        if (code) {
                            this.exchangeCodeForToken(code).then(resolve).catch(reject);
                        } else {
                            reject(new Error('No authorization code received'));
                        }
                    }
                } catch (error) {
                    // Ignore cross-origin errors while popup is on different domain
                }
            }, 1000);
        });
    },

    // Exchange authorization code for access token
    async exchangeCodeForToken(code) {
        const tokenUrl = 'https://login.microsoftonline.com/' + TEAMS_CONFIG.TENANT_ID + '/oauth2/v2.0/token';
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: TEAMS_CONFIG.CLIENT_ID,
                code: code,
                redirect_uri: TEAMS_CONFIG.REDIRECT_URI,
                grant_type: 'authorization_code',
                scope: TEAMS_CONFIG.SCOPES.join(' ')
            })
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }

        const tokenData = await response.json();
        
        if (tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error);
        }

        this.teamsToken = tokenData.access_token;
        
        // Get user info from token
        const userInfo = this.decodeJWTToken(tokenData.access_token);
        
        this.user = {
            id: userInfo.sub || userInfo.oid,
            username: userInfo.preferred_username || userInfo.upn,
            name: userInfo.name,
            email: userInfo.email || userInfo.preferred_username,
            tenantId: userInfo.tid,
            teamsToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token
        };

        this.authMethod = 'teams';
        
        // Load existing data
        await this.loadDataFromTeams();

        await this.completeLogin();
        this.startAutoSave();
    },

    // Load Teams JavaScript SDK
    async loadTeamsSDK() {
        if (window.microsoftTeams) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://res.cdn.office.net/teams-js/2.0.0/js/MicrosoftTeams.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Teams SDK'));
            document.head.appendChild(script);
        });
    },

    // Decode JWT token to get user info
    decodeJWTToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Failed to decode JWT token:', error);
            return {};
        }
    },

    // Generate random state for OAuth
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },

    // Load physics audit data from Teams/SharePoint
    async loadDataFromTeams() {
        try {
            console.log('📁 Loading data from Teams...');

            // For now, we'll store in IndexedDB with user-specific key
            // In production, you might want to use SharePoint or Teams storage
            const userSpecificKey = `physicsAuditData_teams_${this.user.id}`;
            const parsedData = await idbGet(userSpecificKey);

            if (parsedData) {
                this.confidenceLevels = parsedData.confidenceLevels || {};
                this.analyticsHistoryData = parsedData.analyticsHistory || [];
                console.log('✅ Data loaded from Teams storage successfully');
            } else {
                console.log('📝 No physics audit data found - starting fresh');
            }

        } catch (error) {
            console.warn('⚠️ Failed to load data from Teams:', error);
            // Continue without cloud data
        }
    },

    // Save physics audit data to Teams/SharePoint
    async saveDataToTeams() {
        if (!this.user || !this.teamsToken || this.authMethod !== 'teams') {
            return false;
        }

        try {
            console.log('💾 Saving data to Teams...');

            // Prepare the data to save (serialize to plain object)
            const dataToSave = JSON.parse(JSON.stringify({
                confidenceLevels: this.confidenceLevels,
                analyticsHistory: this.analyticsHistoryData || [],
                lastUpdated: new Date().toISOString(),
                version: "1.0",
                user: {
                    id: this.user.id,
                    name: this.user.name,
                    email: this.user.email
                }
            }));

            // For now, save to IndexedDB with user-specific key
            // In production, implement SharePoint/Teams storage
            const userSpecificKey = `physicsAuditData_teams_${this.user.id}`;
            await idbSet(userSpecificKey, dataToSave);

            console.log('✅ Data saved to Teams successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to save data to Teams:', error);
            return false;
        }
    },

    // Start auto-save timer
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        if (this.authMethod === 'teams' && this.teamsToken) {
            this.autoSaveTimer = setInterval(() => {
                this.saveDataToTeams();
            }, TEAMS_CONFIG.AUTO_SAVE_INTERVAL);
            
            console.log('🔄 Auto-save to Teams enabled');
        }
    },

    // Stop auto-save timer
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('⏹️ Auto-save stopped');
        }
    }
};

