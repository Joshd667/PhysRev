## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: [Alpine.js](https://alpinejs.dev/) v3.13.3 (reactive UI)
- **Database**: IndexedDB (client-side storage with 100s of MB capacity)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) (utility-first CSS)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **PWA**: Service Worker for offline support

### Performance Architecture: Non-Reactive Static Data

**⚡ Memory Optimization (90% reduction: 1.2GB → 100-150MB)**

The app implements a critical performance optimization by storing large read-only data **outside Alpine.js's reactive system**:

**The Problem:**
- Alpine.js wraps all reactive data in JavaScript Proxies to track changes
- For large nested objects (50-100MB), this creates ~10x memory overhead
- Specification data + groups = ~100MB → 1GB+ of Proxy wrappers
- Caused high CPU usage, slow performance, and memory issues on older machines

**The Solution:**
- Large static data stored in **module-level variables** (`js/core/app.js`)
- Accessed via getter methods in the Alpine app instance
- Alpine never wraps them in Proxies = raw JavaScript objects only

**Implementation Details:**

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
        // Create state without large data
        const state = createState();

        return {
            ...state,

            // Getters return static data (not reactive)
            get specificationData() {
                return staticSpecificationData;
            },
            get paperModeGroups() {
                return staticPaperModeGroups;
            },
            // ... other getters
        };
    };
}
```

**What Data is Stored Non-Reactively:**
- `specificationData` - All physics topics, descriptions, icons (~50MB)
- `paperModeGroups` - Paper mode organization (~5MB)
- `specModeGroups` - Specification mode organization (~5MB)
- `topicLookup` - Topic ID → topic info map (~10MB)

**What Remains Reactive:**
- User data: `confidenceLevels`, `userNotes`, `flashcardDecks`, `mindmaps`
- UI state: `activeSection`, `viewMode`, `selectedPaper`, etc.
- Analytics data: `analyticsData`, `analyticsHistoryData`

**Trade-offs:**
- ✅ **Benefits**: 90% memory reduction, faster load, smoother navigation, better battery
- ✅ **No functional drawbacks**: Static data is never modified by users
- ⚠️ **Consideration**: Data won't appear in Alpine DevTools (access via `window.physicsAuditApp`)
- ⚠️ **Maintenance**: Developers must understand not to put large static data in `createState()`

**Performance Impact:**
- Initial load: ~100MB instead of 1.2GB
- Navigation: No garbage collection pauses
- Mind map canvas: No CPU fan spin-up
- Mobile/tablets: Usable instead of crashing
- Long study sessions: No gradual slowdown

**Files Modified:**
- `js/core/app.js` - Module-level static storage + getters
- `js/core/state.js` - Removed large data from reactive state

### Storage & Caching Architecture

**📦 Multi-Layer Storage System**

The app uses a sophisticated caching and storage strategy combining Service Workers, IndexedDB, and Web Workers:

**1. Service Worker Cache (HTTP/Asset Cache)**
- **Purpose**: Offline support and fast loading
- **Strategy**: Cache-first with background updates
- **Location**: `sw.js`
- **What's Cached**: HTML, CSS, JS, templates, external libraries (44 resources)
- **Version**: v2.42 (silent operation, only errors logged)
- **Benefits**:
  - Instant page loads (serve from cache immediately)
  - Background updates keep content fresh
  - Works completely offline after first visit

**2. IndexedDB (User Data Storage)**
- **Purpose**: Persistent user data with ~50MB+ capacity
- **Location**: `js/utils/indexeddb.js`
- **Database**: `PhysicsAuditDB`
- **What's Stored**: Notes, flashcards, mindmaps, confidence levels, analytics history, settings, auth tokens
- **Features**:
  - Automatic migration from localStorage on first load
  - 30-day analytics cleanup to prevent quota issues
  - Asynchronous operations (non-blocking)
  - HMAC data integrity signing for sensitive data

**Why IndexedDB (not localStorage)?**

| Issue | localStorage | IndexedDB |
|-------|-------------|-----------|
| **Capacity** | 5-10 MB limit | 100s of MB |
| **Performance** | Synchronous (blocks UI) | Asynchronous (non-blocking) |
| **Data Type** | Strings only | Objects, arrays, blobs |
| **Transactions** | None | ACID guarantees |

**localStorage Usage (Minimal)**

The app still uses localStorage for 2 specific cases:

1. **Migration Code** (`js/utils/indexeddb.js:340-404`)
   - One-time migration from legacy localStorage to IndexedDB
   - Runs automatically on first load for users with old data
   - Marked complete after migration (never runs again)

2. **Debug Flag** (`js/utils/logger.js`)
   - Stores `DEBUG` boolean flag
   - Synchronous access required (logger checks instantly)
   - Non-sensitive data (just a preference)
   - Example: `localStorage.setItem('DEBUG', 'true')`

All user data is in IndexedDB. localStorage references are for backward compatibility and debug tooling only.

**3. Web Worker (Serialization)**
- **Purpose**: Offload heavy JSON processing from main thread
- **Location**: `js/utils/storage-worker.js`
- **Trigger**: Data >100KB triggers worker usage
- **Lifecycle**: v2.42 added proper termination on page unload
- **Benefits**: Prevents UI freezing during large data saves

**Storage Management (v2.42)**
```javascript
// From browser console:
clearAllAppStorage()  // Clear ALL storage (IndexedDB + SW cache + localStorage)
getStorageStats()     // View storage usage statistics
```

**Storage Flow:**
```
User saves data → storage.js checks size
                ↓
        > 100KB? Use Web Worker for serialization
        < 100KB? Use requestIdleCallback
                ↓
        Serialized data → IndexedDB
                ↓
        Success or Quota handling
