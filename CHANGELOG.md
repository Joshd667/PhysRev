# Changelog

**Major milestones for the Physics Knowledge Audit Tool.**

## Why This Format?

This changelog focuses on **major milestones** rather than detailed feature changes. For granular change history:
- **Recent changes**: See [GitHub commit history](https://github.com/Joshd667/PhysRev/commits/)
- **Pull requests**: See [GitHub PRs](https://github.com/Joshd667/PhysRev/pulls)
- **Code review**: Use `git log` or `git blame` for specific file changes

**Rationale:** A milestone-based changelog is easier to maintain, reduces duplication with git history, and focuses on user-impacting changes rather than implementation details.

---

## 2025-11-22 - Search & Display Improvements

**🔍 Search Navigation Overhaul**

Complete redesign of search result navigation to improve user workflow:
- **Knowledge Audit Integration**: Search results now navigate directly to Knowledge Audit revision sections
- **Smart Navigation**: Automatically opens the revision section for the first tag of clicked items
- **Visual Feedback**: Items are highlighted with blue background and smooth scroll
- **Auto-clear**: Highlights clear after 5 seconds or when interacting with buttons

**📊 Display & Filtering Enhancements**

Major improvements to how notes/flashcards/mindmaps are displayed and filtered:
- **Multi-Tag Support**: Items can now have tags from multiple papers/sections without crashes
- **ANY Tag Matching**: Items appear in revision sections if ANY of their tags match (not ALL)
- **Backward Compatibility**: Old notes from backups still work correctly via sectionId fallback
- **Context-Aware Filtering**: Only processes tags relevant to current view (paper/group/section)

**🛡️ Stability & Reactivity Fixes**

Comprehensive defensive programming to prevent Alpine.js rendering crashes:
- **Multi-layer Protection**: Guards at cached getters, grouping methods, and templates
- **Error Handling**: Try-catch blocks with logging prevent crashes from propagating
- **ID Validation**: All items filtered to ensure valid IDs before rendering
- **Data Structure Guards**: Early returns when required data (topicLookup, currentGroups) unavailable

**📱 UX Improvements**

- **Notes Pagination Removed**: Card view now shows all notes without "Load More" button
- **Tag Validation**: Requires at least one tag when creating notes/flashcards/mindmaps
- **Conditional Tag Auto-population**: Tags only auto-populate in Knowledge Audit, not standalone views
- **Note Preview Fixes**: Preview now closes cleanly when navigating between sections
- **Icon Rendering**: Lucide icons refresh correctly after pagination updates (flashcards)

**Technical Changes:**
- Removed pagination from notes card view (`templates/all-notes-view.html`)
- Added search navigation to Knowledge Audit (`js/features/search/index.js`)
- Implemented tag-based filtering in revision sections (`js/features/*/management.js`)
- Added defensive filtering throughout grouping logic (`js/features/*/display.js`)
- Added cached getter protection (`js/core/app.js`)
- Enhanced template computed properties with guards (`templates/*.html`)

**Files Modified:**
- Search: `js/features/search/index.js`
- Display: `js/features/notes/display.js`, `js/features/flashcards/display.js`, `js/features/mindmaps/display.js`
- Management: `js/features/notes/management.js`, `js/features/flashcards/management.js`, `js/features/mindmaps/management.js`
- Core: `js/core/app.js`, `js/core/watchers.js`, `js/utils/content-filter.js`
- Templates: `templates/all-notes-view.html`, `templates/all-flashcards-view.html`, `templates/all-mindmaps-view.html`
- Views: `js/features/views/index.js`

---

## 2025-11 - Comprehensive Documentation Overhaul

**📚 Developer & User Documentation Expansion**

Massively expanded and restructured project documentation to reflect current build state, improve developer onboarding, and clarify security risks.

**🛠️ Developer Tools Enhancement (2025-11-21)**

Implemented unified navigation across developer tools with consistent UX:
- **Toggle Navigation**: Tools ↔ Docs switcher on all tool pages with active state highlighting
- **Documentation Hub**: GitHub-style markdown viewer with syntax highlighting and auto-generated TOC
- **Consolidated CSV Converter**: Single unified tool with both server and local modes
- **Service Worker Exclusion**: Developer tools now bypass cache for always-fresh content
- **Visual Consistency**: All tools match main app styling with Tailwind CSS and Lucide icons

**New Documentation:**
- **[docs/guides/README.md](docs/guides/README.md)** - Comprehensive documentation index (NEW)
- **[CONSOLE_COMMANDS.md](docs/guides/CONSOLE_COMMANDS.md)** - Browser console debugging reference (NEW)
- **[TODO.md](docs/TODO.md)** - Outstanding tasks and known issues tracker (NEW)

**Expanded Guides:**
- **[DEPLOYMENT.md](docs/guides/DEPLOYMENT.md)** - 32 → 462 lines: Comprehensive production deployment guide
- **[TEAMS_AUTH_SETUP.md](docs/guides/TEAMS_AUTH_SETUP.md)** - 297 → 626 lines: Critical security warnings, implementation details
- **[TESTING.md](docs/guides/TESTING.md)** - 80 → 192 test items: Comprehensive testing coverage
- **[DEVELOPMENT.md](docs/guides/DEVELOPMENT.md)** - 281 → 622 lines: Complete developer onboarding guide
- **[PAGINATION_USAGE.md](docs/guides/PAGINATION_USAGE.md)** - Added current usage context

**Updated Documentation:**
- **[SECURITY.md](SECURITY.md)** - Updated to v2.0 with improved cohesiveness
- **[ARCHITECTURE.md](docs/guides/ARCHITECTURE.md)** - Clarity improvements
- **[CONTENT_MANAGEMENT.md](docs/guides/CONTENT_MANAGEMENT.md)** - Enhanced for teachers
- **[DATA_ARCHITECTURE.md](docs/guides/DATA_ARCHITECTURE.md)** - Technical implementation guide
- **[README.md](README.md)** - Updated navigation and categorization

**Key Improvements:**
- 📚 **Comprehensive documentation index** with audience-based navigation and topic organization
- ⚠️ **Critical security warnings** for Teams auth (ACTIVE but NON-FUNCTIONAL with placeholder credentials)
- 🔧 **BUILD_TIMESTAMP versioning** documented consistently across all guides
- 🧪 **192 comprehensive test items** covering security, performance, accessibility
- 🎨 **Console commands** consolidated into dedicated reference guide
- 📊 **Cross-referenced documentation** for easier navigation
- 🗺️ **Current build state** accurately reflected in all documentation

**Documentation Commits:**
- 5811c56 - Update SECURITY.md with current state
- 5f454f3 - Create CONSOLE_COMMANDS.md reference guide
- 6ef27bb - Expand DEVELOPMENT.md
- 343b1ec - Expand TESTING.md
- 764e07c - Expand TEAMS_AUTH_SETUP.md with security warnings
- 312f4b2 - Improve PAGINATION_USAGE.md
- 1684634 - Expand DEPLOYMENT.md
- 81674e2 - Add DATA_ARCHITECTURE.md
- 53329f1 - Improve CONTENT_MANAGEMENT.md
- f8a71fa - Clean up ATTRIBUTION.md
- 27addaf - Add TODO.md tracker

---

## v2.15 - Critical Performance Optimization (2025-11-13)

**⚡ Memory Optimization: 90% Reduction (1.2GB → 100-150MB)**

Fundamental architecture change to eliminate Alpine.js Proxy overhead on large static datasets:
- Moved 70MB of read-only specification data outside Alpine's reactive system
- Stored in module-level variables accessed via getter methods
- Result: 90% memory reduction, smooth navigation, mobile/tablet usability restored

**🎨 Mindmap Canvas Performance Overhaul**

Complete rewrite of canvas rendering and interaction system:
- **Canvas panning/zooming**: Hardware-accelerated CSS transforms (60fps, zero CPU overhead)
- **Event listeners**: Automatic cleanup on close (prevents memory leaks)
- **Memory limits**: Undo stack, test history, analytics limited to prevent unbounded growth
- **UI improvements**: Background panning, inline formatting, line style editing

**Technical Details:** See [ARCHITECTURE.md](docs/guides/ARCHITECTURE.md) for complete implementation details.

---

## v2.14 - UI Improvements & IndexedDB Migration (2025-10-26 to 2025-11-19)

**🎛️ UI Enhancements**
- **Sliding Sort Controls**: Compact slider button for flashcard/test-set sorting (date, count, attempts, score)
- **Notes Card View**: Responsive card grid with preview panel, inline actions, tag chips, timestamps
- **Reactive Data Fixes**: Alpine reactivity restored for card metrics, pin badges update instantly

**🗄️ IndexedDB Migration**
- **Major Storage Upgrade**: localStorage → IndexedDB (5-10MB → 100s of MB capacity)
- **Automatic Migration**: Seamless data migration on first load after update
- **Performance**: Asynchronous operations, transaction support, no quota errors
- **Benefits**: 10-50x more storage capacity, better foundation for future features

**Technical Details:** See commit history for implementation details.

---

## Archive - Versions v2.13 and Earlier

Older versions (v2.13, v2.12, v2.11, v2.10, v2.9, v2.8, v2.7, v2.6, v2.5, v2.4, v2.3) have been archived.

**For detailed change history:**
- **Git commits**: `git log --oneline --all` or [GitHub commit history](https://github.com/Joshd667/PhysRev/commits/)
- **Specific files**: `git log --follow <file_path>`
- **Date range**: `git log --since="2025-01-01" --until="2025-10-01"`

**Major archived milestones included:**
- Separated Storage Architecture, Flashcard Editor Rich Text, Editor Modal UI Improvements
- Performance Optimization, Manual Update Control, Code Optimization & Refactoring
- CSV-Based Revision Mappings, Equation Editor, Topic Tagging
- Security & Reliability, Navigation Bug Fix
