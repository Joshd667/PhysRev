# Microsoft Teams Authentication Setup Guide

## ⚠️ CRITICAL: Current Status & Security Risks

### Current State

**🔴 SECURITY RISK: Teams authentication is ACTIVE with placeholder credentials!**

**Status:** The Teams login button is **ENABLED** in the UI but will **FAIL** when users try to use it.

**Location:** `js/features/auth/teams.js` (lines 7-17)

```javascript
const TEAMS_CONFIG = {
    CLIENT_ID: 'your-teams-app-client-id',  // ❌ PLACEHOLDER - NOT REAL
    TENANT_ID: 'your-tenant-id',            // ❌ PLACEHOLDER - NOT REAL
    REDIRECT_URI: window.location.origin + '/auth-callback.html',  // ⚠️ WRONG PATH
    // ...
};
```

### Critical Issues

1. **❌ Button is enabled** - Users can click "Login with Microsoft Teams" (`index.html` line 232)
2. **❌ Placeholder credentials** - Will fail OAuth flow with cryptic error
3. **❌ Redirect URI mismatch** - Points to `/auth-callback.html` but file is at `/tools/auth-callback.html`
4. **✅ Protected from commits** - `.gitignore` already has `js/features/auth/teams-config.js` (line 30)
5. **❌ No configuration template** - `teams-config.template.js` doesn't exist yet

### User Experience Impact

When a user clicks "Login with Microsoft Teams":
1. Popup opens with Azure AD login page
2. OAuth flow fails due to invalid CLIENT_ID
3. Error: "Application not found" or similar
4. User is confused and frustrated
5. **Recommendation: DISABLE THE BUTTON IMMEDIATELY**

---

## What To Do If You Don't Have Azure AD Permissions Yet

### Option 1: Disable Teams Login (⚠️ RECOMMENDED UNTIL READY)

**Why:** Prevents user confusion, failed login attempts, and support requests

**How to disable:**

1. **Hide the Teams login button in `index.html` (line 231-242):**

```html
<!-- TEMPORARILY DISABLED - Awaiting Azure AD App Registration
<button @click="initiateTeamsLogin()" :disabled="isLoading" class="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg transition-colors">
    <div class="flex items-center space-x-3">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.625 7.5l-7.5-7.5H4.5a1.5 1.5 0 00-1.5 1.5v19.5a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5V7.5zM12 3.75L18.75 10.5H12V3.75z"/>
        </svg>
        <div class="text-left">
            <div class="font-semibold">Login with Microsoft Teams</div>
            <div class="text-sm opacity-90">Data synced to your Teams account</div>
        </div>
    </div>
</button>
-->

<!-- Add a note for users (optional) -->
<div class="text-xs text-gray-500 dark:text-gray-400 text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
    Microsoft Teams login temporarily unavailable while we configure Azure AD.
    Please use Guest mode (local storage only) for now.
</div>
```

2. **Update the login prompt (line 227):**

```html
<!-- Change from: "Choose your login method to save your progress" -->
<p class="text-gray-600 dark:text-gray-400">
    Login as Guest to save your progress locally
</p>
```

**Result:** App functions fully in Guest mode while you configure Azure AD. Guest mode stores all data locally in IndexedDB with full functionality.

**To re-enable later:** Simply uncomment the button and revert the login prompt text.

---

### Option 2: Create a Configuration File (For Future Setup)

Create a configuration template that can be filled in later without modifying the main codebase:

**Step 1: Create `js/features/auth/teams-config.template.js`:**

```javascript
/**
 * Microsoft Teams Authentication Configuration Template
 *
 * DO NOT COMMIT THE ACTUAL CONFIG FILE WITH REAL CREDENTIALS!
 *
 * Instructions:
 * 1. Copy this file to `teams-config.js` in the same directory
 * 2. Fill in your actual Azure AD credentials
 * 3. Ensure `teams-config.js` is in .gitignore
 */

export const TEAMS_CONFIG = {
    // Azure AD Application (Client) ID
    // Get from: Azure Portal > App Registrations > Your App > Overview
    CLIENT_ID: 'your-teams-app-client-id-here',

    // Azure AD Directory (Tenant) ID
    // Get from: Azure Portal > App Registrations > Your App > Overview
    TENANT_ID: 'your-tenant-id-here',

    // OAuth Redirect URI (must match Azure AD configuration)
    // ⚠️ IMPORTANT: File is at /tools/auth-callback.html
    // This should be: https://yourdomain.com/tools/auth-callback.html
    REDIRECT_URI: window.location.origin + '/tools/auth-callback.html',

    // OAuth Scopes
    SCOPES: ['openid', 'profile', 'email', 'offline_access'],

    // OneDrive configuration (for data sync)
    // ⚠️ NOTE: OneDrive sync is NOT YET IMPLEMENTED - placeholder only
    DATA_FILENAME: 'physics-audit-data.json',
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
};
```

