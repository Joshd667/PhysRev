// js/features/auth/guest.js
// Guest authentication (IndexedDB storage)

import { idbGet, idbSet, idbRemove } from '../../utils/indexeddb.js';

export const guestAuthMethods = {
    async loginAsGuest() {
        this.user = {
            id: 'guest',
            name: 'Guest User',
        };
        this.authMethod = 'local';
        await this.completeLogin();
    },

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

    async checkExistingAuth() {
        const authData = await idbGet('physicsAuditAuth');
        if (authData) {
            try {
                if (authData.expires > Date.now()) {
                    this.user = authData.user;
                    this.authMethod = authData.method;
                    this.isAuthenticated = true;
                    this.showLoginScreen = false;

                    // Restore Teams token if available (will load teams module if needed)
                    if (authData.method === 'teams' && authData.user.teamsToken) {
                        await this.loadTeamsAuth(authData);
                    }

                    await this.loadSavedData();

                    // Check and show privacy notice if first time user
                    await this.checkAndShowPrivacyNotice();
                    return;
                }
            } catch (error) {
                await idbRemove('physicsAuditAuth');
            }
        }
        this.showLoginScreen = true;
    },

    async logout() {
        const confirmed = await this.showConfirm(
            'Your data has been saved and will remain on this device. You can log back in anytime to access it.',
            'Logout Confirmation'
        );

        if (confirmed) {
            // Stop auto-save (if Teams)
            if (this.stopAutoSave) {
                this.stopAutoSave();
            }

            // Clear authentication
            await idbRemove('physicsAuditAuth');

            // Clear privacy notice seen flag so user sees it again on next login
            await idbRemove('privacyNoticeSeen');

            // Clear user-specific data if it exists
            if (this.user?.id) {
                if (this.authMethod === 'teams') {
                    await idbRemove(`physicsAuditData_teams_${this.user.id}`);
                } else {
                    await idbRemove(`physicsAuditData_student_${this.user.id}`);
                }
            }

            // Reset app state
            this.isAuthenticated = false;
            this.showLoginScreen = true;
            this.user = null;
            this.authMethod = null;
            this.confidenceLevels = {};
            this.analyticsHistoryData = [];

            // Close settings modal
            this.showSettingsModal = false;
        }
    }
};
