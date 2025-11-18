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
export function getPerformanceHistory() {
    if (typeof(Storage) !== "undefined") {
        return JSON.parse(localStorage.getItem('perfMetrics') || '[]');
    }
    return [];
}

export function isServiceWorkerActive() {
    return navigator.serviceWorker && navigator.serviceWorker.controller;
}

// Debug function - clear cache manually
window.clearSWCache = function() {
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
            console.log('🗑️ All caches cleared');
            window.location.reload();
        });
    }
};
