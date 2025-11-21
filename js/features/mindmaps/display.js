// js/features/mindmaps/display.js
// Display and grouping logic for mindmaps view

export const mindmapsDisplayMethods = {
    sortMindmaps(mindmaps) {
        if (!Array.isArray(mindmaps) || mindmaps.length === 0) return mindmaps;

        const sortMode = this.mindmapsSort || 'updated';

        // Sort in place to avoid creating new arrays
        mindmaps.sort((a, b) => {
            switch (sortMode) {
                case 'name':
                    return (a.title || '').localeCompare(b.title || '');
                case 'nodes':
                    const nodesA = Array.isArray(a.nodes) ? a.nodes.length : 0;
                    const nodesB = Array.isArray(b.nodes) ? b.nodes.length : 0;
                    return nodesB - nodesA;
                case 'updated':
                default:
                    const dateA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
                    const dateB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
                    return dateB - dateA;
            }
        });

        return mindmaps;
    },

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

        // Build list of valid topic IDs based on current filters
        // This ensures we only group by tags that are relevant to the current view
        let validTopicIds = null;

        if (this.viewMode === 'paper' && this.selectedPaper) {
            // In paper mode, only use topics from the selected paper
            validTopicIds = new Set();
            this.currentGroups.forEach(item => {
                if (item.type === 'single') {
                    const sectionTopics = this.specificationData[item.key]?.topics?.map(t => t.id) || [];
                    sectionTopics.forEach(id => validTopicIds.add(id));
                } else if (item.type === 'group' && item.sections) {
                    item.sections.forEach(sectionKey => {
                        const sectionTopics = this.specificationData[sectionKey]?.topics?.map(t => t.id) || [];
                        sectionTopics.forEach(id => validTopicIds.add(id));
                    });
                }
            });
        } else if (this.contentFilterGroup) {
            // In group filter mode, only use topics from that group
            validTopicIds = new Set();
            const groupItem = this.currentGroups.find(item => item.type === 'group' && item.title === this.contentFilterGroup);
            if (groupItem && groupItem.sections) {
                groupItem.sections.forEach(sectionKey => {
                    const sectionTopics = this.specificationData[sectionKey]?.topics?.map(t => t.id) || [];
                    sectionTopics.forEach(id => validTopicIds.add(id));
                });
            }
        } else if (this.contentFilterSection) {
            // In section filter mode, only use topics from that section
            const sectionTopics = this.specificationData[this.contentFilterSection]?.topics?.map(t => t.id) || [];
            validTopicIds = new Set(sectionTopics);
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
                // Only process tags that are valid for the current view (paper/group/section filter)
                const tagsToProcess = validTopicIds
                    ? mindmap.tags.filter(tagId => validTopicIds.has(tagId))
                    : mindmap.tags;

                tagsToProcess.forEach(tagId => {
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

                        // If no group found, skip this tag (it's not in current view)
                        if (!groupTitle) {
                            return;
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

        // Sort mindmaps using the selected sort method
        Object.values(groupMap).forEach(group => {
            Object.values(group.sections).forEach(section => {
                section.mindmaps = this.sortMindmaps(section.mindmaps);
            });
        });

        // Convert to array structure and sort
        // Filter out any undefined/invalid values to prevent Alpine rendering errors
        const groupsArray = Object.values(groupMap)
            .filter(group => group && group.sections)
            .map(group => ({
                ...group,
                sections: Object.values(group.sections)
                    .filter(section => section && section.sectionTitle && Array.isArray(section.mindmaps))
                    .sort((a, b) => {
                        return a.sectionTitle.localeCompare(b.sectionTitle);
                    })
            }))
            .filter(group => group.sections && group.sections.length > 0)
            .sort((a, b) => {
                if (a.groupTitle === 'Untagged Mindmaps') return 1;
                if (b.groupTitle === 'Untagged Mindmaps') return -1;
                return a.groupTitle.localeCompare(b.groupTitle);
            });

        return groupsArray;
    }
};
