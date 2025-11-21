# Physics Knowledge Audit Tool

A Progressive Web App (PWA) for tracking and analyzing physics knowledge confidence across A-Level specification topics.

## 📋 Overview

The Physics Knowledge Audit Tool helps students self-assess their confidence levels across physics topics, view analytics on their progress, and access curated revision resources. Built with Alpine.js and optimized for fast loading, it works offline and stores data locally.

---

## 🚀 Features

- **Self-Assessment System** - Rate confidence (1-5 scale) on 100+ physics topics
- **Analytics Dashboard** - Visual insights into learning progress with charts and metrics
- **Revision Resources** - Curated videos, notes, simulations, and practice questions
- **Study Materials System** - Organize your learning with notes, flashcards, and mindmaps
  - **Topic Tagging System** - Tag materials with physics topics for easy organization and filtering
    - Auto-tags current topics when creating materials
    - Search and browse all topics by section
    - Add/remove tags with visual chips showing topic ID and title
    - Tags stored as topic IDs for efficient filtering
  - **Rich Note Editor** - Create formatted notes with bold, italic, colors, lists, and more
    - **Equation Editor** - User-friendly math formula builder for A-Level students
      - No LaTeX knowledge required - visual buttons for common functions
      - Smart auto-conversion: `/` for fractions, `*` for multiply, `^` for powers
      - Built-in templates: trig functions, logarithms, fractions, powers, standard form
      - Live KaTeX preview with graceful error handling
      - Double-click to edit inserted equations
    - **Card & List Views** - Toggle between compact card view and detailed list view
    - **Sorting Options** - Sort by date updated or name
    - **Quick Actions** - Edit, export as HTML, pin, and delete from card/list view
    - **Note Preview** - Click to expand and preview full note content
    - **HTML Export** - Export notes as standalone HTML pages for printing
  - **Flashcard Decks** - Build named decks with multiple question/answer cards
    - **Text Preservation** - Validation errors preserve your entered text
    - **Card & List Views** - Toggle between compact card view and detailed list view
    - **Sorting Options** - Sort by date updated, name, card count, test tries, or test performance
    - **Pin Decks** - Keep important decks at the top in a dedicated pinned section
    - **Deck Statistics** - View card counts, test attempts, and last test score
    - **Play Deck Button** - Quick-access testing from card view
    - **Test Set Builder** - Create custom test sets by combining cards from multiple decks
      - Advanced search and filtering by topic tags
      - Add individual cards or entire decks
      - Save and reuse test sets
      - Track test performance history
    - **Quick Play** - Instant 10-card random test from all decks
  - **Interactive Mindmaps** - Visual knowledge organization with drag-and-drop canvas
    - Rich text editing with inline toolbar (bold, italic, underline, strikethrough, colors, alignment, lists)
    - Multiple shape types (rectangle, rounded rectangle, circle, diamond)
    - Font size control and text/highlight color pickers
    - Insert KaTeX equations inline with text
    - Visual connections with customizable line styles
    - Pan, zoom, and organize freely on infinite canvas
    - **Card & List Views** - Toggle between compact card view and detailed list view
    - **Sorting Options** - Sort by date updated, name, or node count
    - **Quick Actions** - Edit, export as SVG, pin, and delete from card/list view
    - Export as SVG for sharing and printing
  - **Smart Filtering** - Toggle between viewing all materials, notes, flashcards, or mindmaps
  - **3D Flip Cards** - Test yourself with interactive card flipping
  - **Shuffle Mode** - Randomize flashcard order for varied practice
  - **Custom Modal System** - Beautiful in-app dialogs replace browser alerts
    - Consistent design across all confirmation dialogs
    - Keyboard shortcuts (Enter to confirm, Escape to cancel)
    - Proper z-index layering above all content
- **Settings Panel** - Comprehensive app configuration and data management
  - Default view modes for notes, flashcards, and mindmaps
  - Theme preferences (light/dark mode)
  - Data import/export as JSON or CSV
  - About section with app information
- **Triple View Modes** - Browse by specification, Paper 1, Paper 2, or Paper 3
- **Advanced Search** - Powerful topic discovery with real-time fuzzy search
  - Filter by confidence level (1-5 ratings or unrated)
  - Filter by topic tags/sections for targeted browsing
  - Relevance scoring with instant results
- **Guest & Teams Login** - IndexedDB storage or Microsoft Teams integration
- **Progressive Web App** - Install on device, works offline
- **Dark Mode** - Automatic dark/light theme switching

---

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

## 🔄 Application Flow

### 1. Initialization (`app-loader.js`)

```
User loads index.html
    ↓
app-loader.js executes (parallel loading):
    ├─ Load HTML templates
    ├─ Load Alpine.js from CDN
    ├─ Load group configurations
    ├─ Load core/app.js (imports all features)
    └─ Load data (JSON first, CSV fallback)
         ├─ Build revision mappings from CSV data
         └─ Initialize global window objects
    ↓
Alpine.start() - App becomes interactive
    ↓
Auth module lazy loads (features/auth/index.js)
    ├─ Guest auth loaded immediately
    └─ Teams auth loaded on demand
```

### 2. Data Loading Strategy

**Optimized Path (Fast)**:
```
Fetch resources/combined-data.json
    ↓
Parse JSON (~100-200ms)
    ↓
Load revision mappings from JSON
    ↓
Build resource indexes
    ↓
App ready
```

**Fallback Path (Slow)**:
```
JSON not found
    ↓
Load 15 CSV files via fetch
    ↓
Parse each CSV (~2-3 seconds)
    ↓
Convert to app format & build revision mappings
    ↓
App ready
```

### 3. Component Lifecycle

1. **Login Screen** (inlined in index.html for fast first paint)
2. **Main Menu** → Browse by Paper or Specification
3. **Section Selection** → Choose physics section
4. **Topic Detail** → Rate confidence, view resources
5. **Analytics Dashboard** → View progress charts

---

## 💾 Data Storage

### IndexedDB Storage Architecture

The app uses **IndexedDB** for all client-side storage, providing much larger capacity (hundreds of MB) compared to the previous localStorage implementation (5-10MB limit). Each data type is stored independently as key-value pairs, allowing for granular saves (only changed data is written).

### Storage Keys

**Authentication & Preferences:**
| Key | Purpose | Size |
|-----|---------|------|
| `physicsAuditAuth` | Authentication state (user, method, expiry) | ~200B |
| `physicsAuditPreferences` | Theme, view mode, paper selection, indicator style | ~500B |

**User Data (Guest Users):**
| Key | Purpose | Size |
|-----|---------|------|
| `physics-user-notes` | All notes with formatting and tags | ~10-100KB |
| `physics-flashcard-decks` | Flashcard decks with cards | ~5-50KB |
| `physics-mindmaps` | Mindmap data with nodes and connections | ~5-50KB |
| `physics-confidence-levels` | Topic confidence ratings (1-5) | ~2-5KB |
| `physics-analytics-history` | Historical confidence changes | ~10-50KB |
| `flashcard-test-results` | Test scores with timestamps | ~1-5KB |

**User Data (Teams Users):**
| Key | Purpose | Size |
|-----|---------|------|
| `teams_{userId}_physics-user-notes` | User-specific notes | ~10-100KB |
| `teams_{userId}_physics-flashcard-decks` | User-specific flashcard decks | ~5-50KB |
| `teams_{userId}_physics-mindmaps` | User-specific mindmaps | ~5-50KB |
| `teams_{userId}_physics-confidence-levels` | User-specific confidence ratings | ~2-5KB |
| `teams_{userId}_physics-analytics-history` | User-specific analytics history | ~10-50KB |
| `flashcard-test-results` | Test results (not user-prefixed) | ~1-5KB |

**Benefits of IndexedDB Storage:**
- ✅ **Much larger capacity** - Hundreds of MB instead of 5-10MB localStorage limit
- ✅ **Faster saves** - Only changed data type saves (e.g., editing a note only writes notes)
- ✅ **Better performance** - Asynchronous operations don't block UI, structured queries with indexes
- ✅ **Transaction support** - Ensures data integrity during saves
- ✅ **Easier debugging** - Can inspect data in DevTools → Application → IndexedDB
- ✅ **Scalability** - Can handle large datasets without quota errors
- ✅ **Future-ready** - Enables selective sync, export features, and offline-first architecture

**Automatic Migration from localStorage:**
- All localStorage data automatically migrates to IndexedDB on first load
- Migration happens transparently in the background during app initialization
- Original localStorage data preserved until migration confirms success
- No data loss - seamless transition for existing users
- Migration status tracked to prevent re-running

**Database Structure:**
- **Database Name**: `PhysicsAuditDB`
- **Object Store**: `keyValueStore` (simple key-value design)
- **Index**: `timestamp` index for cleanup operations
- All data serialized to plain objects to avoid Alpine.js Proxy issues

### Data Structure

```javascript
{
  confidenceLevels: {
    "1a": 3,  // topicId: confidence (1-5)
    "1b": 5,
    // ...
  },
  analyticsHistory: [
    {
      topicId: "1a",
      oldLevel: 2,
      newLevel: 3,
      timestamp: "2025-01-15T10:30:00Z",
      date: "1/15/2025",
      studySession: "2025-01-15T10:30:00Z"
    }
    // ...
  ],
  userNotes: {
    "note_123": {
      id: "note_123",
      sectionId: "measurements_errors",
      title: "SI Units Summary",
      content: "<p><strong>Base units:</strong> m, kg, s...</p>",
      tags: ["1.1", "1.2"],  // Topic IDs for filtering/grouping
      createdAt: "2025-01-15T10:30:00Z",
      updatedAt: "2025-01-15T10:30:00Z"
    }
    // ...
  },
  flashcardDecks: {
    "deck_456": {
      id: "deck_456",
      sectionId: "measurements_errors",
      name: "Newton's Laws",
      cards: [
        { front: "What is Newton's 1st law?", back: "Object in motion..." },
        { front: "What is Newton's 2nd law?", back: "F = ma" }
      ],
      tags: ["3.1", "3.2"],  // Topic IDs for filtering/grouping
      createdAt: "2025-01-15T10:30:00Z",
      updatedAt: "2025-01-15T10:30:00Z"
    }
    // ...
  },
  mindmaps: {
    "mindmap_789": {
      id: "mindmap_789",
      sectionId: "measurements_errors",
      title: "SI Units Overview",
      nodes: [
        { id: "node_1", x: 100, y: 100, width: 120, height: 60,
          text: "Base Units", content: "<p><strong>Base Units</strong></p>", color: "blue" }
      ],
      connections: [
        { from: "node_1", to: "node_2" }
      ],
      viewport: { x: 0, y: 0, scale: 1 },
      tags: ["1.1", "1.3"],  // Topic IDs for filtering/grouping
      createdAt: "2025-01-15T10:30:00Z",
      updatedAt: "2025-01-15T10:30:00Z"
    }
    // ...
  }
}
```

---

## 🎨 Views & Features

### Main Menu
- **Spec Mode**: Browse by physics topic groups (9.1 Measurement, 9.2 Particles, etc.)
- **Paper Mode**: Browse by exam paper (Paper 1, Paper 2)

### Topic Detail View
- Confidence rating (1-5 scale with color coding)
- Learning objectives
- Worked examples
- "Revise this topic" button → Revision view

### Revision View
- Section notes (HTML formatted)
- Key formulas
- Common mistakes
- Curated resources:
  - 🎥 Videos (YouTube links)
  - 📄 Notes (PDFs)
  - ⚡ Simulations (PhET, etc.)
  - ❓ Practice questions

### Analytics Dashboard
- **Overview Stats**: Progress %, average confidence, weak areas
- **Charts**:
  - Confidence distribution (bar chart)
  - Subject progress (horizontal bars)
  - Paper readiness (doughnut charts)
- **Insights**:
  - Critical topics (confidence ≤ 2)
  - Strong topics (confidence ≥ 4)
- **Advanced Analytics**:
  - Study velocity (improvements per session)
  - Study patterns (streaks, most active day)
  - Mastery progress (topic distribution by level)

### Settings Panel
- **Tabbed Interface**: Side navigation with 6 organized tabs
  - **Account Tab**: User information, authentication status, logout
  - **Data Tab**:
    - Quick access to Analytics Dashboard
    - Export data as CSV spreadsheet
    - Backup data (JSON format)
    - Import backup (guest mode only)
    - Clear all data with confirmation
  - **Preferences Tab**:
    - Default view mode (Spec/Paper)
    - Default paper selection (Paper 1/2)
    - Revision area indicator style (Color Bar/Outline/None)
  - **About Tab**: App version, build type, and storage info
  - **Admin Tab**: Administrative tools and optimization utilities
    - CSV to JSON Converter - Link to unified converter tool
    - Performance optimization information and guidance
  - **Updates Tab**: Manual app update management
    - Check for updates button
    - Current version display
    - Update notification with backup option
    - Manual update installation control
- **Update Badge Notification**: Red pulsing badge on settings icon when update available
- **Fixed Height Modal**: Consistent 85vh height with scrollable content areas
- **Enhanced Design**: Icon backgrounds, better spacing, full dark mode support

### Study Materials (Notes & Flashcards)

#### Note Editor
- **Rich Text Formatting**:
  - Text styles: bold, italic, underline, strikethrough
  - Headings (H1-H4) and paragraph formats
  - Font size adjustment
  - Text and highlight colors
  - Text alignment (left, center, right, justify)
- **Advanced Features**:
  - Bullet and numbered lists
  - Indentation controls
  - Insert links, horizontal rules, blockquotes, code blocks
  - Undo/redo functionality
  - Clear formatting tool
