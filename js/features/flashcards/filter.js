// js/features/flashcards/filter.js
// Filter methods for notes, flashcards, and mindmaps display
// Now uses shared contentFilter utility to eliminate code duplication

import { createContentFilterMethods, studyMaterialsFilterMethods } from '../../utils/content-filter.js';

// Export shared study materials filter methods (toggle between all/notes/flashcards/mindmaps)
export { studyMaterialsFilterMethods };

// Export filter methods for flashcards (generated from shared utility)
export const flashcardsFilterMethods = createContentFilterMethods('flashcards');
