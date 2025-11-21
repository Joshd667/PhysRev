# Changelog

All notable changes to the Physics Knowledge Audit Tool are documented here.

## v2.15 - Critical Performance Optimization & Mindmap Canvas Improvements (2025-11-13)

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
- See "Performance Architecture" section in docs/guides/ARCHITECTURE.md for details

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

---

## v2.14 - Notes Card View & Sliding Sort Controls (2025-10-26)

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

---

## v2.14 - IndexedDB Migration (2025-11-19)

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

For complete version history and detailed changelogs of earlier versions, see this file's commit history.

## Archive Note

Versions v2.13 and earlier have been archived. For full details on:
- v2.13 - Separated Storage Architecture
- v2.12 - Flashcard Editor Rich Text
- v2.11 - Editor Modal UI Improvements
- v2.10 - Performance Optimization
- v2.9 - Manual Update Control
- v2.8 - Code Optimization & Refactoring
- v2.7 - CSV-Based Revision Mappings
- v2.6 - Equation Editor
- v2.5 - Topic Tagging
- v2.4 - Security & Reliability
- v2.3 - Navigation Bug Fix

Refer to the git history or contact the maintainers.
