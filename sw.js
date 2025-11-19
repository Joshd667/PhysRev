// sw.js - Fixed Service Worker for Physics Audit Tool with Analytics Support
// Place this file in your project root (same folder as index.html)

const CACHE_NAME = 'physics-audit-v2.39'; // 🔥 INCREMENT THIS WHEN YOU UPDATE THE APP
const APP_VERSION = '2.39';

// 🎯 Core resources that should be cached
const CRITICAL_RESOURCES = [
    // Main page
    './',
    './index.html',
    './favicon.ico',

    // Core app files - THESE SHOULD BE CACHE-BUSTED ON UPDATES
    './css/style.css',
    './js/app-loader.js',
    './js/template-loader.js',
    './js/data/revision-mappings.js',
    './js/data/index.js',
    './js/data/unified-csv-loader.js',
    './resources/combined-data.json',

    // Core architecture (NEW - Refactored)
    './js/core/app.js',
    './js/core/state.js',
    './js/core/watchers.js',

    // Feature modules (NEW - Refactored)
    './js/features/analytics/calculations.js',
    './js/features/analytics/charts.js',
    './js/features/analytics/insights.js',
    './js/features/revision/resources.js',
    './js/features/revision/view.js',
    './js/features/revision/index.js',
    './js/features/confidence/rating.js',
    './js/features/search/index.js',
    './js/features/navigation/index.js',
    './js/features/auth/index.js',
    './js/features/auth/guest.js',
    './js/features/auth/teams.js',
    './js/features/auth/data-management.js',

    // Utils
    './js/utils/csv-parser.js',
    './js/utils/csv-converter.js',
    './js/utils/resource-schema.js',
    './js/utils/content-filter.js',
    './js/utils/storage.js',
    './js/utils/ui.js',
    './js/utils/date.js',
    './js/utils/statistics.js',
    './js/utils/topic-lookup.js',


    // HTML Templates - NEW!
    './templates/login-screen.html',
    './templates/search-results.html',
    './templates/analytics-dashboard.html',
    './templates/revision-view.html',
    './templates/main-menu.html',
    './templates/section-cards.html',
    './templates/topic-detail.html',

    // HTML Components
    './templates/sidebar.html',
    './templates/top-bar.html',

    // External resources
    'https://unpkg.com/alpinejs@3.x.x/dist/module.esm.js',
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// 🚀 Install event - aggressive cache refresh
self.addEventListener('install', event => {
    console.log(`🔧 Service Worker ${APP_VERSION} installing...`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching all resources...');
                
                // Fetch all resources (respects HTTP cache)
                // ✅ FIX: Removed per-file logging to reduce console spam during installation
                const cachePromises = CRITICAL_RESOURCES.map(url =>
                    fetch(url) // Use default HTTP caching
                        .then(response => {
                            if (response.ok) {
                                return cache.put(url, response.clone());
                            }
                            throw new Error(`HTTP ${response.status}`);
                        })
                        .then(() => {
                            return { url, success: true };
                        })
                        .catch(error => {
                            console.warn(`⚠️ Failed to cache ${url}:`, error.message);
                            return { url, success: false, error: error.message };
                        })
                );
                
                return Promise.all(cachePromises);
            })
            .then(results => {
                const successful = results.filter(r => r.success).length;
                const failed = results.filter(r => !r.success).length;

                console.log(`✅ Cached ${successful}/${CRITICAL_RESOURCES.length} resources`);
                if (failed > 0) {
                    console.log(`⚠️ Failed to cache ${failed} resources`);
                }

                // Wait for manual activation (via SKIP_WAITING message)
                // Don't auto-activate - let user control updates
                console.log('⏸️ Service Worker installed, waiting for manual activation');
            })
            .catch(error => {
                console.error('❌ Cache installation failed:', error);
            })
    );
});

