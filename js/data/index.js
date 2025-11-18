// js/data/index.js - Using unified CSV loader
import { loadAllData } from './unified-csv-loader.js';

// CSV-based data loading - will be populated by loadAllData()
export let specificationData = {};

// Group configurations - will be populated from CSV by loadAllData()
export let paperModeGroups = {};
export let specModeGroups = {};

// Initialize data loading from CSV files
export async function initializeData() {
    console.log('Initializing physics specification data from CSV files...');

    try {
        // Load all data (subjects, resources, and groups) from CSV files
        const allData = await loadAllData();

        // Populate the exported variables
        specificationData = allData.specificationData;
        paperModeGroups = allData.paperModeGroups;
        specModeGroups = allData.specModeGroups;

        console.log('✅ CSV data loaded successfully');
        console.log('Available sections:', Object.keys(specificationData));
        console.log('Paper mode groups:', Object.keys(paperModeGroups));
        console.log('Spec mode groups:', Object.keys(specModeGroups));

        return true;
    } catch (error) {
        console.error('❌ Failed to load specification data:', error);

        // Fallback to empty data structure
        specificationData = {};
        paperModeGroups = {};
        specModeGroups = {};
        return false;
    }
}

// Export function to get current data (since it's loaded asynchronously)
export function getSpecificationData() {
    return specificationData;
}

// Default export for backward compatibility
export { specificationData as default };
