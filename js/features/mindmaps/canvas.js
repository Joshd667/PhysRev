// js/features/mindmaps/canvas.js
// SVG-based diagramming tool using Alpine.js patterns

export const mindmapCanvasMethods = {
    // Main Application State (as specified in requirements)
    shapes: {},  // Object map to store shapes, keys are unique IDs
    selectedShapeId: null,  // ID of currently selected shape
    isDraggingShape: false,  // Flag for drag-move operation
    dragOffsetX: 0,  // Mouse offset X within shape during drag
    dragOffsetY: 0,  // Mouse offset Y within shape during drag
    availableShapes: [
        { type: 'rect', label: 'Rectangle' },
        { type: 'circle', label: 'Circle' },
        { type: 'ellipse', label: 'Ellipse' },
        { type: 'diamond', label: 'Diamond' }
    ],
    canvasZoom: 1,  // For zoom controls

    /**
     * Initialize canvas
     */
    initMindmapCanvas() {
        console.log('Initializing SVG diagramming canvas...');

        // Load existing shapes from mindmapEditorData if in edit mode
        if (this.mindmapEditorData && this.mindmapEditorData.nodes && this.mindmapEditorData.nodes.length > 0) {
            // Convert array to object map
            this.shapes = {};
            this.mindmapEditorData.nodes.forEach(node => {
                this.shapes[node.id] = {
                    id: node.id,
                    type: node.type || 'rect',
                    x: node.x || 50,
                    y: node.y || 50,
                    width: node.width || 100,
                    height: node.height || 80,
                    fill: node.fill || node.style?.fill || '#ffffff',
                    stroke: node.stroke || node.style?.borderColor || '#000000',
                    strokeWidth: node.strokeWidth || node.style?.borderWidth || 2,
                    text: node.content || node.text || ''
                };
            });
        } else {
            this.shapes = {};
        }

        this.selectedShapeId = null;
        this.isDraggingShape = false;

        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });

        console.log('Canvas initialized with', Object.keys(this.shapes).length, 'shapes');
    },

    /**
     * Clean up canvas state
     */
    cleanupMindmapCanvas() {
        this.shapes = {};
        this.selectedShapeId = null;
        this.isDraggingShape = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
    },

    /**
     * addShape(event)
     * Called by @drop handler on SVG
     * Gets shapeType from dataTransfer, calculates coordinates, creates new shape
     */
    addShape(event) {
        event.preventDefault();

        // Get the shape type from dataTransfer
        const shapeType = event.dataTransfer.getData('shapeType');
        if (!shapeType) return;

        // Get the SVG element to calculate coordinates
        const svg = document.getElementById('mainCanvas');
        if (!svg) return;

        const rect = svg.getBoundingClientRect();

        // Calculate drop coordinates relative to SVG canvas
        const x = event.clientX - rect.left - 50;  // Center shape (100px width / 2)
        const y = event.clientY - rect.top - 40;   // Center shape (80px height / 2)

        // Generate unique ID using crypto.randomUUID()
        const id = crypto.randomUUID();

        // Create new shape object with default properties
        const newShape = {
            id: id,
            type: shapeType,
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: 100,
            height: 80,
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
            text: 'Shape'
        };

        // Add to shapes map
        this.shapes[id] = newShape;

        // Select the new shape
        this.selectedShapeId = id;

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });

        console.log('Added shape:', newShape);
    },

    /**
     * startMove(event, id)
     * Called by @mousedown handler on shape's <g> element
     * Sets selectedShapeId, isDraggingShape, and calculates dragOffset
     */
    startMove(event, id) {
        // Set selected shape
        this.selectedShapeId = id;

        // Set dragging flag
        this.isDraggingShape = true;

        // Get the shape
        const shape = this.shapes[id];
        if (!shape) return;

        // Get SVG coordinates
        const svg = document.getElementById('mainCanvas');
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Calculate offset within shape (for smooth drag that doesn't snap)
        this.dragOffsetX = mouseX - shape.x;
        this.dragOffsetY = mouseY - shape.y;

        console.log('Start move:', id, 'offset:', this.dragOffsetX, this.dragOffsetY);
    },

    /**
     * moveShape(event)
     * Called by @mousemove handler on SVG
     * Updates shape position if isDraggingShape is true
     */
    moveShape(event) {
        // Check if we're dragging
        if (!this.isDraggingShape || !this.selectedShapeId) {
            return;
        }

        // Get the shape
        const shape = this.shapes[this.selectedShapeId];
        if (!shape) return;

        // Get SVG coordinates
        const svg = document.getElementById('mainCanvas');
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Calculate new position by subtracting the stored offset
        const newX = mouseX - this.dragOffsetX;
        const newY = mouseY - this.dragOffsetY;

        // Update shape position
        shape.x = Math.max(0, newX);
        shape.y = Math.max(0, newY);

        // Force Alpine to react to the change
        this.shapes = { ...this.shapes };
    },

    /**
     * stopMove()
     * Called by @mouseup and @mouseleave handlers on SVG
     * Sets isDraggingShape to false
     */
    stopMove() {
        if (this.isDraggingShape) {
            console.log('Stop move');
            this.isDraggingShape = false;
        }
    },

    /**
     * Delete selected shape
     */
    deleteSelectedShape() {
        if (!this.selectedShapeId) return;

        console.log('Deleting shape:', this.selectedShapeId);

        // Remove from shapes map
        delete this.shapes[this.selectedShapeId];

        // Deselect
        this.selectedShapeId = null;

        // Force Alpine to react
        this.shapes = { ...this.shapes };

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });
    },

    /**
     * Zoom functions
     */
    zoomIn() {
        this.canvasZoom = Math.min(this.canvasZoom * 1.2, 3);
        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });
    },

    zoomOut() {
        this.canvasZoom = Math.max(this.canvasZoom / 1.2, 0.2);
        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });
    },

    resetZoom() {
        this.canvasZoom = 1;
        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });
    }
};
