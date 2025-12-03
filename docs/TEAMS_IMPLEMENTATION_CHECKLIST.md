# Teams Authentication - Implementation Checklist

**Target Audience**: Technical implementer familiar with Azure AD and backend deployment  
**Status**: Backend modules ready, Azure AD configuration required  
**Last Updated**: 2025-12-02

---

## ✅ What's Already Built

### 1. Client-Side Authentication

**Files**:
- [`js/features/auth/teams.js`](../js/features/auth/teams.js) - Teams authentication flow (OAuth 2.0 + PKCE)
- [`js/features/auth/guest.js`](../js/features/auth/guest.js) - Guest mode (current default)
- [`js/features/auth/data-management.js`](../js/features/auth/data-management.js) - User-specific data isolation
- [`js/features/auth/index.js`](../js/features/auth/index.js) - Auth facade with lazy loading

**Features Implemented**:
- ✅ OAuth 2.0 authorization code flow with PKCE
- ✅ State parameter CSRF protection
- ✅ JWT token parsing and validation
- ✅ User-specific IndexedDB storage (`physicsAuditData_teams_{userId}`)
- ✅ Token expiry checking
- ✅ Login button (currently disabled in `index.html` line 232)

**Current Status**: 🟡 Placeholder credentials only (`CLIENT_ID: 'your-teams-app-client-id'`)

---

### 2. Backend Authentication Modules

**Files** (NEW - created 2025-12-02):
- [`js/features/auth/auth-backend.js`](../js/features/auth/auth-backend.js) - JWT validation, PKCE verification, token refresh
- [`js/features/auth/api-client.js`](../js/features/auth/api-client.js) - RESTful API client with retry logic

**Capabilities**:
- ✅ JWT signature and expiry validation (5min clock skew tolerance)
- ✅ PKCE code verifier verification (SHA-256)
- ✅ Authorization code → token exchange
- ✅ Refresh token rotation
- ✅ Secure session storage in IndexedDB
- ✅ Automatic token refresh before API calls
- ✅ Background sync manager (IndexedDB-first pattern)
- ✅ Exponential backoff retry (3 attempts: 1s, 2s, 4s delays)

**API Endpoints Designed**:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/user/profile
GET    /api/v1/user/data
POST   /api/v1/user/data/sync
PUT    /api/v1/user/confidence
PUT    /api/v1/user/notes
PUT    /api/v1/user/flashcards
PUT    /api/v1/user/mindmaps
POST   /api/v1/user/analytics
```

4. **FlashcardDecks** - Deck metadata
5. **Flashcards** - Question-answer pairs
6. **Mindmaps** - Canvas data (JSON format)
7. **AnalyticsHistory** - Append-only progress log
8. **Sessions** - Refresh token storage (SHA-256 hashed)

**Security Features**:
- ✅ Row-level security (RLS) policies
- ✅ Foreign key cascading deletes
- ✅ Indexed for query performance
- ✅ Encryption at rest (TDE enabled by default on Azure SQL)

**Current Status**: 🟡 Schema documented, database not provisioned

---

## ⚠️ What Needs to Be Done

### Phase 1: Azure AD Configuration (Required First)

1. **Create Azure AD App Registration**
   - Navigate to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
   - Click "New registration"
   - **Name**: `Physics Knowledge Audit Tool`
   - **Supported account types**: Choose based on your org needs
     - Single tenant: Your org only
     - Multi-tenant: Any Azure AD org
   - **Redirect URI**: 
     - Platform: `Single-page application (SPA)`
     - URI: `https://yourdomain.com/auth-callback.html`
   
2. **Configure API Permissions**
   - Go to "API permissions"
   - Add: `Microsoft Graph` → `Delegated permissions`
   - Required scopes:
     - ✅ `openid`
     - ✅ `profile`
     - ✅ `email`
     - ✅ `offline_access` (for refresh tokens)
     - ✅ `Files.ReadWrite` (if using OneDrive sync - optional for now)
   - Click "Grant admin consent"

3. **Enable Implicit Grant (for SPA)**
   - Go to "Authentication"
   - Under "Implicit grant and hybrid flows":
     - ✅ Check "ID tokens"
   - Save

4. **Copy Credentials**
   - Go to "Overview"
   - Copy **Application (client) ID** → This is your `CLIENT_ID`
   - Copy **Directory (tenant) ID** → This is your `TENANT_ID`

**Time**: ~15 minutes

---

### Phase 2: Update Application Configuration

