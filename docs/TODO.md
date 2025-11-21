# TODO List

This document tracks outstanding tasks and improvements for the PhysRev application.

## Security

### Subresource Integrity (SRI) Hashes

**Priority:** High
**Location:** `index.html`

Add SRI hashes to CDN dependencies to prevent supply chain attacks.

**Current Status:**
- ✅ **KaTeX** - SRI hash implemented (line 88-90)
- ⚠️ **Alpine.js** - SRI hash needed (preload at line 62, script tag elsewhere)
- ⚠️ **DOMPurify** - SRI hash needed (line 97)
- ⚠️ **Chart.js** - SRI hash needed (line 104+, also needs version pinning)
- ⚠️ **Lucide Icons** - SRI hash needed
- ⚠️ **Tailwind CSS** - SRI hash needed (may not be possible with CDN build)

**Outstanding items:**

1. **Alpine.js preload** (line 62)
   - Add SRI hash to Alpine.js preload link
   - Current: `<link rel="preload" href="https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/module.esm.js" as="script" crossorigin>`
   - Need: integrity="sha384-HASH" attribute

2. **DOMPurify** (line 97)
   - Add SRI hash for integrity verification
   - Current: `<script defer src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>`
   - Need: integrity="sha384-HASH" crossorigin="anonymous" attributes

3. **Chart.js** (line 104+)
   - Pin Chart.js version (currently unpinned)
   - Add SRI hash
   - Current version in package.json: 4.4.1

4. **Lucide Icons**
   - Locate script tag in index.html
   - Add SRI hash

5. **Alpine.js main script**
   - Locate main Alpine.js script tag (separate from preload)
   - Add SRI hash

6. **Tailwind CSS** (optional)
   - Review if SRI is possible with CDN version
   - May require switching to local build process

**Tool available:** `node tools/generate-sri-hashes.js`

**Implementation steps:**
1. Run the SRI hash generation tool
2. Update index.html with integrity attributes
3. Test that all resources load correctly
4. Verify CSP compatibility

**Why this matters:**
- Prevents tampering with CDN resources
- Ensures scripts haven't been modified
- Industry best practice for CDN usage
- Reduces attack surface

## Authentication & Infrastructure

### Microsoft Teams Authentication Setup

**Priority:** Medium (Optional - Guest mode is fully functional)
**Status:** Teams login button currently ACTIVE but using placeholder credentials
**Documentation:** See **[TEAMS_AUTH_SETUP.md](guides/TEAMS_AUTH_SETUP.md)** for complete details

**⚠️ Security Risk:** Teams login button is enabled with fake credentials. Users can click it but authentication will fail.

**Immediate Actions:**

1. **🔴 CRITICAL: Disable Teams Login Button**
   - **File:** `index.html` (line 231-242)
   - **Action:** Comment out Teams button to prevent user confusion
   - **Impact:** Prevents failed login attempts while Azure AD is being configured
   - **Guest Mode:** Fully functional alternative (no setup needed)

2. **✅ RESOLVED: Redirect URI Now Correct**
   - **File:** `js/features/auth/teams.js` (line 11)
   - **Status:** `REDIRECT_URI: window.location.origin + '/auth-callback.html'`
   - **File Location:** `/auth-callback.html` ✅
   - **Note:** auth-callback.html is at project root (not in tools/)

**When Azure AD Permissions Are Obtained:**

1. Register app in Azure Portal (see TEAMS_AUTH_SETUP.md)
2. Create `js/features/auth/teams-config.js` with real credentials
3. Add `Files.ReadWrite` permission for OneDrive sync (optional)
4. Test authentication flow thoroughly
5. Re-enable Teams button in index.html

**Not Implemented Yet (Future Work):**
- OneDrive data sync (placeholder code exists but not functional)
- Automatic data migration from Guest mode to Teams mode
- Refresh token logic for sessions > 24 hours
- Better error messages for failed authentication

**Notes:**
- `.gitignore` already protects `teams-config.js` (line 30) ✅
- `auth-callback.html` exists at project root ✅
- OAuth PKCE flow is implemented correctly
- Guest mode is recommended until Teams auth is fully configured

---

## Content Development

### Paper 3 Support

**Priority:** Medium
**Location:** CSV files and `js/data/unified-csv-loader.js`

Paper 3 UI is complete (button, navigation, filtering), but content needs to be added.

**Content work (for educators - see CONTENT_MANAGEMENT.md):**
- ✅ Paper 3 button exists in sidebar
- ✅ Paper 3 filtering logic implemented
- ⚠️ Add Paper 3 groups to `resources/groups.csv`
- ⚠️ Create Paper 3 topic CSV files (astrophysics.csv, medical-physics.csv, engineering-physics.csv)
- ⚠️ Add revision resources for Paper 3 topics

**Developer work (if new CSV files are created):**

**Location:** `js/data/unified-csv-loader.js` (lines 57-68)

If educators create new Paper 3 CSV files, they must be registered in the CSV loader array.

**Current array:**
```javascript
const csvFiles = [
    'measurements.csv',
    'particles.csv',
    'waves.csv',
    'mechanics.csv',
    'electricity.csv',
    'periodic-motion.csv',
    'thermal.csv',
    'fields.csv',
    'magnetic-fields.csv',
    'nuclear.csv'
];
```

**Required additions (example):**
```javascript
const csvFiles = [
    'measurements.csv',
    'particles.csv',
    'waves.csv',
    'mechanics.csv',
    'electricity.csv',
    'periodic-motion.csv',
    'thermal.csv',
    'fields.csv',
    'magnetic-fields.csv',
    'nuclear.csv',
    'astrophysics.csv',        // NEW - Paper 3
    'medical-physics.csv',      // NEW - Paper 3
    'engineering-physics.csv'   // NEW - Paper 3
];
```

**Testing:**
1. Add new file names to the array
2. Save the file
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for CSV loading errors
5. Navigate to Paper 3 to verify content appears

**Note:** If Paper 3 content is added to existing CSV files instead of creating new ones, no code changes are needed.

## Future Enhancements

From `index.html` comments (lines 37-40):

### CSP Improvements

**Priority:** Medium
**Status:** Future consideration

Current CSP requires `unsafe-inline` and `unsafe-eval` due to Alpine.js requirements.

**Possible future improvements:**
- Migrate to CSP Level 3 with nonce support (complex with Service Worker)
- Migrate to Vue 3/React with strict CSP (major rewrite)
- Monitor Alpine.js for CSP improvements

**Why not now:**
- Alpine.js uses inline expressions (x-on, x-bind, etc.)
- Alpine.js reactive system uses `new Function()` internally
- TailwindCSS config uses inline script
- Current mitigation strategy is sufficient (DOMPurify, HMAC, local-first)

---

## Completed ✅

This section tracks completed items for historical reference.

*(No completed items yet)*
