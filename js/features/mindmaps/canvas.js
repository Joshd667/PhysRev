// js/features/mindmaps/canvas.js
// Canvas implementation for mind maps

import { logger } from '../../utils/logger.js';

// ⚡ PERFORMANCE: Static defaults outside Alpine's reactive system to save memory
const DEFAULT_SHAPE_STYLES = {
    rectangle: { borderColor: '#1976d2', borderWidth: 2, borderRadius: '4px', fill: '#ffffff', opacity: 1 },
    rounded: { borderColor: '#388e3c', borderWidth: 2, borderRadius: '12px', fill: '#ffffff', opacity: 1 },
    circle: { borderColor: '#7b1fa2', borderWidth: 2, borderRadius: '50%', fill: '#ffffff', opacity: 1 },
    diamond: { borderColor: '#f57c00', borderWidth: 2, borderRadius: '0', fill: '#ffffff', opacity: 1 },
    hexagon: { borderColor: '#c2185b', borderWidth: 2, borderRadius: '0', fill: '#ffffff', opacity: 1 },
    ellipse: { borderColor: '#0097a7', borderWidth: 2, borderRadius: '50%', fill: '#ffffff', opacity: 1 }
};

const DEFAULT_TEXT_STYLE = {
    fontFamily: 'Arial',
    fontSize: 14,
    color: '#000000',
    backgroundColor: 'transparent',
    align: 'center',
    bold: false,
    italic: false
};