1. **Create Configuration File**
   - Copy [`js/features/auth/teams.js`](../js/features/auth/teams.js) lines 7-17
   - Create `js/features/auth/teams-config.js`:
   
   ```javascript
   export const TEAMS_CONFIG = {
       CLIENT_ID: 'YOUR-ACTUAL-CLIENT-ID-HERE',  // From Azure AD
       TENANT_ID: 'YOUR-ACTUAL-TENANT-ID-HERE',  // From Azure AD
       REDIRECT_URI: window.location.origin + '/auth-callback.html',
       SCOPES: ['openid', 'profile', 'email', 'offline_access'],
       DATA_FILENAME: 'physics-audit-data.json',
       AUTO_SAVE_INTERVAL: 30000,
   };
   ```

2. **Update .gitignore**
   - Ensure `js/features/auth/teams-config.js` is in `.gitignore`
   - This prevents committing credentials

3. **Import Real Config**
   - In `teams.js` line 7, change:
   ```javascript
   // OLD:
   const TEAMS_CONFIG = { CLIENT_ID: 'your-teams-app-client-id', ... };
   
   // NEW:
   import { TEAMS_CONFIG } from './teams-config.js';
   ```

4. **Enable Login Button**
   - In `index.html` line 232, uncomment/enable the Teams login button
   - Or change style from `display: none` to visible

**Time**: ~10 minutes

---

### Phase 3: Deploy Backend (Choose Option)

#### Option A: Azure Functions (Recommended - Serverless)

**Pros**: Auto-scaling, pay-per-use, minimal ops  
**Cons**: Cold start latency (~2s), 230s timeout  
**Cost**: ~$0.20 per million requests (Free tier: 1M requests/month)

**Steps**:
1. Create Azure Functions app (Node.js runtime)
2. Implement API endpoints using code from `auth-backend.js` and `api-client.js`
3. Set environment variables:
   - `DATABASE_CONNECTION_STRING`
   - `JWT_SECRET` (for signing custom tokens if needed)
4. Deploy using VS Code extension or Azure CLI

**Time**: ~2-3 hours

#### Option B: Azure App Service (Container)

**Pros**: No cold starts, longer timeout (unlimited), easier debugging  
**Cons**: Higher cost, requires scaling config  
**Cost**: ~$13/month (B1 tier) - $55/month (S1 tier)

**Steps**:
1. Create Express.js/Fastify server implementing API endpoints
2. Containerize with Docker
3. Deploy to Azure App Service
4. Configure environment variables

**Time**: ~3-4 hours

#### Option C: Skip Backend for Now (OneDrive Sync)

**If you want to avoid backend initially**:
- Use Microsoft Graph API to save/load data to OneDrive
- Implement in `teams.js` functions: `saveDataToTeams()` and `loadDataFromTeams()`
- See existing documentation in [`TEAMS_AUTH_ARCHITECTURE.md`](../docs/TEAMS_AUTH_ARCHITECTURE.md) lines 398-455

**Pros**: No backend deployment needed  
**Cons**: Limited query capabilities, manual conflict resolution

---

### Phase 4: Provision Database

1. **Create Azure SQL Database**
   - Portal → Create Resource → SQL Database
   - **Tier**: Serverless (recommended for <1000 users)
   - **Region**: Same as backend for low latency
   - **Compute**: 0.5-1 vCores (auto-pause enabled)
   
2. **Run Schema Scripts**
   - Copy SQL from [`notes/database-schemas.md`](../notes/database-schemas.md)
   - Run in Azure Query Editor or SSMS:
     1. Create tables (8 tables)
     2. Create indexes (6 composite indexes)
     3. Enable row-level security
     4. Create security function and policy
   
3. **Configure Firewall**
   - Add backend server IP to SQL firewall rules
   - For development: Enable "Allow Azure services"

4. **Connection String**
   - Copy connection string from Azure Portal
   - Store in backend environment variable: `DATABASE_CONNECTION_STRING`

**Time**: ~30 minutes  
**Cost**: ~$5-15/month (Serverless with auto-pause)

---

### Phase 5: Configure API Base URL

**In `index.html`** (before loading app), add:

```html
<script>
  window.PHYSICS_AUDIT_CONFIG = {
    API_BASE_URL: 'https://your-backend-name.azurewebsites.net'
  };
</script>
```

This tells `api-client.js` where to send API requests.

---

### Phase 6: Testing Checklist

**Smoke Tests**:
- [ ] Login button visible and clickable
- [ ] Clicking login redirects to Microsoft login page
- [ ] After login, user redirected back to app with auth code
- [ ] Token exchange succeeds (check browser console)
- [ ] User data loads (check IndexedDB in DevTools)
- [ ] Data saves (modify confidence, check backend database)
- [ ] Logout clears session

