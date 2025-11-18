// js/features/notes/equation-editor.js
// Equation editor functionality for inserting mathematical formulas into notes
// Provides a user-friendly interface for A-Level students to create equations
// without needing to know LaTeX syntax

/**
 * Equation Editor Methods
 *
 * This module handles all equation-related functionality:
 * - Opening/closing the equation editor modal
 * - Rendering LaTeX previews with KaTeX
 * - Smart template insertion (fractions, trig, logs, etc.)
 * - Auto-conversion of shortcuts (/, *, ^) to LaTeX
 * - Inserting rendered equations into notes
 * - Editing existing equations via double-click
 */
export const equationEditorMethods = {
    /**
     * Open the equation editor modal.
     * Preserves the current selection in the main note editor.
     */
    openEquationEditor() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.noteEditorSelection = selection.getRangeAt(0);
        }
        this.equationLatex = '';
        this.equationEditorMode = 'note';
        this.showEquationEditor = true;
    },

    /**
     * Close the equation editor modal and clean up state.
     */
    closeEquationEditor() {
        this.showEquationEditor = false;
        this.equationLatex = '';
        this.equationEditorMode = 'note';
        this.equationTargetShape = null;
        this.noteEditorSelection = null;
    },

    /**
     * Render the LaTeX equation preview using KaTeX.
     * Gracefully handles incomplete or invalid syntax.
     *
     * @param {string} latex - The LaTeX string to render.
     * @returns {string} - The HTML string of the rendered equation or a placeholder message.
     */
    renderEquationPreview(latex) {
        if (!window.katex) return 'KaTeX not loaded';
        if (!latex.trim()) return '<span class="text-gray-400">Type to see preview...</span>';

        try {
            return katex.renderToString(latex, {
                throwOnError: false,  // Don't throw on errors, just show what we can
                displayMode: true,
                strict: false  // Be lenient with syntax
            });
        } catch (error) {
            // Fallback: show a gentle message instead of the raw error
            return `<span class="text-gray-400 text-sm">Keep typing...</span>`;
        }
    },

    /**
     * Insert a raw LaTeX template string into the equation input field.
     * Used for Greek letters and other simple symbols.
     *
     * @param {string} template - The LaTeX template to insert (e.g., '\\frac{num}{den}').
     */
    insertLatexTemplate(template) {
        const textarea = document.getElementById('latex-input');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + template + text.substring(end);
        this.equationLatex = newText;

        this.$nextTick(() => {
            const newPos = start + template.indexOf('{') + 1;
            if (newPos > start) {
                textarea.focus();
                textarea.setSelectionRange(newPos, newPos);
            }
        });
    },

    /**
     * Insert a smart template based on common A-Level math needs.
     * No LaTeX knowledge required - these are intuitive buttons.
     * Automatically positions the cursor in the right place.
     *
     * @param {string} type - The type of template (e.g., 'fraction', 'sin', 'log').
     */
    insertSmartTemplate(type) {
        const templates = {
            // Common Functions
            'fraction': '\\frac{}{}',
            'multiply': '\\times ',
            'power': '^{}',
            'squared': '^2',
            'sqrt': '\\sqrt{}',
            'standardform': '\\times 10^{}',

            // Trig Functions
            'sin': '\\sin(',
            'cos': '\\cos(',
            'tan': '\\tan(',
            'arcsin': '\\arcsin(',
            'arccos': '\\arccos(',
            'arctan': '\\arctan(',

            // Logs & Exponentials
            'log': '\\log(',
            'ln': '\\ln(',
            'exp': 'e^{}',
            'e': 'e',

            // Other
            'subscript': '_{}',
            'vector': '\\vec{}'
        };

        const template = templates[type];
        if (!template) return;

        const textarea = document.getElementById('latex-input');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        // Insert the template
        const newText = text.substring(0, start) + template + text.substring(end);
        this.equationLatex = newText;

        // Position cursor intelligently
        this.$nextTick(() => {
            textarea.focus();

            // For functions with parentheses, place cursor inside
            if (template.includes('(')) {
                const newPos = start + template.indexOf('(') + 1;
                textarea.setSelectionRange(newPos, newPos);
            }
            // For templates with braces, place cursor inside first brace
            else if (template.includes('{}')) {
                const newPos = start + template.indexOf('{') + 1;
                textarea.setSelectionRange(newPos, newPos);
            }
            // Otherwise, place cursor at the end
            else {
                const newPos = start + template.length;
                textarea.setSelectionRange(newPos, newPos);
            }
        });
    },

    /**
     * Handle input in the equation editor with smart auto-conversion.
     * Converts shortcuts like /, *, ^, x10^ into proper LaTeX automatically.
     * This makes it easy for students who don't know LaTeX.
     *
     * Auto-conversions:
     * - ^23 → ^{23} (multi-digit exponents)
     * - * → \times (multiplication symbol)
     * - a/b → \frac{a}{b} (fractions, after space)
     *
     * @param {Event} event - The input event from the textarea.
     */
    handleEquationInput(event) {
        const textarea = event.target;
        let cursorPos = textarea.selectionStart;
        let text = textarea.value;
        let textChanged = false;

        // Step 1: Convert multi-digit exponents to use braces
        // Match patterns like ^23 or ^-23 and convert to ^{23} or ^{-23}
        const exponentPattern = /\^(-?\d{2,})/g;
        let exponentMatches = [...text.matchAll(exponentPattern)];

        if (exponentMatches.length > 0) {
            // Work backwards to maintain positions
            for (let i = exponentMatches.length - 1; i >= 0; i--) {
                const match = exponentMatches[i];
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;
                const number = match[1];
                const replacement = `^{${number}}`;

                text = text.substring(0, matchStart) + replacement + text.substring(matchEnd);

                // Adjust cursor if it's after this change
                if (cursorPos > matchEnd) {
                    cursorPos += replacement.length - match[0].length;
                } else if (cursorPos === matchEnd) {
                    cursorPos = matchStart + replacement.length;
                }

                textChanged = true;
            }
        }

        // Step 2: Convert * to multiplication symbol
        const multiplyPattern = /\*(?!.*\\times)/g;
        let multiplyMatches = [...text.matchAll(multiplyPattern)];

        if (multiplyMatches.length > 0) {
            for (let i = multiplyMatches.length - 1; i >= 0; i--) {
                const match = multiplyMatches[i];
                const matchStart = match.index;
                const matchEnd = matchStart + 1;
                const replacement = '\\times ';

                // Only convert if cursor is at or past this position
                if (cursorPos >= matchEnd) {
                    text = text.substring(0, matchStart) + replacement + text.substring(matchEnd);

                    if (cursorPos > matchEnd) {
                        cursorPos += replacement.length - 1;
                    } else if (cursorPos === matchEnd) {
                        cursorPos = matchStart + replacement.length;
                    }

                    textChanged = true;
                }
            }
        }

        // Step 3: Convert simple fractions (a/b) to \frac{a}{b}
        // Only trigger after typing space or closing paren after the fraction
        const fractionPattern = /([a-zA-Z0-9.]+)\/([a-zA-Z0-9.]+)(?=[\s\)]|$)/g;
        let fractionMatches = [...text.matchAll(fractionPattern)];

        if (fractionMatches.length > 0) {
            for (let i = fractionMatches.length - 1; i >= 0; i--) {
                const match = fractionMatches[i];
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;
                const numerator = match[1];
                const denominator = match[2];
                const replacement = `\\frac{${numerator}}{${denominator}}`;

                text = text.substring(0, matchStart) + replacement + text.substring(matchEnd);

                if (cursorPos > matchEnd) {
                    cursorPos += replacement.length - match[0].length;
                } else if (cursorPos === matchEnd) {
                    cursorPos = matchStart + replacement.length;
                }

                textChanged = true;
            }
        }

        // Update the model if text changed
        if (textChanged) {
            this.equationLatex = text;
            this.$nextTick(() => {
                textarea.setSelectionRange(cursorPos, cursorPos);
            });
        }

        // Trigger reactivity update
        this.editorSelectionUpdate++;
    },

    /**
     * Handles double-clicks within the main note editor to edit equations.
     * When a user double-clicks an equation, it opens the editor with that equation.
     *
     * @param {Event} event - The double-click event.
     */
    handleEditorDoubleClick(event) {
        // Check if user clicked on an equation container
        const equationContainer = event.target.closest('.katex-container');
        if (equationContainer) {
            event.preventDefault();

            // Get the LaTeX source from the data attribute
            const latexSource = equationContainer.getAttribute('data-latex');

            if (latexSource) {
                // Select the entire equation container for replacement
                const range = document.createRange();
                range.selectNode(equationContainer);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                // Store the selection and open editor with the equation
                this.noteEditorSelection = range;
                this.equationLatex = latexSource;
                this.showEquationEditor = true;
            }
        }
    },

    /**
     * Insert the final, rendered equation into the main note editor.
     * The equation is wrapped in a non-editable container with the raw LaTeX
     * stored in a data attribute for future editing.
     *
     * Features:
     * - Renders equation with KaTeX
     * - Makes equation non-editable but selectable/deletable
     * - Stores original LaTeX for editing
     * - Adds subtle background for visibility
     * - Tooltip indicates double-click to edit
     */
    async insertEquation() {
        if (!this.equationLatex.trim()) {
            await this.showAlert('Please enter a formula.', 'Missing Formula');
            return;
        }

        const editor = document.getElementById('noteContentEditor');
        if (!editor) {
            console.error('Note editor not found');
            return;
        }

        // Ensure KaTeX is loaded
        if (!window.katex) {
            await this.showAlert('Equation renderer is not loaded. Please refresh the page and try again.', 'Renderer Not Loaded');
            return;
        }

        try {
            // Restore selection if we have one (for editing existing equations)
            if (this.noteEditorSelection) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this.noteEditorSelection);
            } else {
                // Fallback: focus at the end of the editor
                editor.focus();
                const range = document.createRange();
                range.selectNodeContents(editor);
                range.collapse(false);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }

            // Render the equation with KaTeX
            const renderedEquation = katex.renderToString(this.equationLatex, {
                throwOnError: false,
                displayMode: false
            });

            // Create a container for the equation to make it non-editable and easy to select/delete
            const equationHTML = `<span contenteditable="false" class="katex-container" data-latex="${this.equationLatex.replace(/"/g, '&quot;')}" style="display: inline-block; padding: 2px 5px; margin: 0 2px; cursor: pointer; background: rgba(168, 85, 247, 0.1); border-radius: 4px;" title="Double-click to edit">${renderedEquation}</span>&nbsp;`;

            // Insert the HTML
            // Note: execCommand return value is unreliable, especially with complex HTML
            // If no error is thrown, we consider it successful
            document.execCommand('insertHTML', false, equationHTML);

            // Close the editor modal
            this.closeEquationEditor();

            // Refocus on the editor after a brief delay
            setTimeout(() => {
                editor.focus();
            }, 100);

        } catch (error) {
            console.error('Error inserting equation:', error);
            await this.showAlert('Error inserting equation: ' + error.message, 'Equation Error');
        }
    }
};
