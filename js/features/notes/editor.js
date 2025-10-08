// js/features/notes/editor.js
// Rich text editor formatting and operations

export const noteEditorMethods = {
    /**
     * Rich text editor formatting commands
     */
    formatText(command, value = null) {
        const editor = document.getElementById('noteContentEditor');
        if (editor) {
            editor.focus();
            document.execCommand(command, false, value);
        }
    },

    /**
     * Change font size
     */
    changeFontSize(size) {
        this.formatText('fontSize', size);
    },

    /**
     * Change text color
     */
    changeTextColor(color) {
        this.formatText('foreColor', color);
    },

    /**
     * Change highlight/background color
     */
    changeHighlightColor(color) {
        if (color === 'transparent') {
            this.formatText('removeFormat'); // Remove background color
        } else {
            this.formatText('backColor', color);
        }
    },

    /**
     * Format block (headings, paragraph)
     */
    formatBlock(tag) {
        if (!tag) return;

        const editor = document.getElementById('noteContentEditor');
        if (editor) {
            editor.focus();
            document.execCommand('formatBlock', false, tag);
        }
    },

    /**
     * Insert a link
     */
    insertLink() {
        const url = prompt('Enter the URL:');
        if (url) {
            const editor = document.getElementById('noteContentEditor');
            if (editor) {
                editor.focus();
                document.execCommand('createLink', false, url);
            }
        }
    },

    /**
     * Insert blockquote
     */
    insertBlockquote() {
        const editor = document.getElementById('noteContentEditor');
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString() || 'Quote text here...';

        const blockquoteHTML = `<blockquote style="border-left: 4px solid #cbd5e1; padding-left: 16px; margin: 12px 0; color: #64748b; font-style: italic;">${selectedText}</blockquote>`;

        range.deleteContents();
        const temp = document.createElement('div');
        temp.innerHTML = blockquoteHTML;

        const frag = document.createDocumentFragment();
        let node;
        while ((node = temp.firstChild)) {
            frag.appendChild(node);
        }
        range.insertNode(frag);

        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    },

    /**
     * Insert code block
     */
    insertCode() {
        const editor = document.getElementById('noteContentEditor');
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString() || 'code here';

        const codeHTML = `<code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #dc2626;">${selectedText}</code>`;

        range.deleteContents();
        const temp = document.createElement('div');
        temp.innerHTML = codeHTML;

        const frag = document.createDocumentFragment();
        let node;
        while ((node = temp.firstChild)) {
            frag.appendChild(node);
        }
        range.insertNode(frag);

        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    },

    /**
     * Check if a formatting command is currently active
     */
    isFormatActive(command) {
        // Access editorSelectionUpdate to trigger reactivity
        const _ = this.editorSelectionUpdate;

        try {
            return document.queryCommandState(command);
        } catch (e) {
            return false;
        }
    }
};
