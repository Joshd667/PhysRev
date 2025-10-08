// js/features/mindmaps/canvas.js
// Interactive canvas methods for mindmap creation

export const mindmapCanvasMethods = {
    // Canvas state
    mindmapCanvas: null,
    mindmapCtx: null,
    selectedNode: null,
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    connectionStart: null,
    connectionMousePos: null,
    hoverNode: null,
    nodeColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
    currentColorIndex: 0,
    isEditingNode: false,
    editingNodeId: null,

    /**
     * Initialize the mindmap canvas
     */
    initMindmapCanvas() {
        const canvas = document.getElementById('mindmapCanvas');
        if (!canvas) {
            console.error('Mindmap canvas not found!');
            return;
        }

        console.log('Initializing mindmap canvas...');
        this.mindmapCanvas = canvas;
        this.mindmapCtx = canvas.getContext('2d');

        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.clientWidth || 800;
        canvas.height = container.clientHeight || 600;

        console.log(`Canvas initialized: ${canvas.width}x${canvas.height}`);

        // Add event listeners
        canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
        canvas.addEventListener('dblclick', this.handleCanvasDoubleClick.bind(this));
        canvas.addEventListener('wheel', this.handleCanvasWheel.bind(this), { passive: false });
        window.addEventListener('resize', this.handleCanvasResize.bind(this));

        // Initial render
        this.renderMindmap();
    },

    /**
     * Clean up canvas event listeners
     */
    cleanupMindmapCanvas() {
        if (!this.mindmapCanvas) return;

        // Note: We can't remove the bound listeners as they're new functions
        // This is okay since the canvas element will be removed from DOM
        this.mindmapCanvas = null;
        this.mindmapCtx = null;
        this.selectedNode = null;
        this.draggedNode = null;
        this.connectionStart = null;
        this.connectionMousePos = null;
        this.hoverNode = null;
    },

    /**
     * Handle canvas resize
     */
    handleCanvasResize() {
        if (!this.mindmapCanvas) return;
        const container = this.mindmapCanvas.parentElement;
        this.mindmapCanvas.width = container.clientWidth;
        this.mindmapCanvas.height = container.clientHeight;
        this.renderMindmap();
    },

    /**
     * Convert screen coordinates to canvas coordinates
     */
    screenToCanvas(screenX, screenY) {
        const vp = this.mindmapEditorData.viewport;
        return {
            x: (screenX - vp.x) / vp.scale,
            y: (screenY - vp.y) / vp.scale
        };
    },

    /**
     * Convert canvas coordinates to screen coordinates
     */
    canvasToScreen(canvasX, canvasY) {
        const vp = this.mindmapEditorData.viewport;
        return {
            x: canvasX * vp.scale + vp.x,
            y: canvasY * vp.scale + vp.y
        };
    },

    /**
     * Get node at position
     */
    getNodeAtPosition(x, y) {
        const canvasPos = this.screenToCanvas(x, y);

        for (let i = this.mindmapEditorData.nodes.length - 1; i >= 0; i--) {
            const node = this.mindmapEditorData.nodes[i];
            if (canvasPos.x >= node.x && canvasPos.x <= node.x + node.width &&
                canvasPos.y >= node.y && canvasPos.y <= node.y + node.height) {
                return node;
            }
        }
        return null;
    },

    /**
     * Handle mouse down
     */
    handleCanvasMouseDown(e) {
        const rect = this.mindmapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const node = this.getNodeAtPosition(x, y);

        if (e.ctrlKey || e.metaKey) {
            // Connection mode
            if (node) {
                this.connectionStart = node;
                this.connectionMousePos = { x, y };
                this.mindmapCanvas.style.cursor = 'crosshair';
            }
        } else if (e.shiftKey) {
            // Panning mode
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.mindmapCanvas.style.cursor = 'grabbing';
        } else if (node) {
            // Dragging node
            this.draggedNode = node;
            this.selectedNode = node;
            const canvasPos = this.screenToCanvas(x, y);
            this.dragOffset = { x: canvasPos.x - node.x, y: canvasPos.y - node.y };
            this.mindmapCanvas.style.cursor = 'move';
        } else {
            // Deselect
            this.selectedNode = null;
        }

        this.renderMindmap();
    },

    /**
     * Handle mouse move
     */
    handleCanvasMouseMove(e) {
        const rect = this.mindmapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isPanning) {
            const dx = e.clientX - this.panStart.x;
            const dy = e.clientY - this.panStart.y;
            this.mindmapEditorData.viewport.x += dx;
            this.mindmapEditorData.viewport.y += dy;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.renderMindmap();
        } else if (this.draggedNode) {
            const canvasPos = this.screenToCanvas(x, y);
            this.draggedNode.x = canvasPos.x - this.dragOffset.x;
            this.draggedNode.y = canvasPos.y - this.dragOffset.y;
            this.renderMindmap();
        } else if (this.connectionStart) {
            // Update connection preview line
            this.connectionMousePos = { x, y };
            this.renderMindmap();
        } else {
            // Update hover state
            const node = this.getNodeAtPosition(x, y);
            const prevHover = this.hoverNode;
            this.hoverNode = node;

            // Update cursor based on hover
            if (node) {
                this.mindmapCanvas.style.cursor = 'pointer';
            } else {
                this.mindmapCanvas.style.cursor = 'crosshair';
            }

            if (node !== prevHover) {
                this.renderMindmap();
            }
        }
    },

    /**
     * Handle mouse up
     */
    handleCanvasMouseUp(e) {
        if (this.connectionStart) {
            const rect = this.mindmapCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const endNode = this.getNodeAtPosition(x, y);

            if (endNode && endNode !== this.connectionStart) {
                // Create connection
                this.mindmapEditorData.connections.push({
                    from: this.connectionStart.id,
                    to: endNode.id,
                    color: '#666'
                });
            }

            this.connectionStart = null;
            this.connectionMousePos = null;
            this.renderMindmap();
        }

        this.draggedNode = null;
        this.isPanning = false;
        this.mindmapCanvas.style.cursor = 'crosshair';
    },

    /**
     * Handle double click - create new node
     */
    handleCanvasDoubleClick(e) {
        const rect = this.mindmapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on existing node - edit it
        const existingNode = this.getNodeAtPosition(x, y);
        if (existingNode) {
            this.openMindmapNodeEditorForNode(existingNode.id);
            return;
        }

        // Create new node
        const canvasPos = this.screenToCanvas(x, y);
        this.openMindmapNodeEditorForCreation(canvasPos.x - 60, canvasPos.y - 30);
    },

    /**
     * Open node editor for creating a new node
     */
    openMindmapNodeEditorForCreation(x, y) {
        this.mindmapNodeEditorMode = 'create';
        this.mindmapNodeEditorContent = '';
        this.mindmapNodeEditorPosition = { x, y };
        this.mindmapNodeEditorId = null;
        this.showMindmapNodeEditor = true;

        this.$nextTick(() => {
            const editor = document.getElementById('mindmapNodeContentEditor');
            if (editor) {
                editor.innerHTML = '';
                editor.focus();
            }
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Open node editor for editing existing node
     */
    openMindmapNodeEditorForNode(nodeId) {
        const node = this.mindmapEditorData.nodes.find(n => n.id === nodeId);
        if (!node) return;

        this.mindmapNodeEditorMode = 'edit';
        this.mindmapNodeEditorContent = node.content || node.text || '';
        this.mindmapNodeEditorPosition = { x: node.x, y: node.y };
        this.mindmapNodeEditorId = nodeId;
        this.showMindmapNodeEditor = true;

        this.$nextTick(() => {
            const editor = document.getElementById('mindmapNodeContentEditor');
            if (editor) {
                editor.innerHTML = node.content || node.text || '';
                editor.focus();
            }
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Close node editor
     */
    closeMindmapNodeEditor() {
        this.showMindmapNodeEditor = false;
        this.mindmapNodeEditorContent = '';
        this.mindmapNodeEditorPosition = { x: 0, y: 0 };
        this.mindmapNodeEditorId = null;
    },

    /**
     * Save node from editor
     */
    saveMindmapNode() {
        const editor = document.getElementById('mindmapNodeContentEditor');
        const content = editor ? editor.innerHTML : this.mindmapNodeEditorContent;

        if (!content || content.trim() === '' || content.trim() === '<br>') {
            alert('Please enter some content for the node');
            return;
        }

        // Extract plain text for canvas display
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        if (this.mindmapNodeEditorMode === 'create') {
            // Create new node
            const color = this.nodeColors[this.currentColorIndex % this.nodeColors.length];
            this.currentColorIndex++;

            const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.mindmapEditorData.nodes.push({
                id: nodeId,
                x: this.mindmapNodeEditorPosition.x,
                y: this.mindmapNodeEditorPosition.y,
                width: 120,
                height: 60,
                text: plainText.substring(0, 100), // Preview text for canvas
                content: content, // Full HTML content
                color: color
            });
        } else {
            // Update existing node
            const node = this.mindmapEditorData.nodes.find(n => n.id === this.mindmapNodeEditorId);
            if (node) {
                node.content = content;
                node.text = plainText.substring(0, 100);
            }
        }

        this.closeMindmapNodeEditor();
        this.renderMindmap();
    },

    /**
     * Format mindmap text (for node editor)
     */
    formatMindmapText(command, value = null) {
        document.execCommand(command, false, value);
        const editor = document.getElementById('mindmapNodeContentEditor');
        if (editor) {
            this.mindmapNodeEditorContent = editor.innerHTML;
        }
    },


    /**
     * Handle mouse wheel - zoom
     */
    handleCanvasWheel(e) {
        e.preventDefault();

        const rect = this.mindmapCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const oldScale = this.mindmapEditorData.viewport.scale;
        const newScale = Math.max(0.1, Math.min(3, oldScale * delta));

        // Zoom towards mouse position
        this.mindmapEditorData.viewport.x = mouseX - (mouseX - this.mindmapEditorData.viewport.x) * (newScale / oldScale);
        this.mindmapEditorData.viewport.y = mouseY - (mouseY - this.mindmapEditorData.viewport.y) * (newScale / oldScale);
        this.mindmapEditorData.viewport.scale = newScale;

        this.renderMindmap();
    },

    /**
     * Render the mindmap
     */
    renderMindmap() {
        if (!this.mindmapCtx) return;

        const ctx = this.mindmapCtx;
        const canvas = this.mindmapCanvas;

        // Clear canvas
        ctx.fillStyle = '#f9fafb';
        if (this.darkMode) {
            ctx.fillStyle = '#1f2937';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        this.drawGrid(ctx);

        // Draw connections
        this.mindmapEditorData.connections.forEach(conn => {
            const fromNode = this.mindmapEditorData.nodes.find(n => n.id === conn.from);
            const toNode = this.mindmapEditorData.nodes.find(n => n.id === conn.to);
            if (fromNode && toNode) {
                this.drawConnection(ctx, fromNode, toNode, conn);
            }
        });

        // Draw temporary connection line
        if (this.connectionStart && this.connectionMousePos) {
            const fromPos = this.canvasToScreen(
                this.connectionStart.x + this.connectionStart.width / 2,
                this.connectionStart.y + this.connectionStart.height / 2
            );

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(fromPos.x, fromPos.y);
            ctx.lineTo(this.connectionMousePos.x, this.connectionMousePos.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw nodes
        this.mindmapEditorData.nodes.forEach(node => {
            this.drawNode(ctx, node);
        });
    },

    /**
     * Draw grid
     */
    drawGrid(ctx) {
        const vp = this.mindmapEditorData.viewport;
        const gridSize = 20 * vp.scale;

        ctx.strokeStyle = this.darkMode ? '#374151' : '#e5e7eb';
        ctx.lineWidth = 1;

        const startX = (vp.x % gridSize);
        const startY = (vp.y % gridSize);

        for (let x = startX; x < this.mindmapCanvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.mindmapCanvas.height);
            ctx.stroke();
        }

        for (let y = startY; y < this.mindmapCanvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.mindmapCanvas.width, y);
            ctx.stroke();
        }
    },

    /**
     * Draw connection
     */
    drawConnection(ctx, fromNode, toNode, conn) {
        const fromPos = this.canvasToScreen(fromNode.x + fromNode.width / 2, fromNode.y + fromNode.height / 2);
        const toPos = this.canvasToScreen(toNode.x + toNode.width / 2, toNode.y + toNode.height / 2);

        ctx.strokeStyle = conn.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
        const arrowSize = 10;
        ctx.fillStyle = conn.color;
        ctx.beginPath();
        ctx.moveTo(toPos.x, toPos.y);
        ctx.lineTo(
            toPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
            toPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
            toPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    },

    /**
     * Draw node
     */
    drawNode(ctx, node) {
        const screenPos = this.canvasToScreen(node.x, node.y);
        const screenWidth = node.width * this.mindmapEditorData.viewport.scale;
        const screenHeight = node.height * this.mindmapEditorData.viewport.scale;

        // Shadow for hover/selected
        if (node === this.selectedNode || node === this.hoverNode) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
        }

        // Draw rounded rectangle
        ctx.fillStyle = node.color;
        this.roundRect(ctx, screenPos.x, screenPos.y, screenWidth, screenHeight, 8);
        ctx.fill();

        // Border for selected or connection start
        if (node === this.selectedNode) {
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 3;
            this.roundRect(ctx, screenPos.x, screenPos.y, screenWidth, screenHeight, 8);
            ctx.stroke();
        } else if (node === this.connectionStart) {
            // Highlight connection start node
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 4;
            this.roundRect(ctx, screenPos.x, screenPos.y, screenWidth, screenHeight, 8);
            ctx.stroke();
        } else if (this.connectionStart && node === this.hoverNode) {
            // Highlight potential connection target
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            this.roundRect(ctx, screenPos.x, screenPos.y, screenWidth, screenHeight, 8);
            ctx.stroke();
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(12, 14 * this.mindmapEditorData.viewport.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = this.wrapText(ctx, node.text, screenWidth - 20);
        const lineHeight = Math.max(14, 16 * this.mindmapEditorData.viewport.scale);
        const totalHeight = lines.length * lineHeight;
        const startY = screenPos.y + screenHeight / 2 - totalHeight / 2 + lineHeight / 2;

        lines.forEach((line, i) => {
            ctx.fillText(line, screenPos.x + screenWidth / 2, startY + i * lineHeight);
        });

        // Draw indicator if node has rich content
        if (node.content && node.content !== node.text) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(screenPos.x + screenWidth - 8, screenPos.y + 8, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },

    /**
     * Draw rounded rectangle
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    /**
     * Wrap text
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    },

    /**
     * Delete selected node
     */
    deleteSelectedNode() {
        if (!this.selectedNode) {
            alert('Please select a node first');
            return;
        }

        // Remove node
        const index = this.mindmapEditorData.nodes.indexOf(this.selectedNode);
        if (index > -1) {
            this.mindmapEditorData.nodes.splice(index, 1);
        }

        // Remove connections to/from this node
        this.mindmapEditorData.connections = this.mindmapEditorData.connections.filter(
            conn => conn.from !== this.selectedNode.id && conn.to !== this.selectedNode.id
        );

        this.selectedNode = null;
        this.renderMindmap();
    },

    /**
     * Edit selected node
     */
    editSelectedNode() {
        if (!this.selectedNode) {
            alert('Please select a node first');
            return;
        }

        this.openMindmapNodeEditorForNode(this.selectedNode.id);
    },

    /**
     * Change selected node color
     */
    changeSelectedNodeColor() {
        if (!this.selectedNode) {
            alert('Please select a node first');
            return;
        }

        // Cycle through colors
        const currentIndex = this.nodeColors.indexOf(this.selectedNode.color);
        const nextIndex = (currentIndex + 1) % this.nodeColors.length;
        this.selectedNode.color = this.nodeColors[nextIndex];
        this.renderMindmap();
    },

    /**
     * Reset viewport
     */
    resetViewport() {
        this.mindmapEditorData.viewport = { x: 0, y: 0, scale: 1 };
        this.renderMindmap();
    },

    /**
     * Center mindmap
     */
    centerMindmap() {
        if (this.mindmapEditorData.nodes.length === 0) return;

        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.mindmapEditorData.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Center on canvas
        this.mindmapEditorData.viewport.x = this.mindmapCanvas.width / 2 - centerX * this.mindmapEditorData.viewport.scale;
        this.mindmapEditorData.viewport.y = this.mindmapCanvas.height / 2 - centerY * this.mindmapEditorData.viewport.scale;

        this.renderMindmap();
    }
};
