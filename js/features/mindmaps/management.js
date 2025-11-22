// js/features/mindmaps/management.js
// CRUD operations for user mindmaps

import { logger } from '../../utils/logger.js';

export const mindmapManagementMethods = {
    /**
     * Opens the mindmap editor modal for creating a new mindmap
     * ⚡ OPTIMIZED: Lazy-loads template on first use (47 KB)
     */
    async openMindmapEditor(sectionId = null, topicId = null) {
        try {
            // ⚡ Lazy-load mindmap editor template (47 KB) on first use
            const { loadTemplateLazy } = await import('../../template-loader.js');

            // 🛡️ SAFETY: Handle version mismatch during updates
            if (typeof loadTemplateLazy !== 'function') {
                logger.warn('⚠️ loadTemplateLazy not available - reloading to complete update');
                window.location.reload();
                return;
            }

            await loadTemplateLazy('mindmap-editor-modal-container', './templates/mindmap-editor-modal.html');
        } catch (error) {
            logger.error('❌ Failed to open mindmap editor:', error);
            if (error.message && error.message.includes('not a function')) {
                logger.warn('🔄 Reloading to complete app update...');
                window.location.reload();
                return;
            }
            throw error;
        }

        this.mindmapEditorMode = 'create';
        this.mindmapEditorSectionId = sectionId || this.currentRevisionSection;
        this.mindmapEditorTitle = '';
        this.mindmapEditorId = null;
        this.mindmapEditorData = {
            nodes: [],
            connections: [],
            viewport: { x: 0, y: 0, scale: 1 }
        };

        // Auto-populate tags only when in Knowledge Audit revision mode
        if (this.showingRevision) {
            // In Knowledge Audit - auto-assign tags from current revision context
            if (topicId) {
                this.mindmapEditorTags = [topicId];
            } else if (this.currentRevisionTopics && this.currentRevisionTopics.length > 0) {
                this.mindmapEditorTags = this.currentRevisionTopics.map(t => t.id);
            } else {
                this.mindmapEditorTags = [];
            }
        } else {
            // Not in Knowledge Audit - don't auto-populate, user must manually select
            this.mindmapEditorTags = [];
        }

        this.showMindmapEditor = true;

        // Initialize canvas after modal opens
        this.$nextTick(() => {
            this.initMindmapCanvas();
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Opens the mindmap editor modal for editing an existing mindmap
     */
    editMindmap(mindmapId) {
        const mindmap = this.mindmaps[mindmapId];
        if (!mindmap) {
            logger.warn('Mindmap not found:', mindmapId);
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

        // Initialize canvas with existing data - wait for modal animation to complete
        setTimeout(() => {
            const checkAndInit = () => {
                const container = document.getElementById('shapesContainer');
                const canvas = document.getElementById('canvasDropZone');

                if (container && canvas) {
                    this.initMindmapCanvas();

                    // Force a second render after a brief delay to ensure visibility
                    setTimeout(() => {
                        this.renderShapes();
                        this.renderConnections();
                        if (window.lucide) {
                            lucide.createIcons();
                        }
                    }, 100);
                } else {
                    // If container not ready, try again
                    setTimeout(checkAndInit, 50);
                }
            };
            checkAndInit();
        }, 250); // Increased delay to wait for modal transition (200ms transition + 50ms buffer)
    },

    /**
     * Closes the mindmap editor modal with unsaved changes warning
     * @param {boolean} skipConfirmation - Skip the unsaved changes warning (e.g., after saving)
     */
    async closeMindmapEditor(skipConfirmation = false) {
        // Check if there are unsaved changes (unless skipping confirmation)
        if (!skipConfirmation) {
            const hasContent = this.mindmapEditorTitle.trim() ||
                              this.mindmapEditorData.nodes.length > 0 ||
                              this.mindmapEditorData.connections.length > 0;

            if (hasContent) {
                const confirmed = await this.showConfirm(
                    'You have unsaved changes. Are you sure you want to close without saving?',
                    'Unsaved Changes'
                );

                if (!confirmed) {
                    return; // User cancelled, keep editor open
                }
            }
        }

        // Clean up canvas listeners FIRST (before clearing data)
        this.cleanupMindmapCanvas();

        // Close and reset
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
    },

    /**
     * Saves the current mindmap (create or update)
     */
    async saveMindmap() {
        // CRITICAL FIX: Save any currently editing shape text before saving mindmap
        if (this.editingShape && this.editingShape._saveEditFn) {
            this.editingShape._saveEditFn();
        }

        // Validation
        if (!this.mindmapEditorTitle.trim()) {
            await this.showAlert('Please enter a title for your mindmap', 'Missing Title');
            return;
        }

        if (this.mindmapEditorData.nodes.length === 0) {
            await this.showAlert('Please add at least one node to your mindmap', 'No Nodes');
            return;
        }

        // Require at least one tag
        if (!this.mindmapEditorTags || this.mindmapEditorTags.length === 0) {
            await this.showAlert('Please add at least one tag to your mindmap', 'Missing Tags');
            return;
        }

        const timestamp = new Date().toISOString();

        if (this.mindmapEditorMode === 'create') {
            // Create new mindmap
            const mindmapId = `mindmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newMindmap = {
                id: mindmapId,
                sectionId: this.mindmapEditorSectionId,
                title: this.mindmapEditorTitle.trim(),
                nodes: this.mindmapEditorData.nodes,
                connections: this.mindmapEditorData.connections,
                viewport: this.mindmapEditorData.viewport,
                tags: this.mindmapEditorTags,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            this.mindmaps[mindmapId] = newMindmap;

            // ⚡ PERFORMANCE: Update search index
            // Note: mindmaps use "nodes" not "shapes" in storage
            this._addMindmapToIndex({ ...newMindmap, shapes: newMindmap.nodes });
        } else {
            // Update existing mindmap
            if (this.mindmaps[this.mindmapEditorId]) {
                this.mindmaps[this.mindmapEditorId].title = this.mindmapEditorTitle.trim();
                this.mindmaps[this.mindmapEditorId].nodes = this.mindmapEditorData.nodes;
                this.mindmaps[this.mindmapEditorId].connections = this.mindmapEditorData.connections;
                this.mindmaps[this.mindmapEditorId].viewport = this.mindmapEditorData.viewport;
                this.mindmaps[this.mindmapEditorId].tags = this.mindmapEditorTags;
                this.mindmaps[this.mindmapEditorId].updatedAt = timestamp;

                // ⚡ PERFORMANCE: Update search index
                // Note: mindmaps use "nodes" not "shapes" in storage
                this._updateMindmapInIndex({ ...this.mindmaps[this.mindmapEditorId], shapes: this.mindmaps[this.mindmapEditorId].nodes });
            }
        }

        // Save to localStorage
        this.saveMindmaps();

        // Close editor (skip confirmation since we just saved)
        this.closeMindmapEditor(true);

        // Refresh icons after save
        this.$nextTick(() => {
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Deletes a mindmap
     */
    async deleteMindmap(mindmapId) {
        const mindmap = this.mindmaps[mindmapId];
        if (!mindmap) return;

        const confirmed = await this.showConfirm(
            `Are you sure you want to delete "${mindmap.title}"?`,
            'Delete Mindmap'
        );

        if (confirmed) {
            delete this.mindmaps[mindmapId];

            // ⚡ PERFORMANCE: Update search index
            this._removeMindmapFromIndex(mindmapId);

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
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Export a saved mindmap as SVG (from the list view)
     */
    async exportSavedMindmapAsSVG(mindmapId) {
        const mindmap = this.mindmaps[mindmapId];
        if (!mindmap) {
            logger.warn('Mindmap not found:', mindmapId);
            return;
        }

        // Check if there's data to export
        if (!mindmap.nodes || mindmap.nodes.length === 0) {
            await this.showAlert('This mindmap has no shapes to export!', 'Nothing to Export');
            return;
        }

        // Temporarily set the editor data to this mindmap for export
        const originalData = this.mindmapEditorData;
        const originalTitle = this.mindmapEditorTitle;

        this.mindmapEditorData = {
            nodes: mindmap.nodes || [],
            connections: mindmap.connections || [],
            viewport: mindmap.viewport || { x: 0, y: 0, scale: 1 }
        };
        this.mindmapEditorTitle = mindmap.title;

        // Call the canvas export function (which will be available via method merging)
        this.exportMindmapAsSVG();

        // Restore original data
        this.mindmapEditorData = originalData;
        this.mindmapEditorTitle = originalTitle;
    },

    /**
     * Gets all mindmaps for the current revision section
     */
    getMindmapsForCurrentSection() {
        if (!this.currentRevisionSection) return [];
        if (!this.currentRevisionTopics || this.currentRevisionTopics.length === 0) return [];

        // Get topic IDs from current revision topics
        const topicIds = this.currentRevisionTopics.map(topic => topic.id);

        return Object.values(this.mindmaps || {})
            .filter(mindmap => {
                // Defensive: Ensure mindmap exists and has valid ID (critical for Alpine x-for)
                if (!mindmap || mindmap.id === undefined || mindmap.id === null) {
                    return false;
                }
                // Primary: Check if ANY tag matches ANY topic in the revision section
                if (mindmap.tags && mindmap.tags.length > 0) {
                    return mindmap.tags.some(tag => topicIds.includes(tag));
                }
                // Fallback: For backward compatibility with old mindmaps, check sectionId
                return mindmap.sectionId === this.currentRevisionSection;
            })
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
};
