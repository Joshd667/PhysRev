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
  - **Rich Note Editor** - Create formatted notes with bold, italic, colors, lists, and more
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
│   │   │   └── editor.js      # Rich text editor methods
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
│   │   ├── settings/
│   │   │   └── index.js       # Settings & preferences
│   │   │
│   │   └── search/
│   │       └── index.js       # Search functionality
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── date.js           # Date formatting utilities
│   │   ├── statistics.js     # Statistics calculations
│   │   ├── storage.js        # localStorage helpers
│   │   └── ui.js             # UI utility methods
│   │
│   └── data/                  # Data configuration
│       ├── index.js          # Group configurations (paper/spec modes)
│       ├── revision-mappings.js # Topic-to-revision mappings
│       └── unified-csv-loader.js # CSV fallback loader
│
├── templates/                 # HTML component templates
│   ├── login-screen.html     # Login screen
│   ├── settings-modal.html   # Settings and data management
│   ├── note-editor-modal.html # Rich text note editor
│   ├── flashcard-editor-modal.html # Flashcard deck editor
│   ├── flashcard-test-modal.html # 3D flip card test interface
│   ├── mindmap-editor-modal.html # Canvas mindmap editor
│   ├── mindmap-node-editor.html # Rich text node editor
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
    ├── csv-converter.html         # Web-based CSV→JSON converter
    ├── csv-converter-local.html   # Local CSV→JSON converter (offline)
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
    ├─ Initialize revision mappings
    ├─ Load Alpine.js from CDN
    ├─ Load group configurations
    ├─ Load core/app.js (imports all features)
    └─ Load data (JSON first, CSV fallback)
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
Convert to app format
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
- **Account Management**: View user info, logout
- **Data Management**:
  - Quick access to Analytics Dashboard
  - Export data as CSV spreadsheet
  - Backup data (JSON format)
  - Import backup (guest mode only)
  - Clear all data with confirmation
- **Preferences**:
  - Default view mode (Spec/Paper)
  - Default paper selection
- **About**: App version and build info

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
- **Professional Interface**: Word-processor-style editor with multi-row toolbar
- **Dark Mode Support**: Full styling for both light and dark themes

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

#### Smart Filtering
- Filter view: All / Notes / Flashcards / Mindmaps
- Context-aware empty states based on active filter
- Seamless switching between material types

### Search
- Real-time fuzzy search across topics, learning objectives, and examples
- Relevance scoring
- Click to navigate directly to topic

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

### Optimizing Data Loading

For 10x faster loading, convert CSVs to JSON:

1. Open `tools/csv-converter-local.html` in your browser
2. Select all 15 CSV files (or drag & drop)
3. Click "Download combined-data.json"
4. Move file to `resources/combined-data.json`
5. Reload app - loads in ~200ms instead of ~2-3 seconds

---

## 📊 Performance Optimizations

| Optimization | Impact | Status |
|--------------|--------|--------|
| Login screen inlined | -1 HTTP request | ✅ Implemented |
| Auth module lazy loaded | -20KB initial load | ✅ Implemented |
| Teams auth lazy loaded | Loads only when needed | ✅ Implemented |
| Modular architecture | Smaller files, easier maintenance | ✅ v2.3 |
| Alpine.js version pinned | Reliability | ✅ Implemented |
| Scripts deferred | Faster first paint | ✅ Implemented |
| Templates loaded in parallel | Faster load | ✅ Implemented |
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
- [ ] Export CSV works
- [ ] Backup/restore data works
- [ ] Preferences save correctly
- [ ] Clear data confirms and works

**Study Materials**
- [ ] Filter toggles work (All/Notes/Flashcards/Mindmaps)
- [ ] Appropriate empty state shows based on filter

**Note Editor**
- [ ] Modal opens/closes correctly
- [ ] Text formatting works (bold, italic, etc.)
- [ ] Color picker works
- [ ] Lists and alignment work
- [ ] Insert link/code/quote works
- [ ] Notes save and persist
- [ ] Notes display correctly in revision view
- [ ] Edit/delete note buttons work

**Flashcard Decks**
- [ ] Modal opens/closes correctly
- [ ] Deck name input works
- [ ] Can add multiple cards to deck
- [ ] Card preview shows correctly
- [ ] Can remove cards from deck
- [ ] Save creates/updates deck
- [ ] Decks display in revision view
- [ ] Edit deck loads existing cards
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
- [ ] Mindmaps save and persist
- [ ] Mindmaps display in revision view
- [ ] Edit/delete mindmap buttons work
- [ ] Node and connection counts show correctly
- [ ] Dark mode styling correct

**PWA**
- [ ] Works offline
- [ ] Can install to homescreen
- [ ] Service Worker registers

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
