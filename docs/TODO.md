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

2. **🟡 HIGH: Fix Redirect URI Mismatch**
   - **File:** `js/features/auth/teams.js` (line 11)
   - **Current:** `REDIRECT_URI: window.location.origin + '/auth-callback.html'`
   - **Should be:** `REDIRECT_URI: window.location.origin + '/tools/auth-callback.html'`
   - **Reason:** Callback file is at `/tools/auth-callback.html` not `/auth-callback.html`

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
- `tools/auth-callback.html` exists ✅
- OAuth PKCE flow is implemented correctly
- Guest mode is recommended until Teams auth is fully configured

---

## Legal & Compliance

### Privacy Notice / Privacy Policy

**Priority:** 🔴 HIGH - GDPR Requirement (Articles 13/14)
**Status:** ❌ Missing
**Documentation:** See **[UK_LEGAL_COMPLIANCE_ANALYSIS.md](legal/UK_LEGAL_COMPLIANCE_ANALYSIS.md)** for complete compliance analysis

**Why this matters:**
- Required by UK GDPR before deployment
- Informs users about data collection and processing
- Demonstrates compliance with legal obligations
- Reduces risk of ICO investigation

**What to include:**
1. **Data Collected:**
   - Confidence ratings (1-5 scale on physics topics)
   - Study materials (notes, flashcards, mindmaps)
   - Analytics history (30-day retention)
   - Test results
   - User preferences (view modes, dark mode)
   - Authentication data (Teams only - name, email)

2. **Storage Location:**
   - IndexedDB on user's device (client-side only)
   - No external transmission (unless Teams explicitly enabled)
   - Service Worker cache for app assets

3. **Retention Periods:**
   - Analytics: 30-day automatic cleanup
   - User materials: No automatic deletion (user-controlled)
   - Backup files: User-initiated only

4. **User Rights:**
   - Right to access (export data as JSON)
   - Right to rectification (edit all data)
   - Right to erasure (clear all data function)
   - Right to data portability (JSON export/import)

5. **Legal Basis:**
   - Legitimate interest for educational analytics (GDPR Article 6(1)(f))
   - Consent for optional preferences

6. **Data Controller:**
   - Contact information for data controller
   - If school deployment: School as data controller, app as processor

7. **Third-Party Services:**
   - CDN libraries (cached locally after first visit)
   - Microsoft Teams/Graph API (if enabled)
   - No tracking or analytics services

**Where to add:**
- Create `docs/legal/PRIVACY_NOTICE.md`
- Link from main README.md
- Display in app (Settings → About or Legal)

---

### Data Retention Policy Documentation

**Priority:** 🔴 HIGH - GDPR Requirement (Article 13)
**Status:** ⚠️ Implemented in code but not documented for users

**Current implementation:**
- Analytics history: 30-day automatic cleanup (code: `js/utils/data-management.js`)
- User study materials: No automatic deletion (user-controlled)

**What to document:**
1. **Analytics Data:**
   - Retention: 30 days from creation
   - Automatic cleanup: Yes
   - Purpose: Progress tracking and insights

2. **User Study Materials:**
   - Retention: Indefinite (user-controlled)
   - Automatic cleanup: No
   - User control: Full deletion via Settings

3. **Backup Files:**
   - Retention: User-initiated export only
   - Storage: User's device/chosen location
   - Automatic cleanup: No

4. **Storage Quota:**
   - Limit: ~50MB+ (browser-dependent)
   - Warning: User notified at quota limit
   - Mitigation: Analytics cleanup, user export/delete

**Where to add:**
- Include in PRIVACY_NOTICE.md
- Or create separate `docs/legal/DATA_RETENTION_POLICY.md`

---

### Legal Basis Documentation

**Priority:** 🔴 HIGH - GDPR Requirement (Article 6)
**Status:** ❌ Not documented

**Recommended legal basis:**
- **Legitimate interest** for educational analytics (GDPR Article 6(1)(f))
- **Consent** for optional features (Teams login, preferences)

**What to document:**
1. **Legitimate Interest Assessment:**
   - Purpose: Educational analytics for student learning
   - Necessity: Essential for tracking progress and identifying knowledge gaps
   - Balance test: Minimal privacy impact (local-only storage, no identifiers)
   - User expectations: Reasonable expectation of progress tracking in educational tool