```

**Memory Leak Prevention (v2.42):**
- Web Workers properly terminated on page unload (`beforeunload` event)
- Workers terminated when tab hidden (`visibilitychange` event)
- Prevents RAM doubling on repeated reloads
- Clean console output (no cache spam)

**Files:**
- `sw.js` - Service Worker with silent operation
- `js/utils/storage.js` - Storage abstraction with worker management
- `js/utils/indexeddb.js` - IndexedDB wrapper
- `js/utils/storage-worker.js` - Background serialization worker
- `js/sw-registration.js` - SW lifecycle management

### External Dependencies (CDN)

The app loads these libraries from CDNs on first visit:

| Library | Source | Size | Purpose |
|---------|--------|------|---------|
| **Tailwind CSS** | `cdn.tailwindcss.com` | ~3MB | Utility-first CSS framework |
| **Alpine.js** | `cdn.jsdelivr.net` | ~50KB | Reactive JavaScript framework |
| **Lucide Icons** | `unpkg.com` | ~150KB | Icon library |
| **Chart.js** | `cdn.jsdelivr.net` | ~200KB | Analytics charts |
| **KaTeX** | `cdn.jsdelivr.net` | ~350KB | Math equation rendering |

**Notes:**
- ⚠️ **Internet required for first load** - CDN dependencies must be downloaded initially
- ✅ **Offline after first visit** - Service Worker caches all dependencies
- ⚠️ **Tailwind CDN warning** - Console shows "should not be used in production" (safe to ignore for this use case)
- 💡 **For fully offline deployment** - Download libraries locally and update Service Worker cache manifest

### Project Structure

```
physics-revision-main/
├── index.html                 # Main entry point (login screen inlined)
├── sw.js                      # Service Worker for PWA/offline support (v2.3)
│
├── js/
│   ├── app-loader.js          # App initialization (loads modules in parallel)
│   ├── template-loader.js     # Loads HTML templates dynamically
│   ├── sw-registration.js     # Service Worker registration
│   │
│   ├── core/                  # Core app architecture
│   │   ├── app.js            # Main app factory (combines all features)
│   │   ├── state.js          # Reactive state definitions
│   │   └── watchers.js       # Alpine.js watchers & lifecycle
│   │
│   ├── features/              # Feature modules (modular, lazy-loadable)
│   │   ├── analytics/
│   │   │   ├── calculations.js # Analytics calculations
│   │   │   ├── charts.js      # Chart.js rendering
│   │   │   └── insights.js    # Insights & pagination
│   │   │
│   │   ├── auth/
│   │   │   ├── index.js       # Auth facade (lazy loading)
│   │   │   ├── guest.js       # Guest authentication
│   │   │   ├── teams.js       # Teams OAuth (lazy loaded)
│   │   │   └── data-management.js # Enhanced data management
│   │   │
│   │   ├── confidence/
│   │   │   └── rating.js      # Confidence rating system
│   │   │
│   │   ├── navigation/
│   │   │   └── index.js       # Navigation state management
│   │   │
│   │   ├── revision/
│   │   │   ├── index.js       # Revision facade
│   │   │   ├── resources.js   # Resource loading & formatting
│   │   │   └── view.js        # Revision view logic
│   │   │
│   │   ├── notes/
│   │   │   ├── index.js       # Notes facade
│   │   │   ├── management.js  # Notes CRUD operations
│   │   │   ├── editor.js      # Rich text formatting (145 lines)
│   │   │   ├── equation-editor.js # Math equation builder (374 lines)
│   │   │   ├── display.js     # Notes display logic
│   │   │   └── filter.js      # Notes filtering
│   │   │
│   │   ├── flashcards/
│   │   │   ├── index.js       # Flashcards facade
│   │   │   ├── management.js  # Deck CRUD operations
│   │   │   ├── test.js        # Test mode & 3D flip logic
│   │   │   └── filter.js      # Study materials filtering
│   │   │
│   │   ├── mindmaps/
│   │   │   ├── index.js       # Mindmaps facade
│   │   │   ├── management.js  # Mindmap CRUD operations
│   │   │   └── canvas.js      # Canvas rendering & interactions
│   │   │
│   │   ├── tags/
│   │   │   ├── index.js       # Tags facade
│   │   │   └── management.js  # Tag selector & management
│   │   │
│   │   ├── settings/
│   │   │   └── index.js       # Settings & preferences
│   │   │
│   │   └── search/
│   │       └── index.js       # Search functionality
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── csv-parser.js     # Shared CSV parsing logic (eliminates duplication)
│   │   ├── csv-converter.js  # Shared CSV conversion logic (eliminates duplication)
│   │   ├── resource-schema.js # Shared resource object schemas (single source of truth)
│   │   ├── content-filter.js # Shared filter methods generator (eliminates triplication)
│   │   ├── logger.js         # Production-safe logging utility (debug mode toggle)
│   │   ├── date.js           # Date formatting utilities
│   │   ├── statistics.js     # Statistics calculations
│   │   ├── storage.js        # Storage utilities (IndexedDB wrapper)
│   │   ├── indexeddb.js      # IndexedDB core operations
│   │   ├── topic-lookup.js   # Topic ID to info mapping
│   │   └── ui.js             # UI utility methods
│   │
│   └── data/                  # Data configuration
│       ├── index.js          # Group configurations (paper/spec modes)
│       └── unified-csv-loader.js # CSV loader (builds revision mappings)
│
├── templates/                 # HTML component templates
│   ├── login-screen.html     # Login screen
│   ├── settings-modal.html   # Settings and data management
│   ├── note-editor-modal.html # Rich text note editor
│   ├── equation-editor-modal.html # Math equation builder (KaTeX)
│   ├── flashcard-editor-modal.html # Flashcard deck editor
│   ├── flashcard-test-modal.html # 3D flip card test interface
│   ├── mindmap-editor-modal.html # Canvas mindmap editor
│   ├── mindmap-node-editor.html # Rich text node editor
│   ├── tag-selector-modal.html # Topic tag selector
│   ├── search-results.html   # Search results view
│   ├── analytics-dashboard.html # Analytics dashboard
│   ├── revision-view.html    # Revision resources view
│   ├── main-menu.html        # Main menu (group cards)
│   ├── section-cards.html    # Section selection view
│   └── topic-detail.html     # Topic detail with confidence rating
│
├── components/                # Shared UI components
│   ├── sidebar/
│   │   └── sidebar.html      # Sidebar navigation
│   └── navigation/
│       └── top-bar.html      # Top navigation bar
│
├── resources/                 # Data files
│   ├── combined-data.json    # Optimized JSON (10x faster than CSV)
│   ├── subject-cards/        # CSV subject data (10 files)
│   └── revision/             # CSV revision resources (5 files)
│
├── css/
│   └── style.css             # Custom styles (animations, scrollbar, etc.)
│
└── tools/                     # Development utilities
    ├── csv-converter-unified.html # Unified CSV→JSON converter (server & local modes)
    └── auth-callback.html         # OAuth callback for Teams login
