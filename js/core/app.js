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
import { modalMethods } from '../utils/modals.js';

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
                return this.viewMode === 'paper' ? ['Paper 1', 'Paper 2', 'Paper 3'] : ['All Topics'];
            },
            // Cached breadcrumb getters (reduces 25-35MB initial RAM spike)
            get bannerTitle() {
                if (this._bannerCacheDirty) {
                    this._computeBannerCache();
                }
                return this._cachedBannerTitle;
            },
            get bannerIcon() {
                if (this._bannerCacheDirty) {
                    this._computeBannerCache();
                }
                return this._cachedBannerIcon;
            },

            // Cached progress title getter (prevents string concatenation in reactive context)
            get progressTitle() {
                if (this._progressTitleCacheDirty) {
                    this._computeProgressTitleCache();
                }
                return this._cachedProgressTitle;
            },

            // Compute progress title
            _computeProgressTitleCache() {
                this._cachedProgressTitle = this.viewMode === 'spec' ? 'Overall Progress' : this.selectedPaper + ' Progress';
                this._progressTitleCacheDirty = false;
            },

            // Compute both title and icon together (shared logic)
            _computeBannerCache() {
                if (this.searchVisible) {
                    this._cachedBannerTitle = 'Search';
                    this._cachedBannerIcon = 'search';
                } else if (this.showingAnalytics) {
                    this._cachedBannerTitle = 'Learning Analytics Dashboard';
                    this._cachedBannerIcon = 'bar-chart-3';
                } else if (this.showingRevision) {
                    this._cachedBannerTitle = 'Revision: ' + this.currentRevisionSectionTitle;
                    this._cachedBannerIcon = 'book-open';
                } else if (this.viewType === 'notes') {
                    this._cachedBannerTitle = 'Notes';
                    this._cachedBannerIcon = 'file-text';
                } else if (this.viewType === 'flashcards' && this.showTestArea) {
                    this._cachedBannerTitle = 'Test Area';
                    this._cachedBannerIcon = 'clipboard-check';
                } else if (this.viewType === 'flashcards') {
                    this._cachedBannerTitle = 'Flashcards';
                    this._cachedBannerIcon = 'layers';
                } else if (this.viewType === 'mindmaps') {
                    this._cachedBannerTitle = 'Mindmaps';
                    this._cachedBannerIcon = 'network';
                } else if (this.showingMainMenu) {
                    if (this.viewMode === 'spec') {
                        this._cachedBannerTitle = 'Physics Specification';
                        this._cachedBannerIcon = 'files';
                    } else {
                        this._cachedBannerTitle = this.selectedPaper;
                        // Use paper-specific icons (Paper 1 = 'paper-1', Paper 2 = 'paper-2', Paper 3 = 'paper-3')
                        this._cachedBannerIcon = this.selectedPaper.toLowerCase().replace(' ', '-');
                    }
                } else if (this.showSectionCards()) {
                    this._cachedBannerTitle = this.lastExpandedGroup;
                    const group = this.currentGroups.find(item => item.type === 'group' && item.title === this.lastExpandedGroup);
                    this._cachedBannerIcon = group?.icon || 'folder';
                } else if (this.showingSpecificSection && this.currentSection) {
                    this._cachedBannerTitle = this.currentSection.title;
                    this._cachedBannerIcon = this.currentSection.icon;
                } else {
                    this._cachedBannerTitle = 'Physics Audit';
                    this._cachedBannerIcon = 'book-open';
                }

                this._bannerCacheDirty = false;
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

                // Store reference for cleanup
                this._resizeHandler = () => {
                    if (window.innerWidth >= 768) this.sidebarVisible = true;
                };
                window.addEventListener('resize', this._resizeHandler);

                // Set up cleanup on component destruction
                this.$watch('$el', (value, oldValue) => {
                    if (!value && oldValue && this._resizeHandler) {
                        window.removeEventListener('resize', this._resizeHandler);
                        this._resizeHandler = null;
                    }
                });

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

            // Add async helper methods to Alpine component context
            async _serializeAsync(data) {
                return enhancedDataManagement._serializeAsync.call(this, data);
            },

            async _handleQuotaExceeded(type, error) {
                return enhancedDataManagement._handleQuotaExceeded.call(this, type, error);
            },

            _getStorageSize() {
                return enhancedDataManagement._getStorageSize.call(this);
            },

            async getStorageInfo() {
                return enhancedDataManagement.getStorageInfo.call(this);
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
            ...modalMethods,

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

                // SECURITY: Sanitize first to prevent XSS
                const sanitized = this.sanitizeHTML(htmlContent);

                const div = document.createElement('div');
                div.innerHTML = sanitized;
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
            },

            /**
             * SECURITY: Sanitize HTML to prevent XSS attacks
             * @param {string} dirty - Untrusted HTML content
             * @returns {string} Sanitized HTML safe for rendering
             */
            sanitizeHTML(dirty, options = {}) {
                if (!dirty) return '';

                // ✅ SECURITY: Strengthened DOMPurify configuration
                if (typeof DOMPurify !== 'undefined') {
                    const strictConfig = {
                        ALLOWED_TAGS: ['b', 'i', 'u', 's', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li',
                                       'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                       'table', 'thead', 'tbody', 'tr', 'td', 'th',
                                       'blockquote', 'code', 'pre', 'span', 'div',
                                       'hr', 'mark'],
                        // ✅ Explicit attribute whitelist - no 'href' or 'src' by default
                        ALLOWED_ATTR: ['class', 'style', 'data-latex'], // For KaTeX equations
                        // ✅ Forbid dangerous tags explicitly
                        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style',
                                      'form', 'input', 'button', 'textarea', 'select',
                                      'frame', 'frameset', 'base', 'meta'],
                        // ✅ Forbid event handlers and javascript: URLs
                        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur',
                                      'oninput', 'onchange', 'onsubmit', 'onreset', 'onkeydown', 'onkeyup',
                                      'onkeypress', 'onmousedown', 'onmouseup', 'onmousemove', 'onmouseenter',
                                      'onmouseleave', 'onwheel', 'ondrag', 'ondrop', 'onscroll'],
                        ALLOW_DATA_ATTR: false,
                        ALLOW_UNKNOWN_PROTOCOLS: false,
                        SAFE_FOR_TEMPLATES: true,
                        KEEP_CONTENT: true,
                        RETURN_DOM_FRAGMENT: false,
                        RETURN_DOM: false,
                        FORCE_BODY: true,
                        SANITIZE_DOM: true,
                        IN_PLACE: false,
                        // Allow caller to override for specific use cases
                        ...options
                    };

                    return DOMPurify.sanitize(dirty, strictConfig);
                }

                // Fallback: text-only escape (no HTML)
                const div = document.createElement('div');
                div.textContent = dirty;
                return div.innerHTML;
            },

            /**
             * Debounce utility for performance optimization
             */
            debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func.apply(this, args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            },

            /**
             * Throttle utility for scroll/resize events
             */
            throttle(func, limit) {
                let inThrottle;
                return function(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            }
        };
    };
}
