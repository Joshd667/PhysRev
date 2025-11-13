// js/features/mindmaps/canvas.js
// Canvas implementation for mind maps

export const mindmapCanvasMethods = {
    // State
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

    // Event listener storage for cleanup
    canvasEventListeners: null,

    // Undo/Redo (reduced from 50 to 20 to save memory)
    undoStack: [],
    redoStack: [],
    maxUndoSteps: 20,

    // Debounce timer for icon updates
    iconUpdateTimer: null,

    // Shape styling defaults - Basic shapes only
    shapeStyles: {
        rectangle: { borderColor: '#1976d2', borderWidth: 2, borderRadius: '4px', fill: '#ffffff', opacity: 1 },
        rounded: { borderColor: '#388e3c', borderWidth: 2, borderRadius: '12px', fill: '#ffffff', opacity: 1 },
        circle: { borderColor: '#7b1fa2', borderWidth: 2, borderRadius: '50%', fill: '#ffffff', opacity: 1 },
        diamond: { borderColor: '#f57c00', borderWidth: 2, borderRadius: '0', fill: '#ffffff', opacity: 1 },
        hexagon: { borderColor: '#c2185b', borderWidth: 2, borderRadius: '0', fill: '#ffffff', opacity: 1 },
        ellipse: { borderColor: '#0097a7', borderWidth: 2, borderRadius: '50%', fill: '#ffffff', opacity: 1 }
    },

    // Text styling defaults
    textStyle: {
        fontFamily: 'Arial',
        fontSize: 14,
        color: '#000000',
        align: 'center',
        bold: false,
        italic: false
    },

    // Connector styling defaults
    connectorStyle: {
        strokeColor: '#64748b',
        strokeWidth: 2,
        arrowType: 'arrow',
        lineStyle: 'solid',
        pathType: 'direct' // 'direct' or 'orthogonal'
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
        if (!canvas) return;

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
            if (e.target.id === 'canvasDropZone' || e.target.tagName.toLowerCase() === 'svg' ||
                (e.target.tagName.toLowerCase() === 'rect' && e.target.parentElement?.id === 'grid')) {
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
    },

    /**
     * Clean up canvas event listeners
     */
    cleanupCanvasListeners() {
        if (this.canvasEventListeners) {
            Object.values(this.canvasEventListeners).forEach(({ element, type, handler }) => {
                if (element) {
                    element.removeEventListener(type, handler);
                }
            });
            this.canvasEventListeners = null;
        }
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
     * Update selected shape text style
     */
    updateTextStyle(property, value) {
        if (!this.selectedShape) return;

        this.saveState();

        if (!this.selectedShape.textStyle) {
            this.selectedShape.textStyle = { ...this.textStyle };
        }

        this.selectedShape.textStyle[property] = value;
        this.renderShapes();
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
    insertEquationIntoShape(latex) {
        if (!this.equationTargetShape) return;

        this.saveState();

        // Add equation as rendered content
        const equationHtml = `<span class="equation-inline" data-latex="${latex.replace(/"/g, '&quot;')}">\\(${latex}\\)</span>`;

        if (this.equationTargetShape.content) {
            this.equationTargetShape.content += ' ' + equationHtml;
        } else {
            this.equationTargetShape.content = equationHtml;
        }

        this.equationTargetShape = null;
        this.renderShapes();

        // Render math if KaTeX is available
        this.$nextTick(() => {
            if (window.renderMathInElement) {
                const shapeEl = document.querySelector(`[data-shape-id="${this.equationTargetShape?.id}"]`);
                if (shapeEl) {
                    window.renderMathInElement(shapeEl, {
                        delimiters: [
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ]
                    });
                }
            }
        });
    },

    /**
     * Create new diagram
     */
    newDiagram() {
        if (this.mindmapEditorData.nodes.length > 0) {
            if (!confirm('Create new diagram? Current work will be lost if not saved.')) {
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
        console.log('Initializing canvas...');

        if (!this.mindmapEditorData.viewport) {
            this.mindmapEditorData.viewport = { x: 0, y: 0, scale: 1 };
        }

        this.canvasZoom = this.mindmapEditorData.viewport.scale || 1;
        this.canvasPan = { x: 0, y: 0 };
        this.renderShapes();
        this.renderConnections();
        this.initCanvasInteraction();

        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });

        console.log('Canvas initialized');
    },

    /**
     * Clean up - remove all event listeners and clear state
     */
    cleanupMindmapCanvas() {
        // Remove event listeners
        this.cleanupCanvasListeners();

        // Clear state
        this.selectedShape = null;
        this.draggedShape = null;
        this.connectionDrag = null;
        this.editingShape = null;
        this.isPanningCanvas = false;

        // Clear undo/redo to free memory
        this.undoStack = [];
        this.redoStack = [];
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
        this.saveState();

        const style = JSON.parse(JSON.stringify(this.shapeStyles[shapeType] || this.shapeStyles.rectangle));

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
        this.selectedShape = newShape;
        this.renderShapes();
        this.renderConnections();

        // Start inline editing immediately
        this.$nextTick(() => {
            this.startInlineEdit(newShape);
        });
    },

    /**
     * Render all shapes
     */
    renderShapes() {
        const container = document.getElementById('shapesContainer');
        if (!container) return;

        // Apply zoom and pan transforms
        container.style.transform = `translate(${this.canvasPan.x}px, ${this.canvasPan.y}px) scale(${this.canvasZoom})`;
        container.style.transformOrigin = '0 0';

        container.innerHTML = '';

        this.mindmapEditorData.nodes.forEach(shape => {
            const shapeEl = this.createShapeElement(shape);
            container.appendChild(shapeEl);
        });
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
        div.style.cursor = 'move';
        div.style.userSelect = 'none';

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
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.padding = '8px';
        content.style.fontSize = `${textStyle.fontSize}px`;
        content.style.fontFamily = textStyle.fontFamily;
        content.style.color = textStyle.color;
        content.style.fontWeight = textStyle.bold ? 'bold' : 'normal';
        content.style.fontStyle = textStyle.italic ? 'italic' : 'normal';
        content.style.textAlign = textStyle.align;
        content.style.overflow = 'hidden';
        content.style.wordWrap = 'break-word';
        content.style.transition = 'box-shadow 0.2s';

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
            inner.innerHTML = shape.content || '';
            content.appendChild(inner);
        } else if (shape.type === 'hexagon') {
            content.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
            content.innerHTML = shape.content || '';
        } else {
            content.innerHTML = shape.content || '';
        }

        // Highlight if selected
        if (this.selectedShape && this.selectedShape.id === shape.id) {
            content.style.boxShadow = '0 0 0 2px #1976d2';
            this.addConnectionPoints(div, shape);
            this.addResizeHandles(div, shape);
        } else if (this.connectionDrag) {
            // Show connection points on all shapes when drawing a connection
            this.addConnectionPoints(div, shape);
        }

        // Event listeners
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectShape(shape);
        });

        div.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startInlineEdit(shape);
        });

        div.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.connection-point') && !e.target.closest('.resize-handle')) {
                this.startDragShape(shape, e);
            }
        });

        div.appendChild(content);
        return div;
    },

    /**
     * Select a shape
     */
    selectShape(shape) {
        this.selectedShape = shape;
        this.renderShapes();
    },

    /**
     * Start inline editing
     */
    startInlineEdit(shape) {
        this.editingShape = shape;
        this.selectedShape = shape;
        this.renderShapes();

        this.$nextTick(() => {
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
            editableEl.focus();

            // Select all text
            const range = document.createRange();
            range.selectNodeContents(editableEl);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            // Save on blur or Enter
            const saveEdit = () => {
                shape.content = editableEl.innerHTML;
                editableEl.contentEditable = 'false';
                this.editingShape = null;
                this.renderShapes();
            };

            editableEl.addEventListener('blur', saveEdit, { once: true });
            editableEl.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    editableEl.blur();
                }
            });
        });
    },

    /**
     * Start dragging a shape
     */
    startDragShape(shape, event) {
        this.draggedShape = shape;
        this.dragStart = {
            x: event.clientX - shape.x,
            y: event.clientY - shape.y
        };

        let hasMoved = false;

        const onMouseMove = (e) => {
            if (!hasMoved) {
                this.saveState();
                hasMoved = true;
            }
            if (!this.draggedShape) return;

            let newX = e.clientX - this.dragStart.x;
            let newY = e.clientY - this.dragStart.y;

            // Snap to grid
            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }

            this.draggedShape.x = newX;
            this.draggedShape.y = newY;
            this.renderShapes();
            this.renderConnections();
        };

        const onMouseUp = () => {
            this.draggedShape = null;
            this.dragStart = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },

    /**
     * Add connection points
     */
    addConnectionPoints(shapeEl, shape) {
        const positions = [
            { pos: 'top', x: '50%', y: '-6px', transform: 'translate(-50%, 0)' },
            { pos: 'right', x: 'calc(100% + 6px)', y: '50%', transform: 'translate(0, -50%)' },
            { pos: 'bottom', x: '50%', y: 'calc(100% + 6px)', transform: 'translate(-50%, 0)' },
            { pos: 'left', x: '-6px', y: '50%', transform: 'translate(0, -50%)' }
        ];

        positions.forEach(({ pos, x, y, transform }) => {
            const point = document.createElement('div');
            point.className = 'connection-point';
            point.dataset.position = pos;
            point.dataset.shapeId = shape.id;
            point.style.position = 'absolute';
            point.style.left = x;
            point.style.top = y;
            point.style.transform = transform;
            point.style.width = '12px';
            point.style.height = '12px';
            point.style.backgroundColor = '#1976d2';
            point.style.border = '2px solid #ffffff';
            point.style.borderRadius = '50%';
            point.style.cursor = 'crosshair';
            point.style.zIndex = '1001';
            point.style.transition = 'all 0.2s';
            point.style.pointerEvents = 'all';

            point.addEventListener('mouseenter', () => {
                point.style.transform = `${transform} scale(1.4)`;
                point.style.backgroundColor = '#1565c0';
            });

            point.addEventListener('mouseleave', () => {
                point.style.transform = transform;
                point.style.backgroundColor = '#1976d2';
            });

            point.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.startConnection(shape, pos, e);
            });

            shapeEl.appendChild(point);
        });
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

        const onMouseMove = (e) => {
            if (!this.connectionDrag) return;
            const container = document.getElementById('canvasDropZone');
            const rect = container.getBoundingClientRect();
            this.connectionDrag.x = e.clientX - rect.left;
            this.connectionDrag.y = e.clientY - rect.top;
            this.renderConnections();
        };

        const onMouseUp = (e) => {
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
                this.renderShapes();
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

        // Apply zoom and pan transforms to SVG group
        let group = svg.querySelector('g.connections-group');
        if (!group) {
            group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.classList.add('connections-group');
            svg.appendChild(group);
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
                const strokeColor = isSelected ? '#1976d2' : connStyle.strokeColor;
                const strokeWidth = isSelected ? connStyle.strokeWidth + 1 : connStyle.strokeWidth;

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
                    hitArea.setAttribute('stroke-width', '10');
                    hitArea.style.cursor = 'pointer';
                    hitArea.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectedShape = null;
                        this.selectedConnection = conn;
                        this.renderConnections();
                        this.renderShapes();
                    });
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
                    hitArea.setAttribute('stroke-width', '10');
                    hitArea.style.cursor = 'pointer';
                    hitArea.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectedShape = null;
                        this.selectedConnection = conn;
                        this.renderConnections();
                        this.renderShapes();
                    });
                    group.appendChild(hitArea);

                    pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    pathElement.setAttribute('x1', fromPoint.x);
                    pathElement.setAttribute('y1', fromPoint.y);
                    pathElement.setAttribute('x2', toPoint.x);
                    pathElement.setAttribute('y2', toPoint.y);
                }

                pathElement.setAttribute('stroke', strokeColor);
                pathElement.setAttribute('stroke-width', strokeWidth);

                if (connStyle.lineStyle === 'dashed') {
                    pathElement.setAttribute('stroke-dasharray', '5,5');
                } else if (connStyle.lineStyle === 'dotted') {
                    pathElement.setAttribute('stroke-dasharray', '2,2');
                }

                // Add arrow marker if needed
                if (connStyle.arrowType && connStyle.arrowType !== 'none') {
                    const markerId = this.createArrowMarkers(svg, strokeColor, connStyle.arrowType);
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

        positions.forEach(({ pos, cursor }) => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            handle.dataset.position = pos;
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

            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.startResize(shape, pos, e);
            });

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

        const onMouseMove = (e) => {
            if (!hasMoved) {
                this.saveState();
                hasMoved = true;
            }

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

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

            this.renderShapes();
            this.renderConnections();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
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
     * Export diagram as SVG
     */
    exportMindmapAsSVG() {
        if (this.mindmapEditorData.nodes.length === 0) {
            alert('Nothing to export! Add some shapes first.');
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

        // Create SVG
        let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#64748b"/>
    </marker>
  </defs>
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

                const dashArray = connStyle.lineStyle === 'dashed' ? '5,5' : (connStyle.lineStyle === 'dotted' ? '2,2' : 'none');
                const marker = connStyle.arrowType !== 'none' ? 'url(#arrowhead)' : '';

                svgContent += `  <line x1="${fromPoint.x + offsetX}" y1="${fromPoint.y + offsetY}" x2="${toPoint.x + offsetX}" y2="${toPoint.y + offsetY}" stroke="${connStyle.strokeColor}" stroke-width="${connStyle.strokeWidth}" stroke-dasharray="${dashArray}" marker-end="${marker}"/>\n`;
            }
        });

        // Add shapes
        this.mindmapEditorData.nodes.forEach(shape => {
            const textStyle = shape.textStyle || this.textStyle;
            const x = shape.x + offsetX;
            const y = shape.y + offsetY;

            if (shape.type === 'diamond') {
                const cx = x + shape.width / 2;
                const cy = y + shape.height / 2;
                const hw = shape.width / 2;
                const hh = shape.height / 2;
                svgContent += `  <polygon points="${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" opacity="${shape.style.opacity || 1}"/>\n`;
                svgContent += `  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${textStyle.fontFamily}" font-size="${textStyle.fontSize}" fill="${textStyle.color}" font-weight="${textStyle.bold ? 'bold' : 'normal'}" font-style="${textStyle.italic ? 'italic' : 'normal'}">${shape.content}</text>\n`;
            } else if (shape.type === 'hexagon') {
                const cx = x + shape.width / 2;
                const cy = y + shape.height / 2;
                const w = shape.width;
                const h = shape.height;
                svgContent += `  <polygon points="${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${cy} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${cy}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" opacity="${shape.style.opacity || 1}"/>\n`;
                svgContent += `  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${textStyle.fontFamily}" font-size="${textStyle.fontSize}" fill="${textStyle.color}" font-weight="${textStyle.bold ? 'bold' : 'normal'}" font-style="${textStyle.italic ? 'italic' : 'normal'}">${shape.content}</text>\n`;
            } else if (shape.type === 'circle' || shape.type === 'start') {
                const cx = x + shape.width / 2;
                const cy = y + shape.height / 2;
                const rx = shape.width / 2;
                const ry = shape.height / 2;
                svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" opacity="${shape.style.opacity || 1}"/>\n`;
                svgContent += `  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${textStyle.fontFamily}" font-size="${textStyle.fontSize}" fill="${textStyle.color}" font-weight="${textStyle.bold ? 'bold' : 'normal'}" font-style="${textStyle.italic ? 'italic' : 'normal'}">${shape.content}</text>\n`;
            } else {
                svgContent += `  <rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" fill="${shape.style.fill}" stroke="${shape.style.borderColor}" stroke-width="${shape.style.borderWidth}" rx="${shape.style.borderRadius ? parseInt(shape.style.borderRadius) : 0}" opacity="${shape.style.opacity || 1}"/>\n`;
                svgContent += `  <text x="${x + shape.width / 2}" y="${y + shape.height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="${textStyle.fontFamily}" font-size="${textStyle.fontSize}" fill="${textStyle.color}" font-weight="${textStyle.bold ? 'bold' : 'normal'}" font-style="${textStyle.italic ? 'italic' : 'normal'}">${shape.content}</text>\n`;
            }
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
