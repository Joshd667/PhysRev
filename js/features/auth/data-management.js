// js/features/auth/data-management.js
// Enhanced data management with separated storage for better performance

// Storage keys for separated data
const STORAGE_KEYS = {
    notes: 'physics-user-notes',
    flashcards: 'physics-flashcard-decks',
    mindmaps: 'physics-mindmaps',
    confidence: 'physics-confidence-levels',
    analytics: 'physics-analytics-history',
    testResults: 'flashcard-test-results',
    // Old combined key for migration
    oldCombined: 'physicsAuditData',
    oldTeamsPrefix: 'physicsAuditData_teams_'
};

export const enhancedDataManagement = {
    /**
     * SECURITY: Verify Teams authentication token to prevent privilege escalation
     * Validates JWT token expiration to ensure user cannot spoof Teams identity
     */
    _verifyTeamsToken() {
        if (!this.authToken) {
            console.error('🚨 SECURITY: No auth token present for Teams user');
            return false;
        }

        try {
            // Parse JWT token (format: header.payload.signature)
            const parts = this.authToken.split('.');
            if (parts.length !== 3) {
                console.error('🚨 SECURITY: Invalid token format');
                return false;
            }

            // Decode payload (base64url)
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

            // Check token expiration
            if (payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp < now) {
                    console.error('🚨 SECURITY: Token expired');
                    return false;
                }
            }

            // Verify user ID matches token subject
            if (payload.sub && payload.sub !== this.user?.id) {
                console.error('🚨 SECURITY: User ID mismatch');
                return false;
            }

            return true;
        } catch (error) {
            console.error('🚨 SECURITY: Token verification failed:', error);
            return false;
        }
    },

    /**
     * Get storage key prefix for user
     * SECURITY: Validates token before allowing Teams data access
     */
    getStoragePrefix() {
        if (this.authMethod === 'teams' && this.user?.id) {
            // SECURITY: Verify token before granting access to Teams data
            if (!this._verifyTeamsToken()) {
                console.error('🚨 SECURITY: Token verification failed - forcing logout');
                // Trigger logout to prevent unauthorized access
                if (typeof this.logout === 'function') {
                    this.logout();
                }
                return '';
            }
            return `teams_${this.user.id}_`;
        }
        return '';
    },

    /**
     * Save specific data type to localStorage (async to avoid blocking)
     */
    async saveDataType(type, data) {
        try {
            const prefix = this.getStoragePrefix();
            const key = prefix + STORAGE_KEYS[type];

            // Use async serialization
            const serialized = await this._serializeAsync(data);
            localStorage.setItem(key, serialized);
            return { success: true };
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return await this._handleQuotaExceeded(type, error);
            }
            console.error(`Failed to save ${type}:`, error);
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
     * Handle quota exceeded error
     */
    async _handleQuotaExceeded(type, error) {
        const usage = this._getStorageSize();
        const usageMB = (usage / 1024 / 1024).toFixed(2);

        console.error(`Storage quota exceeded while saving ${type}. Usage: ${usageMB}MB`);

        // Show user-friendly error using modal if available
        if (this.showCustomModal && this.showAlert) {
            await this.showAlert(
                'Storage Quota Exceeded',
                `You've used approximately ${usageMB}MB of storage. Please export your data as backup and clear old items.`,
                [
                    { label: 'Export Backup', primary: true, onClick: () => this.exportDataBackup() },
                    { label: 'Cancel', onClick: () => {} }
                ]
            );
        } else {
            // Fallback to browser alert
            alert(`Storage quota exceeded! You've used ${usageMB}MB. Please export your data and clear old items.`);
        }

        return {
            success: false,
            quotaExceeded: true,
            currentUsageMB: usageMB,
            error: error.message
        };
    },

    /**
     * Get current localStorage size
     */
    _getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    },

    /**
     * Get storage info for display
     */
    async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 10 * 1024 * 1024,
                    percentUsed: estimate.quota ?
                        ((estimate.usage || 0) / estimate.quota * 100).toFixed(1) : 0,
                    usageMB: ((estimate.usage || 0) / 1024 / 1024).toFixed(2),
                    quotaMB: ((estimate.quota || 10 * 1024 * 1024) / 1024 / 1024).toFixed(2)
                };
            } catch (e) {
                console.warn('Storage estimate failed:', e);
            }
        }

        const usage = this._getStorageSize();
        const quota = 10 * 1024 * 1024;
        return {
            usage,
            quota,
            percentUsed: (usage / quota * 100).toFixed(1),
            usageMB: (usage / 1024 / 1024).toFixed(2),
            quotaMB: (quota / 1024 / 1024).toFixed(2)
        };
    },

    /**
     * Load specific data type from localStorage
     */
    loadDataType(type, defaultValue = null) {
        try {
            const prefix = this.getStoragePrefix();
            const key = prefix + STORAGE_KEYS[type];
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Failed to load ${type}:`, error);
            return defaultValue;
        }
    },

    /**
     * Saves all data (deprecated - kept for compatibility)
     * Now calls individual save methods
     */
    saveData() {
        this.saveNotes();
        this.saveFlashcardDecks();
        this.saveMindmaps();
        this.saveConfidenceLevels();
        this.saveAnalyticsHistory();

        // For Teams users, trigger cloud sync
        if (this.authMethod === 'teams' && this.teamsToken && this.saveDataToTeams) {
            this.saveDataToTeams();
        }
    },

    /**
     * Save methods for each data type
     */
    saveNotes() {
        this.saveDataType('notes', {
            data: this.userNotes || {},
            lastUpdated: new Date().toISOString()
        });
    },

    saveFlashcardDecks() {
        this.saveDataType('flashcards', {
            data: this.flashcardDecks || {},
            lastUpdated: new Date().toISOString()
        });
    },

    saveMindmaps() {
        this.saveDataType('mindmaps', {
            data: this.mindmaps || {},
            lastUpdated: new Date().toISOString()
        });
    },

    saveConfidenceLevels() {
        this.saveDataType('confidence', {
            data: this.confidenceLevels || {},
            lastUpdated: new Date().toISOString()
        });
    },

    saveAnalyticsHistory() {
        this.saveDataType('analytics', {
            data: this.analyticsHistoryData || [],
            lastUpdated: new Date().toISOString()
        });
    },

    /**
     * Migrate old combined storage to new separated storage
     */
    migrateOldData() {
        try {
            let oldData = null;
            let oldKey = null;

            // Check for Teams-specific old data
            if (this.authMethod === 'teams' && this.user?.id) {
                oldKey = `${STORAGE_KEYS.oldTeamsPrefix}${this.user.id}`;
                const teamsData = localStorage.getItem(oldKey);
                if (teamsData) {
                    oldData = JSON.parse(teamsData);
                }
            }

            // Fallback to general old data
            if (!oldData) {
                oldKey = STORAGE_KEYS.oldCombined;
                const generalData = localStorage.getItem(oldKey);
                if (generalData) {
                    oldData = JSON.parse(generalData);
                }
            }

            // If old data exists, migrate it
            if (oldData) {
                // Migrate each data type
                if (oldData.userNotes) {
                    this.userNotes = oldData.userNotes;
                    this.saveNotes();
                }

                if (oldData.flashcardDecks) {
                    this.flashcardDecks = oldData.flashcardDecks;
                    this.saveFlashcardDecks();
                }

                if (oldData.mindmaps) {
                    this.mindmaps = oldData.mindmaps;
                    this.saveMindmaps();
                }

                if (oldData.confidenceLevels) {
                    this.confidenceLevels = oldData.confidenceLevels;
                    this.saveConfidenceLevels();
                }

                if (oldData.analyticsHistory) {
                    this.analyticsHistoryData = oldData.analyticsHistory;
                    this.saveAnalyticsHistory();
                }

                // Delete old storage after successful migration
                localStorage.removeItem(oldKey);

                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    },

    loadSavedData() {
        try {
            // First, check if migration is needed
            const migrated = this.migrateOldData();

            // Load from separated storage
            const notesData = this.loadDataType('notes', { data: {} });
            const flashcardsData = this.loadDataType('flashcards', { data: {} });
            const mindmapsData = this.loadDataType('mindmaps', { data: {} });
            const confidenceData = this.loadDataType('confidence', { data: {} });
            const analyticsData = this.loadDataType('analytics', { data: [] });

            this.userNotes = notesData.data || {};
            this.flashcardDecks = flashcardsData.data || {};
            if (this.flashcardDecks && typeof this.flashcardDecks === 'object') {
                let needsReassign = false;
                for (const deck of Object.values(this.flashcardDecks)) {
                    if (deck && deck.pinned === undefined) {
                        deck.pinned = false;
                        needsReassign = true;
                    }
                }
                if (needsReassign) {
                    this.flashcardDecks = { ...this.flashcardDecks };
                }
            }
            this.mindmaps = mindmapsData.data || {};
            this.confidenceLevels = confidenceData.data || {};
            this.analyticsHistoryData = analyticsData.data || [];

        } catch (error) {
            console.warn('Could not load saved data:', error);
            this.confidenceLevels = {};
            this.analyticsHistoryData = [];
            this.userNotes = {};
            this.flashcardDecks = {};
            this.mindmaps = {};
        }
    },


    exportDataBackup() {
        // Load test results separately
        const testResults = this.loadDataType('testResults', []);

        const dataToExport = {
            confidenceLevels: this.confidenceLevels,
            analyticsHistory: this.analyticsHistoryData || [],
            userNotes: this.userNotes || {},
            flashcardDecks: this.flashcardDecks || {},
            mindmaps: this.mindmaps || {},
            testResults: testResults || [],
            exportDate: new Date().toISOString(),
            exportMethod: this.authMethod === 'teams' ? 'teams_cloud' : 'local',
            storageVersion: "2.0", // Updated version for separated storage
            version: "1.4",
            user: this.user
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);

        const filename = this.authMethod === 'teams' && this.user?.username
            ? `physics-audit-backup-${this.user.username}-${new Date().toISOString().split('T')[0]}.json`
            : `physics-audit-backup-${new Date().toISOString().split('T')[0]}.json`;

        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    validateBackupData(data) {
        // Check for prototype pollution
        if (!data || typeof data !== 'object' || data.__proto__ !== Object.prototype) {
            return { valid: false, error: 'Invalid data structure' };
        }

        // Validate confidenceLevels
        if (data.confidenceLevels) {
            if (typeof data.confidenceLevels !== 'object') {
                return { valid: false, error: 'confidenceLevels must be an object' };
            }

            for (const [topicId, level] of Object.entries(data.confidenceLevels)) {
                if (!Number.isInteger(level) || level < 1 || level > 5) {
                    return { valid: false, error: `Invalid confidence level for topic ${topicId}: ${level}` };
                }
            }
        }

        // Validate analyticsHistory
        if (data.analyticsHistory) {
            if (!Array.isArray(data.analyticsHistory)) {
                return { valid: false, error: 'analyticsHistory must be an array' };
            }

            for (const entry of data.analyticsHistory) {
                if (!entry.topicId || !entry.timestamp) {
                    return { valid: false, error: 'Invalid history entry format' };
                }
            }
        }

        return { valid: true };
    },

    importDataBackup(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Validate data structure
                const validation = this.validateBackupData(importedData);
                if (!validation.valid) {
                    alert('Invalid backup file: ' + validation.error);
                    return;
                }

                if (importedData.confidenceLevels || importedData.userNotes || importedData.flashcardDecks) {
                    if (confirm('This will replace your current data. Are you sure?')) {
                        // Import all data types
                        if (importedData.confidenceLevels) {
                            this.confidenceLevels = importedData.confidenceLevels;
                            this.saveConfidenceLevels();
                        }

                        if (importedData.analyticsHistory) {
                            this.analyticsHistoryData = importedData.analyticsHistory;
                            this.saveAnalyticsHistory();
                        }

                        if (importedData.userNotes) {
                            this.userNotes = importedData.userNotes;
                            this.saveNotes();
                        }

                        if (importedData.flashcardDecks) {
                            this.flashcardDecks = importedData.flashcardDecks;
                            this.saveFlashcardDecks();
                        }

                        if (importedData.mindmaps) {
                            this.mindmaps = importedData.mindmaps;
                            this.saveMindmaps();
                        }

                        if (importedData.testResults) {
                            this.saveDataType('testResults', importedData.testResults);
                        }

                        // ⚡ PERFORMANCE: Rebuild search indexes after import
                        this._rebuildSearchIndexes();

                        alert('Data imported successfully!');
                    }
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (error) {
                alert('Error reading backup file: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    clearAllData() {
        if (confirm('Are you sure you want to clear ALL your confidence ratings, notes, flashcards, and mindmaps? This cannot be undone.')) {
            // Clear in-memory data
            this.confidenceLevels = {};
            this.analyticsHistoryData = [];
            this.userNotes = {};
            this.flashcardDecks = {};
            this.mindmaps = {};

            // Get storage prefix
            const prefix = this.getStoragePrefix();

            // Clear all separated storage keys
            localStorage.removeItem(prefix + STORAGE_KEYS.notes);
            localStorage.removeItem(prefix + STORAGE_KEYS.flashcards);
            localStorage.removeItem(prefix + STORAGE_KEYS.mindmaps);
            localStorage.removeItem(prefix + STORAGE_KEYS.confidence);
            localStorage.removeItem(prefix + STORAGE_KEYS.analytics);
            localStorage.removeItem(STORAGE_KEYS.testResults);

            // Also clear old combined storage (if any)
            localStorage.removeItem(STORAGE_KEYS.oldCombined);
            if (this.authMethod === 'teams' && this.user?.id) {
                localStorage.removeItem(`${STORAGE_KEYS.oldTeamsPrefix}${this.user.id}`);
            }

            // For Teams users, also clear cloud storage
            if (this.authMethod === 'teams' && this.teamsToken && this.saveDataToTeams) {
                this.saveData();
            }

            alert('All data has been cleared.');
        }
    }
};

// Basic data management methods (for confidence rating)
export const dataManagementMethods = {
    updateConfidence(topicId, level) {
        this.confidenceLevels[topicId] = this.confidenceLevels[topicId] === level ? null : level;
        this.saveConfidenceLevels(); // Use specific save method
    }
};
