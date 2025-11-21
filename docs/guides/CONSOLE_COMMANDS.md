# Browser Console Commands Reference

**For Developers**

This guide provides a comprehensive reference of all browser console commands available for development and debugging of the Physics Knowledge Audit Tool.

---

## Quick Reference

| Category | Command | Purpose |
|----------|---------|---------|
| **Debug Mode** | `logger.enableDebug()` | Enable verbose logging |
| **Storage** | `getStorageStats()` | View storage usage |
| **Service Worker** | `navigator.serviceWorker.getRegistration()` | Check SW status |
| **Performance** | `performance.mark('start')` | Profile performance |
| **App State** | `physicsAuditApp` | Access app instance |
| **Data** | `clearAllAppStorage()` | Clear all app data |

---

## Debug Logging

The app uses a production-safe logger utility (`js/utils/logger.js`) that conditionally logs messages based on debug mode.

### Enable/Disable Debug Mode

```javascript
// Toggle debug mode
logger.enableDebug()    // Enable detailed logging
logger.disableDebug()   // Disable (production mode)

// Check current state
logger.isDebugEnabled()  // Returns true/false

// Alternative: Use localStorage directly
localStorage.setItem('DEBUG', 'true')   // Enable
localStorage.removeItem('DEBUG')        // Disable

// Alternative: Use window variable
window.DEBUG = true     // Enable
window.DEBUG = false    // Disable
```

**How it works:**
- **Development** (localhost): All logs visible by default
- **Production**: Only errors logged by default
- **Debug mode ON**: All logs visible everywhere
- **Debug mode persists** across page reloads (stored in localStorage)

### Logger API (for use in code)

```javascript
import { logger } from './utils/logger.js';

logger.log('Info message')      // Only in debug mode
logger.warn('Warning')          // Only in debug mode
logger.error('Error!')          // ALWAYS logged (critical)
logger.info('Information')      // Only in debug mode
logger.debug('Debug details')   // Only in debug mode
```

The `logger` object is available globally in the browser console.

---

## Storage Management

### View Storage Statistics

```javascript
// Get detailed storage information
getStorageStats()

// Returns information about:
// - IndexedDB usage
// - localStorage usage
// - Cache storage usage
// - Service Worker cache details
```

### Clear All Data

```javascript
// Clear all app data (IndexedDB, localStorage, caches)
clearAllAppStorage()

// This will:
// - Clear IndexedDB (physicsAuditDB)
// - Clear localStorage
// - Clear Service Worker caches
// - Prompt for confirmation
```

### Clear Service Worker Cache Only

```javascript
// Clear only Service Worker cache (keeps user data)
clearSWCache()

// This will:
// - Delete all Service Worker caches
// - Keep IndexedDB and localStorage intact
// - Useful for testing cache updates
```

### Manual Storage Inspection

**IndexedDB:**
```javascript
// Access via DevTools
// DevTools → Application → IndexedDB → physicsAuditDB

// Or programmatically
indexedDB.databases().then(console.log)  // List all databases
```

**localStorage:**
```javascript
// View all localStorage items
console.table(localStorage)

// Get specific item
localStorage.getItem('physicsAuditData_guest')

// Set item
localStorage.setItem('key', 'value')

// Remove item
localStorage.removeItem('key')
```

---

## Service Worker Commands

### Check Registration Status

```javascript
// Get Service Worker registration
navigator.serviceWorker.getRegistration()

// Returns Promise<ServiceWorkerRegistration>
// Example output:
// {
//   active: ServiceWorker,
//   installing: null,
//   waiting: ServiceWorker | null,
//   scope: "https://yourdomain.com/",
//   updateViaCache: "imports"
// }
```

### Force Update Check

```javascript
// Manually check for Service Worker updates
navigator.serviceWorker.getRegistration()
    .then(reg => reg.update())
    .then(() => console.log('Update check complete'))

// Or in one line
navigator.serviceWorker.getRegistration().then(reg => reg.update())
```

### Unregister Service Worker

```javascript
// Unregister Service Worker (for testing clean slate)
navigator.serviceWorker.getRegistration()
    .then(reg => reg.unregister())
    .then(() => console.log('Service Worker unregistered'))

// Or in one line
navigator.serviceWorker.getRegistration().then(reg => reg.unregister())

// After unregistering, hard refresh (Ctrl+Shift+R) to reload without SW
```

### Get Service Worker Version

```javascript
// Check current Service Worker version
navigator.serviceWorker.getRegistration()
    .then(reg => {
        if (reg && reg.active) {
            // Version is in sw.js BUILD_TIMESTAMP constant
            console.log('Service Worker active');
        }
    })

// Check app version from settings
window.appUpdateState?.currentVersion  // Returns BUILD_TIMESTAMP value
```

### Monitor Service Worker State Changes

```javascript
// Listen for Service Worker state changes
navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed');
});

// Listen for update found
navigator.serviceWorker.addEventListener('updatefound', () => {
    console.log('Service Worker update found');
});
```

---

## Performance Profiling

### Performance Marks and Measures

