// js/utils/storage.js
// localStorage utility functions with async operations and quota handling

// ✅ PERFORMANCE: Web Worker for large JSON serialization (>100KB)
let storageWorker = null;
let workerMessageId = 0;
const workerCallbacks = new Map();

function initWorker() {
    if (!storageWorker && typeof Worker !== 'undefined') {
        try {
            storageWorker = new Worker('/js/utils/storage-worker.js');
            storageWorker.onmessage = (e) => {
                const { id, success, serialized, error } = e.data;
                const callback = workerCallbacks.get(id);
                if (callback) {
                    if (success) {
                        callback.resolve(serialized);
                    } else {
                        callback.reject(new Error(error));
                    }
                    workerCallbacks.delete(id);
                }
            };
            storageWorker.onerror = (e) => {
                console.error('Storage Worker error:', e);
                workerCallbacks.forEach(cb => cb.reject(new Error('Worker error')));
                workerCallbacks.clear();
                storageWorker = null;
            };
        } catch (e) {
            console.warn('Web Worker not available, falling back to main thread');
            storageWorker = null;
        }
    }
    return storageWorker;
}

export const storageUtils = {
    /**
     * Save data asynchronously using Web Worker for large datasets or requestIdleCallback for small ones
     * ✅ PERFORMANCE: Web Worker for >100KB prevents blocking main thread
     * ✅ iOS FIX: Automatic cleanup on quota exceeded
     */
    async save(key, data) {
        try {
            const serialized = await this._serializeAsync(data);
            localStorage.setItem(key, serialized);
            return { success: true };
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return this._handleQuotaExceeded(key, data, error);
            }
            console.error('Storage save error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Serialize data asynchronously using Web Worker (>100KB) or requestIdleCallback (<=100KB)
     */
    async _serializeAsync(data) {
        // Quick size estimate
        const roughSize = JSON.stringify(data).length;
        const sizeKB = roughSize / 1024;

        // Use Web Worker for large datasets (>100KB)
        if (sizeKB > 100 && initWorker()) {
            return new Promise((resolve, reject) => {
                const id = ++workerMessageId;
                workerCallbacks.set(id, { resolve, reject });

                storageWorker.postMessage({
                    action: 'serialize',
                    key: 'temp',
                    data: data,
                    id
                });

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (workerCallbacks.has(id)) {
                        workerCallbacks.delete(id);
                        reject(new Error('Worker timeout'));
                    }
                }, 10000);
            });
        }

        // Small datasets - use requestIdleCallback
        return new Promise((resolve, reject) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    try {
                        const serialized = JSON.stringify(data);
                        resolve(serialized);
                    } catch (e) {
                        reject(e);
                    }
                }, { timeout: 2000 });
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(() => {
                    try {
                        const serialized = JSON.stringify(data);
                        resolve(serialized);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            }
        });
    },

    /**
     * Clean up old analytics data to free storage space (iOS fix)
     */
    async cleanupOldAnalytics() {
        try {
            const analyticsKey = 'physics-analytics-history';
            const analyticsData = localStorage.getItem(analyticsKey);
            if (!analyticsData) return 0;

            const analytics = JSON.parse(analyticsData);
            if (!analytics || !Array.isArray(analytics.data)) return 0;

            // Keep only last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const originalCount = analytics.data.length;

            analytics.data = analytics.data.filter(entry => {
                const timestamp = new Date(entry.timestamp || entry.date).getTime();
                return timestamp > thirtyDaysAgo;
            });

            const cleaned = originalCount - analytics.data.length;
            if (cleaned > 0) {
                localStorage.setItem(analyticsKey, JSON.stringify(analytics));
                console.log(`🧹 Cleaned up ${cleaned} old analytics entries`);
            }

            return cleaned;
        } catch (e) {
            console.warn('Error cleaning analytics:', e);
            return 0;
        }
    },

    /**
     * Handle quota exceeded error with automatic cleanup and user notification
     * ✅ iOS FIX: Automatic cleanup before prompting user
     */
    async _handleQuotaExceeded(key, data, error) {
        const usage = this.getStorageSize();
        const usageMB = (usage / 1024 / 1024).toFixed(2);

        console.warn(`⚠️ Storage quota exceeded. Current usage: ${usageMB}MB`);

        // 1. Attempt automatic cleanup of old analytics data
        const cleaned = await this.cleanupOldAnalytics();

        // 2. Try saving again after cleanup
        if (cleaned > 0) {
            try {
                const serialized = await this._serializeAsync(data);
                localStorage.setItem(key, serialized);
                console.log(`✅ Save succeeded after cleanup (removed ${cleaned} entries)`);
                return { success: true, cleaned };
            } catch (retryError) {
                // Still failed after cleanup
                console.error('Save failed even after cleanup');
            }
        }

        // 3. Return structured error for app to handle
        return {
            success: false,
            quotaExceeded: true,
            currentUsage: usage,
            currentUsageMB: usageMB,
            cleaned,
            error: error.message
        };
    },

    /**
     * Calculate current localStorage size in bytes
     */
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    },

    /**
     * Get storage size in human-readable format
     */
    getStorageSizeFormatted() {
        const bytes = this.getStorageSize();
        const mb = (bytes / 1024 / 1024).toFixed(2);
        const kb = (bytes / 1024).toFixed(2);
        return bytes > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    },

    /**
     * Estimate storage quota (async API)
     */
    async estimateQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 10 * 1024 * 1024,
                    percentUsed: estimate.quota ?
                        ((estimate.usage || 0) / estimate.quota * 100).toFixed(1) : 0
                };
            } catch (e) {
                console.warn('Storage estimate failed:', e);
            }
        }

        // Fallback estimation
        const usage = this.getStorageSize();
        const estimatedQuota = 10 * 1024 * 1024; // Assume 10MB
        return {
            usage,
            quota: estimatedQuota,
            percentUsed: (usage / estimatedQuota * 100).toFixed(1)
        };
    },

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};
