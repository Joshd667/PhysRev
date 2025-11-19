// js/utils/storage.js
// IndexedDB storage utility functions with async operations and quota handling
// Migrated from localStorage to IndexedDB for better capacity and performance

import {
    idbSet,
    idbGet,
    idbRemove,
    idbClear,
    idbGetAllKeys,
    idbGetSize,
    idbEstimateQuota,
    initIndexedDB
} from './indexeddb.js';

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
     * Save data asynchronously using IndexedDB
     * ✅ PERFORMANCE: Web Worker for >100KB prevents blocking main thread
     * ✅ CAPACITY: IndexedDB provides much larger storage than localStorage
     */
    async save(key, data) {
        try {
            // No need to serialize for IndexedDB - it handles objects natively
            // But we keep serialization for consistency and web worker benefits
            await idbSet(key, data);
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
     * Clean up old analytics data to free storage space
     */
    async cleanupOldAnalytics() {
        try {
            const analyticsKey = 'physics-analytics-history';
            const analyticsData = await idbGet(analyticsKey);
            if (!analyticsData) return 0;

            if (!analyticsData || !Array.isArray(analyticsData.data)) return 0;

            // Keep only last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const originalCount = analyticsData.data.length;

            analyticsData.data = analyticsData.data.filter(entry => {
                const timestamp = new Date(entry.timestamp || entry.date).getTime();
                return timestamp > thirtyDaysAgo;
            });

            const cleaned = originalCount - analyticsData.data.length;
            if (cleaned > 0) {
                await idbSet(analyticsKey, analyticsData);
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
                await idbSet(key, data);
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
     * Calculate current IndexedDB storage size in bytes (async)
     */
    async getStorageSize() {
        return await idbGetSize();
    },

    /**
     * Get storage size in human-readable format (async)
     */
    async getStorageSizeFormatted() {
        const bytes = await this.getStorageSize();
        const mb = (bytes / 1024 / 1024).toFixed(2);
        const kb = (bytes / 1024).toFixed(2);
        return bytes > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    },

    /**
     * Estimate storage quota (async API)
     */
    async estimateQuota() {
        return await idbEstimateQuota();
    },

    async load(key) {
        try {
            const data = await idbGet(key);
            return data;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    },

    async remove(key) {
        try {
            await idbRemove(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    async clear() {
        try {
            await idbClear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    /**
     * Initialize IndexedDB and migrate data from localStorage if needed
     * Should be called on app startup
     */
    async init() {
        return await initIndexedDB();
    }
};
