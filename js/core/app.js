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

// Auth methods loaded from features/auth
let authMethodsLoaded = false;

export function createApp(specificationData, paperModeGroups, specModeGroups, Alpine) {
    return () => {
        // Create base state
        const state = createState(specificationData, paperModeGroups, specModeGroups);

        // Extract getters from state to preserve them
        const { currentGroups, currentSection, availablePapers, bannerTitle, bannerIcon, ...stateProps } = state;

        return {
            ...stateProps,

            // Re-define computed properties to preserve reactivity
            get currentGroups() {
                return this.viewMode === 'spec' ? this.specModeGroups["All Topics"] : this.paperModeGroups[this.selectedPaper] || [];
            },
            get currentSection() {
                return this.specificationData[this.activeSection];
            },
            get availablePapers() {
                return this.viewMode === 'paper' ? ['Paper 1', 'Paper 2'] : ['All Topics'];
            },
            get bannerTitle() {
                if (this.showingAnalytics) {
                    return 'Learning Analytics Dashboard';
                } else if (this.showingRevision) {
                    return 'Revision: ' + this.currentRevisionSectionTitle;
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

                this.sidebarVisible = true;
                window.addEventListener('resize', () => { if (window.innerWidth >= 768) this.sidebarVisible = true; });

                // Set up watchers
                setupWatchers(this);
            },

            // --- LAZY LOADING AUTH MODULE ---
            async loadAuthModule() {
                if (!authMethodsLoaded) {
                    console.log('⚡ Loading auth module...');
                    const authModule = await import('../features/auth/index.js');
                    const authMethods = await authModule.loadAuthMethods();

                    // Dynamically add auth methods to this instance
                    Object.assign(this, authMethods);
                    authMethodsLoaded = true;
                    console.log('✅ Auth module loaded');
                }
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