- **Equation Editor** (A-Level Student Friendly):
  - **No LaTeX Knowledge Required** - Visual button-based interface
  - **Smart Auto-Conversion**:
    - Type `/` → automatically converts to fraction format
    - Type `*` → converts to multiplication symbol (×)
    - Type `^23` → wraps multi-digit exponents in braces: `^{23}`
  - **Common Functions** (Large Buttons):
    - Fraction (a/b), Multiply (×), Power (x^n), Squared (x²)
    - Square Root (√x), Standard Form (×10^n)
  - **Trigonometry** (sin, cos, tan, sin⁻¹, cos⁻¹, tan⁻¹)
  - **Logs & Exponentials** (log, ln, e^x, e constant)
  - **Greek Letters & Symbols** (α, β, γ, θ, λ, π, ρ, σ, ω, Δ, Ω, μ, φ, ε)
  - **Additional Features**:
    - Subscripts (x_n), Vectors (→v)
    - Live KaTeX preview with graceful error handling
    - Double-click any equation to edit it
    - Equations rendered inline with subtle purple background
- **Professional Interface**: Word-processor-style editor with multi-row toolbar
- **Dark Mode Support**: Full styling for both light and dark themes (including equation editor)

#### Notes Library
- **Dual View Toggle**: Switch between list view and the new card grid with a compact pill control in the toolbar; preference persists during the session.
- **Card Grid Layout**: Responsive cards surface title, timestamps, tags, and a four-line content snippet, with contextual actions (edit/export/delete) mirrored from the list view.
- **Preview Panel**: Selecting a card opens a full-width preview above the grid with rendered math, tag chips, and quick actions (edit, export, delete, close) so you can scan content without leaving the page.
- **Instant Updates**: Previews, tag chips, and card stats refresh the moment notes are edited or removed; deleting the active note automatically clears the preview state to avoid stale content.

#### Flashcard Decks
- **Deck Creation**:
  - Name your deck (e.g., "Newton's Laws", "Circuit Analysis")
  - Add multiple cards before saving
  - Each card has a front (question/term) and back (answer/definition)
  - Live preview of all cards in deck
  - Remove individual cards before saving
- **Deck Management**:
  - Edit existing decks (modify name, add/remove cards)
  - Delete entire decks
  - View modes:
    - **List View**: Simple text-based list (classic view)
    - **Card View**: Visual grid with topic tags and statistics (default)
  - Toggle between views using buttons in top-right corner
  - Compact slider menu reveals left-anchored sort options (date, cards, tries, percentage) without shifting the layout
  - Setting to change default view preference (Settings → Preferences)
- **Card View Features**:
  - **Visual Grid Layout**: Responsive cards (1 column mobile, 2 tablet, 3 desktop)
  - **Pin Decks**: Pin important decks to top with yellow outline
  - **Statistics Display**:
    - Card count with layers icon
    - Number of tests taken with bar-chart icon
    - Most recent score percentage with color coding:
      - Green (≥80%), Yellow (≥60%), Red (<60%)
  - **Topic Tags**: Shows first 3 tags with overflow counter
  - **Date Display**: Created/updated date above action buttons
  - **Quick Actions**: Play, edit, and delete buttons at card bottom
  - **Live Refresh**: Pin state and deck statistics update instantly after edits or test runs—no manual reload needed
- **Test Mode** (Self-Assessment):
  - 3D flip animation - click card to reveal answer
  - Icon-only navigation:
    - Red X button (left) - Mark incorrect and move forward
    - Green checkmark button (right) - Mark correct and move forward
  - Dot indicators show progress and color-code answers:
    - Purple dot = current card
    - Green dot = marked correct
    - Red dot = marked incorrect
    - Gray dot = not yet answered
  - Score counter shows correct/incorrect totals
  - Shuffle button - randomize card order
  - Dynamic title shows deck name
  - Smooth card transitions (300ms flip animation)
  - Results screen after completion:
    - Percentage score and breakdown
    - Review correct answers (side-by-side view)
    - Review incorrect answers (side-by-side view)
    - Results saved with timestamp for analytics
  - Test data stored in localStorage for future analytics features

#### Test Area (Custom Test Sets)
- **Test Set Builder**:
  - Create custom test sets by combining cards from multiple decks
  - Select specific cards you want to test (not entire decks)
  - Name your test set (e.g., "Mock Exam", "Week 3 Review")
  - Drag & drop card selection interface:
    - Left panel: All available flashcard decks
    - Right panel: Selected cards for test set
    - Visual count of cards in set
  - Save test sets for repeated use
- **Test Set Management**:
  - **Card View Layout**: Grid display (1/2/3 columns responsive)
  - **Pin Test Sets**: Pin frequently used sets to top with yellow outline
  - **Statistics Display**:
    - Total card count
    - Number of times tested
    - Most recent score with color coding (green/yellow/red)
  - **Deck Preview**: Shows source decks with overflow counter
  - Compact slider menu beside the view toggle opens leftward to sort sets by date, card count, attempts, or latest score without jostling the grid
  - **Quick Actions**: Start test, edit, delete buttons
  - **Advanced Search**: Filter test sets by topic tags
  - **Live Refresh**: Pin status and aggregated stats recalculate as soon as results are saved
- **Test Execution**:
  - Same 3D flip card interface as individual deck testing
  - Self-assessment workflow (mark correct/incorrect)
  - Results saved to test set history
  - Track performance over time for each test set

#### Mindmap Editor
- **Canvas-Based Editing**:
  - Double-click blank area to create node (opens rich text editor)
  - Double-click node to edit existing content
  - Drag nodes to reposition on canvas
  - Click background and drag to pan canvas (no tool required)
  - Ctrl/Cmd+click to create connections between nodes
  - Visual feedback: blue border on connection start, preview line, green border on target
  - Multiple shape types: rectangle, rounded rectangle, circle, diamond
- **Rich Text Formatting** (Inline Toolbar):
  - **Text Styles**: bold, italic, underline, strikethrough
  - **Font Control**: adjustable font size (12px-32px)
  - **Color Pickers**:
    - Text color selection with 8 preset colors
    - Highlight/background color with 8 preset colors
    - Smart auto-close: pickers close when clicking toolbar buttons or text area
    - Toggle behavior: opening one picker closes the other
  - **Alignment**: left, center, right, justify
  - **Lists**: bullet lists and numbered lists
  - **Equation Editor**: Insert KaTeX math formulas inline
  - Toolbar appears inline when shape is being edited
  - All formatting preserved and rendered on canvas
- **Shape Styling**:
  - Background color customization (blue, green, yellow, red, purple, gray)
  - Border width control (1-8px range slider)
  - Border color options
  - Shape-specific styling preserved per node
- **Connection Management**:
  - Line style editing (solid, dashed, dotted)
  - Connection color customization
  - Visual preview during creation
  - Click connections to select and style them
- **Navigation & View Control**:
  - **Click and drag background** to pan canvas (smooth 60fps with CSS transforms)
  - Scroll to zoom in/out (hardware-accelerated)
  - Center button to recenter viewport
  - Reset button to restore default view
  - Node and connection counters in footer
- **Export & Management**:
  - Export mindmap as SVG (vector format for sharing/printing)
  - Edit mindmap title and tags
  - Delete individual nodes or entire mindmap
  - Auto-save all changes to localStorage
- **Performance Optimizations**:
  - **Panning**: CSS transforms instead of DOM re-rendering (0 CPU overhead)
  - **Zooming**: Hardware-accelerated CSS transforms (instant response)
  - **Event listeners**: Automatic cleanup prevents memory leaks
  - **Undo stack**: Limited to 20 steps to prevent memory growth
  - **requestAnimationFrame**: Smooth 60fps panning with minimal CPU usage
  - **Result**: No CPU fan spin-up, smooth on older machines, minimal memory footprint

#### Mindmaps Library
- **Card Grid Layout**: Responsive cards displaying mindmap title, timestamps, node/connection counts, and topic tags
- **Quick Actions**: Each card has edit, export (SVG), and delete buttons
- **Statistics Display**:
  - Node count with shape icon
  - Connection count with network icon
  - Created and last updated timestamps
- **Topic Tags**: Shows first 3 tags with overflow counter for easy browsing
- **Empty State**: Helpful prompt to create first mindmap when library is empty
- **Live Updates**: Card grid refreshes immediately when mindmaps are created, edited, or deleted

#### Topic Tagging
- **Automatic Tagging**:
  - Materials auto-tagged with current topics when created from revision view
  - Tags all visible topics in the section
- **Tag Selector Modal**:
  - Search all topics by ID, title, or section
  - Topics grouped by section for easy browsing
  - Visual toggle: checked topics shown with checkmark
  - Click to add/remove tags instantly
- **Tag Display**:
  - Tags shown as chips with topic ID and title (e.g., "1.1 Physical Quantities")
  - Quick remove with X button on each tag
  - Located at bottom of all editors (notes, flashcards, mindmaps)
- **Data Structure**:
  - Tags stored as topic ID arrays (e.g., `["1.1", "2.3"]`)
  - Resolved to human-friendly names via topic lookup map
  - Efficient filtering and grouping for "ALL" views

#### Smart Filtering
- Filter view: All / Notes / Flashcards / Mindmaps
- Context-aware empty states based on active filter
- Seamless switching between material types

### Search
- **Real-time Search**:
  - Fuzzy search across topics, learning objectives, and examples
  - Search updates as you type with instant results
  - Relevance scoring with best matches shown first
  - Click any result to navigate directly to topic detail
- **Advanced Filters** (Toggle):
  - **Confidence Level Filtering**: Show only topics with specific confidence ratings (1-5)
    - Multi-select checkboxes for flexible filtering
    - Unrated topics can be shown/hidden independently
    - Filter persists during search session
  - **Topic Tag Filtering**: Filter by physics topics/sections
    - Same tag selector interface as used in study materials
    - Search and browse all topics by section
    - Multi-select tags for precise filtering
    - Visual chips show selected filters
  - Filters combine with search query for powerful topic discovery
- **User Interface**:
  - Compact "Advanced" button toggles filter panel
  - Slide-down animation reveals filters smoothly
  - Clear visual separation between search and filters
  - Empty state messages guide users when no results found
  - Result count shows number of matching topics

### App Updates (Manual Control)
- **No Auto-Updates**: App never reloads automatically, giving you full control
- **Update Notification**: Red pulsing badge appears on settings icon when update available
- **Manual Update Flow**:
  1. Badge appears on settings icon in sidebar
  2. Open Settings → Updates tab
  3. Click "Check for Updates" to manually check (or see auto-detected update)
  4. Click "Install Update" when ready
  5. Choose "Backup & Update" (recommended) or "Update Now"
  6. App reloads with new version
- **Version Display**: Current version shown in Updates tab
- **Backup Before Update**: Optional automatic backup before installing updates
- **Service Worker Integration**: Background installation, manual activation

---

## 🔧 Development

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (Python, Node.js, or similar) for development

### Quick Start

**Option 1: Python**
```bash
cd physics-revision-main
python -m http.server 8000
# Open http://localhost:8000
```

**Option 2: Node.js**
```bash
npm install -g http-server
cd physics-revision-main
http-server -p 8000
# Open http://localhost:8000
```

**Option 3: VS Code Live Server**
```
Install "Live Server" extension
Right-click index.html → "Open with Live Server"
```

### Testing

For testing procedures and checklists, see **[TESTING.md](docs/guides/TESTING.md)**.

### Optimizing Data Loading

For 10x faster loading, convert CSVs to JSON using the unified converter:

1. **Via Settings Admin Tab** (Recommended):
   - Open Settings → Admin tab
   - Click "CSV to JSON Converter" link
   - Choose Server Mode (if running on web server) or Local Mode (for offline)

2. **Direct Access**:
   - Open `tools/csv-converter-unified.html` in your browser
   - **Server Mode**: Fetches CSV files from your web server automatically
   - **Local Mode**: Drag & drop CSV files or use file picker

3. Click "Download combined-data.json"
4. Move file to `resources/combined-data.json`
5. Reload app - loads in ~200ms instead of ~2-3 seconds

**JSON v2.0 Format Benefits:**
- ✅ Includes groups configuration (no extra HTTP request for groups.csv)
- ✅ Single HTTP request for all data
- ✅ Pre-processed revision mappings
- ✅ 10x faster loading (sub-second vs 2-3 seconds)
- ✅ Graceful fallback to CSV for old JSON files

---

## 📊 Performance Optimizations

### Core Optimizations

| Optimization | Impact | Status |
|--------------|--------|--------|
| Login screen inlined | -1 HTTP request | ✅ Implemented |
| Auth module lazy loaded | -20KB initial load | ✅ Implemented |
| Teams auth lazy loaded | Loads only when needed | ✅ Implemented |
| Modular architecture | Smaller files, easier maintenance | ✅ v2.3 |
| Shared utilities | Eliminated ~1,325 lines of duplicated code | ✅ v2.8 |
| Alpine.js version pinned | Reliability | ✅ Implemented |
| Scripts deferred | Faster first paint | ✅ Implemented |
| Templates loaded in parallel | Faster load | ✅ Implemented |
| JSON v2.0 with groups | Eliminates groups.csv HTTP request | ✅ v2.8 |
| JSON instead of CSV | 10x faster data load | ✅ Optional |
| Service Worker caching | Offline support | ✅ Implemented |

### Advanced Performance Optimizations (2025)

**Problem:** Security fixes introduced performance regression (300ms → 600ms load time, 120MB → 220MB RAM)

**Solution:** Comprehensive optimization pass achieving 5-10% better performance than original:

| Optimization | Time Saved | Memory Saved | Status |
|--------------|------------|--------------|--------|
| **Lazy-load large modals** | 100-150ms | 193 KB | ✅ v3.0 |
| Settings modal (57 KB) | On first open | - | ✅ |
| Note editor (40 KB) | On first create | - | ✅ |
| Flashcard editor (32 KB) | On first create | - | ✅ |
| Mindmap editor (47 KB) | On first create | - | ✅ |
| Privacy notice (17 KB) | On first view only | - | ✅ |
| **Deferred search indexes** | 80-120ms | Built on demand | ✅ v3.0 |
| **Privacy notice caching** | 20-40ms | Memory cached | ✅ v3.0 |
| **Debounced icon refresh** | 40-60ms | Eliminates redundant DOM scans | ✅ v3.0 |
| **IndexedDB batching** | 25-50ms | Single transactions | ✅ v3.0 |
| **Total Improvements** | **315-500ms** | **~100 MB** | ✅ |