**Security Tests**:
- [ ] Expired token triggers refresh
- [ ] Invalid token rejected
- [ ] PKCE verification passes
- [ ] Row-level security prevents cross-user data access

**Performance Tests**:
- [ ] Background sync runs every 60 seconds
- [ ] API requests complete in <2 seconds
- [ ] Token refresh completes in <1 second

---

## 📋 Quick Reference

### Current Placeholder Values (Need Replacement)

| File | Line | Placeholder | Replace With |
|------|------|-------------|--------------|
| `teams.js` | 9 | `'your-teams-app-client-id'` | Azure AD Client ID |
| `teams.js` | 10 | `'your-tenant-id'` | Azure AD Tenant ID |
| `api-client.js` | 36 | `'https://your-backend.azurewebsites.net'` | Actual backend URL |

### File Locations

```
js/features/auth/
├── index.js                 // Auth facade (exports all modules)
├── guest.js                 // Guest mode (current default)
├── teams.js                 // Teams OAuth flow ⚠️ Needs config
├── teams-config.js          // 🔴 CREATE THIS (with real credentials)
├── auth-backend.js          // JWT validation, PKCE (NEW)
├── api-client.js            // API client, background sync (NEW)
└── data-management.js       // User-specific storage
```

### Environment Variables (Backend)

```bash
# Azure SQL Connection
DATABASE_CONNECTION_STRING="Server=tcp:yourserver.database.windows.net,1433;..."

# Optional: JWT signing (if implementing custom tokens)
JWT_SECRET="your-secret-key-here"

# Optional: Logging
LOG_LEVEL="info"
```

---

## 🔗 Related Documentation

### Existing Guides (Detailed)

1. **[TEAMS_AUTH_ARCHITECTURE.md](../TEAMS_AUTH_ARCHITECTURE.md)** (~350 lines)
   - **Purpose**: Technical architecture overview
   - **Covers**: System components, data flow, security patterns
   - **Use when**: Understanding how the system works
   - **Status**: ✅ Keep for architecture reference

2. **[database-schemas.md](database-schemas.md)** (500 lines)
   - **Purpose**: SQL schema reference
   - **Status**: ✅ Keep - essential technical reference

### Suggested Documentation Consolidation

**Merge Strategy**:
- ✅ **Keep**: `TEAMS_AUTH_ARCHITECTURE.md` (unique architectural content)
- ⚠️ **Archive**: `TEAMS_AUTH_ARCHITECTURE.md` (duplicate of this checklist)
- ✅ **Keep**: `database-schemas.md` (technical reference)
- ✅ **New**: This file - concise implementation checklist

**Benefits**:
- Single source of truth for "how to implement"
- Reduced maintenance burden (one file to update)
- Faster onboarding (15 min read vs 60+ min)

---

## ⏱️ Time Estimates

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| 1 | Azure AD Setup | 15 min | ⭐ Easy |
| 2 | App Config | 10 min | ⭐ Easy |
| 3 | Backend Deploy | 2-4 hours | ⭐⭐⭐ Medium-Hard |
| 4 | Database Setup | 30 min | ⭐⭐ Medium |
| 5 | API Config | 5 min | ⭐ Easy |
| 6 | Testing | 1 hour | ⭐⭐ Medium |
| **Total** | **End-to-end** | **4-6 hours** | |

---

## 🆘 Troubleshooting Quick Fixes

### "process is not defined" Error
- **Cause**: `api-client.js` used Node.js pattern
- **Fix**: Already fixed (2025-12-02) - uses `window.PHYSICS_AUDIT_CONFIG` instead

### Login Fails with "Invalid Redirect URI"
- **Check**: Azure AD redirect URI matches exactly: `https://yourdomain.com/auth-callback.html`
- **Common mistake**: Trailing slash difference

### Token Validation Fails
- **Check**: System clock synchronized (PKCE uses timestamps)
- **Check**: `TENANT_ID` matches Azure AD directory

### Database Connection Fails
- **Check**: Firewall rules allow backend IP
- **Check**: Connection string has correct credentials
- **Check**: SQL server not paused (Serverless tier auto-pauses)

### Background Sync Not Running
- **Check**: User is logged in (session exists)
- **Check**: `window.Alpine.store('app')` is defined
- **Check**: Backend API_BASE_URL configured

---

**Status**: 🟡 Ready for Azure AD configuration and backend deployment  
**Next Action**: Complete Phase 1 (Azure AD Setup)
