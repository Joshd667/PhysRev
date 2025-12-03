## 🔧 Data Architecture Guide

**👨‍💻 FOR DEVELOPERS**

This is the technical guide for developers working on the data loading system, CSV parsing, and content architecture. If you're a teacher/educator looking to add content, see **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)** instead.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Flow Architecture](#data-flow-architecture)
3. [CSV Loading System](#csv-loading-system)
4. [Revision Mapping System](#revision-mapping-system)
5. [JSON Optimization](#json-optimization)
6. [Adding New Data Sources](#adding-new-data-sources)
7. [Testing & Debugging](#testing--debugging)

---

## Overview

The app uses a **data-driven architecture** where content is stored in CSV files and loaded dynamically at runtime. This enables non-technical users to manage content while maintaining code flexibility.

**Key Design Principles:**
- **Separation of data and code** - Content creators edit CSVs, developers maintain JS
- **Parallel loading** - All CSVs load simultaneously using `Promise.all()`
- **Shared utilities** - DRY principle with `csv-parser.js`, `csv-converter.js`, `resource-schema.js`
- **Performance optimization** - Optional JSON precompilation for 10x faster loads

---

## Data Flow Architecture

### Full Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Storage (resources/)                                    │
├─────────────────────────────────────────────────────────────────┤
│ • subject-cards/*.csv (10 files) - Topic definitions            │
│ • revision/*.csv (5 files) - Learning resources                 │
│ • groups.csv (1 file) - UI organization                         │
│ • combined-data.json (optional) - Precompiled for performance   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Loading (js/data/unified-csv-loader.js)                │
├─────────────────────────────────────────────────────────────────┤
│ • Check for combined-data.json first                            │
│ • Fallback to CSV loading if JSON missing/old                   │
│ • Parallel fetch of all 16 CSV files                            │
│ • Parse CSV → Array of objects (csv-parser.js)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Conversion (js/utils/csv-converter.js)                 │
├─────────────────────────────────────────────────────────────────┤
│ • convertSubjectCSV() - Transform flat CSV to nested structure  │
│ • convertGroupsCSV() - Build group hierarchy                    │
│ • Build revision mappings dynamically                           │
│ • Create topic lookup tables                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: In-Memory Storage (js/core/app.js)                     │
├─────────────────────────────────────────────────────────────────┤
│ • Module-level static variables (non-reactive)                  │
│ • staticSpecificationData - All physics topics (~50MB)          │
│ • staticPaperModeGroups / staticSpecModeGroups (~5MB each)      │
│ • staticTopicLookup (~10MB)                                     │
│ • Accessed via getters in Alpine.js app                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Global Access (window object)                          │
├─────────────────────────────────────────────────────────────────┤
│ • window.revisionMapping - Maps section_id → [topic_ids]       │
│ • window.revisionSectionTitles - Maps section_id → title       │
│ • window.topicToSectionMapping - Reverse lookup                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Rendering (Alpine.js templates)                        │
├─────────────────────────────────────────────────────────────────┤
│ • Templates read from Alpine app via getters                    │
│ • Dynamic filtering by paper, section, confidence               │
│ • Reactive UI updates on user interaction                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## CSV Loading System

### Core File: `js/data/unified-csv-loader.js`

**Purpose:** Single entry point for loading all CSV data with parallel fetching and error handling.

### Architecture

**Module Structure:**
```javascript
// Subject data loading
async function loadSubjectCSV(filename)      // Load single subject CSV
export async function loadAllSubjectData()   // Load all 10 subject CSVs

// Groups configuration
export async function loadGroupsCSV()        // Load groups.csv

// Revision resources
export async function loadRevisionResources() // Load 5 revision CSVs

// Revision mappings
function initializeRevisionMappings()        // Expose to window object
export function getRevisionMappings()        // Export for modules
```

### Subject CSV Loading

**File:** `js/data/unified-csv-loader.js` (lines 26-47)

```javascript
async function loadSubjectCSV(filename) {
    try {
        // 1. Fetch CSV from server
        const csvData = await loadCSVFile(`resources/subject-cards/${filename}`);

        if (csvData.length === 0) {
            return {};
        }

        // 2. Convert CSV to nested JS structure
        const sections = convertSubjectCSV(csvData, {
            revisionMapping,           // Mutated during conversion
            revisionSectionTitles,     // Mutated during conversion
            topicToSectionMapping      // Mutated during conversion
        });

        return sections;

    } catch (error) {
        logger.error(`Error loading subject CSV ${filename}:`, error);
        return {};
    }
}
```

**Key Points:**
- Uses shared `loadCSVFile()` from `csv-parser.js`
- Passes mapping objects by reference (mutated during conversion)
- Graceful error handling - returns empty object on failure
- Each CSV file is independent (can fail without breaking others)

### Parallel Loading Strategy

**File:** `js/data/unified-csv-loader.js` (lines 50-89)

```javascript
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

    // Initialize global mappings
    initializeRevisionMappings();

    return allData;
}
```

**Performance Characteristics:**
- **Without optimization:** ~2-3 seconds (16 sequential HTTP requests)
- **With Promise.all():** ~500ms (16 parallel HTTP requests)
- **With JSON optimization:** ~200ms (1 HTTP request)

**Network Waterfall:**
```
Without parallel:  ████ ████ ████ ████ ████ ████ (sequential)
With parallel:     ████████████████████████████ (parallel)
                   ^ All requests start simultaneously
```

---

## Revision Mapping System

### Purpose

Revision mappings group individual topic cards into revision sections for color-coding and organization.

**Example:**
- Topics `3.1.1a`, `3.1.1b`, `3.1.1c` all have `section_id = "3.1.1"`
- They get grouped together in revision mode
- They share the same color bar
- They appear under `revision_section_title = "SI Units and Measurements"`

### Technical Implementation

**Built Dynamically from CSV Data**

The mappings are constructed during CSV conversion:

**File:** `js/utils/csv-converter.js` (subject conversion logic)

```javascript
export function convertSubjectCSV(csvData, mappings = {}) {
    const {
        revisionMapping = {},
        revisionSectionTitles = {},
        topicToSectionMapping = {}
    } = mappings;

    const sections = {};

    csvData.forEach(row => {
        const sectionId = row.section_id;      // e.g., "3.1.1"
        const topicId = row.topic_id;          // e.g., "3.1.1a"

        // Build revision mapping: section_id → [topic_ids]
        if (!revisionMapping[sectionId]) {
            revisionMapping[sectionId] = [];
        }
        if (!revisionMapping[sectionId].includes(topicId)) {
            revisionMapping[sectionId].push(topicId);
        }

        // Store revision section titles
        if (row.revision_section_title) {
            revisionSectionTitles[sectionId] = row.revision_section_title;
        }

        // Build reverse lookup: topic_id → section_id
        topicToSectionMapping[topicId] = sectionId;

        // ... rest of conversion logic
    });

    return sections;
}
```

### Global Access

**File:** `js/data/unified-csv-loader.js` (lines 92-97)

```javascript
function initializeRevisionMappings() {
    // Make mappings globally available
    window.revisionMapping = revisionMapping;
    window.topicToSectionMapping = topicToSectionMapping;
    window.revisionSectionTitles = revisionSectionTitles;
}
```

**Data Structures:**

```javascript
// Example mappings after loading
window.revisionMapping = {
    "3.1.1": ["3.1.1a", "3.1.1b", "3.1.1c"],
    "3.1.2": ["3.1.2a", "3.1.2b"],
    "3.2.1": ["3.2.1a", "3.2.1b", "3.2.1c", "3.2.1d"]
    // ... etc
}

window.revisionSectionTitles = {
    "3.1.1": "SI Units and Measurements",
    "3.1.2": "Errors and Uncertainties",
    "3.2.1": "Atomic Structure"
    // ... etc
}

window.topicToSectionMapping = {
    "3.1.1a": "3.1.1",
    "3.1.1b": "3.1.1",
    "3.1.1c": "3.1.1",
    "3.1.2a": "3.1.2"
    // ... etc
}
```

### Color Assignment

**File:** `js/utils/revision-colors.js`

Colors are assigned deterministically based on `section_id` using a hash function:

```javascript
export function getSectionColor(sectionId) {
    // Hash the section_id to a number
    let hash = 0;
    for (let i = 0; i < sectionId.length; i++) {
        hash = sectionId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Map to one of the predefined color schemes
    const colorIndex = Math.abs(hash) % SECTION_COLORS.length;
    return SECTION_COLORS[colorIndex];
}
```

**Key Properties:**
- **Deterministic** - Same `section_id` always gets same color
- **Distributed** - Hash function spreads colors evenly
- **Persistent** - Colors don't change between sessions

---

## JSON Optimization

### Performance Problem

Loading 16 CSV files requires:
- 16 HTTP requests (even with parallel loading)
- CSV parsing on every page load
- Revision mapping reconstruction
- ~2-3 seconds on slower connections

### Solution: Precompiled JSON

**File:** `resources/combined-data.json`

A precompiled JSON file containing all data in memory-ready format:

```javascript
{
    "version": 2,
    "timestamp": "2025-01-20T12:00:00Z",
    "metadata": {
        "subject_files": 10,
        "revision_files": 5,
        "total_topics": 237
    },
    "specificationData": {
        // All topics in nested structure (ready to use)
    },
    "paperModeGroups": {
        // Pre-built group hierarchy
    },
    "specModeGroups": {
        // Pre-built spec mode groups
    },
    "revisionMapping": {
        // Pre-computed mappings
    },
    "revisionSectionTitles": {
        // Pre-computed titles
    },
    "topicToSectionMapping": {
        // Pre-computed reverse lookup
    },
    "revisionResources": {
        // All revision resources
    }
}
```

### JSON Loading Priority

**File:** `js/app-loader.js`

```javascript
// 1. Try to load optimized JSON first
try {
    const response = await fetch('./resources/combined-data.json');
    if (response.ok) {
        const jsonData = await response.json();

        // Check version
        if (jsonData.version === 2) {
            // Use precompiled data (fast path)
            return jsonData;
        }
    }
} catch (error) {
    logger.warn('JSON not found, falling back to CSV loading');
}

// 2. Fallback to CSV loading
const csvData = await loadAllSubjectData();
```

### Performance Comparison

| Method | Requests | Parse Time | Total Time | Use Case |
|--------|----------|------------|------------|----------|
| **CSV Loading** | 16 | ~500ms | ~2-3s | Development, frequent content changes |
| **JSON Optimization** | 1 | ~50ms | ~200ms | Production, stable content |

### Generating JSON

**Tool:** `tools/csv-converter-unified.html`

**Two Modes:**

1. **Server Mode** (automatic)
   - Opens in browser when app is running on a web server
   - Automatically fetches all 16 CSV files via fetch()
   - One-click conversion

2. **Local Mode** (manual)
   - Opens directly from file system
   - Drag & drop or file select for all 16 CSVs
   - Validates all files present before conversion

**Conversion Process:**
```javascript
// Simplified conversion logic
async function convertToJSON() {
    // 1. Load all CSVs (via fetch or file upload)
    const subjectData = await loadAllSubjectData();
    const groups = await loadGroupsCSV();
    const resources = await loadRevisionResources();

    // 2. Build unified structure
    const combined = {
        version: 2,
        timestamp: new Date().toISOString(),
        specificationData: subjectData,
        paperModeGroups: groups.paperMode,
        specModeGroups: groups.specMode,
        revisionMapping: window.revisionMapping,
        revisionSectionTitles: window.revisionSectionTitles,
        topicToSectionMapping: window.topicToSectionMapping,
        revisionResources: resources
    };

    // 3. Download as JSON
    const blob = new Blob([JSON.stringify(combined, null, 2)],
                         { type: 'application/json' });
    downloadFile(blob, 'combined-data.json');
}
```

### JSON Maintenance

**Important:** JSON does NOT auto-update when CSVs change!

**Workflow:**
1. Educators edit CSV files
2. Developer re-runs converter tool
3. Replace `resources/combined-data.json`
4. Deploy updated JSON

**Alternative:** Remove `combined-data.json` to force CSV loading (useful in development).

---

## Adding New Data Sources

### Scenario 1: Adding Paper 3 Content to Existing Files

**No code changes required!**

Educators can:
1. Add Paper 3 groups to `resources/groups.csv`
2. Add Paper 3 topics to existing subject CSVs (e.g., `fields.csv`, `mechanics.csv`)
3. Set `section_paper = "Paper 3"` in CSV

The loader automatically picks up the new content.

### Scenario 2: Creating New CSV Files

**Requires code changes.**

**Step 1: Register CSV files in loader**

**File:** `js/data/unified-csv-loader.js` (lines 57-68)

```javascript
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
    'nuclear.csv',
    // ADD NEW FILES HERE:
    'astrophysics.csv',        // Paper 3
    'medical-physics.csv',      // Paper 3
    'engineering-physics.csv'   // Paper 3
];
```

**Step 2: Test loading**

```javascript
// In browser console (F12)
// Force reload and check for errors
location.reload(true);

// Check if new files loaded
console.log(Object.keys(window.revisionMapping));

// Should see new section IDs (e.g., "3.9.1", "3.10.1")
```

**Step 3: Update JSON converter**

The converter tool automatically detects all CSV files in the loader array, so no changes needed there.

### Scenario 3: Adding New Resource Types

**Example:** Adding "experiments.csv" to revision resources

**File:** `js/data/unified-csv-loader.js` (revision resources section)

```javascript
export async function loadRevisionResources() {
    const resources = {
        videos: [],
        notes: [],
        simulations: [],
        questions: [],
        revisionSections: [],
        experiments: []  // NEW RESOURCE TYPE
    };

    try {
        // Load existing resources...

        // Add new resource type
        const experimentsCSV = await loadCSVFile('resources/revision/experiments.csv');
        resources.experiments = experimentsCSV.map(row => {
            return createExperimentResource(row);  // Create schema function
        });

    } catch (error) {
        logger.error('Error loading experiments:', error);
    }

    return resources;
}
```

**Also create schema:**

**File:** `js/utils/resource-schema.js`

```javascript
export function createExperimentResource(row) {
    return {
        section_id: row.section_id,
        title: row.title,
        description: row.description,
        equipment: row.equipment?.split('|') || [],
        procedure: row.procedure,
        safety_notes: row.safety_notes,
        difficulty: row.difficulty || 'Intermediate'
    };
}
```

---

## Testing & Debugging

### Browser Console Debugging

**Check if data loaded:**
```javascript
// Global data access
console.log(window.physicsAuditApp);  // Alpine app instance

// Check revision mappings
console.log(window.revisionMapping);
console.log(window.revisionSectionTitles);
console.log(window.topicToSectionMapping);

// Check loaded data size
console.log(Object.keys(window.revisionMapping).length + ' sections loaded');
```

**Enable debug logging:**
```javascript
localStorage.setItem('DEBUG', 'true');
location.reload();

// Now see detailed CSV loading logs
```

**Check CSV loading:**
```javascript
// In js/data/unified-csv-loader.js, add logging
logger.log(`✅ Loaded ${filename}: ${Object.keys(sections).length} sections`);
```

### Common Issues

**1. CSV not loading**

**Symptom:** Section doesn't appear in app

**Debug:**
```javascript
// Check network tab (F12 → Network)
// Look for 404 errors on CSV files

// Check if filename matches exactly (case-sensitive!)
```

**Fix:**
- Verify file exists in `resources/subject-cards/`
- Check filename spelling in `csvFiles` array
- Verify web server is serving files correctly

**2. Topics missing after adding to CSV**

**Symptom:** CSV loads but topics don't appear

**Debug:**
```javascript
// Check if section_name matches groups.csv
const groupsData = await loadGroupsCSV();
console.log(groupsData);

// Check if topic parsing succeeded
console.log(window.revisionMapping);
```

**Fix:**
- Verify `section_name` in subject CSV matches entry in `groups.csv`
- Check CSV syntax (commas, quotes, pipe separators)
- Ensure `topic_id` is unique across all files

**3. Revision resources not showing**

**Symptom:** Resources exist but don't display

**Debug:**
```javascript
// Check resource loading
const resources = await loadRevisionResources();
console.log(resources);

// Check section_id matching
// Resources use "3.1.1", topics use "3.1.1a", "3.1.1b"
```

**Fix:**
- Verify `section_id` in resource CSV matches the prefix of topic IDs
- Example: Resources with `section_id = "3.1.1"` match topics `3.1.1a`, `3.1.1b`, etc.

**4. Groups not organizing correctly**

**Symptom:** Sections appear in wrong paper or wrong order

**Debug:**
```javascript
// Check groups loading
const groups = await loadGroupsCSV();
console.log('Paper 1 groups:', groups.paperMode.get('Paper 1'));
console.log('Paper 2 groups:', groups.paperMode.get('Paper 2'));
```

**Fix:**
- Verify `paper` column is exactly "Paper 1", "Paper 2", or "Paper 3"
- Check `order` column for correct numbering
- Ensure `group_title` is identical for sections in same group

### Performance Profiling

**Measure load time:**
```javascript
// In js/app-loader.js
console.time('Data Loading');
const data = await loadAllSubjectData();
console.timeEnd('Data Loading');

// Typical results:
// CSV: ~500ms to 2s depending on connection
// JSON: ~100ms to 300ms
```

**Memory usage:**
```javascript
// Check memory after loading
console.log(performance.memory);

// Typical values:
// With reactive wrapping: ~1.2GB
// Without reactive wrapping: ~100-150MB
```

---

## Architecture Decisions

### Why CSV instead of JSON directly?

**Pros of CSV:**
- ✅ Non-technical users can edit in Excel/Google Sheets
- ✅ Visual bulk operations (sort, filter, find/replace)
- ✅ Better diffs in version control (line-by-line changes)
- ✅ Easier content review (open in spreadsheet app)

**Cons of CSV:**
- ❌ Slower to parse than JSON
- ❌ Limited data types (everything is string)
- ❌ Pipe separators for arrays are less elegant

**Decision:** CSV for content management, JSON for performance optimization (best of both worlds).

### Why module-level storage instead of reactive?

**File:** `js/core/app.js`

Large data (50-100MB) stored in module-level variables instead of Alpine.js reactive state:

```javascript
// Module level (non-reactive)
let staticSpecificationData = null;

// Alpine app getter (non-reactive access)
get specificationData() {
    return staticSpecificationData;
}
```

**Why:**
- Alpine wraps reactive data in Proxies
- For 100MB of data, this creates 1GB+ of proxy wrappers
- Causes memory issues, slow performance, fan spin-up
- Static data never changes, doesn't need reactivity

**Performance Impact:** 90% memory reduction (1.2GB → 100-150MB)

### Why window object for mappings?

```javascript
window.revisionMapping = revisionMapping;
window.topicToSectionMapping = topicToSectionMapping;
```

**Reasons:**
1. **Legacy compatibility** - Existing code references these globals
2. **Shared access** - Multiple modules need access without imports
3. **Debug convenience** - Easy to inspect in console
4. **No circular dependencies** - Avoids import cycles

**Trade-off:** Global variables are generally discouraged, but pragmatic here given the constraints.

---

## Related Documentation

- **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)** - Guide for teachers/educators editing content
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Overall system architecture
- **[TODO.md](../TODO.md)** - Outstanding tasks (including Paper 3 content work)

---

**Last Updated:** 2025-11-21
**Document Version:** 1.0
**Maintained by:** Development team
