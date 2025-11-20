// js/features/flashcards/test.js
// Flashcard testing functionality (3D flip interface)

import { logger } from '../../utils/logger.js';

export const flashcardTestMethods = {
    /**
     * Opens the flashcard test mode with all cards from all decks for current section
     */
    async startFlashcardTest() {
        const decks = this.getFlashcardDecksForCurrentSection();

        if (decks.length === 0) {
            await this.showAlert('No flashcard decks available to test. Create a deck first!', 'No Decks');
            return;
        }

        // Combine all cards from all decks
        const allCards = [];
        decks.forEach(deck => {
            deck.cards.forEach(card => {
                allCards.push({ ...card, deckName: deck.name });
            });
        });

        if (allCards.length === 0) {
            await this.showAlert('No flashcards available to test!', 'No Cards');
            return;
        }

        this.testFlashcards = allCards;
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
        this.currentTestTitle = 'All Cards';
        this.showFlashcardTest = true;

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Tests cards from a single deck
     */
    async testSingleDeck(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) {
            logger.warn('Deck not found:', deckId);
            return;
        }

        if (deck.cards.length === 0) {
            await this.showAlert('This deck has no cards to test!', 'Empty Deck');
            return;
        }

        this.testFlashcards = deck.cards.map(card => ({ ...card, deckName: deck.name }));
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
        this.currentTestTitle = deck.name;
        this.showFlashcardTest = true;

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Closes the flashcard test modal
     */
    closeFlashcardTest() {
        this.exitTestCompletely();
    },

    /**
     * Flips the current test card
     */
    flipTestCard() {
        this.testCardFlipped = !this.testCardFlipped;
    },

    /**
     * Moves to the next flashcard in test mode
     */
    nextTestCard() {
        if (this.currentTestCardIndex < this.testFlashcards.length - 1) {
            // If card is flipped, flip it back first
            if (this.testCardFlipped) {
                this.testCardFlipped = false;
                // Load next card at 50% through flip animation (300ms of 600ms)
                setTimeout(() => {
                    this.currentTestCardIndex++;
                }, 300);
            } else {
                // Card is already on front, just move to next
                this.currentTestCardIndex++;
            }
        }
    },

    /**
     * Moves to the previous flashcard in test mode
     */
    previousTestCard() {
        if (this.currentTestCardIndex > 0) {
            // If card is flipped, flip it back first
            if (this.testCardFlipped) {
                this.testCardFlipped = false;
                // Load previous card at 50% through flip animation (300ms of 600ms)
                setTimeout(() => {
                    this.currentTestCardIndex--;
                }, 300);
            } else {
                // Card is already on front, just move to previous
                this.currentTestCardIndex--;
            }
        }
    },

    /**
     * Navigates to a specific card index (used by navigation dots)
     */
    goToTestCard(targetIndex) {
        if (targetIndex === this.currentTestCardIndex) return;

        // If card is flipped, flip it back first
        if (this.testCardFlipped) {
            this.testCardFlipped = false;
            // Load target card at 50% through flip animation (300ms of 600ms)
            setTimeout(() => {
                this.currentTestCardIndex = targetIndex;
            }, 300);
        } else {
            // Card is already on front, just move to target
            this.currentTestCardIndex = targetIndex;
        }
    },

    /**
     * Gets the current flashcard in test mode
     */
    getCurrentTestCard() {
        return this.testFlashcards[this.currentTestCardIndex] || null;
    },

    /**
     * Checks if there's a next card
     */
    hasNextTestCard() {
        return this.currentTestCardIndex < this.testFlashcards.length - 1;
    },

    /**
     * Checks if there's a previous card
     */
    hasPreviousTestCard() {
        return this.currentTestCardIndex > 0;
    },

    /**
     * Shuffles the test flashcards array using Fisher-Yates algorithm
     */
    shuffleTestCards() {
        const shuffled = [...this.testFlashcards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        this.testFlashcards = shuffled;
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
    },

    /**
     * Marks the current card as correct
     */
    markCardCorrect() {
        this.testAnswers[this.currentTestCardIndex] = 'correct';

        // If this is the last card, finish the test
        if (!this.hasNextTestCard()) {
            this.finishTest();
        } else {
            this.nextTestCard();
        }
    },

    /**
     * Marks the current card as incorrect
     */
    markCardIncorrect() {
        this.testAnswers[this.currentTestCardIndex] = 'incorrect';

        // If this is the last card, finish the test
        if (!this.hasNextTestCard()) {
            this.finishTest();
        } else {
            this.nextTestCard();
        }
    },

    /**
     * Gets the total number of correct answers
     */
    getCorrectCount() {
        return Object.values(this.testAnswers).filter(answer => answer === 'correct').length;
    },

    /**
     * Gets the total number of incorrect answers
     */
    getIncorrectCount() {
        return Object.values(this.testAnswers).filter(answer => answer === 'incorrect').length;
    },

    /**
     * Checks if any answers have been marked
     */
    hasMarkedAnswers() {
        return Object.keys(this.testAnswers).length > 0;
    },

    /**
     * Checks if the current card has been answered
     */
    isCurrentCardAnswered() {
        return this.testAnswers.hasOwnProperty(this.currentTestCardIndex);
    },

    /**
     * Gets the answer for the current card
     */
    getCurrentCardAnswer() {
        return this.testAnswers[this.currentTestCardIndex] || null;
    },

    /**
     * Finishes the test and shows results (but doesn't save yet)
     */
    finishTest() {
        if (!this.hasMarkedAnswers()) {
            // Just close the test if no answers marked
            this.closeFlashcardTest();
            return;
        }

        this.testCompleted = true;
        this.showTestResults = true;

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Starts reviewing cards (correct or incorrect)
     */
    startReview(mode) {
        this.testReviewMode = mode;
        this.showTestResults = false;

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Exits review mode back to results
     */
    exitReview() {
        this.testReviewMode = null;
        this.showTestResults = true;

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Gets filtered cards for review
     */
    getReviewCards() {
        if (!this.testReviewMode) return [];

        return this.testFlashcards.filter((card, index) => {
            return this.testAnswers[index] === this.testReviewMode;
        });
    },

    /**
     * Saves the current test results and exits completely
     */
    exitTestCompletely() {
        // Only save results if test was completed with answers
        if (this.testCompleted && this.hasMarkedAnswers()) {
            const timestamp = new Date().toISOString();
            const correctCount = this.getCorrectCount();
            const incorrectCount = this.getIncorrectCount();

            const result = {
                deckName: this.currentTestTitle,
                correctCount: correctCount,
                incorrectCount: incorrectCount,
                timestamp: timestamp,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString()
            };

            // Save to global test results history (limit to 50 results to save memory)
            this.testResultsHistory.push(result);
            if (this.testResultsHistory.length > 50) {
                this.testResultsHistory = this.testResultsHistory.slice(-50); // Keep only last 50
            }
            this.testResultsHistory = [...this.testResultsHistory];

            if (typeof this.invalidateDeckStatCaches === 'function') {
                this.invalidateDeckStatCaches();
            }
            this.saveTestResultsHistory();

            // If this was from a test set (not quick play), also save to the test set
            if (this.currentTestSetId && this.testSets[this.currentTestSetId]) {
                const testSet = this.testSets[this.currentTestSetId];
                if (!testSet.testResults) {
                    testSet.testResults = [];
                }
                testSet.testResults.push(result);
                testSet.testResults = [...testSet.testResults];
                this.testSets = { ...this.testSets };

                if (typeof this.invalidateTestSetStatsCache === 'function') {
                    this.invalidateTestSetStatsCache();
                }
                testSet.updatedAt = timestamp;
                this.saveTestSets();
            }
        }

        // Reset all state
        this.showFlashcardTest = false;
        this.testFlashcards = [];
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
        this.currentTestTitle = '';
        this.currentTestSetId = null;
        this.testAnswers = {};
        this.testCompleted = false;
        this.showTestResults = false;
        this.testReviewMode = null;
    },

    /**
     * Saves test results history to IndexedDB
     */
    async saveTestResultsHistory() {
        try {
            const { idbSet } = await import('../../utils/indexeddb.js');

            // ✅ Serialize Alpine.js proxy array to plain array for IndexedDB
            const serialized = JSON.parse(JSON.stringify(this.testResultsHistory || []));
            await idbSet('flashcard-test-results', serialized);
        } catch (error) {
            logger.error('Failed to save test results:', error);
            await this.showAlert('Failed to save test results. Your browser storage might be full.', 'Save Failed');
        }
    },

    /**
     * Loads test results history from IndexedDB
     */
    async loadTestResultsHistory() {
        try {
            const { idbGet } = await import('../../utils/indexeddb.js');
            const saved = await idbGet('flashcard-test-results');
            if (saved) {
                this.testResultsHistory = saved;
            } else {
                this.testResultsHistory = [];
            }
        } catch (error) {
            logger.error('Failed to load test results:', error);
            this.testResultsHistory = [];
        }
    }
};
