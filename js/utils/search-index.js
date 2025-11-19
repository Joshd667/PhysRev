// js/utils/search-index.js
// Inverted index for O(1) search lookups

export class SearchIndex {
    constructor() {
        this.index = new Map(); // word -> Set of item IDs
        this.items = new Map(); // item ID -> item data
        this.stopWords = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with'
        ]);
    }

    /**
     * Build index from items array
     * @param {Array} items - Array of items to index
     * @param {Function} getSearchableText - Function to extract searchable text from item
     */
    buildIndex(items, getSearchableText) {
        this.index.clear();
        this.items.clear();

        items.forEach(item => {
            if (!item.id) {
                console.warn('Item without ID, skipping:', item);
                return;
            }

            this.items.set(item.id, item);

            const text = getSearchableText(item);
            const words = this.tokenize(text);

            words.forEach(word => {
                if (!this.index.has(word)) {
                    this.index.set(word, new Set());
                }
                this.index.get(word).add(item.id);
            });
        });
    }

    /**
     * Tokenize text into searchable words
     * @param {string} text - Text to tokenize
     * @returns {Array<string>} Array of normalized tokens
     */
    tokenize(text) {
        if (!text) return [];

        return text
            .toLowerCase()
            // Remove HTML tags if present
            .replace(/<[^>]*>/g, ' ')
            // Replace punctuation with spaces
            .replace(/[^\w\s]/g, ' ')
            // Split on whitespace
            .split(/\s+/)
            // Remove stop words and short words
            .filter(word => word.length > 2 && !this.stopWords.has(word))
            // Remove duplicates
            .filter((word, index, self) => self.indexOf(word) === index);
    }

    /**
     * Search for items matching query
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Set<string>} Set of matching item IDs
     */
    search(query, options = {}) {
        const {
            matchAll = true, // AND vs OR search
            fuzzy = false     // Future: fuzzy matching
        } = options;

        // For short queries (1-2 chars), do direct prefix matching without tokenization
        const rawQuery = query.toLowerCase().trim();
        if (rawQuery.length > 0 && rawQuery.length <= 2) {
            return this._searchWord(rawQuery);
        }

        const words = this.tokenize(query);
        if (words.length === 0) return new Set();

        // Get results for first word (with prefix matching)
        let results = this._searchWord(words[0]);

        if (matchAll) {
            // AND search - intersection
            for (let i = 1; i < words.length; i++) {
                const wordResults = this._searchWord(words[i]);
                results = new Set([...results].filter(id => wordResults.has(id)));

                // Early exit if no results
                if (results.size === 0) break;
            }
        } else {
            // OR search - union
            for (let i = 1; i < words.length; i++) {
                const wordResults = this._searchWord(words[i]);
                wordResults.forEach(id => results.add(id));
            }
        }

        return results;
    }

    /**
     * Search for a single word with prefix matching
     * @param {string} word - Word to search for
     * @returns {Set<string>} Set of matching item IDs
     * @private
     */
    _searchWord(word) {
        const results = new Set();

        // Iterate through index and find all words that start with the query word
        for (const [indexWord, itemIds] of this.index.entries()) {
            if (indexWord.startsWith(word)) {
                itemIds.forEach(id => results.add(id));
            }
        }

        return results;
    }

    /**
     * Get items from search results
     * @param {Set<string>} resultIds - Set of item IDs
     * @returns {Array} Array of items
     */
    getItems(resultIds) {
        return [...resultIds]
            .map(id => this.items.get(id))
            .filter(item => item !== undefined);
    }

    /**
     * Search and return items directly
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Array} Array of matching items
     */
    searchItems(query, options = {}) {
        const resultIds = this.search(query, options);
        return this.getItems(resultIds);
    }

    /**
     * Add a single item to index
     * @param {Object} item - Item to add
     * @param {Function} getSearchableText - Function to extract searchable text
     */
    addItem(item, getSearchableText) {
        if (!item.id) {
            console.warn('Cannot add item without ID');
            return;
        }

        this.items.set(item.id, item);

        const text = getSearchableText(item);
        const words = this.tokenize(text);

        words.forEach(word => {
            if (!this.index.has(word)) {
                this.index.set(word, new Set());
            }
            this.index.get(word).add(item.id);
        });
    }

    /**
     * Remove item from index
     * @param {string} itemId - ID of item to remove
     */
    removeItem(itemId) {
        this.items.delete(itemId);

        // Remove from all word indices
        this.index.forEach((ids, word) => {
            ids.delete(itemId);
            // Clean up empty word entries
            if (ids.size === 0) {
                this.index.delete(word);
            }
        });
    }

    /**
     * Update item in index
     * @param {Object} item - Updated item
     * @param {Function} getSearchableText - Function to extract searchable text
     */
    updateItem(item, getSearchableText) {
        this.removeItem(item.id);
        this.addItem(item, getSearchableText);
    }

    /**
     * Get index statistics
     * @returns {Object} Index statistics
     */
    getStats() {
        return {
            itemCount: this.items.size,
            wordCount: this.index.size,
            averageWordsPerItem: this.items.size > 0 ?
                (Array.from(this.index.values()).reduce((sum, set) => sum + set.size, 0) / this.items.size).toFixed(2) :
                0
        };
    }
}
