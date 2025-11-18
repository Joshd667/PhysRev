// js/features/auth/guest.js
// Guest authentication (local storage only)

export const guestAuthMethods = {
    loginAsGuest() {
        this.user = {
            id: 'guest',
            name: 'Guest User',
        };
        this.authMethod = 'local';
        this.completeLogin();
    },

    completeLogin() {
        const authData = {
            user: this.user,
            method: this.authMethod,
            expires: Date.now() + (24 * 60 * 60 * 1000)
        };
        localStorage.setItem('physicsAuditAuth', JSON.stringify(authData));
        this.isAuthenticated = true;
        this.showLoginScreen = false;
        this.loadSavedData();
    },

    checkExistingAuth() {
        const savedAuth = localStorage.getItem('physicsAuditAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                if (authData.expires > Date.now()) {
                    this.user = authData.user;
                    this.authMethod = authData.method;
                    this.isAuthenticated = true;
                    this.showLoginScreen = false;

                    // Restore Teams token if available (will load teams module if needed)
                    if (authData.method === 'teams' && authData.user.teamsToken) {
                        this.loadTeamsAuth(authData);
                    }

                    this.loadSavedData();
                    return;
                }
            } catch (error) {
                localStorage.removeItem('physicsAuditAuth');
            }
        }
        this.showLoginScreen = true;
    },

    logout() {
        if (confirm('Are you sure you want to logout? Your data has been saved.')) {
            // Stop auto-save (if Teams)
            if (this.stopAutoSave) {
                this.stopAutoSave();
            }

            // Clear authentication
            localStorage.removeItem('physicsAuditAuth');

            // Clear user-specific data if it exists
            if (this.user?.id) {
                if (this.authMethod === 'teams') {
                    localStorage.removeItem(`physicsAuditData_teams_${this.user.id}`);
                } else {
                    localStorage.removeItem(`physicsAuditData_student_${this.user.id}`);
                }
            }

            // Reset app state
            this.isAuthenticated = false;
            this.showLoginScreen = true;
            this.user = null;
            this.authMethod = null;
            this.confidenceLevels = {};
            this.analyticsHistoryData = [];

            console.log('👋 Logged out successfully');
        }
    }
};
