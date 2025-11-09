// js/features/notes/filter.js
// Filtering logic for notes view
// Now uses shared contentFilter utility to eliminate code duplication

import { createContentFilterMethods } from '../../utils/content-filter.js';

// Export filter methods for notes (generated from shared utility)
export const notesFilterMethods = createContentFilterMethods('notes');
