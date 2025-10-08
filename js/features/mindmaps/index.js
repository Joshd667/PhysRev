// js/features/mindmaps/index.js
// User mindmaps feature facade - combines all mindmap-related functionality

import { mindmapManagementMethods } from './management.js';
import { mindmapCanvasMethods } from './canvas.js';

// Combine all mindmap-related methods
export const mindmapMethods = {
    ...mindmapManagementMethods,
    ...mindmapCanvasMethods
};
