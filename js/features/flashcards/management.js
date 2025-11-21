// js/features/flashcards/management.js
// CRUD operations for flashcard decks

import { logger } from '../../utils/logger.js';

export const flashcardManagementMethods = {
    /**
     * Opens the flashcard editor modal for creating a new deck
     * ⚡ OPTIMIZED: Lazy-loads template on first use (32 KB)
     */
    async openFlashcardEditor(sectionId = null, topicId = null) {
        try {
            // ⚡ Lazy-load flashcard editor template (32 KB) on first use
            const { loadTemplateLazy } = await import('../../template-loader.js');

            // 🛡️ SAFETY: Handle version mismatch during updates
            if (typeof loadTemplateLazy !== 'function') {
                logger.warn('⚠️ loadTemplateLazy not available - reloading to complete update');
                window.location.reload();
                return;
            }

            await loadTemplateLazy('flashcard-editor-modal-container', './templates/flashcard-editor-modal.html');
        } catch (error) {
            logger.error('❌ Failed to open flashcard editor:', error);
            if (error.message && error.message.includes('not a function')) {
                logger.warn('🔄 Reloading to complete app update...');
                window.location.reload();
                return;
            }
            throw error;
        }

        this.flashcardEditorMode = 'create';
        this.flashcardEditorSectionId = sectionId || this.currentRevisionSection;
        this.flashcardEditorDeckName = '';
        this.flashcardEditorDeckId = null;
        this.flashcardEditorCards = [];
        this.flashcardEditorCurrentCardFront = '';
        this.flashcardEditorCurrentCardBack = '';

        // Don't auto-assign tags - user must manually select tags
        this.flashcardEditorTags = [];

        this.showFlashcardEditor = true;

        this.$nextTick(() => {
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Opens the flashcard editor modal for editing an existing deck
     */
    editFlashcardDeck(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) {
            logger.warn('Deck not found:', deckId);
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
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Adds current card to the deck being edited
     */
    async addCardToDeck() {
        // Validation
        if (!this.flashcardEditorCurrentCardFront.trim()) {
            await this.showAlert('Please enter text for the front of the card', 'Missing Front');
            return;
        }

        if (!this.flashcardEditorCurrentCardBack.trim()) {
            await this.showAlert('Please enter text for the back of the card', 'Missing Back');
            return;
        }

        // Add card to the array
        this.flashcardEditorCards.push({
            front: this.flashcardEditorCurrentCardFront.trim(),
            back: this.flashcardEditorCurrentCardBack.trim()
        });

        // Clear inputs for next card (after successful validation)
        this.flashcardEditorCurrentCardFront = '';
        this.flashcardEditorCurrentCardBack = '';

        // Also clear the contenteditable divs
        const frontEditor = document.getElementById('flashcard-front-editor');
        const backEditor = document.getElementById('flashcard-back-editor');
        if (frontEditor) frontEditor.innerHTML = '';
        if (backEditor) backEditor.innerHTML = '';

        // Show success message
        logger.log(`Card ${this.flashcardEditorCards.length} added to deck`);
    },

    /**
     * Removes a card from the deck being edited
     */
    removeCardFromDeck(index) {
        this.flashcardEditorCards.splice(index, 1);
    },

    /**
     * Closes the flashcard editor modal with unsaved changes warning
     * @param {boolean} skipConfirmation - Skip the unsaved changes warning (e.g., after saving)
     */
    async closeFlashcardEditor(skipConfirmation = false) {
        // Check if there are unsaved changes (unless skipping confirmation)
        if (!skipConfirmation) {
            const hasContent = this.flashcardEditorDeckName.trim() ||
                              this.flashcardEditorCards.length > 0 ||
                              this.flashcardEditorCurrentCardFront.trim() ||
                              this.flashcardEditorCurrentCardBack.trim();

            if (hasContent) {
                const confirmed = await this.showConfirm(
                    'You have unsaved changes. Are you sure you want to close without saving?',
                    'Unsaved Changes'
                );

                if (!confirmed) {
                    return; // User cancelled, keep editor open
                }
            }
        }

        // Close and reset
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
    async saveFlashcardDeck() {
        // Validation
        if (!this.flashcardEditorDeckName.trim()) {
            await this.showAlert('Please enter a name for your flashcard deck', 'Missing Deck Name');
            return;
        }

        if (this.flashcardEditorCards.length === 0) {
            await this.showAlert('Please add at least one card to your deck', 'No Cards');
            return;
        }

        // Require at least one tag
        if (!this.flashcardEditorTags || this.flashcardEditorTags.length === 0) {
            await this.showAlert('Please add at least one tag to your flashcard deck', 'Missing Tags');
            return;
        }

        const timestamp = new Date().toISOString();

        if (this.flashcardEditorMode === 'create') {
            // Create new deck
            const deckId = `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newDeck = {
                id: deckId,
                sectionId: this.flashcardEditorSectionId,
                name: this.flashcardEditorDeckName.trim(),
                cards: this.flashcardEditorCards,
                tags: this.flashcardEditorTags,
                pinned: false,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            this.flashcardDecks[deckId] = newDeck;

            // ⚡ PERFORMANCE: Update search index
            this._addFlashcardDeckToIndex(newDeck);
        } else {
            // Update existing deck
            if (this.flashcardDecks[this.flashcardEditorDeckId]) {
                this.flashcardDecks[this.flashcardEditorDeckId].name = this.flashcardEditorDeckName.trim();
                this.flashcardDecks[this.flashcardEditorDeckId].cards = this.flashcardEditorCards;
                this.flashcardDecks[this.flashcardEditorDeckId].tags = this.flashcardEditorTags;
                this.flashcardDecks[this.flashcardEditorDeckId].updatedAt = timestamp;

                // ⚡ PERFORMANCE: Update search index
                this._updateFlashcardDeckInIndex(this.flashcardDecks[this.flashcardEditorDeckId]);
            }
        }

        // Save to localStorage
        this.saveFlashcardDecks();

        // Close editor (skip confirmation since we just saved)
        this.closeFlashcardEditor(true);

        // Refresh icons
        this.$nextTick(() => {
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    },

    /**
     * Deletes a flashcard deck
     */
    async deleteFlashcardDeck(deckId) {
        const deck = this.flashcardDecks[deckId];
        if (!deck) return;

        const confirmed = await this.showConfirm(
            `Are you sure you want to delete the deck "${deck.name}" with ${deck.cards.length} card(s)?`,
            'Delete Deck'
        );

        if (confirmed) {
            delete this.flashcardDecks[deckId];

            // ⚡ PERFORMANCE: Update search index
            this._removeFlashcardDeckFromIndex(deckId);

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
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }
        });
    }
};
