// js/data/unified-csv-loader.js
// Combined CSV loader for both subject data and resources
// Now uses shared utilities to eliminate code duplication

import { parseCSV, loadCSVFile } from '../utils/csv-parser.js';
import { convertSubjectCSV, convertGroupsCSV } from '../utils/csv-converter.js';
import {
    createVideoResource,
    createNoteResource,
    createSimulationResource,
    createQuestionResource,
    createRevisionSection
} from '../utils/resource-schema.js';

// ========================================
// SUBJECT DATA LOADING
// ========================================

// Global revision mappings - built from CSV data
let revisionMapping = {};
let revisionSectionTitles = {};
let topicToSectionMapping = {};

// Load subject specification data from CSV and convert to JS structure
async function loadSubjectCSV(filename) {
    try {
        const csvData = await loadCSVFile(`resources/subject-cards/${filename}`);

        if (csvData.length === 0) {
            return {};
        }

        // Use shared converter
        const sections = convertSubjectCSV(csvData, {
            revisionMapping,
            revisionSectionTitles,
            topicToSectionMapping
        });

        return sections;

    } catch (error) {
        console.error(`Error loading subject CSV ${filename}:`, error);
        return {};
    }
}

// Load all subject specification data
export async function loadAllSubjectData() {
    // Reset revision mappings before loading
    revisionMapping = {};
    revisionSectionTitles = {};
    topicToSectionMapping = {};

    // List of all CSV subject files
    const csvFiles = [
        'measurements.csv',
        'particles.csv',
        'waves.csv',
        'mechanics.csv',
        'electricity.csv',
        'periodic-motion.csv',
        'thermal.csv',
        'fields.csv',
        'magnetic-fields.csv',
        'nuclear.csv'
    ];

    let allData = {};

    // Load all CSV files in parallel
    const loadPromises = csvFiles.map(filename => {
        return loadSubjectCSV(filename);
    });

    // Wait for all files to load
    const allSubjectData = await Promise.all(loadPromises);

    // Merge all data
    allSubjectData.forEach(subjectData => {
        allData = { ...allData, ...subjectData };
    });

    // Initialize global mappings for the enhanced tool
    initializeRevisionMappings();

    return allData;
}

// Initialize global revision mappings (replaces js/data/revision-mappings.js)
function initializeRevisionMappings() {
    // Make mappings globally available
    window.revisionMapping = revisionMapping;
    window.topicToSectionMapping = topicToSectionMapping;
    window.revisionSectionTitles = revisionSectionTitles;
}

// Export revision mappings for other modules
export function getRevisionMappings() {
    return {
        revisionMapping,
        revisionSectionTitles,
        topicToSectionMapping
    };
}

// ========================================
// RESOURCE DATA LOADING
// ========================================

let allResources = {
    videos: {},
    notes: {},
    simulations: {},
    questions: {},
    sections: {}
};

// Load videos from CSV
async function loadVideos() {
    const data = await loadCSVFile('resources/revision/videos.csv');
    allResources.videos = {};

    data.forEach((video) => {
        if (!video.section_id) return;

        const sectionId = video.section_id.toString().trim();
        if (!allResources.videos[sectionId]) {
            allResources.videos[sectionId] = [];
        }

        const videoObject = createVideoResource(video);

        // Check for duplicates (URL already exists)
        const existingVideo = allResources.videos[sectionId].find(v => v.url === videoObject.url);
        if (!existingVideo) {
            allResources.videos[sectionId].push(videoObject);
        }
    });

    return Object.values(allResources.videos).flat().length;
}

// Load notes from CSV
async function loadNotes() {
    const data = await loadCSVFile('resources/revision/notes.csv');
    allResources.notes = {};

    data.forEach((note) => {
        if (!note.section_id) return;

        const sectionId = note.section_id.toString().trim();
        if (!allResources.notes[sectionId]) {
            allResources.notes[sectionId] = [];
        }

        const noteObject = createNoteResource(note);

        // Check for duplicates
        const existingNote = allResources.notes[sectionId].find(n => n.url === noteObject.url);
        if (!existingNote) {
            allResources.notes[sectionId].push(noteObject);
        }
    });

    return Object.values(allResources.notes).flat().length;
}

