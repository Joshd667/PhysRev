// js/features/flashcards/test-sets.js
// Test set creation and management

export const testSetMethods = {
    /**
     * Opens the test area main view
     */
    openTestArea() {
        this.showTestArea = true;
    },

    /**
     * Closes the test area
     */
    closeTestArea() {
        this.showTestArea = false;
        this.showTestSetList = false;
        this.showTestSetBuilder = false;
    },

    /**
     * Opens the saved test sets list
     */
    openTestSetList() {
        this.showTestSetList = true;
    },

    /**
     * Closes the test sets list
     */
    closeTestSetList() {
        this.showTestSetList = false;
    },

    /**
     * Opens the test set builder for creating a new test set
     */
    openTestSetBuilder() {
        this.currentTestSetId = null;
        this.testSetBuilderName = '';
        this.testSetBuilderCards = [];
        this.testSetBuilderSearch = '';
        this.testSetBuilderExpandedDecks = {};
        this.showTestSetBuilder = true;
    },

    /**
     * Opens the test set builder for editing an existing test set
     */
    editTestSet(testSetId) {
        const testSet = this.testSets[testSetId];
        if (!testSet) return;

        this.currentTestSetId = testSetId;
        this.testSetBuilderName = testSet.name;
        this.testSetBuilderCards = [...testSet.cards]; // Clone array
        this.testSetBuilderSearch = '';
        this.testSetBuilderExpandedDecks = {};
        this.showTestSetBuilder = true;
    },

    /**
     * Closes the test set builder
     */
    closeTestSetBuilder() {
        this.showTestSetBuilder = false;
        this.currentTestSetId = null;
        this.testSetBuilderName = '';
        this.testSetBuilderCards = [];
        this.testSetBuilderSearch = '';
        this.testSetBuilderExpandedDecks = {};
    },

    /**
     * Toggles deck expansion in builder
     */
    toggleDeckExpansion(deckId) {
        this.testSetBuilderExpandedDecks[deckId] = !this.testSetBuilderExpandedDecks[deckId];
    },

    /**
     * Adds entire deck to test set builder
     */
    addDeckToTestSet(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) return;

        // Add all cards from deck that aren't already in the test set
        deck.cards.forEach(card => {
            const cardWithDeck = { ...card, deckId: deckId, deckName: deck.name };
            const exists = this.testSetBuilderCards.some(
                c => c.deckId === deckId && c.front === card.front && c.back === card.back
            );
            if (!exists) {
                this.testSetBuilderCards.push(cardWithDeck);
            }
        });
    },

    /**
     * Adds a single card to test set builder
     */
    addCardToTestSet(deckId, card) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) return;

        const cardWithDeck = { ...card, deckId: deckId, deckName: deck.name };
        const exists = this.testSetBuilderCards.some(
            c => c.deckId === deckId && c.front === card.front && c.back === card.back
        );

        if (!exists) {
            this.testSetBuilderCards.push(cardWithDeck);
        }
    },

    /**
     * Removes a card from test set builder
     */
    removeCardFromTestSet(index) {
        this.testSetBuilderCards.splice(index, 1);
    },

    /**
     * Checks if a card is already in the test set
     */
    isCardInTestSet(deckId, card) {
        return this.testSetBuilderCards.some(
            c => c.deckId === deckId && c.front === card.front && c.back === card.back
        );
    },

    /**
     * Checks if all cards from a deck are in the test set
     */
    isDeckInTestSet(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck || deck.cards.length === 0) return false;

        return deck.cards.every(card => this.isCardInTestSet(deckId, card));
    },

    /**
     * Gets count of cards from a specific deck in the test set
     */
    getDeckCardCount(deckId) {
        return this.testSetBuilderCards.filter(c => c.deckId === deckId).length;
    },

    /**
     * Saves the test set (create or update)
     */
    async saveTestSet() {
        if (!this.testSetBuilderName.trim()) {
            await this.showAlert('Please enter a test set name', 'Missing Name');
            return;
        }

        if (this.testSetBuilderCards.length === 0) {
            await this.showAlert('Please add at least one card to the test set', 'No Cards');
            return;
        }

        const timestamp = new Date().toISOString();
        const id = this.currentTestSetId || `testset_${Date.now()}`;

        // Collect unique tags from all cards' decks
        const tags = new Set();
        this.testSetBuilderCards.forEach(card => {
            const deck = this.flashcardDecks[card.deckId];
            if (deck && deck.tags) {
                deck.tags.forEach(tag => tags.add(tag));
            }
        });

        this.testSets[id] = {
            id: id,
            name: this.testSetBuilderName.trim(),
            cards: [...this.testSetBuilderCards],
            tags: Array.from(tags),
            pinned: this.testSets[id]?.pinned || false,
            testResults: this.testSets[id]?.testResults || [],
            createdAt: this.testSets[id]?.createdAt || timestamp,
            updatedAt: timestamp
        };

        this.saveTestSets();
        this.closeTestSetBuilder();

        // Refresh icons after DOM updates
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Deletes a test set
     */
    async deleteTestSet(testSetId) {
        const testSet = this.testSets[testSetId];
        if (!testSet) return;

        const confirmed = await this.showConfirm(
            `Delete test set "${testSet.name}"?`,
            'Delete Test Set'
        );

        if (confirmed) {
            delete this.testSets[testSetId];
            this.saveTestSets();
        }
    },

    /**
     * Toggles pin status of a test set
     */
    togglePinTestSet(testSetId) {
        const testSet = this.testSets[testSetId];
        if (!testSet) return;

        testSet.pinned = !testSet.pinned;
        testSet.updatedAt = new Date().toISOString();
        this.saveTestSets();

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Starts a test from a saved test set
     */
    async startTestFromSet(testSetId) {
        const testSet = this.testSets[testSetId];
        if (!testSet) return;

        if (testSet.cards.length === 0) {
            await this.showAlert('This test set has no cards', 'Empty Test Set');
            return;
        }

        this.testFlashcards = [...testSet.cards];
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
        this.currentTestTitle = testSet.name;
        this.currentTestSetId = testSetId; // Track which test set is being used
        this.testAnswers = {};
        this.testCompleted = false;
        this.showTestResults = false;
        this.showFlashcardTest = true;
        // Don't close test area - user stays in test area context

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Starts a quick play test with 10 random cards from all decks
     */
    async startQuickPlayTest() {
        // Collect all cards from all decks
        const allCards = [];
        Object.entries(this.flashcardDecks).forEach(([deckId, deck]) => {
            deck.cards.forEach(card => {
                allCards.push({ ...card, deckId: deckId, deckName: deck.name });
            });
        });

        if (allCards.length === 0) {
            await this.showAlert('No flashcards available for quick play', 'No Cards');
            return;
        }

        // Shuffle and take up to 10 cards
        const shuffled = allCards.sort(() => Math.random() - 0.5);
        const selectedCards = shuffled.slice(0, Math.min(10, allCards.length));

        this.testFlashcards = selectedCards;
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
        this.currentTestTitle = 'Quick Play';
        this.currentTestSetId = null; // No test set for quick play
        this.testAnswers = {};
        this.testCompleted = false;
        this.showTestResults = false;
        this.showFlashcardTest = true;
        // Don't close test area - user stays in flashcard options context

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Gets filtered decks for test set builder based on search
     */
    getFilteredDecksForBuilder() {
        const query = this.testSetBuilderSearch.toLowerCase().trim();
        let decks = Object.values(this.flashcardDecks);

        // Apply text search filter
        if (query) {
            decks = decks.filter(deck => {
                // Search by deck name
                if (deck.name.toLowerCase().includes(query)) return true;

                // Search by section
                if (deck.sectionId && deck.sectionId.toLowerCase().includes(query)) return true;

                // Search by tags
                if (deck.tags && deck.tags.length > 0) {
                    const tagMatch = deck.tags.some(tagId => {
                        if (tagId.toLowerCase().includes(query)) return true;
                        const topicInfo = this.topicLookup[tagId];
                        return topicInfo && topicInfo.topicTitle.toLowerCase().includes(query);
                    });
                    if (tagMatch) return true;
                }

                // Search by card content
                return deck.cards.some(card =>
                    card.front.toLowerCase().includes(query) ||
                    card.back.toLowerCase().includes(query)
                );
            });
        }

        // Apply advanced search tag filter
        if (this.advancedSearchTags.length > 0) {
            decks = decks.filter(deck => {
                if (!deck.tags || deck.tags.length === 0) return false;
                // Deck must have at least one of the selected tags
                return this.advancedSearchTags.some(tag => deck.tags.includes(tag));
            });
        }

        return decks;
    },

    /**
     * Saves test sets to localStorage
     */
    saveTestSets() {
        this.saveDataType('testSets', {
            data: this.testSets,
            lastUpdated: new Date().toISOString()
        });
    },

    /**
     * Loads test sets from IndexedDB
     */
    async loadTestSets() {
        const data = await this.loadDataType('testSets', { data: {} });
        this.testSets = data.data || {};
    },

    getSortedTestSets() {
        const sets = Object.values(this.testSets || {});
        if (sets.length === 0) {
            return [];
        }

        this._testSetStatsCache = new Map();

        const comparator = this.getTestSetComparator();
        // Object.values() already creates a new array, no need for slice()
        sets.sort((a, b) => {
            const aPinned = !!a?.pinned;
            const bPinned = !!b?.pinned;

            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;

            return comparator(a, b);
        });

        return sets;
    },

    getTestSetComparator() {
        const metricCache = new Map();

        const getMetric = testSet => {
            if (!testSet) return -Infinity;
            const cacheKey = testSet.id || testSet.name || Math.random().toString(36).slice(2);
            if (metricCache.has(cacheKey)) {
                return metricCache.get(cacheKey);
            }
            const value = this.getTestSetSortMetric(testSet);
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

    getTestSetSortMetric(testSet) {
        const sortMode = this.testSetSort || 'updated';

        switch (sortMode) {
            case 'cards':
                return Array.isArray(testSet?.cards) ? testSet.cards.length : 0;
            case 'tries':
                return Array.isArray(testSet?.testResults) ? testSet.testResults.length : 0;
            case 'percentage': {
                const stats = this.getTestSetStats(testSet);
                return stats.lastPercent === null ? -1 : stats.lastPercent;
            }
            case 'updated':
            default:
                return new Date(testSet?.updatedAt || testSet?.createdAt || 0).getTime();
        }
    },

    getTestSetStats(testSet) {
        if (!testSet) {
            return {
                hasResults: false,
                tries: 0,
                lastPercent: null,
                showPercentage: false,
                percentageClass: 'text-gray-600 dark:text-gray-400'
            };
        }

        if (!this._testSetStatsCache) {
            this._testSetStatsCache = new Map();
        }

        const cacheKey = testSet.id || testSet.name || Math.random().toString(36).slice(2);
        if (this._testSetStatsCache.has(cacheKey)) {
            return { ...this._testSetStatsCache.get(cacheKey) };
        }

        const results = Array.isArray(testSet.testResults) ? testSet.testResults : [];
        const tries = results.length;
        let percent = null;

        if (tries > 0) {
            const last = results[tries - 1];
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
            hasResults: tries > 0,
            tries,
            lastPercent: percent,
            showPercentage: percent !== null,
            percentageClass
        };

    this._testSetStatsCache.set(cacheKey, stats);
    return { ...stats };
    },

    invalidateTestSetStatsCache() {
        this._testSetStatsCache = null;
    }
};
