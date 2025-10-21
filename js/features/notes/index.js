// js/features/notes/index.js
// User notes feature facade - combines all note-related functionality

import { noteManagementMethods } from './management.js';
import { noteEditorMethods } from './editor.js';
import { equationEditorMethods } from './equation-editor.js';
import { notesFilterMethods } from './filter.js';
import { notesDisplayMethods } from './display.js';

// Combine all notes-related methods
export const userNotesMethods = {
    ...noteManagementMethods,
    ...noteEditorMethods,
    ...equationEditorMethods,
    ...notesFilterMethods,
    ...notesDisplayMethods
};
