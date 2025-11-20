const BUILD_TIMESTAMP = '20250120-001';
const CACHE_NAME = `physics-audit-v${BUILD_TIMESTAMP}`;
const APP_VERSION = BUILD_TIMESTAMP;

const CRITICAL_RESOURCES = [
    './',
    './index.html',
    './favicon.ico',

    './css/style.css',
    './js/app-loader.js',
    './js/template-loader.js',
    './js/data/index.js',
    './js/data/unified-csv-loader.js',
    './resources/combined-data.json',

    './js/core/app.js',
    './js/core/state.js',
    './js/core/watchers.js',

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

    './js/utils/csv-parser.js',
    './js/utils/csv-converter.js',
    './js/utils/resource-schema.js',
    './js/utils/content-filter.js',
    './js/utils/storage.js',
    './js/utils/ui.js',
    './js/utils/date.js',
    './js/utils/statistics.js',
    './js/utils/topic-lookup.js',

    './templates/search-results.html',
    './templates/analytics-dashboard.html',
    './templates/revision-view.html',
    './templates/main-menu.html',
    './templates/section-cards.html',
    './templates/topic-detail.html',

    './templates/sidebar.html',
    './templates/top-bar.html',

    'https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/module.esm.js',
    'https://unpkg.com/lucide@0.546.0/dist/umd/lucide.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js',
    'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                const cachePromises = CRITICAL_RESOURCES.map(url =>
                    fetch(url)
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
                            return { url, success: false, error: error.message };
                        })
                );

                return Promise.all(cachePromises);
            })
            .then(results => {
                const failed = results.filter(r => !r.success).length;
            })
            .catch(error => {
                console.error('❌ SW: Cache installation failed:', error);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(oldCacheName => {
                            return caches.delete(oldCacheName);
                        })
                );
            }),
            self.clients.claim()
        ]).then(() => {
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

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    if (url.origin === location.origin || isAllowedExternalResource(url)) {
        event.respondWith(handleRequest(request));
    }
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const isJavaScript = url.pathname.endsWith('.js') || url.pathname.includes('/js/');
    const isHTML = request.destination === 'document' || url.pathname.endsWith('.html');
    const isTemplate = url.pathname.includes('/templates/') || url.pathname.includes('/components/');

    try {
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
                    // ✅ IMPROVED: Log cache errors for debugging
                    console.warn('SW: Failed to cache template:', url.pathname, cacheError.message);
                }
            }

            return networkResponse;
        }

        if (isJavaScript || isHTML) {
            const cachedResponse = await caches.match(request);

            if (cachedResponse) {
                fetch(request).then(async networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        const cachedClone = cachedResponse.clone();
                        const networkClone = networkResponse.clone();

                        try {
                            const cachedText = await cachedClone.text();
                            const networkText = await networkClone.text();

                            if (cachedText !== networkText) {
                                const cache = await caches.open(CACHE_NAME);
                                await cache.put(request, networkResponse.clone());

                                const clients = await self.clients.matchAll({ type: 'window' });
                                clients.forEach(client => {
                                    client.postMessage({
                                        type: 'UPDATE_AVAILABLE',
                                        url: url.pathname,
                                        timestamp: Date.now(),
                                        action: 'reload_recommended'
                                    });
                                });
                            }
                        } catch (comparisonError) {
                            // ✅ IMPROVED: Log comparison errors for debugging
                            // Silent failures make debugging difficult
                            if (comparisonError.message.includes('body stream already read')) {
                                // This is expected - stream can only be read once
                                // Silently update cache with new version
                            } else {
                                // Unexpected error - log it
                                console.warn('SW: Cache comparison failed:', comparisonError.message);
                            }

                            // Update cache anyway (better to have new content)
                            try {
                                const cache = await caches.open(CACHE_NAME);
                                await cache.put(request, networkResponse);
                            } catch (cacheError) {
                                // Cache write failed - not critical, continue
                                console.warn('SW: Failed to update cache:', cacheError.message);
                            }
                        }
                    }
                }).catch(() => {});

                return cachedResponse;
            }

            try {
                const networkResponse = await fetch(request);

                if (networkResponse.ok) {
                    try {
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(request, networkResponse.clone());
                    } catch (cacheError) {
                        // ✅ IMPROVED: Log cache errors for debugging
                        console.warn('SW: Failed to cache JS/HTML:', url.pathname, cacheError.message);
                    }
                }

                return networkResponse;
            } catch (networkError) {
                // ✅ IMPROVED: More detailed error logging
                console.error(`❌ Network failed for ${url.pathname}:`, networkError.message);
                throw networkError;
            }
        }

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
                    // ✅ IMPROVED: Log cache errors for debugging
                    console.warn('SW: Failed to cache resource:', url.pathname, cacheError.message);
                }
            }

            return networkResponse;
        }
        
    } catch (error) {
        console.error(`❌ Fetch failed for ${url.pathname}:`, error);
        
        // Final fallback - serve from cache silently
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        if (request.destination === 'document') {
            const fallback = await caches.match('./index.html');
            if (fallback) {
                return fallback;
            }
        }

        throw error;
    }
}

function isAllowedExternalResource(url) {
    const allowedDomains = [
        'unpkg.com',
        'cdn.jsdelivr.net'
    ];

    return allowedDomains.some(domain => url.hostname.includes(domain));
}

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
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
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});
