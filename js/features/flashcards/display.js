// js/features/flashcards/display.js
// Display and grouping logic for flashcards view

export const flashcardsDisplayMethods = {
    sortFlashcardDecks(decks) {
        const list = Array.isArray(decks) ? decks.slice() : [];
        const comparator = this.getFlashcardDeckComparator();
        return list.sort(comparator);
    },

    deckHasResults(deck) {
        return this.getDeckTestStats(deck).hasResults;
    },

    getDeckResultsCount(deck) {
        return this.getDeckTestStats(deck).resultsCount;
    },

    deckShowsPercentage(deck) {
        return this.getDeckTestStats(deck).showPercentage;
    },

    getDeckLastPercent(deck) {
        const stats = this.getDeckTestStats(deck);
        return stats.lastPercent ?? 0;
    },

    getDeckPercentageClass(deck) {
        return this.getDeckTestStats(deck).percentageClass;
    },

    invalidateDeckStatCaches() {
        this._deckResultsCache = null;
        this._deckStatsCache = null;
    },

    getDeckTestResults(deck) {
        if (!deck) return [];

        if (!this._deckResultsCache) {
            this._deckResultsCache = new Map();
        }

        const cacheKey = deck.id || deck.name || Math.random().toString(36).slice(2);
        if (this._deckResultsCache.has(cacheKey)) {
            return this._deckResultsCache.get(cacheKey);
        }

        const allResults = this.testResultsHistory || [];
        const results = allResults.filter(result => result.deckName === deck.name);
        this._deckResultsCache.set(cacheKey, results);
        return results;
    },

    getDeckTestStats(deck) {
        if (!deck) {
            return {
                hasResults: false,
                resultsCount: 0,
                lastPercent: null,
                percentageClass: 'text-gray-600 dark:text-gray-400'
            };
        }

        if (!this._deckStatsCache) {
            this._deckStatsCache = new Map();
        }

        const cacheKey = deck.id || deck.name || Math.random().toString(36).slice(2);
        if (this._deckStatsCache.has(cacheKey)) {
            return { ...this._deckStatsCache.get(cacheKey) };
        }

        const results = this.getDeckTestResults(deck);
        const count = results.length;
        let percent = null;

        if (count > 0) {
            const last = results[count - 1];
            if (last && last.correctCount !== undefined && last.incorrectCount !== undefined) {
                const total = (last.correctCount || 0) + (last.incorrectCount || 0);
                if (total > 0) {
                    percent = Math.round((last.correctCount / total) * 100);
                }
            }
        }

        let percentageClass = 'text-gray-600 dark:text-gray-400';
        if (percent !== null) {
            if (percent >= 80) {
                percentageClass = 'text-green-600 dark:text-green-400';
            } else if (percent >= 60) {
                percentageClass = 'text-yellow-600 dark:text-yellow-400';
            } else {
                percentageClass = 'text-red-600 dark:text-red-400';
            }
        }

        const stats = {
            hasResults: count > 0,
            resultsCount: count,
            lastPercent: percent,
            percentageClass,
            showPercentage: percent !== null
        };

    this._deckStatsCache.set(cacheKey, stats);
    return { ...stats };
    },

    getFlashcardDeckSortMetric(deck) {
        const sortMode = this.flashcardCardSort || 'updated';

        switch (sortMode) {
            case 'cards':
                return Array.isArray(deck?.cards) ? deck.cards.length : 0;
            case 'tries':
                return this.getDeckTestResults(deck).length;
            case 'percentage': {
                const stats = this.getDeckTestStats(deck);
                return stats.lastPercent === null ? -1 : stats.lastPercent;
            }
            case 'updated':
            default:
                return new Date(deck?.updatedAt || deck?.createdAt || 0).getTime();
        }
    },

    getFlashcardDeckComparator() {
        const metricCache = new Map();

        const getMetric = deck => {
            if (!deck) return -Infinity;
            const cacheKey = deck.id || deck.name || Math.random().toString(36).slice(2);
            if (metricCache.has(cacheKey)) {
                return metricCache.get(cacheKey);
            }
            const value = this.getFlashcardDeckSortMetric(deck);
            metricCache.set(cacheKey, value);
            return value;
        };

        return (a, b) => {
            const valA = getMetric(a);
            const valB = getMetric(b);

            if (valA === valB) {
                const dateA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
                const dateB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();

                if (dateA === dateB) {
                    const nameA = (a?.name || '').toLowerCase();
                    const nameB = (b?.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                }

                return dateB - dateA;
            }

            return valB - valA;
        };
    },

    /**
     * Get flashcard decks grouped by group and section (hierarchical)
     * Filters by paper mode, group, or section based on current state
     * @returns {Array} Array of groups, each containing sections with their flashcard decks
     */
    getFlashcardsGroupedBySection() {
        let decks = this.getAllFlashcards();

        // Reset caches used for sorting/statistics
        this._deckResultsCache = new Map();
        this._deckStatsCache = new Map();

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
        const pinnedDecks = [];

        // Group decks by their section, then organize sections into groups
        decks.forEach(deck => {
            // If pinned, add to pinned decks
            // In list view, also add to regular sections (duplicate)
            // In card view, only show in pinned section (no duplicate)
            if (deck.pinned) {
                pinnedDecks.push(deck);
                // Skip adding to regular sections in card view
                if (this.flashcardViewMode === 'card') {
                    return;
                }
            }

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
            sections: Object.values(group.sections).map(section => ({
                ...section,
                decks: this.sortFlashcardDecks(section.decks)
            })).sort((a, b) => {
                return a.sectionTitle.localeCompare(b.sectionTitle);
            })
        })).sort((a, b) => {
            if (a.groupTitle === 'Untagged Flashcards') return 1;
            if (b.groupTitle === 'Untagged Flashcards') return -1;
            return a.groupTitle.localeCompare(b.groupTitle);
        });

        const sortedPinnedDecks = this.sortFlashcardDecks(pinnedDecks);

        // Add pinned section at the top (always show in list view, even if empty)
        if (this.flashcardViewMode === 'list' || sortedPinnedDecks.length > 0) {
            groupsArray.unshift({
                groupTitle: 'Pinned Flashcards',
                groupIcon: 'pin',
                sections: [{
                    sectionName: 'pinned',
                    sectionTitle: 'Pinned Decks',
                    sectionIcon: 'pin',
                    sectionPaper: '',
                    decks: sortedPinnedDecks
                }]
            });
        }

        return groupsArray;
    }
};
