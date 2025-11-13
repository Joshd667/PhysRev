// js/utils/resource-schema.js
// Shared resource field definitions
// Single source of truth for resource object structure

/**
 * Create a video resource object from CSV row
 * @param {Object} item - Raw CSV row data
 * @returns {Object} - Formatted video object
 */
export function createVideoResource(item) {
    return {
        title: item.title || 'Untitled Video',
        description: item.description || '',
        url: item.url || '',
        duration: item.duration || '',
        difficulty: item.difficulty || 'Foundation',
        provider: item.provider || 'YouTube'
    };
}

/**
 * Create a note resource object from CSV row
 * @param {Object} item - Raw CSV row data
 * @returns {Object} - Formatted note object
 */
export function createNoteResource(item) {
    return {
        title: item.title || 'Untitled Note',
        description: item.description || '',
        url: item.url || '',
        type: item.type || 'PDF',
        pages: item.pages || '',
        difficulty: item.difficulty || 'Foundation'
    };
}

/**
 * Create a simulation resource object from CSV row
 * @param {Object} item - Raw CSV row data
 * @returns {Object} - Formatted simulation object
 */
export function createSimulationResource(item) {
    return {
        title: item.title || 'Untitled Simulation',
        description: item.description || '',
        url: item.url || '',
        provider: item.provider || 'PhET',
        interactivity: item.interactivity || 'High',
        difficulty: item.difficulty || 'Foundation'
    };
}

/**
 * Create a question resource object from CSV row
 * @param {Object} item - Raw CSV row data
 * @returns {Object} - Formatted question object
 */
export function createQuestionResource(item) {
    return {
        title: item.title || 'Untitled Questions',
        description: item.description || '',
        url: item.url || '',
        type: item.type || 'Multiple Choice',
        questionCount: item.question_count || '',
        difficulty: item.difficulty || 'Foundation',
        hasAnswers: item.has_answers === 'TRUE' || item.has_answers === 'true'
    };
}

/**
 * Create a revision section object from CSV row
 * @param {Object} section - Raw CSV row data
 * @returns {Object} - Formatted revision section object
 */
export function createRevisionSection(section) {
    let cleanHtml = section.notes_html || '';
    if (cleanHtml.startsWith('"') && cleanHtml.endsWith('"')) {
        cleanHtml = cleanHtml.slice(1, -1);
    }

    return {
        title: section.title || '',
        notes: cleanHtml,
        keyFormulas: section.key_formulas ? section.key_formulas.split('|').filter(f => f.trim()) : [],
        commonMistakes: section.common_mistakes ? section.common_mistakes.split('|').filter(m => m.trim()) : []
    };
}

/**
 * Get resource creator function by type
 * @param {string} type - Resource type ('videos', 'notes', 'simulations', 'questions')
 * @returns {Function} - Resource creator function
 */
export function getResourceCreator(type) {
    const creators = {
        videos: createVideoResource,
        notes: createNoteResource,
        simulations: createSimulationResource,
        questions: createQuestionResource
    };
    return creators[type] || ((item) => item);
}
