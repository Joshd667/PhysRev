// js/features/settings/index.js
// Settings modal management and preferences

export const settingsMethods = {
    /**
     * Opens the settings modal
     */
    openSettings() {
        this.showSettingsModal = true;

        // Refresh icons after modal opens
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Closes the settings modal
     */
    closeSettings() {
        this.showSettingsModal = false;
    },

    /**
     * Toggles the settings modal
     */
    toggleSettings() {
        if (this.showSettingsModal) {
            this.closeSettings();
        } else {
            this.openSettings();
        }
    },

    /**
     * Handle settings changes that need to be saved
     */
    saveSettings() {
        // Save current view mode and selected paper to localStorage
        this.saveToLocalStorage();
    },

    /**
     * Saves current state to localStorage (for persistent preferences)
     */
    saveToLocalStorage() {
        try {
            const preferences = {
                viewMode: this.viewMode,
                selectedPaper: this.selectedPaper,
                darkMode: this.darkMode
            };
            localStorage.setItem('physicsAuditPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Failed to save preferences:', error);
        }
    },

    /**
     * Loads preferences from localStorage
     */
    loadPreferences() {
        try {
            const saved = localStorage.getItem('physicsAuditPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);

                // Only restore if values are valid
                if (preferences.viewMode === 'spec' || preferences.viewMode === 'paper') {
                    this.viewMode = preferences.viewMode;
                }

                if (preferences.selectedPaper && ['Paper 1', 'Paper 2', 'All Topics'].includes(preferences.selectedPaper)) {
                    this.selectedPaper = preferences.selectedPaper;
                }

                if (typeof preferences.darkMode === 'boolean') {
                    this.darkMode = preferences.darkMode;
                    this.applyDarkMode();
                }
            } else {
                // Migration: Check for old darkMode key
                const oldDarkMode = localStorage.getItem('darkMode');
                if (oldDarkMode !== null) {
                    this.darkMode = oldDarkMode === 'true';
                    this.applyDarkMode();
                    // Save to new format
                    this.saveToLocalStorage();
                } else {
                    // No saved preference, use system preference
                    this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    this.applyDarkMode();
                }
            }
        } catch (error) {
            console.warn('Failed to load preferences:', error);
        }
    }
};
