// js/features/flashcards/display.js
// Display and grouping logic for flashcards view

export const flashcardsDisplayMethods = {
    /**
     * Get flashcard decks grouped by group and section (hierarchical)
     * Filters by paper mode, group, or section based on current state
     * @returns {Array} Array of groups, each containing sections with their flashcard decks
     */
    getFlashcardsGroupedBySection() {
        let decks = this.getAllFlashcards();

        // Filter by paper mode if in paper mode
        if (this.viewMode === 'paper' && this.selectedPaper) {
            // Get all topic IDs for the selected paper
            const paperTopicIds = [];
            this.currentGroups.forEach(item => {
                if (item.type === 'single') {
                    const sectionTopics = this.specificationData[item.key]?.topics?.map(t => t.id) || [];
                    paperTopicIds.push(...sectionTopics);
                } else if (item.type === 'group' && item.sections) {
                    item.sections.forEach(sectionKey => {
                        const sectionTopics = this.specificationData[sectionKey]?.topics?.map(t => t.id) || [];
                        paperTopicIds.push(...sectionTopics);
                    });
                }
            });
            decks = decks.filter(deck =>
                deck.tags && deck.tags.some(tag => paperTopicIds.includes(tag))
            );
        }

        // If a group filter is active, only include decks from sections within that group
        // Uses shared contentFilterGroup state
        if (this.contentFilterGroup) {
            const groupItem = this.currentGroups.find(item => item.type === 'group' && item.title === this.contentFilterGroup);
            if (groupItem && groupItem.sections) {
                const groupTopicIds = [];
                groupItem.sections.forEach(sectionKey => {
                    const sectionTopics = this.specificationData[sectionKey]?.topics?.map(t => t.id) || [];
                    groupTopicIds.push(...sectionTopics);
                });
                decks = decks.filter(deck =>
                    deck.tags && deck.tags.some(tag => groupTopicIds.includes(tag))
                );
            }
        }
        // If a section filter is active, only include decks tagged with topics from that section
        // Uses shared contentFilterSection state
        else if (this.contentFilterSection) {
            const sectionTopicIds = this.specificationData[this.contentFilterSection]?.topics?.map(t => t.id) || [];
            decks = decks.filter(deck =>
                deck.tags && deck.tags.some(tag => sectionTopicIds.includes(tag))
            );
        }

        const groupMap = {};

        // Group decks by their section, then organize sections into groups
        decks.forEach(deck => {
            if (!deck.tags || deck.tags.length === 0) {
                // Add to "Untagged" group
                if (!groupMap['untagged']) {
                    groupMap['untagged'] = {
                        groupTitle: 'Untagged Flashcards',
                        groupIcon: 'layers',
                        sections: {}
                    };
                }
                if (!groupMap['untagged'].sections['untagged']) {
                    groupMap['untagged'].sections['untagged'] = {
                        sectionName: 'untagged',
                        sectionTitle: 'Untagged',
                        sectionIcon: 'layers',
                        sectionPaper: '',
                        decks: []
                    };
                }
                groupMap['untagged'].sections['untagged'].decks.push(deck);
            } else {
                // Add to appropriate group and section based on tags
                deck.tags.forEach(tagId => {
                    const topicInfo = this.topicLookup[tagId];
                    if (topicInfo) {
                        const sectionKey = topicInfo.sectionName;

                        // Find which group this section belongs to
                        let groupTitle = null;
                        let groupIcon = topicInfo.sectionIcon;

                        for (const group of this.currentGroups) {
                            if (group.type === 'group' && group.sections.includes(sectionKey)) {
                                groupTitle = group.title;
                                break;
                            }
                        }

                        // If no group found, create a default group
                        if (!groupTitle) {
                            groupTitle = topicInfo.sectionPaper || 'Other Topics';
                        }

                        // Create group if it doesn't exist
                        if (!groupMap[groupTitle]) {
                            groupMap[groupTitle] = {
                                groupTitle: groupTitle,
                                groupIcon: groupIcon,
                                sections: {}
                            };
                        }

                        // Create section within group if it doesn't exist
                        if (!groupMap[groupTitle].sections[sectionKey]) {
                            groupMap[groupTitle].sections[sectionKey] = {
                                sectionName: topicInfo.sectionName,
                                sectionTitle: topicInfo.sectionTitle,
                                sectionIcon: topicInfo.sectionIcon,
                                sectionPaper: topicInfo.sectionPaper,
                                decks: []
                            };
                        }

                        // Avoid duplicates in the same section
                        const section = groupMap[groupTitle].sections[sectionKey];
                        if (!section.decks.find(d => d.id === deck.id)) {
                            section.decks.push(deck);
                        }
                    }
                });
            }
        });

        // Convert to array structure and sort
        const groupsArray = Object.values(groupMap).map(group => ({
            ...group,
            sections: Object.values(group.sections).sort((a, b) => {
                return a.sectionTitle.localeCompare(b.sectionTitle);
            })
        })).sort((a, b) => {
            if (a.groupTitle === 'Untagged Flashcards') return 1;
            if (b.groupTitle === 'Untagged Flashcards') return -1;
            return a.groupTitle.localeCompare(b.groupTitle);
        });

        return groupsArray;
    }
};