/**
 * Escape HTML entities to prevent XSS (fallback for when DOMPurify is unavailable)
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text safe for innerHTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

const DEFAULT_CONNECTOR_STYLE = {
    strokeColor: '#64748b',
    strokeWidth: 2,
    arrowType: 'arrow',
    lineStyle: 'solid',
    pathType: 'direct'
};

export const mindmapCanvasMethods = {
    // State - only minimal reactive state needed
    canvasZoom: 1,
    canvasPan: { x: 0, y: 0 },
    selectedShape: null,
    selectedConnection: null,
    draggedShape: null,
    dragStart: null,
    connectionDrag: null,
    isDraggingShape: false,
    draggedShapeType: null,
    editingShape: null,
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
    showGuides: false,
    rightPanelCollapsed: false,
    isPanningCanvas: false,
    keyMoveStarted: false,

    // Default shape colors (will be set from UI)
    defaultFillColor: '#ffffff',
    defaultBorderColor: '#1976d2',
    defaultBorderWidth: 2,

    // Event listener storage for cleanup
    canvasEventListeners: null,
    connectionGroupClickHandler: null,
    connectionPointHandler: null,
    resizeHandleHandler: null,

    // Undo/Redo (reduced from 50 to 20 to save memory)
    undoStack: [],
    redoStack: [],
    maxUndoSteps: 20,

    // Debounce timer for icon updates
    iconUpdateTimer: null,

    // Debounce timer for format updates
    formatUpdateTimer: null,

    // Getters for static defaults (non-reactive access)
    get shapeStyles() {
        return DEFAULT_SHAPE_STYLES;
    },
    get textStyle() {
        return DEFAULT_TEXT_STYLE;
    },
    get connectorStyle() {
        return DEFAULT_CONNECTOR_STYLE;
    },

    /**
     * Debounced icon update - prevents excessive DOM scanning
     */
    updateIconsDebounced() {
        if (this.iconUpdateTimer) {
            clearTimeout(this.iconUpdateTimer);
        }
        this.iconUpdateTimer = setTimeout(() => {
            if (window.lucide) lucide.createIcons();
        }, 100);
    },

    /**
     * Save state for undo
     */
    saveState() {
        // Only save if there are actual changes
        const state = JSON.stringify({
            nodes: this.mindmapEditorData.nodes,
            connections: this.mindmapEditorData.connections
        });

        // Don't save duplicate states
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === state) {
            return;
        }

        this.undoStack.push(state);
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift(); // Remove oldest state
        }

        // Clear redo stack and limit its size
        this.redoStack = [];
    },

    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length === 0) return;

        const currentState = JSON.stringify({
            nodes: this.mindmapEditorData.nodes,
            connections: this.mindmapEditorData.connections
        });
        this.redoStack.push(currentState);

        const prevState = JSON.parse(this.undoStack.pop());
        this.mindmapEditorData.nodes = prevState.nodes;
        this.mindmapEditorData.connections = prevState.connections;
        this.selectedShape = null;
        this.selectedConnection = null;
        this.renderShapes();
        this.renderConnections();
    },

    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) return;

        const currentState = JSON.stringify({
            nodes: this.mindmapEditorData.nodes,
            connections: this.mindmapEditorData.connections
        });
        this.undoStack.push(currentState);

        const nextState = JSON.parse(this.redoStack.pop());
        this.mindmapEditorData.nodes = nextState.nodes;
        this.mindmapEditorData.connections = nextState.connections;
        this.selectedShape = null;
        this.selectedConnection = null;
        this.renderShapes();
        this.renderConnections();
    },

    /**
     * Toggle right panel
     */
    toggleRightPanel() {
        this.rightPanelCollapsed = !this.rightPanelCollapsed;
    },

    /**
     * Initialize canvas interaction - automatic panning on background click
     * Uses CSS transforms for performance, not DOM re-rendering
     */
    initCanvasInteraction() {
        // Remove old listeners if they exist
        this.cleanupCanvasListeners();

        const canvas = document.getElementById('canvasDropZone');
        const shapesContainer = document.getElementById('shapesContainer');
        if (!canvas || !shapesContainer) return;

        // Event delegation for shape interactions
        this.shapeClickHandler = (e) => {
            const shapeEl = e.target.closest('.shape-element');
            if (!shapeEl) return;

            const shapeId = shapeEl.dataset.shapeId;
            const shape = this.mindmapEditorData.nodes.find(s => s.id === shapeId);
            if (!shape) return;

            // Don't interfere with connection points or resize handles
            if (e.target.closest('.connection-point') || e.target.closest('.resize-handle')) {
                return;
            }

            e.stopPropagation();

            // Check if near edge (simple calculation)
            const rect = shapeEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const edgeThreshold = 8;
            const nearEdge = x < edgeThreshold || x > rect.width - edgeThreshold ||
                           y < edgeThreshold || y > rect.height - edgeThreshold;

            if (!nearEdge) {
                // Clicking center - exit edit mode and deselect any previous shape/connection
                const isDifferentShape = !this.selectedShape || this.selectedShape.id !== shape.id;

                if (isDifferentShape) {
                    // Save and exit edit mode if currently editing
                    if (this.editingShape && this.editingShape._saveEditFn) {
                        this.editingShape._saveEditFn();
                    }

                    // Clear all selections and re-render to remove UI elements
                    this.selectedShape = null;
                    this.selectedConnection = null;
                    this.renderShapes();
                    this.renderConnections();
                }

                // Now select and edit the new shape
                this.selectedShape = shape;
                this.startInlineEdit(shape);
            } else {
                // Clicking edge - exit edit mode if editing, then select
                if (this.editingShape && this.editingShape._saveEditFn) {
                    this.editingShape._saveEditFn();
                }
                this.selectedShape = shape;
                this.selectedConnection = null; // Deselect any selected connection
                this.renderShapes();
                this.renderConnections();
            }
        };

        this.shapeMousedownHandler = (e) => {
            const shapeEl = e.target.closest('.shape-element');
            if (!shapeEl) return;

            const shapeId = shapeEl.dataset.shapeId;
            const shape = this.mindmapEditorData.nodes.find(s => s.id === shapeId);
            if (!shape) return;

            // Don't interfere with connection points or resize handles
            if (e.target.closest('.connection-point') || e.target.closest('.resize-handle')) {
                return;
            }

            // Check if near edge
            const rect = shapeEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const edgeThreshold = 8;
            const nearEdge = x < edgeThreshold || x > rect.width - edgeThreshold ||
                           y < edgeThreshold || y > rect.height - edgeThreshold;

            if (nearEdge) {
                e.preventDefault();
                this.startDragShape(shape, e);
            }
        };

        this.shapeMousemoveHandler = (e) => {
            const shapeEl = e.target.closest('.shape-element');
            if (!shapeEl) return;

            // Check if near edge and update cursor
            const rect = shapeEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const edgeThreshold = 8;
            const nearEdge = x < edgeThreshold || x > rect.width - edgeThreshold ||
                           y < edgeThreshold || y > rect.height - edgeThreshold;

            shapeEl.style.cursor = nearEdge ? 'move' : 'text';
        };

        shapesContainer.addEventListener('click', this.shapeClickHandler);
        shapesContainer.addEventListener('mousedown', this.shapeMousedownHandler);
        shapesContainer.addEventListener('mousemove', this.shapeMousemoveHandler);

        let startX, startY;
        let initialMouseX, initialMouseY;
        let hasMoved = false;
        let rafId = null;

        const updateTransforms = () => {
            const shapesContainer = document.getElementById('shapesContainer');
            const svg = document.getElementById('connectionsCanvas');

            if (shapesContainer) {
                shapesContainer.style.transform = `translate(${this.canvasPan.x}px, ${this.canvasPan.y}px) scale(${this.canvasZoom})`;
            }

            if (svg) {
                let group = svg.querySelector('g.connections-group');
                if (group) {
                    group.setAttribute('transform', `translate(${this.canvasPan.x}, ${this.canvasPan.y}) scale(${this.canvasZoom})`);
                }
            }
        };

        const onMouseDown = (e) => {
            // Only handle if clicking on background (not on shapes)
            // Check if click is on canvas background elements
            const isBackground = e.target.id === 'canvasDropZone' ||
                                e.target.tagName.toLowerCase() === 'svg' ||
                                (e.target.tagName.toLowerCase() === 'g' && e.target.classList.contains('connections-group')) ||
                                (e.target.tagName.toLowerCase() === 'rect' && e.target.parentElement?.id === 'grid');

            if (isBackground) {
                this.isPanningCanvas = true;
                startX = e.clientX - this.canvasPan.x;
                startY = e.clientY - this.canvasPan.y;
                initialMouseX = e.clientX;
                initialMouseY = e.clientY;
                hasMoved = false;
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const onMouseMove = (e) => {
            if (!this.isPanningCanvas) return;

            // Check if mouse has moved significantly
            const dx = Math.abs(e.clientX - initialMouseX);
            const dy = Math.abs(e.clientY - initialMouseY);
            if (dx > 3 || dy > 3) {
                hasMoved = true;
            }

            // Update pan position
            this.canvasPan.x = e.clientX - startX;
            this.canvasPan.y = e.clientY - startY;

            // Use requestAnimationFrame for smooth 60fps updates
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateTransforms);
        };

        const onMouseUp = (e) => {
            if (this.isPanningCanvas) {
                this.isPanningCanvas = false;
                canvas.style.cursor = 'default';

                // Cancel any pending animation frame
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }

                // If didn't move, treat as click to deselect
                if (!hasMoved) {
                    // Exit edit mode if currently editing
                    if (this.editingShape && this.editingShape._saveEditFn) {
                        this.editingShape._saveEditFn();
                    }

                    this.selectedShape = null;
                    this.selectedConnection = null;
                    this.renderShapes();
                    this.renderConnections();
                }
            }
        };

        // Store references for cleanup
        this.canvasEventListeners = {
            canvas: { element: canvas, type: 'mousedown', handler: onMouseDown },
            moveDoc: { element: document, type: 'mousemove', handler: onMouseMove },
            upDoc: { element: document, type: 'mouseup', handler: onMouseUp }
        };

        // Add listeners
        canvas.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Mouse wheel zoom centered on cursor
        const onWheel = (e) => {
            if (e.target.closest('#canvasDropZone') || e.target.closest('#shapesContainer') || e.target.closest('#connectionsCanvas')) {
                e.preventDefault();

                const canvas = document.getElementById('canvasDropZone');
                const rect = canvas.getBoundingClientRect();

                // Get mouse position relative to canvas
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Calculate world coordinates before zoom
                const worldX = (mouseX - this.canvasPan.x) / this.canvasZoom;
                const worldY = (mouseY - this.canvasPan.y) / this.canvasZoom;

                // Apply zoom
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                const newZoom = Math.max(0.2, Math.min(3, this.canvasZoom * zoomFactor));

                // Calculate new pan to keep the world point under the cursor
                this.canvasPan.x = mouseX - worldX * newZoom;
                this.canvasPan.y = mouseY - worldY * newZoom;
                this.canvasZoom = newZoom;

                const shapesContainer = document.getElementById('shapesContainer');
                const svg = document.getElementById('connectionsCanvas');

                if (shapesContainer) {
                    shapesContainer.style.transform = `translate(${this.canvasPan.x}px, ${this.canvasPan.y}px) scale(${this.canvasZoom})`;
                }
                if (svg) {
                    let group = svg.querySelector('g.connections-group');
                    if (group) {
                        group.setAttribute('transform', `translate(${this.canvasPan.x}, ${this.canvasPan.y}) scale(${this.canvasZoom})`);
                    }
                }
            }
        };

        // Keyboard controls
        const onKeyDown = (e) => {
            // Don't interfere if editing text - let normal text editing work
            if (this.editingShape) {
                return;
            }

            // Delete key - delete selected shape or connection (only when NOT editing)
            if (e.key === 'Delete' && (this.selectedShape || this.selectedConnection)) {
                e.preventDefault();
                this.deleteSelectedShape();
            }

            // Arrow keys - move selected shape
            if (this.selectedShape && !this.editingShape) {
                const moveAmount = e.shiftKey ? 10 : 1;
                let moved = false;

                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.selectedShape.x -= moveAmount;
                    moved = true;
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.selectedShape.x += moveAmount;
                    moved = true;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectedShape.y -= moveAmount;
                    moved = true;
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectedShape.y += moveAmount;
                    moved = true;
                }

                if (moved) {
                    if (!this.keyMoveStarted) {
                        this.saveState();
                        this.keyMoveStarted = true;
                    }
                    const shapeEl = document.querySelector(`[data-shape-id="${this.selectedShape.id}"]`);
                    if (shapeEl) {
                        shapeEl.style.left = `${this.selectedShape.x}px`;
                        shapeEl.style.top = `${this.selectedShape.y}px`;
                    }
                    this.renderConnections();
                }
            }
        };

        const onKeyUp = (e) => {
            if (e.key.startsWith('Arrow')) {
                this.keyMoveStarted = false;
            }
        };

        // Store references for cleanup
        this.canvasEventListeners.wheel = { element: canvas, type: 'wheel', handler: onWheel, options: { passive: false } };
        this.canvasEventListeners.keydown = { element: document, type: 'keydown', handler: onKeyDown };
        this.canvasEventListeners.keyup = { element: document, type: 'keyup', handler: onKeyUp };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    },

    /**
     * Clean up canvas event listeners
     */
    cleanupCanvasListeners() {
        if (this.canvasEventListeners) {
            Object.values(this.canvasEventListeners).forEach(({ element, type, handler, options }) => {
                if (element) {
                    if (options) {
                        element.removeEventListener(type, handler, options);
                    } else {
                        element.removeEventListener(type, handler);
                    }
                }
            });
            this.canvasEventListeners = null;
        }

        // Clean up shape event delegation listeners
        const shapesContainer = document.getElementById('shapesContainer');
        if (shapesContainer) {
            if (this.shapeClickHandler) shapesContainer.removeEventListener('click', this.shapeClickHandler);
            if (this.shapeMousedownHandler) shapesContainer.removeEventListener('mousedown', this.shapeMousedownHandler);
            if (this.shapeMousemoveHandler) shapesContainer.removeEventListener('mousemove', this.shapeMousemoveHandler);

            // ✅ Clean up new delegated event listeners
            if (this.connectionPointHandler) {
                shapesContainer.removeEventListener('mousedown', this.connectionPointHandler);
                this.connectionPointHandler = null;
            }
            if (this.resizeHandleHandler) {
                shapesContainer.removeEventListener('mousedown', this.resizeHandleHandler);
                this.resizeHandleHandler = null;
            }

            // Clear all shape elements to help garbage collection
            shapesContainer.innerHTML = '';
        }

        // Clean up connection group listener
        const svg = document.getElementById('connectionsCanvas');
        if (svg) {
            const group = svg.querySelector('g.connections-group');
            if (group && this.connectionGroupClickHandler) {
                group.removeEventListener('click', this.connectionGroupClickHandler);
            }
            // Clear all SVG content to help garbage collection
            svg.innerHTML = '';
        }

        // Clear handler references
        this.shapeClickHandler = null;
        this.shapeMousedownHandler = null;
        this.shapeMousemoveHandler = null;
        this.connectionGroupClickHandler = null;
    },

    /**
     * Update selected shape style
     */
    updateShapeStyle(property, value) {
        if (!this.selectedShape) return;

        this.saveState();

        if (property === 'fill' || property === 'borderColor' || property === 'borderWidth' ||
            property === 'borderRadius' || property === 'opacity') {
            this.selectedShape.style[property] = value;
        }

        this.renderShapes();
        this.renderConnections();
    },

    /**
     * Change selected shape type
     */
    changeShapeType(newType) {
        if (!this.selectedShape) return;

        this.saveState();

        // Update the shape type
        this.selectedShape.type = newType;

        // Update border radius based on shape type
        if (newType === 'rectangle') {
            this.selectedShape.style.borderRadius = '0px';
        } else if (newType === 'rounded') {
            this.selectedShape.style.borderRadius = '8px';
        } else if (newType === 'circle' || newType === 'ellipse') {
            this.selectedShape.style.borderRadius = '50%';
        }

        this.renderShapes();
        this.renderConnections();
    },

    /**
     * Update selected shape text style
     */
    updateTextStyle(property, value) {
        if (!this.selectedShape) return;

        this.saveState();

        if (!this.selectedShape.textStyle) {
            this.selectedShape.textStyle = { ...this.textStyle };
        }

        this.selectedShape.textStyle[property] = value;

        // If currently editing, update the live element's style instead of re-rendering
        if (this.editingShape && this.editingShape.id === this.selectedShape.id) {
            const shapeEl = document.querySelector(`[data-shape-id="${this.selectedShape.id}"] .shape-content`);
            if (shapeEl) {
                let editableEl;
                if (this.selectedShape.type === 'diamond') {
                    editableEl = shapeEl.querySelector('div');
                } else {
                    editableEl = shapeEl;
                }
                if (editableEl) {
                    if (property === 'fontSize') editableEl.style.fontSize = `${value}px`;
                    if (property === 'fontFamily') editableEl.style.fontFamily = value;
                    if (property === 'color') editableEl.style.color = value;
                    if (property === 'bold') editableEl.style.fontWeight = value ? 'bold' : 'normal';
                    if (property === 'italic') editableEl.style.fontStyle = value ? 'italic' : 'normal';
                    if (property === 'align') editableEl.style.textAlign = value;
                }
            }
        } else {
            this.renderShapes();
        }
    },

    /**
     * Save current text selection (non-reactive to avoid memory leaks)
     */
    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            // Clone the range to avoid it becoming invalid
            // Store in non-reactive property to avoid Alpine tracking DOM objects
            this._savedSelection = selection.getRangeAt(0).cloneRange();
        }
        // Update active format states with debouncing
        this.updateActiveFormats();
    },

    /**
     * Update active format states for toolbar buttons (debounced)
     */
    updateActiveFormats() {
        // Debounce to avoid excessive updates
        if (this.formatUpdateTimer) {
            clearTimeout(this.formatUpdateTimer);
        }

        this.formatUpdateTimer = setTimeout(() => {
            // Initialize if not exists
            if (!this._activeFormats) {
                this._activeFormats = {};
            }

            const formats = ['bold', 'italic', 'underline', 'strikeThrough',
                            'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];

            formats.forEach(format => {
                try {
                    this._activeFormats[format] = document.queryCommandState(format);
                } catch (e) {
                    this._activeFormats[format] = false;
                }
            });

            // Force Alpine to update if we have the reactive proxy
            this.$nextTick(() => {
                // Trigger a minimal update
                this.editingShape = this.editingShape;
            });
        }, 50); // 50ms debounce
    },

    /**
     * Restore saved text selection
     */
    restoreSelection() {
        if (this._savedSelection) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this._savedSelection);
        }
    },

    /**
     * Rich text editor formatting commands (from note editor)
     */
    formatText(command, value = null) {
        if (!this.editingShape) return;

        const shapeEl = document.querySelector(`[data-shape-id="${this.editingShape.id}"] .shape-content`);
        if (shapeEl) {
            let editableEl;
            if (this.editingShape.type === 'diamond') {
                editableEl = shapeEl.querySelector('div');
            } else {
                editableEl = shapeEl;
            }

            if (editableEl) {
                // Focus the element first
                editableEl.focus();

                // Restore the saved selection if we have one
                if (this._savedSelection) {
                    try {
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(this._savedSelection.cloneRange());
                    } catch (e) {
                        // Selection might be invalid, just continue
                        logger.warn('Could not restore selection:', e);
                    }
                }

                // Execute the command
                const success = document.execCommand(command, false, value);

                if (!success) {
                    logger.warn('execCommand failed for:', command);
                }

                // Save the new selection and update format states
                this.saveSelection();

                // Update the shape content immediately
                this.editingShape.content = editableEl.innerHTML;
            }
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
            this.formatText('removeFormat');
        } else {
            this.formatText('backColor', color);
        }
    },

    /**
     * Check if a format is active
     */
    isFormatActive(command) {
        try {
            return document.queryCommandState(command);
        } catch (e) {
            return false;
        }
    },

    /**
     * Update selected connector style
     */
    updateConnectorStyle(property, value) {
        if (!this.selectedConnection) return;

        this.saveState();

        if (!this.selectedConnection.style) {
            this.selectedConnection.style = { ...this.connectorStyle };
        }

        this.selectedConnection.style[property] = value;
        this.renderConnections();
        this.renderShapes(); // Re-render to update toolbar state
    },

    /**
     * Open equation editor for shape
     */
    openEquationEditorForShape(shape) {
        if (!shape) return;

        // Store reference to shape for equation insertion
        this.equationTargetShape = shape;

        // Open equation editor (reuse existing one)
        this.showEquationEditor = true;
        this.equationEditorMode = 'mindmap';
        this.equationLatex = '';

        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });
    },

    /**
     * Insert equation into shape
     */
    async insertEquationIntoShape(latex) {
        if (!this.equationTargetShape) {
            logger.error('No target shape for equation');
            return;
        }

        if (!latex || !latex.trim()) {
            await this.showAlert('Please enter a formula.', 'Missing Formula');
            return;
        }

        // Ensure KaTeX is loaded
        if (!window.katex) {
            await this.showAlert('Equation renderer is not loaded. Please refresh the page and try again.', 'Renderer Not Loaded');
            return;
        }

        this.saveState();

        // Store the shape reference
        const targetShape = this.equationTargetShape;

        try {
            // Render the equation with KaTeX
            const renderedEquation = katex.renderToString(latex, {
                throwOnError: false,
                displayMode: false
            });

            // Create equation HTML with container and zero-width spaces for cursor navigation
            const equationHtml = `\u200B<span contenteditable="false" class="katex-container" data-latex="${latex.replace(/"/g, '&quot;')}" style="display: inline; padding: 2px 5px; margin: 0 2px; background: rgba(168, 85, 247, 0.1); border-radius: 4px;">${renderedEquation}</span>\u200B`;

            // If currently editing, append to the shape content directly
            // (We can't use window.getSelection() because the cursor is in the equation editor, not the shape)
            if (this.editingShape && this.editingShape.id === targetShape.id) {
                // Simply append to the end of the current content
                if (targetShape.content) {
                    targetShape.content += equationHtml;
                } else {
                    targetShape.content = equationHtml;
                }

                // Update the DOM element to reflect the new content
                const shapeEl = document.querySelector(`[data-shape-id="${targetShape.id}"] .shape-content`);
                if (shapeEl) {
                    let editableEl;
                    if (targetShape.type === 'diamond') {
                        editableEl = shapeEl.querySelector('div');
                    } else {
                        editableEl = shapeEl;
                    }
                    if (editableEl) {
                        editableEl.innerHTML = targetShape.content;
                    }
                }
            } else {
                // Not editing, append to end
                if (targetShape.content) {
                    targetShape.content += equationHtml;
                } else {
                    targetShape.content = equationHtml;
                }
            }

            this.equationTargetShape = null;
            this.showEquationEditor = false;
            this.equationLatex = '';
            this.renderShapes();
            this.renderConnections();

        } catch (error) {
            logger.error('Error inserting equation:', error);
            await this.showAlert('Error inserting equation: ' + error.message, 'Equation Error');
        }
    },

    /**
     * Create new diagram
     */
    async newDiagram() {
        if (this.mindmapEditorData.nodes.length > 0) {
            const confirmed = await this.showConfirm(
                'Create new diagram? Current work will be lost if not saved.',
                'New Diagram'
            );

            if (!confirmed) {
                return;
            }
        }

        this.mindmapEditorData.nodes = [];
        this.mindmapEditorData.connections = [];
        this.mindmapEditorData.viewport = { x: 0, y: 0, scale: 1 };
        this.selectedShape = null;
        this.selectedConnection = null;
        this.undoStack = [];
        this.redoStack = [];
        this.renderShapes();
        this.renderConnections();
    },

    /**
     * Initialize canvas
     */
    initMindmapCanvas() {
        if (!this.mindmapEditorData.viewport) {
            this.mindmapEditorData.viewport = { x: 0, y: 0, scale: 1 };
        }

        // Reset state
        this.selectedShape = null;
        this.selectedConnection = null;
        this.editingShape = null;
        this.connectionDrag = null;

        this.canvasZoom = this.mindmapEditorData.viewport.scale || 1;
        this.canvasPan = { x: 0, y: 0 };

        this.renderShapes();
        this.renderConnections();
        this.initCanvasInteraction();

        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });
    },

    /**
     * Clean up - remove all event listeners and clear state
     */
    cleanupMindmapCanvas() {
        // Remove event listeners
        this.cleanupCanvasListeners();

        // Clear any pending timers
        if (this.iconUpdateTimer) {
            clearTimeout(this.iconUpdateTimer);
            this.iconUpdateTimer = null;
        }
        if (this.formatUpdateTimer) {
            clearTimeout(this.formatUpdateTimer);
            this.formatUpdateTimer = null;
        }

        // Clear state
        this.selectedShape = null;
        this.draggedShape = null;
        this.connectionDrag = null;
        this.editingShape = null;
        this.isPanningCanvas = false;
        this.selectedConnection = null;
        this.equationTargetShape = null;

        // Clear non-reactive properties to prevent memory leaks
        this._savedSelection = null;
        this._activeFormats = null;

        // Clear function references stored on shapes to prevent memory leaks
        if (this.mindmapEditorData && this.mindmapEditorData.nodes) {
            this.mindmapEditorData.nodes.forEach(shape => {
                if (shape._saveEditFn) {
                    delete shape._saveEditFn;
                }
            });
        }

        // Clear undo/redo to free memory
        this.undoStack = [];
        this.redoStack = [];

        // Reset zoom and pan
        this.canvasZoom = 1;
        this.canvasPan = { x: 0, y: 0 };
    },

    /**
     * Handle shape drag start from sidebar
     */
    handleShapeDragStart(event, shapeType) {
        this.draggedShapeType = shapeType;
        this.isDraggingShape = true;
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('shapeType', shapeType);
    },

    /**
     * Handle shape drag end
     */
    handleShapeDragEnd(event) {
        this.isDraggingShape = false;
        this.draggedShapeType = null;
    },

    /**
     * Handle canvas drag over
     */
    handleCanvasDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    },

    /**
     * Handle canvas drag leave
     */
    handleCanvasDragLeave(event) {
        // Only if leaving the canvas area entirely
        if (event.target.id === 'canvasDropZone') {
            this.isDraggingShape = false;
        }
    },

    /**
     * Handle canvas drop
     */
    handleCanvasDrop(event) {
        event.preventDefault();
        this.isDraggingShape = false;

        const shapeType = event.dataTransfer.getData('shapeType');
        if (!shapeType) return;

        const dropZone = document.getElementById('canvasDropZone');
        const rect = dropZone.getBoundingClientRect();

        let x = event.clientX - rect.left - 75; // Center shape (150px width / 2)
        let y = event.clientY - rect.top - 50;   // Center shape (100px height / 2)

        // Snap to grid
        if (this.snapToGrid) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }

        this.addShapeAtPosition(shapeType, x, y);
    },

    /**
     * Add shape at specific position
     */
    addShapeAtPosition(shapeType, x, y) {
        // Exit editing mode if currently editing - but don't call renderShapes yet
        if (this.editingShape) {
            const editableEl = document.querySelector(`[data-shape-id="${this.editingShape.id}"] .shape-content [contenteditable="true"]`) ||
                             document.querySelector(`[data-shape-id="${this.editingShape.id}"] .shape-content[contenteditable="true"]`);
            if (editableEl) {
                this.editingShape.content = editableEl.innerHTML;
                editableEl.contentEditable = 'false';
            }
            this.editingShape = null;
            this._savedSelection = null;
            if (this._activeFormats) {
                this._activeFormats = {};
            }
        }

        this.saveState();

        const style = JSON.parse(JSON.stringify(this.shapeStyles[shapeType] || this.shapeStyles.rectangle));

        // Apply default colors if available
        if (this.defaultFillColor !== undefined) {
            style.fill = this.defaultFillColor;
        }
        if (this.defaultBorderColor !== undefined) {
            style.borderColor = this.defaultBorderColor;
        }
        if (this.defaultBorderWidth !== undefined) {
            style.borderWidth = this.defaultBorderWidth;
        }

        const newShape = {
            id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: shapeType,
            x: x,
            y: y,
            width: 150,
            height: 100,
            content: '',
            style: style,
            textStyle: { ...this.textStyle }
        };

        this.mindmapEditorData.nodes.push(newShape);

        // Select the new shape for moving (NOT editing)
        this.selectedShape = newShape;
        this.selectedConnection = null;

        // Single render call at the end
        this.renderShapes();
        this.renderConnections();

        // Don't start editing immediately - shape is selected for moving
        // User can click on the box to start editing
    },

    /**
     * Render all shapes
     */
    renderShapes() {
        const container = document.getElementById('shapesContainer');
        if (!container) {
            logger.warn('shapesContainer not found!');
            return;
        }

        // DON'T destroy DOM if currently editing - this causes cursor jump and memory leaks
        // EXCEPTION: If dragging a connection, we need to add connection points to all shapes
        // EXCEPTION: If there are new shapes, we need to add them to the DOM
        if (this.editingShape && !this.connectionDrag) {
            // Check if there are new shapes that need to be added
            const existingShapeIds = new Set();
            container.querySelectorAll('.shape-element').forEach(el => {
                existingShapeIds.add(el.dataset.shapeId);
            });

            // Add any new shapes that aren't in the DOM yet
            let hasNewShapes = false;
            this.mindmapEditorData.nodes.forEach(shape => {
                if (!existingShapeIds.has(shape.id)) {
                    const shapeEl = this.createShapeElement(shape);
                    container.appendChild(shapeEl);
                    hasNewShapes = true;
                }
            });

            // If we added new shapes, ensure transform is applied and update connections
            if (hasNewShapes) {
                // Make sure container has correct transform
                container.style.transform = `translate(${this.canvasPan.x}px, ${this.canvasPan.y}px) scale(${this.canvasZoom})`;
                container.style.transformOrigin = '0 0';
                // Update icons for new shapes
                this.$nextTick(() => {
                    if (window.lucide) lucide.createIcons();
                });
                this.renderConnections();
            }

            return;
        }

        // If we just exited editing mode, do a full re-render to update selection states
        // This happens when editingShape is null but we were just editing

        // If editing and dragging connection, only add connection points without re-rendering
        if (this.editingShape && this.connectionDrag) {
            // Add connection points to all existing shape elements
            this.mindmapEditorData.nodes.forEach(shape => {
                const shapeEl = document.querySelector(`[data-shape-id="${shape.id}"]`);
                if (shapeEl) {
                    // Remove existing connection points
                    shapeEl.querySelectorAll('.connection-point').forEach(el => el.remove());
                    // Add new ones with drag styling
                    this.addConnectionPoints(shapeEl, shape);
                }
            });
            return;
        }

        // Apply zoom and pan transforms
        container.style.transform = `translate(${this.canvasPan.x}px, ${this.canvasPan.y}px) scale(${this.canvasZoom})`;
        container.style.transformOrigin = '0 0';

        container.innerHTML = '';

        this.mindmapEditorData.nodes.forEach(shape => {
            const shapeEl = this.createShapeElement(shape);
            container.appendChild(shapeEl);
        });
        // Icons will be recreated by watchers - no need to call here
    },

    /**
     * Create shape element
     */
    createShapeElement(shape) {
        const div = document.createElement('div');
        div.className = 'shape-element';
        div.dataset.shapeId = shape.id;
        div.style.position = 'absolute';
        div.style.left = `${shape.x}px`;
        div.style.top = `${shape.y}px`;
        div.style.width = `${shape.width}px`;
        div.style.height = `${shape.height}px`;
        div.style.cursor = 'text';
        div.style.userSelect = 'none';
        div.style.pointerEvents = 'auto'; // Re-enable pointer events for shapes

        // Validate and ensure colors have proper values
        if (!shape.style.fill || shape.style.fill === '') {
            shape.style.fill = '#ffffff';
        }
        if (!shape.style.borderColor || shape.style.borderColor === '') {
            shape.style.borderColor = '#1976d2';
        }
        if (!shape.style.borderWidth || shape.style.borderWidth === '') {
            shape.style.borderWidth = 2;
        }

        // Create content wrapper
        const content = document.createElement('div');
        const textStyle = shape.textStyle || this.textStyle;
        content.className = 'shape-content';
        content.style.width = '100%';
        content.style.height = '100%';
        content.style.backgroundColor = shape.style.fill;
        content.style.border = `${shape.style.borderWidth}px solid ${shape.style.borderColor}`;
        content.style.borderRadius = shape.style.borderRadius;
        content.style.opacity = shape.style.opacity || 1;
        content.style.display = 'block';
        content.style.padding = '8px';
        content.style.fontSize = `${textStyle.fontSize}px`;
        content.style.fontFamily = textStyle.fontFamily;
        content.style.color = textStyle.color;
        content.style.fontWeight = textStyle.bold ? 'bold' : 'normal';
        content.style.fontStyle = textStyle.italic ? 'italic' : 'normal';
        content.style.textAlign = textStyle.align;
        content.style.overflow = 'hidden';
        content.style.wordWrap = 'break-word';
        content.style.whiteSpace = 'pre-wrap';
        content.style.wordBreak = 'break-word';
        content.style.overflowWrap = 'break-word';
        content.style.transition = 'box-shadow 0.2s';
        // Use flex on the parent div for centering
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';

        // Apply shape-specific styling
        if (shape.type === 'diamond') {
            content.style.transform = 'rotate(45deg)';
            const inner = document.createElement('div');
            inner.style.transform = 'rotate(-45deg)';
            inner.style.width = '100%';
            inner.style.height = '100%';
            inner.style.display = 'flex';
            inner.style.alignItems = 'center';
            inner.style.justifyContent = 'center';
            // ✅ XSS FIX: Sanitize user content in mindmap shapes
            if (window.DOMPurify) {
                inner.innerHTML = DOMPurify.sanitize(shape.content || '', {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span'],
                    ALLOWED_ATTR: ['style'],
                    ALLOWED_STYLES: {
                        '*': {
                            'color': [/^#[0-9A-Fa-f]{3,6}$/],
                            'font-size': [/^\d+px$/],
                            'font-weight': [/^(normal|bold)$/],
                            'font-style': [/^(normal|italic)$/]
                        }
                    }
                });
            } else {
                // ✅ XSS FIX: Use escapeHtml as fallback when DOMPurify unavailable
                inner.textContent = escapeHtml(shape.content || '');
            }
            content.appendChild(inner);
        } else if (shape.type === 'hexagon') {
            content.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
            // ✅ XSS FIX: Sanitize user content in mindmap shapes
            if (window.DOMPurify) {
                content.innerHTML = DOMPurify.sanitize(shape.content || '', {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span'],
                    ALLOWED_ATTR: ['style'],
                    ALLOWED_STYLES: {
                        '*': {
                            'color': [/^#[0-9A-Fa-f]{3,6}$/],
                            'font-size': [/^\d+px$/],
                            'font-weight': [/^(normal|bold)$/],
                            'font-style': [/^(normal|italic)$/]
                        }
                    }
                });
            } else {
                // ✅ XSS FIX: Use escapeHtml as fallback when DOMPurify unavailable
                content.textContent = escapeHtml(shape.content || '');
            }
        } else {
            // ✅ XSS FIX: Sanitize user content in mindmap shapes
            if (window.DOMPurify) {
                content.innerHTML = DOMPurify.sanitize(shape.content || '', {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span'],
                    ALLOWED_ATTR: ['style'],
                    ALLOWED_STYLES: {
                        '*': {
                            'color': [/^#[0-9A-Fa-f]{3,6}$/],
                            'font-size': [/^\d+px$/],
                            'font-weight': [/^(normal|bold)$/],
                            'font-style': [/^(normal|italic)$/]
                        }
                    }
                });
            } else {
                // ✅ XSS FIX: Use escapeHtml as fallback when DOMPurify unavailable
                content.textContent = escapeHtml(shape.content || '');
            }
        }

        // Highlight if selected
        if ((this.selectedShape && this.selectedShape.id === shape.id) || (this.editingShape && this.editingShape.id === shape.id)) {
            content.style.boxShadow = '0 0 0 2px #1976d2';
            // Only add handles if not currently editing (handles are added manually in startInlineEdit)
            if (!this.editingShape || this.editingShape.id !== shape.id) {
                this.addConnectionPoints(div, shape);
                this.addResizeHandles(div, shape);
            }
        } else if (this.connectionDrag) {
            // Show connection points on all shapes when drawing a connection
            this.addConnectionPoints(div, shape);
        }

        div.appendChild(content);
        return div;
    },

    /**
     * Select a shape
     */
    selectShape(shape) {
        this.selectedShape = shape;
        // Only re-render if not currently editing
        if (!this.editingShape) {
            this.renderShapes();
        }
    },

    /**
     * Start inline editing
     */
    startInlineEdit(shape) {
        // Initialize format tracking before setting editingShape (prevents Alpine template errors)
        if (!this._activeFormats) {
            this._activeFormats = {
                bold: false,
                italic: false,
                underline: false,
                strikeThrough: false,
                justifyLeft: false,
                justifyCenter: false,
                justifyRight: false,
                justifyFull: false
            };
        }

        this.editingShape = shape;
        this.selectedShape = shape;

        // Wait for Alpine to render toolbar
        this.$nextTick(() => {
            // Then wait again for DOM to be ready and create icons
            this.$nextTick(() => {
                if (window.lucide) lucide.createIcons();

                // Find the element after icons are created
                const shapeEl = document.querySelector(`[data-shape-id="${shape.id}"] .shape-content`);
                if (!shapeEl) return;

                // Make content editable
                let editableEl;
                if (shape.type === 'diamond') {
                    editableEl = shapeEl.querySelector('div');
                } else {
                    editableEl = shapeEl;
                }

                editableEl.contentEditable = 'true';
                editableEl.setAttribute('id', `shape-content-${shape.id}`);
                editableEl.setAttribute('name', `shape-content-${shape.id}`);

                // Close color/highlight pickers when text area gets focus
                const closePickers = () => {
                    this.showColorPicker = false;
                    this.showHighlightPicker = false;
                };
                editableEl.addEventListener('focus', closePickers);
                editableEl.addEventListener('click', closePickers);

                // Save selection whenever it changes
                const saveSelectionOnChange = () => {
                    this.saveSelection();
                };
                editableEl.addEventListener('mouseup', saveSelectionOnChange);
                editableEl.addEventListener('keyup', saveSelectionOnChange);
                editableEl.addEventListener('touchend', saveSelectionOnChange);

                editableEl.focus();

                // Initial format state check
                this.$nextTick(() => {
                    this.updateActiveFormats();
                });

                // Add connection points and resize handles during editing
                const shapeWrapper = document.querySelector(`[data-shape-id="${shape.id}"]`);
                if (shapeWrapper) {
                    // Remove existing handles if any
                    shapeWrapper.querySelectorAll('.connection-point, .resize-handle').forEach(el => el.remove());
                    // Add them fresh
                    this.addConnectionPoints(shapeWrapper, shape);
                    this.addResizeHandles(shapeWrapper, shape);
                    // Add blue border to content
                    shapeEl.style.boxShadow = '0 0 0 2px #1976d2';
                }

                // Handle special keys while editing
                const keydownHandler = (e) => {
                    if (e.key === 'Escape') {
                        if (shape._saveEditFn) {
                            shape._saveEditFn();
                        }
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                        // Stop propagation so document handler doesn't delete the shape
                        e.stopPropagation();
                    }
                    // Let Enter and other keys work naturally - don't prevent default
                };

                const saveEdit = () => {
                    shape.content = editableEl.innerHTML;
                    editableEl.contentEditable = 'false';
                    editableEl.removeEventListener('keydown', keydownHandler);
                    editableEl.removeEventListener('focus', closePickers);
                    editableEl.removeEventListener('click', closePickers);
                    editableEl.removeEventListener('mouseup', saveSelectionOnChange);
                    editableEl.removeEventListener('keyup', saveSelectionOnChange);
                    editableEl.removeEventListener('touchend', saveSelectionOnChange);
                    this.editingShape = null;
                    this._savedSelection = null; // Clear saved selection
                    if (this._activeFormats) {
                        this._activeFormats = {}; // Clear active format states
                    }
                    this.renderShapes();
                };

                // Store saveEdit function on the shape for later access
                shape._saveEditFn = saveEdit;

                // Don't use blur - it fires when clicking toolbar
                // Instead, we'll handle exit in the global click handler
                editableEl.addEventListener('keydown', keydownHandler);
            });
        });
    },

    /**
     * Start dragging a shape
     */
    startDragShape(shape, event) {
        this.draggedShape = shape;

        // Convert mouse position from screen space to canvas space
        const canvas = document.getElementById('canvasDropZone');
        const rect = canvas.getBoundingClientRect();
        const canvasMouseX = (event.clientX - rect.left - this.canvasPan.x) / this.canvasZoom;
        const canvasMouseY = (event.clientY - rect.top - this.canvasPan.y) / this.canvasZoom;

        // Store offset between mouse position (in canvas space) and shape position
        this.dragStart = {
            x: canvasMouseX - shape.x,
            y: canvasMouseY - shape.y
        };

        let hasMoved = false;

        // Get the shape element once
        const shapeEl = document.querySelector(`[data-shape-id="${shape.id}"]`);
        if (!shapeEl) return;

        let rafId = null;
        const onMouseMove = (e) => {
            if (!hasMoved) {
                this.saveState();
                hasMoved = true;
            }
            if (!this.draggedShape) return;

            // Convert mouse position from screen space to canvas space
            const canvasMouseX = (e.clientX - rect.left - this.canvasPan.x) / this.canvasZoom;
            const canvasMouseY = (e.clientY - rect.top - this.canvasPan.y) / this.canvasZoom;

            let newX = canvasMouseX - this.dragStart.x;
            let newY = canvasMouseY - this.dragStart.y;

            // Snap to grid
            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }

            this.draggedShape.x = newX;
            this.draggedShape.y = newY;

            // Update position directly via CSS instead of re-rendering entire DOM
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                shapeEl.style.left = `${newX}px`;
                shapeEl.style.top = `${newY}px`;
                // Only update connections, not shapes
                this.renderConnections();
            });
        };

        const onMouseUp = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            this.draggedShape = null;
            this.dragStart = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Final render to ensure everything is in sync
            this.renderConnections();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },

    /**
     * Add connection points
     */
    addConnectionPoints(shapeEl, shape) {
        const isDraggingConnection = !!this.connectionDrag;
        const isSource = isDraggingConnection && this.connectionDrag.fromShape.id === shape.id;

        const positions = [
            { pos: 'top', x: '50%', y: '-8px', transform: 'translate(-50%, 0)' },
            { pos: 'right', x: 'calc(100% + 8px)', y: '50%', transform: 'translate(0, -50%)' },
            { pos: 'bottom', x: '50%', y: 'calc(100% + 8px)', transform: 'translate(-50%, 0)' },
            { pos: 'left', x: '-8px', y: '50%', transform: 'translate(0, -50%)' }
        ];

        // Set up event delegation handler if not already set
        if (!this.connectionPointHandler) {
            const shapesContainer = document.getElementById('shapesContainer');
            if (shapesContainer) {
                this.connectionPointHandler = (e) => {
                    const point = e.target.closest('.connection-point');
                    if (!point) return;

                    e.stopPropagation();
                    e.preventDefault();

                    const shapeId = point.dataset.shapeId;
                    const position = point.dataset.position;
                    const shape = this.mindmapEditorData.nodes.find(s => s.id === shapeId);

                    if (shape && position) {
                        this.startConnection(shape, position, e);
                    }
                };

                shapesContainer.addEventListener('mousedown', this.connectionPointHandler);
            }
        }

        positions.forEach(({ pos, x, y, transform }) => {
            const point = document.createElement('div');
            point.className = 'connection-point';
            point.dataset.position = pos;
            point.dataset.shapeId = shape.id;
            point.dataset.baseTransform = transform; // Store for hover effects
            point.style.position = 'absolute';
            point.style.left = x;
            point.style.top = y;
            point.style.transform = transform;

            // Make connection points larger and more visible when dragging
            if (isDraggingConnection && !isSource) {
                point.style.width = '16px';
                point.style.height = '16px';
                point.style.backgroundColor = '#4caf50';
                point.style.border = '3px solid #ffffff';
                point.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6), 0 0 0 4px rgba(76, 175, 80, 0.2)';
                point.style.animation = 'pulse-connection-point 1.5s ease-in-out infinite';
            } else {
                point.style.width = '12px';
                point.style.height = '12px';
                point.style.backgroundColor = '#1976d2';
                point.style.border = '2px solid #ffffff';
                point.style.boxShadow = 'none';
            }

            point.style.borderRadius = '50%';
            point.style.cursor = 'crosshair';
            point.style.zIndex = '1001';
            point.style.transition = 'all 0.2s';
            point.style.pointerEvents = 'all';

            // ✅ NO individual event listeners - handled by delegation

            shapeEl.appendChild(point);
        });

        // Add hover glow effect via CSS (no JS listeners needed)
        if (!document.querySelector('#connection-point-hover-style')) {
            const style = document.createElement('style');
            style.id = 'connection-point-hover-style';
            style.textContent = `
                .connection-point:hover {
                    box-shadow: 0 0 12px rgba(25, 118, 210, 0.8), 0 0 0 4px rgba(25, 118, 210, 0.3) !important;
                    background-color: #2196F3 !important;
                }
            `;
            document.head.appendChild(style);
        }
    },

    /**
     * Start creating connection
     */
    startConnection(shape, position, event) {
        const point = this.getConnectionPoint(shape, position);
        this.connectionDrag = {
            fromShape: shape,
            fromPosition: position,
            startX: point.x,
            startY: point.y,
            x: point.x,
            y: point.y
        };

        // Re-render shapes to show connection points on all shapes
        this.renderShapes();

        let rafId = null;
        const onMouseMove = (e) => {
            if (!this.connectionDrag) return;
            const container = document.getElementById('canvasDropZone');
            const rect = container.getBoundingClientRect();

            // Account for zoom and pan transforms
            const rawX = e.clientX - rect.left;
            const rawY = e.clientY - rect.top;
            this.connectionDrag.x = (rawX - this.canvasPan.x) / this.canvasZoom;
            this.connectionDrag.y = (rawY - this.canvasPan.y) / this.canvasZoom;

            // Throttle rendering with requestAnimationFrame
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                this.renderConnections();
            });
        };

        const onMouseUp = (e) => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            if (this.connectionDrag) {
                const target = document.elementFromPoint(e.clientX, e.clientY);
                if (target && target.classList.contains('connection-point')) {
                    const toShapeId = target.dataset.shapeId;
                    const toPosition = target.dataset.position;
                    const toShape = this.mindmapEditorData.nodes.find(s => s.id === toShapeId);

                    if (toShape && toShape.id !== this.connectionDrag.fromShape.id) {
                        this.saveState();
                        this.mindmapEditorData.connections.push({
                            id: `conn_${Date.now()}`,
                            from: this.connectionDrag.fromShape.id,
                            to: toShape.id,
                            fromPosition: this.connectionDrag.fromPosition,
                            toPosition: toPosition,
                            style: { ...this.connectorStyle }
                        });
                    }
                }
                this.connectionDrag = null;

                // Re-render shapes to hide connection points
                // If editing, manually remove connection points without full re-render
                if (this.editingShape) {
                    this.mindmapEditorData.nodes.forEach(shape => {
                        const shapeEl = document.querySelector(`[data-shape-id="${shape.id}"]`);
                        if (shapeEl && shape.id !== this.editingShape.id) {
                            shapeEl.querySelectorAll('.connection-point').forEach(el => el.remove());
                        }
                    });
                } else {
                    this.renderShapes();
                }
                this.renderConnections();
            }

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        event.preventDefault();
    },

    /**
     * Get connection point coordinates
     */
    getConnectionPoint(shape, position) {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;

        switch (position) {
            case 'top': return { x: centerX, y: shape.y };
            case 'bottom': return { x: centerX, y: shape.y + shape.height };
            case 'left': return { x: shape.x, y: centerY };
            case 'right': return { x: shape.x + shape.width, y: centerY };
            default: return { x: centerX, y: centerY };
        }
    },

    /**
     * Create orthogonal path
     */
    createOrthogonalPath(fromPoint, toPoint) {
        const midX = (fromPoint.x + toPoint.x) / 2;
        return `M ${fromPoint.x},${fromPoint.y} L ${midX},${fromPoint.y} L ${midX},${toPoint.y} L ${toPoint.x},${toPoint.y}`;
    },

    /**
     * Get marker ID for arrow type
     */
    getMarkerIdForArrow(arrowType, color) {
        const colorKey = color.replace('#', '');
        return `arrow-${arrowType}-${colorKey}`;
    },

    /**
     * Create arrow markers
     */
    createArrowMarkers(svg, color, arrowType) {
        const colorKey = color.replace('#', '');
        const markerId = `arrow-${arrowType}-${colorKey}`;

        // Check if marker already exists
        if (svg.querySelector(`#${markerId}`)) return markerId;

        const defs = svg.querySelector('defs') || svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));

        if (arrowType === 'arrow') {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', markerId);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
            path.setAttribute('fill', color);
            marker.appendChild(path);
            defs.appendChild(marker);
        } else if (arrowType === 'circle') {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', markerId);
            marker.setAttribute('markerWidth', '8');
            marker.setAttribute('markerHeight', '8');
            marker.setAttribute('refX', '4');
            marker.setAttribute('refY', '4');
            marker.setAttribute('orient', 'auto');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '4');
            circle.setAttribute('cy', '4');
            circle.setAttribute('r', '3');
            circle.setAttribute('fill', color);
            marker.appendChild(circle);
            defs.appendChild(marker);
        } else if (arrowType === 'diamond') {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', markerId);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '5');
            marker.setAttribute('refY', '5');
            marker.setAttribute('orient', 'auto');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M5,0 L10,5 L5,10 L0,5 Z');
            path.setAttribute('fill', color);
            marker.appendChild(path);
            defs.appendChild(marker);
        }

        return markerId;
    },

    /**
     * Render connections
     */
    renderConnections() {
        const svg = document.getElementById('connectionsCanvas');
        if (!svg) return;

        // Get or create defs for arrow markers
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.appendChild(defs);
        }

        // Apply zoom and pan transforms to SVG group
        let group = svg.querySelector('g.connections-group');
        if (!group) {
            group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.classList.add('connections-group');
            svg.appendChild(group);

            // Add ONE click listener on the group using event delegation
            this.connectionGroupClickHandler = (e) => {
                const hitArea = e.target.closest('[data-connection-id]');
                if (hitArea) {
                    e.stopPropagation();
                    e.preventDefault();
                    const connId = hitArea.dataset.connectionId;
                    const conn = this.mindmapEditorData.connections.find(c => c.id === connId);
                    if (conn) {
                        // Exit editing mode if currently editing
                        if (this.editingShape) {
                            const editableEl = document.querySelector(`[data-shape-id="${this.editingShape.id}"] .shape-content [contenteditable="true"]`) ||
                                             document.querySelector(`[data-shape-id="${this.editingShape.id}"] .shape-content[contenteditable="true"]`);
                            if (editableEl) {
                                this.editingShape.content = editableEl.innerHTML;
                                editableEl.contentEditable = 'false';
                            }
                            this.editingShape = null;
                            this._savedSelection = null;
                            if (this._activeFormats) {
                                this._activeFormats = {};
                            }
                        }

                        // Select the connection and deselect any shape
                        this.selectedShape = null;
                        this.selectedConnection = conn;
                        this.renderConnections();
                        this.renderShapes();
                    }
                }
            };
            group.addEventListener('click', this.connectionGroupClickHandler);
        }

        // Clear existing connections
        while (group.childNodes.length > 0) {
            group.removeChild(group.lastChild);
        }

        // Apply transform
        group.setAttribute('transform', `translate(${this.canvasPan.x}, ${this.canvasPan.y}) scale(${this.canvasZoom})`);

        this.mindmapEditorData.connections.forEach(conn => {
            const fromShape = this.mindmapEditorData.nodes.find(n => n.id === conn.from);
            const toShape = this.mindmapEditorData.nodes.find(n => n.id === conn.to);

            if (fromShape && toShape) {
                const fromPoint = this.getConnectionPoint(fromShape, conn.fromPosition || 'right');
                const toPoint = this.getConnectionPoint(toShape, conn.toPosition || 'left');

                const connStyle = conn.style || this.connectorStyle;

                // Validate connection color
                if (!connStyle.strokeColor || connStyle.strokeColor === '') {
                    connStyle.strokeColor = '#64748b';
                }
                if (!connStyle.strokeWidth || connStyle.strokeWidth === '') {
                    connStyle.strokeWidth = 2;
                }

                const isSelected = this.selectedConnection && this.selectedConnection.id === conn.id;
                const pathType = connStyle.pathType || 'direct';
                const strokeColor = connStyle.strokeColor;
                const strokeWidth = connStyle.strokeWidth || 2;

                // Create path based on type
                let pathElement;
                if (pathType === 'orthogonal') {
                    pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const pathData = this.createOrthogonalPath(fromPoint, toPoint);
                    pathElement.setAttribute('d', pathData);
                    pathElement.setAttribute('fill', 'none');

                    // Create invisible thick path for easier clicking
                    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    hitArea.setAttribute('d', pathData);
                    hitArea.setAttribute('fill', 'none');
                    hitArea.setAttribute('stroke', 'transparent');
                    hitArea.setAttribute('stroke-width', '20');
                    hitArea.setAttribute('data-connection-id', conn.id);
                    hitArea.style.cursor = 'pointer';
                    hitArea.style.pointerEvents = 'stroke';
                    // NO addEventListener - handled by event delegation
                    group.appendChild(hitArea);
                } else {
                    // Direct line
                    // Create invisible thick line for easier clicking
                    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    hitArea.setAttribute('x1', fromPoint.x);
                    hitArea.setAttribute('y1', fromPoint.y);
                    hitArea.setAttribute('x2', toPoint.x);
                    hitArea.setAttribute('y2', toPoint.y);
                    hitArea.setAttribute('stroke', 'transparent');
                    hitArea.setAttribute('stroke-width', '20');
                    hitArea.setAttribute('data-connection-id', conn.id);
                    hitArea.style.cursor = 'pointer';
                    hitArea.style.pointerEvents = 'stroke';
                    // NO addEventListener - handled by event delegation
                    group.appendChild(hitArea);

                    pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    pathElement.setAttribute('x1', fromPoint.x);
                    pathElement.setAttribute('y1', fromPoint.y);
                    pathElement.setAttribute('x2', toPoint.x);
                    pathElement.setAttribute('y2', toPoint.y);
                }

                // Make selected connections more visible with brighter color
                if (isSelected) {
                    pathElement.setAttribute('stroke', '#2196F3');  // Bright blue when selected
                    pathElement.setAttribute('stroke-width', strokeWidth);
                    // Add simple glow using CSS filter (much simpler than complex SVG filter)
                    pathElement.style.filter = 'drop-shadow(0 0 8px rgba(33, 150, 243, 0.8))';
                } else {
                    pathElement.setAttribute('stroke', strokeColor);
                    pathElement.setAttribute('stroke-width', strokeWidth);
                    pathElement.style.filter = 'none';
                }

                if (connStyle.lineStyle === 'dashed') {
                    pathElement.setAttribute('stroke-dasharray', '5,5');
                } else if (connStyle.lineStyle === 'dotted') {
                    pathElement.setAttribute('stroke-dasharray', '2,2');
                }

                // Add arrow marker if needed (use bright blue for selected connections)
                if (connStyle.arrowType && connStyle.arrowType !== 'none') {
                    const arrowColor = isSelected ? '#2196F3' : strokeColor;
                    const markerId = this.createArrowMarkers(svg, arrowColor, connStyle.arrowType);
                    pathElement.setAttribute('marker-end', `url(#${markerId})`);
                }

                pathElement.style.pointerEvents = 'none';
                group.appendChild(pathElement);
            }
        });

        if (this.connectionDrag) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', this.connectionDrag.startX);
            line.setAttribute('y1', this.connectionDrag.startY);
            line.setAttribute('x2', this.connectionDrag.x);
            line.setAttribute('y2', this.connectionDrag.y);
            line.setAttribute('stroke', '#1976d2');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '5,5');
            group.appendChild(line);
        }
    },

    /**
     * Delete selected shape or connection
     */
    deleteSelectedShape() {
        // If currently editing, exit edit mode first, then delete
        if (this.editingShape && this.editingShape._saveEditFn) {
            this.editingShape._saveEditFn();
        }

        this.saveState();

        if (this.selectedShape) {
            const index = this.mindmapEditorData.nodes.findIndex(n => n.id === this.selectedShape.id);
            if (index !== -1) {
                this.mindmapEditorData.nodes.splice(index, 1);
            }

            this.mindmapEditorData.connections = this.mindmapEditorData.connections.filter(
                c => c.from !== this.selectedShape.id && c.to !== this.selectedShape.id
            );

            this.selectedShape = null;
        } else if (this.selectedConnection) {
            const index = this.mindmapEditorData.connections.findIndex(c => c.id === this.selectedConnection.id);
            if (index !== -1) {
                this.mindmapEditorData.connections.splice(index, 1);
            }
            this.selectedConnection = null;
        }

        this.renderShapes();
        this.renderConnections();
    },

    /**
     * Add resize handles
     */
    addResizeHandles(shapeEl, shape) {
        const positions = [
            { pos: 'nw', cursor: 'nwse-resize' },
            { pos: 'ne', cursor: 'nesw-resize' },
            { pos: 'sw', cursor: 'nesw-resize' },
            { pos: 'se', cursor: 'nwse-resize' }
        ];

        // Set up event delegation handler if not already set
        if (!this.resizeHandleHandler) {
            const shapesContainer = document.getElementById('shapesContainer');
            if (shapesContainer) {
                this.resizeHandleHandler = (e) => {
                    const handle = e.target.closest('.resize-handle');
                    if (!handle) return;

                    e.stopPropagation();
                    e.preventDefault();

                    const shapeId = handle.dataset.shapeId;
                    const position = handle.dataset.position;
                    const shape = this.mindmapEditorData.nodes.find(s => s.id === shapeId);

                    if (shape && position) {
                        this.startResize(shape, position, e);
                    }
                };

                shapesContainer.addEventListener('mousedown', this.resizeHandleHandler);
            }
        }

        positions.forEach(({ pos, cursor }) => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            handle.dataset.position = pos;
            handle.dataset.shapeId = shape.id; // Add shape ID for delegation
            handle.style.position = 'absolute';
            handle.style.width = '8px';
            handle.style.height = '8px';
            handle.style.backgroundColor = '#1976d2';
            handle.style.border = '1px solid #ffffff';
            handle.style.cursor = cursor;
            handle.style.zIndex = '1002';

            // Position handles at corners
            if (pos === 'nw') {
                handle.style.left = '-4px';
                handle.style.top = '-4px';
            } else if (pos === 'ne') {
                handle.style.right = '-4px';
                handle.style.top = '-4px';
            } else if (pos === 'sw') {
                handle.style.left = '-4px';
                handle.style.bottom = '-4px';
            } else if (pos === 'se') {
                handle.style.right = '-4px';
                handle.style.bottom = '-4px';
            }

            // ✅ NO individual event listeners - handled by delegation

            shapeEl.appendChild(handle);
        });
    },

    /**
     * Start resizing shape
     */
    startResize(shape, handlePos, event) {
        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = shape.width;
        const startHeight = shape.height;
        const startShapeX = shape.x;
        const startShapeY = shape.y;

        let hasMoved = false;

        // Get the shape element once
        const shapeEl = document.querySelector(`[data-shape-id="${shape.id}"]`);
        if (!shapeEl) return;

        let rafId = null;
        const onMouseMove = (e) => {
            if (!hasMoved) {
                this.saveState();
                hasMoved = true;
            }

            // Convert screen space delta to canvas space delta (account for zoom)
            const dx = (e.clientX - startX) / this.canvasZoom;
            const dy = (e.clientY - startY) / this.canvasZoom;

            // Adjust size based on handle position
            if (handlePos === 'se') {
                shape.width = Math.max(50, startWidth + dx);
                shape.height = Math.max(30, startHeight + dy);
            } else if (handlePos === 'sw') {
                shape.width = Math.max(50, startWidth - dx);
                shape.height = Math.max(30, startHeight + dy);
                shape.x = startShapeX + (startWidth - shape.width);
            } else if (handlePos === 'ne') {
                shape.width = Math.max(50, startWidth + dx);
                shape.height = Math.max(30, startHeight - dy);
                shape.y = startShapeY + (startHeight - shape.height);
            } else if (handlePos === 'nw') {
                shape.width = Math.max(50, startWidth - dx);
                shape.height = Math.max(30, startHeight - dy);
                shape.x = startShapeX + (startWidth - shape.width);
                shape.y = startShapeY + (startHeight - shape.height);
            }

            // Update size and position directly via CSS instead of re-rendering entire DOM
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                shapeEl.style.width = `${shape.width}px`;
                shapeEl.style.height = `${shape.height}px`;
                shapeEl.style.left = `${shape.x}px`;
                shapeEl.style.top = `${shape.y}px`;
                // Only update connections, not shapes
                this.renderConnections();
            });
        };

        const onMouseUp = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Final render to ensure connection points and handles are repositioned
            this.renderShapes();
            this.renderConnections();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },

    /**
     * Zoom functions - now just update transforms, no re-rendering needed
     */
    zoomIn() {
        this.canvasZoom = Math.min(this.canvasZoom * 1.2, 3);
        const shapesContainer = document.getElementById('shapesContainer');
        const svg = document.getElementById('connectionsCanvas');

        if (shapesContainer) {
            shapesContainer.style.transform = `translate(${this.canvasPan.x}px, ${this.canvasPan.y}px) scale(${this.canvasZoom})`;
        }
        if (svg) {
            let group = svg.querySelector('g.connections-group');
            if (group) {
                group.setAttribute('transform', `translate(${this.canvasPan.x}, ${this.canvasPan.y}) scale(${this.canvasZoom})`);
            }
        }
    },

    zoomOut() {
        this.canvasZoom = Math.max(this.canvasZoom / 1.2, 0.2);
        const shapesContainer = document.getElementById('shapesContainer');
        const svg = document.getElementById('connectionsCanvas');

        if (shapesContainer) {
            shapesContainer.style.transform = `translate(${this.canvasPan.x}px, ${this.canvasPan.y}px) scale(${this.canvasZoom})`;
        }
        if (svg) {
            let group = svg.querySelector('g.connections-group');
            if (group) {
                group.setAttribute('transform', `translate(${this.canvasPan.x}, ${this.canvasPan.y}) scale(${this.canvasZoom})`);
            }
        }
    },

    resetZoom() {
        this.canvasZoom = 1;
        this.canvasPan = { x: 0, y: 0 };
        const shapesContainer = document.getElementById('shapesContainer');
        const svg = document.getElementById('connectionsCanvas');

        if (shapesContainer) {
            shapesContainer.style.transform = `translate(0px, 0px) scale(1)`;
        }
        if (svg) {
            let group = svg.querySelector('g.connections-group');
            if (group) {
                group.setAttribute('transform', `translate(0, 0) scale(1)`);
            }
        }
    },

    /**
     * Sanitize HTML content for SVG export
     * Ensures content is safe and well-formed for embedding in SVG foreignObject
     */
    sanitizeContentForSVG(content) {
        if (!content) return '';

        // Use DOMPurify to sanitize and fix malformed HTML
        if (window.DOMPurify) {
            return DOMPurify.sanitize(content, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span', 'ul', 'ol', 'li'],
                ALLOWED_ATTR: ['style'],
                ALLOWED_STYLES: {
                    '*': {
                        'color': [/^#[0-9A-Fa-f]{3,6}$/],
                        'font-size': [/^\d+px$/],
                        'font-weight': [/^(normal|bold)$/],
                        'font-style': [/^(normal|italic)$/]
                    }
                }
            });
        } else {
            // Fallback to escaping HTML entities
            return escapeHtml(content);
        }
    },

    /**
     * Export diagram as SVG
     */
    async exportMindmapAsSVG() {
        if (this.mindmapEditorData.nodes.length === 0) {
            await this.showAlert('Nothing to export! Add some shapes first.', 'Nothing to Export');
            return;
        }

        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.mindmapEditorData.nodes.forEach(shape => {
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + shape.width);
            maxY = Math.max(maxY, shape.y + shape.height);
        });

        const padding = 50;
        const width = maxX - minX + (padding * 2);
        const height = maxY - minY + (padding * 2);
        const offsetX = -minX + padding;
        const offsetY = -minY + padding;

        // Create SVG with all marker types
        let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