**Technical Details:**

1. **Template Lazy Loading**
   - Critical templates (15): Load immediately for fast first paint
   - Heavy modals (5): Load on first use (193 KB saved)
   - Reduces initial payload from 516 KB → 323 KB (37% smaller)

2. **Search Index Deferral**
   - Indexes built on first search, not during app init
   - Saves 80-120ms for users who don't search immediately
   - Includes performance logging for transparency

3. **Privacy Notice Optimization**
   - Status cached in memory after first check
   - Template lazy-loaded only if user hasn't seen it
   - Eliminates redundant IndexedDB reads

4. **Icon Refresh Debouncing**
   - 50ms debounce prevents multiple DOM scans
   - Reduces redundant work by 60-80%
   - Particularly beneficial during rapid modal opening

5. **IndexedDB Transaction Batching**
   - Multiple reads combined into single transactions
   - `loadSavedData()`: 5 reads → 1 batched read
   - `loadPreferences()`: 2 reads → 1 batched read
   - Reduces transaction overhead by 70%

### Load Times

| Scenario | Before Security Fixes | After Security Fixes | After Optimizations | Improvement |
|----------|----------------------|---------------------|---------------------|-------------|
| **First load (JSON)** | ~300ms | ~600ms | **~285-330ms** | **5-10% faster than original** 🎉 |
| First load (CSV fallback) | ~2-3s | ~2.6-3.3s | ~2.3-3.1s | ~10% faster |
| Cached load | ~100ms | ~150ms | ~90-110ms | Baseline restored |
| Offline load | ~100ms | ~150ms | ~90-110ms | Baseline restored |

### Memory Usage

| Scenario | Before | After Security | After Optimizations | Change |
|----------|--------|----------------|---------------------|--------|
| **Initial load** | 120 MB | 220 MB | **120-150 MB** | **Back to baseline** ✅ |
| With search active | 150 MB | 250 MB | 150-180 MB | Restored |
| Heavy usage | 180 MB | 280 MB | 180-210 MB | Restored |

**Key Achievements:**
- ✅ Recovered all performance lost to security fixes
- ✅ Made app 5-10% faster than before security work
- ✅ Reduced memory to original baseline (~120-150 MB)
- ✅ Zero breaking changes - all functionality preserved
- ✅ Production-ready with both security and performance optimized

---

## 🧪 Testing

For comprehensive testing checklists and procedures, see **[TESTING.md](docs/guides/TESTING.md)**.

**Quick Test:**
```bash
npm install          # Install test dependencies
npm test             # Run automated test suite
npm run test:ui      # Interactive test UI
npm run test:coverage # Coverage report
```

**Automated Tests Include:**
- XSS protection and sanitization
- Input validation
- Data integrity checks

---

## 🐛 Troubleshooting

### App shows blank screen
- **Check browser console** for errors
- **Ensure running on localhost** (not `file://` protocol)
- **Check `resources/combined-data.json` exists** or CSV files are present

### "Failed to load resources" error
- CSV files missing from `resources/subject-cards/` or `resources/revision/`
- Run CSV converter to generate `combined-data.json`

### Service Worker not registering
- HTTPS required (or localhost)
- Check browser supports Service Workers
- Clear browser cache and try again

### Data not persisting
- Check IndexedDB is enabled in browser settings
- Check not in private/incognito mode (IndexedDB disabled in private browsing)
- Check storage quota not exceeded (should have 100s of MB available)
- Open DevTools → Application → IndexedDB to verify data is being stored

---

## 📦 Deployment

### GitHub Pages / Static Hosting

1. Ensure `combined-data.json` exists in `resources/`
2. Push to GitHub repository
3. Enable GitHub Pages (Settings → Pages → Deploy from branch)
4. Access at `https://username.github.io/repo-name/`

### Custom Domain

Update Service Worker cache paths if deploying to subdirectory:
```javascript
// In sw.js, update paths if needed
const urlsToCache = [
  '/your-subdomain/index.html',
  '/your-subdomain/css/style.css',
  // ...
];
```

### Production Checklist

- [ ] Generate `combined-data.json` for fast loading
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Verify Service Worker registers correctly
- [ ] Test offline functionality
- [ ] Check all external CDN links work
- [ ] Complete manual testing checklist (see [TESTING.md](docs/guides/TESTING.md))
- [ ] Test manual update flow (increment version, verify badge, test backup)

---

## 📝 Data Format

### CSV Files Required

**Subject Cards (10 files)**:
- measurements.csv
- particles.csv
- waves.csv
- mechanics.csv
- electricity.csv
- periodic-motion.csv
- thermal.csv
- fields.csv
- magnetic-fields.csv
- nuclear.csv

**Revision Resources (5 files)**:
- videos.csv
- notes.csv
- simulations.csv
- questions.csv
- revisionsections.csv

### CSV Schema

**Subject CSV Headers**:
```
section_name, section_title, section_paper, section_icon,
topic_id, topic_title, topic_prompt, learning_objectives, examples
```

**Resource CSV Headers** (videos/notes/simulations/questions):
```
section_id, title, description, url, [type-specific fields], difficulty
```

**Revision Sections CSV Headers**:
```
section_id, title, notes_html, key_formulas, common_mistakes
```

---

## 📚 Content Management Guide

### Overview: Excel → CSV → App Data Flow

The Physics Audit Tool uses a **data-driven architecture** where all content is stored in CSV files, which can be easily edited using Excel or Google Sheets. Here's how the system works:

```
Excel/Google Sheets (.xlsx, .xlsm)
    ↓ Export as CSV
CSV Files (resources/)
    ↓ Loaded by unified-csv-loader.js
JavaScript Objects (in memory)
    ↓ Displayed by Alpine.js templates
User Interface (browser)
```

**Key Benefits:**
- ✅ **No coding required** - Edit content in Excel/Sheets
- ✅ **Version control friendly** - CSV files track changes
- ✅ **Bulk operations** - Sort, filter, find/replace in Excel
- ✅ **Easy maintenance** - Non-developers can update content

---

### CSV File Structure

The app uses **16 CSV files** organized in the `resources/` directory:

#### 1. Subject Cards (10 files) - `resources/subject-cards/`

These define the physics topics that students can rate their confidence on.

**Files:**
- `measurements.csv` - 3.1 Measurements and errors
- `particles.csv` - 3.2 Particles & Radiation
- `waves.csv` - 3.3 Waves
- `mechanics.csv` - 3.4 Mechanics & Materials
- `electricity.csv` - 3.5 Electricity
- `periodic-motion.csv` - 3.6.1 Periodic Motion
- `thermal.csv` - 3.6.2 Thermal Physics
- `fields.csv` - 3.7a G and E Fields
- `magnetic-fields.csv` - 3.7b Magnetic Fields
- `nuclear.csv` - 3.8 Nuclear Physics

**CSV Structure:**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
3.1.1,3.1.1a,measurements_errors,3.1a Measurements and their errors,Paper 1,settings,SI Units and Measurements,Fundamental (base) units,Can you recall...,State the 7 fundamental SI units|Match each unit...,Mass (kg), Length (m)|Temperature (K)...
```

**Column Definitions:**

| Column | Purpose | Example | Notes |
|--------|---------|---------|-------|
| `section_id` | Revision section for color coding | `3.1.1`, `3.1.2` | Groups topics for revision and colors |
| `topic_id` | Unique identifier for the topic | `3.1.1a` | Must be unique across all files |
| `section_name` | Internal key for grouping topics | `measurements_errors` | Used in code, don't change existing values |
| `section_title` | Display name for the section | `3.1a Measurements and their errors` | Shown in UI |
| `section_paper` | Which exam paper | `Paper 1`, `Paper 2`, or `Paper 3` | Used for filtering |
| `section_icon` | Lucide icon name | `settings`, `atom`, `waves`, etc. | See [Lucide Icons](https://lucide.dev/) |
| `revision_section_title` | Display name for revision group | `SI Units and Measurements` | Shown when revising topics |
| `topic_title` | Short title for the topic | `Fundamental (base) units` | Shown on topic card |
| `topic_prompt` | Question to assess understanding | `Can you recall and state the 7 fundamental SI units...` | Helps students assess confidence |
| `learning_objectives` | Pipe-separated list of objectives | `State the 7 fundamental SI units\|Match each unit...` | Split by `\|` character |
| `examples` | Pipe-separated list of examples | `Mass (kg), Length (m)\|Temperature (K)...` | Split by `\|` character |

**Important Notes:**
- Use `|` (pipe) to separate multiple learning objectives or examples
- Each topic must have a unique `topic_id`
- `section_name` is a **key** - it must match entries in `groups.csv`
- Keep `section_name` consistent across files (e.g., all kinematics topics use `motion_kinematics`)

#### 2. Groups Configuration - `resources/groups.csv`

This file defines how sections are organized into groups in the main menu.

**CSV Structure:**
```csv
paper,order,type,group_title,icon,section_name
Paper 1,1,group,3.1 Measurements and their errors,settings,measurements_errors
Paper 1,1,group,3.1 Measurements and their errors,settings,number_work
Paper 1,2,group,3.2 Particles & Radiation,atom,atomic_structure
Paper 1,6,single,,,circular_motion
All Topics,1,group,3.1 Measurements and their errors,settings,measurements_errors
```

**Column Definitions:**

| Column | Purpose | Example | Notes |
|--------|---------|---------|-------|
| `paper` | Which view mode | `Paper 1`, `Paper 2`, `Paper 3`, or `All Topics` | Controls where group appears |
| `order` | Display order | `1`, `2`, `3`... | Groups are sorted by this number |
| `type` | Group type | `group` or `single` | `group` = collapsible section, `single` = standalone |
| `group_title` | Group display name | `3.1 Measurements and their errors` | Shown as card title in main menu |
| `icon` | Lucide icon name | `settings`, `atom`, `waves` | Shown on group card |
| `section_name` | Section key to include | `measurements_errors` | Must match `section_name` in subject CSVs |

**How Grouping Works:**
- Multiple rows with same `paper`, `order`, and `group_title` form one group
- `section_name` values are collected into an array for that group
- Example: "3.1 Measurements and their errors" contains `measurements_errors` AND `number_work`

**Single Sections:**
- Use `type = single` for sections that don't need grouping
- Leave `group_title` and `icon` blank
- Example: `circular_motion` appears standalone in Paper 1

#### 3. Revision Resources (5 files) - `resources/revision/`

These provide study materials for each topic.

##### `videos.csv`
```csv
section_id,title,description,url,duration,difficulty,provider
3.1.1,Introduction to SI Units,Overview of base units,https://youtube.com/...,10:30,Foundation,YouTube
```

##### `notes.csv`
```csv
section_id,title,description,url,type,pages,difficulty
3.1.1,SI Units Summary,Concise reference sheet,https://example.com/notes.pdf,PDF,2,Foundation
```

##### `simulations.csv`
```csv
section_id,title,description,url,provider,interactivity,difficulty
3.1.1,Unit Converter,Interactive unit conversion,https://phet.colorado.edu/...,PhET,High,Foundation
```

##### `questions.csv`
```csv
section_id,title,description,url,type,question_count,difficulty,has_answers
3.1.1,SI Units Practice,10 multiple choice questions,https://example.com/quiz.pdf,Multiple Choice,10,Foundation,TRUE
```

##### `revisionsections.csv`
```csv
section_id,title,notes_html,key_formulas,common_mistakes
3.1.1,SI Units and Measurements,<h2>Base Units</h2><p>There are 7...</p>,F = ma|E = mc²,Don't confuse mass and weight|Remember units
```

**Column Notes:**
- `section_id` links resources to topics (e.g., `3.1.1` links to topics `3.1.1a`, `3.1.1b`)
- `difficulty` can be: `Foundation`, `Intermediate`, or `Advanced`
- `has_answers` for questions: `TRUE` or `FALSE`
- `notes_html` supports full HTML with tags like `<h2>`, `<p>`, `<strong>`, `<ul>`, `<li>`
- Use `|` (pipe) to separate multiple formulas or mistakes

---

### Step-by-Step: Adding New Content

#### Adding a New Topic

1. **Choose the appropriate subject CSV file**
   - Open the file in Excel (e.g., `mechanics.csv` for dynamics topics)

2. **Add a new row with these columns:**
   - `section_id`: Revision section identifier (e.g., `3.4.1`) - groups topics for color coding
   - `topic_id`: Create unique ID (e.g., `3.4.1.9a` - follows spec numbering)
   - `section_name`: Use existing key (e.g., `mechanics_dynamics`) or create new one
   - `section_title`: Display name (e.g., `3.4.1 Forces and Motion`)
   - `section_paper`: `Paper 1` or `Paper 2`
   - `section_icon`: Icon name from [Lucide](https://lucide.dev/) (e.g., `target`)
   - `revision_section_title`: Display name for revision group (e.g., `Forces and Newton's Laws`)
   - `topic_title`: Short topic name (e.g., `Newton's Third Law`)
   - `topic_prompt`: Self-assessment question starting with "Can you..."
   - `learning_objectives`: Separate multiple items with `|`
   - `examples`: Separate multiple items with `|`

3. **Save as CSV**
   - File → Save As → CSV (Comma delimited) (*.csv)
   - **Important**: Use UTF-8 encoding if prompted

4. **If using a NEW section_name:**
   - Add it to `groups.csv` (see "Adding a New Group Section" below)

#### Adding a New Group Section

1. **Open `resources/groups.csv` in Excel**

2. **Decide where it should appear:**
   - Paper 1, Paper 2, or All Topics (or multiple)

