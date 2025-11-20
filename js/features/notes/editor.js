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
    },

    /**
     * Insert a table with specified rows and columns
     */
    insertTable(rows, cols) {
        const editor = document.getElementById('noteContentEditor');
        if (!editor) return;

        editor.focus();

        // Create table HTML with styled borders and editable cells
        let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 12px 0; table-layout: fixed;">';

        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                const width = Math.floor(100 / cols);
                tableHTML += `<td contenteditable="true" style="border: 1px solid #cbd5e1; padding: 8px; width: ${width}%; vertical-align: top;"><br></td>`;
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table><p><br></p>';

        // Insert the table at cursor position
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            const temp = document.createElement('div');
            temp.innerHTML = tableHTML;

            const frag = document.createDocumentFragment();
            let node;
            while ((node = temp.firstChild)) {
                frag.appendChild(node);
            }
            range.insertNode(frag);

            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // If no selection, append at end
            editor.innerHTML += tableHTML;
        }
    },

    /**
     * SECURITY: Handle paste events to sanitize content before insertion
     */
    handleEditorPaste(event) {
        event.preventDefault();

        // Get pasted content (try HTML first, fallback to plain text)
        let paste = '';
        if (event.clipboardData || window.clipboardData) {
            paste = (event.clipboardData || window.clipboardData).getData('text/html') ||
                    (event.clipboardData || window.clipboardData).getData('text/plain') ||
                    (event.clipboardData || window.clipboardData).getData('text');
        }

        if (!paste) return;

        // SECURITY: Sanitize before inserting
        const clean = this.sanitizeHTML(paste);

        // Insert at cursor using execCommand
        document.execCommand('insertHTML', false, clean);
    },

    /**
     * Escape HTML entities to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * Export note as HTML and open in new window for printing
     */
    exportNoteAsHTML() {
        const title = this.noteEditorTitle || 'Untitled Note';
        const escapedTitle = this.escapeHtml(title);
        let content = document.getElementById('noteContentEditor')?.innerHTML || '';

        // Clean up equations for export
        const tempDiv = document.createElement('div');
        // ✅ XSS FIX: Sanitize content before export
        if (window.DOMPurify) {
            tempDiv.innerHTML = DOMPurify.sanitize(content, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
                               'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
                               'code', 'pre', 'a', 'span', 'div', 'table', 'tr',
                               'td', 'th', 'thead', 'tbody'],
                ALLOWED_ATTR: ['href', 'style', 'class', 'id', 'data-latex', 'contenteditable', 'title'],
                ALLOWED_STYLES: {
                    '*': {
                        'color': [/.*/],
                        'background-color': [/.*/],
                        'font-size': [/.*/],
                        'text-align': [/.*/],
                        'font-weight': [/.*/],
                        'font-style': [/.*/],
                        'border-left': [/.*/],
                        'padding-left': [/.*/],
                        'margin': [/.*/],
                        'display': [/.*/]
                    }
                }
            });
        } else {
            tempDiv.innerHTML = content;
        }

        // Find all equation containers and clean them up
        const equations = tempDiv.querySelectorAll('.katex-container');
        equations.forEach(eq => {
            // Extract only the KaTeX rendered content (the .katex element)
            const katexContent = eq.querySelector('.katex');
            if (katexContent) {
                // Clone the KaTeX element to preserve it
                const cleanKatex = katexContent.cloneNode(true);

                // Remove all attributes from the cloned katex element that might cause issues
                cleanKatex.removeAttribute('data-latex');
                cleanKatex.removeAttribute('contenteditable');
                cleanKatex.removeAttribute('title');

                // Create a new span to wrap it cleanly
                const wrapper = document.createElement('span');
                wrapper.style.display = 'inline-block';
                wrapper.style.margin = '0 2px';
                wrapper.appendChild(cleanKatex);

                // Replace the entire container with the clean wrapper
                eq.parentNode.replaceChild(wrapper, eq);
            } else {
                // If no .katex element found, just remove the container
                eq.remove();
            }
        });

        content = tempDiv.innerHTML;

        // Create HTML document with styling
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapedTitle}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #1e293b;
        }
        h1 {
            color: #0f172a;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 12px;
            margin-bottom: 24px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }
        td, th {
            border: 1px solid #cbd5e1;
            padding: 8px;
        }
        blockquote {
            border-left: 4px solid #cbd5e1;
            padding-left: 16px;
            margin: 12px 0;
            color: #64748b;
            font-style: italic;
        }
        code {
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #dc2626;
        }
        @media print {
            body {
                margin: 0;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <h1>${escapedTitle}</h1>
    ${content}
</body>
</html>
        `;

        // Open in new window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Auto-focus for printing
            setTimeout(() => {
                printWindow.focus();
            }, 250);
        }
    }
};
