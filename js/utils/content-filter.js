// js/utils/content-filter.js
// Shared filtering logic for notes, flashcards, and mindmaps
// Eliminates code duplication across filter modules

/**
 * Create content filter methods for a content type
 * Returns object with filter methods that work with shared state
 * @param {string} contentType - Type of content ('notes', 'flashcards', 'mindmaps')
 * @returns {Object} - Filter methods object
 */
export function createContentFilterMethods(contentType) {
    const capitalizedType = contentType.charAt(0).toUpperCase() + contentType.slice(1);

    return {
        /**
         * Set or toggle section filter
         * Uses shared contentFilterSection state
         * @param {string} sectionKey - The section key to filter by
         */
        [`set${capitalizedType}FilterSection`](sectionKey) {
            if (this.contentFilterSection === sectionKey) {
                // Toggle off if clicking the same section
                this.contentFilterSection = null;
            } else {
                // Set new section filter
                this.contentFilterSection = sectionKey;
                // Find and preserve the parent group if it exists
                const parentGroup = this.currentGroups.find(item =>
                    item.type === "group" && item.sections && item.sections.includes(sectionKey)
                );
                if (parentGroup) {
                    this.contentFilterGroup = parentGroup.title;
                    this.expandedGroups[parentGroup.title] = true;
                }
            }
            // Close note preview when navigating between sections
            if (this.notePreviewId) {
                this.notePreviewId = null;
            }
        },

        /**
         * Set or toggle group filter
         * Uses shared contentFilterGroup state
         * @param {string} groupTitle - The group title to filter by
         */
        [`set${capitalizedType}FilterGroup`](groupTitle) {
            if (this.contentFilterGroup === groupTitle) {
                // Toggle off if clicking the same group
                this.contentFilterGroup = null;
            } else {
                // Set new group filter
                this.contentFilterGroup = groupTitle;
                // Clear section filter only if the current section doesn't belong to this group
                if (this.contentFilterSection) {
                    const group = this.currentGroups.find(item =>
                        item.type === "group" && item.title === groupTitle
                    );
                    if (group && group.sections && !group.sections.includes(this.contentFilterSection)) {
                        // Section doesn't belong to this group, clear it
                        this.contentFilterSection = null;
                    }
                }
            }
            // Close note preview when navigating between groups
            if (this.notePreviewId) {
                this.notePreviewId = null;
            }
        },

        /**
         * Clear all filters
         * Uses shared contentFilter state
         */
        [`clear${capitalizedType}Filters`]() {
            this.contentFilterSection = null;
            this.contentFilterGroup = null;
        }
    };
}

/**
 * Study materials filter methods
 * Used to toggle between all/notes/flashcards/mindmaps views
 */
export const studyMaterialsFilterMethods = {
    /**
     * Sets the study materials filter (all, notes, flashcards, mindmaps)
     */
    setStudyMaterialsFilter(filter) {
        this.studyMaterialsFilter = filter;
    },

    /**
     * Checks if notes should be visible based on filter
     */
    shouldShowNotes() {
        return this.studyMaterialsFilter === 'all' || this.studyMaterialsFilter === 'notes';
    },

    /**
     * Checks if flashcards should be visible based on filter
     */
    shouldShowFlashcards() {
        return this.studyMaterialsFilter === 'all' || this.studyMaterialsFilter === 'flashcards';
    },

    /**
     * Checks if mindmaps should be visible based on filter
     */
    shouldShowMindmaps() {
        return this.studyMaterialsFilter === 'all' || this.studyMaterialsFilter === 'mindmaps';
    }
};
