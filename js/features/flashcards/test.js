// js/features/flashcards/test.js
// Flashcard testing functionality (3D flip interface)

export const flashcardTestMethods = {
    /**
     * Opens the flashcard test mode with all cards from all decks for current section
     */
    startFlashcardTest() {
        const decks = this.getFlashcardDecksForCurrentSection();

        if (decks.length === 0) {
            alert('No flashcard decks available to test. Create a deck first!');
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
            alert('No flashcards available to test!');
            return;
        }

        this.testFlashcards = allCards;
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
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
    testSingleDeck(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) {
            console.warn('Deck not found:', deckId);
            return;
        }

        if (deck.cards.length === 0) {
            alert('This deck has no cards to test!');
            return;
        }

        this.testFlashcards = deck.cards.map(card => ({ ...card, deckName: deck.name }));
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
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
        this.showFlashcardTest = false;
        this.testFlashcards = [];
        this.currentTestCardIndex = 0;
        this.testCardFlipped = false;
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
            this.currentTestCardIndex++;
            this.testCardFlipped = false;
        }
    },

    /**
     * Moves to the previous flashcard in test mode
     */
    previousTestCard() {
        if (this.currentTestCardIndex > 0) {
            this.currentTestCardIndex--;
            this.testCardFlipped = false;
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
    }
};
