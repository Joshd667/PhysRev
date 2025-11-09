// js/utils/csv-converter.js
// Shared CSV conversion logic
// Used by: unified-csv-loader.js, csv-converter.html

/**
 * Convert subject CSV data to application format
 * Builds sections object and revision mappings from CSV rows
 * @param {Object[]} csvData - Parsed CSV data
 * @param {Object} revisionMappings - Object to populate with revision mappings
 * @returns {Object} - Sections object keyed by section_name
 */
export function convertSubjectCSV(csvData, revisionMappings) {
    const sections = {};

    csvData.forEach(row => {
        if (!row.section_name) return;

        // Create section if it doesn't exist
        if (!sections[row.section_name]) {
            sections[row.section_name] = {
                title: row.section_title,
                paper: row.section_paper,
                icon: row.section_icon,
                topics: []
            };
        }

        // Parse pipe-separated learning objectives and examples
        const learningObjectives = row.learning_objectives ?
            row.learning_objectives.split('|').map(obj => obj.trim()).filter(obj => obj) : [];
        const examples = row.examples ?
            row.examples.split('|').map(ex => ex.trim()).filter(ex => ex) : [];

        // Add topic to section
        sections[row.section_name].topics.push({
            id: row.topic_id,
            title: row.topic_title,
            prompt: row.topic_prompt,
            learningObjectives: learningObjectives,
            examples: examples
        });

        // Build revision mappings from section_id and revision_section_title
        if (row.section_id && row.section_id.trim()) {
            const sectionId = row.section_id.trim();
            const topicId = row.topic_id.trim();

            // Build revisionMapping: sectionId -> array of topicIds
            if (!revisionMappings.revisionMapping[sectionId]) {
                revisionMappings.revisionMapping[sectionId] = [];
            }
            if (!revisionMappings.revisionMapping[sectionId].includes(topicId)) {
                revisionMappings.revisionMapping[sectionId].push(topicId);
            }

            // Build revisionSectionTitles: sectionId -> title
            if (row.revision_section_title && row.revision_section_title.trim()) {
                revisionMappings.revisionSectionTitles[sectionId] = row.revision_section_title.trim();
            }

            // Build reverse mapping: topicId -> sectionId
            revisionMappings.topicToSectionMapping[topicId] = sectionId;
        }
    });

    return sections;
}

/**
 * Convert groups CSV data to application format
 * @param {Object[]} csvData - Parsed CSV data from groups.csv
 * @returns {Object} - { paperModeGroups, specModeGroups }
 */
export function convertGroupsCSV(csvData) {
    const paperModeGroups = {};
    const specModeGroups = {};

    // Build groups structure
    csvData.forEach(row => {
        const paper = row.paper;
        const order = parseInt(row.order);
        const type = row.type;
        const groupTitle = row.group_title;
        const icon = row.icon;
        const sectionName = row.section_name;

        // Initialize paper array if needed
        if (paper === 'Paper 1' || paper === 'Paper 2') {
            if (!paperModeGroups[paper]) paperModeGroups[paper] = [];
        } else if (paper === 'All Topics') {
            if (!specModeGroups[paper]) specModeGroups[paper] = [];
        }

        const targetGroups = (paper === 'Paper 1' || paper === 'Paper 2') ? paperModeGroups : specModeGroups;

        if (type === 'single') {
            // Single sections
            targetGroups[paper].push({
                type: 'single',
                key: sectionName,
                order: order
            });
        } else if (type === 'group') {
            // Find or create group
            let group = targetGroups[paper].find(g => g.type === 'group' && g.title === groupTitle && g.order === order);
            if (!group) {
                group = {
                    type: 'group',
                    title: groupTitle,
                    icon: icon,
                    sections: [],
                    order: order
                };
                targetGroups[paper].push(group);
            }
            group.sections.push(sectionName);
        }
    });

    // Sort groups by order
    Object.keys(paperModeGroups).forEach(paper => {
        paperModeGroups[paper].sort((a, b) => a.order - b.order);
        // Remove order property from final output
        paperModeGroups[paper].forEach(item => delete item.order);
    });

    Object.keys(specModeGroups).forEach(paper => {
        specModeGroups[paper].sort((a, b) => a.order - b.order);
        // Remove order property from final output
        specModeGroups[paper].forEach(item => delete item.order);
    });

    return { paperModeGroups, specModeGroups };
}
