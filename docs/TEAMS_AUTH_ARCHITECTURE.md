# Teams Authentication Architecture

**Purpose**: Technical overview of the Teams authentication system architecture  
**Audience**: System architects, technical implementers  
**For step-by-step implementation**: See [TEAMS_IMPLEMENTATION_CHECKLIST.md](../TEAMS_IMPLEMENTATION_CHECKLIST.md)

---

## System Overview

The Physics Knowledge Audit Tool uses a **hybrid offline-first architecture** with Microsoft Teams authentication:

```
┌─────────────────────────────────────────────────────────┐
│  Client (Browser)                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Physics Audit PWA                               │   │
│  │  • IndexedDB (primary storage)                  │   │
│  │  • Background sync manager                      │   │
│  │  • OAuth 2.0 + PKCE flow                       │   │
│  └──────────────┬──────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────┘
                  │
                  ├─── OAuth 2.0 Flow ────┐
                  │                         │
                  ▼                         ▼
    ┌──────────────────────┐    ┌─────────────────────┐
    │  Azure AD            │    │  Backend API        │
    │  (Microsoft Identity)│    │  (Node.js/Express)  │
    │                      │    │  • Token validation │
    │  • User auth         │    │  • API endpoints    │
    │  • Token issuance    │    │  • Session mgmt     │
    └──────────────────────┘    └──────────┬──────────┘
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │  Azure SQL Database      │
                              │  (Serverless tier)       │
                              │                          │
                              │  • Users                 │
                              │  • ConfidenceLevels      │
                              │  • Notes, Flashcards     │
                              │  • Mindmaps              │
                              │  • AnalyticsHistory      │
                              │  • Sessions              │
                              └──────────────────────────┘
```

---

## Architecture Components

### 1. Client Layer

**Technology**: Progressive Web App (PWA) with Alpine.js  
**Location**: [`/js/features/auth/`](../../js/features/auth/)

**Modules**:
- [`guest.js`](../../js/features/auth/guest.js) - Anonymous local storage
- [`teams.js`](../../js/features/auth/teams.js) - OAuth 2.0 flow with PKCE
- [`auth-backend.js`](../../js/features/auth/auth-backend.js) - JWT validation, token refresh
- [`api-client.js`](../../js/features/auth/api-client.js) - RESTful API client
- [`data-management.js`](../../js/features/auth/data-management.js) - User-specific storage

**Storage Pattern**: IndexedDB-first
- Primary storage: Browser IndexedDB
- Background sync: Periodic push to SQL Server
- Offline support: Full functionality without connectivity
- Conflict resolution: Last-write-wins with timestamp

---

### 2. Authentication Flow

**Protocol**: OAuth 2.0 Authorization Code Flow with PKCE  
**Provider**: Azure AD (Microsoft Identity Platform)

**Flow Sequence**:
1. User clicks "Login with Microsoft Teams"
2. Client generates PKCE code verifier & challenge (SHA-256)
3. Redirect to Azure AD login page
4. User authenticates with Microsoft credentials
5. Azure AD redirects back with authorization code
6. Client exchanges code for access token + refresh token
7. Tokens stored in IndexedDB (NOT localStorage)
8. Session valid for 1 hour, refresh token valid for 90 days

**Security Features**:
- PKCE prevents authorization code interception
- State parameter prevents CSRF
- Token expiry validation (5min clock skew tolerance)
- Tenant ID verification
- No client secrets (public client pattern)

**Token Storage**:
```javascript
// IndexedDB structure
{
  key: 'physicsAuditData_auth_session',
  value: {
    accessToken: 'eyJ0eXAi...',
    refreshToken: 'encrypted_refresh_token',
    expiresAt: 1702345678000,
    user: { id, email, displayName, tenantId }
  }
}
```

---

### 3. Backend API

**Technology**: Node.js with Express.js (recommended)  
**Hosting**: Azure Functions (serverless) or Azure App Service  
**Connection**: RESTful HTTP/JSON API

**Endpoints**:
```
Authentication:
POST   /api/v1/auth/login          # Exchange authorization code
POST   /api/v1/auth/refresh        # Refresh access token
POST   /api/v1/auth/logout         # Invalidate session

User Data:
GET    /api/v1/user/profile        # Get user info
GET    /api/v1/user/data           # Get all user data
POST   /api/v1/user/data/sync      # Sync local data to server
PUT    /api/v1/user/confidence     # Update confidence levels
PUT    /api/v1/user/notes          # Update notes
PUT    /api/v1/user/flashcards     # Update flashcards
PUT    /api/v1/user/mindmaps       # Update mindmaps
POST   /api/v1/user/analytics      # Add analytics entry
```

**Request Pattern**:
- Authorization: `Bearer {access_token}` header
- Automatic token refresh before request
- Retry with exponential backoff (3 attempts: 1s, 2s, 4s)
- 30-second timeout

---

### 4. Database Layer

**Technology**: Azure SQL Database (Serverless tier)  
**Schema**: See [database-schemas.md](../database-schemas.md)

**Tables** (8 total):

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| Users | Azure AD identity mapping | UserID, AzureADObjectID, Email |
| ConfidenceLevels | Per-user topic ratings (1-5) | UserID, TopicID, Level |
| Notes | User notes with HTML content | UserID, TopicID, Content |
| FlashcardDecks | Deck metadata | UserID, DeckID, Title |
| Flashcards | Question-answer pairs | DeckID, Question, Answer |
| Mindmaps | Canvas data (JSON) | UserID, TopicID, CanvasData |
| AnalyticsHistory | Progress tracking log | UserID, Timestamp, Data |
| Sessions | Refresh token storage | UserID, TokenHash, ExpiresAt |

