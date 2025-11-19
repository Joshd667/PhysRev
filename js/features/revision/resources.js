// js/features/revision/resources.js - Revision resource loading methods

export const revisionResourceMethods = {
    openRevisionForTopic(topicId) {
        // Get the revision section from the global mapping
        const section = window.topicToSectionMapping[topicId];

        if (section && window.revisionMapping[section]) {
            this.currentRevisionSection = section;
            this.currentRevisionSectionTitle = window.revisionSectionTitles[section] || section;
            this.currentRevisionTopics = this.getTopicsForRevision(window.revisionMapping[section]);

            // Load resources for the section
            if (window.getResourcesForSection) {
                try {
                    this.currentRevisionResources = window.getResourcesForSection(section);
                } catch (error) {
                    console.error('Error loading resources:', error);
                    this.currentRevisionResources = {
                        section: null,
                        videos: [],
                        notes: [],
                        simulations: [],
                        questions: []
                    };
                }
            } else {
                console.error('getResourcesForSection function not available');
                this.currentRevisionResources = null;
            }

            // Set revision state within the main audit view
            this.showingRevision = true;
            this.showingSpecificSection = false;
            this.showingMainMenu = false;
            this.showingAnalytics = false;

            // Close sidebar on mobile when navigating to revision
            if (window.innerWidth < 768) {
                this.sidebarVisible = false;
            }

            // Force UI update and icon refresh
            this.$nextTick(() => {
                if (window.lucide && window.lucide.createIcons) {
                    window.lucide.createIcons();
                }
            });

        }
    },

    hasResources() {
        if (!this.currentRevisionResources) {
            return false;
        }

        const count = this.getResourceCount();
        return count > 0;
    },

    getResourceCount() {
        if (!this.currentRevisionResources) {
            return 0;
        }

        const count = (this.currentRevisionResources.videos?.length || 0) +
                      (this.currentRevisionResources.notes?.length || 0) +
                      (this.currentRevisionResources.simulations?.length || 0) +
                      (this.currentRevisionResources.questions?.length || 0);

        return count;
    },

    getResourceTypeBg(type) {
        const backgrounds = {
            videos: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            notes: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            simulations: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
            questions: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        };
        return backgrounds[type] || 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    },

    getResourceTypeIcon(type) {
        const icons = {
            videos: 'play-circle',
            notes: 'file-text',
            simulations: 'zap',
            questions: 'help-circle'
        };
        return icons[type] || 'file';
    },

    getResourceTypeColor(type) {
        const colors = {
            videos: 'text-red-600 dark:text-red-400',
            notes: 'text-blue-600 dark:text-blue-400',
            simulations: 'text-purple-600 dark:text-purple-400',
            questions: 'text-green-600 dark:text-green-400'
        };
        return colors[type] || 'text-gray-600 dark:text-gray-400';
    },

    getTopicsForRevision(topicIds) {
        const topics = [];

        // Search through all specification data to find topics with matching IDs
        Object.values(this.specificationData).forEach(section => {
            if (section.topics) {
                section.topics.forEach(topic => {
                    if (topicIds.includes(topic.id)) {
                        topics.push({
                            ...topic,
                            sectionTitle: section.title,
                            sectionPaper: section.paper
                        });
                    }
                });
            }
        });

        // Sort topics by their ID for consistent ordering
        return topics.sort((a, b) => a.id.localeCompare(b.id));
    }
};
