// js/utils/topic-lookup.js
// Utility for creating and managing topic lookup map

/**
 * Builds a topic lookup map from specificationData
 * @param {Object} specificationData - The specification data object
 * @returns {Object} Map of topicId -> { topicId, topicTitle, sectionName, sectionTitle, sectionIcon, sectionPaper }
 */
export function buildTopicLookup(specificationData) {
    const lookup = {};

    Object.entries(specificationData).forEach(([sectionName, section]) => {
        section.topics.forEach(topic => {
            lookup[topic.id] = {
                topicId: topic.id,
                topicTitle: topic.title,
                sectionName: sectionName,
                sectionTitle: section.title,
                sectionIcon: section.icon,
                sectionPaper: section.paper
            };
        });
    });

    return lookup;
}

/**
 * Gets a formatted display string for a topic tag
 * @param {string} topicId - The topic ID
 * @param {Object} topicLookup - The topic lookup map
 * @returns {string} Formatted string like "1.1 - Measurements - Physical Quantities"
 */
export function getTopicDisplayName(topicId, topicLookup) {
    const topic = topicLookup[topicId];
    if (!topic) {
        return topicId; // Fallback to ID if not found
    }
    return `${topic.topicId} - ${topic.sectionTitle} - ${topic.topicTitle}`;
}

/**
 * Gets a short display name for a topic tag
 * @param {string} topicId - The topic ID
 * @param {Object} topicLookup - The topic lookup map
 * @returns {string} Formatted string like "1.1 Physical Quantities"
 */
export function getTopicShortName(topicId, topicLookup) {
    const topic = topicLookup[topicId];
    if (!topic) {
        return topicId; // Fallback to ID if not found
    }
    return `${topic.topicId} ${topic.topicTitle}`;
}

/**
 * Groups topics by section for display
 * @param {Object} topicLookup - The topic lookup map
 * @returns {Array} Array of sections with their topics
 */
export function groupTopicsBySection(topicLookup) {
    const sections = {};

    Object.values(topicLookup).forEach(topic => {
        if (!sections[topic.sectionName]) {
            sections[topic.sectionName] = {
                sectionName: topic.sectionName,
                sectionTitle: topic.sectionTitle,
                sectionIcon: topic.sectionIcon,
                sectionPaper: topic.sectionPaper,
                topics: []
            };
        }
        sections[topic.sectionName].topics.push(topic);
    });

    return Object.values(sections);
}

/**
 * Searches topics by query string
 * @param {string} query - Search query
 * @param {Object} topicLookup - The topic lookup map
 * @returns {Array} Array of matching topics
 */
export function searchTopics(query, topicLookup) {
    if (!query || !query.trim()) {
        return Object.values(topicLookup);
    }

    const lowerQuery = query.toLowerCase();
    return Object.values(topicLookup).filter(topic =>
        topic.topicId.toLowerCase().includes(lowerQuery) ||
        topic.topicTitle.toLowerCase().includes(lowerQuery) ||
        topic.sectionTitle.toLowerCase().includes(lowerQuery)
    );
}
