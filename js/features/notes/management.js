// js/features/notes/management.js
// CRUD operations for user notes

import { logger } from '../../utils/logger.js';

export const noteManagementMethods = {
    /**
     * Opens the note editor modal for creating a new note
     * ⚡ OPTIMIZED: Lazy-loads template on first use (40 KB)
     */
    async openNoteEditor(sectionId = null, topicId = null) {
        try {
            // ⚡ Lazy-load note editor template (40 KB) on first use
            const { loadTemplateLazy } = await import('../../template-loader.js');

            // 🛡️ SAFETY: Handle version mismatch during updates
            if (typeof loadTemplateLazy !== 'function') {
                logger.warn('⚠️ loadTemplateLazy not available - reloading to complete update');
                window.location.reload();
                return;
            }

            await loadTemplateLazy('note-editor-modal-container', './templates/note-editor-modal.html');
        } catch (error) {
            logger.error('❌ Failed to open note editor:', error);
            if (error.message && error.message.includes('not a function')) {
                logger.warn('🔄 Reloading to complete app update...');
                window.location.reload();
                return;
            }
            throw error;
        }

        this.noteEditorMode = 'create';
        this.noteEditorSectionId = sectionId || this.currentRevisionSection;
        this.noteEditorTitle = '';
        this.noteEditorContent = '';
        this.noteEditorId = null;

        // Auto-populate tags only when in Knowledge Audit revision mode
        if (this.showingRevision) {
            // In Knowledge Audit - auto-assign tags from current revision context
            if (topicId) {
                this.noteEditorTags = [topicId];
            } else if (this.currentRevisionTopics && this.currentRevisionTopics.length > 0) {
                this.noteEditorTags = this.currentRevisionTopics.map(t => t.id);
            } else {
                this.noteEditorTags = [];
            }
        } else {
            // Not in Knowledge Audit - don't auto-populate, user must manually select
            this.noteEditorTags = [];
        }

        this.showNoteEditor = true;

        // Clear editor content after modal opens
        this.$nextTick(() => {
            const editor = document.getElementById('noteContentEditor');
            if (editor) {
                editor.innerHTML = '';
            }
            if (window.refreshIconsDebounced) window.refreshIconsDebounced();
        });
    },

    /**
     * Opens the note editor modal for editing an existing note
     */
    editNote(noteId) {
        const note = this.userNotes[noteId];
        if (!note) {
            logger.warn('Note not found:', noteId);
            return;
        }

        this.noteEditorMode = 'edit';
        this.noteEditorSectionId = note.sectionId;
        this.noteEditorTitle = note.title;
        this.noteEditorContent = note.content;
        this.noteEditorId = noteId;
        this.noteEditorTags = [...(note.tags || [])]; // Copy the tags
        this.showNoteEditor = true;

        // Load content into editor
        this.$nextTick(() => {
            const editor = document.getElementById('noteContentEditor');
            if (editor) {
                // ✅ XSS FIX: Sanitize user content before loading into editor
                if (window.DOMPurify) {
                    editor.innerHTML = DOMPurify.sanitize(note.content, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
                                       'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
                                       'code', 'pre', 'a', 'span', 'div', 'table', 'tr',
                                       'td', 'th', 'thead', 'tbody'],
                        ALLOWED_ATTR: ['href', 'style', 'class', 'id', 'data-latex', 'contenteditable', 'title'],
                        ALLOWED_STYLES: {
                            '*': {
                                'color': [/^#[0-9A-Fa-f]{3,6}$/],
                                'background-color': [/^#[0-9A-Fa-f]{3,6}$/],
                                'font-size': [/^\d+(px|em|rem)$/],
                                'text-align': [/^(left|right|center|justify)$/],
                                'font-weight': [/^(normal|bold|\d{3})$/],
                                'font-style': [/^(normal|italic)$/],
                                'border-left': [/.*/],
                                'padding-left': [/.*/],
                                'margin': [/.*/]
                            }
                        }
                    });
                } else {
                    // Fallback if DOMPurify not loaded
                    editor.innerHTML = note.content;
                }
                // Render math in the editor after loading content
                if (window.renderMathInElement) {
                    window.renderMathInElement(editor, {
                        delimiters: [
                            {left: "$$", right: "$$", display: true},
                            {left: "\\(", right: "\\)", display: false},
                            {left: "\\[", right: "\\]", display: true}
                        ],
                        throwOnError: false
                    });
                }
            }
            if (window.refreshIconsDebounced) window.refreshIconsDebounced();
        });
    },

    /**
     * Closes the note editor modal with unsaved changes warning
     * @param {boolean} skipConfirmation - Skip the unsaved changes warning (e.g., after saving)
     */
    async closeNoteEditor(skipConfirmation = false) {
        // Check if there are unsaved changes (unless skipping confirmation)
        if (!skipConfirmation) {
            const editor = document.getElementById('noteContentEditor');
            const content = editor ? editor.innerHTML : this.noteEditorContent;
            const hasContent = this.noteEditorTitle.trim() ||
                              (content && content.trim() && content.trim() !== '<br>');

            if (hasContent) {
                const confirmed = await this.showConfirm(
                    'You have unsaved changes. Are you sure you want to close without saving?',
                    'Unsaved Changes'
                );

                if (!confirmed) {
                    return; // User cancelled, keep editor open
                }
            }
        }

        // Close and reset
        this.showNoteEditor = false;
        this.noteEditorMode = 'create';
        this.noteEditorSectionId = null;
        this.noteEditorTitle = '';
        this.noteEditorContent = '';
        this.noteEditorId = null;
        this.noteEditorTags = [];
    },

    /**
     * Saves the current note (create or update)
     */
    async saveNote() {
        // Get content from contentEditable div
        const editor = document.getElementById('noteContentEditor');
        const content = editor ? editor.innerHTML : this.noteEditorContent;

        // Validation
        if (!this.noteEditorTitle.trim()) {
            await this.showAlert('Please enter a title for your note', 'Missing Title');
            return;
        }

        if (!content.trim() || content.trim() === '<br>') {
            await this.showAlert('Please enter some content for your note', 'Missing Content');
            return;
        }

        // Require at least one tag
        if (!this.noteEditorTags || this.noteEditorTags.length === 0) {
            await this.showAlert('Please add at least one tag to your note', 'Missing Tags');
            return;
        }

        const timestamp = new Date().toISOString();

        if (this.noteEditorMode === 'create') {
            // Create new note
            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newNote = {
                id: noteId,
                sectionId: this.noteEditorSectionId,
                title: this.noteEditorTitle.trim(),
                content: content,
                tags: this.noteEditorTags,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            this.userNotes[noteId] = newNote;

            // Force reactivity by reassigning the object
            this.userNotes = { ...this.userNotes };

            // ⚡ PERFORMANCE: Update search index
            this._addNoteToIndex(newNote);
        } else {
            // Update existing note
            if (this.userNotes[this.noteEditorId]) {
                this.userNotes[this.noteEditorId].title = this.noteEditorTitle.trim();
                this.userNotes[this.noteEditorId].content = content;
                this.userNotes[this.noteEditorId].tags = this.noteEditorTags;
                this.userNotes[this.noteEditorId].updatedAt = timestamp;

                // Force reactivity by reassigning the object
                this.userNotes = { ...this.userNotes };

                // ⚡ PERFORMANCE: Update search index
                this._updateNoteInIndex(this.userNotes[this.noteEditorId]);
            }
        }

        // Save to localStorage
        this.saveNotes();

        // Close editor (skip confirmation since we just saved)
        this.closeNoteEditor(true);

        // Refresh icons after save
        this.$nextTick(() => {
            if (window.refreshIconsDebounced) window.refreshIconsDebounced();
        });
    },

    /**
     * Deletes a user note
     */
    async deleteNote(noteId) {
        const note = this.userNotes[noteId];
        if (!note) return;

        const confirmed = await this.showConfirm(
            `Are you sure you want to delete "${note.title}"?`,
            'Delete Note'
        );

        if (confirmed) {
            delete this.userNotes[noteId];

            // ⚡ PERFORMANCE: Update search index
            this._removeNoteFromIndex(noteId);

            this.saveNotes();
            if (this.notePreviewId === noteId) {
                this.notePreviewId = null;
            }
        }
    },

    /**
     * Gets all notes for the current revision section
     */
    getNotesForCurrentSection() {
        if (!this.currentRevisionSection) return [];
        if (!this.currentRevisionTopics || this.currentRevisionTopics.length === 0) return [];

        // Get topic IDs from current revision topics
        const topicIds = this.currentRevisionTopics.map(topic => topic.id);

        return Object.values(this.userNotes || {})
            .filter(note => {
                // Defensive: Ensure note exists and has valid ID (critical for Alpine x-for)
                if (!note || note.id === undefined || note.id === null) {
                    return false;
                }
                // Primary: Check if ANY tag matches ANY topic in the revision section
                if (note.tags && note.tags.length > 0) {
                    return note.tags.some(tag => topicIds.includes(tag));
                }
                // Fallback: For backward compatibility with old notes, check sectionId
                return note.sectionId === this.currentRevisionSection;
            })
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    /**
     * Toggles pin status of a note
     */
    toggleNotePin(noteId) {
        const note = this.userNotes[noteId];
        if (!note) return;

        note.pinned = !note.pinned;
        note.updatedAt = new Date().toISOString();

        // Force reactivity by reassigning the object
        this.userNotes = { ...this.userNotes };

        this.saveNotes();

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    }
};