3. **Add row(s) for each appearance:**
   ```csv
   Paper 1,7,group,3.9 New Topic Area,atom,new_section_name
   All Topics,11,group,3.9 New Topic Area,atom,new_section_name
   ```

4. **If the group contains multiple sections:**
   - Add one row per section with SAME `paper`, `order`, and `group_title`
   ```csv
   Paper 1,7,group,3.9 New Topic Area,atom,section_one
   Paper 1,7,group,3.9 New Topic Area,atom,section_two
   ```

5. **Save as CSV**

#### Adding Revision Resources

1. **Determine the section_id**
   - Look at `topic_id` values (e.g., `3.1.1a`, `3.1.1b`)
   - Remove letter suffix to get section_id (e.g., `3.1.1`)

2. **Open appropriate resource file:**
   - `videos.csv` for YouTube/video links
   - `notes.csv` for PDFs/documents
   - `simulations.csv` for interactive tools
   - `questions.csv` for practice problems
   - `revisionsections.csv` for summary content

3. **Add new row with all required columns**
   - Make sure `section_id` matches your topics
   - Use descriptive `title` and `description`
   - Test URLs work before adding

4. **Save as CSV**

#### Setting Up Paper 3 Content

The app has full Paper 3 support in the UI (button, navigation, filtering), but **Paper 3 data must be added manually** to CSV files.

**Current Status:**
- ✅ Paper 3 button exists in sidebar
- ✅ Paper 3 filtering logic implemented
- ❌ No Paper 3 content in CSV files (needs to be added)

**Quick Setup Guide:**

**Step 1: Add Paper 3 sections to groups.csv**

Open `resources/groups.csv` and add Paper 3 rows. Insert them after Paper 2 (currently line 32) and before "All Topics" section (currently line 33).

**Example Paper 3 structure:**
```csv
Paper 3,1,group,3.9 Astrophysics,star,stellar_classification
Paper 3,1,group,3.9 Astrophysics,star,cosmology_universe
Paper 3,2,group,3.10 Medical Physics,heart,medical_imaging
Paper 3,2,group,3.10 Medical Physics,heart,radiation_therapy
Paper 3,3,group,3.11 Engineering Physics,cpu,materials_engineering
Paper 3,3,group,3.11 Engineering Physics,cpu,rotational_dynamics
```

