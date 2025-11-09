// js/features/flashcards/management.js
// CRUD operations for flashcard decks

export const flashcardManagementMethods = {
    /**
     * Opens the flashcard editor modal for creating a new deck
     */
    openFlashcardEditor(sectionId = null, topicId = null) {
        this.flashcardEditorMode = 'create';
        this.flashcardEditorSectionId = sectionId || this.currentRevisionSection;
        this.flashcardEditorDeckName = '';
        this.flashcardEditorDeckId = null;
        this.flashcardEditorCards = [];
        this.flashcardEditorCurrentCardFront = '';
        this.flashcardEditorCurrentCardBack = '';

        // Auto-assign tags from current context
        if (topicId) {
            // Single topic provided
            this.flashcardEditorTags = [topicId];
        } else if (this.currentRevisionTopics && this.currentRevisionTopics.length > 0) {
            // Multiple topics from revision view
            this.flashcardEditorTags = this.currentRevisionTopics.map(t => t.id);
        } else {
            this.flashcardEditorTags = [];
        }

        this.showFlashcardEditor = true;

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Opens the flashcard editor modal for editing an existing deck
     */
    editFlashcardDeck(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) {
            console.warn('Deck not found:', deckId);
            return;
        }

        this.flashcardEditorMode = 'edit';
        this.flashcardEditorSectionId = deck.sectionId;
        this.flashcardEditorDeckName = deck.name;
        this.flashcardEditorDeckId = deckId;
        this.flashcardEditorCards = [...deck.cards]; // Copy the cards
        this.flashcardEditorCurrentCardFront = '';
        this.flashcardEditorCurrentCardBack = '';
        this.flashcardEditorTags = [...(deck.tags || [])]; // Copy the tags
        this.showFlashcardEditor = true;

        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Adds current card to the deck being edited
     */
    addCardToDeck() {
        // Validation
        if (!this.flashcardEditorCurrentCardFront.trim()) {
            alert('Please enter text for the front of the card');
            return;
        }

        if (!this.flashcardEditorCurrentCardBack.trim()) {
            alert('Please enter text for the back of the card');
            return;
        }

        // Add card to the array
        this.flashcardEditorCards.push({
            front: this.flashcardEditorCurrentCardFront.trim(),
            back: this.flashcardEditorCurrentCardBack.trim()
        });

        // Clear inputs for next card
        this.flashcardEditorCurrentCardFront = '';
        this.flashcardEditorCurrentCardBack = '';

        // Show success message
        console.log(`Card ${this.flashcardEditorCards.length} added to deck`);
    },

    /**
     * Removes a card from the deck being edited
     */
    removeCardFromDeck(index) {
        this.flashcardEditorCards.splice(index, 1);
    },

    /**
     * Closes the flashcard editor modal
     */
    closeFlashcardEditor() {
        this.showFlashcardEditor = false;
        this.flashcardEditorMode = 'create';
        this.flashcardEditorSectionId = null;
        this.flashcardEditorDeckName = '';
        this.flashcardEditorDeckId = null;
        this.flashcardEditorCards = [];
        this.flashcardEditorCurrentCardFront = '';
        this.flashcardEditorCurrentCardBack = '';
        this.flashcardEditorTags = [];
        this.flashcardEditorCardsExpanded = false;
        this.flashcardEditorEditingCardIndex = null;
    },

    /**
     * Saves the current deck (create or update)
     */
    saveFlashcardDeck() {
        // Validation
        if (!this.flashcardEditorDeckName.trim()) {
            alert('Please enter a name for your flashcard deck');
            return;
        }

        if (this.flashcardEditorCards.length === 0) {
            alert('Please add at least one card to your deck');
            return;
        }

        const timestamp = new Date().toISOString();

        if (this.flashcardEditorMode === 'create') {
            // Create new deck
            const deckId = `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.flashcardDecks[deckId] = {
                id: deckId,
                sectionId: this.flashcardEditorSectionId,
                name: this.flashcardEditorDeckName.trim(),
                cards: this.flashcardEditorCards,
                tags: this.flashcardEditorTags,
                pinned: false,
                createdAt: timestamp,
                updatedAt: timestamp
            };
        } else {
            // Update existing deck
            if (this.flashcardDecks[this.flashcardEditorDeckId]) {
                this.flashcardDecks[this.flashcardEditorDeckId].name = this.flashcardEditorDeckName.trim();
                this.flashcardDecks[this.flashcardEditorDeckId].cards = this.flashcardEditorCards;
                this.flashcardDecks[this.flashcardEditorDeckId].tags = this.flashcardEditorTags;
                this.flashcardDecks[this.flashcardEditorDeckId].updatedAt = timestamp;
            }
        }

        // Save to localStorage
        this.saveFlashcardDecks();

        // Close editor
        this.closeFlashcardEditor();

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    },

    /**
     * Deletes a flashcard deck
     */
    deleteFlashcardDeck(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) return;

        if (confirm(`Are you sure you want to delete the deck "${deck.name}" with ${deck.cards.length} card(s)?`)) {
            delete this.flashcardDecks[deckId];
            this.saveFlashcardDecks();
        }
    },

    /**
     * Gets all flashcard decks for the current revision section
     */
    getFlashcardDecksForCurrentSection() {
        if (!this.currentRevisionSection) return [];

        return Object.values(this.flashcardDecks || {})
            .filter(deck => deck.sectionId === this.currentRevisionSection)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    /**
     * Gets total card count for current section
     */
    getTotalCardsForCurrentSection() {
        const decks = this.getFlashcardDecksForCurrentSection();
        return decks.reduce((total, deck) => total + deck.cards.length, 0);
    },

    /**
     * Toggles pin status of a flashcard deck
     */
    toggleDeckPin(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) return;

        deck.pinned = !deck.pinned;
        deck.updatedAt = new Date().toISOString();
        
        // Force reactivity by reassigning the object
        this.flashcardDecks = { ...this.flashcardDecks };
        
        this.saveFlashcardDecks();

        // Refresh icons
        this.$nextTick(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    }
};
