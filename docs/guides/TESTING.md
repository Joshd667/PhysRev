# Testing Guide - Physics Knowledge Audit Tool

This document contains comprehensive testing checklists and procedures for the Physics Knowledge Audit Tool.

---

## 🧪 Manual Testing Checklist

### Login & Auth
- [ ] Guest login works
- [ ] Auth persists on reload
- [ ] Logout clears data
- [ ] Teams login button hidden/disabled (currently not configured - see [TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md))
- [ ] Login screen shows correct messaging (Guest mode only)

### Navigation
- [ ] Main menu loads
- [ ] Spec mode navigation works
- [ ] Paper mode navigation works (Paper 1, Paper 2)
- [ ] Paper 3 button visible in sidebar
- [ ] Paper 3 mode shows "No content yet" message (content not added - see [TODO.md](../TODO.md#paper-3-support))
- [ ] Breadcrumb navigation works
- [ ] Back button works correctly
- [ ] View mode toggle works (Specification/Paper 1/Paper 2/Paper 3)

### Search
- [ ] Search icon opens search interface
- [ ] Search input accepts text
- [ ] Fuzzy search finds partial matches
- [ ] Search filters by confidence level (dropdowns work)
- [ ] Search filters by tags/topics
- [ ] Search results display correctly with highlighting
- [ ] Pagination works on search results (if >20 results)
- [ ] Load More button works in search results
- [ ] Click result navigates to topic
- [ ] Clear search resets filters
- [ ] Search works in dark mode
- [ ] Empty search shows helpful message

### Confidence Rating
- [ ] Can rate topics 1-5
- [ ] Ratings persist
- [ ] Toggle removes rating
- [ ] History tracked correctly

### Analytics
- [ ] Dashboard loads
- [ ] Charts render
- [ ] Stats calculate correctly
- [ ] Critical topics listed
- [ ] Study velocity calculated

### Revision
- [ ] Resources load for topics
- [ ] Videos/notes/sims display
- [ ] External links open correctly

### Settings Panel
- [ ] Modal opens/closes correctly
- [ ] User info displays correctly
- [ ] All 6 tabs accessible (Account, Data, Preferences, About, Admin, Updates)
- [ ] Export CSV works
- [ ] Backup/restore data works
- [ ] Preferences save correctly
- [ ] Clear data confirms and works

### App Updates (Manual Control)
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

### Study Materials
- [ ] Filter toggles work (All/Notes/Flashcards/Mindmaps)
- [ ] Appropriate empty state shows based on filter

### Pagination & Load More
- [ ] Notes list shows "Load More" button when > 30 notes
- [ ] Load More button loads next 15 notes
- [ ] Load More button shows remaining count
- [ ] Load More button disappears when all items loaded
- [ ] Flashcard decks list paginates (30 initial, 15 increment)
- [ ] Search results paginate correctly
- [ ] Pagination counter shows "Showing X of Y"
- [ ] Pagination works in dark mode

### Data Import/Export
- [ ] Export Data button downloads JSON file
- [ ] Exported JSON contains all user data (ratings, notes, flashcards, mindmaps)
- [ ] Export CSV button downloads CSV file
- [ ] CSV export includes all ratings with timestamps
- [ ] Import Data accepts valid JSON files
- [ ] Import shows preview of data before importing
- [ ] Import merges data correctly (doesn't overwrite existing)
- [ ] Import validates JSON structure
- [ ] Import rejects invalid/corrupted files with error message
- [ ] Import shows success message
- [ ] HMAC signature validation works (if applicable)
- [ ] Backup creates downloadable file before updates
- [ ] Backup filename includes timestamp
- [ ] Restore from backup works correctly

### Topic Tagging
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

### Note Editor
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

### Equation Editor
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

### Flashcard Decks
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

### Flashcard Test Mode
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

### Mindmap Editor
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

### Performance
- [ ] Initial page load < 3 seconds (with combined-data.json)
- [ ] JSON loading time < 200ms (check Network tab)
- [ ] CSV loading time < 500ms if JSON not available
- [ ] Memory usage < 150MB (check Performance Monitor)
- [ ] No memory leaks when navigating between views
- [ ] Smooth scrolling and animations (60 FPS)
- [ ] Large lists render without lag (pagination helps)
- [ ] Analytics charts render quickly
- [ ] Search results appear in < 500ms
- [ ] No janky UI when editing notes/mindmaps

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus indicators visible and clear
- [ ] Modals trap focus correctly
- [ ] Escape key closes modals
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements have accessible names
- [ ] Icons have text alternatives
- [ ] Form inputs have labels
- [ ] Error messages are descriptive
- [ ] Skip navigation links present (if applicable)

### Cross-Browser & Device Testing
- [ ] **Desktop Chrome** - All features work
- [ ] **Desktop Firefox** - All features work
- [ ] **Desktop Edge** - All features work
- [ ] **Desktop Safari** (Mac) - All features work
- [ ] **Mobile iOS Safari** - Touch interactions work, PWA installs
- [ ] **Mobile Android Chrome** - Touch interactions work, PWA installs
- [ ] **Tablet (iPad/Android)** - Layout responsive, touch works
- [ ] Different screen sizes (mobile/tablet/desktop/ultrawide)
- [ ] Portrait and landscape orientations
- [ ] High DPI/Retina displays render correctly

### PWA
- [ ] Works offline after first visit
- [ ] Can install to homescreen (Add to Home Screen prompt)
- [ ] Service Worker registers correctly
- [ ] Manual update control works (badge appears, no auto-reload)
- [ ] Installed app works standalone (no browser chrome)
- [ ] App icon displays correctly on home screen
- [ ] Splash screen shows when launching

### Dark Mode
- [ ] Toggle works
- [ ] Preference persists
- [ ] All views support dark mode

### Security (Manual Testing)
- [ ] XSS attempts in note editor are sanitized
- [ ] XSS attempts in flashcard content are sanitized
- [ ] XSS attempts in mindmap nodes are sanitized
- [ ] XSS attempts in search input are handled safely
- [ ] Script tags in imported data are stripped
- [ ] HTML injection attempts fail
- [ ] Imported JSON with malicious content rejected
- [ ] No sensitive data exposed in browser DevTools
- [ ] No credentials visible in localStorage/IndexedDB
- [ ] Teams config credentials protected (if configured)
- [ ] DOMPurify sanitization working on all user input
- [ ] Console logger respects debug mode (minimal output in production)
- [ ] No API keys or secrets exposed in source code

---

## 🧪 Automated Testing

### Setup

Install test dependencies:
```bash
npm install
```

### Running Tests

```bash
npm test             # Run test suite
npm run test:ui      # Run with interactive UI
npm run test:coverage # Generate coverage report
```

### Test Suites

**Security Tests** (`tests/search.test.js`):
- XSS protection in search
- HTML sanitization
- Script injection prevention

**Data Validation Tests** (`tests/data-validation.test.js`):
- Input validation on import
- Prototype pollution prevention
- Data integrity checks

---

## 🧪 Testing Manual Updates (Development)

To test the manual update system during development:

1. **Open the app** in your browser (http://localhost:8000 or similar)
2. **Make a change** - Edit any file (e.g., add a comment to `index.html`)
3. **Update the version** in `sw.js` (line 1):
   ```javascript
   const BUILD_TIMESTAMP = '20250121-002'; // Increment this (format: YYYYMMDD-NNN)
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

---

## 📦 Production Testing Checklist

Before deploying to production:

- [ ] Generate `combined-data.json` for fast loading
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Verify Service Worker registers correctly
- [ ] Test offline functionality
- [ ] Check all external CDN links work
- [ ] Remove debug console.logs (optional, or ensure debug mode disabled in production)
- [ ] Verify Teams login button disabled (if not configured)
- [ ] **Test manual update flow**:
  - [ ] Increment BUILD_TIMESTAMP in `sw.js` (line 1, format: YYYYMMDD-NNN) - See [DEVELOPMENT.md - Versioning](DEVELOPMENT.md#versioning) for details
  - [ ] Deploy new version
  - [ ] Refresh app - verify badge appears (no auto-reload)
  - [ ] Open Settings → Updates - verify notification shows
  - [ ] Test "Check for Updates" button
  - [ ] Test "Backup & Update" flow
  - [ ] Test "Update Now" flow (without backup)
  - [ ] Verify app reloads after manual activation
  - [ ] Verify version number updated in Settings → About

---

## 🐛 Common Testing Issues

### Test fails with "Cannot find module"
- Run `npm install` to install dependencies
- Check Node.js version (requires v16+)

### Service Worker not updating in tests
- Clear browser cache
- Unregister existing Service Workers in DevTools
- Hard reload (Ctrl+Shift+R)

### Tests pass locally but fail in CI
- Check Node version matches
- Ensure all dependencies in package.json
- Verify test environment variables

---

## 📝 Test Coverage Goals

| Area | Target Coverage |
|------|----------------|
| Security (XSS, validation) | 100% |
| Core functionality | 80%+ |
| UI components | 60%+ |
| Edge cases | As needed |

---

## 🔗 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [PWA Testing Guide](https://web.dev/pwa-testing/)
