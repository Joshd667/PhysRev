# Console Logger Migration Guide

## Overview

This guide documents the migration from direct `console.*` calls to the production-safe `logger` utility.

**Status:** ✅ Logger utility created, ⏳ Migration in progress

**Files Updated:** 3 of 30 (10% complete)
**Remaining:** 132 console statements across 27 files

---

## Why This Change?

### Problems with Direct Console Usage

1. **Performance:** Console I/O is expensive in production
2. **Information Disclosure:** Debug logs may leak sensitive data
3. **Noise:** Production console should be clean
4. **No Control:** Can't disable/enable logging dynamically

### Benefits of Logger Utility

1. **✅ Conditional Logging:** Debug mode toggle
2. **✅ Environment Detection:** Auto-detects dev vs production
3. **✅ Performance:** Disabled logs have zero overhead
4. **✅ Flexibility:** Users can enable debug mode when needed
5. **✅ Clean Production:** Only errors logged by default

---

## Migration Strategy

### Quick Reference

```javascript
// OLD (Direct console)
console.log('Debug info');
console.warn('Warning message');
console.error('Error occurred');

// NEW (Logger utility)
import { logger } from './utils/logger.js';  // Add import

logger.log('Debug info');     // Only in debug mode
logger.warn('Warning message'); // Only in debug mode
logger.error('Error occurred'); // ALWAYS logged
```

### Step-by-Step Migration

**For Each File:**

1. **Add Import:**
   ```javascript
   import { logger } from './utils/logger.js';
   // OR if in js/utils/ already:
   import { logger } from './logger.js';
   ```

2. **Replace console calls:**
   - `console.log()` → `logger.log()`
   - `console.warn()` → `logger.warn()`
   - `console.error()` → `logger.error()` (keep errors!)
   - `console.info()` → `logger.info()`
   - `console.debug()` → `logger.debug()`

3. **Test the file:**
   - Verify no errors in console
   - Test with debug mode ON: `logger.enableDebug()`
   - Test with debug mode OFF: `logger.disableDebug()`

---

## Migration Status by File

### ✅ COMPLETED (3 files)

- [x] `js/utils/storage.js` (27 statements) - Sample conversion
- [x] `js/utils/logger.js` (0 statements) - New file
- [x] Tools created

### ⏳ HIGH PRIORITY (Should migrate first)

These files have the most console statements or are critical paths:

- [ ] `js/features/settings/index.js` (20 statements) - HIGH TRAFFIC
- [ ] `js/utils/indexeddb.js` (7 statements) - CORE FUNCTIONALITY
- [ ] `js/features/auth/data-management.js` (14 statements) - SECURITY CRITICAL
- [ ] `js/core/watchers.js` (7 statements) - CORE FUNCTIONALITY
- [ ] `js/features/mindmaps/canvas.js` (5 statements)
- [ ] `js/sw-registration.js` (5 statements)

### ⏳ MEDIUM PRIORITY

- [ ] `js/features/auth/index.js` (5 statements)
- [ ] `js/features/auth/teams.js` (4 statements)
- [ ] `js/app-loader.js` (5 statements)
- [ ] `js/features/flashcards/test.js` (3 statements)
- [ ] `js/core/app.js` (2 statements)
- [ ] `js/data/unified-csv-loader.js` (2 statements)
- [ ] `js/template-loader.js` (2 statements)
- [ ] `js/utils/csv-parser.js` (2 statements)
- [ ] `js/features/revision/resources.js` (2 statements)
- [ ] `js/features/mindmaps/management.js` (2 statements)
- [ ] `js/features/flashcards/management.js` (2 statements)
- [ ] `js/features/notes/equation-editor.js` (2 statements)
- [ ] `js/utils/search-index.js` (2 statements)

### ⏳ LOW PRIORITY (1-2 statements each)

- [ ] `index.html` (2 statements - in error boundary)
- [ ] `sw.js` (3 statements - Service Worker)
- [ ] `js/data/index.js` (1 statement)
- [ ] `js/features/analytics/insights.js` (1 statement)
- [ ] `js/features/notes/display.js` (1 statement)
- [ ] `js/features/notes/management.js` (1 statement)

### ℹ️ DOCUMENTATION/TOOLS (Can skip or handle separately)

- [ ] `tools/csv-converter-local.html` (2 statements)
- [ ] `tools/csv-converter-unified.html` (2 statements)
- [ ] `tools/csv-converter.html` (1 statement)
- [ ] `TESTING.md` (1 statement - documentation)

---

## Special Cases

### 1. Service Worker (`sw.js`)

Service Workers run in a separate context. Options:

**Option A:** Keep console statements (Service Worker logs are separate)
**Option B:** Create separate logger for Service Worker context
**Option C:** Import logger in Service Worker (requires module support)

