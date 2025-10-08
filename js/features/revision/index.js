// js/features/revision/index.js - Revision feature facade

import { revisionResourceMethods } from './resources.js';
import { revisionViewMethods } from './view.js';

// Combine all revision-related methods
export const revisionMethods = {
    ...revisionResourceMethods,
    ...revisionViewMethods
};
