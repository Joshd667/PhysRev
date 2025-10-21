// js/features/auth/data-management.js
// Enhanced data management that supports both guest and Teams users

export const enhancedDataManagement = {
    // Enhanced save method that uses Teams storage for Teams users
    saveData() {
        const dataToSave = {
            confidenceLevels: this.confidenceLevels,
            analyticsHistory: this.analyticsHistoryData || [],
            userNotes: this.userNotes || {},
            flashcardDecks: this.flashcardDecks || {},
            mindmaps: this.mindmaps || {},
            lastUpdated: new Date().toISOString(),
            version: "1.4",
            user: this.user
        };

        // Save locally first (always)
        if (this.authMethod === 'teams' && this.user?.id) {
            localStorage.setItem(`physicsAuditData_teams_${this.user.id}`, JSON.stringify(dataToSave));
        } else {
            localStorage.setItem('physicsAuditData', JSON.stringify(dataToSave));
        }

        // For Teams users, also try to save to cloud (auto-save handles this)
        if (this.authMethod === 'teams' && this.teamsToken && this.saveDataToTeams) {
            this.saveDataToTeams();
        }
    },

    loadSavedData() {
        try {
            let savedData = null;

            // For Teams users, try user-specific data first
            if (this.authMethod === 'teams' && this.user?.id) {
                const userSpecificData = localStorage.getItem(`physicsAuditData_teams_${this.user.id}`);
                if (userSpecificData) {
                    savedData = JSON.parse(userSpecificData);
                }
            }

            // Fallback to general data
            if (!savedData) {
                const generalData = localStorage.getItem('physicsAuditData');
                if (generalData) {
                    savedData = JSON.parse(generalData);
                }
            }

            if (savedData) {
                this.confidenceLevels = savedData.confidenceLevels || {};
                this.analyticsHistoryData = savedData.analyticsHistory || [];
                this.userNotes = savedData.userNotes || {};
                this.flashcardDecks = savedData.flashcardDecks || {};
                this.mindmaps = savedData.mindmaps || {};
            }
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
        const dataToExport = {
            confidenceLevels: this.confidenceLevels,
            analyticsHistory: this.analyticsHistoryData || [],
            userNotes: this.userNotes || {},
            flashcardDecks: this.flashcardDecks || {},
            mindmaps: this.mindmaps || {},
            exportDate: new Date().toISOString(),
            exportMethod: this.authMethod === 'teams' ? 'teams_cloud' : 'local',
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

                if (importedData.confidenceLevels) {
                    if (confirm('This will replace your current confidence ratings. Are you sure?')) {
                        this.confidenceLevels = importedData.confidenceLevels;
                        this.analyticsHistoryData = importedData.analyticsHistory || [];
                        this.saveData();
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
        if (confirm('Are you sure you want to clear ALL your confidence ratings, notes, and flashcards? This cannot be undone.')) {
            this.confidenceLevels = {};
            this.analyticsHistoryData = [];
            this.userNotes = {};
            this.flashcardDecks = {};

            // Clear local storage
            localStorage.removeItem('physicsAuditData');
            if (this.authMethod === 'teams' && this.user?.id) {
                localStorage.removeItem(`physicsAuditData_teams_${this.user.id}`);
            }

            // Save empty data (which will also clear cloud storage for Teams users)
            this.saveData();

            alert('All data has been cleared.');
        }
    }
};

// Basic data management methods (for confidence rating)
export const dataManagementMethods = {
    updateConfidence(topicId, level) {
        this.confidenceLevels[topicId] = this.confidenceLevels[topicId] === level ? null : level;
        this.saveData();
    }
};