**Recommendation:** Keep as-is for now. Service Worker console is separate and useful for debugging cache issues.

### 2. Error Boundary (`index.html`)

The global error boundary should ALWAYS log errors:

```javascript
// Keep as console.error() OR use logger.error()
window.addEventListener('error', (event) => {
    console.error('❌ Global error caught:', event.error);  // Keep this
});
```

**Recommendation:** Keep console.error() for error boundary to ensure errors are always visible.

### 3. Tool Files (`tools/*.html`)

These are developer tools, not user-facing. Console logs are expected.

**Recommendation:** Skip migration for tool files.

---

## Testing Checklist

After migrating each file:

- [ ] **Import added** correctly (check relative path)
- [ ] **No console errors** when page loads
- [ ] **Debug mode OFF**: Logs hidden except errors
  ```javascript
  logger.disableDebug();
  // Perform actions - should see no logs (except errors)
  ```
- [ ] **Debug mode ON**: All logs visible
  ```javascript
  logger.enableDebug();
  // Perform actions - should see all logs
  ```
- [ ] **Production test**: Verify on localhost vs file:// behavior

---

## Automated Migration (Optional)

For bulk find/replace, use this script:

```bash
#!/bin/bash
# migrate-console-to-logger.sh

# WARNING: Review changes carefully before committing!

for file in js/**/*.js; do
    if grep -q "console\." "$file"; then
        echo "Processing: $file"

        # Add import if not present
        if ! grep -q "import.*logger" "$file"; then
            # Calculate relative path to logger
            # (This is a simplified version - adjust path as needed)
            sed -i '1i import { logger } from "./utils/logger.js";\n' "$file"
        fi

        # Replace console calls
        sed -i 's/console\.log(/logger.log(/g' "$file"
        sed -i 's/console\.warn(/logger.warn(/g' "$file"
        sed -i 's/console\.error(/logger.error(/g' "$file"
        sed -i 's/console\.info(/logger.info(/g' "$file"
        sed -i 's/console\.debug(/logger.debug(/g' "$file"

        echo "  ✅ Updated $file"
    fi
done

echo "Migration complete! Review changes with git diff"
```

**⚠️ WARNING:** This script is DESTRUCTIVE. Test on one file first. Review all changes with `git diff` before committing.

---

## User Documentation

Update README.md to document debug mode:

```markdown
### Debug Mode

By default, the app only logs errors in production. To enable full debug logging:

**In Browser Console:**
```javascript
logger.enableDebug()  // Enable debug mode
logger.disableDebug() // Disable debug mode
```

**Or via localStorage:**
```javascript
localStorage.setItem('DEBUG', 'true')   // Enable
localStorage.removeItem('DEBUG')         // Disable
```

Debug mode persists across page reloads and is automatically enabled on localhost.
```

---

## Rollback Plan

If issues arise:

1. **Revert specific file:**
   ```bash
   git checkout HEAD -- path/to/file.js
   ```

2. **Revert all changes:**
   ```bash
   git checkout HEAD -- js/
   ```

3. **Remove logger.js:**
   ```bash
   rm js/utils/logger.js
   ```

---

## Progress Tracking

**Started:** 2025-01-20
**Target Completion:** 2025-02-01 (2 weeks)

**Weekly Goals:**
- Week 1: High priority files (20 statements → logger)
- Week 2: Medium priority files (40 statements → logger)
- Week 3: Low priority + cleanup (remaining)

**To update this document:**
Move files from ⏳ to ✅ sections as they're completed.

---

## Questions & Issues

**Q: What if logger.js isn't loaded yet?**
A: Add logger.js to critical resources in app-loader.js. It should load before other utilities.

**Q: Performance impact of logger check?**
A: Minimal. The `if (isDebugMode())` check is ~0.001ms. When debug is off, the function returns immediately.

**Q: Can we use logger in Service Worker?**
A: Yes, but requires Service Worker module support. Better to keep console.* in sw.js for now.

**Q: What about third-party libraries?**
A: Leave their console calls alone. We only control our code.

---

## Next Steps

1. **Immediate:**
   - [x] Create logger.js utility
   - [x] Update storage.js as example
   - [x] Create this migration guide

2. **This Week:**
   - [ ] Migrate high priority files (settings.js, indexeddb.js, data-management.js)
   - [ ] Test in production environment
   - [ ] Update README with debug mode documentation

3. **Next Week:**
   - [ ] Migrate medium priority files
   - [ ] Create automated test for logger
   - [ ] Document logger in code review checklist

4. **Future:**
   - [ ] Consider adding remote logging (optional)
   - [ ] Add log levels (verbose, info, warn, error)
   - [ ] Create logging dashboard (very optional)

---

## References

- Logger source: `js/utils/logger.js`
- Example migration: `js/utils/storage.js`
- Test logger: Open browser console → `logger.enableDebug()`
