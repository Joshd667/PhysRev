// js/utils/indexeddb.js
// IndexedDB wrapper providing the same API as localStorage utilities
// Provides much larger storage capacity and better performance for large datasets

const DB_NAME = 'PhysicsAuditDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyValueStore'; // Simple key-value store

let dbInstance = null;
let dbInitPromise = null;

/**
 * Initialize IndexedDB database
 * Creates a simple key-value store for all data
 */
function initDB() {
    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = new Promise((resolve, reject) => {
        // Check for IndexedDB support
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB not supported'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB open error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;

            // Handle unexpected close
            dbInstance.onclose = () => {
                console.warn('IndexedDB connection closed unexpectedly');
                dbInstance = null;
                dbInitPromise = null;
            };

            // Handle version change (when another tab upgrades)
            dbInstance.onversionchange = () => {
                dbInstance.close();
                dbInstance = null;
                dbInitPromise = null;
                console.warn('IndexedDB version changed, connection closed');
            };

            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create simple key-value object store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });

                // Create index for timestamp (useful for cleanup operations)
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });

                console.log('✅ IndexedDB object store created');
            }
        };

        request.onblocked = () => {
            console.warn('IndexedDB upgrade blocked. Please close other tabs.');
            reject(new Error('Database upgrade blocked'));
        };
    });

    return dbInitPromise;
}

/**
 * Get database instance (ensures DB is initialized)
 */
async function getDB() {
    if (dbInstance) {
        return dbInstance;
    }
    return await initDB();
}

/**
 * Perform a transaction on the object store
 */
async function performTransaction(mode, operation) {
    try {
        const db = await getDB();
        const transaction = db.transaction([STORE_NAME], mode);
        const store = transaction.objectStore(STORE_NAME);

        return await operation(store, transaction);
    } catch (error) {
        console.error('IndexedDB transaction error:', error);
        throw error;
    }
}

/**
 * Set a value in IndexedDB
 */
export async function idbSet(key, value) {
    return performTransaction('readwrite', (store) => {
        return new Promise((resolve, reject) => {
            const data = {
                key: key,
                value: value,
                timestamp: Date.now()
            };

            const request = store.put(data);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * ✅ PERFORMANCE FIX: Set multiple values in a single IndexedDB transaction
 * This prevents main thread blocking from multiple separate transactions
 * @param {Array<{key: string, value: any}>} items - Array of key-value pairs to store
 * @returns {Promise<boolean>} - True if all items saved successfully
 */
export async function idbSetBatch(items) {
    if (!items || items.length === 0) {
        return true;
    }

    return performTransaction('readwrite', (store, transaction) => {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const requests = [];

            // Queue all puts in the same transaction
            for (const item of items) {
                const data = {
                    key: item.key,
                    value: item.value,
                    timestamp
                };

                const request = store.put(data);
                requests.push(new Promise((res, rej) => {
                    request.onsuccess = () => res(true);
                    request.onerror = () => rej(request.error);
                }));
            }

            // Wait for all puts to complete
            Promise.all(requests)
                .then(() => resolve(true))
                .catch(reject);

            // Also listen to transaction complete
            transaction.oncomplete = () => {
                if (requests.length === 0) resolve(true);
            };
            transaction.onerror = () => reject(transaction.error);
        });
    });
}

/**
 * Get a value from IndexedDB
 */
export async function idbGet(key) {
    return performTransaction('readonly', (store) => {
        return new Promise((resolve, reject) => {
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Remove a value from IndexedDB
 */
export async function idbRemove(key) {
    return performTransaction('readwrite', (store) => {
        return new Promise((resolve, reject) => {
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Clear all values from IndexedDB
 */
export async function idbClear() {
    return performTransaction('readwrite', (store) => {
        return new Promise((resolve, reject) => {
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Get all keys in IndexedDB
 */
export async function idbGetAllKeys() {
    return performTransaction('readonly', (store) => {
        return new Promise((resolve, reject) => {
            const request = store.getAllKeys();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Get all entries in IndexedDB
 */
export async function idbGetAll() {
    return performTransaction('readonly', (store) => {
        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Calculate storage usage (estimate)
 */
export async function idbGetSize() {
    try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return estimate.usage || 0;
        }

        // Fallback: estimate by getting all data
        const allData = await idbGetAll();
        let size = 0;
        for (const item of allData) {
            size += JSON.stringify(item).length;
        }
        return size;
    } catch (error) {
        console.error('Error estimating IndexedDB size:', error);
        return 0;
    }
}

/**
 * Get storage quota estimate
 */
export async function idbEstimateQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0,
                percentUsed: estimate.quota ?
                    ((estimate.usage || 0) / estimate.quota * 100).toFixed(1) : 0
            };
        } catch (e) {
            console.warn('Storage estimate failed:', e);
        }
    }

    // Fallback
    const usage = await idbGetSize();
    const estimatedQuota = 50 * 1024 * 1024; // Assume 50MB minimum
    return {
        usage,
        quota: estimatedQuota,
        percentUsed: (usage / estimatedQuota * 100).toFixed(1)
    };
}

/**
 * Migrate data from localStorage to IndexedDB
 * This should be called once on first load after migration
 */
export async function migrateFromLocalStorage() {
    try {
        console.log('🔄 Starting localStorage → IndexedDB migration...');

        const db = await getDB();
        let migratedCount = 0;
        let skippedCount = 0;

        // Get all localStorage keys
        const keys = Object.keys(localStorage);

        if (keys.length === 0) {
            console.log('✅ No localStorage data to migrate');
            return { success: true, migrated: 0, skipped: 0 };
        }

        // Migrate each key
        for (const key of keys) {
            try {
                const value = localStorage.getItem(key);

                // Skip if value is null or empty
                if (!value) {
                    skippedCount++;
                    continue;
                }

                // Try to parse as JSON, store as-is if not JSON
                let parsedValue;
                try {
                    parsedValue = JSON.parse(value);
                } catch {
                    parsedValue = value; // Store as string if not JSON
                }

                // Store in IndexedDB
                await idbSet(key, parsedValue);
                migratedCount++;

            } catch (error) {
                console.error(`Failed to migrate key "${key}":`, error);
                skippedCount++;
            }
        }

        console.log(`✅ Migration complete: ${migratedCount} items migrated, ${skippedCount} skipped`);

        // Mark migration as complete
        await idbSet('_migration_complete', {
            completed: true,
            timestamp: Date.now(),
            migratedCount,
            skippedCount
        });

        return {
            success: true,
            migrated: migratedCount,
            skipped: skippedCount
        };

    } catch (error) {
        console.error('Migration error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if migration has been completed
 */
export async function isMigrationComplete() {
    try {
        const migrationData = await idbGet('_migration_complete');
        return migrationData && migrationData.completed === true;
    } catch (error) {
        return false;
    }
}

/**
 * Initialize IndexedDB and perform migration if needed
 * Call this on app startup
 */
export async function initIndexedDB() {
    try {
        await initDB();

        // Check if migration needed
        const migrationComplete = await isMigrationComplete();

        if (!migrationComplete && localStorage.length > 0) {
            console.log('📦 First run detected, migrating localStorage to IndexedDB...');
            const result = await migrateFromLocalStorage();

            if (result.success) {
                console.log('✅ IndexedDB migration successful');
            } else {
                console.warn('⚠️ IndexedDB migration had issues:', result.error);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('IndexedDB initialization failed:', error);
        return { success: false, error: error.message };
    }
}

// Auto-initialize on import (can be disabled if manual init preferred)
// initIndexedDB().catch(console.error);