**Security**: Row-Level Security (RLS)
```sql
-- Users can only access their own data
CREATE SECURITY POLICY UserDataPolicy
ADD FILTER PREDICATE dbo.fn_securitypredicate(UserID) ON dbo.Notes;
```

**Indexes**: Optimized for user-specific queries
```sql
CREATE INDEX IX_ConfidenceLevels_User_Topic 
ON ConfidenceLevels(UserID, TopicID);
```

---

## Data Flow

### Write Path (User saves data)

```
1. User modifies confidence level
   ↓
2. Saved to IndexedDB immediately (offline-first)
   ↓
3. Background sync manager triggers (every 60s)
   ↓
4. API request: PUT /api/v1/user/confidence
   ↓
5. Backend validates token, writes to SQL
   ↓
6. Success response (or retry on failure)
```

### Read Path (User loads data)

```
1. User logs in
   ↓
2. Load from IndexedDB (instant access)
   ↓
3. Background fetch: GET /api/v1/user/data
   ↓
4. Compare timestamps, merge any server changes
   ↓
5. Update IndexedDB with latest data
```

---

## Key Design Patterns

### Offline-First
- **Primary storage**: Browser IndexedDB
- **Backup storage**: Azure SQL Server
- **Sync strategy**: Background periodic push
- **Conflict resolution**: Last-write-wins (timestamp-based)

### Security-First
- **Tokens**: Stored in IndexedDB (NOT localStorage per `claude.md` rule #15)
- **Content**: DOMPurify sanitization client-side
- **Validation**: JWT signature, expiry, tenant ID checks
- **Isolation**: Row-level security at database layer

### Performance-First
- **Lazy loading**: Auth modules loaded on-demand
- **Caching**: IndexedDB acts as full cache
- **Batching**: Background sync batches writes
- **Indexing**: Database indexes for common queries

---

## File Structure

```
/PhysRev-main
├── js/features/auth/
│   ├── index.js                    # Auth facade (exports)
│   ├── guest.js                    # Guest mode
│   ├── teams.js                    # OAuth flow ⚠️ Needs config
│   ├── teams-config.js             # 🔴 CREATE THIS
│   ├── auth-backend.js             # JWT validation (NEW)
│   ├── api-client.js               # API client (NEW)
│   └── data-management.js          # Storage layer
│
├── notes/
│   ├── database-schemas.md         # SQL schema reference
│   └── TEAMS_IMPLEMENTATION_CHECKLIST.md  # Implementation guide
│
└── docs/
    └── TEAMS_AUTH_ARCHITECTURE.md  # This file
```

---

## Configuration

### Required Environment Variables (Backend)

```bash
# Azure SQL Connection
DATABASE_CONNECTION_STRING="Server=tcp:yourserver.database.windows.net,1433;..."

# Optional
JWT_SECRET="your-secret-key"  # If implementing custom tokens
LOG_LEVEL="info"
```

### Required Client Config

**File**: `js/features/auth/teams-config.js` (create this)

```javascript
export const TEAMS_CONFIG = {
    CLIENT_ID: 'YOUR-AZURE-AD-CLIENT-ID',
    TENANT_ID: 'YOUR-AZURE-AD-TENANT-ID',
    REDIRECT_URI: window.location.origin + '/auth-callback.html',
    SCOPES: ['openid', 'profile', 'email', 'offline_access'],
    DATA_FILENAME: 'physics-audit-data.json',
    AUTO_SAVE_INTERVAL: 30000,
};
```

**File**: `index.html` (add before app loads)

```html
<script>
  window.PHYSICS_AUDIT_CONFIG = {
    API_BASE_URL: 'https://your-backend.azurewebsites.net'
  };
</script>
```

---

## Azure AD Configuration

**App Registration Settings**:
- **Platform**: Single-page application (SPA)
- **Redirect URI**: `https://yourdomain.com/auth-callback.html`
- **Implicit grant**: ✅ ID tokens (for backward compatibility)
- **API permissions**:
  - `openid`
  - `profile`
  - `email`
  - `offline_access` (refresh tokens)

---

## Monitoring & Observability

### Client-Side Logging
- Console debug logs (development only)
- Error tracking in `logger.js`
- IndexedDB storage inspection via DevTools

### Backend Metrics
- Request latency
- Token validation failures
- Database query performance
- Background sync success rate

### Database Monitoring
- Active connections
- Query execution times
- Storage size (Serverless auto-pause)
- Row-level security policy hits

---

## Deployment Topology

### Development
```
Client: localhost:5500 (Live Server)
Backend: localhost:3000 (Node.js)
Database: Azure SQL (dev tier)
```

### Production
```
Client: https://yourdomain.com (Static hosting)
Backend: https://your-backend.azurewebsites.net (Azure Functions)
Database: Azure SQL Serverless (auto-pause enabled)
```

---

## Related Documentation

- **[TEAMS_IMPLEMENTATION_CHECKLIST.md](../TEAMS_IMPLEMENTATION_CHECKLIST.md)** - Step-by-step implementation guide (4-6 hours)
- **[database-schemas.md](../database-schemas.md)** - Complete SQL schema with rationale
- **[claude.md](../../claude.md)** - Project coding standards and security rules
- **[auth/index.js](../../js/features/auth/index.js)** - Auth module exports
- **[api-client.js](../../js/features/auth/api-client.js)** - API endpoint definitions

---

**Last Updated**: 2025-12-02  
**Status**: Backend modules ready, Azure AD configuration required  
**Next Steps**: See [TEAMS_IMPLEMENTATION_CHECKLIST.md](../TEAMS_IMPLEMENTATION_CHECKLIST.md)