// 🚀 Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
    console.log(`🚀 Service Worker ${APP_VERSION} activating...`);
    
    event.waitUntil(
        Promise.all([
            // Delete all old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(oldCacheName => {
                            console.log(`🗑️ Deleting old cache: ${oldCacheName}`);
                            return caches.delete(oldCacheName);
                        })
                );
            }),
            // Take control of all clients immediately
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker activated, old caches cleared, control claimed');
            
            // Notify all clients to reload
            return self.clients.matchAll();
        }).then(clients => {
            clients.forEach(client => {
                client.postMessage({ 
                    type: 'SW_UPDATED', 
                    version: APP_VERSION,
                    action: 'reload_recommended'
                });
            });
        })
    );
});

// ⚡ Fetch event - Network-first for JS files, cache-first for others
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle same-origin requests and specific external resources
    if (url.origin === location.origin || isAllowedExternalResource(url)) {
        event.respondWith(handleRequest(request));
    }
});

// 🎯 Smart request handler with network-first for JS files
async function handleRequest(request) {
    const url = new URL(request.url);
    const isJavaScript = url.pathname.endsWith('.js') || url.pathname.includes('/js/');
    const isHTML = request.destination === 'document' || url.pathname.endsWith('.html');
    const isTemplate = url.pathname.includes('/templates/') || url.pathname.includes('/components/');

    try {
        // Cache-first strategy for templates (they're part of the app structure)
        if (isTemplate) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }

            const networkResponse = await fetch(request);

            if (networkResponse.ok) {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, networkResponse.clone());
                } catch (cacheError) {
                    console.warn(`Failed to cache template ${url.pathname}:`, cacheError);
                }
            }

            return networkResponse;
        }

        // Cache-first with background update for JavaScript and HTML files
        // This reduces console spam and improves performance
        if (isJavaScript || isHTML) {
            const cachedResponse = await caches.match(request);

            if (cachedResponse) {
                // Background update: fetch fresh version silently and update cache
                // This happens AFTER returning the cached response (non-blocking)
                fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, networkResponse);
                        });
                    }
                }).catch(() => {
                    // Silently fail background updates
                });

                return cachedResponse;
            }

            // No cache available, fetch from network
            try {
                const networkResponse = await fetch(request);

                if (networkResponse.ok) {
                    try {
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(request, networkResponse.clone());
                    } catch (cacheError) {
                        console.warn(`Failed to cache ${url.pathname}:`, cacheError);
                    }
                }

                return networkResponse;
            } catch (networkError) {
                console.error(`❌ Network failed for ${url.pathname}:`, networkError);
                throw networkError;
            }
        }

        // Cache-first strategy for CSS, images, and other static assets
        else {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }

            const networkResponse = await fetch(request);

            if (networkResponse.status === 200 && url.origin === location.origin) {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, networkResponse.clone());
                } catch (cacheError) {
                    console.warn(`Failed to cache ${url.pathname}:`, cacheError);
                }
            }

            return networkResponse;
        }
        
    } catch (error) {
        console.error(`❌ Fetch failed for ${url.pathname}:`, error);
        
        // Final fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('🔄 Serving cached fallback');
            return cachedResponse;
        }
        
        // For HTML requests, serve the main page as fallback
        if (request.destination === 'document') {
            const fallback = await caches.match('./index.html');
            if (fallback) {
                console.log('🔄 Serving offline fallback');
                return fallback;
            }
        }
        
        throw error;
    }
}

// 🔍 Helper function for allowed external resources
function isAllowedExternalResource(url) {
    const allowedDomains = [
        'unpkg.com',
        'cdn.jsdelivr.net'
    ];
    
    return allowedDomains.some(domain => url.hostname.includes(domain));
}

// 📱 Handle messages from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⚡ Force-activating new service worker');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: APP_VERSION,
            cache: CACHE_NAME,
            resources: CRITICAL_RESOURCES.length,
            strategy: 'cache-first-with-background-update'
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('🗑️ Manual cache clear requested');
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});

console.log(`🔧 Service Worker ${APP_VERSION} loaded with cache-first + background update strategy`);
