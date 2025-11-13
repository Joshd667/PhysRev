// js/core/app.js
// Main app factory that combines all features

import { createState } from './state.js';
import { setupWatchers } from './watchers.js';

// Feature modules
import { analyticCalculationMethods } from '../features/analytics/calculations.js';
import { analyticChartMethods } from '../features/analytics/charts.js';
import { analyticInsightMethods } from '../features/analytics/insights.js';
import { revisionMethods } from '../features/revision/index.js';
import { confidenceRatingMethods } from '../features/confidence/rating.js';
import { settingsMethods } from '../features/settings/index.js';
import { userNotesMethods } from '../features/notes/index.js';
import { flashcardMethods } from '../features/flashcards/index.js';
import { mindmapMethods } from '../features/mindmaps/index.js';
import { tagManagementMethods } from '../features/tags/index.js';
import { viewManagementMethods } from '../features/views/index.js';

// Existing module imports
import { searchMethods } from '../features/search/index.js';
import { navigationMethods } from '../features/navigation/index.js';
import { statisticsMethods } from '../utils/statistics.js';
import { uiHelperMethods } from '../utils/ui.js';
import { dataManagementMethods, enhancedDataManagement } from '../features/auth/data-management.js';
import { dateUtils } from '../utils/date.js';
import { revisionAreaColorMethods } from '../utils/revision-colors.js';
import { buildTopicLookup } from '../utils/topic-lookup.js';

// Auth methods loaded from features/auth
let authMethodsLoaded = false;
let authLoadingPromise = null;

// ⚡ PERFORMANCE: Store large read-only data OUTSIDE Alpine's reactive system
// This saves 300-400MB by preventing Alpine from wrapping these in Proxies
let staticSpecificationData = null;
let staticPaperModeGroups = null;
let staticSpecModeGroups = null;
let staticTopicLookup = null;

