// js/features/settings/index.js
// Settings modal management and preferences

import { checkForUpdates, activateUpdate } from '../../sw-registration.js';
import { logger } from '../../utils/logger.js';

// ⚡ PERFORMANCE: Cache privacy notice status in memory
let privacyNoticeSeenCache = null;

export const settingsMethods = {
    /**
     * Opens the settings modal
     * ⚡ OPTIMIZED: Lazy-loads template on first use
     */
    async openSettings() {
        // ⚡ Lazy-load settings modal template (57 KB) on first use
        const { loadTemplateLazy } = await import('../../template-loader.js');
        await loadTemplateLazy('settings-modal-container', './templates/settings-modal.html');

        this.showSettingsModal = true;

        // ⚡ Refresh icons after modal opens (debounced)
        this.$nextTick(() => {
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
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
    async saveToLocalStorage() {
        try {
            const preferences = {
                viewMode: this.viewMode,
                selectedPaper: this.selectedPaper,
                darkMode: this.darkMode,
                revisionAreaIndicatorStyle: this.revisionAreaIndicatorStyle
            };
            const { idbSet } = await import('../../utils/indexeddb.js');
            await idbSet('physicsAuditPreferences', preferences);
        } catch (error) {
            logger.warn('Failed to save preferences:', error);
        }
    },

    /**
     * Loads preferences from IndexedDB
     * ⚡ OPTIMIZED: Uses batched reads for better performance
     */
    async loadPreferences() {
        try {
            // ⚡ Batch read preferences and old darkMode key together
            const { idbGetBatch } = await import('../../utils/indexeddb.js');
            const data = await idbGetBatch(['physicsAuditPreferences', 'darkMode']);

            const preferences = data.physicsAuditPreferences;
            if (preferences) {
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
                // Migration: Check for old darkMode key (already loaded in batch)
                const oldDarkMode = data.darkMode;
                if (oldDarkMode !== null) {
                    this.darkMode = oldDarkMode === 'true' || oldDarkMode === true;
                    this.applyDarkMode();
                    // Save to new format
                    await this.saveToLocalStorage();
                } else {
                    // No saved preference, use system preference
                    this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    this.applyDarkMode();
                }
            }
        } catch (error) {
            logger.warn('Failed to load preferences:', error);
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
            logger.error('Update check failed:', error);
            this.updateCheckMessage = 'Update check failed. Please try again.';
        } finally {
            this.checkingForUpdates = false;
        }
    },

    /**
     * Install update immediately without backup
     */
    installUpdateNow() {
        logger.log('🚀 Installing update now...');
        activateUpdate();
        // Service worker will reload the page
    },

    /**
     * ✅ FIX: Apply update from notification banner
     * Alias for installUpdateNow() for use with update banner
     */
    applyUpdate() {
        this.installUpdateNow();
    },

    /**
     * Backup data and then install update
     */
    async backupAndUpdate() {
        try {
            logger.log('💾 Creating backup before update...');

            // Use existing backup method
            await this.exportDataBackup();

            // Wait a moment for backup to complete
            setTimeout(() => {
                logger.log('🚀 Installing update after backup...');
                activateUpdate();
                // Service worker will reload the page
            }, 500);
        } catch (error) {
            logger.error('Backup failed:', error);
            alert('Backup failed. Update cancelled for safety.');
        }
    },

    /**
     * Force refresh - clear all caches and reload with fresh files
     * Service Worker will re-register and rebuild cache immediately
     */
    async forceAppRefresh() {
        if (!confirm('This will clear all cached files and reload with the latest version. Your data will be preserved. Continue?')) {
            return;
        }

        try {
            logger.log('🔄 Force refresh initiated - clearing everything...');

            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => {
                    logger.log(`🗑️ Deleting cache: ${name}`);
                    return caches.delete(name);
                }));
                logger.log('✅ All Service Worker caches cleared');
            }

            // Unregister ALL service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => {
                    logger.log('🗑️ Unregistering service worker');
                    return reg.unregister();
                }));
                logger.log('✅ Service worker unregistered');
            }

            // Hard reload with cache busting
            logger.log('🔄 Reloading with fresh files...');
            logger.log('📦 Service Worker will re-register and rebuild cache');

            // Use cache-busting timestamp to force fresh load
            const url = new URL(window.location.href);
            url.searchParams.set('_refresh', Date.now());
            window.location.href = url.toString();

        } catch (error) {
            logger.error('❌ Force refresh failed:', error);
            alert('Force refresh failed: ' + error.message);
        }
    },

    /**
     * Opens the privacy notice modal
     */
    openPrivacyNotice() {
        this.showPrivacyNoticeModal = true;

        // ⚡ Refresh icons after modal opens (debounced)
        this.$nextTick(() => {
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Closes the privacy notice modal and marks it as seen
     * ⚡ OPTIMIZED: Updates memory cache
     */
    async closePrivacyNotice() {
        this.showPrivacyNoticeModal = false;

        // Mark as seen in IndexedDB and cache
        try {
            const { idbSet } = await import('../../utils/indexeddb.js');
            await idbSet('privacyNoticeSeen', true);
            privacyNoticeSeenCache = true; // ⚡ Update cache
            logger.log('✅ Privacy notice marked as seen');
        } catch (error) {
            logger.warn('Failed to save privacy notice status:', error);
        }
    },

    /**
     * Checks if user has seen the privacy notice, and shows it if not
     * Should be called after authentication
     * ⚡ OPTIMIZED: Caches result in memory, lazy-loads template
     * @param {boolean} isTeamsMode - Whether this is for Teams login (shows Teams-specific info)
     */
    async checkAndShowPrivacyNotice(isTeamsMode = false) {
        try {
            // ⚡ Check memory cache first (instant)
            if (privacyNoticeSeenCache === null) {
                const { idbGet } = await import('../../utils/indexeddb.js');
                privacyNoticeSeenCache = await idbGet('privacyNoticeSeen');
            }

            // Only show if user hasn't seen it before
            if (!privacyNoticeSeenCache) {
                // ⚡ Lazy-load privacy modal template (17 KB) only when needed
                const { loadTemplateLazy } = await import('../../template-loader.js');
                await loadTemplateLazy('privacy-notice-modal-container', './templates/privacy-notice-modal.html');

                // Show modal
                this.openPrivacyNotice(isTeamsMode);
            }
        } catch (error) {
            logger.warn('Failed to check privacy notice status:', error);
        }
    },

    /**
     * Opens the privacy notice modal
     * @param {boolean} isTeamsMode - Whether this is for Teams login
     */
    openPrivacyNotice(isTeamsMode = false) {
        this.showPrivacyNoticeModal = true;

        // Store Teams mode for the modal to access
        window.isTeamsPrivacyMode = isTeamsMode;

        // ⚡ Refresh icons after modal opens (debounced)
        this.$nextTick(() => {
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Continue to Teams login after privacy notice acknowledgment
     * This is called from the privacy modal when user clicks "Continue to Login"
     * ⚡ OPTIMIZED: Updates memory cache
     */
    async continueToTeamsLogin() {
        // Close privacy modal
        this.showPrivacyNoticeModal = false;

        // Mark as seen
        try {
            const { idbSet } = await import('../../utils/indexeddb.js');
            await idbSet('privacyNoticeSeen', true);
            privacyNoticeSeenCache = true; // ⚡ Update cache
            logger.log('✅ Privacy notice marked as seen');
        } catch (error) {
            logger.warn('Failed to save privacy notice status:', error);
        }

        // Now proceed with actual Teams login
        await this.loginWithTeams();
    }
};