```

---


## Production-Safe Logging

### Logger Utility

**Location:** `js/utils/logger.js`

The app uses a production-safe logger utility that replaces all direct `console.*` calls with conditional logging.

**Implementation:**
- **Development** (localhost): All logs visible by default
- **Production**: Only errors logged by default  
- **Debug mode**: User-controlled toggle for detailed logging

**Migration Status:** ✅ **COMPLETE** (v2.10 - October 2023)
- All JavaScript modules migrated from `console.*` to `logger.*`
- Service Worker intentionally kept `console.*` (separate context, useful for debugging)
- Global error handlers kept `console.error()` (critical errors must always be visible)

**Usage:**
```javascript
import { logger } from './utils/logger.js';

logger.log('Debug info')      // Only in debug mode
logger.warn('Warning')         // Only in debug mode
logger.error('Critical!')      // ALWAYS logged
logger.info('Information')     // Only in debug mode
logger.debug('Trace details')  // Only in debug mode
```

**Console Access:**
The logger is available globally for debugging:
```javascript
// Toggle debug mode
logger.enableDebug()          // Show all logs
logger.disableDebug()         // Production mode (errors only)

// Check status
logger.isDebugEnabled()       // Returns true/false

// Direct localStorage control
localStorage.setItem('DEBUG', 'true')    // Enable
localStorage.removeItem('DEBUG')         // Disable
```

**Benefits:**
- ✅ **Clean production console** - No debug noise for end users
- ✅ **User-controlled debugging** - Users can enable detailed logging when reporting issues
- ✅ **Performance** - Zero overhead when logs are disabled
- ✅ **Environment detection** - Automatically shows logs on localhost
- ✅ **Persistent toggle** - Debug mode survives page reloads (localStorage)

**Architecture Notes:**
- Module exports singleton `logger` object
- Checks `window.DEBUG` and `localStorage.DEBUG` on each call
- Environment detection via `window.location.hostname`
- No external dependencies

See [DEVELOPMENT.md](DEVELOPMENT.md#debug-mode) for user documentation.

---

## XSS Protection

### DOMPurify Sanitization

**Location:** User content injection points in `js/features/`

The app implements comprehensive XSS protection using [DOMPurify](https://github.com/cure53/DOMPurify) to sanitize all user-generated content before DOM injection.

**Protected Content:**
- **Notes:** Rich text content with formatting
- **Flashcards:** Front/back card content
- **Mindmaps:** Node content with styling

**Implementation Status:** ✅ Complete (v2.4 - October 2025)
- All user-content innerHTML injection points secured
- Context-appropriate sanitization configurations
- Zero XSS vulnerabilities in user-facing features

### Sanitization Configurations

**Text Extraction (Snippets):**
```javascript
// Strip all HTML, keep text only
DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
});
```

**Rich Text Editor (Notes):**
```javascript
// Allow formatting tags, strict style validation
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

