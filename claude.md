# Claude Code - Physics Knowledge Audit Tool

**Purpose:** AI coding guide for this project - follow these patterns while coding
**Last Updated:** 2025-12-02

## Tech Stack (AI Context)

- **Frontend:** Alpine.js v3.13.3 (reactive framework with specific performance patterns)
- **Storage:** IndexedDB only (NOT localStorage except DEBUG flag)
- **Security:** DOMPurify v3.0.6 (global: `window.DOMPurify`)
- **PWA:** Service Worker with BUILD_TIMESTAMP versioning
- **Math:** KaTeX v0.16.9
- **Charts:** Chart.js v4.4.1
- **Architecture:** Fully client-side, static hosting only

---

## 🚨 XSS PREVENTION (CRITICAL)

### Rule: NEVER use innerHTML with user content without DOMPurify

```javascript
// ❌ WRONG
element.innerHTML = userNote.content;

// ✅ CORRECT
element.innerHTML = window.DOMPurify.sanitize(userNote.content);

// ✅ WITH CONFIG
element.innerHTML = window.DOMPurify.sanitize(userNote.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'span'],
    ALLOWED_ATTR: ['style'],
    ALLOW_DATA_ATTR: false
});

// ✅ WITH FALLBACK
if (window.DOMPurify) {
    element.innerHTML = DOMPurify.sanitize(userNote.content);
} else {
    element.textContent = userNote.content;
}
```

### Rule: ALWAYS escape user selections before HTML interpolation

```javascript
// ❌ WRONG
const selectedText = window.getSelection().toString();
const html = `<blockquote>${selectedText}</blockquote>`;

// ✅ CORRECT
const escapedText = this.escapeHtml(selectedText);
const html = `<blockquote>${escapedText}</blockquote>`;

// Utility (in notes/editor.js):
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### Critical Injection Points
- Notes content (`js/features/notes/`)
- Flashcards (`js/features/flashcards/`)
- Mindmap nodes (`js/features/mindmaps/canvas.js:876`)
- Search results (`js/features/search/`)
- User selections in editor

### Safe Without Sanitization (Acceptable)
- Template loading from `/templates/` (version-controlled)
- Error messages (system-generated, never echo user input)
- Math calculations (`Math.floor()`, `parseInt()`)
- KaTeX rendering (library sanitizes internally)

---

## 🔒 OTHER SECURITY RULES

### CSP Limitation
- App uses `unsafe-inline` and `unsafe-eval` (Alpine.js requirement)
- NEVER promise strict CSP - it will break Alpine.js
- XSS protection relies on DOMPurify

### Data Integrity
- ALWAYS use HMAC signing for IndexedDB writes
- Already implemented in `js/utils/data-integrity.js`

### Input Validation
- Confidence: 1-5 only
- Test scores: 0-100 only
- Check for `__proto__`, `constructor`, `prototype` in object keys

---

## ⚡ PERFORMANCE PATTERN 1: Non-Reactive Static Data

### Rule: NEVER put large read-only data in Alpine reactive state (causes 1.2GB bloat)

```javascript
// ❌ WRONG - Makes 50MB data reactive
return {
    specificationData: specData,  // 1.2GB memory usage
    ...state
};

// ✅ CORRECT - Module-level storage (js/core/app.js)
let staticSpecificationData = null;

export function createApp(specificationData, paperModeGroups, Alpine) {
    staticSpecificationData = specificationData;

    return () => ({
        ...createState(),
        get specificationData() { return staticSpecificationData; }
    });
}
```

### What to store where
**Non-Reactive (module-level):** Spec data, groups, topics, lookup maps (read-only)
**Reactive (Alpine state):** User notes/flashcards/mindmaps, confidence, analytics, UI state

## ⚡ PERFORMANCE PATTERN 2: Deduplication & Caching

### Rule: ALWAYS deduplicate multi-tag items (prevents Alpine crashes)

```javascript
// ✅ CORRECT Pattern (copy-paste ready)
x-data="{
    _cachedItems: null,
    _cacheKey: null,

    get allItems() {
        const currentKey = JSON.stringify(
            (groupedData || []).map(g => g.id + ':' + (g.sections || []).length)
        );
        if (this._cacheKey === currentKey && this._cachedItems) {
            return this._cachedItems;
        }
        this._cachedItems = window.flattenAndDeduplicate(groupedData, 'items');
        this._cacheKey = currentKey;
        return this._cachedItems;
    }
}"
```

### Rule: NEVER use nested x-for loops (flatten instead)

```html
<!-- ❌ WRONG -->
<template x-for="group in groupedData">
    <template x-for="section in group.sections">
        <template x-for="item in section.items">