export function createApp(specificationData, paperModeGroups, specModeGroups, Alpine) {
    // Store large data in module-level variables (non-reactive)
    staticSpecificationData = specificationData;
    staticPaperModeGroups = paperModeGroups;
    staticSpecModeGroups = specModeGroups;
    staticTopicLookup = buildTopicLookup(specificationData);
    return () => {
        // Create base state (without large data objects)
        const state = createState();

        // Extract getters from state to preserve them
        const { currentGroups, currentSection, availablePapers, bannerTitle, bannerIcon, ...stateProps } = state;

        return {
            ...stateProps,

            // ⚡ PERFORMANCE: Getter methods for non-reactive static data
            get specificationData() {
                return staticSpecificationData;
            },
            get paperModeGroups() {
                return staticPaperModeGroups;
            },
            get specModeGroups() {
                return staticSpecModeGroups;
            },
            get topicLookup() {
                return staticTopicLookup;
            },

            // Re-define computed properties to preserve reactivity
            get currentGroups() {
                return this.viewMode === 'spec' ? staticSpecModeGroups["All Topics"] : staticPaperModeGroups[this.selectedPaper] || [];
            },
            get currentSection() {
                return staticSpecificationData[this.activeSection];
            },
            get availablePapers() {
                return this.viewMode === 'paper' ? ['Paper 1', 'Paper 2'] : ['All Topics'];
            },
            get bannerTitle() {
                if (this.showingAnalytics) {
                    return 'Learning Analytics Dashboard';
                } else if (this.showingRevision) {
                    return 'Revision: ' + this.currentRevisionSectionTitle;
                } else if (this.viewType === 'notes') {
                    return 'Notes';
                } else if (this.viewType === 'flashcards' && this.showTestArea) {
                    return 'Test Area';
                } else if (this.viewType === 'flashcards') {
                    return 'Flashcards';
                } else if (this.viewType === 'mindmaps') {
                    return 'Mindmaps';
                } else if (this.showingMainMenu) {
                    if (this.viewMode === 'spec') {
                        return 'Physics Specification';
                    } else {
                        return this.selectedPaper;
                    }
                } else if (this.showSectionCards()) {
                    return this.lastExpandedGroup;
                } else if (this.showingSpecificSection && this.currentSection) {
                    return this.currentSection.title;
                } else {
                    return 'Physics Audit';
                }
            },
            get bannerIcon() {
                if (this.showingAnalytics) {
                    return 'bar-chart-3';
                } else if (this.showingRevision) {
                    return 'book-open';
                } else if (this.viewType === 'notes') {
                    return 'file-text';
                } else if (this.viewType === 'flashcards' && this.showTestArea) {
                    return 'clipboard-check';
                } else if (this.viewType === 'flashcards') {
                    return 'layers';
                } else if (this.viewType === 'mindmaps') {
                    return 'network';
                } else if (this.showingMainMenu) {
                    return this.viewMode === 'spec' ? 'book-open' : 'files';
                } else if (this.showSectionCards()) {
                    const group = this.currentGroups.find(item => item.type === 'group' && item.title === this.lastExpandedGroup);
                    return group?.icon || 'folder';
                } else if (this.showingSpecificSection && this.currentSection) {
                    return this.currentSection.icon;
                } else {
                    return 'book-open';
                }
            },

            // --- INITIALIZATION ---
            async init() {
                window.physicsAuditApp = this; // For debugging

                // Lazy load auth module only when needed
                await this.loadAuthModule();
                this.checkExistingAuth();

                // Load user preferences (includes dark mode, view mode, selected paper)
                this.loadPreferences();

                // Load flashcard test results history
                this.loadTestResultsHistory();

                // Load saved test sets
                this.loadTestSets();

                this.sidebarVisible = true;
                window.addEventListener('resize', () => { if (window.innerWidth >= 768) this.sidebarVisible = true; });

                // Set up watchers
                setupWatchers(this);
            },

            // --- LAZY LOADING AUTH MODULE ---
            async loadAuthModule() {
                // If already loaded, return immediately
                if (authMethodsLoaded) {
                    return;
                }

                // If currently loading, wait for existing promise
                if (authLoadingPromise) {
                    return authLoadingPromise;
                }

                // Start loading
                authLoadingPromise = (async () => {
                    const authModule = await import('../features/auth/index.js');
                    const authMethods = await authModule.loadAuthMethods();

                    // Dynamically add auth methods to this instance
                    Object.assign(this, authMethods);
                    authMethodsLoaded = true;
                })();

                await authLoadingPromise;
                authLoadingPromise = null;
            },

            // --- DATA MANAGEMENT OVERRIDE METHODS ---
            saveData() {
                enhancedDataManagement.saveData.call(this);
            },

            async syncToMoodleBackend(data) {
                // Placeholder for backend sync
                try {
                    console.log('Syncing data to backend for student:', this.user.moodleId);
                } catch (error) {
                    console.warn('Failed to sync to backend:', error);
                }
            },

            loadSavedData() {
                enhancedDataManagement.loadSavedData.call(this);
            },

            clearAllData() {
                enhancedDataManagement.clearAllData.call(this);
            },
            
            exportDataBackup() {
                enhancedDataManagement.exportDataBackup.call(this);
            },

            importDataBackup(event) {
                enhancedDataManagement.importDataBackup.call(this, event);
            },

            // --- NEW SEPARATED STORAGE METHODS ---
            saveNotes() {
                enhancedDataManagement.saveNotes.call(this);
            },

            saveFlashcardDecks() {
                enhancedDataManagement.saveFlashcardDecks.call(this);
            },

            saveMindmaps() {
                enhancedDataManagement.saveMindmaps.call(this);
            },

            saveConfidenceLevels() {
                enhancedDataManagement.saveConfidenceLevels.call(this);
            },

            saveAnalyticsHistory() {
                enhancedDataManagement.saveAnalyticsHistory.call(this);
            },

            // --- STORAGE HELPER METHODS ---
            getStoragePrefix() {
                return enhancedDataManagement.getStoragePrefix.call(this);
            },

            saveDataType(type, data) {
                return enhancedDataManagement.saveDataType.call(this, type, data);
            },

            loadDataType(type, defaultValue) {
                return enhancedDataManagement.loadDataType.call(this, type, defaultValue);
            },

            migrateOldData() {
                return enhancedDataManagement.migrateOldData.call(this);
            },

            validateBackupData(data) {
                return enhancedDataManagement.validateBackupData.call(this, data);
            },

            // --- MODULARIZED METHODS ---
            ...searchMethods,
            ...navigationMethods,
            ...statisticsMethods,
            ...uiHelperMethods,
            ...dataManagementMethods,
            ...dateUtils,
            ...revisionAreaColorMethods,

            // Feature methods
            ...analyticCalculationMethods,
            ...analyticChartMethods,
            ...analyticInsightMethods,
            ...revisionMethods,
            ...confidenceRatingMethods,
            ...settingsMethods,
            ...userNotesMethods,
            ...flashcardMethods,
            ...mindmapMethods,
            ...tagManagementMethods,
            ...viewManagementMethods,

            /**
             * NEW: Renders HTML content and processes any math equations using KaTeX.
             * @param {string} htmlContent - The HTML string to render.
             * @returns {string} The processed HTML with rendered math.
             */
            renderContentWithMath(htmlContent) {
                if (!htmlContent) return '';
                const div = document.createElement('div');
                div.innerHTML = htmlContent;
                if (window.renderMathInElement) {
                    window.renderMathInElement(div, {
                        delimiters: [
                            {left: "$$", right: "$$", display: true},
                            {left: "\\(", right: "\\)", display: false},
                            {left: "\\[", right: "\\]", display: true}
                        ],
                        throwOnError: false
                    });
                }
                return div.innerHTML;
            }
        };
    };
}
