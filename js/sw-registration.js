// js/sw-registration.js - Simple Service Worker Registration with Update Handling

/**
 * Show a nice update notification banner instead of confirm()
 */
function showUpdateNotification(newWorker) {
    // Create update banner
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999; display: flex; align-items: center; justify-content: space-between; animation: slideDown 0.3s ease-out;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <div>
                    <div style="font-weight: 600; font-size: 1rem;">New version available!</div>
                    <div style="font-size: 0.875rem; opacity: 0.9;">Update now to get the latest features and fixes</div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button id="update-now" style="background: white; color: #667eea; padding: 0.5rem 1.5rem; border-radius: 0.5rem; border: none; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                    Update Now
                </button>
                <button id="update-later" style="background: transparent; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: 2px solid white; cursor: pointer; transition: opacity 0.2s;">
                    Later
                </button>
            </div>
        </div>
        <style>
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            #update-now:hover { transform: scale(1.05); }
            #update-later:hover { opacity: 0.8; }
        </style>
    `;

    document.body.appendChild(banner);

    // Update now button
    document.getElementById('update-now').addEventListener('click', () => {
        banner.remove();
        newWorker.postMessage({ type: 'SKIP_WAITING' });
    });

    // Later button
    document.getElementById('update-later').addEventListener('click', () => {
        banner.remove();
        // Show reminder after 30 minutes
        setTimeout(() => {
            if (newWorker.state === 'installed') {
                showUpdateNotification(newWorker);
            }
        }, 30 * 60 * 1000);
    });
}

/**
 * Register service worker with proper update handling
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('✅ Service Worker registered successfully');
                console.log('📍 Scope:', registration.scope);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Service Worker update found');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🎉 New Service Worker installed!');
                            
                            // Auto-activate in development
                            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                                console.log('🛠️ Development mode: Auto-activating');
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                            } else {
                                // Show update notification in production
                                showUpdateNotification(newWorker);
                            }
                        }
                    });
                });
                
                // Handle controller changes
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🚀 Service Worker updated - reloading');
                    window.location.reload();
                });
                
                // Get version info
                if (registration.active) {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = (event) => {
                        console.log(`📋 SW Version: ${event.data.version}, Cache: ${event.data.cache}`);
                    };
                    registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
                }
                
            } catch (error) {
                console.log('❌ Service Worker registration failed:', error);
            }
        });
    } else {
        console.log('❌ Service Worker not supported');
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

console.log('📡 SW Registration module loaded');
