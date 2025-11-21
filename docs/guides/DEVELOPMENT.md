# Development Guide

**For Developers**

This guide covers local development workflow, debugging tools, and best practices for contributing to the Physics Knowledge Audit Tool.

---

## Prerequisites

- **Modern web browser** (Chrome recommended for DevTools)
- **Local web server** (required for CORS compliance - see options below)
- **Node.js 16+** (optional, only needed for running automated tests)
- **Git** (for version control)

---

## Quick Start

### Method 1: Python HTTP Server (Recommended)

```bash
# Navigate to project directory
cd PhysRev

# Start local server on port 8000
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

### Method 2: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Method 3: Node HTTP Server

```bash
npm install -g http-server
http-server -p 8000
# Open http://localhost:8000
```

**Why localhost?** The app uses ES6 modules which require a web server. The `file://` protocol won't work due to CORS restrictions.

---

## Testing

**Comprehensive Testing:** See **[TESTING.md](TESTING.md)** for full manual and automated testing procedures.

**Quick Test Commands:**
```bash
npm install           # Install test dependencies (first time only)
npm test              # Run full test suite
npm run test:ui       # Interactive test UI (recommended)
npm run test:coverage # Generate coverage report
```

**Manual Testing Checklist:**
- Guest login works
- Navigation between views works
- Confidence rating persists
- Notes/flashcards/mindmaps save correctly
- Search works
- Dark mode toggle works
- Offline mode works (after first visit)

See [TESTING.md](TESTING.md) for complete checklist.

---

## Data Loading & Performance

**For Development:** The app loads 16 CSV files by default. This is fine for development but slow for production.

**For Production:** Generate `combined-data.json` for 10x faster loading (1 request instead of 16).

