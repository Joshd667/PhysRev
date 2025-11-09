// js/features/mindmaps/canvas.js
// Diagrams.net-style canvas implementation

export const mindmapCanvasMethods = {
    // State
    canvasTool: 'select',
    canvasZoom: 1,
    canvasPan: { x: 0, y: 0 },
    selectedShape: null,
    draggedShape: null,
    dragStart: null,
    connectionDrag: null,
    isDraggingShape: false,
    draggedShapeType: null,
    editingShape: null,
    gridSize: 20,
    snapToGrid: true,

    // Shape styling (diagrams.net style)
    shapeStyles: {
        rectangle: { borderColor: '#1976d2', borderWidth: 2, borderRadius: '4px', fill: '#ffffff' },
        rounded: { borderColor: '#388e3c', borderWidth: 2, borderRadius: '12px', fill: '#ffffff' },
        circle: { borderColor: '#7b1fa2', borderWidth: 2, borderRadius: '50%', fill: '#ffffff' },
        diamond: { borderColor: '#f57c00', borderWidth: 2, borderRadius: '0', fill: '#ffffff' },
        hexagon: { borderColor: '#c2185b', borderWidth: 2, borderRadius: '0', fill: '#ffffff' },
        ellipse: { borderColor: '#0097a7', borderWidth: 2, borderRadius: '50%', fill: '#ffffff' }
    },

    /**
     * Initialize canvas
     */
    initMindmapCanvas() {
        console.log('Initializing diagrams.net-style canvas...');

        if (!this.mindmapEditorData.viewport) {
            this.mindmapEditorData.viewport = { x: 0, y: 0, scale: 1 };
        }

        this.canvasZoom = this.mindmapEditorData.viewport.scale || 1;
        this.renderShapes();
        this.renderConnections();

        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });

        console.log('Canvas initialized');
    },

    /**
     * Clean up
     */
    cleanupMindmapCanvas() {
        this.selectedShape = null;
        this.draggedShape = null;
        this.connectionDrag = null;
        this.editingShape = null;
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
        const style = this.shapeStyles[shapeType] || this.shapeStyles.rectangle;

        const newShape = {
            id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: shapeType,
            x: x,
            y: y,
            width: 150,
            height: 100,
            content: '',
            style: style
        };

        this.mindmapEditorData.nodes.push(newShape);
        this.selectedShape = newShape;
        this.renderShapes();
        this.renderConnections();

        // Start inline editing immediately
        this.$nextTick(() => {
            this.startInlineEdit(newShape);
            if (window.lucide) lucide.createIcons();
        });
    },

    /**
     * Render all shapes
     */
    renderShapes() {
        const container = document.getElementById('shapesContainer');
        if (!container) return;

        container.innerHTML = '';

        this.mindmapEditorData.nodes.forEach(shape => {
            const shapeEl = this.createShapeElement(shape);
            container.appendChild(shapeEl);
        });

        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
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

        // Create content wrapper
        const content = document.createElement('div');
        content.className = 'shape-content';
        content.style.width = '100%';
        content.style.height = '100%';
        content.style.backgroundColor = shape.style.fill;
        content.style.border = `${shape.style.borderWidth}px solid ${shape.style.borderColor}`;
        content.style.borderRadius = shape.style.borderRadius;
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.padding = '8px';
        content.style.fontSize = '14px';
        content.style.color = '#000000';
        content.style.overflow = 'hidden';
        content.style.wordWrap = 'break-word';
        content.style.textAlign = 'center';
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

        const onMouseMove = (e) => {
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
            point.style.width = '10px';
            point.style.height = '10px';
            point.style.backgroundColor = '#1976d2';
            point.style.border = '2px solid #ffffff';
            point.style.borderRadius = '50%';
            point.style.cursor = 'crosshair';
            point.style.zIndex = '1001';
            point.style.transition = 'all 0.2s';

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
                this.startConnection(shape, pos, e);
            });

            shapeEl.appendChild(point);
        });
    },

    /**
     * Add resize handles
     */
    addResizeHandles(shapeEl, shape) {
        const handles = [
            { pos: 'nw', cursor: 'nw-resize', left: '-4px', top: '-4px' },
            { pos: 'ne', cursor: 'ne-resize', right: '-4px', top: '-4px' },
            { pos: 'sw', cursor: 'sw-resize', left: '-4px', bottom: '-4px' },
            { pos: 'se', cursor: 'se-resize', right: '-4px', bottom: '-4px' }
        ];

        handles.forEach(({ pos, cursor, left, right, top, bottom }) => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            handle.dataset.position = pos;
            handle.style.position = 'absolute';
            if (left) handle.style.left = left;
            if (right) handle.style.right = right;
            if (top) handle.style.top = top;
            if (bottom) handle.style.bottom = bottom;
            handle.style.width = '8px';
            handle.style.height = '8px';
            handle.style.backgroundColor = '#ffffff';
            handle.style.border = '1px solid #1976d2';
            handle.style.cursor = cursor;
            handle.style.zIndex = '1001';

            shapeEl.appendChild(handle);
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
                        this.mindmapEditorData.connections.push({
                            id: `conn_${Date.now()}`,
                            from: this.connectionDrag.fromShape.id,
                            to: toShape.id,
                            fromPosition: this.connectionDrag.fromPosition,
                            toPosition: toPosition
                        });
                    }
                }
                this.connectionDrag = null;
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
     * Render connections
     */
    renderConnections() {
        const svg = document.getElementById('connectionsCanvas');
        if (!svg) return;

        while (svg.childNodes.length > 1) {
            svg.removeChild(svg.lastChild);
        }

        this.mindmapEditorData.connections.forEach(conn => {
            const fromShape = this.mindmapEditorData.nodes.find(n => n.id === conn.from);
            const toShape = this.mindmapEditorData.nodes.find(n => n.id === conn.to);

            if (fromShape && toShape) {
                const fromPoint = this.getConnectionPoint(fromShape, conn.fromPosition || 'right');
                const toPoint = this.getConnectionPoint(toShape, conn.toPosition || 'left');

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromPoint.x);
                line.setAttribute('y1', fromPoint.y);
                line.setAttribute('x2', toPoint.x);
                line.setAttribute('y2', toPoint.y);
                line.setAttribute('stroke', '#64748b');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('marker-end', 'url(#arrowhead)');

                svg.appendChild(line);
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
            svg.appendChild(line);
        }
    },

    /**
     * Delete selected shape
     */
    deleteSelectedShape() {
        if (!this.selectedShape) return;

        const index = this.mindmapEditorData.nodes.findIndex(n => n.id === this.selectedShape.id);
        if (index !== -1) {
            this.mindmapEditorData.nodes.splice(index, 1);
        }

        this.mindmapEditorData.connections = this.mindmapEditorData.connections.filter(
            c => c.from !== this.selectedShape.id && c.to !== this.selectedShape.id
        );

        this.selectedShape = null;
        this.renderShapes();
        this.renderConnections();
    },

    /**
     * Zoom functions
     */
    zoomIn() {
        this.canvasZoom = Math.min(this.canvasZoom * 1.2, 3);
        this.$nextTick(() => { if (window.lucide) lucide.createIcons(); });
    },

    zoomOut() {
        this.canvasZoom = Math.max(this.canvasZoom / 1.2, 0.2);
        this.$nextTick(() => { if (window.lucide) lucide.createIcons(); });
    },

    resetZoom() {
        this.canvasZoom = 1;
        this.canvasPan = { x: 0, y: 0 };
        this.$nextTick(() => { if (window.lucide) lucide.createIcons(); });
    }
};