**Column meanings:**
- `paper`: Must be exactly `"Paper 3"`
- `order`: Group number (1, 2, 3...) determines display order
- `type`: Either `"group"` (has multiple sections) or `"single"` (standalone)
- `group_title`: Display name shown in sidebar (e.g., "3.9 Astrophysics")
- `icon`: Lucide icon name (browse at https://lucide.dev/)
  - Common choices: `star`, `heart`, `cpu`, `telescope`, `microscope`, `waves`, `disc`
- `section_name`: Internal key linking to topic data (e.g., `stellar_classification`)
  - **IMPORTANT**: Must match `section_name` in subject CSV files

**Step 2: Create topic data in subject CSV files**

**Option A: Create new CSV files** (recommended for Paper 3)

1. Create `resources/subject-cards/astrophysics.csv`
2. Create `resources/subject-cards/medical-physics.csv`
3. Create `resources/subject-cards/engineering-physics.csv`

**CSV Structure (same as existing files):**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
```

**Example row for Paper 3 Astrophysics:**
```csv
3.9.1.1,3.9.1.1a,stellar_classification,3.9.1 Stars,Paper 3,star,Stellar Classification,Hertzsprung-Russell diagrams,"Can you interpret an H-R diagram and identify the main sequence, giants, and white dwarfs?",Interpret H-R diagrams|Identify stellar classes|Understand luminosity vs temperature|Calculate absolute magnitude,Main sequence: hydrogen fusion|Giants: expanded outer layers|White dwarfs: collapsed cores|Supergiants: massive evolved stars
```

**Key points for Paper 3 topics:**
- `section_id`: Use 3.9.x for Astrophysics, 3.10.x for Medical, 3.11.x for Engineering
- `topic_id`: Must be globally unique (include letter suffix: a, b, c...)
- `section_name`: Must match `groups.csv` (e.g., `stellar_classification`)
- `section_paper`: Must be exactly `"Paper 3"`
- `section_icon`: Choose appropriate Lucide icon
- Use `|` (pipe) to separate multiple learning objectives and examples

**Option B: Add to existing CSV files** (if topics fit existing categories)

You can add Paper 3 topics to existing CSV files like `fields.csv` or `mechanics.csv` if they're extensions of Paper 1/2 content. Just set `section_paper` to `"Paper 3"`.

**Step 3: Register new CSV files in the loader**

If you created new CSV files (Option A), register them in the loader:

Edit `js/data/unified-csv-loader.js` around line 59:

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
    'astrophysics.csv',           // NEW - Paper 3
    'medical-physics.csv',         // NEW - Paper 3
    'engineering-physics.csv'      // NEW - Paper 3
];
```

**Step 4: Test your changes**

1. Hard refresh browser (Ctrl+Shift+R)
2. Click Paper 3 button in sidebar
3. Verify your groups and topics appear
4. Check console (F12) for any CSV parsing errors

**Paper 3 Template Files:**

**astrophysics.csv starter:**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
3.9.1.1,3.9.1.1a,stellar_classification,3.9.1 Stars,Paper 3,star,Stars,Stellar types,"Can you classify stars using the H-R diagram?",Understand H-R diagram|Classify stellar types|Calculate luminosity,Main sequence|Red giants|White dwarfs
3.9.2.1,3.9.2.1a,cosmology_universe,3.9.2 Cosmology,Paper 3,star,Cosmology,Big Bang theory,"Can you describe evidence for the Big Bang?",Explain cosmic microwave background|Calculate Hubble constant|Understand universe expansion,CMB radiation|Redshift|Hubble's law
```

**medical-physics.csv starter:**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
3.10.1.1,3.10.1.1a,medical_imaging,3.10.1 Medical Imaging,Paper 3,heart,Medical Imaging,X-ray imaging,"Can you explain how X-rays are used in medical imaging?",Understand X-ray production|Calculate attenuation|Explain contrast media,CT scans|Radiography|Image enhancement
3.10.2.1,3.10.2.1a,radiation_therapy,3.10.2 Radiation Therapy,Paper 3,heart,Radiation,Radiotherapy,"Can you explain the use of radiation in cancer treatment?",Calculate absorbed dose|Understand quality factor|Explain treatment planning,Linear accelerators|Gamma rays|Dose distribution
```

**Validation Checklist:**
- ✅ `section_name` in groups.csv matches subject CSV files
- ✅ `section_paper` is exactly `"Paper 3"` in all Paper 3 topics
- ✅ `topic_id` values are unique across ALL CSV files
- ✅ New CSV files are registered in `unified-csv-loader.js`
- ✅ Pipe separators (`|`) used for multi-value fields
- ✅ No trailing spaces in key fields
- ✅ UTF-8 encoding when saving CSV files

**Common Issues:**
- **Paper 3 button shows but no content**: Check groups.csv has Paper 3 rows
- **Topics don't appear**: Verify `section_name` matches between groups.csv and subject CSVs
- **CSV parsing error**: Check for missing commas, unmatched quotes, or incorrect encoding
- **Topics appear in wrong paper**: Verify `section_paper` column is exactly `"Paper 3"`

---

### Best Practices

#### Excel Tips

1. **Use Excel Tables** (Ctrl+T)
   - Makes it easier to add rows
   - Auto-extends formulas
   - Better visual organization

2. **Freeze Header Row** (View → Freeze Panes → Freeze Top Row)
   - Keep column names visible while scrolling

3. **Use Find & Replace** (Ctrl+H)
   - Bulk update section names
   - Fix formatting issues quickly

4. **Data Validation**
   - Create dropdown lists for `section_paper` (Paper 1, Paper 2, Paper 3)
   - Create dropdown for `difficulty` (Foundation, Intermediate, Advanced)
   - Prevents typos that break filtering

5. **Comments** (Right-click cell → Insert Comment)
   - Add notes about changes or reasoning
   - Track TODOs for incomplete content

#### CSV Export Checklist

Before exporting to CSV:
- ✅ **Check for commas** in text fields (Excel handles this with quotes)
- ✅ **Remove extra blank rows** at the end
- ✅ **Verify pipe separators** (`|`) are correct in multi-value fields
- ✅ **Test URLs** are complete and working
- ✅ **Check encoding** - Use UTF-8 to preserve special characters
- ✅ **No trailing spaces** in key fields like `section_name`

#### Content Quality Guidelines

**Topic Prompts:**
- Start with "Can you..." or "Do you understand..."
- Be specific about what knowledge is tested
- Include context where helpful
- Example: "Can you derive the equations of motion using calculus and apply them to solve kinematics problems?"

**Learning Objectives:**
- Use action verbs: State, Describe, Calculate, Derive, Apply, Explain
- One objective per pipe-separated item
- Progress from simple to complex
- Example: `State Newton's laws|Apply F=ma to solve problems|Derive equations for constant acceleration`

**Examples:**
- Give concrete, specific instances
- Use numbers and units where appropriate
- Show range of difficulty
- Example: `F = 50 N applied to 10 kg mass|Rocket propulsion in space|Car braking calculations`

#### Maintaining Consistency

**Section Names** (Internal Keys):
- Use lowercase
- Use underscores for spaces: `mechanics_dynamics`
- Be descriptive but concise
- **Don't change existing ones** - breaks links

**Section Titles** (Display Names):
- Use proper capitalization
- Include spec reference: `3.4.1 Kinematics`
- Be consistent with specification document

**Topic IDs:**
- Follow specification numbering: `3.4.1.2a`
- Add letters for sub-topics: `a`, `b`, `c`
- Must be globally unique

**Icons:**
- Use consistent icons for related content
- Common choices:
  - `settings` - measurement, tools
  - `atom` - particles, quantum
  - `waves` - oscillations, waves
  - `target` - mechanics, motion
  - `zap` - electricity, energy
  - `globe` - fields, forces
  - `shield` - nuclear, safety

---

### Testing Your Changes

After updating CSV files:

1. **Refresh the browser** (Ctrl+R or F5)
   - App loads CSVs on startup
   - Check console for errors

2. **Check the console** (F12)
   - Look for "✅ CSV data loaded successfully"
   - Check for "✅ Loaded groups from CSV"
   - Watch for parsing errors

3. **Test in the UI:**
   - Navigate to affected sections
   - Verify topics appear correctly
   - Check resource links work
   - Test in both Paper mode and Spec mode

4. **Common Issues:**
   - **Blank screen**: Check CSV syntax, missing files
   - **Missing sections**: Check `section_name` matches in subject CSVs and `groups.csv`
   - **Broken grouping**: Check `order`, `paper`, and `group_title` are consistent
   - **Resources not showing**: Verify `section_id` matches topic ID prefix

---

### Advanced: Optimizing Load Time

For production or frequent use, convert CSVs to optimized JSON v2.0:

1. **Open unified converter** (Settings → Admin → CSV to JSON Converter, or `tools/csv-converter-unified.html`)

2. **Choose mode**:
   - **Server Mode**: Automatically fetches all 16 CSV files from your web server
   - **Local Mode**: Drag & drop or select all 16 CSV files:
     - 10 subject cards
     - 5 revision resources
     - 1 groups.csv

3. **Click "Convert" and download**

4. **Save as `resources/combined-data.json`**

5. **Reload app** → 10x faster loading (200ms vs 2-3 seconds)

**JSON v2.0 Features:**
- ✅ Includes groups configuration (no groups.csv HTTP request)
- ✅ Pre-processed revision mappings
- ✅ Version tracking and metadata
- ✅ Graceful degradation for old JSON files

**Note:** JSON doesn't auto-update when CSVs change. Re-run converter after CSV edits.

---

### Understanding Revision Mappings

Revision mappings group individual topic cards into revision areas, loaded dynamically from the subject CSV files.

**How It Works:**
The system uses two columns in the subject CSV files (`section_id` and `revision_section_title`) to automatically build the mappings:

```csv
section_id,topic_id,revision_section_title,...
3.1.1,3.1.1a,SI Units and Measurements,...
3.1.1,3.1.1b,SI Units and Measurements,...
3.1.2,3.1.2a,Errors and Uncertainties,...
```

When the app loads:
1. `unified-csv-loader.js` reads all subject CSV files
2. Builds `revisionMapping` object: `{ "3.1.1": ["3.1.1a", "3.1.1b"], "3.1.2": [...] }`
3. Builds `revisionSectionTitles` object: `{ "3.1.1": "SI Units and Measurements", ... }`
4. Builds `topicToSectionMapping` for reverse lookups: `{ "3.1.1a": "3.1.1", ... }`
5. Makes them globally available via `window.revisionMapping`, etc.

**Color System:**
- Each `section_id` (e.g., `"3.1.1"`) gets a unique color via hash-based algorithm
- All topics with the same `section_id` share that color
- The color bar appears at the top of each topic card
- Helps visually identify related content

**Benefits of CSV-Based Mappings:**
- ✅ **No code changes needed** - Edit mappings in Excel/Google Sheets
- ✅ **Easier maintenance** - Spreadsheet-based workflow
- ✅ **Version control friendly** - CSV diffs are readable
- ✅ **Single source of truth** - No duplication between data files and code

---

### Troubleshooting CSV Issues

#### "Failed to load CSV" Error
- **Check file exists** in correct directory
- **Check filename** matches exactly (case-sensitive on some servers)
- **Check file encoding** - should be UTF-8
- **Check for BOM** (Byte Order Mark) - can cause parsing errors

#### Topics Not Appearing
- **Check `section_name`** matches exactly in subject CSV and `groups.csv`
- **Check `topic_id`** is unique
- **Check no missing required columns**

#### Resources Not Loading
- **Check `section_id`** matches topic ID prefix
  - Topics: `3.1.1a`, `3.1.1b` → Resources: `3.1.1`
- **Check URL** is complete including `https://`
- **Check for typos** in section_id

#### Groups Not Showing
- **Check `order` column** is a number
- **Check `paper` value** is exactly `Paper 1`, `Paper 2`, or `All Topics`
- **Check `type`** is exactly `group` or `single`

#### Parsing Errors
- **Check for unescaped commas** in text (Excel should handle with quotes)
- **Check for unescaped quotes** in text (Excel doubles them: `""`)
- **Check pipe separators** (`|`) are used correctly
- **Check no extra blank rows** at end of file

---

## 🤝 Contributing

This is a personal educational tool. To modify:

1. Edit CSV files for content changes
2. Edit templates in `templates/` for UI changes
3. Edit feature modules in `js/features/` for feature changes
4. Edit core logic in `js/core/` for app architecture changes
5. Run CSV converter after CSV updates
6. Test locally before deploying

### Architecture Notes (v2.3)

**Modular structure** - Code split into:
- `core/` - App initialization, state, watchers
- `features/` - Self-contained feature modules (auth, analytics, revision, etc.)
- `utils/` - Shared utilities (statistics, UI, storage, date)

**Benefits:**
- Easier to maintain (largest file is now ~280 lines vs 1081)
- Better organization
- Lazy loading support (Teams auth loads on demand)
- Independent testing of modules

---

## 📄 License

Personal educational project. Not licensed for redistribution.

---

## 🔗 Resources

- [Alpine.js Documentation](https://alpinejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

---

## 📜 Changelog

### v2.15 - Critical Performance Optimization & Mindmap Canvas Improvements (2025-11-13)

**⚡ Memory Optimization: 90% Reduction (1.2GB → 100-150MB)**

Implemented a fundamental architecture change to eliminate Alpine.js Proxy overhead on large static datasets:

**Problem Identified:**
- App was using 1.2GB of RAM on initial load
- Alpine.js was wrapping 70MB of specification data in Proxies
- Created ~10x memory overhead (70MB → 700MB+ in Proxy wrappers)
- Caused high CPU usage, slow performance, and crashes on older machines

**Solution Implemented:**
- Moved large read-only data **outside Alpine's reactive system**
- Stored in module-level variables (`js/core/app.js`)
- Accessed via getter methods that return non-reactive objects
- Alpine never wraps them in Proxies = raw JavaScript only

**Data Moved to Non-Reactive Storage:**
- `specificationData` - All physics topics, descriptions, icons (~50MB)
- `paperModeGroups` - Paper mode organization (~5MB)
- `specModeGroups` - Specification mode organization (~5MB)
- `topicLookup` - Topic ID mapping (~10MB)

**Performance Impact:**
- **Memory**: 100-150MB (was 1.2GB) - 90% reduction
- **Load time**: Faster due to less memory allocation
- **Navigation**: Smooth with no garbage collection pauses
- **Mobile/tablets**: Now usable instead of crashing
- **Long sessions**: No gradual slowdown
- **Battery life**: Improved due to less CPU overhead

**Technical Details:**
- No functional drawbacks - static data is never modified by users
- All user data remains reactive (notes, flashcards, confidence levels, etc.)
- App still works identically from user perspective
- See "Performance Architecture" section for implementation details

**🎨 Mindmap Canvas Performance Overhaul**

Completely rewrote canvas rendering and interaction system for optimal performance:

**Canvas Panning:**
- **Before**: 60-120 full DOM re-renders per second during pan → CPU fan spin-up
- **After**: CSS transforms with `requestAnimationFrame` → 0 CPU overhead
- Result: Buttery smooth 60fps panning with no performance impact

**Canvas Zooming:**
- **Before**: Full re-render of all shapes and connections on zoom
- **After**: Hardware-accelerated CSS `scale()` transforms
- Result: Instant zoom response with no CPU usage

**Event Listener Management:**
- **Before**: Listeners added but never removed → infinite accumulation → memory leak
- **After**: Automatic cleanup on canvas close → prevents memory growth
- Implemented: `cleanupCanvasListeners()` method with listener tracking

**Memory Limits:**
- Mindmap undo stack: Limited to 20 steps (was 50)
- Test results history: Limited to 50 entries (was unlimited)
- Analytics history: Limited to 100 changes (was 500)
- Prevents unbounded memory growth during long sessions

**Chart Cleanup:**
- Analytics charts now destroyed when leaving analytics view
- Prevents Chart.js instances from accumulating in memory
- Automatic cleanup via Alpine watcher

**UI Improvements:**
- **Background panning**: Click and drag background to pan (no tool required)
- **Movement threshold**: 3-pixel threshold distinguishes clicks from drags
- **Inline formatting**: Bold/italic buttons appear when shape selected
- **Line style editing**: Now works correctly (updates toolbar state)

**Files Modified:**
- `js/core/app.js` - Module-level static storage + getters
- `js/core/state.js` - Removed large data from reactive state
- `js/features/mindmaps/canvas.js` - CSS transforms, event cleanup, memory limits
- `js/features/flashcards/test.js` - Test results limit
- `js/features/confidence/rating.js` - Analytics history limit
- `js/core/watchers.js` - Chart cleanup watcher
- `templates/mindmap-editor-modal.html` - Inline formatting toolbar

### v2.14 - Notes Card View & Sliding Sort Controls (2025-10-26)

**🎛️ Sliding Sort Controls**
- Flashcard and test-set card grids now use a compact slider button that slides open to the left, exposing date, card count, attempt count, and latest-score sort modes without nudging adjacent UI.
- Menus respect keyboard escape, close on outside click, and re-run Lucide initialization when opened so icons stay crisp after transitions.
- Matching control appears in the Test Area, keeping deck and test-set management workflows aligned.

**🗒️ Note Library Card View**
- Added a responsive notes card grid with inline actions, tag chips, created/updated timestamps, and an "Open" call-to-action that drives a dedicated preview panel.
- Preview surface renders full rich text (including equations), lists active tags, and exposes edit/export/delete/close controls so you can scan content without leaving the page.
- Introduced `notesViewMode` and `notePreviewId` state with helpers (`setNotePreview`, `getNotePreview`, `getNoteSnippet`) plus deletion safeguards that automatically clear the preview when a note is removed.

**⚙️ Reactive Data Fixes**
- Deck and test-set stat helpers now return fresh objects, restoring Alpine reactivity so card metrics and pin badges update instantly after edits or test runs.
- Pinning/unpinning no longer requires a refresh—the grid reorders in place and keeps pinned content at the top.
- Consolidated Lucide redraws inside `$nextTick` watchers to prevent missing icons when menus animate in.

**Files Modified:**
- `templates/all-flashcards-view.html`
- `js/features/flashcards/display.js`
- `js/features/flashcards/test-sets.js`
- `js/features/flashcards/test.js`
- `templates/all-notes-view.html`
- `js/features/notes/display.js`
- `js/features/notes/management.js`
- `js/core/state.js`

### v2.14 - IndexedDB Migration (2025-11-19)

**🗄️ Major Storage Infrastructure Upgrade**

This update migrates the entire storage system from localStorage to IndexedDB, providing dramatically increased capacity and better performance.

**✨ IndexedDB Storage:**
- **Much larger capacity** - Hundreds of MB instead of 5-10MB localStorage limit
- **Better performance** - Asynchronous operations, transaction support, structured queries
- **No quota errors** - Typical IndexedDB quota is 50-100+ MB (browser dependent)
- **Automatic migration** - All existing localStorage data migrates seamlessly on first load
- **Simple key-value design** - Maintains compatibility with existing code structure

**📦 New Files:**
- `js/utils/indexeddb.js` - IndexedDB wrapper with CRUD operations, migration logic
- Database: `PhysicsAuditDB` with `keyValueStore` object store
- Timestamp index for cleanup operations

**🔧 Updated Files:**
- `js/utils/storage.js` - Now uses IndexedDB instead of localStorage, maintains same async API
- `js/features/auth/data-management.js` - All storage operations now async
- `js/features/auth/guest.js` - Auth data stored in IndexedDB
- `js/features/auth/teams.js` - Teams data stored in IndexedDB
- `js/features/settings/index.js` - Preferences stored in IndexedDB
- `js/features/flashcards/test.js` - Test results stored in IndexedDB
- `js/utils/data-integrity.js` - Device secret stored in IndexedDB
- `js/sw-registration.js` - Performance metrics stored in IndexedDB
- `js/core/app.js` - Added awaits to all storage operations
- `js/app-loader.js` - Added IndexedDB initialization to startup sequence

**🔄 Migration Process:**
- Automatic migration runs on first app load after update
- All localStorage keys copied to IndexedDB with same key names
- Migration status tracked to prevent re-running
- Original localStorage data preserved for safety
- No user action required

**🐛 Fixes:**
- Fixed DataCloneError by serializing Alpine.js reactive data to plain objects
- Fixed quota exceeded errors - IndexedDB handles larger datasets
- All async functions properly awaited throughout codebase

**📊 Benefits:**
- Power users can now store 10-50x more data
- No more "quota exceeded" errors during normal usage
- Better foundation for future features (sync, offline mode, etc.)
- Improved data integrity with transaction support

---

### v2.13 - Separated Storage Architecture & Enhanced Flashcard Testing (2025-10-26)

**🏗️ Storage Architecture Overhaul**

This major update refactors the data storage system from a single combined object to separated storage keys for dramatically improved performance and scalability.

**✨ Separated Storage System:**

1. **Independent Data Types**
   - Each data type now has its own localStorage key
   - Notes, flashcards, mindmaps, confidence levels, analytics all separate
   - Only changed data type saves (not everything at once)
   - Guest users: `physics-user-notes`, `physics-flashcard-decks`, etc.
   - Teams users: `teams_{userId}_physics-user-notes`, etc.

2. **Automatic Migration**
   - Old combined storage (`physicsAuditData`) automatically migrates
   - Migration happens silently on first load
   - Old data deleted after successful migration
   - Backward compatible - can import old backups

3. **Performance Benefits**
   - Editing a note only saves notes (~10KB write vs ~50KB before)
   - Editing flashcards only saves flashcards (~5KB write)
   - Dramatically reduces write operations
   - Can scale to 30+ sections without slowdown
   - Typical usage: ~370KB total (only 2% of 10MB limit)

**📊 Flashcard Test System Enhancements:**

1. **Self-Assessment Workflow**
   - Icon-only buttons: Red X (incorrect), Green checkmark (correct)
   - Both buttons move forward (no more back/next confusion)
   - Test automatically finishes when last card is marked
   - Smooth card flipping with optimized timing (300ms)

2. **Visual Progress Tracking**
   - Real-time score counter (correct/incorrect tallies)
   - Color-coded dot indicators:
     - Purple = current card
     - Green = marked correct
     - Red = marked incorrect
     - Gray = not answered
   - Dynamic title shows deck name

3. **Results & Review System**
   - Results screen shows:
     - Percentage score
     - Total correct and incorrect
     - Three review options
   - Review screens show front/back side-by-side:
     - Purple box for questions (left)
     - Green box for answers (right)
   - Back button to return to results

4. **Data Persistence**
   - Test results saved to `flashcard-test-results` localStorage key
   - Stores: deck name, correct/incorrect counts, timestamp, date, time
   - Prepared for future analytics dashboard integration

**🎨 UI Improvements:**

1. **Consistent Card Display**
   - Purple background for questions/front
   - Green background for answers/back
   - Applied across:
     - Study materials section (Knowledge Audit)
     - All Flashcards view
     - Test mode review screens
   - Removed "Front"/"Back" labels for cleaner look

2. **Removed Instructions**
   - Removed "How to use" text from flashcard test modal
   - Cleaner, more streamlined interface

**🔧 Technical Implementation:**

**New Storage Methods:**
- `saveNotes()` - Save notes only
- `saveFlashcardDecks()` - Save flashcards only
- `saveMindmaps()` - Save mindmaps only
- `saveConfidenceLevels()` - Save confidence ratings only
- `saveAnalyticsHistory()` - Save analytics data only
- `migrateOldData()` - One-time migration from old format
- `saveDataType()` / `loadDataType()` - Generic storage helpers

**Updated Methods:**
- All save operations updated to use specific methods
- `notes/management.js` → `saveNotes()`
- `flashcards/management.js` → `saveFlashcardDecks()`
- `mindmaps/management.js` → `saveMindmaps()`
- `confidence/rating.js` → `saveConfidenceLevels()` + `saveAnalyticsHistory()`

**Export/Import:**
- Export combines all separated data into single JSON file
- Includes test results in export
- Import handles both old and new formats
- Backup/restore fully compatible

**Files Modified:**
- `js/features/auth/data-management.js` - Complete storage refactor with migration
- `js/core/app.js` - Added wrapper methods for all storage operations
- `js/core/state.js` - Added test state variables
- `js/features/notes/management.js` - Use `saveNotes()`
- `js/features/flashcards/management.js` - Use `saveFlashcardDecks()`
- `js/features/flashcards/test.js` - Enhanced test mode and results system
- `js/features/mindmaps/management.js` - Use `saveMindmaps()`
- `js/features/confidence/rating.js` - Use specific save methods
- `templates/flashcard-test-modal.html` - Complete UI redesign
- `templates/revision-view.html` - Removed Front/Back labels
- `templates/all-flashcards-view.html` - Applied colored box styling
- `README.md` - Updated documentation

**📊 Storage Comparison:**

| Scenario | Old System | New System | Improvement |
|----------|-----------|------------|-------------|
| Edit one note | Saves all 50KB | Saves notes 10KB | 80% less |
| Add flashcard | Saves all 50KB | Saves decks 5KB | 90% less |
| Rate confidence | Saves all 50KB | Saves ratings 3KB | 94% less |
| 30 sections | ~370KB total | ~370KB total | Same size |
| Save operations | Always full | Only changed | Much faster |

**Benefits:**
- ✅ **Dramatically faster** - Granular saves instead of full data writes
- ✅ **More scalable** - Can handle 30+ sections easily
- ✅ **Better UX** - Reduced lag when saving
- ✅ **Easier debugging** - Inspect each data type separately
- ✅ **Future-ready** - Enables selective sync/export features
- ✅ **Better testing** - Self-assessment with tracked results
- ✅ **Cleaner UI** - Streamlined flashcard test interface
- ✅ **Analytics-ready** - Test results prepared for future analytics

---

### v2.12 - Flashcard Editor Rich Text Redesign (2025-10-26)

**📝 Rich Text Flashcard Editor**

This update transforms the flashcard editor from simple text inputs into a full-featured rich text editor, bringing it to feature parity with the note editor while maintaining the flashcard-specific workflow.

**✨ New Features:**

1. **Rich Text Formatting for Flashcards**
   - Side-by-side layout with front (question/term) and back (answer/definition) editors
   - Single formatting toolbar spanning both editors
   - Toolbar applies formatting to whichever editor is focused
   - Full formatting support:
     - Text styles: bold, italic, underline, strikethrough
     - Font sizes (8pt to 36pt)
     - Text and highlight colors
     - Lists: bullet points and numbered lists
     - Tables with visual grid selector
     - Math equations using KaTeX
   - Both editors now use `contenteditable` divs instead of plain textareas
   - CSS-based placeholder text (`:empty:before` pseudo-element)

2. **HTML Rendering in All Views**
   - Changed from `x-text` to `x-html` for proper HTML rendering
   - Added `user-note-content` CSS class for consistent styling
   - Fixed HTML display in:
     - Flashcard editor preview (card list)
     - All Flashcards view (flashcard list)
     - Knowledge Audit view (revision resources)
     - Flashcard test modal (3D flip cards)
   - Lists, colors, formatting, equations now render correctly everywhere

3. **Icon Consistency Improvements**
   - Replaced Lucide icons with inline SVG icons in all flashcard views
   - Icons now match the note editor style (outline SVGs)
   - Play button uses Lucide `play` icon (rounded triangle outline)
   - Edit and delete buttons use SVG paths matching knowledge audit view
   - Consistent icon style across flashcard view and knowledge audit view

**🐛 Bug Fixes:**

1. **Fixed Dropdown Behavior**
   - Removed `@click.stop` from modal window that was blocking `@click.away` detection
   - Color picker and table selector now close when clicking anywhere else
   - Proper z-index stacking (`z-[100]`) for dropdown menus
   - Changed backdrop to use `@click.self` for proper modal closing

2. **Fixed Text Entry Issues**
   - Removed `x-html` binding from contenteditable that caused backward text entry
   - Removed `dir="ltr"` attribute (no longer needed)
   - Text now syncs via `@input` and `@blur` handlers only
   - Typing now works correctly in natural left-to-right order

3. **Fixed Visual Indicators**
   - Changed chevron icons to inline SVG with CSS rotation for collapse indicators
   - "Cards in Deck" section now shows visual feedback when collapsed/expanded
   - Smooth rotation transitions (`transition-transform duration-200`)

4. **Fixed Editor Reset**
   - Moved `x-init` watcher to outer backdrop div for persistence
   - Watcher triggers on modal open (when `showFlashcardEditor` becomes true)
   - Clears both front and back editors using `$nextTick` callback
   - Works for all close methods: Create, Cancel, X button, and backdrop click

5. **Fixed Card Addition**
   - Editor fields now clear automatically after adding a card
   - Both `flashcardEditorCurrentCardFront/Back` state and `innerHTML` reset
   - Ready to add next card immediately without manual clearing

**🎨 UI Improvements:**

- Consistent border styling with purple theme for flashcard editors
- Visual separation between front/back with grid layout (`grid-cols-2 gap-3`)
- Labels show "Front (Question/Term)" and "Back (Answer/Definition)"
- Minimum height of 200px for comfortable editing
- Scrollable editors with overflow handling
- Placeholder text styled with gray color in both light and dark modes

**🔧 Technical Details:**

- Editors track focus with `activeFlashcardField` state variable
- Toolbar buttons check for active field before applying formatting
- Uses shared formatting functions: `formatText()`, `changeFontSize()`, `changeTextColor()`, etc.
- Table selector with hover preview and dynamic grid expansion
- Equation insertion via double-click to edit functionality
- Modal-level `x-data` scope for proper dropdown state management

**Files Modified:**
- `templates/flashcard-editor-modal.html` - Complete editor redesign with rich text support
- `templates/flashcard-test-modal.html` - HTML rendering with `x-html` and `user-note-content` class
- `templates/all-flashcards-view.html` - SVG icons and HTML rendering in preview
- `templates/revision-view.html` - SVG icons and HTML rendering in knowledge audit view
- `css/style.css` - Added CSS `:empty:before` placeholder support
- `README.md` - Updated documentation

**Benefits:**
- ✅ **Feature parity** - Flashcards now support same rich formatting as notes
- ✅ **Better learning** - Format key terms, add equations, use colors for emphasis
- ✅ **Consistent UX** - Same formatting toolbar across all editors
- ✅ **Visual clarity** - HTML renders properly in all views and test mode
- ✅ **Icon consistency** - Unified SVG icon style across the app
- ✅ **Smooth workflow** - Editors clear automatically, dropdowns behave intuitively

---

### v2.11 - Editor Modal UI Improvements (2025-10-25)

**🎨 Study Materials Editor Redesign**

This update focuses on improving the user experience of note, flashcard, and mindmap editors with cleaner layouts, better behavior, and more intuitive interfaces.

**✨ Note Editor Improvements:**

1. **Fixed Menu Dropdown Behavior**
   - Menus (Edit/Insert/Format/View) now close when clicking anywhere outside
   - Each menu has independent state instead of shared activeMenu
   - Removed `@click.stop` from modal to allow Alpine.js `@click.away` to work
   - Changed backdrop to `@click.self` for proper closing behavior
   - Font color and highlight color pickers behave consistently with menus

2. **Reorganized Header & Footer**
   - Title input moved between icon and undo/redo buttons for better flow
   - Removed "Create new note" text for cleaner appearance
   - Combined tags and action buttons into single compact footer row
   - Tags appear beside "Topic tags:" label and wrap below when needed
   - Reduced dead space and improved visual organization

**✨ Equation Editor Improvements:**

1. **Tabbed Math Options Interface**
   - Math symbols organized into 4 tabs: Common, Trigonometry, Logs & Exp, Greek & Symbols
   - Smooth tab transitions without layout shift (absolute positioning with opacity fade)
   - Faster transition animations (150ms)
   - Easier to find and access specific functions

**✨ Flashcard Editor Improvements:**

1. **Simplified Editor Interface**
   - Removed "Advanced Text Editor" toggle for simpler workflow
   - Simple textarea inputs for Front and Back (removed rich text complexity)
   - Focus on quick card creation

2. **Enhanced Card Management**
   - "Cards in Deck" section always visible (removed conditional hiding)
   - Cards display with visual flashcard styling:
     - Purple gradient for Front (question/term)
     - Green gradient for Back (answer/definition)
   - Edit and delete icons appear on the right of each card
   - Cards list starts collapsed by default
   - "No cards" message only shows when dropdown is expanded and empty

3. **Improved Edit Workflow**
   - Click edit icon → card loads into textareas
   - Button changes to "Update Card" with checkmark icon
   - "Cancel Edit" button appears to clear editor
   - Text fields clear automatically after adding/updating cards

4. **Applied Consistent Header/Footer Pattern**
   - Header: Icon | Deck Name Input | Close button
   - Footer: Tags (left) | Action buttons (right)
   - Matches note editor layout for consistency

**✨ Mindmap Editor Improvements:**

1. **Applied Consistent Header/Footer Pattern**
   - Header: Icon | Title Input | Close button
   - Toolbar: Centered tool buttons only (Edit, Color, Delete, Center, Reset, Export)
   - Footer: Tags + Stats (left) | Action buttons (right)
   - Stats badge shows node and connection counts

**🐛 Bug Fixes:**

1. **Fixed Flashcard Editor Alpine.js Errors**
   - Changed from `x-if` to `x-show` for editor mode switching
   - Rewrote Add/Update button handler to use proper if/else blocks instead of ternary with semicolons
   - Fixed "Unexpected token ';'" errors that prevented cards from adding

2. **Fixed Lucide Icons Not Rendering**
   - Added `x-init="$nextTick(() => lucide.createIcons())"` to dynamically rendered cards
   - Edit and delete icons now appear correctly when cards are created

**🔧 State Management:**

- Added global state variables: `flashcardEditorCardsExpanded`, `flashcardEditorEditingCardIndex`
- Removed unused `flashcardEditorUseAdvanced` after simplifying editor
- All state properly resets when closing and reopening editors

**Files Modified:**
- `templates/note-editor-modal.html` - Menu behavior, header/footer reorganization
- `templates/equation-editor-modal.html` - Tabbed interface implementation
- `templates/flashcard-editor-modal.html` - Complete redesign with simplified editor and card management
- `templates/mindmap-editor-modal.html` - Header/footer consistency updates
- `js/core/state.js` - Added flashcard editor state variables
- `js/features/flashcards/management.js` - Reset new state variables on close
- `README.md` - Updated documentation

**Benefits:**
- ✅ **Cleaner UI** - Reduced clutter, better visual hierarchy
- ✅ **Consistent patterns** - All editors follow same header/footer layout
- ✅ **Better UX** - Menus behave intuitively, cards easier to manage
- ✅ **Simpler workflow** - Removed complexity from flashcard editor
- ✅ **Visual feedback** - Flashcard-style card previews with color coding
- ✅ **Easier navigation** - Tabbed equation editor, organized tool buttons

---

### v2.10 - Performance Optimization & UI Improvements (2025-10-23)

**🚀 Performance & Caching Optimizations**

This update focuses on improving app performance, reducing console noise, fixing bugs, and enhancing the user experience with cleaner UI and better caching strategies.

**✨ Bug Fixes:**

1. **Fixed Resource Loading Error** - `app-loader.js:100`
   - Added `await` to `createOptimizedResourceGetter()` call
   - Previously returned Promise instead of function, causing "getResourcesForSection is not a function" error
   - Resources now load correctly on first try

2. **Fixed Video Resources Display** - `revision-view.html`
   - Updated x-for loop keys to use index-based unique keys: `:key="\`video-${index}-${video.url}\`"`
   - Prevents Alpine.js "x-for :key is undefined or invalid" errors
   - Applied to all resource types (videos, notes, simulations, questions)

3. **Fixed Auth Module Race Condition** - `app.js`
   - Replaced flag-based loading with promise-based approach
   - Prevents duplicate "Loading auth module..." messages
   - Ensures auth methods fully loaded before `checkExistingAuth()` call

**⚡ Service Worker Optimization:**

- **Changed Caching Strategy**: Network-first → Cache-first with background updates
  - Dramatically reduces console spam (~95% less logging)
  - Serves files from cache instantly, updates silently in background
  - Removed all cache hit/fetch spam from console
  - Files update in background without blocking or logging
  - Version bumped to v2.20

**🧹 Console Cleanup:**

Reduced console output from 60+ verbose log lines to clean 3-line summary:

**Before:**
```
🚀 Starting ULTRA-FAST Physics Audit Tool...
⚡ Attempting JSON loading...
✅ Alpine.js loaded
🚀 JSON loaded in 4.00ms
📦 Loading templates...
✅ Loaded: ./templates/settings-modal.html
... (19 template messages)
[Section Color] messages...
[Color 0] messages...
🎉 Application started in 323ms
📋 SW Version: 2.10
```

**After:**
```
✅ Templates loaded (19/19)
✅ SW v2.20 active
🎉 App ready in 323ms
```

- **Service Worker** (`sw.js`) - Removed all cache hit/fetch logging
- **Template Loader** (`template-loader.js`) - One summary instead of 19 individual logs
- **App Loader** (`app-loader.js`) - Removed verbose step-by-step logs
- **Revision Colors** (`revision-colors.js`) - Removed all color assignment debug logs
- **SW Registration** (`sw-registration.js`) - Cleaned up registration messages

**🎨 UI Improvements:**

1. **Force Refresh Button** - Settings → Admin
   - Clears all Service Worker caches
   - Unregisters Service Worker
   - Performs true hard reload with cache-busting URL
   - Cache rebuilds immediately after reload (single refresh needed)
   - Auto-cleans `?_refresh=timestamp` from URL after load
   - Users can force-update app without manual cache clearing

2. **Admin Tab Repositioned** - Settings modal
   - Moved to bottom of sidebar (visually pinned)
   - Separated with border-top for prominence
   - Contains CSV to JSON Converter link and Force Refresh button

3. **Sidebar Simplification** - Bottom section
   - Removed "Data Management" dropdown with 5 options
   - Replaced with single "Analytics Dashboard" button
   - All data management features remain in Settings → Data tab
   - Styled with eye-catching green-to-blue gradient (matches Update button)
   - Shadow and font weight for prominence

4. **Default Settings Change**
   - Revision Area Indicator style default changed from 'bar' to 'outline'
   - New users see outline style by default
   - Existing users keep their saved preference

**🔧 Technical Improvements:**

- **URL Cleanup** (`app-loader.js`)
  - Auto-removes `_refresh` parameter after Force Refresh
  - Uses `history.replaceState()` for clean URLs without reload

- **Auth Module Loading** (`app.js`)
  - Promise-based loading prevents race conditions
  - Multiple `init()` calls share same loading promise
  - No duplicate loading or console messages

**Files Modified:**
- `sw.js` - Optimized caching strategy, removed verbose logging, v2.20
- `js/app-loader.js` - Fixed async resource getter, removed verbose logs, URL cleanup
- `js/template-loader.js` - Summary logging instead of per-file
- `js/sw-registration.js` - Cleaned up logging
- `js/core/app.js` - Fixed auth module race condition
- `js/core/state.js` - Changed default indicator to 'outline'
- `js/utils/revision-colors.js` - Removed debug logging
- `js/features/settings/index.js` - Added Force Refresh method
- `templates/settings-modal.html` - Added Force Refresh button, moved Admin tab
- `templates/revision-view.html` - Fixed x-for keys
- `templates/sidebar.html` - Simplified to Analytics Dashboard only, gradient styling
- `README.md` - Moved detailed testing to separate file, updated changelog

**Files Created:**
- `docs/guides/TESTING.md` - Comprehensive testing guide with all checklists and procedures

**📊 Performance Improvements:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Console log lines | 60+ | 3 | 95% reduction |
| Service Worker logs | Per-file spam | Silent | 100% cleaner |
| Template loading logs | 19 messages | 1 summary | Much cleaner |
| Cache strategy | Network-first | Cache-first + bg update | Faster |
| Force Refresh flow | 2 refreshes needed | 1 refresh | 50% fewer steps |
| Auth loading | Race conditions | Promise-based | More reliable |

**Benefits:**
- ✅ **Cleaner development experience** - Minimal console noise
- ✅ **Faster perceived performance** - Cache-first serving
- ✅ **Easier debugging** - Important messages stand out
- ✅ **Better UX** - Force Refresh in one click
- ✅ **More reliable** - Fixed race conditions and loading errors
- ✅ **Cleaner UI** - Simplified sidebar, better visual hierarchy

---

### v2.9 - Manual Update Control System (2025-10-21)

**🎮 User-Controlled App Updates**

This update completely overhauls the app update mechanism, giving users full control over when updates are installed instead of automatic reloading.

**✨ New Features:**

1. **Manual Update System** - No more automatic reloads
   - App never auto-updates, even when new version is available
   - Service Worker installs updates in background but waits for user approval
   - Full control over update timing

2. **Updates Tab in Settings** - Dedicated update management interface
   - **Location**: Settings → Updates (6th tab after Admin)
   - **Current Version Display**: Shows installed version (e.g., "2.9")
   - **Check for Updates Button**: Manually trigger update check
   - **Three-State UI**:
     - Normal: "Check for Updates" button
     - Checking: Loading spinner with status
     - Update Available: Install prompt with backup option
   - **Backup Flow**:
     - Click "Install Update" → Backup prompt appears
     - Choose "Backup & Update" (creates JSON backup first)
     - Or choose "Update Now" (install immediately)
   - **Informational Box**: Explains update process and data safety

3. **Visual Update Notification** - Impossible to miss
   - **Badge on Settings Icon**: Red pulsing badge with "!" appears in sidebar
   - **Ping Animation**: Attention-grabbing animated ring effect
   - **Badge on Tab Button**: Red dot on Updates tab in settings modal
   - Only visible when update is available

4. **Update Management Methods** - Complete programmatic control
   - `checkForAppUpdates()` - Manually check for new versions
   - `installUpdateNow()` - Activate pending update immediately
   - `backupAndUpdate()` - Create backup then activate update
   - Integrated with existing data management methods

**🔧 Technical Implementation:**

- **Service Worker Changes** (`sw.js`):
  - Removed automatic `skipWaiting()` calls in install event
  - Service Worker installs and waits for manual `SKIP_WAITING` message
  - Only activates when user explicitly triggers update
  - Updated version to 2.9
  - Added new shared utilities to cache list

- **Registration Module** (`js/sw-registration.js`):
  - Global `window.appUpdateState` tracks update availability
  - Removed dev mode auto-activation (manual control everywhere)
  - Dispatches `app-update-available` event to Alpine.js app
  - `checkForUpdates()` - Programmatic update check
  - `activateUpdate()` - Trigger update activation

- **State Management** (`js/core/state.js`, `js/core/watchers.js`):
  - Added `updateAvailable`, `checkingForUpdates`, `updateCheckMessage`, `showBackupPrompt` states
  - Event listener for `app-update-available` custom events

- **Settings Module** (`js/features/settings/index.js`):
  - Imported update functions from sw-registration
  - Added three new methods for update management
  - Integrated with existing backup functionality

- **Templates**:
  - `templates/settings-modal.html` - Added Updates tab with complete UI
  - `templates/sidebar.html` - Added badge to settings icon

**📊 User Experience Improvements:**

| Before | After |
|--------|-------|
| Auto-reload on update | Manual control |
| No notification before reload | Badge notification + dedicated tab |
| Can't defer updates | Install when convenient |
| No backup option | Optional backup before update |
| Interrupts workflow | User chooses timing |

**🎯 Update Flow:**

```
New version deployed
    ↓
Service Worker detects update
    ↓
Installs new version in background
    ↓
Waits in "installed" state
    ↓
Dispatches 'app-update-available' event
    ↓
Badge appears on settings icon
    ↓
User opens Settings → Updates
    ↓
User sees "New version available!"
    ↓
User clicks "Install Update"
    ↓
Backup prompt appears
    ↓
User chooses:
    ├─ "Backup & Update" → Creates JSON backup → Activates update
    └─ "Update Now" → Immediately activates update
    ↓
Service Worker activates new version
    ↓
Page reloads automatically
    ↓
User sees new version
```

**🔒 Data Safety:**

- Updates never interrupt user workflow
- Optional backup before every update
- Data persists across updates (localStorage)
- No data loss risk from forced updates

**Files Modified:**
- `sw.js` - Removed auto-activation, updated to v2.9
- `js/sw-registration.js` - Manual update control, removed dev auto-activation
- `js/core/state.js` - Added update state variables
- `js/core/watchers.js` - Added update event listener
- `js/features/settings/index.js` - Added update management methods
- `templates/settings-modal.html` - Added Updates tab with full UI
- `templates/sidebar.html` - Added update badge to settings icon
- `README.md` - Updated documentation

**Benefits:**
- ✅ **No interruptions** - Updates never force reload
- ✅ **User control** - Install updates when convenient
- ✅ **Visual feedback** - Clear notification of available updates
- ✅ **Data safety** - Optional backup before updating
- ✅ **Better UX** - Professional update management like desktop apps
- ✅ **Transparency** - User knows exactly when app updates

---

### v2.8 - Code Optimization & Architecture Refactoring (2025-10-20)

**🏗️ Major Code Refactoring - Eliminated ~1,325 Lines of Duplication**

This update focuses on reducing code duplication, improving maintainability, and optimizing performance through architectural improvements. No user-facing features changed, but the codebase is now significantly cleaner and more efficient.

**✨ New Shared Utilities (DRY Principles Applied):**

1. **`js/utils/csv-parser.js`** (118 lines) - Shared CSV parsing logic
   - Eliminates duplication across 3 files (~135 lines saved)
   - Functions: `parseCSV()`, `loadCSVFile()`
   - Handles quoted fields, escaped quotes, HTML entity decoding
   - Used by: unified-csv-loader.js, csv-converter-unified.html

2. **`js/utils/csv-converter.js`** (145 lines) - Shared CSV conversion logic
   - Eliminates duplication across 3 files (~150 lines saved)
   - Functions: `convertSubjectCSV()`, `convertGroupsCSV()`
   - Builds revision mappings from CSV data
   - Used by: unified-csv-loader.js, csv-converter-unified.html

3. **`js/utils/resource-schema.js`** (96 lines) - Single source of truth for resource objects
   - Eliminates duplication across 2 files (~200 lines saved)
   - Creator functions: `createVideoResource()`, `createNoteResource()`, `createSimulationResource()`, `createQuestionResource()`, `createRevisionSection()`
   - Factory: `getResourceCreator(type)` returns appropriate creator function
   - Used by: unified-csv-loader.js, app-loader.js

4. **`js/utils/content-filter.js`** (93 lines) - Shared filter methods generator
   - Eliminates triplication across 3 files (~140 lines saved)
   - Factory function: `createContentFilterMethods(contentType)` generates filter methods
   - Exports: `studyMaterialsFilterMethods` for shared toggle logic
   - Used by: notes/filter.js, flashcards/filter.js, mindmaps/filter.js

**📁 Files Updated to Use Shared Utilities:**

- **`js/data/unified-csv-loader.js`** - Reduced from 562 to 334 lines (40% reduction)
  - Now imports and uses all shared utilities
  - Cleaner, more maintainable code

- **`js/features/notes/filter.js`** - Reduced from 46 to 8 lines (83% reduction)
- **`js/features/flashcards/filter.js`** - Reduced from 77 to 11 lines (86% reduction)
- **`js/features/mindmaps/filter.js`** - Reduced from 46 to 8 lines (83% reduction)

**🔧 Unified CSV Converter Tool:**

- **`tools/csv-converter-unified.html`** (556 lines) - Merges two previous converters
  - Replaces: `csv-converter.html` and `csv-converter-local.html` (~700 lines of duplication eliminated)
  - **Server Mode**: Fetches CSV files from web server (for deployed apps)
  - **Local Mode**: Drag & drop file upload (for offline/development)
  - Tab-based UI for easy mode switching
  - Uses all shared utilities (csv-parser.js, csv-converter.js, resource-schema.js)
  - Generates JSON v2.0 format with groups included

**📦 JSON v2.0 Format Enhancements:**

- **`js/app-loader.js`** updated to load groups from JSON:
  - Checks for `paperModeGroups` and `specModeGroups` in JSON
  - Loads groups directly from JSON if available (v2.0+)
  - Graceful fallback to CSV for old JSON files (v1.x)
  - Console warnings guide users to regenerate JSON for optimal performance
  - Made `createOptimizedResourceGetter()` async to import shared resource schema
  - Uses shared schema for building resource indexes (eliminates duplication)

**⚙️ Admin Tab in Settings:**

- **`templates/settings-modal.html`** - Added new Admin tab
  - **Location**: Settings → Admin (5th tab after Account/Data/Preferences/About)
  - **Icon**: Shield-check
  - **Features**:
    - Link to unified CSV to JSON converter tool (opens in new tab)
    - Informational section explaining performance benefits
    - User-friendly guidance for optimization
  - Makes converter easily accessible without navigating file structure

**🐛 Bug Fixes:**

- Fixed typo in `app-loader.js` where `notes` resources were incorrectly mapped to `videos` array
- Removed duplicate checking from runtime (now only done once in converter tools for better performance)

**📊 Code Quality Improvements:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total duplicate code | ~1,325 lines | 0 lines | 100% reduction |
| CSV parser locations | 3 files | 1 file | Centralized |
| CSV converter locations | 3 files | 1 file | Centralized |
| Resource schema locations | 2 files | 1 file | Single source |
| Filter method locations | 3 files | 1 file | Factory pattern |
| CSV converter tools | 2 tools | 1 tool | Unified |
| HTTP requests (JSON v2.0) | 2 requests | 1 request | 50% reduction |

**🚀 Performance Benefits:**

- ✅ **Faster JSON loading** - Groups included in single HTTP request (no groups.csv fetch)
- ✅ **Better runtime performance** - Shared schemas reduce object creation overhead
- ✅ **Smaller codebase** - Less code to parse and execute
- ✅ **Better caching** - Shared utilities cached once and reused

**🔧 Developer Experience Improvements:**

- ✅ **Easier maintenance** - Change once, apply everywhere
- ✅ **Consistent behavior** - Single implementation ensures consistency
- ✅ **Better testability** - Shared utilities easier to test in isolation
- ✅ **Clear architecture** - Separation of concerns with utils/ folder

**Files Modified:**
- `js/utils/csv-parser.js` - NEW
- `js/utils/csv-converter.js` - NEW
- `js/utils/resource-schema.js` - NEW
- `js/utils/content-filter.js` - NEW
- `tools/csv-converter-unified.html` - NEW (replaces 2 old files)
- `js/data/unified-csv-loader.js` - Updated to use shared utilities
- `js/app-loader.js` - Load groups from JSON v2.0, use shared schema
- `js/features/notes/filter.js` - Updated to use shared utility
- `js/features/flashcards/filter.js` - Updated to use shared utility
- `js/features/mindmaps/filter.js` - Updated to use shared utility
- `templates/settings-modal.html` - Added Admin tab
- `README.md` - Updated documentation

**Migration Notes:**
- Existing JSON files (v1.x) still work with graceful fallback to CSV for groups
- Regenerate JSON with unified converter to get v2.0 format with groups included
- Old converter tools can be deleted (replaced by unified version)

---

### v2.7 - CSV-Based Revision Mappings & Settings UI Redesign (2025-10-20)

**🗂️ Revision Mappings Moved to CSV**
- **CSV-Based Configuration**: Revision mappings now built dynamically from CSV files
  - Added `section_id` and `revision_section_title` columns to all 10 subject CSV files
  - Mappings automatically generated when loading data (no hardcoded JavaScript)
  - Single source of truth for topic-to-revision relationships
  - Easier maintenance through spreadsheet editing

- **Deleted Files**:
  - `js/data/revision-mappings.js` - No longer needed (replaced by CSV-based system)

- **Updated CSV Converters**: Both converter tools now build revision mappings into JSON
  - `tools/csv-converter-local.html` - Version 1.1
    - Extracts `section_id` and `revision_section_title` from subject CSVs
    - Builds `revisionMapping`, `revisionSectionTitles`, and `topicToSectionMapping` objects
    - Includes mappings in `combined-data.json` output
    - Shows revision section count in completion message
  - `tools/csv-converter.html` - Version 1.1
    - Same functionality as local converter for server-based workflows
    - Fetches CSVs from server, builds identical JSON structure

- **App Loader Updates**: Graceful handling of JSON files with or without revision mappings
  - `js/app-loader.js`:
    - Checks for `data.revisionMappings` in JSON files
    - Initializes global `window.revisionMapping`, `window.topicToSectionMapping`, `window.revisionSectionTitles`
    - Shows warning if JSON missing mappings (prompts regeneration)
    - Falls back to empty objects for backward compatibility with old JSON files
    - Logs revision section count on successful load

**⚙️ Settings Modal Redesign**
- **Tabbed Interface**: Complete redesign with side navigation for better organization
  - **Left Sidebar** (56px width): 4 tab buttons with icons and labels
    - Account - User profile, logout
    - Data - Analytics, export, backup, import, clear data
    - Preferences - View mode, paper selection, revision indicators
    - About - Version info and build details
  - **Right Content Area**: Scrollable tab-specific content with clean organization
  - **Fixed Height**: Modal set to 85vh (85% viewport height) for consistent sizing
  - **Alpine.js State**: Local tab state with `x-data="{ activeSettingsTab: 'account' }"`
  - **Enhanced Visual Design**:
    - Icon backgrounds with colored rounded squares for action buttons
    - Better spacing and padding throughout (px-5 py-4 for buttons)
    - Clear borders on all containers for structure
    - Improved dark mode support across all tabs
    - Larger modal width (max-w-4xl vs max-w-2xl) for better content display

**Benefits of CSV-Based Mappings:**
- ✅ **No code changes needed** - Edit revision groups directly in Excel/Google Sheets
- ✅ **Easier maintenance** - Spreadsheet workflow for non-developers
- ✅ **Version control friendly** - CSV diffs are human-readable
- ✅ **Single source of truth** - No duplication between data and code
- ✅ **Automatic color coding** - Topic cards auto-grouped by `section_id`

**Files Modified:**
- `tools/csv-converter-local.html` - Updated to v1.1 with revision mapping support
- `tools/csv-converter.html` - Updated to v1.1 with revision mapping support
- `js/app-loader.js` - Load revision mappings from JSON with graceful fallback
- `templates/settings-modal.html` - Complete redesign with tabbed navigation
- All 10 subject CSV files - Added `section_id` and `revision_section_title` columns:
  - `resources/subject-cards/measurements.csv`
  - `resources/subject-cards/particles.csv`
  - `resources/subject-cards/waves.csv`
  - `resources/subject-cards/mechanics.csv`
  - `resources/subject-cards/electricity.csv`
  - `resources/subject-cards/periodic-motion.csv`
  - `resources/subject-cards/thermal.csv`
  - `resources/subject-cards/fields.csv`
  - `resources/subject-cards/magnetic-fields.csv`
  - `resources/subject-cards/nuclear.csv`

**Files Deleted:**
- `js/data/revision-mappings.js` - Replaced by CSV-based system

---

### v2.6 - User-Friendly Equation Editor (2025-10-13)

**📐 New Feature: Math Equation Builder for A-Level Students**
- **Visual Button-Based Interface**: No LaTeX knowledge required
  - Large, organized buttons for common functions grouped by category
  - Blue section: Common functions (fraction, multiply, power, squared, sqrt, standard form)
  - Purple section: Trigonometry (sin, cos, tan, sin⁻¹, cos⁻¹, tan⁻¹)
  - Green section: Logs & Exponentials (log, ln, e^x, e)
  - Gray section: Greek letters & symbols (α, β, γ, θ, λ, π, etc.)

- **Smart Auto-Conversion**: Type naturally, LaTeX generated automatically
  - `/` after numbers → converts to `\frac{numerator}{denominator}` format
  - `*` → converts to `\times` (multiplication symbol)
  - `^23` → automatically wraps multi-digit exponents: `^{23}`
  - No need to learn LaTeX syntax - just type like you would on paper

- **Intuitive Template System**:
  - Click button → cursor automatically positions inside template
  - Functions like `sin(`, `log(` place cursor in parentheses
  - Templates like `\frac{}{}` place cursor in first brace
  - Easy to build complex expressions step-by-step

- **Live Preview & Editing**:
  - Real-time KaTeX rendering shows equation as you type
  - Graceful error handling - no scary error messages for incomplete syntax
  - Double-click any inserted equation to re-open editor
  - Edit and update equations seamlessly

- **Full Dark Mode Support**:
  - Text properly styled (white in dark mode, dark in light mode)
  - All buttons, labels, and hints fully themed
  - Equation preview adapts to theme

- **Code Quality Improvements**:
  - Refactored equation editor into separate module (`equation-editor.js`)
  - Reduced `editor.js` from 485 lines to 145 lines (70% smaller)
  - Clear separation of concerns: basic formatting vs. equation logic
  - Comprehensive inline documentation for maintainability
  - Follows existing codebase patterns (facade + feature modules)

**Technical Details:**
- **New Files**:
  - `js/features/notes/equation-editor.js` - Equation editor logic (374 lines)
  - `templates/equation-editor-modal.html` - Equation editor UI
- **Modified Files**:
  - `js/features/notes/editor.js` - Cleaned up, now only basic formatting
  - `js/features/notes/index.js` - Added equation editor import
  - `index.html` - Added KaTeX CDN link
- **External Dependencies**:
  - KaTeX v0.16.9 (~350KB) - Math equation rendering engine
  - Loaded from CDN, cached by Service Worker

**Benefits for Students:**
- ✅ **No steep learning curve** - Visual buttons instead of LaTeX syntax
- ✅ **Fewer errors** - Auto-conversion handles common patterns
- ✅ **Faster input** - Smart shortcuts for frequent operations
- ✅ **Professional output** - Beautiful KaTeX-rendered equations
- ✅ **Easy corrections** - Double-click to edit any equation

---

### v2.42 - Cache & Memory Leak Fixes (2025-11-19)

**🐛 Critical Bug Fixes:**

**Memory Leak - Web Worker Accumulation**
- **Issue**: Web Workers were created on each page load but never terminated, causing RAM to double with each reload
- **Fix**: Added proper worker lifecycle management with `terminateWorker()` function
- **Impact**: Prevents memory accumulation across page reloads
- **Files**: `js/utils/storage.js:51-80`

**Console Spam - Service Worker Installation**
- **Issue**: Service Worker logged 10+ messages during installation, causing console spam that flashed on alternating reloads
- **Fix**: Silenced all non-error logging in Service Worker (install, activate, fetch events)
- **Impact**: Clean console output during normal operation; only errors and user-initiated actions are logged
- **Files**: `sw.js:73-321`

**Auto-Reload - Unwanted Page Refreshes**
- **Issue**: Service Worker reinstalls (e.g., after clearing cache) triggered unwanted auto-reloads via `controllerchange` event
- **Fix**: Added `skipWaitingCalled` flag to only reload when user explicitly activates an update
- **Impact**: No more auto-reloads when clearing cache; updates still work when user activates them
- **Files**: `js/sw-registration.js:9,43-49,100`

**Missing Files - 404 Errors**
- **Issue**: Service Worker tried to cache non-existent files, causing 404 warnings
- **Fix**: Removed missing files from `CRITICAL_RESOURCES` array
- **Files**: `sw.js:18,56` (removed `revision-mappings.js` and `login-screen.html`)

**🛠️ Improvements:**

**Storage Management**
- Added comprehensive `clearAllStorage()` function that clears IndexedDB, Service Worker cache, localStorage, and terminates workers
- New global helper functions for debugging:
  - `clearAllAppStorage()` - Clear all storage and reload page
  - `getStorageStats()` - View storage/worker statistics in console
- Files: `js/utils/storage.js:270-352`, `js/sw-registration.js:135-206`

**Worker Cleanup**
- Added `beforeunload` event listener to terminate workers when page unloads
- Added `visibilitychange` event listener to terminate workers when tab is hidden
- Prevents worker accumulation during development/testing
- Files: `js/utils/storage.js:68-80`

**Version History:**
- v2.38 → v2.39: Initial console spam reduction attempt
- v2.39 → v2.40: Complete Service Worker silencing
- v2.40 → v2.41: Removed missing files from cache list
- v2.41 → v2.42: Fixed auto-reload pattern with skipWaitingCalled flag

**Testing Instructions:**
1. Clear site data in DevTools
2. Hard reload (Ctrl+Shift+R)
3. Verify: Clean console (no cache messages)
4. Reload again: Still clean (no alternating pattern)
5. Check RAM usage: Stays consistent across reloads

**Files Modified:**
- `sw.js` - Silent operation, removed missing files, bumped to v2.42
- `js/utils/storage.js` - Worker lifecycle management, comprehensive storage clearing
- `js/sw-registration.js` - Auto-reload fix, debug helpers

---

### v2.5 - Topic Tagging System (2025-10-11)

**🏷️ New Feature: Topic Tagging System**
- **Tag Management**: Tag notes, flashcards, and mindmaps with physics topics for organization
- **Topic Lookup System**: Maps topic IDs to full information (title, section, paper)
  - `js/utils/topic-lookup.js` - Lookup utilities and search functions
  - `js/features/tags/management.js` - Tag CRUD operations
- **Auto-Tagging**: Materials automatically tagged with current topics when created from revision view
  - Single topic from topic detail → tags that topic
  - Multiple topics from revision section → tags all visible topics
- **Tag Selector Modal**: Searchable modal to browse and select topics
  - `templates/tag-selector-modal.html` - Tag selection interface
  - Real-time search across topic IDs, titles, and sections
  - Topics grouped by section for easy browsing
  - Visual checkmarks for selected tags
  - Click to toggle tags instantly
- **Tag Display**: Visual chips showing topic ID + title (e.g., "1.1 Physical Quantities")
  - Quick remove with X button
  - Located at bottom of all editors
  - Full dark mode support
- **Data Structure Updates**:
  - Notes: Added `tags: []` array to store topic IDs
  - Flashcards: Added `tags: []` array to store topic IDs
  - Mindmaps: Added `tags: []` array to store topic IDs
  - Tags stored as topic ID arrays for efficient filtering
  - Resolved to human-friendly names via lookup map

**Files Modified:**
- `js/core/state.js` - Added topic lookup, tag selector state, and editor tag arrays
- `js/features/notes/management.js` - Auto-tag from context, save/load tags
- `js/features/flashcards/management.js` - Auto-tag from context, save/load tags
- `js/features/mindmaps/management.js` - Auto-tag from context, save/load tags
- `templates/note-editor-modal.html` - Tag section at bottom
- `templates/flashcard-editor-modal.html` - Tag section at bottom
- `templates/mindmap-editor-modal.html` - Tag section in toolbar
- `js/template-loader.js` - Load tag selector modal

**New Files:**
- `js/utils/topic-lookup.js` - Topic lookup map builder and utilities
- `js/features/tags/index.js` - Tags feature facade
- `js/features/tags/management.js` - Tag selector and management methods
- `templates/tag-selector-modal.html` - Tag selection modal UI

**UI Improvements:**
- Tags positioned at bottom of editors for better workflow
- Consistent styling across all editors
- Fixed dark mode footer styling in tag selector modal

---

### v2.4 - Security, Performance & Reliability Improvements (2025-10-01)

**🔒 Security Fixes:**
- **CRITICAL: Fixed XSS vulnerability in search** - Added HTML sanitization to prevent script injection
- **CRITICAL: Added input validation on data import** - Protects against data injection and prototype pollution attacks
- **Service worker path mismatch fixed** - Corrected offline functionality by updating cache paths

**⚡ Performance Improvements:**
- **Fixed chart memory leaks** - Charts now properly cleaned up using Map storage instead of window globals
- **Added search debouncing** - 300ms delay reduces unnecessary computation on fast typing
- **Removed code duplication in charts** - Extracted reusable `renderPaperChart()` function, reduced ~100 lines

**🛡️ Reliability Improvements:**
- **Graceful error handling** - Replaced `Promise.all` with `Promise.allSettled` for better fault tolerance
- **Computed property duplication removed** - Single source of truth for reactive properties in `app.js`

**🧪 Testing Infrastructure:**
- **Set up Vitest test framework** - Automated testing with coverage reporting
- **Added security tests** - XSS protection and input validation test suites
- **Test documentation** - Clear setup and usage instructions in `tests/README.md`

**Files Modified:**
- `sw.js` - Fixed component paths, bumped to v2.4
- `js/app-loader.js` - Promise.allSettled for fault tolerance
- `js/core/state.js` - Removed duplicate computed properties, added chartInstances Map
- `js/features/search/index.js` - XSS sanitization and debouncing
- `js/features/auth/data-management.js` - Input validation
- `js/features/analytics/charts.js` - Memory leak fixes and DRY improvements
- `js/core/app.js` - Preserved computed properties for reactivity

**New Files:**
- `package.json` - Vitest configuration
- `vitest.config.js` - Test environment setup
- `tests/search.test.js` - Search and XSS tests
- `tests/data-validation.test.js` - Security validation tests
- `tests/README.md` - Test documentation
- `FIXES-COMPLETED.md` - Detailed fix documentation

**Installation & Testing:**
```bash
npm install          # Install test dependencies
npm test             # Run test suite
npm run test:ui      # Run with interactive UI
npm run test:coverage # Generate coverage report
```

---

### v2.3 - Navigation Reactivity Bug Fix (2025-10-01)

**Fixed:**
- Computed property reactivity issue causing navigation to always show "3.1a Measurements and their errors"
- Spec mode now correctly displays all sections in sidebar and cards in main section
- Paper 1/2 filtering now correctly shows only related sections
- Card/subject clicks now navigate to correct topics instead of defaulting to 3.1a

**Root Cause:**
The spread operator (`...state`) in `js/core/app.js` was breaking JavaScript getter properties, preventing Alpine.js from detecting changes to `activeSection`. Computed properties like `currentSection` lost their reactivity.

**Solution:**
Re-defined all computed properties (`currentGroups`, `currentSection`, `availablePapers`, `bannerTitle`, `bannerIcon`) directly in the app return object to preserve getter functionality and Alpine.js reactivity.

---

## 📞 Support

For issues or questions, check:
1. Browser console for error messages
2. This README's troubleshooting section
3. Verify all CSV files are present and properly formatted
