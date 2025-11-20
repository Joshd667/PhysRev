# Microsoft Teams Authentication Setup Guide

## Current Status

⚠️ **Teams authentication is currently configured with placeholder credentials and will not work.**

**Location:** `js/features/auth/teams.js`

```javascript
const TEAMS_CONFIG = {
    CLIENT_ID: 'your-teams-app-client-id',  // ❌ PLACEHOLDER
    TENANT_ID: 'your-tenant-id',            // ❌ PLACEHOLDER
    // ...
};
```

---

## What To Do If You Don't Have Azure AD Permissions Yet

### Option 1: Disable Teams Login (Recommended Until Ready)

**Why:** Prevents user confusion and failed login attempts

**How to disable:**

1. **Hide the Teams login button in `index.html`:**

```html
<!-- Around line 193, comment out the Teams button -->
<!-- TEMPORARILY DISABLED - Awaiting Azure AD App Registration
<button @click="initiateTeamsLogin()"
        :disabled="isLoading"
        class="w-full flex items-center...">
    ... Teams Login Button ...
</button>
-->

<!-- Add a note for users -->
<div class="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
    Microsoft Teams login temporarily unavailable.
    Please use Guest mode (local storage only).
</div>
```

2. **Update the login prompt:**

```html
<!-- Change line ~188 -->
<p class="text-gray-600 dark:text-gray-400">
    Login as Guest to save your progress locally
</p>
```

This allows the app to function fully in Guest mode while you wait for Azure AD permissions.

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
    // This should be: https://yourdomain.com/tools/auth-callback.html
    REDIRECT_URI: window.location.origin + '/tools/auth-callback.html',

    // OAuth Scopes
    SCOPES: ['openid', 'profile', 'email', 'offline_access'],

    // OneDrive configuration (for data sync)
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

## Files Modified

- `index.html` - Teams login button (to disable/enable)
- `js/features/auth/teams.js` - Configuration location
- `js/features/auth/teams-config.template.js` - Template (create this)
- `js/features/auth/teams-config.js` - Real config (create when ready, add to .gitignore)
- `.gitignore` - Protect credentials

---

## Questions?

- **Azure AD setup:** Contact your IT admin or Azure administrator
- **OAuth/PKCE flow:** See `js/features/auth/teams.js` implementation
- **Security concerns:** See `SECURITY.md`

**Resources:**
- [Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)
- [OAuth 2.0 PKCE Flow](https://oauth.net/2/pkce/)
