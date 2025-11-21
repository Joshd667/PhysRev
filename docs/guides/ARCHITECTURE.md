## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: [Alpine.js](https://alpinejs.dev/) v3.13.3 (reactive UI)
- **Database**: IndexedDB (client-side storage with 100s of MB capacity)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) (utility-first CSS)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **PWA**: Service Worker for offline support
- **XSS Protection**: [DOMPurify](https://github.com/cure53/DOMPurify) v3.0.6

### Performance Architecture: Non-Reactive Static Data

**⚡ Memory Optimization**

The app achieves significant memory efficiency (90% reduction: 1.2GB → 100-150MB) by storing large read-only data **outside Alpine.js's reactive system**. Large static data is stored in **module-level variables** (`js/core/app.js`) and accessed via getter methods in the Alpine app instance, preventing Alpine from wrapping them in Proxies.

**Implementation:**

```javascript
// js/core/app.js - Module-level storage (non-reactive)
let staticSpecificationData = null;
let staticPaperModeGroups = null;
let staticSpecModeGroups = null;
let staticTopicLookup = null;

export function createApp(specificationData, paperModeGroups, specModeGroups, Alpine) {
    // Store large data outside Alpine's reactive system
    staticSpecificationData = specificationData;
    staticPaperModeGroups = paperModeGroups;
    staticSpecModeGroups = specModeGroups;
    staticTopicLookup = buildTopicLookup(specificationData);

    return () => {
        const state = createState(); // Create state without large data

        return {
            ...state,
            // Getters return static data (not reactive)
            get specificationData() { return staticSpecificationData; },
            get paperModeGroups() { return staticPaperModeGroups; },
            get specModeGroups() { return staticSpecModeGroups; },
            get topicLookup() { return staticTopicLookup; }
        };
    };
}
```

**Data Storage:**
- **Non-Reactive (static)**: `specificationData` (~50MB), `paperModeGroups` (~5MB), `specModeGroups` (~5MB), `topicLookup` (~10MB)
- **Reactive (user data)**: `confidenceLevels`, `userNotes`, `flashcardDecks`, `mindmaps`, `analyticsData`, UI state

**Important Notes:**
- Data won't appear in Alpine DevTools - access via `window.physicsAuditApp`
- Do not put large static data in `createState()` - use module-level variables
- Static data is never modified by users, making this pattern safe

### Storage & Caching Architecture

**📦 Multi-Layer Storage System**

**1. Service Worker Cache**
- **Purpose**: Offline support and instant page loads
- **Strategy**: Cache-first with background updates
- **Location**: `sw.js`
- **Cached Assets**: HTML, CSS, JS, templates, external libraries
- **Features**: Silent operation (only errors logged), works completely offline after first visit

**2. IndexedDB (Primary Storage)**
- **Purpose**: Persistent user data with 50MB+ capacity
- **Location**: `js/utils/indexeddb.js`
- **Database**: `PhysicsAuditDB`
- **Stored Data**: Notes, flashcards, mindmaps, confidence levels, analytics history, settings, auth tokens
- **Features**: Asynchronous operations, 30-day analytics cleanup, HMAC data integrity signing

**3. localStorage (Minimal Use)**
- **Debug flag only**: `js/utils/logger.js` uses localStorage for DEBUG toggle
- **Migration code**: One-time migration from legacy localStorage to IndexedDB (runs once on first load)

**4. Web Worker (Large Data Processing)**
- **Purpose**: Offload JSON serialization from main thread
- **Location**: `js/utils/storage-worker.js`
- **Trigger**: Automatically used for data >100KB
- **Lifecycle**: Properly terminated on page unload/tab hidden to prevent memory leaks

**Storage Flow:**
```
User saves data → Check size → >100KB? Use Web Worker : Use requestIdleCallback → IndexedDB
```

**Console Utilities:**
```javascript
clearAllAppStorage()  // Clear all storage (IndexedDB + SW cache + localStorage)
getStorageStats()     // View storage usage statistics
```

**Key Files:**
- `sw.js` - Service Worker
- `js/utils/storage.js` - Storage abstraction with worker management
- `js/utils/indexeddb.js` - IndexedDB wrapper
- `js/utils/storage-worker.js` - Background serialization worker
- `js/sw-registration.js` - SW lifecycle management

### External Dependencies (CDN)

| Library | Version | Purpose |
|---------|---------|---------|
| **Tailwind CSS** | latest | Utility-first CSS framework |
| **Alpine.js** | 3.13.3 | Reactive JavaScript framework |
| **Lucide Icons** | 0.546.0 | Icon library |
| **Chart.js** | 4.4.1 | Analytics charts |
| **KaTeX** | 0.16.9 | Math equation rendering |
| **DOMPurify** | 3.0.6 | XSS protection |

**Important:**
- Internet required for first load - CDN dependencies downloaded initially
- Offline after first visit - Service Worker caches all dependencies
- Tailwind CDN shows "should not be used in production" warning (safe to ignore for this PWA use case)

### Project Structure

```
PhysRev/
├── index.html                 # Main entry point
├── sw.js                      # Service Worker for PWA/offline support
├── manifest.json             # PWA manifest
│
├── js/
│   ├── app-loader.js          # App initialization
│   ├── template-loader.js     # Dynamic HTML template loader
│   ├── sw-registration.js     # Service Worker registration
│   │
│   ├── core/                  # Core app architecture
│   │   ├── app.js            # Main app factory (module-level static storage)
│   │   ├── state.js          # Reactive state definitions
│   │   └── watchers.js       # Alpine.js watchers & lifecycle
│   │
│   ├── features/              # Feature modules
│   │   ├── analytics/        # Analytics calculations, charts, insights
│   │   ├── auth/             # Guest auth, Teams OAuth, data management
│   │   ├── confidence/       # Confidence rating system
│   │   ├── flashcards/       # Deck management, test mode, 3D flip cards
│   │   ├── mindmaps/         # Mindmap management, canvas rendering
│   │   ├── navigation/       # Navigation state management
│   │   ├── notes/            # Notes CRUD, rich text editor, equation editor
│   │   ├── revision/         # Revision resources, view logic
│   │   ├── search/           # Search functionality
│   │   ├── settings/         # Settings & preferences
│   │   ├── tags/             # Tag selector & management
│   │   └── views/            # View type management (audit/notes/flashcards/mindmaps)
│   │
│   ├── components/           # Reusable UI components
│   │   └── paginated-list.js # Pagination component
│   │
│   ├── utils/                # Shared utilities
│   │   ├── content-filter.js # Content filtering
│   │   ├── csv-converter.js  # CSV conversion
│   │   ├── csv-parser.js     # CSV parsing
│   │   ├── data-integrity.js # HMAC data integrity signing
│   │   ├── date.js           # Date formatting
│   │   ├── indexeddb.js      # IndexedDB operations
│   │   ├── logger.js         # Production-safe logging (DEBUG toggle)
│   │   ├── modals.js         # Modal utilities
│   │   ├── resource-schema.js # Resource object schemas
│   │   ├── revision-colors.js # Revision color schemes
│   │   ├── search-index.js   # Search indexing
│   │   ├── statistics.js     # Statistics calculations
│   │   ├── storage.js        # Storage abstraction with worker management
│   │   ├── storage-worker.js # Background JSON serialization
│   │   ├── topic-lookup.js   # Topic ID mapping
│   │   ├── ui.js             # UI utilities
│   │   └── virtual-scroll.js # Virtual scrolling
│   │
│   └── data/                  # Data configuration
│       ├── index.js          # Group configurations (paper/spec modes)
│       └── unified-csv-loader.js # CSV loader with revision mappings
│
├── templates/                 # HTML component templates
│   ├── all-flashcards-view.html   # All flashcards view
│   ├── all-mindmaps-view.html     # All mindmaps view
│   ├── all-notes-view.html        # All notes view
│   ├── analytics-dashboard.html   # Analytics dashboard
│   ├── custom-modal.html          # Custom modal
│   ├── equation-editor-modal.html # Math equation builder (KaTeX)
│   ├── flashcard-editor-modal.html # Flashcard deck editor
│   ├── flashcard-test-modal.html  # 3D flip card test interface
│   ├── load-more-button.html      # Load more button
│   ├── main-menu.html             # Main menu (group cards)
│   ├── mindmap-editor-modal.html  # Canvas mindmap editor
│   ├── mindmap-node-editor.html   # Rich text node editor
│   ├── note-editor-modal.html     # Rich text note editor
│   ├── privacy-notice-modal.html  # Privacy notice
│   ├── revision-view.html         # Revision resources view
│   ├── search-results.html        # Search results
│   ├── section-cards.html         # Section selection view
│   ├── settings-modal.html        # Settings and data management
│   ├── sidebar.html               # Sidebar navigation
│   ├── tag-selector-modal.html    # Topic tag selector
│   ├── top-bar.html               # Top navigation bar
│   └── topic-detail.html          # Topic detail with confidence rating
│
├── resources/                 # Data files
│   ├── combined-data.json    # Optimized JSON (physics topics, icons, etc.)
│   ├── subject-cards/        # CSV subject data
│   └── revision/             # CSV revision resources
│
├── css/
│   └── style.css             # Custom styles
│
├── legal/                    # Legal documents
│
├── docs/                     # Documentation
│   └── guides/
│       ├── ARCHITECTURE.md   # This file
│       └── ...               # Other guides
│
├── auth-callback.html        # OAuth callback for Teams login
│
└── tools/                     # Development utilities
    ├── csv-converter-unified.html # CSV→JSON converter
    ├── test-imports.html          # Module import testing
    └── generate-sri-hashes.js     # SRI hash generator
```

---


## Production-Safe Logging

**Location:** `js/utils/logger.js`

The app uses a production-safe logger that replaces `console.*` calls with conditional logging.

**Behavior:**
- **Development** (localhost): All logs visible by default
- **Production**: Only errors logged by default
- **Debug mode**: User-controlled toggle for detailed logging via localStorage

**Usage:**
```javascript
import { logger } from './utils/logger.js';

logger.log('Debug info')      // Only in debug mode
logger.warn('Warning')         // Only in debug mode
logger.error('Critical!')      // ALWAYS logged
logger.info('Information')     // Only in debug mode
logger.debug('Trace details')  // Only in debug mode
```

**Console Control:**
```javascript
// Toggle debug mode
logger.enableDebug()          // Show all logs
logger.disableDebug()         // Production mode (errors only)
logger.isDebugEnabled()       // Check status

// Direct localStorage control
localStorage.setItem('DEBUG', 'true')    // Enable
localStorage.removeItem('DEBUG')         // Disable
```

**Implementation:**
- All JavaScript modules use `logger.*` instead of `console.*`
- Service Worker intentionally uses `console.*` (separate context)
- Global error handlers use `console.error()` (critical errors always visible)

---

## XSS Protection

**Library:** [DOMPurify](https://github.com/cure53/DOMPurify) v3.0.6

The app sanitizes all user-generated content before DOM injection using DOMPurify with context-appropriate configurations.

**Protected Features:**
- **Notes:** Rich text content with formatting
- **Flashcards:** Front/back card content
- **Mindmaps:** Node content with styling

### Sanitization Configurations

**Text Extraction (Snippets):**
```javascript
DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
});
```

**Rich Text Editor (Notes):**
```javascript
DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
                   'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a',
                   'span', 'div', 'table', 'tr', 'td', 'th'],
    ALLOWED_ATTR: ['href', 'style', 'class', 'id'],
    ALLOWED_STYLES: {
        '*': {
            'color': [/^#[0-9A-Fa-f]{3,6}$/],
            'background-color': [/^#[0-9A-Fa-f]{3,6}$/],
            'font-size': [/^\d+px$/]
        }
    }
});
```

**Mindmap Nodes:**
```javascript
DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span'],
    ALLOWED_ATTR: ['style'],
    ALLOWED_STYLES: {
        '*': {
            'color': [/^#[0-9A-Fa-f]{3,6}$/],
            'font-size': [/^\d+px$/]
        }
    }
});
```

### Implementation Files

- `js/features/notes/display.js` - Note snippet extraction
- `js/features/notes/management.js` - Note editor loading
- `js/features/notes/editor.js` - Note content processing
- `js/features/mindmaps/canvas.js` - Mindmap node rendering

### Security Strategy

**Defense in Depth:**
- Sanitize on input (loading into editors)
- Sanitize on output (rendering to DOM)
- Sanitize on export (generating HTML exports)

**Least Privilege:**
- Minimal allowed tags for each context
- Strict regex validation on CSS properties
- Block dangerous protocols (javascript:, data:)

**Additional Protections:**
- KaTeX has built-in XSS protection for equation rendering
- Template loader uses hardcoded paths (no user input)
- Search helper escapes user input via `textContent`

---