**See [DEPLOYMENT.md](DEPLOYMENT.md#1-generate-optimized-data-file)** for complete instructions on using `tools/csv-converter.html`.

**When to regenerate:**
- After updating any CSV file in `resources/`
- Before deploying to production
- When testing production performance

---

## Browser Console Commands

The app provides numerous browser console commands for debugging and development.

**Quick Reference:**
```javascript
logger.enableDebug()           // Enable verbose logging
getStorageStats()              // View storage usage
clearAllAppStorage()           // Clear all data
navigator.serviceWorker.getRegistration()  // Check SW status
physicsAuditApp                // Access app instance
```

**See [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md)** for comprehensive console command reference including:
- Debug logging commands
- Storage management commands
- Service Worker debugging
- Performance profiling
- Data access and inspection
- Common debugging workflows

---

## Service Worker Development

The app uses a Service Worker (`sw.js`) for offline support and manual update control.

### Versioning

**Current format:** `BUILD_TIMESTAMP` (line 1 of sw.js)
```javascript
const BUILD_TIMESTAMP = '20250120-001';  // Format: YYYYMMDD-NNN
```

**When to increment:**
- ✅ Any code changes (JS, CSS, HTML)
- ✅ Template changes
- ✅ Data changes (combined-data.json)
- ❌ External resource updates (those don't cache)

**How to increment:**
1. Open `sw.js`
2. Line 1: Increment the number (e.g., `20250120-001` → `20250120-002`)
3. Save file
4. Refresh browser - new version detected
5. Badge appears on settings icon (manual update control)

### Testing Updates Locally

1. Make changes to code
2. Update BUILD_TIMESTAMP in `sw.js` line 1
3. Refresh page (Ctrl+R)
4. Wait 2-3 seconds for Service Worker to detect update
5. Red badge appears on settings icon
6. Click badge → Settings → Updates tab
7. Test "Backup & Update" or "Update Now"
8. Verify app reloads with new version

**See [TESTING.md](TESTING.md#testing-manual-updates-development)** for detailed update testing procedures.

### Debugging Service Worker

**DevTools Panel:**
- Go to DevTools → Application → Service Workers
- See active/waiting workers
- "Update on reload" checkbox (disable for testing manual updates)
- "Bypass for network" checkbox (for debugging)
- "Unregister" button (clean slate)

**Console Commands:** See [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#service-worker-commands) for:
- Check registration status
- Force update check
- Unregister Service Worker
- Monitor state changes

---

## Architecture Overview

For detailed architecture documentation, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

**Key Points:**
- **Alpine.js** - Reactive UI framework
- **IndexedDB** - User data storage (100s of MB capacity)
- **Service Worker** - Offline support & caching
- **Module-based** - Features organized in `js/features/`
- **Non-reactive static data** - Performance optimization (90% memory reduction)

---

## Project Structure

```
├── index.html              # Entry point
├── sw.js                   # Service Worker
├── js/
│   ├── core/              # Core app (app.js, state.js, watchers.js)
│   ├── features/          # Feature modules (auth, notes, flashcards, etc.)
│   ├── utils/             # Shared utilities
│   └── data/              # Data loading
├── templates/             # HTML templates
├── resources/             # CSV data & combined-data.json
├── css/                   # Custom styles
└── tools/                 # Development utilities
```

---

## Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- Feature branches - `feature/your-feature-name`
- Bug fixes - `fix/bug-description`

**Typical Workflow:**
```bash
# Create feature branch
git checkout -b feature/my-new-feature

# Make changes, commit frequently
git add .
git commit -m "Add feature X"

# Push to remote
git push -u origin feature/my-new-feature

# Create pull request on GitHub
# After review and approval, merge to main
```

**Commit Messages:**
- Use clear, descriptive messages
- Start with verb: "Add", "Fix", "Update", "Remove", "Refactor"
- Example: "Add pagination to notes list" not "changes"
- Include context if needed

**Before Committing:**
- [ ] Test your changes locally
- [ ] Update BUILD_TIMESTAMP if needed (code/template changes)
- [ ] Run `npm test` if you changed JS
- [ ] Hard refresh browser to verify changes work
- [ ] Check console for errors (F12)

---

## Common Development Tasks

### Adding a New Feature

**Example:** Adding a new study material type

1. **Create feature module:**
   ```
   js/features/your-feature/
   ├── index.js        # Facade (exports public methods)
   ├── display.js      # Display logic
   ├── editor.js       # Editor logic
   └── management.js   # CRUD operations
   ```

2. **Export methods from `index.js`** (facade pattern):
   ```javascript
   export { openEditor, saveItem, deleteItem } from './management.js';
   export { displayItems } from './display.js';
   ```

3. **Import in `js/core/app.js`:**
   ```javascript
   import * as yourFeature from '../features/your-feature/index.js';
   ```

4. **Add to app return object:**
   ```javascript
   return {
       // Existing features...
       ...yourFeature,
       // Your methods are now available in Alpine
   };
   ```

5. **Create template in `templates/`:**
   ```html
   <!-- templates/your-feature.html -->
   <div x-show="viewType === 'yourfeature'">
       <!-- Your feature UI -->
   </div>
   ```

6. **Load template in `js/template-loader.js`:**
   ```javascript
   loadTemplate('your-feature-id', './templates/your-feature.html'),
   ```

7. **Add navigation (if needed)** in `templates/sidebar.html`

8. **Test thoroughly** - see [TESTING.md](TESTING.md)

### Modifying CSV Data

**For Teachers/Content Creators:** See **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)**

**For Developers:**
1. Edit CSV files in `resources/subject-cards/` or `resources/revision/`
2. If adding new CSV file, register it in `js/data/unified-csv-loader.js`
3. Test with CSV loading: Hard refresh browser
4. **Before deployment:** Generate `combined-data.json` (see [DEPLOYMENT.md](DEPLOYMENT.md))

### Adding Paper 3 Content

**Status:** UI exists (button, navigation, filtering) but content is TODO.

**Steps:**
1. Add Paper 3 groups to `resources/groups.csv`
2. Create CSV files (e.g., `astrophysics.csv`) in `resources/subject-cards/`
3. Register new CSVs in `js/data/unified-csv-loader.js` (if created new files)
4. Add revision resources in `resources/revision/`
5. Test Paper 3 button shows content

**See [TODO.md](../TODO.md#paper-3-support)** for detailed instructions.

### Working with Pagination

The app uses pagination for large lists (notes, flashcards, search results).

**Current Usage:**
- Notes: 30 initial, 15 increment
- Flashcards: 30 initial, 15 increment
- Search: Dynamic

**To add pagination to a new list:**
```html
<div x-data="$paginated(yourItems, 50, 25)">
    <template x-for="item in visibleItems" :key="item.id">
        <!-- Your item template -->
    </template>

    <button x-show="hasMore" @click="loadMore()">
        Load More (<span x-text="remainingCount"></span> remaining)
    </button>
</div>
```

**See [PAGINATION_USAGE.md](PAGINATION_USAGE.md)** for complete documentation.

### Performance Profiling

**Using Browser DevTools:**
1. Open DevTools → Performance tab
2. Click Record button
3. Perform action you want to profile
4. Stop recording
5. Analyze flame graph and timings

**Memory Profiling:**
1. DevTools → Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare to find leaks

**Performance API:** See [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#performance-profiling) for:
- Performance marks and measures
- Network timing commands
- Memory profiling commands

---

## Troubleshooting

### App shows blank screen

- **Check**: Browser console for errors (F12)
- **Fix**: Verify all CSV files exist in `resources/`
- **Fix**: Clear Service Worker cache (Force Refresh)

### "Failed to load resources" error

- **Check**: Are you using `file://` protocol?
- **Fix**: Must use local web server (http://localhost)
- **Why**: CORS restrictions prevent file:// from loading modules

### Service Worker not registering

- **Check**: Are you on localhost or HTTPS?
- **Fix**: Service Workers require secure context
- **Dev**: Use `localhost` or `127.0.0.1`

### Data not persisting

- **Check**: Is IndexedDB enabled in browser?
- **Check**: Are you in private/incognito mode?
- **Fix**: Use normal browsing mode
- **Debug**: Check DevTools → Application → IndexedDB

### Teams Login Button Shows But Fails

- **Status**: Teams auth currently uses placeholder credentials
- **Expected**: Button will fail with "Application not found" error
- **Fix**: Disable the button (see [TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md))
- **For Users**: Use Guest mode (fully functional)

### Paper 3 Shows No Content

- **Status**: Paper 3 UI exists but content not added yet
- **Expected**: "No content yet" message shows
- **To Add Content**: See [TODO.md](../TODO.md#paper-3-support) and [CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)

---

## Best Practices

### Code Style

- **ES6+ Syntax**: Use modern features (modules, arrow functions, destructuring, template literals)
- **Consistent Patterns**: Follow facade pattern for feature modules
- **JSDoc Comments**: Document public functions with types and descriptions
- **File Size**: Keep files focused - split if > 500 lines
- **Naming**: Use descriptive names - `handleUserLogin()` not `doThing()`
- **Constants**: Use UPPER_SNAKE_CASE for constants

**Example:**
```javascript
/**
 * Opens the note editor for creating or editing a note
 * @param {string|null} noteId - Note ID to edit, or null for new note
 */
export function openNoteEditor(noteId = null) {
    // Implementation...
}
```

### State Management

- **Reactive Data** (Alpine.js): User preferences, UI state, user-created content
  - Stored in `js/core/state.js`
  - Persisted to IndexedDB
  - Example: `ratings`, `notes`, `flashcardDecks`

- **Non-Reactive Data**: Topic metadata, CSV data, static configuration
  - Stored as module-level variables
  - Loaded once at startup
  - Example: `topics`, `revisionSections`, `groups`

**Why?** Non-reactive static data = 90% memory reduction

### Performance

- **Lazy Load**: Only load heavy features when needed (e.g., Teams auth, mindmap editor)
- **Debounce**: Expensive operations like search, analytics recalculation
- **Pagination**: Use for lists > 30 items (see [PAGINATION_USAGE.md](PAGINATION_USAGE.md))
- **requestIdleCallback**: For non-critical work (background processing)
- **Cleanup**: Always remove event listeners and clear timers in cleanup functions

**Example:**
```javascript
// Debounced search
let searchTimeout;
function onSearchInput(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(query), 300);
}
```

### Security

**CRITICAL - User Input Sanitization:**
- **All user HTML content** → DOMPurify
  - Notes editor: `DOMPurify.sanitize(content, NOTES_CONFIG)`
  - Flashcards: `DOMPurify.sanitize(content, FLASHCARD_CONFIG)`
  - Mindmaps: `DOMPurify.sanitize(content, MINDMAP_CONFIG)`

- **Never use:**
  - `eval()` with user data
  - `innerHTML` with unsanitized content
  - `new Function()` with user input

- **Always validate:**
  - Imported JSON structure
  - CSV data format
  - External resource URLs

**See:**
- [SECURITY.md](../../SECURITY.md) - Security policy
- `docs/audits/xss-audit.md` - XSS protection audit
- `docs/audits/localstorage-security-audit.md` - Storage security

### Accessibility

- Use semantic HTML (`<button>` not `<div onclick>`)
- Add ARIA labels where needed
- Ensure keyboard navigation works (Tab, Enter, Esc)
- Test focus trapping in modals
- Maintain WCAG AA color contrast
- Add alt text to images

### Testing

- Write tests for new features (see `tests/` directory)
- Run `npm test` before committing
- Manual test checklist for UI features (see [TESTING.md](TESTING.md))
- Test in multiple browsers
- Test dark mode
- Test offline mode (Service Worker)

---

## Tools & Utilities

**Developer tools dashboard:** `tools/index.html` - Centralized hub with toggle navigation between Tools and Docs sections

**Navigation Features:**
- **Tools ↔ Docs Toggle**: Consistent navigation switcher on all tool pages with active state highlighting
- **Always Fresh**: Tools directory bypasses Service Worker cache for latest content
- **Visual Consistency**: All tools match main app styling (Tailwind CSS + Lucide icons)

**Available Tools:**

**Documentation System:**
- **documentation.html** - Visual documentation hub organized by role (Educators, Developers, Admins)
- **markdown-viewer.html** - GitHub-style markdown renderer with syntax highlighting, auto-generated TOC, and dark mode

**Development Tools:**
- **csv-converter.html** - Unified CSV to JSON converter with server and local modes (10x faster loading)
- **test-imports.html** - Test JavaScript module imports for debugging
- **generate-sri-hashes.js** - Generate SRI hashes for CDN resources (Node.js CLI tool)

**See [tools/README.md](../../tools/README.md)** for complete tool documentation and usage workflows.

**Located at project root:**

- **auth-callback.html** - OAuth redirect endpoint for Teams auth (part of auth flow, not a dev tool)

---

## Related Documentation

**Essential Reading:**
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture, patterns, data flow
- **[CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md)** - Browser console debugging reference
- **[TESTING.md](TESTING.md)** - Comprehensive testing procedures
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[SECURITY.md](../../SECURITY.md)** - Security policy and guidelines

**Feature-Specific:**
- **[PAGINATION_USAGE.md](PAGINATION_USAGE.md)** - Using the pagination system
- **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)** - Managing CSV data (for teachers)
- **[DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md)** - Technical data implementation
- **[TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md)** - Microsoft Teams authentication setup

**Reference:**
- **[TODO.md](../TODO.md)** - Outstanding tasks and known issues
- **Security Audits** - `docs/audits/` directory

---

## External Resources

**Technologies:**
- [Alpine.js Documentation](https://alpinejs.dev/) - Reactive UI framework
- [TailwindCSS Documentation](https://tailwindcss.com/) - Utility-first CSS
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Chart.js](https://www.chartjs.org/) - Charting library
- [KaTeX](https://katex.org/) - Math rendering
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitization

**Browser APIs:**
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Client-side storage
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) - Offline support
- [PWA Documentation](https://web.dev/progressive-web-apps/) - Progressive Web Apps

---

## Getting Help

**Development Issues:**
1. **Check browser console** (F12) for errors
2. **Review troubleshooting** section above
3. **Check documentation** - likely in ARCHITECTURE.md or specific feature docs
4. **Search codebase** for similar patterns
5. **Ask questions** - open an issue or discussion

**Testing Issues:**
- See [TESTING.md](TESTING.md) - Comprehensive testing guide
- Check `tests/` directory for examples

**Security Concerns:**
- See [SECURITY.md](../../SECURITY.md)
- Review audits in `docs/audits/`

**Architecture Questions:**
- See [ARCHITECTURE.md](ARCHITECTURE.md)
- Check JSDoc comments in code

---

**Built for A-Level Physics Students**
**Contributions Welcome!**