<!-- ✅ CORRECT -->
<div x-data="{ get allItems() { return window.flattenAndDeduplicate(groupedData, 'items'); } }">
    <template x-for="item in allItems" :key="item.id">
```

### Files needing deduplication
- `templates/all-notes-view.html` ✅
- `templates/all-flashcards-view.html` ✅
- `templates/all-mindmaps-view.html` ✅

### Utilities
- `window.flattenAndDeduplicate(groupedData, itemsKey)`
- `window.deduplicateById(items)`
- `window.generateCardKey(deckId, card, index)`

## ⚡ PERFORMANCE PATTERN 3: Alpine.js :key Rule

### Rule: NEVER use array indices as :key (causes rendering bugs)

```html
<!-- ❌ WRONG - Index changes when filtered/reordered -->
<template x-for="(item, index) in items" :key="index">

<!-- ✅ CORRECT - Use stable ID -->
<template x-for="item in items" :key="item.id">

<!-- ✅ CORRECT - Use content-based key -->
<template x-for="(card, index) in cards" :key="window.generateCardKey(deckId, card, index)">

<!-- ✅ CORRECT - Use timestamp for history -->
<template x-for="change in history" :key="change.timestamp || change.id + '-' + index">
```

## ⚡ PERFORMANCE PATTERN 4: Alpine.js Getters

### Rule: Use getters for computed values (NEVER inline functions)

```javascript
// ❌ WRONG - Recalculates every render
<div x-text="items.filter(i => i.active).length"></div>

// ✅ CORRECT - Cached getter
x-data="{
    get activeCount() {
        return this.items.filter(i => i.active).length;
    }
}"
```

## ⚡ PERFORMANCE PATTERN 5: Service Worker Versioning

### Rule: ALWAYS increment BUILD_TIMESTAMP when code/templates change

```javascript
// sw.js line 1
const BUILD_TIMESTAMP = 'YYYYMMDD-NNN';  // Increment NNN
```

Forces cache refresh for all users.

---

## 💾 STORAGE RULES

- **ALWAYS use IndexedDB** for user data (NOT localStorage)
- **ONLY exception:** DEBUG flag in `logger.js`
- **Location:** `js/utils/indexeddb.js`
- **Web Worker:** Auto-used for data >100KB (`js/utils/storage-worker.js`)

---

## 🏗️ CODE ORGANIZATION

### Project Structure
```
js/
├── core/          # app.js (module-level static), state.js, watchers.js
├── features/      # notes/, flashcards/, mindmaps/, etc.
│   └── [feature]/index.js  # Facade exports only
├── utils/         # deduplication.js, indexeddb.js, storage.js
└── data/          # index.js (group configs), unified-csv-loader.js
```

### Rule: ALWAYS use facade pattern for features

```javascript
// js/features/your-feature/index.js
export { openEditor, saveItem, deleteItem } from './management.js';
export { displayItems } from './display.js';

// ❌ NEVER import from internals
import { saveItem } from './features/notes/management.js';  // WRONG

// ✅ ALWAYS import from facade
import { saveItem } from './features/notes/index.js';  // CORRECT
```

### Template Loading
```javascript
// Add template in js/template-loader.js
loadTemplate('your-template-id', './templates/your-template.html');