// Load simulations from CSV
async function loadSimulations() {
    const data = await loadCSVFile('resources/revision/simulations.csv');
    allResources.simulations = {};

    data.forEach((sim) => {
        if (!sim.section_id) return;

        const sectionId = sim.section_id.toString().trim();
        if (!allResources.simulations[sectionId]) {
            allResources.simulations[sectionId] = [];
        }

        const simObject = createSimulationResource(sim);

        // Check for duplicates
        const existingSim = allResources.simulations[sectionId].find(s => s.url === simObject.url);
        if (!existingSim) {
            allResources.simulations[sectionId].push(simObject);
        }
    });

    return Object.values(allResources.simulations).flat().length;
}

// Load questions from CSV
async function loadQuestions() {
    const data = await loadCSVFile('resources/revision/questions.csv');
    allResources.questions = {};

    data.forEach((question) => {
        if (!question.section_id) return;

        const sectionId = question.section_id.toString().trim();
        if (!allResources.questions[sectionId]) {
            allResources.questions[sectionId] = [];
        }

        const questionObject = createQuestionResource(question);

        // Check for duplicates
        const existingQuestion = allResources.questions[sectionId].find(q => q.url === questionObject.url);
        if (!existingQuestion) {
            allResources.questions[sectionId].push(questionObject);
        }
    });

    return Object.values(allResources.questions).flat().length;
}

// Load revision sections from CSV
async function loadRevisionSections() {
    const data = await loadCSVFile('resources/revision/revisionsections.csv');
    allResources.sections = {};

    data.forEach((section) => {
        if (!section.section_id) return;

        const sectionId = section.section_id.toString().trim();
        allResources.sections[sectionId] = createRevisionSection(section);
    });

    return Object.keys(allResources.sections).length;
}

// Load all resource types
export async function loadAllCSVResources() {
    const results = await Promise.all([
        loadVideos(),
        loadNotes(),
        loadSimulations(),
        loadQuestions(),
        loadRevisionSections()
    ]);

    const [videoCount, noteCount, simCount, questionCount, sectionCount] = results;
    const totalResources = videoCount + noteCount + simCount + questionCount;

    return totalResources > 0;
}

// Get all resources for a section
export function getResourcesForSection(sectionId) {
    const sectionIdStr = sectionId ? sectionId.toString().trim() : '';

    const resources = {
        section: allResources.sections[sectionIdStr] || null,
        videos: allResources.videos[sectionIdStr] || [],
        notes: allResources.notes[sectionIdStr] || [],
        simulations: allResources.simulations[sectionIdStr] || [],
        questions: allResources.questions[sectionIdStr] || []
    };

    return resources;
}

// ========================================
// GROUP DATA LOADING
// ========================================

// Load groups configuration from CSV
export async function loadGroups() {
    const data = await loadCSVFile('resources/groups.csv');

    // Use shared converter
    const groups = convertGroupsCSV(data);

    return groups;
}

// ========================================
// UNIFIED INITIALIZATION
// ========================================

// Load everything at once
export async function loadAllData() {
    try {
        // Load subject data, resources, and groups in parallel
        const [subjectData, resourcesLoaded, groups] = await Promise.all([
            loadAllSubjectData(),
            loadAllCSVResources(),
            loadGroups()
        ]);

        return {
            specificationData: subjectData,
            resourcesLoaded: resourcesLoaded,
            paperModeGroups: groups.paperModeGroups,
            specModeGroups: groups.specModeGroups
        };
    } catch (error) {
        console.error('❌ Failed to load CSV data:', error);
        throw error;
    }
}
