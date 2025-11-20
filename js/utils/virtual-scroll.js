/**
 * Virtual Scroll Utility for Alpine.js
 * Efficiently renders large lists by only showing visible items
 *
 * Usage:
 *   x-data="virtualScroll(items, { itemHeight: 100, bufferSize: 5 })"
 *   x-for="item in visibleItems"
 */

import { logger } from './logger.js';

/**
 * Default configuration for virtual scroll
 */
const DEFAULT_CONFIG = {
    itemHeight: 80,        // Height of each item in pixels
    bufferSize: 5,         // Number of extra items to render above/below viewport
    containerHeight: 600,  // Default container height
    overscan: 3           // Extra items to prevent flickering during fast scroll
};

/**
 * Create a virtual scroll component for Alpine.js
 * @param {Array} items - The full array of items to virtualize
 * @param {Object} config - Configuration options
 * @returns {Object} - Alpine.js reactive data object
 */
export function virtualScroll(items = [], config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    return {
        // Source data
        allItems: items,

        // Configuration
        itemHeight: cfg.itemHeight,
        bufferSize: cfg.bufferSize,
        containerHeight: cfg.containerHeight,
        overscan: cfg.overscan,

        // Scroll state
        scrollTop: 0,
        containerElement: null,

        // Calculated values
        get totalHeight() {
            return this.allItems.length * this.itemHeight;
        },

        get visibleCount() {
            return Math.ceil(this.containerHeight / this.itemHeight);
        },

        get startIndex() {
            const index = Math.floor(this.scrollTop / this.itemHeight);
            return Math.max(0, index - this.bufferSize - this.overscan);
        },

        get endIndex() {
            const index = this.startIndex + this.visibleCount + (this.bufferSize * 2) + (this.overscan * 2);
            return Math.min(this.allItems.length, index);
        },

        get visibleItems() {
            return this.allItems.slice(this.startIndex, this.endIndex).map((item, idx) => ({
                ...item,
                _virtualIndex: this.startIndex + idx,
                _virtualOffset: (this.startIndex + idx) * this.itemHeight
            }));
        },

        get offsetY() {
            return this.startIndex * this.itemHeight;
        },

        /**
         * Initialize virtual scroll
         */
        init() {
            this.$nextTick(() => {
                this.containerElement = this.$el;
                if (this.containerElement) {
                    // Set container height if not explicitly set
                    if (!this.containerElement.style.height) {
                        this.containerElement.style.height = `${this.containerHeight}px`;
                    }
                    this.containerElement.style.overflow = 'auto';
                    this.containerElement.style.position = 'relative';
                }
            });
        },

        /**
         * Handle scroll events
         */
        handleScroll(event) {
            this.scrollTop = event.target.scrollTop;
        },

        /**
         * Update items (when source data changes)
         */
        updateItems(newItems) {
            this.allItems = newItems;
            // Reset scroll position if needed
            if (this.startIndex >= newItems.length) {
                this.scrollTop = 0;
                if (this.containerElement) {
                    this.containerElement.scrollTop = 0;
                }
            }
        },

        /**
         * Scroll to specific item index
         */
        scrollToIndex(index) {
            if (index < 0 || index >= this.allItems.length) return;

            const scrollTop = index * this.itemHeight;
            this.scrollTop = scrollTop;

            if (this.containerElement) {
                this.containerElement.scrollTop = scrollTop;
            }
        },

        /**
         * Get style for container
         */
        getContainerStyle() {
            return `height: ${this.containerHeight}px; overflow: auto; position: relative;`;
        },

        /**
         * Get style for spacer (creates scroll space)
         */
        getSpacerStyle() {
            return `height: ${this.totalHeight}px; position: relative;`;
        },

        /**
         * Get style for visible items wrapper
         */
        getItemsWrapperStyle() {
            return `transform: translateY(${this.offsetY}px); position: absolute; top: 0; left: 0; right: 0;`;
        }
    };
}

/**
 * Simplified virtual scroll for quick implementation
 * Uses "Load More" pagination instead of true virtual scrolling
 *
 * @param {Array} items - The full array of items
 * @param {Object} config - Configuration options
 * @returns {Object} - Alpine.js reactive data object
 */
export function paginatedList(items = [], config = {}) {
    const pageSize = config.pageSize || 50;
    const increment = config.increment || 25;

    return {
        allItems: items,
        displayCount: pageSize,
        pageSize: pageSize,
        increment: increment,

        get visibleItems() {
            return this.allItems.slice(0, this.displayCount);
        },

        get hasMore() {
            return this.displayCount < this.allItems.length;
        },

        get remainingCount() {
            return Math.max(0, this.allItems.length - this.displayCount);
        },

        loadMore() {
            this.displayCount = Math.min(
                this.displayCount + this.increment,
                this.allItems.length
            );
        },

        showAll() {
            this.displayCount = this.allItems.length;
        },

        reset() {
            this.displayCount = this.pageSize;
        },

        updateItems(newItems) {
            this.allItems = newItems;
            // Reset if current display exceeds new items
            if (this.displayCount > newItems.length) {
                this.displayCount = Math.min(this.pageSize, newItems.length);
            }
        }
    };
}

/**
 * Alpine.js magic helper for virtual scroll
 * Usage: <div x-data="$virtualScroll(items, { itemHeight: 100 })">
 */
export function registerVirtualScrollMagic(Alpine) {
    if (!Alpine || !Alpine.magic) {
        logger.warn('Alpine.js not available for virtual scroll magic registration');
        return;
    }

    Alpine.magic('virtualScroll', () => virtualScroll);
    Alpine.magic('paginatedList', () => paginatedList);

    logger.info('Virtual scroll magic helpers registered');
}

export default {
    virtualScroll,
    paginatedList,
    registerVirtualScrollMagic
};
