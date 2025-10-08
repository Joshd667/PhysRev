// js/features/flashcards/filter.js
// Filter methods for notes, flashcards, and mindmaps display

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
