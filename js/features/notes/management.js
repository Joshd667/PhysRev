// js/features/notes/management.js
// CRUD operations for user notes

export const noteManagementMethods = {
    /**
     * Opens the note editor modal for creating a new note
     */
    openNoteEditor(sectionId = null) {
        this.noteEditorMode = 'create';
        this.noteEditorSectionId = sectionId || this.currentRevisionSection;
        this.noteEditorTitle = '';
        this.noteEditorContent = '';
        this.noteEditorId = null;
        this.showNoteEditor = true;

        // Clear editor content after modal opens
        this.$nextTick(() => {
            const editor = document.getElementById('noteContentEditor');
            if (editor) {
                editor.innerHTML = '';
            }
            if (window.lucide) {
                lucide.createIcons();
            }
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
        this.showNoteEditor = true;

        // Load content into editor
        this.$nextTick(() => {
            const editor = document.getElementById('noteContentEditor');
            if (editor) {
                editor.innerHTML = note.content;
            }
            if (window.lucide) {
                lucide.createIcons();
            }
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
    },

    /**
     * Saves the current note (create or update)
     */
    saveNote() {
        // Get content from contentEditable div
        const editor = document.getElementById('noteContentEditor');
        const content = editor ? editor.innerHTML : this.noteEditorContent;

        // Validation
        if (!this.noteEditorTitle.trim()) {
            alert('Please enter a title for your note');
            return;
        }

        if (!content.trim() || content.trim() === '<br>') {
            alert('Please enter some content for your note');
            return;
        }

        const timestamp = new Date().toISOString();

        if (this.noteEditorMode === 'create') {
            // Create new note
            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.userNotes[noteId] = {
                id: noteId,
                sectionId: this.noteEditorSectionId,
                title: this.noteEditorTitle.trim(),
                content: content,
                createdAt: timestamp,
                updatedAt: timestamp
            };
        } else {
            // Update existing note
            if (this.userNotes[this.noteEditorId]) {
                this.userNotes[this.noteEditorId].title = this.noteEditorTitle.trim();
                this.userNotes[this.noteEditorId].content = content;
                this.userNotes[this.noteEditorId].updatedAt = timestamp;
            }
        }

        // Save to localStorage
        this.saveData();

        // Close editor
        this.closeNoteEditor();

        // Refresh icons after save
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Deletes a user note
     */
    deleteNote(noteId) {
        const note = this.userNotes[noteId];
        if (!note) return;

        if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
            delete this.userNotes[noteId];
            this.saveData();
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
    }
};
