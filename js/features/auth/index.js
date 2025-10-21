// js/features/auth/index.js
// Auth facade - loads guest auth immediately, Teams auth on demand

import { guestAuthMethods } from './guest.js';

let teamsAuthMethods = null;

export async function loadAuthMethods() {
    // Always provide guest auth
    const authMethods = { ...guestAuthMethods };

    // Add lazy Teams auth loader
    authMethods.loadTeamsAuth = async function(authData) {
        if (!teamsAuthMethods) {
            console.log('⚡ Lazy loading Teams auth module...');
            const teamsModule = await import('./teams.js');
            teamsAuthMethods = teamsModule.teamsAuthMethods;
            // Bind all Teams methods to this context
            Object.assign(this, teamsAuthMethods);
            console.log('✅ Teams auth module loaded');
        }
        this.teamsToken = authData.user.teamsToken;
        if (this.startAutoSave) {
            this.startAutoSave();
        }
    };

    // Add Teams login method that lazy-loads the Teams module
    authMethods.loginWithTeams = async function() {
        if (!teamsAuthMethods) {
            console.log('⚡ Lazy loading Teams auth module...');
            const teamsModule = await import('./teams.js');
            teamsAuthMethods = teamsModule.teamsAuthMethods;
            // Bind all Teams methods to this context
            Object.assign(this, teamsAuthMethods);
            console.log('✅ Teams auth module loaded');
        }
        // Call the actual Teams login method (now bound to this)
        return teamsAuthMethods.loginWithTeams.call(this);
    };

    return authMethods;
}