2. **Consent Mechanism:**
   - Teams login: Explicit consent via login button
   - User preferences: Implicit consent via settings changes
   - Withdrawal: Clear data deletion, logout functions

**Where to add:**
- Include in PRIVACY_NOTICE.md as "Legal Basis for Processing"

---

### Terms of Service

**Priority:** 🟡 MEDIUM - Recommended but not legally required
**Status:** ❌ Missing

**What to include:**
1. **Acceptable Use Policy:**
   - Educational purposes only
   - No harmful content in study materials
   - No attempts to circumvent security

2. **Liability Limitations:**
   - App provided "as-is"
   - No warranty for data persistence
   - User responsible for backups
   - Storage quota limits disclosed

3. **User Responsibilities:**
   - Maintain device security
   - Regular data backups recommended
   - Appropriate content in notes/flashcards

4. **Service Modifications:**
   - Right to modify app features
   - Update notification via Service Worker
   - User control over update installation

**Where to add:**
- Create `docs/legal/TERMS_OF_SERVICE.md`
- Link from app (Settings → Legal)

---

### Accessibility Statement

**Priority:** 🟡 MEDIUM - WCAG 2.1 recommended for public sector
**Status:** ❌ Missing

**Current implementation:**
- ✅ Dark mode support
- ✅ Keyboard navigation (Alpine.js native)
- ❌ Not tested with screen readers
- ❌ Not tested with other assistive technologies

**What to include:**
1. **Conformance Level:**
   - Target: WCAG 2.1 Level AA
   - Current status: Unknown (not tested)

2. **Known Issues:**
   - Screen reader compatibility: Untested
   - Color contrast: Not formally audited
   - Focus indicators: Present but not comprehensive

3. **Planned Improvements:**
   - Screen reader testing
   - ARIA labels for interactive elements
   - Comprehensive keyboard navigation audit

4. **Feedback Mechanism:**
   - Contact email for accessibility issues
   - Commitment to address reported issues

**Where to add:**
- Create `docs/legal/ACCESSIBILITY_STATEMENT.md`
- Link from app footer or Settings

---

### Data Processing Agreement (DPA)

**Priority:** 🔴 HIGH (if school deployment)
**Status:** ❌ Not executed
**Applies to:** Institutional/school deployments only

**When required:**
- School deploys app for students
- School is data controller, app is data processor
- GDPR Article 28 requirement

**What to include:**
1. **Roles:**
   - School: Data controller
   - App/developer: Data processor

2. **Processing Details:**
   - Subject matter: Educational analytics
   - Nature: Local storage, progress tracking
   - Purpose: Student self-assessment
   - Data subjects: A-Level physics students

3. **Security Measures:**
   - Client-side storage only
   - XSS prevention (DOMPurify)
   - CSP enforcement
   - User data control (export/delete)

4. **Sub-processors:**
   - CDN providers (cached locally)
   - Microsoft (if Teams enabled)

**Action:**
- Create template DPA for schools
- Execute before school deployment

---

### Microsoft Data Processing Agreement

**Priority:** 🔴 HIGH (if Teams integration enabled)
**Status:** ⚠️ Teams integration disabled
**Applies to:** Only if Teams auth is enabled and cloud sync implemented

**When required:**
- Teams authentication enabled
- OneDrive sync implemented (currently not implemented)
- Organization uses Microsoft 365

**What to verify:**
1. **Organization has Microsoft DPA:**
   - Check with IT department/admin
   - Microsoft 365 subscriptions typically include DPA
   - Verify DPA covers Graph API usage

2. **Data Flow Documentation:**
   - User authentication via Azure AD
   - User profile data (name, email) from Graph API
   - OneDrive file storage (if sync implemented)

3. **Privacy Notice Update:**
   - Disclose Microsoft as sub-processor
   - Explain Teams data flow
   - Link to Microsoft's privacy policy

**Action:**
- Verify Microsoft DPA before enabling Teams
- Update Privacy Notice with Teams details
- Document data flow in legal analysis

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
