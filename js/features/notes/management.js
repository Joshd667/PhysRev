// js/features/notes/management.js
// CRUD operations for user notes

export const noteManagementMethods = {
    /**
     * Opens the note editor modal for creating a new note
     * ⚡ OPTIMIZED: Lazy-loads template on first use (40 KB)
     */
    async openNoteEditor(sectionId = null, topicId = null) {
        // ⚡ Lazy-load note editor template (40 KB) on first use
        const { loadTemplateLazy } = await import('../../template-loader.js');
        await loadTemplateLazy('note-editor-modal-container', './templates/note-editor-modal.html');

        this.noteEditorMode = 'create';
        this.noteEditorSectionId = sectionId || this.currentRevisionSection;
        this.noteEditorTitle = '';
        this.noteEditorContent = '';
        this.noteEditorId = null;

        // Auto-assign tags from current context
        if (topicId) {
            // Single topic provided
            this.noteEditorTags = [topicId];
        } else if (this.currentRevisionTopics && this.currentRevisionTopics.length > 0) {
            // Multiple topics from revision view
            this.noteEditorTags = this.currentRevisionTopics.map(t => t.id);
        } else {
            this.noteEditorTags = [];
        }

        this.showNoteEditor = true;

        // Clear editor content after modal opens
        this.$nextTick(() => {
            const editor = document.getElementById('noteContentEditor');
            if (editor) {
                editor.innerHTML = '';
            }
            if (window.lucide) lucide.createIcons();
        });
    },

    /**
     * Opens the note editor modal for editing an existing note
     */
    editNote(noteId) {
        const note = this.userNotes[noteId];
        if (!note) {
            console.warn('Note not found:', noteId);
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
                editor.innerHTML = note.content;
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
            if (window.lucide) lucide.createIcons();
        });
    },

    /**
     * Closes the note editor modal
     */
    closeNoteEditor() {
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

            // ⚡ PERFORMANCE: Update search index
            this._addNoteToIndex(newNote);
        } else {
            // Update existing note
            if (this.userNotes[this.noteEditorId]) {
                this.userNotes[this.noteEditorId].title = this.noteEditorTitle.trim();
                this.userNotes[this.noteEditorId].content = content;
                this.userNotes[this.noteEditorId].tags = this.noteEditorTags;
                this.userNotes[this.noteEditorId].updatedAt = timestamp;

                // ⚡ PERFORMANCE: Update search index
                this._updateNoteInIndex(this.userNotes[this.noteEditorId]);
            }
        }

        // Save to localStorage
        this.saveNotes();

        // Close editor
        this.closeNoteEditor();

        // Refresh icons after save
        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
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

        return Object.values(this.userNotes || {})
            .filter(note => note.sectionId === this.currentRevisionSection)
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
