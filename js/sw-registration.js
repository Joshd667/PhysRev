// js/sw-registration.js - Service Worker Registration with Manual Update Control

// Global update state - accessible by Alpine.js app
window.appUpdateState = {
    updateAvailable: false,
    newWorker: null,
    currentVersion: null,
    newVersion: null
};

/**
 * Register service worker with manual update control
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');

                // Store registration globally for manual update checks
                window.swRegistration = registration;

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Store update state for manual control (both dev and production)
                            window.appUpdateState.updateAvailable = true;
                            window.appUpdateState.newWorker = newWorker;

                            // Dispatch event to notify Alpine.js app
                            window.dispatchEvent(new CustomEvent('app-update-available'));
                            console.log('📢 Update available - check Settings → Updates tab');
                        }
                    });
                });

                // Handle controller changes (when update is activated)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });

                // Get current version info
                if (registration.active) {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = (event) => {
                        window.appUpdateState.currentVersion = event.data.version;
                        console.log(`✅ SW v${event.data.version} active`);
                    };
                    registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
                }

            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        });
    } else {
        console.log('❌ Service Worker not supported');
    }
}

/**
 * Manual check for updates
 */
export async function checkForUpdates() {
    if (!window.swRegistration) {
        console.log('⚠️ Service Worker not registered');
        return { available: false, error: 'Service Worker not registered' };
    }

    try {
        console.log('🔍 Checking for updates...');
        await window.swRegistration.update();

        // Wait a moment for update to be detected
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (window.appUpdateState.updateAvailable) {
            console.log('✅ Update found!');
            return { available: true };
        } else {
            console.log('✅ App is up to date');
            return { available: false };
        }
    } catch (error) {
        console.error('❌ Update check failed:', error);
        return { available: false, error: error.message };
    }
}

/**
 * Activate the pending update
 */
export function activateUpdate() {
    if (window.appUpdateState.newWorker) {
        console.log('⚡ Activating update...');
        window.appUpdateState.newWorker.postMessage({ type: 'SKIP_WAITING' });
        // Controller change event will trigger reload
    } else {
        console.warn('⚠️ No pending update to activate');
    }
}

// Performance monitoring
export async function getPerformanceHistory() {
    try {
        const { idbGet } = await import('./utils/indexeddb.js');
        const metrics = await idbGet('perfMetrics');
        return metrics || [];
    } catch (error) {
        console.warn('Failed to load performance metrics:', error);
        return [];
    }
}

export function isServiceWorkerActive() {
    return navigator.serviceWorker && navigator.serviceWorker.controller;
}

// Debug function - clear Service Worker cache manually
window.clearSWCache = function() {
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
            console.log('🗑️ All Service Worker caches cleared');
            window.location.reload();
        });
    }
};

/**
 * ✅ FIX: Comprehensive storage cleanup function
 * Clears ALL storage types: IndexedDB, Service Worker cache, localStorage
 * Keeps Service Worker registered (will reinstall on next load)
 * Usage: Call `clearAllAppStorage()` from browser console
 */
window.clearAllAppStorage = async function() {
    console.log('🧹 Starting storage cleanup (keeping Service Worker registered)...');

    try {
        const { storageUtils } = await import('./utils/storage.js');
        const result = await storageUtils.clearAllStorage(false);

        if (result.success) {
            console.log('✅ All storage cleared successfully!');
            console.log('🔄 Reloading page in 2 seconds...');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            console.warn('⚠️ Some storage types failed to clear:', result.results);
            console.log('🔄 Reloading page anyway in 2 seconds...');
            setTimeout(() => window.location.reload(), 2000);
        }

        return result;
    } catch (error) {
        console.error('❌ Failed to clear storage:', error);
        console.log('💡 Try using browser DevTools: Application → Clear storage');
        return { success: false, error: error.message };
    }
};

/**
 * ✅ FIX: FRESH storage cleanup - unregisters Service Worker too
 * Clears ALL storage AND unregisters Service Worker for completely fresh reload
 * Use this to eliminate ALL cache-related console messages on reload
 * Usage: Call `clearAllAppStorageFresh()` from browser console
 */
window.clearAllAppStorageFresh = async function() {
    console.log('🧹 Starting FRESH storage cleanup (unregistering Service Worker)...');
    console.log('⚠️ Next reload will have NO Service Worker until it reinstalls');

    try {
        const { storageUtils } = await import('./utils/storage.js');
        const result = await storageUtils.clearAllStorage(true);

        if (result.success) {
            console.log('✅ All storage cleared and Service Worker unregistered!');
            console.log('🔄 Reloading page in 2 seconds for fresh start...');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            console.warn('⚠️ Some storage types failed to clear:', result.results);
            console.log('🔄 Reloading page anyway in 2 seconds...');
            setTimeout(() => window.location.reload(), 2000);
        }

        return result;
    } catch (error) {
        console.error('❌ Failed to clear storage:', error);
        console.log('💡 Try using browser DevTools: Application → Clear storage');
        return { success: false, error: error.message };
    }
};

/**
 * Get storage and worker stats for debugging
 */
window.getStorageStats = async function() {
    try {
        const { storageUtils } = await import('./utils/storage.js');

        const [quota, size, workerStats] = await Promise.all([
            storageUtils.estimateQuota(),
            storageUtils.getStorageSizeFormatted(),
            Promise.resolve(storageUtils.getWorkerStats())
        ]);

        const stats = {
            storage: {
                used: size,
                quota: `${(quota.quota / 1024 / 1024).toFixed(0)} MB`,
                percentUsed: `${quota.percentUsed}%`
            },
            worker: workerStats,
            serviceWorker: {
                registered: !!window.swRegistration,
                active: isServiceWorkerActive(),
                version: window.appUpdateState.currentVersion
            }
        };

        console.table(stats.storage);
        console.table(stats.worker);
        console.table(stats.serviceWorker);

        return stats;
    } catch (error) {
        console.error('Failed to get storage stats:', error);
        return { error: error.message };
    }
};

/**
 * PWA Installation Support
 * Captures the beforeinstallprompt event for Android/Chrome users
 */
window.deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default install prompt
    e.preventDefault();
    // Store the event for later use
    window.deferredInstallPrompt = e;
    console.log('📱 PWA install prompt captured - Install button available in Settings → About');
});

/**
 * Trigger PWA installation
 * Called from the Install button in Settings
 */
window.installPWA = async function() {
    if (!window.deferredInstallPrompt) {
        console.log('⚠️ Install prompt not available');
        return;
    }

    // Show the install prompt
    window.deferredInstallPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await window.deferredInstallPrompt.userChoice;
    console.log(`📱 User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

    // Clear the deferred prompt
    window.deferredInstallPrompt = null;
};

// Track successful installation
window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA installed successfully!');
    window.deferredInstallPrompt = null;
});
