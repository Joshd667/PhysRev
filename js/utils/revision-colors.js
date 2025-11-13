// js/utils/revision-colors.js
// Color generation for revision area indicators

/**
 * Generates a consistent color palette for revision sections
 * Uses HSL color space for visually distinct colors
 */
export const revisionAreaColorMethods = {
    /**
     * Get the revision section ID for a given topic ID
     * @param {string} topicId - The topic ID (e.g., "3.1.1a")
     * @returns {string|null} - The revision section ID (e.g., "3.1.1") or null
     */
    getRevisionSectionForTopic(topicId) {
        if (!topicId) return null;

        // First, try the explicit mapping if available
        if (window.topicToSectionMapping && window.topicToSectionMapping[topicId]) {
            return window.topicToSectionMapping[topicId];
        }

        // Fallback: Derive revision section by removing trailing letter(s) from topic ID
        // Examples: "3.1.1a" -> "3.1.1", "3.2.1.1c" -> "3.2.1.1"
        const match = topicId.match(/^([\d.]+)[a-z]*$/);
        if (match && match[1]) {
            return match[1];
        }

        // If no pattern match, use the whole topic ID as section ID
        return topicId;
    },

    /**
     * Generate a consistent color for a revision section
     * Uses an improved hash-based approach with better distribution
     * @param {string} sectionId - The revision section ID
     * @returns {object} - Object with {hsl, rgb, hex} color values
     */
    getRevisionAreaColor(sectionId) {
        if (!sectionId) return { hsl: 'hsl(0, 0%, 70%)', rgb: 'rgb(179, 179, 179)', hex: '#b3b3b3' };

        // Generate a hash from the section ID using a better hash function
        let hash = 0;
        for (let i = 0; i < sectionId.length; i++) {
            const char = sectionId.charCodeAt(i);
            // Use a prime multiplier and add position-based variation
            hash = ((hash << 5) - hash) + char + (i * 31);
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Apply additional mixing for better distribution
        hash = ((hash ^ (hash >>> 16)) * 0x85ebca6b) & 0xffffffff;
        hash = ((hash ^ (hash >>> 13)) * 0xc2b2ae35) & 0xffffffff;
        hash = (hash ^ (hash >>> 16)) >>> 0;

        // Use hash to generate HSL values with wider distribution
        // Hue: Full spectrum (0-360) with better spacing
        const hue = Math.abs(hash % 360);

        // Saturation: 65-85% for vibrant colors
        const saturation = 65 + (Math.abs((hash >> 8) ^ hash) % 21);

        // Lightness: 50-60% for good contrast
        const lightness = 50 + (Math.abs((hash >> 16) ^ hash) % 11);

        const hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        // Convert HSL to RGB for certain use cases
        const rgb = this.hslToRgb(hue, saturation, lightness);
        const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);

        return { hsl, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, hex };
    },

    /**
     * Get color for a specific topic (looks up its revision section)
     * @param {string} topicId - The topic ID
     * @returns {object} - Color object with {hsl, rgb, hex}
     */
    getColorForTopic(topicId) {
        const sectionId = this.getRevisionSectionForTopic(topicId);
        const color = this.getRevisionAreaColor(sectionId);

        return color;
    },

    /**
     * Convert HSL to RGB
     * @private
     */
    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    },

    /**
     * Convert RGB to Hex
     * @private
     */
    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join('');
    }
};
