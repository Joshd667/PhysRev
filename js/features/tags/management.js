// js/features/tags/management.js
// Methods for managing tags on notes, flashcards, and mindmaps

import { getTopicDisplayName, getTopicShortName, groupTopicsBySection, searchTopics } from '../../utils/topic-lookup.js';

export const tagManagementMethods = {
    /**
     * Opens the tag selector modal
     * @param {string} context - 'note', 'flashcard', or 'mindmap'
     */
    openTagSelector(context) {
        this.tagSelectorContext = context;
        this.tagSelectorQuery = '';
        this.tagSelectorExpandedSections = {}; // Reset all sections to closed
        this.showTagSelector = true;

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Closes the tag selector modal
     */
    closeTagSelector() {
        this.showTagSelector = false;
        this.tagSelectorContext = null;
        this.tagSelectorQuery = '';
        
        // Re-render icons after closing to update any new tags
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Gets the current tags array based on context
     */
    getCurrentTags() {
        switch (this.tagSelectorContext) {
            case 'note':
                return this.noteEditorTags;
            case 'flashcard':
                return this.flashcardEditorTags;
            case 'mindmap':
                return this.mindmapEditorTags;
            case 'advancedSearch':
                return this.advancedSearchTags;
            default:
                return [];
        }
    },

    /**
     * Adds a tag to the current editor
     * @param {string} topicId - The topic ID to add as a tag
     */
    addTag(topicId) {
        const currentTags = this.getCurrentTags();

        // Don't add duplicate tags
        if (currentTags.includes(topicId)) {
            return;
        }

        switch (this.tagSelectorContext) {
            case 'note':
                this.noteEditorTags.push(topicId);
                break;
            case 'flashcard':
                this.flashcardEditorTags.push(topicId);
                break;
            case 'mindmap':
                this.mindmapEditorTags.push(topicId);
                break;
            case 'advancedSearch':
                this.advancedSearchTags.push(topicId);
                break;
        }
    },

    /**
     * Removes a tag from the current editor
     * @param {string} topicId - The topic ID to remove
     */
    removeTag(topicId) {
        switch (this.tagSelectorContext) {
            case 'note':
                this.noteEditorTags = this.noteEditorTags.filter(t => t !== topicId);
                break;
            case 'flashcard':
                this.flashcardEditorTags = this.flashcardEditorTags.filter(t => t !== topicId);
                break;
            case 'mindmap':
                this.mindmapEditorTags = this.mindmapEditorTags.filter(t => t !== topicId);
                break;
            case 'advancedSearch':
                this.advancedSearchTags = this.advancedSearchTags.filter(t => t !== topicId);
                break;
        }
    },

    /**
     * Removes a tag directly from an editor (without opening selector)
     * @param {string} context - 'note', 'flashcard', or 'mindmap'
     * @param {string} topicId - The topic ID to remove
     */
    removeTagDirect(context, topicId) {
        switch (context) {
            case 'note':
                this.noteEditorTags = this.noteEditorTags.filter(t => t !== topicId);
                break;
            case 'flashcard':
                this.flashcardEditorTags = this.flashcardEditorTags.filter(t => t !== topicId);
                break;
            case 'mindmap':
                this.mindmapEditorTags = this.mindmapEditorTags.filter(t => t !== topicId);
                break;
        }
    },

    /**
     * Gets display name for a topic tag
     * @param {string} topicId - The topic ID
     * @returns {string} Display name
     */
    getTagDisplayName(topicId) {
        return getTopicDisplayName(topicId, this.topicLookup);
    },

    /**
     * Gets short display name for a topic tag
     * @param {string} topicId - The topic ID
     * @returns {string} Short display name
     */
    getTagShortName(topicId) {
        return getTopicShortName(topicId, this.topicLookup);
    },

    /**
     * Gets filtered topics for tag selector
     * @returns {Array} Array of topic objects grouped by section
     */
    getFilteredTopicsForSelector() {
        const topics = searchTopics(this.tagSelectorQuery, this.topicLookup);
        const grouped = {};

        topics.forEach(topic => {
            if (!grouped[topic.sectionName]) {
                grouped[topic.sectionName] = {
                    sectionName: topic.sectionName,
                    sectionTitle: topic.sectionTitle,
                    sectionIcon: topic.sectionIcon,
                    sectionPaper: topic.sectionPaper,
                    topics: []
                };
            }
            grouped[topic.sectionName].topics.push(topic);
        });

        // Sort topics within each section by topicId numerically
        Object.values(grouped).forEach(section => {
            section.topics.sort((a, b) => {
                // Extract numeric part from topic IDs for proper numerical sorting
                const numA = parseFloat(a.topicId) || 0;
                const numB = parseFloat(b.topicId) || 0;
                return numA - numB;
            });
        });

        // Sort sections by their first topic ID to maintain numerical order
        const sortedSections = Object.values(grouped).sort((a, b) => {
            const firstTopicA = a.topics[0]?.topicId || '0';
            const firstTopicB = b.topics[0]?.topicId || '0';
            const numA = parseFloat(firstTopicA) || 0;
            const numB = parseFloat(firstTopicB) || 0;
            return numA - numB;
        });

        return sortedSections;
    },

    /**
     * Checks if a topic is currently tagged
     * @param {string} topicId - The topic ID
     * @returns {boolean} True if the topic is tagged
     */
    isTopicTagged(topicId) {
        const currentTags = this.getCurrentTags();
        return currentTags.includes(topicId);
    },

    /**
     * Toggles the expansion state of a section in the tag selector
     * @param {string} sectionName - The section name to toggle
     */
    toggleTagSelectorSection(sectionName) {
        this.tagSelectorExpandedSections[sectionName] = !this.tagSelectorExpandedSections[sectionName];
    },

    /**
     * Checks if a section is expanded in the tag selector
     * Auto-expands all sections when searching
     * @param {string} sectionName - The section name to check
     * @returns {boolean} True if the section is expanded
     */
    isTagSelectorSectionExpanded(sectionName) {
        // Auto-expand all sections when searching
        if (this.tagSelectorQuery && this.tagSelectorQuery.trim().length > 0) {
            return true;
        }
        return this.tagSelectorExpandedSections[sectionName] === true;
    }
};