`;

        // Create markers for all colors used
        const usedColors = new Set();
        this.mindmapEditorData.connections.forEach(conn => {
            const connStyle = conn.style || this.connectorStyle;
            usedColors.add(connStyle.strokeColor || '#64748b');
        });

        usedColors.forEach(color => {
            const colorKey = color.replace('#', '');
            // Arrow marker
            svgContent += `    <marker id="arrow-arrow-${colorKey}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${color}"/>
    </marker>
`;
            // Circle marker
            svgContent += `    <marker id="arrow-circle-${colorKey}" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <circle cx="4" cy="4" r="3" fill="${color}"/>
    </marker>
`;
            // Diamond marker
            svgContent += `    <marker id="arrow-diamond-${colorKey}" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
      <path d="M5,0 L10,5 L5,10 L0,5 Z" fill="${color}"/>
    </marker>
`;
        });

        svgContent += `  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
`;

        // Add connections
        this.mindmapEditorData.connections.forEach(conn => {
            const fromShape = this.mindmapEditorData.nodes.find(n => n.id === conn.from);
            const toShape = this.mindmapEditorData.nodes.find(n => n.id === conn.to);

            if (fromShape && toShape) {
                const fromPoint = this.getConnectionPoint(fromShape, conn.fromPosition || 'right');
                const toPoint = this.getConnectionPoint(toShape, conn.toPosition || 'left');
                const connStyle = conn.style || this.connectorStyle;
                const pathType = connStyle.pathType || 'direct';

                const dashArray = connStyle.lineStyle === 'dashed' ? '5,5' : (connStyle.lineStyle === 'dotted' ? '2,2' : 'none');
                const arrowType = connStyle.arrowType || 'arrow';
                const strokeColor = connStyle.strokeColor || '#64748b';
                const colorKey = strokeColor.replace('#', '');
                const marker = arrowType !== 'none' ? `url(#arrow-${arrowType}-${colorKey})` : '';

                if (pathType === 'orthogonal') {
                    // Create orthogonal path
                    const pathData = this.createOrthogonalPath(
                        { x: fromPoint.x + offsetX, y: fromPoint.y + offsetY },
                        { x: toPoint.x + offsetX, y: toPoint.y + offsetY }
                    );
                    svgContent += `  <path d="${pathData}" stroke="${strokeColor}" stroke-width="${connStyle.strokeWidth}" stroke-dasharray="${dashArray}" fill="none" marker-end="${marker}"/>\n`;
                } else {
                    // Direct line
                    svgContent += `  <line x1="${fromPoint.x + offsetX}" y1="${fromPoint.y + offsetY}" x2="${toPoint.x + offsetX}" y2="${toPoint.y + offsetY}" stroke="${strokeColor}" stroke-width="${connStyle.strokeWidth}" stroke-dasharray="${dashArray}" marker-end="${marker}"/>\n`;
                }
            }
        });

        // Add shapes
        this.mindmapEditorData.nodes.forEach(shape => {
            const textStyle = shape.textStyle || this.textStyle;
            const x = shape.x + offsetX;
            const y = shape.y + offsetY;

            // Draw shape background
            if (shape.type === 'diamond') {
                const cx = x + shape.width / 2;
                const cy = y + shape.height / 2;
                const hw = shape.width / 2;
                const hh = shape.height / 2;
                svgContent += `  <polygon points="${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" opacity="${shape.style.opacity || 1}"/>\n`;
            } else if (shape.type === 'hexagon') {
                const cx = x + shape.width / 2;
                const cy = y + shape.height / 2;
                const w = shape.width;
                const h = shape.height;
                svgContent += `  <polygon points="${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${cy} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${cy}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" opacity="${shape.style.opacity || 1}"/>\n`;
            } else if (shape.type === 'circle' || shape.type === 'ellipse') {
                const cx = x + shape.width / 2;
                const cy = y + shape.height / 2;
                const rx = shape.width / 2;
                const ry = shape.height / 2;
                svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" opacity="${shape.style.opacity || 1}"/>\n`;
            } else {
                // rectangle or rounded
                svgContent += `  <rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" rx="${shape.style.borderRadius ? parseInt(shape.style.borderRadius) : 0}" opacity="${shape.style.opacity || 1}"/>\n`;
            }

            // Use foreignObject to render HTML content (including equations)
            // ✅ Sanitize content to prevent XML errors and malformed HTML
            const sanitizedContent = this.sanitizeContentForSVG(shape.content);
            svgContent += `  <foreignObject x="${x}" y="${y}" width="${shape.width}" height="${shape.height}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box; font-family: ${textStyle.fontFamily}; font-size: ${textStyle.fontSize}; color: ${textStyle.color}; font-weight: ${textStyle.bold ? 'bold' : 'normal'}; font-style: ${textStyle.italic ? 'italic' : 'normal'}; overflow: hidden; word-wrap: break-word;">
      ${sanitizedContent}
    </div>
  </foreignObject>\n`;
        });

        svgContent += '</svg>';

        // Download
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.mindmapEditorTitle || 'mindmap'}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
