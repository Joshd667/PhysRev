// js/features/mindmaps/display.js
// Display and grouping logic for mindmaps view

export const mindmapsDisplayMethods = {
    /**
     * Get mindmaps grouped by group and section (hierarchical)
     * Filters by paper mode, group, or section based on current state
     * @returns {Array} Array of groups, each containing sections with their mindmaps
     */
    getMindmapsGroupedBySection() {
        let mindmaps = this.getAllMindmaps();

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
            mindmaps = mindmaps.filter(mindmap =>
                mindmap.tags && mindmap.tags.some(tag => paperTopicIds.includes(tag))
            );
        }

        // If a group filter is active, only include mindmaps from sections within that group
        // Uses shared contentFilterGroup state
        if (this.contentFilterGroup) {
            const groupItem = this.currentGroups.find(item => item.type === 'group' && item.title === this.contentFilterGroup);
            if (groupItem && groupItem.sections) {
                const groupTopicIds = [];
                groupItem.sections.forEach(sectionKey => {
                    const sectionTopics = this.specificationData[sectionKey]?.topics?.map(t => t.id) || [];
                    groupTopicIds.push(...sectionTopics);
                });
                mindmaps = mindmaps.filter(mindmap =>
                    mindmap.tags && mindmap.tags.some(tag => groupTopicIds.includes(tag))
                );
            }
        }
        // If a section filter is active, only include mindmaps tagged with topics from that section
        // Uses shared contentFilterSection state
        else if (this.contentFilterSection) {
            const sectionTopicIds = this.specificationData[this.contentFilterSection]?.topics?.map(t => t.id) || [];
            mindmaps = mindmaps.filter(mindmap =>
                mindmap.tags && mindmap.tags.some(tag => sectionTopicIds.includes(tag))
            );
        }

        const groupMap = {};

        // Group mindmaps by their section, then organize sections into groups
        mindmaps.forEach(mindmap => {
            if (!mindmap.tags || mindmap.tags.length === 0) {
                // Add to "Untagged" group
                if (!groupMap['untagged']) {
                    groupMap['untagged'] = {
                        groupTitle: 'Untagged Mindmaps',
                        groupIcon: 'network',
                        sections: {}
                    };
                }
                if (!groupMap['untagged'].sections['untagged']) {
                    groupMap['untagged'].sections['untagged'] = {
                        sectionName: 'untagged',
                        sectionTitle: 'Untagged',
                        sectionIcon: 'network',
                        sectionPaper: '',
                        mindmaps: []
                    };
                }
                groupMap['untagged'].sections['untagged'].mindmaps.push(mindmap);
            } else {
                // Add to appropriate group and section based on tags
                mindmap.tags.forEach(tagId => {
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
                                mindmaps: []
                            };
                        }

                        // Avoid duplicates in the same section
                        const section = groupMap[groupTitle].sections[sectionKey];
                        if (!section.mindmaps.find(m => m.id === mindmap.id)) {
                            section.mindmaps.push(mindmap);
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
            if (a.groupTitle === 'Untagged Mindmaps') return 1;
            if (b.groupTitle === 'Untagged Mindmaps') return -1;
            return a.groupTitle.localeCompare(b.groupTitle);
        });

        return groupsArray;
    }
};
