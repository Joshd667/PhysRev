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
        const previousViewType = this.viewType;
        this.viewType = viewType;
        this.showViewSelector = false;

        // Close search
        this.searchVisible = false;

        // Check if we're switching between content views (notes/flashcards/mindmaps)
        const isContentView = (view) => view === 'notes' || view === 'flashcards' || view === 'mindmaps';
        const switchingBetweenContentViews = isContentView(previousViewType) && isContentView(viewType);

        // If switching between content views, just close test area and refresh icons - keep all filters as-is
        if (switchingBetweenContentViews) {
            // Make sure sidebar reflects the current section if one is filtered
            if (this.contentFilterSection) {
                // Find and ensure the parent group is expanded in sidebar
                const parentGroup = this.currentGroups.find(item =>
                    item.type === "group" && item.sections && item.sections.includes(this.contentFilterSection)
                );
                if (parentGroup) {
                    this.expandedGroups[parentGroup.title] = true;
                }
            }

            // Close test area when switching to notes/mindmaps to ensure breadcrumb shows
            if ((viewType === 'notes' || viewType === 'mindmaps') && this.closeTestArea) {
                this.closeTestArea();
            }

            this.$nextTick(() => {
                if (window.lucide) {
                    lucide.createIcons();
                }
            });
            return; // Exit early - don't modify any navigation state or filters
        }

        // Sync filters between audit and content views
        if (viewType === 'notes' || viewType === 'flashcards' || viewType === 'mindmaps') {
            // Switching FROM audit TO a content view (notes/flashcards/mindmaps)
            
            // Determine the correct section and group filters based on current state
            
            // Case 1: In revision mode - preserve the PARENT section (activeSection), not revision section
            if (this.showingRevision && this.activeSection) {
                this.contentFilterSection = this.activeSection;
                if (this.lastExpandedGroup) {
                    this.contentFilterGroup = this.lastExpandedGroup;
                }
            }
            // Case 2: Viewing specific section - preserve it
            else if (this.showingSpecificSection && this.activeSection) {
                this.contentFilterSection = this.activeSection;
                if (this.lastExpandedGroup) {
                    this.contentFilterGroup = this.lastExpandedGroup;
                }
            }
            // Case 3: At group level (section cards view) - don't set section filter, only group
            else if (this.showSectionCards()) {
                this.contentFilterSection = null; // Stay at group level
                this.contentFilterGroup = this.lastExpandedGroup;
            }
            // Case 4: At main menu - clear all filters
            else if (this.showingMainMenu) {
                this.contentFilterSection = null;
                this.contentFilterGroup = null;
            }
            // Case 5: Fallback - clear filters
            else {
                this.contentFilterSection = null;
                this.contentFilterGroup = null;
            }

            this.showingMainMenu = false;
            this.showingSpecificSection = false;
            this.showingRevision = false;
            this.showingAnalytics = false;

            // Close test area when switching to notes/mindmaps to ensure breadcrumb shows
            if ((viewType === 'notes' || viewType === 'mindmaps') && this.closeTestArea) {
                this.closeTestArea();
            }
        } else if (viewType === 'audit') {
            // Switching to audit view
            // Restore navigation state from content filters
            
            // Reset study materials filter to 'all' when entering audit view
            this.studyMaterialsFilter = 'all';
            
            if (this.contentFilterSection) {
                // If there's a section filter, go to that section
                this.activeSection = this.contentFilterSection;
                this.showingSpecificSection = true;
                this.showingMainMenu = false;
                this.showingRevision = false;
                
                // Also restore the parent group context
                if (this.contentFilterGroup) {
                    this.lastExpandedGroup = this.contentFilterGroup;
                    this.expandedGroups[this.contentFilterGroup] = true;
                }
            } else if (this.contentFilterGroup) {
                // If there's only a group filter (no section), stay at group level (section cards view)
                this.lastExpandedGroup = this.contentFilterGroup;
                this.expandedGroups[this.contentFilterGroup] = true;
                this.showingMainMenu = false;
                this.showingSpecificSection = false;
                this.showingRevision = false;
            } else {
                // No filters set, go to main menu
                this.showingMainMenu = true;
                this.showingSpecificSection = false;
                this.showingRevision = false;
                this.lastExpandedGroup = null;
            }
            
            this.showingAnalytics = false;

            // Close test area when switching to audit
            if (this.closeTestArea) {
                this.closeTestArea();
            }
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