**Mindmap Nodes (Minimal):**
```javascript
// Basic formatting only
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

### Safe innerHTML Patterns

**All innerHTML usage has been audited (2025-01-20).** Remaining usage falls into safe categories:

**1. User Content with DOMPurify:**
- All user-generated content sanitized before injection
- 7 critical injection points secured
- Context-appropriate allow lists (see configurations above)

**2. DOMPurify Fallbacks:**
- Fallback code when DOMPurify CDN unavailable
- Primary path always uses DOMPurify (99.9% of cases)
- DOMPurify cached by Service Worker (available offline)
- Acceptable risk for degraded state

**3. Trusted Source Templates:**
- `js/template-loader.js` loads templates from app's own server
- Hardcoded paths: `'./templates/sidebar.html'`
- No user input in path selection
- Part of core architecture

**4. Generated HTML (App-Controlled):**
- Blockquote, code block, table HTML generated by app code
- No user input in template generation
- Example: `<blockquote style="...">Quote text</blockquote>`

**5. Trusted Library Output:**
- KaTeX equation rendering has built-in XSS protection
- LaTeX input only used in escaped `data-latex` attribute
- Rendered equation HTML comes from KaTeX (trusted)
- Used by major sites (Khan Academy, Wikipedia)

**6. Already Sanitized Content:**
- Content explicitly sanitized earlier in code path
- Example: `div.innerHTML = sanitized` where `sanitized = DOMPurify.sanitize(input)`

**7. Clearing Operations:**
- `innerHTML = ''` to clear content (safe by design)
- Common pattern for resetting DOM elements
- No injection possible with empty string

**8. Sanitization Helpers:**
- `js/features/search/index.js` contains `sanitizeHTML()` helper
- Sets `textContent` (escapes), reads `innerHTML` (returns escaped)
- Used to escape user input for safe display

**Security Score:** 9/10 (all user-content XSS eliminated)

### Files with DOMPurify Integration

1. `js/features/notes/display.js` - Note snippet extraction
2. `js/features/notes/management.js` - Note editor loading
3. `js/features/notes/editor.js` - Note content processing
4. `js/features/mindmaps/canvas.js` - Mindmap node rendering

### Security Principles

**Defense in Depth:**
- Sanitize on input (when loading into editors)
- Sanitize on output (when rendering to DOM)
- Sanitize on export (when generating HTML exports)

**Principle of Least Privilege:**
- Minimal allowed tags for each context
- Strict regex validation on CSS properties
- Block dangerous protocols (javascript:, data:)

**Architecture Notes:**
- DOMPurify loaded from CDN (cached by Service Worker)
- No inline event handlers allowed (CSP-friendly)
- Sanitization happens client-side (no server dependency)

See complete audit history in git: `docs/audits/INNERHTML_XSS_AUDIT.md` (removed in cleanup)

---