**Step 2: Update `.gitignore`:**

```gitignore
# Teams authentication credentials (NEVER COMMIT!)
js/features/auth/teams-config.js
```

**Step 3: Modify `js/features/auth/teams.js`:**

```javascript
// Import config from external file
import { TEAMS_CONFIG } from './teams-config.js';

// Remove the hardcoded config object
// Now TEAMS_CONFIG comes from the imported file
```

---

## How To Set Up Teams Authentication (When You Get Permissions)

### Prerequisites

- Azure AD admin access (or someone who can create app registrations)
- A Microsoft 365 organization
- Permission to create Azure AD app registrations

### Step 1: Azure AD App Registration

1. **Go to Azure Portal:**
   - Navigate to https://portal.azure.com
   - Sign in with your organizational account

2. **Create App Registration:**
   - Go to: **Azure Active Directory** > **App registrations** > **New registration**

   - **Name:** Physics Knowledge Audit Tool
   - **Supported account types:**
     - Single tenant (if only for your school/organization)
     - Multi-tenant (if for multiple organizations)
   - **Redirect URI:**
     - Type: **Single-page application (SPA)**
     - URL: `https://yourdomain.com/tools/auth-callback.html`
     - (For testing: `http://localhost:8000/tools/auth-callback.html`)
     - ⚠️ **CRITICAL:** Must include `/tools/` in the path (file is at `/tools/auth-callback.html`)

3. **Copy your credentials:**
   - After creating, go to **Overview** page
   - Copy **Application (client) ID** → This is your `CLIENT_ID`
   - Copy **Directory (tenant) ID** → This is your `TENANT_ID`

4. **Configure API Permissions:**
   - Go to **API permissions** > **Add a permission**
   - Select **Microsoft Graph**
   - Choose **Delegated permissions**
   - Add these permissions:
     - `openid`
     - `profile`
     - `email`
     - `offline_access`
     - `Files.ReadWrite` (if you want OneDrive sync)
   - Click **Grant admin consent** (requires admin)

5. **Configure Authentication:**
   - Go to **Authentication**
   - Under **Implicit grant and hybrid flows:**
     - ✅ Check **Access tokens**
     - ✅ Check **ID tokens**
   - Under **Advanced settings:**
     - Allow public client flows: **No**

### Step 2: Update Application Code

**Option A: Using Configuration File (Recommended)**

```javascript
// Create js/features/auth/teams-config.js
export const TEAMS_CONFIG = {
    CLIENT_ID: 'abc123-your-actual-client-id-xyz789',
    TENANT_ID: 'def456-your-actual-tenant-id-uvw012',
    REDIRECT_URI: 'https://yourdomain.com/tools/auth-callback.html',
    SCOPES: ['openid', 'profile', 'email', 'offline_access', 'Files.ReadWrite'],
    DATA_FILENAME: 'physics-audit-data.json',
    AUTO_SAVE_INTERVAL: 30000,
};
```

**Option B: Environment Variables (Requires Build System)**

```javascript
// If using Vite or similar build tool
export const TEAMS_CONFIG = {
    CLIENT_ID: import.meta.env.VITE_TEAMS_CLIENT_ID,
    TENANT_ID: import.meta.env.VITE_TEAMS_TENANT_ID,
    // ...
};
```

### Step 3: Test Authentication

1. **Test the OAuth flow:**
   ```
   https://yourdomain.com
   → Click "Login with Microsoft Teams"
   → Redirects to Microsoft login
   → User authenticates
   → Redirects back to /tools/auth-callback.html
   → Callback extracts token and closes window
   → User is logged in
   ```

2. **Check browser console** for any errors

3. **Verify token storage** in IndexedDB (Developer Tools > Application > IndexedDB)

---

## Security Best Practices

### ✅ DO:

- Store credentials in a separate config file
- Add config file to `.gitignore`
- Use HTTPS for redirect URIs (except localhost testing)
- Rotate credentials if accidentally committed
- Use environment variables in CI/CD
- Limit API permissions to minimum required
- Review Azure AD logs regularly

### ❌ DON'T:

- Commit credentials to Git
- Share credentials in public forums
- Use same credentials for dev/staging/prod
- Grant excessive API permissions
- Hardcode credentials in source files

---

## Troubleshooting

### "AADSTS50011: The redirect URI specified in the request does not match"

**Fix:** Ensure redirect URI in code exactly matches Azure AD configuration (including trailing slash, http vs https)

### "AADSTS650053: The application is not configured to allow public clients"

**Fix:** In Azure AD > Authentication > Advanced settings, set "Allow public client flows" to Yes

### "AADSTS700016: Application not found in directory"

**Fix:** Ensure you're using the correct TENANT_ID and the app is registered in that tenant

### Tokens not persisting / login required every time

**Fix:** Ensure `offline_access` scope is included and admin consent granted

---

## Current Recommendation

**Until you receive Azure AD permissions:**

1. ✅ **Disable the Teams login button** (Option 1 above)
2. ✅ **Add a note** explaining Guest mode is available
3. ✅ **Create the config template** for future use
4. ✅ **Add teams-config.js to .gitignore**
5. ✅ **Document the setup process** (this file)

**When you receive permissions:**

1. Follow "Step 1: Azure AD App Registration"
2. Create `teams-config.js` with real credentials
3. Test authentication thoroughly
4. Re-enable the Teams login button
5. Update user documentation

---

## Implementation Status & Known Issues

### ✅ Implemented Features

- **OAuth 2.0 PKCE Flow** - Secure authentication without client secret
- **Teams SDK Integration** - Detects if running inside Microsoft Teams app
- **Fallback Web Flow** - Works in regular browsers via popup
- **JWT Token Decoding** - Extracts user info from ID token
- **Session Management** - Stores auth state in IndexedDB
- **Token Expiry** - Checks token expiration (24 hour validity)
- **Guest Mode Fallback** - Seamless fallback if Teams auth fails

### ⚠️ Partially Implemented / Placeholders

- **OneDrive Data Sync** - NOT IMPLEMENTED
  - Configuration variables exist (`DATA_FILENAME`, `AUTO_SAVE_INTERVAL`)
  - Functions `loadDataFromTeams()` and `startAutoSave()` are called but empty/incomplete
  - Currently Teams auth only provides authentication, NOT data sync
  - Data is still stored locally in IndexedDB even with Teams login
  - **Future work needed:** Implement Microsoft Graph API calls for OneDrive file operations

- **Auto-Save Timer** - Placeholder only
  - `startAutoSave()` is called but doesn't do anything yet
  - Would need OneDrive API integration to work

- **Refresh Token Flow** - May not work correctly
  - `offline_access` scope included but refresh logic not fully tested
  - Token expiry set to 24 hours but refresh mechanism unclear

### ❌ Known Issues

1. **Redirect URI Mismatch**
   - Code says: `REDIRECT_URI: window.location.origin + '/auth-callback.html'` (line 11 in teams.js)
   - File actually at: `/tools/auth-callback.html`
   - **Fix needed:** Change line 11 to `+ '/tools/auth-callback.html'`

2. **No Error Feedback to User**
   - If OAuth fails, error is logged to console but user sees generic "authentication failed"
   - Should display specific error messages (invalid tenant, permission denied, etc.)

3. **No Teams SDK Fallback**
   - If running in Teams but SDK fails to load, auth fails completely
   - Should fall back to web flow automatically

4. **No User Data Migration**
   - If a user logs in as Guest first, then later logs in with Teams, data doesn't migrate
   - Each auth method has separate data storage
   - **See "Data Migration" section below**

---

## Data Migration Between Auth Methods

### Current Behavior

**Data is isolated by authentication method:**

- **Guest Mode:** Data stored in IndexedDB with key `physicsAuditData_guest`
- **Teams Mode:** Data stored in IndexedDB with key `physicsAuditData_{user-id}`

**Problem:** If a user starts with Guest mode (recommended currently), their data doesn't automatically transfer when they later log in with Teams.

### Migration Options (Future Implementation)

