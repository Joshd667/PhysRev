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
- **What's Stored**: Notes, flashcards, mindmaps, confidence levels, analytics history
- **Features**:
  - Automatic migration from localStorage on first load
  - 30-day analytics cleanup to prevent quota issues
  - Asynchronous operations (non-blocking)

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

