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
  - **Flashcard Decks** - Build named decks with multiple question/answer cards
  - **Interactive Mindmaps** - Visual knowledge organization with drag-and-drop canvas
    - Rich text nodes with formatting (bold, italic, underline, lists, indent)
    - Visual connections with preview lines
    - Pan, zoom, and organize freely
    - Nodes support paragraphs of formatted content
  - **Smart Filtering** - Toggle between viewing all materials, notes, flashcards, or mindmaps
  - **3D Flip Cards** - Test yourself with interactive card flipping
  - **Shuffle Mode** - Randomize flashcard order for varied practice
- **Settings Panel** - Comprehensive app configuration and data management
- **Dual View Modes** - Browse by specification or by exam paper
- **Search Functionality** - Quick topic lookup across entire specification
- **Guest & Teams Login** - Local storage or Microsoft Teams integration
- **Progressive Web App** - Install on device, works offline
- **Dark Mode** - Automatic dark/light theme switching

---

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: [Alpine.js](https://alpinejs.dev/) v3.13.3 (reactive UI)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) (utility-first CSS)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **PWA**: Service Worker for offline support

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
│   │   ├── storage.js        # localStorage helpers
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

### Local Storage Keys

| Key | Purpose | Size |
|-----|---------|------|
| `physicsAuditAuth` | Authentication state (user, method, expiry) | ~200B |
| `physicsAuditData` | Confidence levels + analytics history (guest) | ~10-50KB |
| `physicsAuditData_teams_{userId}` | User-specific data (Teams login) | ~10-50KB |
| `darkMode` | Theme preference (true/false) | ~5B |

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
  - View all cards in grid layout (front/back side-by-side)
- **Test Mode**:
  - 3D flip animation - click card to reveal answer
  - Shuffle button - randomize card order
  - Navigation with previous/next buttons or dot indicators
  - Test individual decks or all decks at once
  - Progress counter (e.g., "3 / 10")

#### Mindmap Editor
- **Canvas-Based Editing**:
  - Double-click blank area to create node (opens rich text editor)
  - Double-click node to edit existing content
  - Drag nodes to reposition on canvas
  - Ctrl/Cmd+click to create connections between nodes
  - Visual feedback: blue border on connection start, preview line, green border on target
- **Rich Text Nodes**:
  - Formatting toolbar: bold, italic, underline
  - Bulleted and numbered lists
  - Indent/outdent controls
  - Supports paragraphs of formatted content
  - Nodes show text preview on canvas, full content in editor
  - White dot indicator for nodes with rich content
- **Navigation & View Control**:
  - Shift+drag to pan canvas
  - Scroll to zoom in/out
  - Center button to recenter viewport
  - Reset button to restore default view
  - Node and connection counters in footer
- **Node Management**:
  - Edit button to modify selected node
  - Color button to change node appearance
  - Delete button to remove selected node
  - Multiple color options (blue, green, yellow, red, purple, gray)

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
- Real-time fuzzy search across topics, learning objectives, and examples
- Relevance scoring
- Click to navigate directly to topic

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

### Testing Manual Updates (Development)

To test the manual update system during development:

1. **Open the app** in your browser (http://localhost:5500 or similar)
2. **Make a change** - Edit any file (e.g., add a comment to `index.html`)
3. **Update the version** in `sw.js`:
   ```javascript
   const CACHE_NAME = 'physics-audit-v2.10'; // Increment version
   const APP_VERSION = '2.10';
   ```
4. **Refresh the page** - Wait a few seconds
5. **Look for the badge** - Red pulsing badge should appear on settings icon
6. **Open Settings → Updates** - You should see "New version available!"
7. **Click "Install Update"** - Test the backup flow
8. **Verify reload** - App should reload with new version

**Important**: Updates are **always manual** now, even in development. No auto-reload happens.

**Console Messages to Watch For**:
```
🔄 Service Worker update found
🎉 New Service Worker installed!
📢 Update available - check Settings → Updates tab
```

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

### Load Times

| Scenario | Time | Notes |
|----------|------|-------|
| First load (JSON) | ~500ms | With good internet |
| First load (CSV fallback) | ~2-3s | Parses 15 CSV files |
| Cached load | ~100ms | Service Worker cache hit |
| Offline load | ~100ms | PWA installed |

---

## 🧪 Testing

### Manual Testing Checklist

**Login & Auth**
- [ ] Guest login works
- [ ] Auth persists on reload
- [ ] Logout clears data

**Navigation**
- [ ] Main menu loads
- [ ] Spec mode navigation works
- [ ] Paper mode navigation works
- [ ] Breadcrumb navigation works
- [ ] Search finds topics

**Confidence Rating**
- [ ] Can rate topics 1-5
- [ ] Ratings persist
- [ ] Toggle removes rating
- [ ] History tracked correctly

**Analytics**
- [ ] Dashboard loads
- [ ] Charts render
- [ ] Stats calculate correctly
- [ ] Critical topics listed
- [ ] Study velocity calculated

**Revision**
- [ ] Resources load for topics
- [ ] Videos/notes/sims display
- [ ] External links open correctly

**Settings Panel**
- [ ] Modal opens/closes correctly
- [ ] User info displays correctly
- [ ] All 6 tabs accessible (Account, Data, Preferences, About, Admin, Updates)
- [ ] Export CSV works
- [ ] Backup/restore data works
- [ ] Preferences save correctly
- [ ] Clear data confirms and works

**App Updates (Manual Control)**
- [ ] Badge appears on settings icon when update available
- [ ] Badge does NOT appear when no update available
- [ ] Updates tab shows current version
- [ ] "Check for Updates" button works
- [ ] Loading state shows while checking
- [ ] "Update available" message shows correctly
- [ ] "Install Update" button shows backup prompt
- [ ] "Backup & Update" creates backup then updates
- [ ] "Update Now" immediately updates (no backup)
- [ ] App reloads after update activation
- [ ] NO automatic reload when update detected
- [ ] Badge has pulsing animation

**Study Materials**
- [ ] Filter toggles work (All/Notes/Flashcards/Mindmaps)
- [ ] Appropriate empty state shows based on filter

**Topic Tagging**
- [ ] Tag selector modal opens/closes correctly
- [ ] Search filters topics correctly
- [ ] Topics grouped by section
- [ ] Click to add tag updates selection
- [ ] Click to remove tag updates selection
- [ ] Checkmarks show for selected tags
- [ ] Tags auto-assign from revision view
- [ ] Tag chips display topic ID and title
- [ ] Remove tag button (X) works
- [ ] Tags persist with notes/flashcards/mindmaps
- [ ] Tags appear at bottom of all editors
- [ ] Dark mode styling correct

**Note Editor**
- [ ] Modal opens/closes correctly
- [ ] Text formatting works (bold, italic, etc.)
- [ ] Color picker works
- [ ] Lists and alignment work
- [ ] Insert link/code/quote works
- [ ] Tags section appears at bottom
- [ ] Add Topic Tags button works
- [ ] Notes save and persist with tags
- [ ] Notes display correctly in revision view
- [ ] Edit/delete note buttons work

**Equation Editor**
- [ ] Equation editor button opens modal
- [ ] Modal closes with Cancel or X button
- [ ] Preview updates in real-time as typing
- [ ] Preview handles incomplete syntax gracefully (no errors shown)
- [ ] Smart auto-conversion works:
  - [ ] `/` converts to fraction after typing denominator
  - [ ] `*` converts to × symbol
  - [ ] `^23` wraps multi-digit exponents: ^{23}
- [ ] Common function buttons work (fraction, power, sqrt, etc.)
- [ ] Trig function buttons insert correctly (sin, cos, tan, etc.)
- [ ] Log function buttons insert correctly (log, ln, e^x, e)
- [ ] Greek letter buttons insert correctly
- [ ] Insert Equation adds equation to note
- [ ] Inserted equations display with KaTeX rendering
- [ ] Inserted equations have subtle purple background
- [ ] Double-click equation opens editor with original LaTeX
- [ ] Editing equation replaces original equation
- [ ] Dark mode styling correct in equation editor
- [ ] Textarea text color correct in dark mode (white/light)

**Flashcard Decks**
- [ ] Modal opens/closes correctly
- [ ] Deck name input works
- [ ] Can add multiple cards to deck
- [ ] Card preview shows correctly
- [ ] Can remove cards from deck
- [ ] Tags section appears at bottom
- [ ] Add Topic Tags button works
- [ ] Save creates/updates deck with tags
- [ ] Decks display in revision view
- [ ] Edit deck loads existing cards and tags
- [ ] Delete deck confirmation works
- [ ] Card count shows correctly

**Flashcard Test Mode**
- [ ] Test modal opens correctly
- [ ] 3D flip animation works
- [ ] Front shows question, back shows answer
- [ ] Previous/next navigation works
- [ ] Dot indicators work
- [ ] Shuffle randomizes order
- [ ] Progress counter accurate
- [ ] Test single deck works
- [ ] Test all decks works
- [ ] Dark mode styling correct

**Mindmap Editor**
- [ ] Canvas modal opens/closes correctly
- [ ] Title input works
- [ ] Tags section appears in toolbar
- [ ] Add Tags button works
- [ ] Tag chips display correctly in toolbar
- [ ] Double-click blank area opens node editor
- [ ] Double-click node opens edit mode
- [ ] Node editor has formatting toolbar (B/I/U, lists, indent)
- [ ] Rich text content saves correctly
- [ ] Nodes render on canvas with text preview
- [ ] Drag to move nodes works
- [ ] Ctrl+click to start connection (blue border shows)
- [ ] Connection preview line follows cursor
- [ ] Click second node completes connection (green border shows)
- [ ] Shift+drag to pan canvas works
- [ ] Scroll to zoom works
- [ ] Edit button modifies selected node
- [ ] Color button changes node color
- [ ] Delete button removes selected node
- [ ] Center button centers viewport
- [ ] Reset button resets viewport
- [ ] Nodes with rich content show indicator dot
- [ ] Mindmaps save and persist with tags
- [ ] Mindmaps display in revision view
- [ ] Edit/delete mindmap buttons work
- [ ] Node and connection counts show correctly
- [ ] Dark mode styling correct

**PWA**
- [ ] Works offline
- [ ] Can install to homescreen
- [ ] Service Worker registers
- [ ] Manual update control works (badge appears, no auto-reload)

**Dark Mode**
- [ ] Toggle works
- [ ] Preference persists
- [ ] All views support dark mode

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
- Check localStorage is enabled
- Check not in private/incognito mode
- Check localStorage quota not exceeded

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
- [ ] Remove console.logs (optional)
- [ ] **Test manual update flow**:
  - [ ] Increment version in `sw.js` (CACHE_NAME and APP_VERSION)
  - [ ] Deploy new version
  - [ ] Refresh app - verify badge appears (no auto-reload)
  - [ ] Open Settings → Updates - verify notification shows
  - [ ] Test "Check for Updates" button
  - [ ] Test "Backup & Update" flow
  - [ ] Verify app reloads after manual activation

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
| `section_paper` | Which exam paper | `Paper 1` or `Paper 2` | Used for filtering |
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
| `paper` | Which view mode | `Paper 1`, `Paper 2`, or `All Topics` | Controls where group appears |
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
   - Create dropdown lists for `section_paper` (Paper 1, Paper 2)
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