```javascript
// Mark the start of an operation
performance.mark('start')

// ... do something expensive ...

// Mark the end
performance.mark('end')

// Measure the duration
performance.measure('task', 'start', 'end')

// Get the measurement
const measure = performance.getEntriesByName('task')[0]
console.log(`Duration: ${measure.duration}ms`)

// Clear marks
performance.clearMarks()
performance.clearMeasures()
```

### Measure Specific Operations

```javascript
// Example: Measure data loading time
performance.mark('data-load-start')

// Load data...
await loadAllData()

performance.mark('data-load-end')
performance.measure('data-loading', 'data-load-start', 'data-load-end')
console.log(performance.getEntriesByName('data-loading')[0].duration + 'ms')
```

### Network Timing

```javascript
// Get navigation timing
performance.getEntriesByType('navigation')[0]

// Returns detailed timing info:
// - domContentLoadedEventEnd
// - loadEventEnd
// - responseEnd
// - etc.

// Get resource timing
performance.getEntriesByType('resource')

// Returns all network requests with timing data
```

### Memory Profiling

```javascript
// Check memory usage (Chrome only)
console.log(performance.memory)

// Returns:
// {
//   usedJSHeapSize: 12345678,  // Bytes used
//   totalJSHeapSize: 23456789, // Bytes allocated
//   jsHeapSizeLimit: 2172649472 // Max heap size
// }
```

---

## App State & Data Access

### Access App Instance

```javascript
// Get the main app instance
physicsAuditApp

// Access app data
physicsAuditApp.ratings           // All topic ratings
physicsAuditApp.notes             // All notes
physicsAuditApp.flashcardDecks    // All flashcard decks
physicsAuditApp.mindmaps          // All mindmaps
physicsAuditApp.user              // Current user info
physicsAuditApp.darkMode          // Dark mode state
physicsAuditApp.viewType          // Current view ('spec', 'paper1', etc.)

// Example: Count total ratings
Object.keys(physicsAuditApp.ratings).length

// Example: Find all 5-star ratings
Object.entries(physicsAuditApp.ratings)
    .filter(([id, rating]) => rating.level === 5)
    .map(([id]) => id)
```

### Access Alpine.js Instance

```javascript
// Get Alpine.js instance
Alpine

// Useful for debugging reactive data
Alpine.store('yourStore')  // If using Alpine stores

// Access component data from element
// 1. Inspect element in DevTools
// 2. In console:
$0.__x  // Alpine component data for selected element
```

### Access Data Mappings

```javascript
// Get revision resources for a section
getResourcesForSection('1.1')  // Returns resources for section 1.1

// Access revision mapping
revisionMapping                 // Topic ID → Revision section mapping

// Access topic to section mapping
topicToSectionMapping          // Topic ID → Section ID mapping

// Access revision section titles
revisionSectionTitles          // Section ID → Title mapping
```

---

## PWA Installation

### Install as PWA

```javascript
// Trigger PWA install prompt (if available)
installPWA()

// This will:
// - Show the "Add to Home Screen" prompt
// - Only works if install prompt was deferred
// - Returns Promise<boolean> (true if installed)
```

### Check Install Prompt Status

```javascript
// Check if install prompt is available
window.deferredInstallPrompt !== null  // true if available

// The prompt is only available once per session
// and only if app meets PWA criteria
```

---

## Network & Data Loading

### Test Data Loading

```javascript
// Force reload from network (bypass cache)
location.reload(true)

// Or hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### Check Loaded Resources

```javascript
// List all loaded scripts
Array.from(document.scripts).map(s => s.src)

// List all stylesheets
Array.from(document.styleSheets).map(s => s.href)

// Check if specific module loaded
import('./js/core/app.js').then(console.log)
```

---

## Debugging UI Components

### Access Component State

```javascript
// Select element in DevTools, then in console:
$0.__x                    // Alpine component data
$0.__x.$data             // Reactive data object
$0.__x_effects           // Effect tracking

// Or use Alpine DevTools extension (recommended)
```

### Trigger Alpine Events

```javascript
// Dispatch custom event
window.dispatchEvent(new CustomEvent('update-available'))

// Trigger Alpine magic
// (Must be in context of an Alpine component)
```

### Inspect Modal State

```javascript
// Check if modals are open
document.querySelectorAll('[x-show*="Modal"]')

// Find all visible modals
Array.from(document.querySelectorAll('[x-show*="Modal"]'))
    .filter(el => el.style.display !== 'none')
```

---

## IndexedDB Direct Access

### Open IndexedDB Connection

```javascript
// Open the database
const request = indexedDB.open('physicsAuditDB', 1)

request.onsuccess = (event) => {
    const db = event.target.result
    console.log('Database opened:', db)

    // Access object stores
    const transaction = db.transaction(['userData'], 'readonly')
    const objectStore = transaction.objectStore('userData')

    // Get all data
    const getAllRequest = objectStore.getAll()
    getAllRequest.onsuccess = () => {
        console.log('All data:', getAllRequest.result)
    }
}

