// js/features/views/index.js
// View type management (audit, notes, flashcards, mindmaps)

export const viewManagementMethods = {
    /**
     * Toggle the view selector dropdown
     */
    toggleViewSelector() {
        this.showViewSelector = !this.showViewSelector;
    },

    /**
     * Close the view selector dropdown
     */
    closeViewSelector() {
        this.showViewSelector = false;
    },

    /**
     * Switch to a different view type
     * Filters now persist across all content views (notes, flashcards, mindmaps)
     * @param {string} viewType - 'audit', 'notes', 'flashcards', or 'mindmaps'
     */
    switchViewType(viewType) {
        this.viewType = viewType;
        this.showViewSelector = false;

        // Sync filters between audit and content views
        if (viewType === 'notes' || viewType === 'flashcards' || viewType === 'mindmaps') {
            // Switching to a content view (notes/flashcards/mindmaps)
            // If there's an active section in audit, set it as the content filter
            if (this.showingSpecificSection && this.activeSection) {
                this.contentFilterSection = this.activeSection;
                this.contentFilterGroup = null;
            }
            // If there's an expanded group, set it as the content filter
            else if (this.lastExpandedGroup) {
                this.contentFilterGroup = this.lastExpandedGroup;
                this.contentFilterSection = null;
            }
            this.showingMainMenu = false;
            this.showingSpecificSection = false;
            this.showingRevision = false;
            this.showingAnalytics = false;
        } else if (viewType === 'audit') {
            // Switching to audit view
            // If there's a section filter in content, navigate to that section in audit
            if (this.contentFilterSection) {
                this.activeSection = this.contentFilterSection;
                this.showingSpecificSection = true;
                this.showingMainMenu = false;
            }
            // If there's a group filter, expand that group
            else if (this.contentFilterGroup) {
                this.lastExpandedGroup = this.contentFilterGroup;
                this.expandedGroups[this.contentFilterGroup] = true;
                this.showingMainMenu = false;
                this.showingSpecificSection = false;
            } else {
                this.showingMainMenu = true;
                this.showingSpecificSection = false;
            }
            this.showingRevision = false;
            this.showingAnalytics = false;
        }

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Get all notes, optionally filtered by tags
     * @param {Array} filterTags - Optional array of topic IDs to filter by
     * @returns {Array} Array of notes
     */
    getAllNotes(filterTags = null) {
        let notes = Object.values(this.userNotes || {});

        // Filter by tags if provided
        if (filterTags && filterTags.length > 0) {
            notes = notes.filter(note =>
                note.tags && note.tags.some(tag => filterTags.includes(tag))
            );
        }

        // Sort by update date (most recent first)
        return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    /**
     * Get all flashcard decks, optionally filtered by tags
     * @param {Array} filterTags - Optional array of topic IDs to filter by
     * @returns {Array} Array of flashcard decks
     */
    getAllFlashcards(filterTags = null) {
        let decks = Object.values(this.flashcardDecks || {});

        // Filter by tags if provided
        if (filterTags && filterTags.length > 0) {
            decks = decks.filter(deck =>
                deck.tags && deck.tags.some(tag => filterTags.includes(tag))
            );
        }

        // Sort by update date (most recent first)
        return decks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    /**
     * Get all mindmaps, optionally filtered by tags
     * @param {Array} filterTags - Optional array of topic IDs to filter by
     * @returns {Array} Array of mindmaps
     */
    getAllMindmaps(filterTags = null) {
        let mindmaps = Object.values(this.mindmaps || {});

        // Filter by tags if provided
        if (filterTags && filterTags.length > 0) {
            mindmaps = mindmaps.filter(mindmap =>
                mindmap.tags && mindmap.tags.some(tag => filterTags.includes(tag))
            );
        }

        // Sort by update date (most recent first)
        return mindmaps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    /**
     * Get current view icon for display
     * @returns {string} Lucide icon name
     */
    getViewIcon() {
        const icons = {
            audit: 'clipboard-check',
            notes: 'file-text',
            flashcards: 'layers',
            mindmaps: 'network'
        };
        return icons[this.viewType] || 'clipboard-check';
    },

    /**
     * Get current view title for display
     * @returns {string} View title
     */
    getViewTitle() {
        const titles = {
            audit: 'Knowledge Audit',
            notes: 'Notes',
            flashcards: 'Flashcards',
            mindmaps: 'Mindmaps'
        };
        return titles[this.viewType] || 'Knowledge Audit';
    },

    // Note: getNotesGroupedBySection() has been moved to js/features/notes/display.js
    // Note: getFlashcardsGroupedBySection() is in js/features/flashcards/display.js
    // Note: getMindmapsGroupedBySection() is in js/features/mindmaps/display.js
};
