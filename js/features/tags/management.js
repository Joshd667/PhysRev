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

        return Object.values(grouped);
    },

    /**
     * Checks if a topic is currently tagged
     * @param {string} topicId - The topic ID
     * @returns {boolean} True if the topic is tagged
     */
    isTopicTagged(topicId) {
        const currentTags = this.getCurrentTags();
        return currentTags.includes(topicId);
    }
};
