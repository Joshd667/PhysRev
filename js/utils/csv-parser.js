// js/utils/csv-parser.js
// Shared CSV parser used across the application
// Used by: unified-csv-loader.js, csv-converter.html

import { logger } from './logger.js';

/**
 * Parse a single CSV line, handling quoted fields with commas
 * @param {string} line - A single CSV line
 * @returns {string[]} - Array of field values
 */
function parseLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote (doubled quotes)
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator outside of quotes
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last field
    values.push(current.trim());
    return values;
}

/**
 * Enhanced CSV parser that handles quoted fields with commas and HTML content
 * @param {string} csvText - Raw CSV text content
 * @returns {Object[]} - Array of row objects with headers as keys
 */
export function parseCSV(csvText) {
    if (!csvText || !csvText.trim()) return [];

    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Get headers from first line
    const headers = parseLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);

        // Create object from headers and values
        const row = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';

            // Clean up quotes
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }

            // Clean up HTML content - decode common HTML entities
            if (header === 'notes_html' && value) {
                value = value
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#x27;/g, "'")
                    .replace(/&amp;/g, '&');
            }

            row[header] = value;
        });

        data.push(row);
    }

    return data;
}

/**
 * Load and parse a CSV file from a URL
 * @param {string} filepath - Path to CSV file
 * @returns {Promise<Object[]>} - Parsed CSV data
 */
export async function loadCSVFile(filepath) {
    try {
        let response;
        try {
            // Try loading from relative path first
            response = await fetch(`./${filepath}`);
        } catch (error) {
            // Fallback to absolute path
            response = await fetch(`/${filepath}`);
        }

        if (!response.ok) {
            logger.warn(`Failed to load ${filepath}: HTTP ${response.status}`);
            return [];
        }

        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        logger.error(`Error loading ${filepath}:`, error);
        return [];
    }
}
