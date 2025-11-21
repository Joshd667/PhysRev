/**
 * Paginated List Component for Alpine.js
 * Provides "Load More" pagination for long lists
 *
 * Usage in template:
 *   <div x-data="paginatedList(allItems, 50)">
 *     <template x-for="item in visibleItems" :key="item.id">
 *       <!-- Your item template -->
 *     </template>
 *     <button x-show="hasMore" @click="loadMore()">Load More</button>
 *   </div>
 */

import { logger } from '../utils/logger.js';

/**
 * Create a paginated list component
 * @param {Array} items - Full array of items
 * @param {number} pageSize - Initial number of items to show (default: 50)
 * @param {number} increment - Number of items to load per "Load More" click (default: 25)
 * @returns {Object} Alpine.js component
 */
export function paginatedList(items = [], pageSize = 50, increment = 25) {
    return {
        // Internal state
        _allItems: items,
        _displayCount: Math.min(pageSize, items.length),
        _pageSize: pageSize,
        _increment: increment,

        // Computed properties
        get visibleItems() {
            return this._allItems.slice(0, this._displayCount);
        },

        get hasMore() {
            return this._displayCount < this._allItems.length;
        },

        get remainingCount() {
            return Math.max(0, this._allItems.length - this._displayCount);
        },

        get totalCount() {
            return this._allItems.length;
        },

        get percentageLoaded() {
            if (this._allItems.length === 0) return 100;
            return Math.round((this._displayCount / this._allItems.length) * 100);
        },

        // Actions
        loadMore() {
            const newCount = this._displayCount + this._increment;
            this._displayCount = Math.min(newCount, this._allItems.length);
            logger.debug(`Loaded ${this._increment} more items. Now showing ${this._displayCount}/${this._allItems.length}`);
        },

        showAll() {
            this._displayCount = this._allItems.length;
            logger.debug(`Showing all ${this._allItems.length} items`);
        },

        reset() {
            this._displayCount = Math.min(this._pageSize, this._allItems.length);
            logger.debug(`Reset pagination. Showing ${this._displayCount} items`);
        },

        // Update source data
        updateItems(newItems) {
            this._allItems = newItems;
            // Reset if current display exceeds new items OR if display is zero and we have new items
            if (this._displayCount > newItems.length || (this._displayCount === 0 && newItems.length > 0)) {
                this._displayCount = Math.min(this._pageSize, newItems.length);
            }
            logger.debug(`Updated items. Total: ${newItems.length}, Showing: ${this._displayCount}`);
        }
    };
}

/**
 * Virtual scroll implementation for better performance with very large lists
 * @param {Array} items - Full array of items
 * @param {Object} config - Configuration options
 * @returns {Object} Alpine.js component
 */
export function virtualScrollList(items = [], config = {}) {
    const defaultConfig = {
        itemHeight: 80,       // Fixed height per item (required for calculations)
        bufferSize: 5,        // Extra items to render above/below viewport
        containerHeight: 600  // Container height in pixels
    };

    const cfg = { ...defaultConfig, ...config };

    return {
        // State
        _allItems: items,
        _scrollTop: 0,
        _containerHeight: cfg.containerHeight,
        _itemHeight: cfg.itemHeight,
        _bufferSize: cfg.bufferSize,

        // Computed
        get totalHeight() {
            return this._allItems.length * this._itemHeight;
        },

        get visibleCount() {
            return Math.ceil(this._containerHeight / this._itemHeight);
        },

        get startIndex() {
            const idx = Math.floor(this._scrollTop / this._itemHeight);
            return Math.max(0, idx - this._bufferSize);
        },

        get endIndex() {
            const idx = this.startIndex + this.visibleCount + (this._bufferSize * 2);
            return Math.min(this._allItems.length, idx);
        },

        get visibleItems() {
            return this._allItems.slice(this.startIndex, this.endIndex);
        },

        get offsetY() {
            return this.startIndex * this._itemHeight;
        },

        // Actions
        handleScroll(event) {
            this._scrollTop = event.target.scrollTop;
        },

        updateItems(newItems) {
            this._allItems = newItems;
        },

        scrollToIndex(index) {
            const scrollTop = index * this._itemHeight;
            this._scrollTop = scrollTop;
            // Update actual DOM element if available
            const container = this.$el;
            if (container) {
                container.scrollTop = scrollTop;
            }
        }
    };
}

/**
 * Register Alpine.js magic helpers for pagination
 * @param {Object} Alpine - Alpine.js instance
 */
export function registerPaginationHelpers(Alpine) {
    if (!Alpine || !Alpine.magic) {
        logger.warn('Alpine.js not available for pagination helper registration');
        return;
    }

    // Magic helper: $paginated(items, pageSize, increment)
    Alpine.magic('paginated', () => {
        return (items, pageSize, increment) => paginatedList(items, pageSize, increment);
    });

    // Magic helper: $virtualScroll(items, config)
    Alpine.magic('virtualScroll', () => {
        return (items, config) => virtualScrollList(items, config);
    });

    logger.info('✅ Pagination magic helpers registered');
}

export default {
    paginatedList,
    virtualScrollList,
    registerPaginationHelpers
};
