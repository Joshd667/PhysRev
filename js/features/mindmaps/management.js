// js/features/mindmaps/management.js
// CRUD operations for user mindmaps

export const mindmapManagementMethods = {
    /**
     * Opens the mindmap editor modal for creating a new mindmap
     */
    openMindmapEditor(sectionId = null, topicId = null) {
        this.mindmapEditorMode = 'create';
        this.mindmapEditorSectionId = sectionId || this.currentRevisionSection;
        this.mindmapEditorTitle = '';
        this.mindmapEditorId = null;
        this.mindmapEditorData = {
            nodes: [],
            connections: [],
            viewport: { x: 0, y: 0, scale: 1 }
        };

        // Reset shapes for new diagram
        this.shapes = {};
        this.selectedShapeId = null;

        // Auto-assign tags from current context
        if (topicId) {
            // Single topic provided
            this.mindmapEditorTags = [topicId];
        } else if (this.currentRevisionTopics && this.currentRevisionTopics.length > 0) {
            // Multiple topics from revision view
            this.mindmapEditorTags = this.currentRevisionTopics.map(t => t.id);
        } else {
            this.mindmapEditorTags = [];
        }

        this.showMindmapEditor = true;

        // Initialize canvas after modal opens
        this.$nextTick(() => {
            this.initMindmapCanvas();
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Opens the mindmap editor modal for editing an existing mindmap
     */
    editMindmap(mindmapId) {
        const mindmap = this.mindmaps[mindmapId];
        if (!mindmap) {
            console.warn('Mindmap not found:', mindmapId);
            return;
        }

        this.mindmapEditorMode = 'edit';
        this.mindmapEditorSectionId = mindmap.sectionId;
        this.mindmapEditorTitle = mindmap.title;
        this.mindmapEditorId = mindmapId;
        this.mindmapEditorData = {
            nodes: JSON.parse(JSON.stringify(mindmap.nodes || [])),
            connections: JSON.parse(JSON.stringify(mindmap.connections || [])),
            viewport: JSON.parse(JSON.stringify(mindmap.viewport || { x: 0, y: 0, scale: 1 }))
        };
        this.mindmapEditorTags = [...(mindmap.tags || [])]; // Copy the tags
        this.showMindmapEditor = true;

        // Initialize canvas with existing data
        this.$nextTick(() => {
            this.initMindmapCanvas();
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Closes the mindmap editor modal
     */
    closeMindmapEditor() {
        this.showMindmapEditor = false;
        this.mindmapEditorMode = 'create';
        this.mindmapEditorSectionId = null;
        this.mindmapEditorTitle = '';
        this.mindmapEditorId = null;
        this.mindmapEditorData = {
            nodes: [],
            connections: [],
            viewport: { x: 0, y: 0, scale: 1 }
        };
        this.mindmapEditorTags = [];

        // Clean up shapes
        this.shapes = {};
        this.selectedShapeId = null;
        this.isDraggingShape = false;

        // Clean up canvas listeners
        if (this.cleanupMindmapCanvas) {
            this.cleanupMindmapCanvas();
        }
    },

    /**
     * Saves the current mindmap (create or update)
     */
    saveMindmap() {
        // Validation
        if (!this.mindmapEditorTitle.trim()) {
            alert('Please enter a title for your mindmap');
            return;
        }

        // Convert shapes object map to array for storage
        const shapesArray = Object.values(this.shapes || {});

        if (shapesArray.length === 0) {
            alert('Please add at least one shape to your diagram');
            return;
        }

        const timestamp = new Date().toISOString();

        if (this.mindmapEditorMode === 'create') {
            // Create new mindmap
            const mindmapId = `mindmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.mindmaps[mindmapId] = {
                id: mindmapId,
                sectionId: this.mindmapEditorSectionId,
                title: this.mindmapEditorTitle.trim(),
                nodes: shapesArray,  // Save shapes array
                connections: [],  // No connections in MVP
                viewport: { x: 0, y: 0, scale: this.canvasZoom },
                tags: this.mindmapEditorTags,
                createdAt: timestamp,
                updatedAt: timestamp
            };
        } else {
            // Update existing mindmap
            if (this.mindmaps[this.mindmapEditorId]) {
                this.mindmaps[this.mindmapEditorId].title = this.mindmapEditorTitle.trim();
                this.mindmaps[this.mindmapEditorId].nodes = shapesArray;  // Save shapes array
                this.mindmaps[this.mindmapEditorId].connections = [];  // No connections in MVP
                this.mindmaps[this.mindmapEditorId].viewport = { x: 0, y: 0, scale: this.canvasZoom };
                this.mindmaps[this.mindmapEditorId].tags = this.mindmapEditorTags;
                this.mindmaps[this.mindmapEditorId].updatedAt = timestamp;
            }
        }

        // Save to localStorage
        this.saveMindmaps();

        // Close editor
        this.closeMindmapEditor();

        // Refresh icons after save
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Deletes a mindmap
     */
    deleteMindmap(mindmapId) {
        const mindmap = this.mindmaps[mindmapId];
        if (!mindmap) return;

        if (confirm(`Are you sure you want to delete "${mindmap.title}"?`)) {
            delete this.mindmaps[mindmapId];
            this.saveMindmaps();
        }
    },

    /**
     * Toggles the pin status of a mindmap
     */
    toggleMindmapPin(mindmapId) {
        const mindmap = this.mindmaps[mindmapId];
        if (!mindmap) return;

        mindmap.pinned = !mindmap.pinned;
        mindmap.updatedAt = new Date().toISOString();
        this.saveMindmaps();

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Gets all mindmaps for the current revision section
     */
    getMindmapsForCurrentSection() {
        if (!this.currentRevisionSection) return [];

        return Object.values(this.mindmaps || {})
            .filter(mindmap => mindmap.sectionId === this.currentRevisionSection)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
};
