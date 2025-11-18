// js/utils/storage.js
// localStorage utility functions with async operations and quota handling

export const storageUtils = {
    /**
     * Save data asynchronously using requestIdleCallback to avoid blocking main thread
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
     * Serialize data asynchronously using requestIdleCallback
     */
    _serializeAsync(data) {
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
     * Handle quota exceeded error with user notification
     */
    _handleQuotaExceeded(key, data, error) {
        const usage = this.getStorageSize();
        const usageMB = (usage / 1024 / 1024).toFixed(2);

        console.error(`Storage quota exceeded. Current usage: ${usageMB}MB`);

        // Return structured error for app to handle
        return {
            success: false,
            quotaExceeded: true,
            currentUsage: usage,
            currentUsageMB: usageMB,
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
