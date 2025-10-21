// js/features/mindmaps/filter.js
// Filtering logic for mindmaps view
// Now uses shared contentFilter utility to eliminate code duplication

import { createContentFilterMethods } from '../../utils/content-filter.js';

// Export filter methods for mindmaps (generated from shared utility)
export const mindmapsFilterMethods = createContentFilterMethods('mindmaps');
