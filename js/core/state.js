// js/core/state.js
// Defines the reactive state for the Alpine.js app

export function createState(specificationData, paperModeGroups, specModeGroups) {
    return {
        // --- DARK MODE STATE ---
        darkMode: false,

        // --- UI & NAVIGATION STATE ---
        selectedPaper: 'All Topics',
        activeSection: 'measurements_errors',
        sidebarVisible: true,
        expandedGroups: {},
        viewMode: 'spec', // 'paper' or 'spec'
        lastExpandedGroup: null,
        showingSpecificSection: false,
        showingMainMenu: true,
        showingRevision: false,
        showSettingsModal: false,

        // --- SEARCH STATE ---
        searchVisible: false,
        searchQuery: '',
        searchResults: [],
        searchTimer: null,

        // --- AUTHENTICATION STATE ---
        isAuthenticated: false,
        showLoginScreen: true,
        user: null,
        authMethod: null,
        authToken: null,
        loginError: null,
        isLoading: false,

        // --- REVISION STATE ---
        currentRevisionSection: '',
        currentRevisionSectionTitle: '',
        currentRevisionTopics: [],
        currentRevisionResources: null,

        // --- USER NOTES STATE ---
        userNotes: {}, // { noteId: { id, sectionId, title, content, createdAt, updatedAt } }
        showNoteEditor: false,
        noteEditorMode: 'create', // 'create' or 'edit'
        noteEditorSectionId: null,
        noteEditorTitle: '',
        noteEditorContent: '',
        noteEditorId: null,
        editorSelectionUpdate: 0, // Triggers reactivity for formatting buttons

        // --- USER FLASHCARDS STATE ---
        flashcardDecks: {}, // { deckId: { id, sectionId, name, cards: [], createdAt, updatedAt } }
        showFlashcardEditor: false,
        flashcardEditorMode: 'create', // 'create' or 'edit'
        flashcardEditorSectionId: null,
        flashcardEditorDeckName: '',
        flashcardEditorDeckId: null,
        flashcardEditorCards: [], // Array of { front, back } for current editing session
        flashcardEditorCurrentCardFront: '',
        flashcardEditorCurrentCardBack: '',

        // --- FLASHCARD TEST STATE ---
        showFlashcardTest: false,
        testFlashcards: [], // Array of flashcards in current test
        currentTestCardIndex: 0,
        testCardFlipped: false,

        // --- STUDY MATERIALS FILTER STATE ---
        studyMaterialsFilter: 'all', // 'all', 'notes', 'flashcards', 'mindmaps'

        // --- USER MINDMAPS STATE ---
        mindmaps: {}, // { mindmapId: { id, sectionId, title, nodes: [], connections: [], viewport: {}, createdAt, updatedAt } }
        showMindmapEditor: false,
        mindmapEditorMode: 'create', // 'create' or 'edit'
        mindmapEditorSectionId: null,
        mindmapEditorTitle: '',
        mindmapEditorId: null,
        mindmapEditorData: { nodes: [], connections: [], viewport: { x: 0, y: 0, scale: 1 } },

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
        chartInstances: new Map(),

        // --- DATA ---
        specificationData: specificationData,
        paperModeGroups: paperModeGroups,
        specModeGroups: specModeGroups,
        confidenceLevels: {}, // User-specific data
        confidenceScale: [
            { value: 1, label: "1", description: "Not confident", color: "bg-red-500" },
            { value: 2, label: "2", description: "Low confidence", color: "bg-orange-500" },
            { value: 3, label: "3", description: "Moderate confidence", color: "bg-yellow-500" },
            { value: 4, label: "4", description: "Good confidence", color: "bg-blue-500" },
            { value: 5, label: "5", description: "Very confident", color: "bg-green-500" }
        ]

        // NOTE: Computed properties (currentGroups, currentSection, availablePapers, bannerTitle, bannerIcon)
        // are defined in app.js to preserve reactivity with Alpine.js
    };
}