// Add injection point in index.html
<div id="your-template-id"></div>
```

---

## 🧪 TESTING (For AI Context)

### When adding user content display
```javascript
// Test with XSS payload - should NOT show alert
const xssTest = '<img src=x onerror="alert(\'XSS\')">test';
```

### Critical checklist
- Update `BUILD_TIMESTAMP` in `sw.js` if code/templates changed
- Full testing guide: `docs/TESTING.md`

---

## 🚀 DEPLOYMENT (AI Context)

### Production Requirements
- **MUST** use `combined-data.json` (NOT CSV files)
- Generate: `node tools/csv-to-json.js`
- **MUST** increment BUILD_TIMESTAMP in sw.js
- **MUST** be served over HTTPS (Service Worker requirement)

Full deployment guide: `docs/DEPLOYMENT.md`

---

## ❌ NEVER DO (Critical Rules)

**Security:**
1. NEVER use `innerHTML` without DOMPurify on user content
2. NEVER store sensitive data in localStorage (IndexedDB only)
3. NEVER promise strict CSP (Alpine.js requires unsafe-inline)
4. NEVER skip input validation (confidence: 1-5, scores: 0-100)
5. NEVER commit secrets

**Performance:**
6. NEVER put large static data in Alpine reactive state (module-level only)
7. NEVER use functions in Alpine templates (getters only)
8. NEVER create nested x-for loops (flatten with deduplication)
9. NEVER use array index as :key (causes rendering bugs - see Pattern 3)
10. NEVER modify static data (read-only by design)

**Code Organization:**
11. NEVER import from feature internals (facade only)
12. NEVER change code/templates without updating BUILD_TIMESTAMP
13. NEVER use eval() or Function() constructor
14. NEVER skip deduplication for multi-tag items
15. NEVER use localStorage for user data (IndexedDB only)

**Deployment:**
16. NEVER deploy without combined-data.json
17. NEVER skip BUILD_TIMESTAMP increment
18. NEVER use unpinned CDN versions (e.g., `@latest`)

**Alpine.js:**
19. NEVER call Alpine methods from outside Alpine context
20. NEVER mutate static data from Alpine components

---

## 💡 CODE PATTERNS (Quick Reference)

### Error Handling
```javascript
import { logger } from './utils/logger.js';

try {
    await saveNote(noteData);
} catch (error) {
    logger.error('Failed to save note', error);
    showErrorMessage('Could not save note. Please try again.');
}
```

### IndexedDB Operations
```javascript
import { db } from './utils/indexeddb.js';
await db.saveNotes(notes);
const notes = await db.loadNotes();
```

### Storage Abstraction (auto-uses Web Worker for >100KB)
```javascript
import { storage } from './utils/storage.js';
await storage.save('key', largeData);
const data = await storage.load('key');
```

### Alpine.js Cached Getter Pattern
```javascript
x-data="{
    items: [],
    _cached: null,
    _cacheKey: null,

    get filtered() {
        const key = this.filter;
        if (this._cacheKey === key && this._cached) return this._cached;
        this._cached = this.items.filter(...);
        this._cacheKey = key;
        return this._cached;
    },

    addItem(item) {
        this.items.push(item);
        this._cacheKey = null;  // Invalidate cache
    }
}"
```

---

## 📚 REFERENCE DOCS (For More Detail)

**Core:**
- `SECURITY.md` - Security requirements and audit results
- `docs/ARCHITECTURE.md` - System architecture
- `docs/PERFORMANCE.md` - Performance optimization
- `docs/TESTING.md` - Testing procedures
- `docs/DEPLOYMENT.md` - Deployment checklist

**Features:**
- `docs/CONTENT_MANAGEMENT.md` - Managing CSV data
- `docs/DATA_ARCHITECTURE.md` - Data loading system

---

## 🎯 QUICK TASK CHECKLISTS

### Adding User Content Display
1. Sanitize with `window.DOMPurify.sanitize()` before `innerHTML`
2. Test with `'<img src=x onerror="alert(\'XSS\')">'`
3. Update BUILD_TIMESTAMP

### Adding New Feature
1. Create `js/features/your-feature/` with `index.js` facade
2. Import in `js/core/app.js`
3. Create `templates/your-feature.html`
4. Register in `js/template-loader.js`
5. Update BUILD_TIMESTAMP

### Optimizing Lists
1. Check if multi-tag → use `window.flattenAndDeduplicate()`
2. Add caching pattern (see Pattern 2)
3. Use stable `:key` (NOT array index)
4. Update BUILD_TIMESTAMP

### Modifying Data
1. Update CSV in `resources/`
2. Regenerate: `node tools/csv-to-json.js`
3. Update BUILD_TIMESTAMP

---

## 🔐 AUTH STATUS

- **Current:** Guest mode only
- **Teams:** DISABLED (placeholder credentials only)
- **NEVER** re-enable Teams without real Azure AD credentials
- **NEVER** store auth tokens in localStorage (IndexedDB only)

---

**Last Updated:** 2025-12-02
**This is an AI coding guide - follow these patterns while coding**
