// js/modules/search.js

import { logger } from '../../utils/logger.js';

export const searchMethods = {
    // Helper method to safely set search results
    _updateSearchResults(results) {
        if (typeof window.physicsAuditApp !== 'undefined' && window.physicsAuditApp._setSearchResults) {
            window.physicsAuditApp._setSearchResults(results);
        } else if (this._setSearchResults) {
            this._setSearchResults(results);
        }
    },

    toggleSearch() {
        this.searchVisible = !this.searchVisible;
        if (this.searchVisible) {
            this.$nextTick(() => document.getElementById('searchInput')?.focus());
        }
        // Don't clear search state - persist it so user can resume their search
    },

    toggleAdvancedSearch() {
        this.showAdvancedSearch = !this.showAdvancedSearch;
    },

    toggleSearchTag(topicId) {
        const index = this.selectedSearchTags.indexOf(topicId);
        if (index > -1) {
            this.selectedSearchTags.splice(index, 1);
        } else {
            this.selectedSearchTags.push(topicId);
        }
        this.performSearch();
    },

    toggleSearchFilter(filterType) {
        const index = this.searchFilters.indexOf(filterType);
        if (index > -1) {
            // Don't allow deselecting if it's the last one
            if (this.searchFilters.length > 1) {
                this.searchFilters.splice(index, 1);
            }
        } else {
            this.searchFilters.push(filterType);
        }
        this.performSearch();
    },

    selectAllSearchFilters() {
        this.searchFilters = ['audit', 'notes', 'flashcards', 'mindmaps'];
        this.performSearch();
    },

    removeSearchTopicFilter(topicId) {
        this.selectedSearchTags = this.selectedSearchTags.filter(t => t !== topicId);
        this.performSearch();
    },

    clearSearchTags() {
        this.selectedSearchTags = [];
        this.performSearch();
    },

    setConfidenceFilter(rating) {
        this.selectedConfidenceRating = rating === this.selectedConfidenceRating ? null : rating;
        this.performSearch();
    },

    toggleConfidenceLevel(level) {
        const index = this.selectedConfidenceLevels.indexOf(level);
        if (index > -1) {
            this.selectedConfidenceLevels.splice(index, 1);
        } else {
            this.selectedConfidenceLevels.push(level);
        }
        this.performSearch();
    },

    removeConfidenceLevel(level) {
        this.selectedConfidenceLevels = this.selectedConfidenceLevels.filter(l => l !== level);
        this.performSearch();
    },

    clearConfidenceLevels() {
        this.selectedConfidenceLevels = [];
        this.performSearch();
    },

    setSearchSort(sortBy) {
        // If clicking the same sort option, toggle direction
        if (this.searchSortBy === sortBy) {
            this.searchSortDirection = this.searchSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New sort option, default to ascending
            this.searchSortBy = sortBy;
            this.searchSortDirection = 'asc';
        }
        this.performSearch();
    },

    clearAllSearchFilters() {
        // Clear search query
        this.searchQuery = '';
        this._updateSearchResults([]);

        // Reset all filters to default (all 4 selected)
        this.searchFilters = ['audit', 'notes', 'flashcards', 'mindmaps'];
        this.searchSortBy = 'relevance';
        this.searchSortDirection = 'asc';
        this.selectedSearchTags = [];
        this.selectedConfidenceLevels = [];

        // Focus back on search input
        this.$nextTick(() => {
            document.getElementById('searchInput')?.focus();
        });
    },

    getConfidenceLevelLabel(level) {
        const labels = {
            1: 'Not confident',
            2: 'Slightly confident',
            3: 'Moderately confident',
            4: 'Very confident',
            5: 'Extremely confident'
        };
        return labels[level] || '';
    },

    performSearch() {
        // Debounce search
        clearTimeout(this.searchTimer);

        // Allow search without query if confidence levels are selected
        if (!this.searchQuery || !this.searchQuery.trim()) {
            if (this.selectedConfidenceLevels.length > 0) {
                // Show audit cards filtered by confidence level only
                this.searchTimer = setTimeout(() => {
                    this._executeSearch();
                }, 300);
            } else {
                this._updateSearchResults([]);
            }
            return;
        }

        this.searchTimer = setTimeout(() => {
            this._executeSearch();
        }, 300); // 300ms debounce
    },

    _executeSearch() {
        // ⚡ PERFORMANCE: Lazy-initialize search indexes on first search
        this._ensureSearchIndexes();

        const query = this.searchQuery.toLowerCase().trim();
        let results = [];

        // If no query but confidence levels selected, only search audit cards
        if (!query && this.selectedConfidenceLevels.length > 0) {
            results = this._searchAuditCards(query);
        } else {
            // Search based on active filters
            if (this.searchFilters.includes('audit')) {
                results = results.concat(this._searchAuditCards(query));
            }
            if (this.searchFilters.includes('notes')) {
                results = results.concat(this._searchNotes(query));
            }
            if (this.searchFilters.includes('flashcards')) {
                results = results.concat(this._searchFlashcards(query));
            }
            if (this.searchFilters.includes('mindmaps')) {
                results = results.concat(this._searchMindmaps(query));
            }
        }

        logger.debug(`[Search] Query: "${query}", Found ${results.length} results`);
        if (results.length > 0) {
            logger.debug('[Search] First 3 results:', results.slice(0, 3).map(r => ({
                type: r.type,
                title: r.title || r.topicTitle,
                snippet: (r.snippet || '').substring(0, 80)
            })));
        }

        // Apply sorting
        this._sortSearchResults(results, query);

        // ⚡ MEMORY FIX: Store results in module-level cache (outside Alpine reactivity)
        // Access via getter in app.js - prevents deep reactive wrapping
        // Note: cachedSearchResults is defined in core/app.js
        // Use helper method that handles both cases
        this._updateSearchResults(results);
        logger.debug(`[Search] Results updated, searchResults.length =`, this.searchResults.length);
    },

    _sortSearchResults(results, query) {
        const sortBy = this.searchSortBy;
        const direction = this.searchSortDirection;
        const multiplier = direction === 'asc' ? 1 : -1;

        results.sort((a, b) => {
            let comparison = 0;

            // Relevance: prioritize title matches when there's a query
            if (sortBy === 'relevance' && query) {
                const aTitle = (a.title || a.topicTitle || '').toLowerCase();
                const bTitle = (b.title || b.topicTitle || '').toLowerCase();
                const aMatches = aTitle.includes(query) ? 1 : 0;
                const bMatches = bTitle.includes(query) ? 1 : 0;
                if (aMatches !== bMatches) {
                    comparison = bMatches - aMatches; // Title matches first
                    return comparison * multiplier;
                }
            }

            // Alphabetical: sort by title
            if (sortBy === 'alphabetical') {
                const aTitle = (a.title || a.topicTitle || '').toLowerCase();
                const bTitle = (b.title || b.topicTitle || '').toLowerCase();
                comparison = aTitle.localeCompare(bTitle);
                return comparison * multiplier;
            }

            // Numerical: sort by topic ID (for audit cards)
            if (sortBy === 'numerical') {
                if (a.type === 'audit' && b.type === 'audit') {
                    const aNum = parseFloat(a.topicId) || 0;
                    const bNum = parseFloat(b.topicId) || 0;
                    comparison = aNum - bNum;
                    return comparison * multiplier;
                }
                // Non-audit cards maintain original order
                return 0;
            }

            // Confidence: sort by confidence level (for audit cards)
            if (sortBy === 'confidence') {
                if (a.type === 'audit' && b.type === 'audit') {
                    const aConf = a.confidence || 0;
                    const bConf = b.confidence || 0;
                    comparison = aConf - bConf;
                    return comparison * multiplier;
                }
                // Non-audit cards maintain original order
                return 0;
            }

            // Date: sort by creation date (for notes/flashcards/mindmaps)
            if (sortBy === 'date') {
                const aDate = new Date(a.createdAt || 0).getTime();
                const bDate = new Date(b.createdAt || 0).getTime();
                comparison = aDate - bDate;
                return comparison * multiplier;
            }

            return 0;
        });
    },

    _searchAuditCards(query) {
        const results = [];

        // OPTIMIZATION: Convert arrays to Sets for O(1) lookup instead of O(n)
        const tagSet = new Set(this.selectedSearchTags);
        const hasTagFilter = tagSet.size > 0;
        const confidenceLevelSet = new Set(this.selectedConfidenceLevels);
        const hasConfidenceLevelFilter = confidenceLevelSet.size > 0;

        // ⚡ PERFORMANCE: Use search index for O(1) lookup
        let matchingTopics;
        if (query) {
            // Use index to find matching topics
            const matchingIds = this._getAuditCardsIndex().search(query);
            matchingTopics = this._getAuditCardsIndex().getItems(matchingIds);
        } else {
            // No query - get all topics from index
            matchingTopics = Array.from(this._getAuditCardsIndex().items.values());
        }

        matchingTopics.forEach(topic => {
            // Filter by tags if advanced search is active - O(1) lookup with Set
            if (hasTagFilter && !tagSet.has(topic.id)) {
                return;
            }

            // Filter by confidence rating if selected (legacy single-select)
            const topicConfidence = this.confidenceLevels[topic.id] || null;
            if (this.selectedConfidenceRating !== null) {
                if (topicConfidence !== this.selectedConfidenceRating) {
                    return;
                }
            }

            // Filter by confidence levels if selected (multi-select) - O(1) lookup with Set
            if (hasConfidenceLevelFilter) {
                if (!confidenceLevelSet.has(topicConfidence)) {
                    return;
                }
            }

            // ✅ PERFORMANCE FIX: Use pre-computed search text (cached during index build)
            // Instead of rebuilding: `${topic.id}...`.toLowerCase() on every search
            const searchText = topic._searchText;

            results.push({
                type: 'audit',
                topicId: topic.id,
                topicTitle: topic.title,
                topicPrompt: topic.prompt,
                sectionKey: topic.sectionKey,
                sectionTitle: topic.sectionTitle,
                paper: topic.paper,
                confidence: topicConfidence,
                snippet: this.createSearchSnippet(searchText, query, topic),
                borderClass: 'border-l-green-500 hover:border-green-600',
                badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            });
        });

        return results;
    },

    _searchNotes(query) {
        const results = [];

        // ⚡ PERFORMANCE: Use search index for O(1) lookup
        const matchingNotes = query
            ? this._getNotesIndex().searchItems(query)
            : Array.from(this._getNotesIndex().items.values());

        matchingNotes.forEach(note => {
            // Filter by tags if advanced search is active
            if (this.selectedSearchTags.length > 0) {
                const hasMatchingTag = note.tags && note.tags.some(tag => this.selectedSearchTags.includes(tag));
                if (!hasMatchingTag) {
                    return;
                }
            }

            const searchText = `${note.title || ''} ${note.content || ''} ${(note.tags || []).join(' ')}`.toLowerCase();
            const sectionInfo = this.specificationData[note.sectionId];
            results.push({
                type: 'note',
                id: note.id,
                title: note.title,
                content: note.content,
                sectionId: note.sectionId,
                sectionTitle: sectionInfo?.title || 'Unknown Section',
                tags: note.tags || [],
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                snippet: this._createNoteSnippet(searchText, query, note),
                borderClass: 'border-l-blue-500 hover:border-blue-600',
                badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            });
        });
        return results;
    },

    _searchFlashcards(query) {
        const results = [];

        // ⚡ PERFORMANCE: Use search index for O(1) lookup
        const matchingDecks = query
            ? this._getFlashcardsIndex().searchItems(query)
            : Array.from(this._getFlashcardsIndex().items.values());

        matchingDecks.forEach(deck => {
            // Filter by tags if advanced search is active
            if (this.selectedSearchTags.length > 0) {
                const hasMatchingTag = deck.tags && deck.tags.some(tag => this.selectedSearchTags.includes(tag));
                if (!hasMatchingTag) {
                    return;
                }
            }

            const deckText = `${deck.name || ''} ${(deck.tags || []).join(' ')}`.toLowerCase();
            const cardsText = (deck.cards || []).map(card => `${card.front || ''} ${card.back || ''}`).join(' ').toLowerCase();
            const searchText = `${deckText} ${cardsText}`;
            const sectionInfo = this.specificationData[deck.sectionId];

            results.push({
                type: 'flashcard',
                id: deck.id,
                title: deck.name,
                sectionId: deck.sectionId,
                sectionTitle: sectionInfo?.title || 'Unknown Section',
                cardCount: deck.cards?.length || 0,
                tags: deck.tags || [],
                createdAt: deck.createdAt,
                updatedAt: deck.updatedAt,
                snippet: this._createFlashcardSnippet(searchText, query, deck),
                borderClass: 'border-l-purple-500 hover:border-purple-600',
                badgeClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            });
        });
        return results;
    },

    _searchMindmaps(query) {
        const results = [];

        // ⚡ PERFORMANCE: Use search index for O(1) lookup
        const matchingMindmaps = query
            ? this._getMindmapsIndex().searchItems(query)
            : Array.from(this._getMindmapsIndex().items.values());

        matchingMindmaps.forEach(mindmap => {
            // Filter by tags if advanced search is active
            if (this.selectedSearchTags.length > 0) {
                const hasMatchingTag = mindmap.tags && mindmap.tags.some(tag => this.selectedSearchTags.includes(tag));
                if (!hasMatchingTag) {
                    return;
                }
            }

            const shapesText = (mindmap.shapes || []).map(shape => shape.text || '').join(' ').toLowerCase();
            const searchText = `${mindmap.title || ''} ${shapesText} ${(mindmap.tags || []).join(' ')}`.toLowerCase();
            const sectionInfo = this.specificationData[mindmap.sectionId];

            results.push({
                type: 'mindmap',
                id: mindmap.id,
                title: mindmap.title,
                sectionId: mindmap.sectionId,
                sectionTitle: sectionInfo?.title || 'Unknown Section',
                shapeCount: mindmap.shapes?.length || 0,
                tags: mindmap.tags || [],
                createdAt: mindmap.createdAt,
                updatedAt: mindmap.updatedAt,
                snippet: this._createMindmapSnippet(searchText, query, mindmap),
                borderClass: 'border-l-cyan-500 hover:border-cyan-600',
                badgeClass: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
            });
        });
        return results;
    },

    _createNoteSnippet(searchText, query, note) {
        const index = searchText.indexOf(query);
        if (index === -1) {
            const fallback = (note.content || note.title || '');
            return this.sanitizeHTML(fallback.substring(0, 100)) + (fallback.length > 100 ? '...' : '');
        }
        const start = Math.max(0, index - 30);
        const end = Math.min(searchText.length, index + query.length + 30);
        let snippet = searchText.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < searchText.length) snippet = snippet + '...';
        snippet = this.sanitizeHTML(snippet);
        // Highlight matches HERE (not in template)
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return snippet.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    },

    _createFlashcardSnippet(searchText, query, deck) {
        const cardCount = deck.cards?.length || 0;
        return `${cardCount} card${cardCount !== 1 ? 's' : ''}`;
    },

    _createMindmapSnippet(searchText, query, mindmap) {
        const shapeCount = mindmap.shapes?.length || 0;
        return `${shapeCount} shape${shapeCount !== 1 ? 's' : ''}`;
    },

    createSearchSnippet(searchText, query, topic) {
        // If no query, just show the prompt or title
        if (!query) {
            const fallback = (topic.prompt || topic.title || '');
            return this.sanitizeHTML(fallback.substring(0, 100)) + (fallback.length > 100 ? '...' : '');
        }

        const index = searchText.indexOf(query);
        if (index === -1) {
            const fallback = (topic.prompt || topic.title || '');
            return this.sanitizeHTML(fallback.substring(0, 100)) + (fallback.length > 100 ? '...' : '');
        }
        const start = Math.max(0, index - 30);
        const end = Math.min(searchText.length, index + query.length + 30);
        let snippet = searchText.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < searchText.length) snippet = snippet + '...';

        // Sanitize before highlighting
        snippet = this.sanitizeHTML(snippet);
        query = this.sanitizeHTML(query);

        // Highlight matches HERE (not in template) to avoid creating regex on every render
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return snippet.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    },

    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    navigateToSearchResult(result) {
        this.searchVisible = false;

        if (result.type === 'audit') {
            // Navigate to audit card
            this.activeSection = result.sectionKey;
            const parentGroup = this.currentGroups.find(item => item.type === "group" && item.sections?.includes(result.sectionKey));
            if (parentGroup) {
                this.lastExpandedGroup = parentGroup.title;
                this.expandedGroups[parentGroup.title] = true;
            }
            this.showingSpecificSection = true;
            this.showingMainMenu = false;
            this.viewType = 'audit';
            if (window.innerWidth < 768) this.sidebarVisible = false;
            this.$nextTick(() => {
                setTimeout(() => {
                    const topicElement = document.querySelector(`[data-topic-id="${result.topicId}"]`);
                    if (topicElement) {
                        topicElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        topicElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        setTimeout(() => { topicElement.style.backgroundColor = ''; }, 2000);
                    }
                }, 100);
            });
        } else if (result.type === 'note') {
            // Navigate to note
            this.viewType = 'notes';
            this.setNotesFilterSection(result.sectionId);
            this.$nextTick(() => {
                setTimeout(() => {
                    const noteElement = document.querySelector(`[data-note-id="${result.id}"]`);
                    if (noteElement) {
                        noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        noteElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        setTimeout(() => { noteElement.style.backgroundColor = ''; }, 2000);
                    }
                }, 100);
            });
        } else if (result.type === 'flashcard') {
            // Navigate to flashcard deck
            this.viewType = 'flashcards';
            this.studyMaterialsFilter = 'decks';
            this.setFlashcardsFilterSection(result.sectionId);
            this.$nextTick(() => {
                setTimeout(() => {
                    const deckElement = document.querySelector(`[data-deck-id="${result.id}"]`);
                    if (deckElement) {
                        deckElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        deckElement.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                        setTimeout(() => { deckElement.style.backgroundColor = ''; }, 2000);
                    }
                }, 100);
            });
        } else if (result.type === 'mindmap') {
            // Navigate to mindmap
            this.viewType = 'mindmaps';
            this.setMindmapsFilterSection(result.sectionId);
            this.$nextTick(() => {
                setTimeout(() => {
                    const mindmapElement = document.querySelector(`[data-mindmap-id="${result.id}"]`);
                    if (mindmapElement) {
                        mindmapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        mindmapElement.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                        setTimeout(() => { mindmapElement.style.backgroundColor = ''; }, 2000);
                    }
                }, 100);
            });
        }
    },
};