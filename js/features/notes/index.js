// js/features/notes/index.js
// User notes feature facade - combines all note-related functionality

import { noteManagementMethods } from './management.js';
import { noteEditorMethods } from './editor.js';

// Combine all notes-related methods
export const userNotesMethods = {
    ...noteManagementMethods,
    ...noteEditorMethods
};
