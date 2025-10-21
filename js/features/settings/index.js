// js/features/settings/index.js
// Settings modal management and preferences

import { checkForUpdates, activateUpdate } from '../../sw-registration.js';

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
                darkMode: this.darkMode,
                revisionAreaIndicatorStyle: this.revisionAreaIndicatorStyle
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

                if (preferences.revisionAreaIndicatorStyle && ['bar', 'outline', 'none'].includes(preferences.revisionAreaIndicatorStyle)) {
                    this.revisionAreaIndicatorStyle = preferences.revisionAreaIndicatorStyle;
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
    },

    /**
     * Check for app updates manually
     */
    async checkForAppUpdates() {
        this.checkingForUpdates = true;
        this.updateCheckMessage = '';

        try {
            const result = await checkForUpdates();

            if (result.available) {
                this.updateAvailable = true;
                this.updateCheckMessage = 'Update available!';
            } else {
                this.updateCheckMessage = result.error || 'App is up to date';
            }

            // Refresh icons after state update
            this.$nextTick(() => {
                if (window.lucide) {
                    lucide.createIcons();
                }
            });
        } catch (error) {
            console.error('Update check failed:', error);
            this.updateCheckMessage = 'Update check failed. Please try again.';
        } finally {
            this.checkingForUpdates = false;
        }
    },

    /**
     * Install update immediately without backup
     */
    installUpdateNow() {
        console.log('🚀 Installing update now...');
        activateUpdate();
        // Service worker will reload the page
    },

    /**
     * Backup data and then install update
     */
    async backupAndUpdate() {
        try {
            console.log('💾 Creating backup before update...');

            // Use existing backup method
            await this.exportDataBackup();

            // Wait a moment for backup to complete
            setTimeout(() => {
                console.log('🚀 Installing update after backup...');
                activateUpdate();
                // Service worker will reload the page
            }, 500);
        } catch (error) {
            console.error('Backup failed:', error);
            alert('Backup failed. Update cancelled for safety.');
        }
    }
};
