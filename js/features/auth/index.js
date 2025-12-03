// js/features/auth/index.js
// Auth facade - loads guest auth immediately, Teams auth on demand

import { guestAuthMethods } from './guest.js';
import { logger } from '../../utils/logger.js';

// Backend authentication exports (NEW - for Teams backend integration)
export { authBackend } from './auth-backend.js';
export { apiClient, authAPI, userDataAPI, BackgroundSyncManager } from './api-client.js';

let teamsAuthMethods = null;

export async function loadAuthMethods() {
    // Always provide guest auth
    const authMethods = { ...guestAuthMethods };

    // Add lazy Teams auth loader
    authMethods.loadTeamsAuth = async function (authData) {
        if (!teamsAuthMethods) {
            logger.log('⚡ Lazy loading Teams auth module...');
            const teamsModule = await import('./teams.js');
            teamsAuthMethods = teamsModule.teamsAuthMethods;
            // Bind all Teams methods to this context
            Object.assign(this, teamsAuthMethods);
            logger.log('✅ Teams auth module loaded');
        }
        this.teamsToken = authData.user.teamsToken;
        if (this.startAutoSave) {
            this.startAutoSave();
        }
    };

    // Add Teams login method that lazy-loads the Teams module
    authMethods.loginWithTeams = async function () {
        if (!teamsAuthMethods) {
            logger.log('⚡ Lazy loading Teams auth module...');
            const teamsModule = await import('./teams.js');
            teamsAuthMethods = teamsModule.teamsAuthMethods;
            // Bind all Teams methods to this context
            Object.assign(this, teamsAuthMethods);
            logger.log('✅ Teams auth module loaded');
        }
        // Call the actual Teams login method (now bound to this)
        return teamsAuthMethods.loginWithTeams.call(this);
    };

    // Initiate Teams login - checks privacy notice first
    authMethods.initiateTeamsLogin = async function () {
        try {
            const { idbGet } = await import('../../utils/indexeddb.js');
            const hasSeenNotice = await idbGet('privacyNoticeSeen');

            if (!hasSeenNotice) {
                // Show privacy modal in Teams mode (will trigger loginWithTeams when user continues)
                this.openPrivacyNotice(true);
            } else {
                // User has already seen privacy notice, proceed directly to login
                await this.loginWithTeams();
            }
        } catch (error) {
            logger.warn('Failed to check privacy notice status:', error);
            // If check fails, proceed with login anyway
            await this.loginWithTeams();
        }
    };

    return authMethods;
}
