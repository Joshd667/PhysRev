// js/sw-registration.js - Service Worker Registration with Manual Update Control

// Global update state - accessible by Alpine.js app
window.appUpdateState = {
    updateAvailable: false,
    newWorker: null,
    currentVersion: null,
    newVersion: null,
    skipWaitingCalled: false  // Track if we explicitly activated an update
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
                // ✅ FIX: Only reload if we explicitly called skipWaiting (real update)
                // Don't reload on automatic SW reinstall (e.g., after clearing cache)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (window.appUpdateState.skipWaitingCalled) {
                        window.location.reload();
                    }
                    // Reset flag after handling
                    window.appUpdateState.skipWaitingCalled = false;
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
        // Set flag so controllerchange knows to reload
        window.appUpdateState.skipWaitingCalled = true;
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
 * ✅ Clear ALL storage properly
 * This clears: IndexedDB, Service Worker caches, localStorage, and Web Workers
 *
 * Usage from browser console:
 *   clearAllAppStorage()
 *
 * This function exists because DevTools "Clear storage" doesn't unregister
 * the Service Worker, which can cause it to reinstall and show console messages.
 */
window.clearAllAppStorage = async function() {
    console.log('🧹 Clearing all storage...');

    try {
        const { storageUtils } = await import('./utils/storage.js');

        // Clear everything including unregistering Service Worker
        const result = await storageUtils.clearAllStorage(true);

        if (result.success) {
            console.log('✅ All storage cleared!');
            console.log('🔄 Reloading in 1 second...');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            console.warn('⚠️ Partial clear:', result.results);
            setTimeout(() => window.location.reload(), 1000);
        }

        return result;
    } catch (error) {
        console.error('❌ Clear failed:', error);
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