**Option 1: Manual Export/Import** (Currently available)
1. User logs in as Guest
2. Goes to Settings → Data → Export Data
3. Saves JSON file
4. Logs out
5. Logs in with Teams
6. Goes to Settings → Data → Import Data
7. Selects previously exported file

**Option 2: Automatic Migration** (Not yet implemented)
Would need to:
1. Detect if user has Guest data when logging in with Teams
2. Show prompt: "We found local data. Would you like to import it into your Teams account?"
3. Merge Guest data into Teams user data
4. Optionally delete Guest data

**Option 3: Dual-Login Support** (Complex, not recommended)
- Allow switching between Guest and Teams without losing either dataset
- Would require UI changes and data management complexity

**Recommendation:** Implement Option 2 when Teams auth is fully configured.

---

## OneDrive Data Sync - Implementation Guide

### Current Status

**NOT IMPLEMENTED** - The code has placeholders but no actual OneDrive integration.

### What Would Be Needed

1. **Add Microsoft Graph API Permission**
   - In Azure AD, add `Files.ReadWrite` scope
   - Grant admin consent

2. **Implement File Operations** in `js/features/auth/data-management.js`:
   ```javascript
   async loadDataFromTeams() {
       // 1. Call Microsoft Graph API: GET /me/drive/root:/physics-audit-data.json:/content
       // 2. Parse JSON response
       // 3. Load into app state
       // 4. If file doesn't exist, create it with default data
   }

   async saveDataToTeams() {
       // 1. Serialize current app state to JSON
       // 2. Call Microsoft Graph API: PUT /me/drive/root:/physics-audit-data.json:/content
       // 3. Handle conflicts (if file was modified elsewhere)
   }

   startAutoSave() {
       // 1. Set interval timer (30 seconds default)
       // 2. Call saveDataToTeams() periodically
       // 3. Handle network errors gracefully
       // 4. Show sync status in UI
   }
   ```

3. **Add Microsoft Graph API Client**
   - Currently uses raw OAuth, would need Graph client library
   - Or implement HTTP requests manually with access token

4. **Handle Conflicts**
   - What if user modifies data on multiple devices?
   - Need conflict resolution strategy (last-write-wins, merge, user prompt)

5. **Offline Support**
   - OneDrive sync should work alongside local IndexedDB
   - Queue sync operations when offline
   - Sync when back online

### Why It's Not Implemented Yet

- **Complexity:** Requires robust error handling, conflict resolution, offline support
- **Dependencies:** Needs Microsoft Graph API library or custom HTTP client
- **Testing:** Hard to test without real Azure AD app and multiple devices
- **Local-First Design:** Current app works perfectly offline with IndexedDB
- **Scope Creep:** Was deemed non-essential for MVP

### Recommendation

**Phase 1 (Now):** Use Teams auth for **identity only**
- Users log in with Teams credentials
- Data still stored locally in IndexedDB
- Each user has isolated data based on their Teams ID

**Phase 2 (Future):** Add OneDrive sync as enhancement
- Implement when there's demand for multi-device sync
- Requires dedicated testing and quality assurance
- Consider using Microsoft Graph SDK for JavaScript

---

## Testing Procedures

### Before Deploying to Production

1. **Test OAuth Flow**
   - [ ] Open app in private/incognito window
   - [ ] Click "Login with Microsoft Teams"
   - [ ] Verify redirect to Microsoft login page
   - [ ] Login with test account
   - [ ] Verify redirect back to app
   - [ ] Check that user is logged in
   - [ ] Verify user info displays correctly

2. **Test Token Persistence**
   - [ ] Log in with Teams
   - [ ] Close browser completely
   - [ ] Reopen app
   - [ ] Verify still logged in (token loaded from IndexedDB)

3. **Test Token Expiry**
   - [ ] Log in with Teams
   - [ ] Wait 24 hours (or manually modify stored token expiry in IndexedDB)
   - [ ] Reload app
   - [ ] Verify prompted to log in again

4. **Test in Microsoft Teams App** (if applicable)
   - [ ] Add app to Teams as a tab
   - [ ] Verify Teams SDK loads
   - [ ] Verify SSO authentication works
   - [ ] Check that Teams context is available

5. **Test Fallback Flows**
   - [ ] Disable popups in browser
   - [ ] Attempt Teams login
   - [ ] Verify error message is helpful
   - [ ] Verify can still use Guest mode

