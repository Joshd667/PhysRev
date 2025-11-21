import { logger } from '../utils/logger.js';
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
import { SearchIndex } from '../utils/search-index.js';

let authMethodsLoaded = false;
let authLoadingPromise = null;

// ⚡ PERFORMANCE: Store large read-only data OUTSIDE Alpine's reactive system
// This saves RAM by preventing Alpine from wrapping these in Proxies
let staticSpecificationData = null;
let staticPaperModeGroups = null;
let staticSpecModeGroups = null;
let staticTopicLookup = null;

// ⚡ PERFORMANCE: Search indexes for O(1) lookups
let auditCardsIndex = null;
let notesIndex = null;
let flashcardsIndex = null;
let mindmapsIndex = null;
let searchIndexesInitialized = false;

// ⚡ MEMORY FIX: Chart instances stored outside Alpine reactive state
// Storing Map in reactive state prevents garbage collection of destroyed charts
let chartInstancesMap = new Map();

export function createApp(specificationData, paperModeGroups, specModeGroups, Alpine) {
    staticSpecificationData = specificationData;
    staticPaperModeGroups = paperModeGroups;
    staticSpecModeGroups = specModeGroups;
    staticTopicLookup = buildTopicLookup(specificationData);
    return () => {
        const state = createState();
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

            // ⚡ MEMORY FIX: Chart instances getter (non-reactive)
            get chartInstances() {
                return chartInstancesMap;
            },

            // Set search results (triggers Alpine reactivity)
            _setSearchResults(results) {
                // Directly update the reactive searchResults array from state.js
                // This triggers Alpine's change detection so templates update
                this.searchResults = results;
            },

            get currentGroups() {
                return this.viewMode === 'spec' ? staticSpecModeGroups["All Topics"] : staticPaperModeGroups[this.selectedPaper] || [];
            },
            get currentSection() {
                return staticSpecificationData[this.activeSection];
            },
            get availablePapers() {
                return this.viewMode === 'paper' ? ['Paper 1', 'Paper 2', 'Paper 3'] : ['All Topics'];
            },
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

            get progressTitle() {
                if (this._progressTitleCacheDirty) {
                    this._computeProgressTitleCache();
                }
                return this._cachedProgressTitle;
            },

            // ⚡ PERFORMANCE: Cached getters for expensive template computations
            get notesGroupedBySection() {
                if (this._cachedNotesGroupedDirty) {
                    try {
                        const result = this.getNotesGroupedBySection();
                        // Ensure we always have a valid array structure
                        if (!result || !Array.isArray(result)) {
                            this._cachedNotesGrouped = [];
                        } else {
                            this._cachedNotesGrouped = result;
                        }
                    } catch (error) {
                        logger.error('Error in getNotesGroupedBySection:', error);
                        this._cachedNotesGrouped = [];
                    }
                    this._cachedNotesGroupedDirty = false;
                }
                return this._cachedNotesGrouped || [];
            },

            get flashcardsGroupedBySection() {
                if (this._cachedFlashcardsGroupedDirty) {
                    try {
                        const result = this.getFlashcardsGroupedBySection();
                        // Ensure we always have a valid array structure
                        if (!result || !Array.isArray(result)) {
                            this._cachedFlashcardsGrouped = [];
                        } else {
                            this._cachedFlashcardsGrouped = result;
                        }
                    } catch (error) {
                        logger.error('Error in getFlashcardsGroupedBySection:', error);
                        this._cachedFlashcardsGrouped = [];
                    }
                    this._cachedFlashcardsGroupedDirty = false;
                }
                return this._cachedFlashcardsGrouped || [];
            },

            get mindmapsGroupedBySection() {
                if (this._cachedMindmapsGroupedDirty) {
                    try {
                        const result = this.getMindmapsGroupedBySection();
                        // Ensure we always have a valid array structure
                        if (!result || !Array.isArray(result)) {
                            this._cachedMindmapsGrouped = [];
                        } else {
                            this._cachedMindmapsGrouped = result;
                        }
                    } catch (error) {
                        logger.error('Error in getMindmapsGroupedBySection:', error);
                        this._cachedMindmapsGrouped = [];
                    }
                    this._cachedMindmapsGroupedDirty = false;
                }
                return this._cachedMindmapsGrouped || [];
            },

            get inheritedTags() {
                if (this._cachedInheritedTagsDirty) {
                    const tags = new Set();
                    this.testSetBuilderCards.forEach(card => {
                        const deck = this.flashcardDecks[card.deckId];
                        if (deck && deck.tags) {
                            deck.tags.forEach(tag => tags.add(tag));
                        }
                    });
                    this._cachedInheritedTags = Array.from(tags).sort();
                    this._cachedInheritedTagsDirty = false;
                }
                return this._cachedInheritedTags;
            },

            get filteredDecksForBuilder() {
                if (this._cachedFilteredDecksForBuilderDirty) {
                    this._cachedFilteredDecksForBuilder = this.getFilteredDecksForBuilder();
                    this._cachedFilteredDecksForBuilderDirty = false;
                }
                return this._cachedFilteredDecksForBuilder;
            },

            get criticalTopicsPageCached() {
                if (this._cachedCriticalTopicsPageDirty) {
                    this._cachedCriticalTopicsPage = this.getCriticalTopicsPage();
                    this._cachedCriticalTopicsPageDirty = false;
                }
                return this._cachedCriticalTopicsPage;
            },

            get strongTopicsPageCached() {
                if (this._cachedStrongTopicsPageDirty) {
                    this._cachedStrongTopicsPage = this.getStrongTopicsPage();
                    this._cachedStrongTopicsPageDirty = false;
                }
                return this._cachedStrongTopicsPage;
            },

            get currentTagsCached() {
                if (this._cachedCurrentTagsDirty) {
                    this._cachedCurrentTags = this.getCurrentTags();
                    this._cachedCurrentTagsDirty = false;
                }
                return this._cachedCurrentTags;
            },

            get reviewCardsCached() {
                if (this._cachedReviewCardsDirty) {
                    this._cachedReviewCards = this.getReviewCards();
                    this._cachedReviewCardsDirty = false;
                }
                return this._cachedReviewCards;
            },

            get notesForCurrentSectionCached() {
                if (this._cachedNotesForCurrentSectionDirty) {
                    this._cachedNotesForCurrentSection = this.getNotesForCurrentSection();
                    this._cachedNotesForCurrentSectionDirty = false;
                }
                return this._cachedNotesForCurrentSection;
            },

            get flashcardDecksForCurrentSectionCached() {
                if (this._cachedFlashcardDecksForCurrentSectionDirty) {
                    this._cachedFlashcardDecksForCurrentSection = this.getFlashcardDecksForCurrentSection();
                    this._cachedFlashcardDecksForCurrentSectionDirty = false;
                }
                return this._cachedFlashcardDecksForCurrentSection;
            },

            get mindmapsForCurrentSectionCached() {
                if (this._cachedMindmapsForCurrentSectionDirty) {
                    this._cachedMindmapsForCurrentSection = this.getMindmapsForCurrentSection();
                    this._cachedMindmapsForCurrentSectionDirty = false;
                }
                return this._cachedMindmapsForCurrentSection;
            },

            _computeProgressTitleCache() {
                this._cachedProgressTitle = this.viewMode === 'spec' ? 'Overall Progress' : this.selectedPaper + ' Progress';
                this._progressTitleCacheDirty = false;
            },

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

            async init() {
                try {
                    window.physicsAuditApp = this;

                    await this.loadAuthModule();
                    await this.checkExistingAuth();
                    await this.loadPreferences();
                    await this.loadTestResultsHistory();
                    await this.loadTestSets();

                    this.sidebarVisible = true;

                    this._resizeHandler = () => {
                    if (window.innerWidth >= 768) this.sidebarVisible = true;
                    };
                    window.addEventListener('resize', this._resizeHandler);

                    this._onlineHandler = () => {
                    this.isOnline = true;
                };
                this._offlineHandler = () => {
                    this.isOnline = false;
                };
                    window.addEventListener('online', this._onlineHandler);
                    window.addEventListener('offline', this._offlineHandler);

                    this.$watch('$el', (value, oldValue) => {
                    if (!value && oldValue) {
                        if (this._resizeHandler) {
                            window.removeEventListener('resize', this._resizeHandler);
                            this._resizeHandler = null;
                        }
                        if (this._onlineHandler) {
                            window.removeEventListener('online', this._onlineHandler);
                            window.removeEventListener('offline', this._offlineHandler);
                            this._onlineHandler = null;
                            this._offlineHandler = null;
                        }
                    }
                    });

                    setupWatchers(this);

                    // ⚡ PERFORMANCE OPTIMIZATION: Search indexes deferred to first search
                    // This saves ~80-120ms during app initialization
                    // Indexes will be built lazily when user performs first search

                } catch (error) {
                    logger.error('❌ App initialization failed:', error);

                    const fallback = document.getElementById('error-fallback');
                    const errorMessage = document.getElementById('error-message');
                    if (fallback && errorMessage) {
                        fallback.classList.remove('hidden');
                        errorMessage.textContent = `Initialization Error: ${error.message}`;

                        const errorStack = document.getElementById('error-stack');
                        if (errorStack) {
                            errorStack.textContent = error.stack || 'No stack trace available';
                        }
                    }

                    throw error;
                }
            },

            /**
             * ⚡ PERFORMANCE: Lazy search index initialization saves ~80-120ms on startup
             */
            _ensureSearchIndexes() {
                if (searchIndexesInitialized) {
                    return;
                }

                this._initializeSearchIndexes();
                searchIndexesInitialized = true;
            },

            _initializeSearchIndexes() {
                auditCardsIndex = new SearchIndex();
                notesIndex = new SearchIndex();
                flashcardsIndex = new SearchIndex();
                mindmapsIndex = new SearchIndex();

                logger.debug('[Search Index] Building indexes...');
                logger.debug('[Search Index] specificationData keys:', Object.keys(this.specificationData || {}).length);
                logger.debug('[Search Index] userNotes count:', Object.keys(this.userNotes || {}).length);
                logger.debug('[Search Index] flashcardDecks count:', Object.keys(this.flashcardDecks || {}).length);
                logger.debug('[Search Index] mindmaps count:', Object.keys(this.mindmaps || {}).length);

                // ⚡ PERFORMANCE: Pre-compute search text during index build
                const auditCards = [];
                Object.entries(this.specificationData).forEach(([sectionKey, section]) => {
                    if (!section.topics) return;
                    section.topics.forEach(topic => {
                        const searchText = `${topic.id || ''} ${topic.title || ''} ${topic.prompt || ''} ${(topic.learningObjectives || []).join(' ')} ${(topic.examples || []).join(' ')}`.toLowerCase();

                        auditCards.push({
                            ...topic,
                            sectionKey,
                            sectionTitle: section.title,
                            paper: section.paper,
                            _searchText: searchText
                        });
                    });
                });
                auditCardsIndex.buildIndex(auditCards, topic => topic._searchText);

                notesIndex.buildIndex(Object.values(this.userNotes), note =>
                    `${note.title || ''} ${note.content || ''} ${(note.tags || []).join(' ')}`
                );

                flashcardsIndex.buildIndex(Object.values(this.flashcardDecks), deck => {
                    const deckText = `${deck.name || ''} ${(deck.tags || []).join(' ')}`;
                    const cardsText = (deck.cards || []).map(card => `${card.front || ''} ${card.back || ''}`).join(' ');
                    return `${deckText} ${cardsText}`;
                });

                mindmapsIndex.buildIndex(Object.values(this.mindmaps), mindmap => {
                    const shapesText = (mindmap.shapes || []).map(shape => shape.text || '').join(' ');
                    return `${mindmap.title || ''} ${shapesText} ${(mindmap.tags || []).join(' ')}`;
                });

                logger.debug('[Search Index] Indexes built:');
                logger.debug('  - Audit cards:', auditCardsIndex.items.size, 'items,', auditCardsIndex.index.size, 'words');
                logger.debug('  - Notes:', notesIndex.items.size, 'items,', notesIndex.index.size, 'words');
                logger.debug('  - Flashcards:', flashcardsIndex.items.size, 'items,', flashcardsIndex.index.size, 'words');
                logger.debug('  - Mindmaps:', mindmapsIndex.items.size, 'items,', mindmapsIndex.index.size, 'words');

                // Show sample indexed content to verify no code leaking in
                if (notesIndex.items.size > 0) {
                    const firstNote = Array.from(notesIndex.items.values())[0];
                    logger.debug('[Search Index] Sample note content:',
                        (firstNote.title || '').substring(0, 50),
                        (firstNote.content || '').substring(0, 100).replace(/\n/g, ' '));
                }
                if (mindmapsIndex.items.size > 0) {
                    const firstMindmap = Array.from(mindmapsIndex.items.values())[0];
                    const sampleShapes = (firstMindmap.shapes || []).slice(0, 2).map(s => s.text || '').join(', ');
                    logger.debug('[Search Index] Sample mindmap content:', firstMindmap.title, '| shapes:', sampleShapes.substring(0, 100));
                }
            },

            _rebuildSearchIndexes() {
                searchIndexesInitialized = false;
                this._ensureSearchIndexes();
            },

            // ⚡ PERFORMANCE: Search index getters for search queries
            _getNotesIndex() {
                this._ensureSearchIndexes();
                return notesIndex;
            },

            _getFlashcardsIndex() {
                this._ensureSearchIndexes();
                return flashcardsIndex;
            },

            _getMindmapsIndex() {
                this._ensureSearchIndexes();
                return mindmapsIndex;
            },

            _updateNoteInIndex(note) {
                if (!notesIndex || !note.id) return;
                notesIndex.updateItem(note, n =>
                    `${n.title || ''} ${n.content || ''} ${(n.tags || []).join(' ')}`
                );
            },

            _addNoteToIndex(note) {
                if (!notesIndex || !note.id) return;
                notesIndex.addItem(note, n =>
                    `${n.title || ''} ${n.content || ''} ${(n.tags || []).join(' ')}`
                );
            },

            _removeNoteFromIndex(noteId) {
                if (!notesIndex) return;
                notesIndex.removeItem(noteId);
            },

            _updateFlashcardDeckInIndex(deck) {
                if (!flashcardsIndex || !deck.id) return;
                flashcardsIndex.updateItem(deck, d => {
                    const deckText = `${d.name || ''} ${(d.tags || []).join(' ')}`;
                    const cardsText = (d.cards || []).map(card => `${card.front || ''} ${card.back || ''}`).join(' ');
                    return `${deckText} ${cardsText}`;
                });
            },

            _addFlashcardDeckToIndex(deck) {
                if (!flashcardsIndex || !deck.id) return;
                flashcardsIndex.addItem(deck, d => {
                    const deckText = `${d.name || ''} ${(d.tags || []).join(' ')}`;
                    const cardsText = (d.cards || []).map(card => `${card.front || ''} ${card.back || ''}`).join(' ');
                    return `${deckText} ${cardsText}`;
                });
            },

            _removeFlashcardDeckFromIndex(deckId) {
                if (!flashcardsIndex) return;
                flashcardsIndex.removeItem(deckId);
            },

            _updateMindmapInIndex(mindmap) {
                if (!mindmapsIndex || !mindmap.id) return;
                mindmapsIndex.updateItem(mindmap, m => {
                    const shapesText = (m.shapes || []).map(shape => shape.text || '').join(' ');
                    return `${m.title || ''} ${shapesText} ${(m.tags || []).join(' ')}`;
                });
            },

            _addMindmapToIndex(mindmap) {
                if (!mindmapsIndex || !mindmap.id) return;
                mindmapsIndex.addItem(mindmap, m => {
                    const shapesText = (m.shapes || []).map(shape => shape.text || '').join(' ');
                    return `${m.title || ''} ${shapesText} ${(m.tags || []).join(' ')}`;
                });
            },

            _removeMindmapFromIndex(mindmapId) {
                if (!mindmapsIndex) return;
                mindmapsIndex.removeItem(mindmapId);
            },

            _getAuditCardsIndex() {
                return auditCardsIndex || { search: () => new Set(), getItems: () => [], items: new Map() };
            },

            _getNotesIndex() {
                return notesIndex || { search: () => new Set(), getItems: () => [], items: new Map() };
            },

            _getFlashcardsIndex() {
                return flashcardsIndex || { search: () => new Set(), getItems: () => [], items: new Map() };
            },

            _getMindmapsIndex() {
                return mindmapsIndex || { search: () => new Set(), getItems: () => [], items: new Map() };
            },

            async loadAuthModule() {
                if (authMethodsLoaded) {
                    return;
                }

                if (authLoadingPromise) {
                    return authLoadingPromise;
                }

                authLoadingPromise = (async () => {
                    const authModule = await import('../features/auth/index.js');
                    const authMethods = await authModule.loadAuthMethods();

                    Object.assign(this, authMethods);
                    authMethodsLoaded = true;
                })();

                await authLoadingPromise;
                authLoadingPromise = null;
            },

            saveData() {
                enhancedDataManagement.saveData.call(this);
            },

            async saveDataAtomic() {
                return await enhancedDataManagement.saveDataAtomic.call(this);
            },

            async syncToMoodleBackend(data) {
                try {
                } catch (error) {
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

            getStoragePrefix() {
                return enhancedDataManagement.getStoragePrefix.call(this);
            },

            saveDataType(type, data) {
                return enhancedDataManagement.saveDataType.call(this, type, data);
            },

            loadDataType(type, defaultValue) {
                return enhancedDataManagement.loadDataType.call(this, type, defaultValue);
            },

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

            ...searchMethods,
            ...navigationMethods,
            ...statisticsMethods,
            ...uiHelperMethods,
            ...dataManagementMethods,
            ...dateUtils,
            ...revisionAreaColorMethods,
            ...modalMethods,

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

                if (typeof DOMPurify !== 'undefined') {
                    const strictConfig = {
                        ALLOWED_TAGS: ['b', 'i', 'u', 's', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li',
                                       'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                       'table', 'thead', 'tbody', 'tr', 'td', 'th',
                                       'blockquote', 'code', 'pre', 'span', 'div',
                                       'hr', 'mark'],
                        ALLOWED_ATTR: ['class', 'data-latex'],
                        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style',
                                      'form', 'input', 'button', 'textarea', 'select',
                                      'frame', 'frameset', 'base', 'meta', 'svg'],
                        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur',
                                      'oninput', 'onchange', 'onsubmit', 'onreset', 'onkeydown', 'onkeyup',
                                      'onkeypress', 'onmousedown', 'onmouseup', 'onmousemove', 'onmouseenter',
                                      'onmouseleave', 'onwheel', 'ondrag', 'ondrop', 'onscroll',
                                      'style', 'src', 'href', 'xlink:href'],
                        ALLOW_DATA_ATTR: false,
                        ALLOW_UNKNOWN_PROTOCOLS: false,
                        SAFE_FOR_TEMPLATES: true,
                        KEEP_CONTENT: true,
                        RETURN_DOM_FRAGMENT: false,
                        RETURN_DOM: false,
                        FORCE_BODY: true,
                        SANITIZE_DOM: true,
                        IN_PLACE: false,
                        ...options
                    };

                    return DOMPurify.sanitize(dirty, strictConfig);
                }

                const div = document.createElement('div');
                div.textContent = dirty;
                return div.innerHTML;
            },

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

            throttle(func, limit) {
                let inThrottle;
                return function(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            },

            getTimeSinceSync() {
                if (!this.lastSyncTime) return 'Never';

                const now = Date.now();
                const diff = now - this.lastSyncTime;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (seconds < 60) return 'Just now';
                if (minutes < 60) return `${minutes}m ago`;
                if (hours < 24) return `${hours}h ago`;
                return `${days}d ago`;
            },

            async syncDataNow() {
                if (!this.isOnline) {
                    return;
                }

                if (this.syncInProgress) {
                    return;
                }

                try {
                    this.syncInProgress = true;

                    // Save current data
                    await this.saveDataAtomic();

                    // For Teams users, sync to cloud
                    if (this.authMethod === 'teams' && this.saveDataToTeams) {
                        await this.saveDataToTeams();
                    }

                    this.lastSyncTime = Date.now();

                } catch (error) {
                    logger.error('❌ Sync failed:', error);
                } finally {
                    this.syncInProgress = false;
                }
            }
        };
    };
}
