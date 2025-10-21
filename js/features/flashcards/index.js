// js/features/flashcards/index.js
// Flashcards feature facade - combines all flashcard-related functionality

import { flashcardManagementMethods } from './management.js';
import { flashcardTestMethods } from './test.js';
import { studyMaterialsFilterMethods, flashcardsFilterMethods } from './filter.js';
import { flashcardsDisplayMethods } from './display.js';

// Combine all flashcard-related methods
export const flashcardMethods = {
    ...flashcardManagementMethods,
    ...flashcardTestMethods,
    ...studyMaterialsFilterMethods,
    ...flashcardsFilterMethods,
    ...flashcardsDisplayMethods
};
