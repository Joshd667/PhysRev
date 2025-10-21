// js/core/state.js
// Defines the reactive state for the Alpine.js app

import { buildTopicLookup } from '../utils/topic-lookup.js';

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
        viewType: 'audit', // 'audit', 'notes', 'flashcards', 'mindmaps'
        showViewSelector: false, // Shows the view type dropdown
        lastExpandedGroup: null,
        showingSpecificSection: false,
        showingMainMenu: true,
        showingRevision: false,
        showSettingsModal: false,

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

        // --- NEW: EQUATION EDITOR STATE ---
        showEquationEditor: false,
        equationLatex: '',

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

        // --- FLASHCARD TEST STATE ---
        showFlashcardTest: false,
        testFlashcards: [], // Array of flashcards in current test
        currentTestCardIndex: 0,
        testCardFlipped: false,

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
        topicLookup: buildTopicLookup(specificationData), // Map of topicId -> topic info
        confidenceLevels: {}, // User-specific data
        confidenceScale: [
            { value: 1, label: "1", description: "Not confident", color: "bg-red-500" },
            { value: 2, label: "2", description: "Low confidence", color: "bg-orange-500" },
            { value: 3, label: "3", description: "Moderate confidence", color: "bg-yellow-500" },
            { value: 4, label: "4", description: "Good confidence", color: "bg-blue-500" },
            { value: 5, label: "5", description: "Very confident", color: "bg-green-500" }
        ],

        // --- TAG SELECTOR STATE ---
        showTagSelector: false, // Shows the tag selector modal
        tagSelectorQuery: '', // Search query for tags
        tagSelectorContext: null, // 'note', 'flashcard', or 'mindmap' - context for which editor is open

        // --- REVISION AREA INDICATOR SETTINGS ---
        revisionAreaIndicatorStyle: 'bar', // 'bar', 'outline', or 'none'

        // NOTE: Computed properties (currentGroups, currentSection, availablePapers, bannerTitle, bannerIcon)
        // are defined in app.js to preserve reactivity with Alpine.js
    };
}
