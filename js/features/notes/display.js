// js/features/notes/display.js
// Display and grouping logic for notes view

import { logger } from '../../utils/logger.js';

export const notesDisplayMethods = {
    sortNotes(notes) {
        if (!Array.isArray(notes) || notes.length === 0) return notes;

        const sortMode = this.notesSort || 'updated';

        // Sort in place to avoid creating new arrays
        notes.sort((a, b) => {
            switch (sortMode) {
                case 'name':
                    return (a.title || '').localeCompare(b.title || '');
                case 'updated':
                default:
                    const dateA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
                    const dateB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
                    return dateB - dateA;
            }
        });

        return notes;
    },

    setNotePreview(noteId) {
        this.notePreviewId = noteId;
        this.$nextTick(() => {
            if (this.$refs && this.$refs.notePreviewArea) {
                try {
                    this.$refs.notePreviewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch (error) {
                    logger.warn('Could not scroll to note preview area:', error);
                }
            }
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    clearNotePreview() {
        this.notePreviewId = null;
    },

    getNotePreview() {
        if (!this.notePreviewId) {
            return null;
        }
        return this.userNotes ? this.userNotes[this.notePreviewId] || null : null;
    },

    getNoteSnippet(note, maxLength = 160) {
        if (!note || !note.content) {
            return '';
        }

        let text = '';

        if (typeof document !== 'undefined') {
            const temp = document.createElement('div');
            // ✅ XSS FIX: Sanitize user content before parsing
            // DOMPurify.sanitize with ALLOWED_TAGS:[] strips all HTML, keeps text only
            if (window.DOMPurify) {
                temp.innerHTML = DOMPurify.sanitize(note.content, {
                    ALLOWED_TAGS: [],        // Strip all HTML tags
                    KEEP_CONTENT: true       // Keep text content
                });
            } else {
                // Fallback if DOMPurify not loaded: strip tags with regex
                temp.textContent = note.content.replace(/<[^>]+>/g, ' ');
            }
            text = (temp.textContent || temp.innerText || '').replace(/\s+/g, ' ').trim();
        } else {
            text = note.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        if (!text) {
            return '';
        }

        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength).trim()}…`;
    },

    /**
     * Get notes grouped by group and section (hierarchical)
     * Filters by paper mode, group, or section based on current state
     * @returns {Array} Array of groups, each containing sections with their notes
     */
    getNotesGroupedBySection() {
        let notes = this.getAllNotes();

        // Filter by paper mode if in paper mode
        if (this.viewMode === 'paper' && this.selectedPaper) {
            // Get all topic IDs for the selected paper
            const paperTopicIds = [];
            this.currentGroups.forEach(item => {
                if (item.type === 'single') {
                    const sectionTopics = this.specificationData[item.key]?.topics?.map(t => t.id) || [];
                    paperTopicIds.push(...sectionTopics);
                } else if (item.type === 'group' && item.sections) {
                    item.sections.forEach(sectionKey => {
                        const sectionTopics = this.specificationData[sectionKey]?.topics?.map(t => t.id) || [];
                        paperTopicIds.push(...sectionTopics);
                    });
                }
            });
            notes = notes.filter(note =>
                note.tags && note.tags.some(tag => paperTopicIds.includes(tag))
            );
        }

        // If a group filter is active, only include notes from sections within that group
        // Uses shared contentFilterGroup state
        if (this.contentFilterGroup) {
            const groupItem = this.currentGroups.find(item => item.type === 'group' && item.title === this.contentFilterGroup);
            if (groupItem && groupItem.sections) {
                const groupTopicIds = [];
                groupItem.sections.forEach(sectionKey => {
                    const sectionTopics = this.specificationData[sectionKey]?.topics?.map(t => t.id) || [];
                    groupTopicIds.push(...sectionTopics);
                });
                notes = notes.filter(note =>
                    note.tags && note.tags.some(tag => groupTopicIds.includes(tag))
                );
            }
        }
        // If a section filter is active, only include notes tagged with topics from that section
        // Uses shared contentFilterSection state
        else if (this.contentFilterSection) {
            const sectionTopicIds = this.specificationData[this.contentFilterSection]?.topics?.map(t => t.id) || [];
            notes = notes.filter(note =>
                note.tags && note.tags.some(tag => sectionTopicIds.includes(tag))
            );
        }

        const groupMap = {};
        const pinnedNotes = [];

        // Group notes by their section, then organize sections into groups
        notes.forEach(note => {
            // If pinned, add to pinned notes
            // In list view, also add to regular sections (duplicate)
            // In card view, only show in pinned section (no duplicate)
            if (note.pinned) {
                pinnedNotes.push(note);
                // Skip adding to regular sections in card view
                if (this.notesViewMode === 'card') {
                    return;
                }
            }

            if (!note.tags || note.tags.length === 0) {
                // Add to "Untagged" group
                if (!groupMap['untagged']) {
                    groupMap['untagged'] = {
                        groupTitle: 'Untagged Notes',
                        groupIcon: 'file-text',
                        sections: {}
                    };
                }
                if (!groupMap['untagged'].sections['untagged']) {
                    groupMap['untagged'].sections['untagged'] = {
                        sectionName: 'untagged',
                        sectionTitle: 'Untagged',
                        sectionIcon: 'file-text',
                        sectionPaper: '',
                        notes: []
                    };
                }
                groupMap['untagged'].sections['untagged'].notes.push(note);
            } else {
                // Add to appropriate group and section based on tags
                note.tags.forEach(tagId => {
                    const topicInfo = this.topicLookup[tagId];
                    if (topicInfo) {
                        const sectionKey = topicInfo.sectionName;

                        // Find which group this section belongs to
                        let groupTitle = null;
                        let groupIcon = topicInfo.sectionIcon;

                        for (const group of this.currentGroups) {
                            if (group.type === 'group' && group.sections.includes(sectionKey)) {
                                groupTitle = group.title;
                                break;
                            }
                        }

                        // If no group found, create a default group
                        if (!groupTitle) {
                            groupTitle = topicInfo.sectionPaper || 'Other Topics';
                        }

                        // Create group if it doesn't exist
                        if (!groupMap[groupTitle]) {
                            groupMap[groupTitle] = {
                                groupTitle: groupTitle,
                                groupIcon: groupIcon,
                                sections: {}
                            };
                        }

                        // Create section within group if it doesn't exist
                        if (!groupMap[groupTitle].sections[sectionKey]) {
                            groupMap[groupTitle].sections[sectionKey] = {
                                sectionName: topicInfo.sectionName,
                                sectionTitle: topicInfo.sectionTitle,
                                sectionIcon: topicInfo.sectionIcon,
                                sectionPaper: topicInfo.sectionPaper,
                                notes: []
                            };
                        }

                        // Avoid duplicates in the same section
                        const section = groupMap[groupTitle].sections[sectionKey];
                        if (!section.notes.find(n => n.id === note.id)) {
                            section.notes.push(note);
                        }
                    }
                });
            }
        });

        // Sort notes using the selected sort method
        Object.values(groupMap).forEach(group => {
            Object.values(group.sections).forEach(section => {
                section.notes = this.sortNotes(section.notes);
            });
        });

        // Sort pinned notes using the selected sort method
        const sortedPinnedNotes = this.sortNotes(pinnedNotes);

        // Convert to array structure and sort
        const groupsArray = Object.values(groupMap).map(group => ({
            ...group,
            sections: Object.values(group.sections).sort((a, b) => {
                return a.sectionTitle.localeCompare(b.sectionTitle);
            })
        })).sort((a, b) => {
            if (a.groupTitle === 'Untagged Notes') return 1;
            if (b.groupTitle === 'Untagged Notes') return -1;
            return a.groupTitle.localeCompare(b.groupTitle);
        });

        // Add pinned notes section at the top (always show in list view, even if empty)
        if (this.notesViewMode === 'list' || sortedPinnedNotes.length > 0) {
            groupsArray.unshift({
                groupTitle: 'Pinned Notes',
                groupIcon: 'pin',
                sections: [{
                    sectionName: 'pinned',
                    sectionTitle: 'Pinned Notes',
                    sectionIcon: 'pin',
                    sectionPaper: '',
                    notes: sortedPinnedNotes
                }]
            });
        }

        return groupsArray;
    },

    /**
     * Export a saved note as HTML and open in new window for printing
     * @param {string} noteId - The ID of the note to export
     */
    exportSavedNoteAsHTML(noteId) {
        const note = this.userNotes[noteId];
        if (!note) {
            alert('Note not found');
            return;
        }

        const title = note.title || 'Untitled Note';
        let content = note.content || '';

        // Clean up equations for export
        const tempDiv = document.createElement('div');
        // ✅ XSS FIX: Sanitize user content before export
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
    <title>${title}</title>
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
    <h1>${title}</h1>
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
