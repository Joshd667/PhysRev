// js/core/state.js
// Defines the reactive state for the Alpine.js app

// ⚡ PERFORMANCE: Static confidence scale outside reactive system
const CONFIDENCE_SCALE = [
    { value: 1, label: "1", description: "Not confident", color: "bg-red-500" },
    { value: 2, label: "2", description: "Low confidence", color: "bg-orange-500" },
    { value: 3, label: "3", description: "Moderate confidence", color: "bg-yellow-500" },
    { value: 4, label: "4", description: "Good confidence", color: "bg-blue-500" },
    { value: 5, label: "5", description: "Very confident", color: "bg-green-500" }
];

export function createState() {
    return {
        // --- DARK MODE STATE ---
        darkMode: false,

        // --- UI & NAVIGATION STATE ---
        selectedPaper: 'All Topics',
        activeSection: 'measurements_errors',
        sidebarVisible: true,
        expandedGroups: {},
        viewMode: 'spec', // 'paper' or 'spec'
        viewType: 'audit', // 'audit', 'notes', 'flashcards', 'mindmaps'
        showViewSelector: false, // Shows the view type dropdown
        lastExpandedGroup: null,
        showingSpecificSection: false,
        showingMainMenu: true,
        showingRevision: false,
        showSettingsModal: false,
        showPrivacyNoticeModal: false,

        // --- BREADCRUMB CACHE (reduces initial RAM spike) ---
        _cachedBannerTitle: null,
        _cachedBannerIcon: null,
        _bannerCacheDirty: true,

        // --- PROGRESS TITLE CACHE (prevents string concatenation in reactive context) ---
        _cachedProgressTitle: null,
        _progressTitleCacheDirty: true,

        // --- APP UPDATE STATE ---
        updateAvailable: false,
        checkingForUpdates: false,
        updateCheckMessage: '',
        showBackupPrompt: false,

        // --- SEARCH STATE ---
        searchVisible: false,
        searchQuery: '',
        searchResults: [],
        searchTimer: null,
        searchFilters: ['audit', 'notes', 'flashcards', 'mindmaps'], // Array of active filters (all selected by default)
        searchSortBy: 'relevance', // 'relevance', 'alphabetical', 'numerical', 'confidence', 'date'
        searchSortDirection: 'asc', // 'asc' or 'desc'
        showAdvancedSearch: false,
        selectedSearchTags: [], // Array of topic IDs to filter by
        selectedConfidenceRating: null, // null or 1-5 for confidence filter
        selectedConfidenceLevels: [], // Array of confidence levels (1-5) to filter by
        searchConfidenceDropdownOpen: false, // Confidence level filter dropdown state
        searchSortDropdownOpen: false, // Sort dropdown state

        // --- AUTHENTICATION STATE ---
        isAuthenticated: false,
        showLoginScreen: true,
        user: null,
        authMethod: null,
        authToken: null,
        loginError: null,
        isLoading: false,

        // --- OFFLINE/ONLINE SYNC STATE ---
        isOnline: navigator.onLine,
        lastSyncTime: null,
        syncInProgress: false,

        // --- REVISION STATE ---
        currentRevisionSection: '',
        currentRevisionSectionTitle: '',
        currentRevisionTopics: [],
        currentRevisionResources: null,

        // --- USER NOTES STATE ---
        userNotes: {}, // { noteId: { id, sectionId, title, content, tags: [], createdAt, updatedAt } }
        showNoteEditor: false,
        noteEditorMode: 'create', // 'create' or 'edit'
        noteEditorSectionId: null,
        noteEditorTitle: '',
        noteEditorContent: '',
        noteEditorId: null,
        noteEditorTags: [], // Tags for current editing session
        editorSelectionUpdate: 0, // Triggers reactivity for formatting buttons
        noteEditorSelection: null, // Holds the selection range for the editor
    notesViewMode: 'card', // 'list' or 'card' view mode for notes
    notePreviewId: null,
        notesSort: 'updated', // Sorting option for notes: 'updated', 'name'

        // --- NEW: EQUATION EDITOR STATE ---
        showEquationEditor: false,
        equationLatex: '',
        equationEditorMode: 'note', // 'note' or 'mindmap' - determines which insert function to call
        equationTargetShape: null, // For mindmap equation insertion

        // --- USER FLASHCARDS STATE ---
        flashcardDecks: {}, // { deckId: { id, sectionId, name, cards: [], tags: [], createdAt, updatedAt } }
        showFlashcardEditor: false,
        flashcardEditorMode: 'create', // 'create' or 'edit'
        flashcardEditorSectionId: null,
        flashcardEditorDeckName: '',
        flashcardEditorDeckId: null,
        flashcardEditorCards: [], // Array of { front, back } for current editing session
        flashcardEditorCurrentCardFront: '',
        flashcardEditorCurrentCardBack: '',
        flashcardEditorTags: [], // Tags for current editing session
        flashcardEditorCardsExpanded: false, // Whether cards list is expanded
        flashcardEditorEditingCardIndex: null, // Index of card being edited

        // --- FLASHCARD TEST STATE ---
        showFlashcardTest: false,
        testFlashcards: [], // Array of flashcards in current test
        currentTestCardIndex: 0,
        testCardFlipped: false,
        currentTestTitle: '', // Title of the current flashcard test
        testAnswers: {}, // { cardIndex: 'correct' | 'incorrect' }
        testCompleted: false, // Whether the test has been completed
        showTestResults: false, // Whether to show the results screen
        testReviewMode: null, // null | 'correct' | 'incorrect' - which cards to review
        testResultsHistory: [], // Array of { deckName, totalCards, correctCount, incorrectCount, timestamp }

        // --- TEST AREA STATE ---
        showTestArea: false, // Show test area main view
        showTestSetList: false, // Show saved test sets
        showTestSetBuilder: false, // Show test set builder
        testSets: {}, // Saved test sets { id: { name, cards: [], createdAt, updatedAt } }
        currentTestSetId: null, // ID of test set being edited
        testSetBuilderName: '', // Name for new/edited test set
        testSetBuilderCards: [], // Cards added to test set builder
        testSetBuilderSearch: '', // Search query in builder
        testSetBuilderExpandedDecks: {}, // { deckId: true/false } - which decks are expanded
        testSetSort: 'updated', // Sorting option for test sets
        
        // --- FLASHCARD VIEW STATE ---
        flashcardViewMode: 'card', // 'list' or 'card' view mode (default: card)
        flashcardCardSort: 'updated', // Sorting option for flashcard card view
        
        // --- ADVANCED SEARCH STATE (Test Area) ---
        showAdvancedSearch: false, // Show/hide advanced search dropdown
        advancedSearchTags: [], // Selected tags for filtering

        // --- STUDY MATERIALS FILTER STATE ---
        studyMaterialsFilter: 'all', // 'all', 'notes', 'flashcards', 'mindmaps'

        // --- SHARED CONTENT FILTER STATE (for notes, flashcards, mindmaps) ---
        contentFilterSection: null, // Filter content by section (null = show all)
        contentFilterGroup: null, // Filter content by group (null = show all)

        // --- USER MINDMAPS STATE ---
        mindmaps: {}, // { mindmapId: { id, sectionId, title, nodes: [], connections: [], viewport: {}, tags: [], createdAt, updatedAt } }
        showMindmapEditor: false,
        mindmapEditorMode: 'create', // 'create' or 'edit'
        mindmapEditorSectionId: null,
        mindmapEditorTitle: '',
        mindmapEditorId: null,
        mindmapEditorData: { nodes: [], connections: [], viewport: { x: 0, y: 0, scale: 1 } },
        mindmapEditorTags: [], // Tags for current editing session
        mindmapsViewMode: 'card', // 'list' or 'card' view mode for mindmaps
        mindmapsSort: 'updated', // Sorting option for mindmaps: 'updated', 'name', 'nodes'

        // Node Editor Modal
        showMindmapNodeEditor: false,
        mindmapNodeEditorMode: 'create', // 'create' or 'edit'
        mindmapNodeEditorContent: '',
        mindmapNodeEditorPosition: { x: 0, y: 0 },
        mindmapNodeEditorId: null,

        // --- ANALYTICS STATE ---
        showingAnalytics: false,
        analyticsData: null,
        analyticsHistoryData: [],
        criticalTopicsPage: 0,
        strongTopicsPage: 0,
        recommendationsPage: 0,
        // ⚡ MEMORY FIX: chartInstances moved outside reactive state (see app.js)
        // Storing Map in reactive state prevents garbage collection of destroyed charts

        // --- DATA ---
        // NOTE: Large read-only data (specificationData, groups, topicLookup) are stored
        // outside reactive state to save 300-400MB of memory. Access via app methods.
        confidenceLevels: {}, // User-specific data

        // Getter for static confidence scale (non-reactive)
        get confidenceScale() {
            return CONFIDENCE_SCALE;
        },

        // --- TAG SELECTOR STATE ---
        showTagSelector: false, // Shows the tag selector modal
        tagSelectorQuery: '', // Search query for tags
        tagSelectorContext: null, // 'note', 'flashcard', or 'mindmap' - context for which editor is open
        tagSelectorExpandedSections: {}, // Tracks which sections are expanded { sectionName: true/false }
        tagSelectorShowSelected: false, // Toggle for showing selected tags dropdown

        // --- REVISION AREA INDICATOR SETTINGS ---
        revisionAreaIndicatorStyle: 'outline', // 'bar', 'outline', or 'none'

        // --- PERFORMANCE: CACHED COMPUTED VALUES ---
        // These cache expensive template computations to avoid recalculating on every render
        _cachedNotesGrouped: [],
        _cachedNotesGroupedDirty: true,
        _cachedFlashcardsGrouped: [],
        _cachedFlashcardsGroupedDirty: true,
        _cachedMindmapsGrouped: [],
        _cachedMindmapsGroupedDirty: true,
        _cachedInheritedTags: [],
        _cachedInheritedTagsDirty: true,
        _cachedFilteredDecksForBuilder: [],
        _cachedFilteredDecksForBuilderDirty: true,
        _cachedCriticalTopicsPage: [],
        _cachedCriticalTopicsPageDirty: true,
        _cachedStrongTopicsPage: [],
        _cachedStrongTopicsPageDirty: true,
        _cachedCurrentTags: [],
        _cachedCurrentTagsDirty: true,
        _cachedReviewCards: [],
        _cachedReviewCardsDirty: true,
        _cachedNotesForCurrentSection: [],
        _cachedNotesForCurrentSectionDirty: true,
        _cachedFlashcardDecksForCurrentSection: [],
        _cachedFlashcardDecksForCurrentSectionDirty: true,
        _cachedMindmapsForCurrentSection: [],
        _cachedMindmapsForCurrentSectionDirty: true,

        // --- CUSTOM MODAL DIALOG STATE ---
        showCustomModal: false,
        modalType: 'alert', // 'alert', 'confirm', 'prompt'
        modalTitle: '',
        modalMessage: '',
        modalInputValue: '',
        modalCallback: null, // Callback for confirm/prompt results

        // NOTE: Computed properties (currentGroups, currentSection, availablePapers, bannerTitle, bannerIcon)
        // are defined in app.js to preserve reactivity with Alpine.js
    };
}
