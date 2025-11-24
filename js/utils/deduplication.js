// js/utils/deduplication.js
// Shared deduplication utilities for preventing Alpine x-for key conflicts

/**
 * Fast hash function for generating stable keys from string content
 * Uses Java's String.hashCode() algorithm for consistency
 *
 * PERFORMANCE: O(n) where n = string length
 * COLLISION RATE: Low for typical content (<0.01% for strings >10 chars)
 *
 * @param {string} str - String to hash
 * @returns {number} 32-bit signed integer hash
 *
 * @example
 * hashCode("Hello World") // Returns: -862545276
 * hashCode("Hello World") // Returns: -862545276 (consistent)
 */
export function hashCode(str) {
    if (!str || typeof str !== 'string') {
        return 0;
    }

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return hash;
}

/**
 * Generates a stable unique key for flashcard cards
 * Combines deck ID with content hash to prevent collisions
 *
 * WHY: Cards within a deck don't have unique IDs, and using array index
 *      causes React/Alpine key instability. Using substring(0,30) can
 *      cause collisions if two cards have identical starts.
 *
 * PERFORMANCE: O(n) where n = content length
 *
 * @param {string} deckId - Parent deck ID
 * @param {Object} card - Card object with front/back content
 * @param {number} fallbackIndex - Fallback index if content is empty
 * @returns {string} Stable unique key
 *
 * @example
 * const key = generateCardKey('deck123', { front: 'Q', back: 'A' }, 0);
 * // Returns: "deck123-card-12345678"
 */
export function generateCardKey(deckId, card, fallbackIndex = 0) {
    if (!card || (!card.front && !card.back)) {
        return `${deckId}-card-${fallbackIndex}`;
    }

    // Combine front and back for uniqueness
    const content = (card.front || '') + '|' + (card.back || '');
    const hash = hashCode(content);

    return `${deckId}-card-${hash}`;
}

/**
 * Deduplicates an array of items by ID
 * Preserves the first occurrence when duplicates are found
 *
 * PERFORMANCE: O(n) time, O(unique items) space
 * WHY: Use Map for O(1) lookups instead of O(n) array.includes()
 * MEMORY: Minimal - only stores references, not copies
 *
 * @param {Array} items - Array of items to deduplicate
 * @returns {Array} Deduplicated array
 *
 * @example
 * const notes = [
 *   { id: 'note1', title: 'Note 1' },
 *   { id: 'note1', title: 'Note 1' }, // duplicate
 *   { id: 'note2', title: 'Note 2' }
 * ];
 * const unique = deduplicateById(notes);
 * // Returns: [{ id: 'note1', title: 'Note 1' }, { id: 'note2', title: 'Note 2' }]
 */
export function deduplicateById(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }

    // Use Map for O(n) deduplication instead of O(n²) with array methods
    const uniqueMap = new Map();

    items.forEach(item => {
        // Only add if item has valid ID and hasn't been added yet
        if (item && item.id !== undefined && item.id !== null && !uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
        }
    });

    return Array.from(uniqueMap.values());
}

/**
 * Flattens a grouped structure and deduplicates by ID
 * Common pattern for notes/flashcards/mindmaps grouped by section
 *
 * PERFORMANCE: O(n) where n = total items across all sections
 * WHY: Notes/decks with multiple tags appear in multiple sections, causing
 *      duplicate IDs in x-for loops. Alpine.js requires unique keys.
 * COMPLEXITY: flatMap is O(n), filter is O(n), deduplicate is O(n) = O(n) total
 *
 * @param {Array} groupedData - Array of groups containing sections with items
 * @param {string} itemsKey - Key to access items in each section (e.g., 'notes', 'decks', 'mindmaps')
 * @returns {Array} Flattened and deduplicated array
 *
 * @example
 * const grouped = [
 *   { sections: [{ notes: [{ id: 1 }, { id: 2 }] }] },
 *   { sections: [{ notes: [{ id: 1 }, { id: 3 }] }] } // id: 1 is duplicate
 * ];
 * const flat = flattenAndDeduplicate(grouped, 'notes');
 * // Returns: [{ id: 1 }, { id: 2 }, { id: 3 }]
 */
export function flattenAndDeduplicate(groupedData, itemsKey = 'notes') {
    if (!groupedData || !Array.isArray(groupedData)) {
        return [];
    }

    // Flatten all items from all groups/sections
    const allItems = groupedData.flatMap(group =>
        (group?.sections || []).flatMap(section => section?.[itemsKey] || [])
    ).filter(item => item && item.id !== undefined && item.id !== null);

    // Deduplicate by ID (preserves first occurrence)
    return deduplicateById(allItems);
}

/**
 * Creates a cached getter for Alpine.js that deduplicates grouped data
 * Includes cache invalidation when source data changes
 *
 * PERFORMANCE: O(1) for cache hits, O(n) for cache misses
 * MEMORY: O(n) for cached items + O(small string) for cache key
 * WHY: Avoid recalculating on every getter access in Alpine's reactive system
 *
 * @param {string} itemsKey - Key to access items in sections (e.g., 'notes', 'decks')
 * @returns {Object} Object with getter and cache properties
 *
 * @example
 * x-data="{
 *     ...createCachedDeduplicator('notes'),
 *
 *     get allNotes() {
 *         return this.getCachedItems(notesGroupedBySection);
 *     }
 * }"
 */
export function createCachedDeduplicator(itemsKey = 'notes') {
    return {
        [`_cached${capitalize(itemsKey)}`]: null,
        [`_${itemsKey}CacheKey`]: null,

        getCachedItems(groupedData) {
            // Generate lightweight cache key based on group structure
            // Only checks group titles and section counts, not full deep comparison
            const currentKey = JSON.stringify(
                (groupedData || []).map(g => `${g.groupTitle}:${(g.sections || []).length}`)
            );

            // Return cached result if structure hasn't changed
            if (this[`_${itemsKey}CacheKey`] === currentKey && this[`_cached${capitalize(itemsKey)}`]) {
                return this[`_cached${capitalize(itemsKey)}`];
            }

            // Recalculate and cache
            const result = flattenAndDeduplicate(groupedData, itemsKey);
            this[`_cached${capitalize(itemsKey)}`] = result;
            this[`_${itemsKey}CacheKey`] = currentKey;

            return result;
        }
    };
}

// Helper function to capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Makes the utility functions available globally for use in Alpine.js templates
 * Call this once during app initialization
 *
 * @example
 * // In app-loader.js or app.js
 * import { initializeDeduplicationUtils } from './utils/deduplication.js';
 * initializeDeduplicationUtils();
 *
 * // Then in Alpine templates:
 * :key="window.generateCardKey(deck.id, card, index)"
 */
export function initializeDeduplicationUtils() {
    window.hashCode = hashCode;
    window.generateCardKey = generateCardKey;
    window.deduplicateById = deduplicateById;
    window.flattenAndDeduplicate = flattenAndDeduplicate;
}