request.onerror = () => console.error('Failed to open database')
```

### Quick IndexedDB Query

```javascript
// Helper function to query IndexedDB
async function queryIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('physicsAuditDB', 1)
        request.onsuccess = (event) => {
            const db = event.target.result
            const transaction = db.transaction([storeName], 'readonly')
            const objectStore = transaction.objectStore(storeName)
            const getRequest = objectStore.get(key)
            getRequest.onsuccess = () => resolve(getRequest.result)
            getRequest.onerror = () => reject(getRequest.error)
        }
        request.onerror = () => reject(request.error)
    })
}

// Usage
queryIndexedDB('userData', 'guest').then(console.log)
```

---

## Testing & Simulation

### Simulate Offline Mode

```javascript
// In DevTools:
// 1. Open Network tab
// 2. Change "No throttling" to "Offline"
// 3. Test offline functionality

// Or programmatically (not recommended):
window.dispatchEvent(new Event('offline'))
window.dispatchEvent(new Event('online'))
```

### Simulate Slow Network

```javascript
// In DevTools Network tab:
// - Set throttling to "Slow 3G" or "Fast 3G"
// - Test loading performance under poor network conditions
```

### Test Dark Mode Toggle

```javascript
// Access the app and toggle dark mode
physicsAuditApp.darkMode = true   // Enable dark mode
physicsAuditApp.darkMode = false  // Disable dark mode

// Or use the UI: Settings → Preferences → Dark Mode
```

---

## Common Debugging Workflows

### Workflow 1: Debug Data Not Persisting

```javascript
// 1. Check if debug mode is on
logger.enableDebug()

// 2. Check storage stats
getStorageStats()

// 3. Inspect IndexedDB
// DevTools → Application → IndexedDB → physicsAuditDB

// 4. Check for errors in console (F12)

// 5. Verify not in private/incognito mode
// (IndexedDB may be disabled)
```

### Workflow 2: Debug Service Worker Issues

```javascript
// 1. Check registration
navigator.serviceWorker.getRegistration().then(console.log)

// 2. Check for waiting worker
navigator.serviceWorker.getRegistration().then(reg => {
    console.log('Active:', reg.active)
    console.log('Waiting:', reg.waiting)
})

// 3. Clear cache and reload
clearSWCache()

// 4. Unregister and hard refresh
navigator.serviceWorker.getRegistration().then(reg => reg.unregister())
// Then: Ctrl+Shift+R

// 5. Check DevTools → Application → Service Workers panel
```

### Workflow 3: Debug Performance Issues

```javascript
// 1. Enable debug mode
logger.enableDebug()

// 2. Check memory usage
console.log(performance.memory)

// 3. Profile operation
performance.mark('start')
// ... perform action ...
performance.mark('end')
performance.measure('action', 'start', 'end')
console.log(performance.getEntriesByName('action')[0].duration + 'ms')

// 4. Check for memory leaks
// DevTools → Memory → Take heap snapshot → Perform actions → Take another snapshot → Compare

// 5. Check network requests
// DevTools → Network → Check request count and size
```

### Workflow 4: Debug Search Not Working

```javascript
// 1. Enable debug logging
logger.enableDebug()

// 2. Access app state
console.log(physicsAuditApp)

// 3. Check topics loaded
console.log(window.allTopicsForSearch)

// 4. Test search function directly
// (Would need to import and call search function)

// 5. Check for JavaScript errors in console
```

---

## DevTools Shortcuts

### Chrome/Edge DevTools

| Shortcut | Action |
|----------|--------|
| `F12` or `Ctrl+Shift+I` | Open DevTools |
| `Ctrl+Shift+C` | Inspect element |
| `Ctrl+Shift+J` | Open Console |
| `Ctrl+Shift+R` | Hard refresh (clear cache) |
| `Ctrl+P` | Quick open file (in Sources panel) |
| `Esc` | Toggle console drawer |

### Firefox DevTools

| Shortcut | Action |
|----------|--------|
| `F12` or `Ctrl+Shift+I` | Open DevTools |
| `Ctrl+Shift+C` | Inspect element |
| `Ctrl+Shift+K` | Open Console |
| `Ctrl+Shift+R` | Hard refresh (clear cache) |

---

## Advanced Console Utilities

### Console Utilities Reference

```javascript
// $0-$4: Recently inspected elements
$0  // Most recently inspected element
$1  // Second most recent

// $(): querySelector shorthand
$('button')              // Same as document.querySelector('button')
$$('button')             // Same as document.querySelectorAll('button')

// $x(): XPath selector
$x('//button')           // Select elements by XPath

// copy(): Copy to clipboard
copy(physicsAuditApp)    // Copy app state to clipboard

// monitor(): Monitor function calls
monitor(functionName)    // Log when function is called
unmonitor(functionName)  // Stop monitoring

// table(): Display as table
console.table(physicsAuditApp.ratings)  // Show ratings as table
```

---

## Related Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow and setup
- **[TESTING.md](TESTING.md)** - Comprehensive testing procedures
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture details

---

## External Resources

- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [Firefox DevTools Documentation](https://firefox-source-docs.mozilla.org/devtools-user/)
- [Performance API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Service Worker API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API Reference](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Last Updated:** 2025-11-21
**Version:** 1.0
