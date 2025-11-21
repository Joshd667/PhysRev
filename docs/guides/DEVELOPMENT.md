# Development Guide

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for CORS compliance)
- Node.js 16+ (optional, for testing only)

## Quick Start

### Method 1: Python HTTP Server (Recommended)

```bash
# Navigate to project directory
cd physics-revision-main

# Start local server on port 8000
python3 -m http.server 8000

# Open http://localhost:8000
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

---

## Testing

For comprehensive testing checklists and procedures, see **[TESTING.md](TESTING.md)**.

**Quick Test:**
```bash
npm install          # Install test dependencies
npm test             # Run test suite
npm run test:ui      # Interactive test UI
npm run test:coverage # Coverage report
```

---

## Optimizing Data Loading

For 10x faster loading, convert CSVs to JSON using the unified converter:

**Tool Location:** `tools/csv-converter-unified.html`

**Two Modes:**
1. **Server Mode** - Fetches CSVs from web server (for deployed apps)
2. **Local Mode** - Drag & drop CSV files (for offline/development)

**Benefits:**
- 10x faster loading (1 HTTP request vs 16)
- Groups included (no separate groups.csv fetch)
- Easier deployment (single data file)

**How to Use:**
1. Open `http://localhost:8000/tools/csv-converter-unified.html`
2. Choose mode (Server or Local)
3. Click "Convert to JSON"
4. Save as `resources/combined-data.json`
5. Hard refresh app (Ctrl+Shift+R)

**JSON v2.0 Features:**
- Includes revision mappings (no need to regenerate)
- Includes groups configuration
- Backward compatible with v1.x

---

## Development Tools

### Force Refresh

Clear all caches and reload the app:
- Open Settings → Admin → "Force Refresh"
- Or manually: DevTools → Application → Clear Storage

### Debug Mode

Enable detailed logging:
```javascript
// In browser console
logger.enableDebug()   // Enable
logger.disableDebug()  // Disable
```

### Storage Inspection

View storage statistics:
```javascript
getStorageStats()      // View stats
clearAllAppStorage()   // Clear all data
```

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

## Common Development Tasks

### Adding New Features

1. Create feature module in `js/features/your-feature/`
2. Export methods from `index.js` (facade pattern)
3. Import in `js/core/app.js`
4. Add to app return object
5. Create template in `templates/`
6. Load template in `js/template-loader.js`

### Modifying Data Structure

1. Edit CSV files in `resources/`
2. Regenerate JSON: `tools/csv-converter-unified.html`
3. Hard refresh browser

### Performance Profiling

```javascript
// In browser console
performance.mark('start')
// ... do something
performance.mark('end')
performance.measure('task', 'start', 'end')
performance.getEntriesByName('task')
```

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

---

## Best Practices

### Code Style

- Use ES6+ features (modules, arrow functions, destructuring)
- Follow existing patterns (facade + feature modules)
- Add JSDoc comments for public functions
- Keep files focused and under 500 lines

### State Management

- User data → Reactive state (Alpine.js)
- Static data → Module-level variables (non-reactive)
- Persist to IndexedDB via `storage.js`

### Performance

- Lazy load large features (e.g., Teams auth)
- Use `requestIdleCallback` for non-critical work
- Debounce expensive operations (search, analytics)
- Clean up event listeners and timers

### Security

- Sanitize all user input with DOMPurify
- Validate imported data
- Never use `eval()` or `innerHTML` with unsanitized content
- See `docs/audits/` for security audit reports

---

## Resources

- [Alpine.js Documentation](https://alpinejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Lucide Icons](https://lucide.dev/)

---

## Getting Help

1. Check browser console for errors
2. Review troubleshooting section above
3. See [TESTING.md](TESTING.md) for test procedures
4. Check [ARCHITECTURE.md](ARCHITECTURE.md) for design details
5. Review security audits in `docs/audits/`