6. **Test Data Isolation**
   - [ ] Log in as User A (Teams)
   - [ ] Rate some topics, create notes
   - [ ] Log out
   - [ ] Log in as User B (Teams)
   - [ ] Verify User A's data not visible
   - [ ] Verify User B starts fresh

7. **Cross-Browser Testing**
   - [ ] Test in Chrome
   - [ ] Test in Firefox
   - [ ] Test in Edge
   - [ ] Test in Safari (if using Apple device)

### Security Testing

1. **Test State Parameter Validation**
   - [ ] Attempt to replay authentication callback with old state token
   - [ ] Verify auth fails (prevents CSRF)

2. **Test PKCE Code Verifier**
   - [ ] Verify code_verifier is generated securely
   - [ ] Verify code_challenge sent in authorization request
   - [ ] Verify code_verifier sent in token exchange

3. **Test Token Storage**
   - [ ] Verify tokens stored in IndexedDB, not localStorage
   - [ ] Verify tokens not exposed in URL or session storage
   - [ ] Check DevTools → Application → IndexedDB → tokens are present

4. **Test Credential Protection**
   - [ ] Verify `teams-config.js` is in `.gitignore`
   - [ ] Attempt `git add js/features/auth/teams-config.js` (should be ignored)
   - [ ] Check that CLIENT_ID/TENANT_ID not exposed in browser DevTools

---

## Files Modified

- `index.html` - Teams login button (line 231-242, to disable/enable)
- `js/features/auth/teams.js` - Configuration location (line 7-17) & redirect URI (line 11 - needs fix)
- `js/features/auth/teams-config.template.js` - Template (needs to be created)
- `js/features/auth/teams-config.js` - Real config (create when ready, add to .gitignore)
- `.gitignore` - Protect credentials (line 30 - already configured ✅)
- `tools/auth-callback.html` - OAuth redirect endpoint (exists ✅)

### Code Changes Needed

**Priority: HIGH - Fix redirect URI**

In `js/features/auth/teams.js` line 11:
```javascript
// CURRENT (WRONG):
REDIRECT_URI: window.location.origin + '/auth-callback.html',

// SHOULD BE:
REDIRECT_URI: window.location.origin + '/tools/auth-callback.html',
```

---

## Related Documentation

- **[SECURITY.md](../../SECURITY.md)** - Security policy and Teams auth security warnings (lines 208-267)
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Local development setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment checklist
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and authentication flow

---

## Summary & Action Items

### Immediate Actions Required

1. **🔴 DISABLE Teams Login Button** in `index.html` (see Option 1 above)
   - Prevents user confusion and failed login attempts
   - App works perfectly in Guest mode while you configure Azure AD

2. **🟡 Fix Redirect URI** in `js/features/auth/teams.js` line 11
   - Change `/auth-callback.html` to `/tools/auth-callback.html`
   - Otherwise OAuth flow will fail even with valid credentials

3. **🟢 Create Configuration Template** (Optional but recommended)
   - Create `js/features/auth/teams-config.template.js` (see Option 2 above)
   - Ensures `.gitignore` is working correctly

### When You Get Azure AD Permissions

1. **Register App** in Azure Portal (follow Step 1 above)
2. **Create Real Config** `js/features/auth/teams-config.js` with actual credentials
3. **Test Thoroughly** (follow Testing Procedures above)
4. **Re-enable Button** in `index.html`
5. **Update User Docs** if needed

### Future Enhancements (Not Urgent)

- Implement OneDrive data sync (see OneDrive section above)
- Add automatic data migration from Guest to Teams mode
- Improve error messages for users
- Add refresh token logic for sessions > 24 hours

---

## Questions?

- **Azure AD setup:** Contact your IT admin or Azure administrator
- **OAuth/PKCE flow:** See `js/features/auth/teams.js` implementation
- **Security concerns:** See [SECURITY.md](../../SECURITY.md) lines 208-267
- **Data management:** See `js/features/auth/data-management.js`
- **General questions:** Open an issue or contact the development team

**External Resources:**
- [Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)
- [OAuth 2.0 PKCE Flow](https://oauth.net/2/pkce/)
- [Microsoft Teams JavaScript SDK](https://docs.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/auth-aad-sso)

---

**Last Updated:** 2025-11-21
**Status:** Teams Auth Currently DISABLED (placeholder credentials)
**Priority:** Medium (Guest mode fully functional alternative)
