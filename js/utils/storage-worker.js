// js/utils/storage-worker.js
// Web Worker for offloading heavy JSON serialization from main thread

self.addEventListener('message', (e) => {
    const { action, key, data, id } = e.data;

    try {
        if (action === 'serialize') {
            // Serialize data to JSON string
            const serialized = JSON.stringify(data);
            self.postMessage({
                success: true,
                key,
                serialized,
                id,
                size: new Blob([serialized]).size
            });
        } else if (action === 'deserialize') {
            // Parse JSON string to object
            const parsed = JSON.parse(data);
            self.postMessage({
                success: true,
                key,
                parsed,
                id
            });
        } else {
            self.postMessage({
                success: false,
                error: 'Unknown action: ' + action,
                id
            });
        }
    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message,
            key,
            id
        });
    }
});
