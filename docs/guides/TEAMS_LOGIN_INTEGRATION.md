# Microsoft Teams Login Integration - Technical Decision Guide

## Executive Summary

This document provides a comprehensive technical overview for integrating Microsoft Teams authentication with the Physics Knowledge Audit Tool. It focuses on helping technical staff understand the architecture, evaluate options, and make informed decisions about implementation approaches rather than providing step-by-step implementation code.

**Target Audience**: Technical decision-makers, system architects, IT administrators, and senior developers evaluating authentication and data storage strategies.

**Key Questions This Guide Answers**:
- What are the different ways to integrate Teams authentication?
- Which Azure database option is right for our use case?
- What are the security implications of each approach?
- What infrastructure and resources are required?
- What are the ongoing costs and maintenance requirements?

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Integration Options](#authentication-integration-options)
3. [Server Infrastructure Approaches](#server-infrastructure-approaches)
4. [Azure Database Options Comparison](#azure-database-options-comparison)
5. [Security Architecture](#security-architecture)
6. [Requirements & Prerequisites](#requirements--prerequisites)
7. [Decision Framework](#decision-framework)
8. [Cost Analysis](#cost-analysis)

---

## Architecture Overview

### Current State: Client-Only Architecture

The Physics Audit Tool currently operates as a **fully client-side Progressive Web App (PWA)**:

- **Authentication**: Guest mode only (no server authentication)
- **Data Storage**: IndexedDB in the user's browser
- **Data Sync**: None (local-only)
- **Infrastructure**: Static file hosting (GitHub Pages, Netlify, etc.)
- **Cost**: Free or minimal ($0-5/month for hosting)

**Limitations of Current Architecture**:
- Data tied to specific browser/device
- No multi-device synchronization
- No organizational identity management
- No centralized data backup
- Difficult to deploy organization-wide with user tracking

### Proposed State: Hybrid Architecture with Teams Integration

Integrating Microsoft Teams authentication introduces several architectural components:

```
┌─────────────────────────────────────────────────────────────┐
│  User's Browser (Client Application)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Physics Audit PWA                                   │   │
│  │  - Local IndexedDB cache (offline support)          │   │
│  │  - Authentication flow handler                      │   │
│  │  - Token management                                 │   │
│  └───────────────┬─────────────────────────────────────┘   │
└────────────────┬─┴─────────────────────────────────────────┘
                 │
                 ├─── OAuth 2.0 / Teams SDK ───┐
                 │                               │
                 ▼                               ▼
    ┌────────────────────────┐      ┌──────────────────────┐
    │  Azure AD              │      │  Optional Backend    │
    │  (Microsoft Identity)  │      │  (Token validation,  │
    │                        │      │   API endpoints)     │
    │  - User authentication │      └──────────┬───────────┘
    │  - Token issuance      │                 │
    │  - Permission grants   │                 │
    └────────────────────────┘                 │
                                                │
                                                ▼
                                   ┌────────────────────────┐
                                   │  Data Storage Layer    │
                                   │  (Choose one option)   │
                                   │                        │
                                   │  • Azure SQL Database  │
                                   │  • Azure Cosmos DB     │
                                   │  • OneDrive/SharePoint │
                                   └────────────────────────┘
```

**Key Architectural Changes**:
1. **User Identity**: Managed by Azure AD instead of anonymous guest mode
2. **Authentication**: OAuth 2.0 flow or Teams SDK Single Sign-On (SSO)
3. **Data Storage**: Optional cloud storage in addition to local cache
4. **Backend Services**: Optional server component for advanced features
5. **Network Requirements**: Internet connectivity for authentication and sync

---

## Authentication Integration Options

### Option 1: Teams SDK Single Sign-On (SSO)

**Best For**: Applications embedded as Microsoft Teams tabs

**How It Works**:
When the Physics Audit Tool runs inside the Microsoft Teams application (as a tab within a Team or Channel), it can leverage Teams' built-in authentication system. The Teams JavaScript SDK provides a seamless single sign-on experience where users are automatically authenticated using their existing Teams session.

**User Experience**:
- User opens the app within Teams
- No additional login required (already authenticated to Teams)
- Silent authentication in background
- Immediate access to the application

**Technical Requirements**:
- App must be packaged as a Teams application (manifest.json for Teams)
- Teams JavaScript SDK must be loaded in the client
- App registration in Azure AD with Teams-specific configuration
- Application must detect Teams context and choose appropriate auth flow

**Advantages**:
- ✅ Seamless user experience (no login prompt)
- ✅ Automatic integration with organizational directory
- ✅ Works offline once authenticated
- ✅ Access to Teams context (team name, channel, user role)
- ✅ Can leverage Teams' permission model

**Limitations**:
- ⚠️ Only works inside Teams (not in regular web browsers)
- ⚠️ Requires Teams app packaging and deployment
- ⚠️ Additional approval process for Teams app store (if widely distributed)
- ⚠️ Limited to Microsoft 365 organizations

**When to Choose**:
- You're deploying exclusively within a Microsoft Teams environment
- Users will primarily access through Teams tabs
- You want the tightest integration with Teams features
- Your organization already uses Teams extensively

---

### Option 2: Web-Based OAuth 2.0 Flow

**Best For**: Standalone web applications accessed via browser

**How It Works**:
The application redirects users to Microsoft's login page (login.microsoftonline.com) where they enter credentials. After successful authentication, Microsoft redirects back to your application with an authorization code that can be exchanged for access tokens.

**User Experience**:
- User clicks "Login with Microsoft Teams"
- Popup window opens showing Microsoft login page
- User enters organizational credentials (or uses saved session)
- Popup closes automatically after successful authentication
- User is logged into the app

**Technical Requirements**:
- Registered application in Azure AD
- Redirect URI configured (e.g., https://yourdomain.com/auth-callback.html)
- OAuth scopes defined (what data/permissions the app needs)
- PKCE (Proof Key for Code Exchange) implementation for security
- Token storage mechanism (IndexedDB recommended)

**Advantages**:
- ✅ Works in any web browser (Chrome, Firefox, Safari, Edge)
- ✅ Can be accessed from any device
- ✅ No Teams app packaging required
- ✅ Standard OAuth 2.0 implementation (well-documented)
- ✅ Supports both organizational and personal Microsoft accounts

**Limitations**:
- ⚠️ Requires popup windows (may be blocked by browsers)
- ⚠️ Additional login step (not seamless like Teams SSO)
- ⚠️ Requires redirect URI to be publicly accessible
- ⚠️ Users must explicitly grant permissions on first login

**When to Choose**:
- Users will access the app via web browsers (not Teams)
- You need broad accessibility across devices
- You want to support both organizational and personal accounts
- You're deploying as a standalone PWA

---

### Option 3: Hybrid Approach (Recommended)

**Best For**: Maximum flexibility and user coverage

**How It Works**:
The application detects its runtime environment and chooses the appropriate authentication method automatically:
- If running inside Teams → Use Teams SDK SSO
- If running in a web browser → Use OAuth 2.0 popup flow

**Implementation Approach**:
The app performs runtime detection by checking for the Teams JavaScript SDK and Teams-specific context. Based on this detection, it selects the optimal authentication path without requiring user intervention.

**Advantages**:
- ✅ Best user experience in each environment
- ✅ Single codebase supports multiple deployment scenarios
- ✅ Graceful fallback if Teams SDK is unavailable
- ✅ Future-proof for new authentication methods

**Limitations**:
- ⚠️ More complex implementation (must handle both flows)
- ⚠️ Requires thorough testing in both environments
- ⚠️ Slightly larger JavaScript bundle size

**When to Choose**:
- You're unsure whether users will access via Teams or browser
- You want to support both scenarios with a single deployment
- You're planning to expand usage over time

---

## Server Infrastructure Approaches

A critical decision is whether to implement server-side components. This choice significantly impacts security, scalability, and maintenance requirements.

### Approach 1: Serverless (Client-Side Only with Cloud Storage)

**Architecture**:
- Client application authenticates directly with Azure AD
- Access tokens stored in browser (IndexedDB)
- Client makes direct API calls to Microsoft Graph API (OneDrive, SharePoint)
- No custom backend server required

**How It Works**:
After authentication, the client receives an access token that grants permission to read/write files on OneDrive or SharePoint. The application uses Microsoft Graph API directly from the browser to save and load user data stored as JSON files in the user's cloud storage.

**Advantages**:
- ✅ **Minimal Infrastructure**: Static file hosting only (GitHub Pages, Netlify)
- ✅ **Low Cost**: Often free or < $5/month
- ✅ **Simple Deployment**: No server to configure or maintain
- ✅ **Automatic Scaling**: CDNs handle traffic spikes
- ✅ **Built-in Authentication**: Microsoft Graph API validates tokens

**Limitations**:
- ⚠️ **Security Concerns**: Access tokens in browser JavaScript (XSS risk)
- ⚠️ **Limited Control**: Can't implement custom business logic server-side
- ⚠️ **API Rate Limits**: Microsoft Graph has rate limits per user
- ⚠️ **No Secret Storage**: Client ID is public (no client secret)
- ⚠️ **Limited Analytics**: Can't track usage server-side

**Best For**:
- Small deployments (<100 users)
- Trusted organizational environment
- Budget-constrained projects
- Rapid prototyping and MVP development

---

### Approach 2: Serverless Functions (Azure Functions / AWS Lambda)

**Architecture**:
- Client authenticates and receives authorization code
- Client sends code to serverless function
- Function validates code and exchanges for access token
- Function handles API calls to database or Microsoft Graph
- Tokens stored server-side (more secure)

**How It Works**:
Lightweight serverless functions handle security-sensitive operations like token exchange, data validation, and database operations. The client calls these functions via HTTPS endpoints, keeping secrets and complex logic off the client.

**Advantages**:
- ✅ **Better Security**: Client secret stored server-side
- ✅ **Token Protection**: Access tokens never exposed to browser
- ✅ **Pay-Per-Use**: Only charged for actual function executions
- ✅ **Auto-Scaling**: Handles traffic spikes automatically
- ✅ **Custom Logic**: Can implement business rules server-side
- ✅ **API Rate Limiting**: Control request rates per user

**Costs**:
- Azure Functions: ~$0.20 per million executions + ~$0.016/GB-hour
- Typical usage: $5-50/month depending on active users
- Free tier: 1 million executions/month included

**Limitations**:
- ⚠️ **Cold Start Latency**: First request may be slow (1-3 seconds)
- ⚠️ **Stateless Architecture**: Must design for stateless operations
- ⚠️ **Debugging Complexity**: More difficult than monolithic apps
- ⚠️ **Vendor Lock-In**: Azure-specific or AWS-specific code

**Best For**:
- Medium deployments (100-10,000 users)
- Organizations with Azure/AWS experience
- Applications needing custom API endpoints
- Projects requiring better security than client-only

---

### Approach 3: Dedicated Backend Server (Node.js / .NET / Python)

**Architecture**:
- Full backend application server (Express.js, ASP.NET Core, FastAPI)
- Handles all authentication flows server-side
- Implements RESTful API for client consumption
- Manages database connections and queries
- Can implement complex business logic, caching, background jobs

**How It Works**:
A traditional web application server handles all security-critical operations. The client is a thin JavaScript interface that communicates with the backend via HTTPS API calls. All sensitive data and operations remain server-side.

**Advantages**:
- ✅ **Maximum Security**: Complete control over authentication and authorization
- ✅ **Full Control**: Implement any custom logic or integration
- ✅ **Performance Optimization**: Server-side caching, database optimization
- ✅ **Advanced Features**: Background jobs, scheduled tasks, webhooks
- ✅ **Monitoring & Logging**: Comprehensive server-side observability
- ✅ **Multi-Tenant Support**: Easy to implement organizational isolation

**Costs**:
- Azure App Service: $50-200/month (Basic to Standard tier)
- Requires: Virtual machine or container hosting
- Additional: Database costs, monitoring, backup storage
- Total: $75-300/month typical

**Limitations**:
- ⚠️ **Higher Complexity**: Must maintain and update server application
- ⚠️ **Deployment Overhead**: CI/CD pipelines, staging environments
- ⚠️ **Scaling Responsibility**: Must configure auto-scaling
- ⚠️ **Higher Costs**: Always-on server instance required

**Best For**:
- Large deployments (>10,000 users)
- Enterprise organizations with dedicated IT teams
- Applications requiring complex business logic
- Projects with strict security/compliance requirements
- Multi-tenant SaaS deployments

---

## Azure Database Options Comparison

### Decision Criteria

Before choosing a database, consider:

1. **Data Volume**: How much data per user? Total expected data?
2. **Query Patterns**: Simple key-value lookups or complex queries?
3. **Scalability**: How many users? Expected growth rate?
4. **Global Distribution**: Users in multiple geographic regions?
5. **Budget**: What's the monthly budget for data storage?
6. **Expertise**: Team experience with SQL vs. NoSQL?

### Option A: Azure SQL Database

**What It Is**:
A fully-managed relational database service based on Microsoft SQL Server. Supports standard SQL queries, transactions, stored procedures, and enterprise features like encryption, auditing, and automated backups.

**Data Structure**:
Data is organized in tables with predefined schemas. For the Physics Audit Tool:
- `Users` table: User profiles and Azure AD identifiers
- `ConfidenceLevels` table: Topic ratings with foreign key to Users
- `AnalyticsHistory` table: Historical snapshots for progress tracking
- `Notes` table: User-created notes linked to topics

**Strengths**:
- ✅ **Familiar Technology**: Most developers know SQL
- ✅ **ACID Transactions**: Guaranteed data consistency
- ✅ **Complex Queries**: JOINs, aggregations, reporting queries
- ✅ **Strong Typing**: Schema enforcement prevents data corruption
- ✅ **Mature Tooling**: Azure Data Studio, SQL Server Management Studio
- ✅ **Enterprise Features**: Row-level security, Always Encrypted, Temporal Tables

**When It Excels**:
- Relational data with many connections (users ↔ topics ↔ notes)
- Need for complex reporting queries (e.g., "Average confidence by topic across all users")
- Team has SQL expertise
- Compliance requirements for traditional RDBMS
- Data integrity is critical (financial, academic records)

**Scalability Profile**:
- **Vertical Scaling**: Increase compute power (vCores) of single database
- **Horizontal Scaling**: Read replicas for reporting, sharding for large datasets
- **Limits**: Single database can scale to 4TB (General Purpose) or 100TB (Hyperscale)
- **Best Range**: 10 - 100,000 users

**Cost Structure**:
- **Basic Tier**: $5/month (2GB storage, suitable for development/testing)
- **Standard Tier**: $15-50/month (250GB storage, recommended for production)
- **Premium Tier**: $465+/month (enterprise features, high performance)
- **Serverless Option**: Pay only for compute used (~$8-40/month for intermittent usage)

**Recommended For**:
- Educational institutions with IT departments familiar with SQL databases
- Organizations with existing SQL Server expertise
- Applications requiring complex reporting and analytics
- Deployments needing 100-10,000 active users

---

### Option B: Azure Cosmos DB

**What It Is**:
A globally-distributed, multi-model NoSQL database designed for massive scale and low latency. Stores data as JSON documents with flexible schemas. Supports multiple consistency levels and automatic indexing of all properties.

**Data Structure**:
Each user's data stored as a single JSON document containing all their information:
- User profile, confidence levels, analytics history, notes, flashcards
- Nested structure mirrors the application's data model
- No predefined schema - documents can evolve over time

**Strengths**:
- ✅ **Global Distribution**: Replicate data across multiple Azure regions
- ✅ **Low Latency**: Single-digit millisecond response times
- ✅ **Elastic Scalability**: Automatic horizontal scaling
- ✅ **Flexible Schema**: Add new fields without migrations
- ✅ **Multi-Model**: Supports SQL API, MongoDB API, Cassandra API
- ✅ **Guaranteed SLAs**: 99.999% availability with multi-region

**When It Excels**:
- User base distributed globally (students in multiple countries)
- Need for very fast read/write operations
- Schema evolves frequently (adding new features regularly)
- Each user's data is mostly independent (not many cross-user queries)
- IoT-like workload (many independent documents, simple queries)

**Scalability Profile**:
- **Horizontal Scaling**: Automatic partitioning across nodes
- **Global Scale**: Multi-region writes, conflict resolution
- **Limits**: Essentially unlimited (petabyte-scale)
- **Best Range**: 1,000 - 10,000,000+ users

**Cost Structure**:
- **Serverless Mode**: $0.25 per million Request Units (RUs) + $0.25/GB storage
  - Typical usage: ~5-15 RUs per read, ~10-30 RUs per write
  - Example: 100 users × 20 operations/day = $0.50-2/month
- **Provisioned Mode**: $0.008/hour per 100 RUs + $0.25/GB storage
  - Example: 400 RUs (enough for 100 active users) = $23/month + storage
- **Free Tier**: First 1000 RUs/second and 25GB free

**Cost Warning**:
Cosmos DB can become expensive with provisioned throughput. Serverless mode is recommended for applications with <1000 concurrent users. Carefully monitor RU consumption to avoid bill shock.

**Recommended For**:
- Applications with global user base requiring low latency everywhere
- Startups expecting rapid growth and uncertain scaling needs
- Projects with frequently changing data models
- High-traffic scenarios (>10,000 concurrent users)

---

### Option C: Microsoft Graph API (OneDrive / SharePoint)

**What It Is**:
Instead of a traditional database, data is stored as JSON files in each user's OneDrive personal folder or organization's SharePoint site. The application uses Microsoft Graph API to read/write these files using the authenticated user's access token.

**Data Structure**:
A single JSON file per user (e.g., `physics-audit-data.json`) stored in:
- OneDrive Personal: `/me/drive/root:/physics-audit-data.json`
- SharePoint Site: `/sites/{site-id}/drive/root:/users/{user-id}/data.json`

File contains the exact same structure as current client-side storage, just synced to the cloud.

**Strengths**:
- ✅ **Zero Database Cost**: Storage included with Microsoft 365 licenses
- ✅ **Simple Implementation**: Just file read/write operations
- ✅ **Built-in Versioning**: OneDrive keeps file version history
- ✅ **User Ownership**: Data in user's own storage (GDPR-friendly)
- ✅ **Offline Sync**: OneDrive client provides automatic sync
- ✅ **No Maintenance**: Microsoft manages the infrastructure

**When It Excels**:
- Organization already has Microsoft 365 licenses
- Small to medium user base (<1,000 users)
- Simple data model with infrequent writes
- Privacy requirements favor user-owned data
- Limited budget for additional cloud services

**Scalability Profile**:
- **User Limit**: Each user has 1-5TB OneDrive quota
- **API Limits**: ~120 requests/minute per user, ~10,000/hour
- **Concurrent Users**: Recommended <500 concurrent users
- **Best Range**: 10 - 1,000 users

**Limitations**:
- ⚠️ **Slow Performance**: API latency 200-500ms typical
- ⚠️ **No Querying**: Can't search across all users' data
- ⚠️ **File Locking**: Concurrent writes can cause conflicts
- ⚠️ **API Throttling**: Heavy usage may hit rate limits
- ⚠️ **Limited Analytics**: Can't aggregate data across users
- ⚠️ **Requires M365**: Users must have Microsoft 365 accounts

**Conflict Resolution**:
When multiple devices edit the same file simultaneously, conflicts must be handled:
- **Last-Write-Wins**: Simpler but may lose data
- **Timestamp Comparison**: Merge based on _modified time
- **Custom Merging**: Application logic to merge changes (complex)

**Recommended For**:
- Schools/organizations already using Microsoft 365
- Pilot deployments and proof-of-concepts
- Privacy-focused implementations (data stays with user)
- Budget-constrained projects
- < 500 active users

---

### Comparison Summary Table

| Feature | Azure SQL | Cosmos DB | OneDrive/Graph |
|---------|-----------|-----------|----------------|
| **Monthly Cost** | $15-50 | $10-50 (serverless)<br>$23+ (provisioned) | $0 (included with M365) |
| **Setup Complexity** | Medium | Medium | Low |
| **Query Capability** | SQL (complex queries) | Limited (partition-based) | None (file-based) |
| **Scalability** | Vertical + sharding | Horizontal (automatic) | Limited |
| **Latency** | 10-50ms | 1-10ms | 100-500ms |
| **Global Distribution** | Read replicas | Multi-region writes | Via OneDrive sync |
| **Best for Users** | 100 - 10,000 | 1,000 - 1,000,000+ | 10 - 500 |
| **Team Expertise** | SQL knowledge | NoSQL/JSON | REST API basics |
| **Backup/Recovery** | Automated | Automated | OneDrive versioning |
| **Compliance** | Full control | Full control | User-controlled |
| **Cross-User Analytics** | ✅ Easy | ⚠️ Complex | ❌ Not possible |
| **Schema Flexibility** | ❌ Rigid | ✅ Very flexible | ✅ Fully flexible |
| **Transaction Support** | ✅ Full ACID | ⚠️ Limited | ❌ None |

---

## Security Architecture

### Authentication Security (How Sign-In Is Kept Safe)

#### OAuth 2.0 with PKCE (Proof Key for Code Exchange)

**What Is PKCE?**
PKCE is a security extension to OAuth 2.0 that prevents authorization code interception attacks. It's especially important for mobile apps and single-page applications where client secrets can't be safely stored.

**How It Works (Simplified)**:
1. **Client generates random "verifier"** (secret string)
2. **Client creates "challenge"** (hashed version of verifier)
3. **Client requests authorization** with challenge
4. **User authenticates** with Microsoft
5. **Client receives authorization code**
6. **Client exchanges code + verifier for access token**
7. **Azure AD validates** that verifier matches original challenge

**Why This Matters**:
If someone intercepts the authorization code, they can't use it without the original verifier (which only the legitimate client has). This prevents man-in-the-middle attacks.

#### State Parameter (CSRF Protection)

**What Is It?**
A random value generated by the client and included in the authorization request. Azure AD returns this value unchanged when redirecting back to the application.

**How It Protects**:
The client verifies that the returned state matches the expected value. If they don't match, someone may be attempting a Cross-Site Request Forgery (CSRF) attack, and the authentication is rejected.

#### Token Management

**Access Tokens**:
- **Purpose**: Short-lived credentials for API access (typically 1 hour)
- **Storage**: IndexedDB (encrypted by browser, never in localStorage)
- **Transmission**: Only via HTTPS, never in URLs
- **Scope**: Limited to specific permissions (least-privilege principle)

**Refresh Tokens**:
- **Purpose**: Long-lived credentials to obtain new access tokens (typically 90 days)
- **Storage**: Encrypted in IndexedDB with additional application encryption
- **Security**: Can be revoked by organization (e.g., if employee leaves)
- **Rotation**: New refresh token issued with each use (token rotation)

**Security Best Practices**:
1. **Token Expiry**: Check `expiresAt` before every API call
2. **Automatic Refresh**: Silently refresh token 5 minutes before expiration
3. **Secure Storage**: Never use localStorage (accessible via XSS)
4. **Minimal Scopes**: Only request permissions actually needed
5. **Token Revocation**: Provide logout that clears all tokens

### Data Security

#### Encryption in Transit (HTTPS/TLS 1.2+)

**What It Means**:
All data transmitted between client and server is encrypted using TLS (Transport Layer Security). This prevents eavesdropping on network traffic.

**Requirements**:
- Valid SSL/TLS certificate (free via Let's Encrypt)
- TLS 1.2 or 1.3 (older versions have known vulnerabilities)
- Strong cipher suites (AES-256 preferred)

**Azure Enforcement**:
- Azure SQL: Requires TLS by default (can't be disabled)
- Cosmos DB: All connections encrypted with TLS 1.2
- Microsoft Graph: HTTPS mandatory for all API calls

#### Encryption at Rest

**What It Means**:
Data stored on disk is encrypted. If someone physically steals a hard drive, they can't read the data without encryption keys.

**Azure SQL Database**:
- **Transparent Data Encryption (TDE)**: Enabled by default
- **Encryption Algorithm**: AES-256
- **Key Management**: Microsoft-managed or customer-managed (Azure Key Vault)
- **Performance Impact**: Minimal (<5% overhead)

**Azure Cosmos DB**:
- **Automatic Encryption**: All data encrypted (always on)
- **Encryption Algorithm**: AES-256
- **Key Rotation**: Automatic, transparent to application

**OneDrive/SharePoint**:
- **BitLocker Encryption**: Physical disk encryption
- **Per-File Encryption**: Each file encrypted with unique key
- **Multi-Tier Security**: Data encrypted, access tokens encrypted separately

#### Client-Side Encryption (Optional Additional Layer)

**What It Is**:
Encrypt data in the browser before sending to cloud storage. Only the user has the decryption key.

**Advantages**:
- Even if cloud storage is compromised, data remains encrypted
- "Zero-knowledge" architecture (service provider can't read data)

**Trade-offs**:
- Can't perform server-side queries on encrypted data
- Key management complexity (if user loses key, data is unrecoverable)
- Performance overhead (encryption/decryption in JavaScript)

**Recommendation**: Not necessary for most educational use cases. Azure's encryption-at-rest is sufficient for typical requirements.

### Access Control

#### Azure AD Role-Based Access Control (RBAC)

**Concept**:
Users and applications are granted specific roles that define what they can do. Permissions are assigned to roles, not individual users.

**Example Roles for Physics Audit Tool**:
- **Student**: Can read/write own data only
- **Teacher**: Can read data from students in their classes
- **Administrator**: Can manage application settings and view analytics
- **System Service**: Backend application with elevated permissions

**Implementation**:
- Azure AD security groups map to application roles
- Access tokens include user's roles as claims
- Application checks roles before allowing operations

#### Row-Level Security (Azure SQL Only)

**What It Is**:
Database automatically filters queries so users only see their own data, even if they write queries directly against the database.

**How It Works**:
A security policy is defined in SQL that adds a WHERE clause to every query:
`WHERE UserID = @CurrentUserId`

**Benefits**:
- Prevents accidental data leakage
- Enforces data isolation at database level (not just application)
- Useful for multi-tenant applications

---

## Requirements & Prerequisites

### Azure AD Configuration

#### 1. Azure AD Tenant
**What It Is**: Your organization's directory in Microsoft's identity system.

**Requirements**:
- **Minimum**: Azure AD Free (included with Microsoft 365)
- **Recommended**: Azure AD Premium P1 or P2 for advanced features
- **Check**: Portal.azure.com → Azure Active Directory → Overview

**Important Notes**:
- Tenant ID uniquely identifies your organization
- Users must be in this tenant to authenticate
- External guest users (B2B) can be invited if needed

#### 2. App Registration
**What It Is**: Configuration that tells Azure AD about your application.

**Required Information**:
- **Application Name**: "Physics Knowledge Audit Tool"
- **Supported Account Types**:
  - Single tenant: Only your organization
  - Multi-tenant: Any Azure AD organization
  - Personal accounts: Include personal Microsoft accounts
- **Redirect URIs**:
  - Type: Single-page application (SPA)
  - URI: `https://yourdomain.com/auth-callback.html`

**Outputs (Save These)**:
- **Application (Client) ID**: Public identifier for your app
- **Directory (Tenant) ID**: Your organization's identifier
- **Optional: Client Secret**: For server-side flows only

#### 3. API Permissions
**What They Are**: Specific data access rights your app requests.

**Minimum Required**:
- `openid`: Verify user identity
- `profile`: Get user's name and picture
- `email`: Get user's email address
- `offline_access`: Get refresh tokens for long sessions

**Optional (Based on Data Storage Choice)**:
- `Files.ReadWrite`: OneDrive/SharePoint file access
- `User.Read`: Access to user's profile information
- `Directory.Read.All`: Read organizational structure (requires admin consent)

**Admin Consent**:
Some permissions require IT administrator approval. Plan for this approval process in deployment timeline.

### Technical Requirements

#### Client-Side

**Browser Support**:
- Modern browsers with ES6 support (Chrome 60+, Firefox 60+, Safari 12+, Edge 18+)
- IndexedDB support (all modern browsers)
- LocalStorage for fallback scenarios
- Service Worker support for PWA features

**JavaScript Libraries**:
- **Required**: None (vanilla JavaScript OAuth implementation)
- **Recommended**: Microsoft Authentication Library (MSAL.js) for easier OAuth handling
- **Optional**: Teams JavaScript SDK (if deploying as Teams app)

**Bundle Size Impact**:
- MSAL.js: ~50KB gzipped
- Teams SDK: ~30KB gzipped
- Total addition: ~80KB (acceptable for broadband, consider for mobile)

#### Server-Side (If Applicable)

**For Azure Functions**:
- Node.js 14+ or .NET Core 3.1+
- Azure Functions runtime v3 or v4
- HTTP trigger endpoints
- Authentication/authorization middleware

**For Dedicated Backend**:
- Application server (Node.js/Express, ASP.NET Core, Python/FastAPI)
- Web framework with built-in security features
- Database client libraries (SQL, Cosmos SDK, Graph API client)
- Logging and monitoring integration

### Network& Domain Requirements

**Domain Name**:
- HTTPS required (port 443)
- Valid SSL/TLS certificate (Let's Encrypt recommended)
- Domain must be publicly accessible (or VPN required)

**Firewall Rules**:
- **Outbound**: Allow HTTPS to *.microsoftonline.com (authentication)
- **Outbound**: Allow HTTPS to graph.microsoft.com (if using Graph API)
- **Outbound**: Allow HTTPS to *.database.windows.net (if using Azure SQL)
- **Inbound**: HTTPS to your application domain

**Content Security Policy (CSP)**:
Must allow connections to Microsoft endpoints:
```
connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com
```

---

## Decision Framework

### Step 1: Determine Deployment Scope

**Questions**:
1. How many users? (< 100, 100-1000, 1000-10000, >10000)
2. All from one organization or multiple organizations?
3. Will users access via Teams, web browser, or both?
4. Is this a pilot or full production deployment?

**Recommendations**:
- **< 100 users, single org, Teams only** → Teams SDK + OneDrive
- **100-1000 users, single org, web access** → OAuth + OneDrive or Azure SQL
- **1000-10000 users, multiple orgs** → OAuth + Azure SQL + Azure Functions
- **> 10000 users** → OAuth + Cosmos DB + Dedicated Backend

### Step 2: Choose Authentication Method

| Scenario | Recommended Method |
|----------|-------------------|
| Exclusively Teams deployment | Teams SDK SSO |
| Web + possible future Teams | OAuth 2.0 (add Teams later) |
| Both confirmed from start | Hybrid (auto-detect environment) |

### Step 3: Choose Infrastructure Approach

**Decision Tree**:
```
Is budget < $50/month?
  ├─ YES → Client-side only + OneDrive
  └─ NO → Continue...

Do you need custom business logic server-side?
  ├─ NO → Azure Functions
  └─ YES → Continue...

Do you have dedicated DevOps team?
  ├─ YES → Dedicated Backend
  └─ NO → Azure Functions (simpler)
```

### Step 4: Choose Database Option

**Decision Matrix**:

| If You Need... | Choose... | Because... |
|----------------|-----------|------------|
| Zero additional cost | OneDrive | Included with M365 licenses |
| Complex reporting queries | Azure SQL | Best SQL query support |
| Global distribution | Cosmos DB | Multi-region replication |
| Rapid schema changes | Cosmos DB | Flexible JSON documents |
| Familiar SQL syntax | Azure SQL | Standard T-SQL |
| Massive scale (1M+ users) | Cosmos DB | Horizontal auto-scaling |
| Simple pilot (< 100 users) | OneDrive | Easiest to implement |

### Step 5: Plan for Security & Compliance

**Checklist**:
- [ ] Do you need to comply with GDPR? (Data residency, right to erasure)
- [ ] Do you need FERPA compliance? (U.S. education records)
- [ ] Do you need audit logs of who accessed what data?
- [ ] Do you need data retention policies (e.g., delete after 7 years)?
- [ ] Do you need administrator oversight of student data?

**If YES to any above**:
- OneDrive: Challenging (user-controlled data)
- Azure SQL: Good (full audit logs, administrator access)
- Cosmos DB: Good (change feed for audit trail)

---

## Cost Analysis

### Scenario 1: Small School Pilot (50 Students)

**Configuration**:
- Authentication: OAuth 2.0
- Infrastructure: Client-side only
- Storage: OneDrive via Microsoft Graph API

**Monthly Costs**:
- Azure AD: $0 (included)
- OneDrive: $0 (existing M365 licenses)
- Hosting: $0 (GitHub Pages)
- **Total: $0/month**

**Assumptions**:
- School already has Microsoft 365 licenses
- Static site hosting on free tier
- No custom backend needed

---

### Scenario 2: Medium School (500 Students + 50 Teachers)

**Configuration**:
- Authentication: OAuth 2.0
- Infrastructure: Azure Functions
- Storage: Azure SQL (Serverless tier)

**Monthly Costs**:
- Azure AD: $0 (included)
- Azure Functions: ~$10 (2M executions)
- Azure SQL Serverless: $20-40 (depends on usage)
- Static Hosting: $0 (Netlify free tier)
- **Total: $30-50/month**

**Assumptions**:
- ~20 operations per user per day
- Database mostly idle (students use during school hours only)
- Serverless SQL perfect for this pattern

---

### Scenario 3: Large District (5,000 Students + 500 Teachers)

**Configuration**:
- Authentication: OAuth 2.0
- Infrastructure: Azure App Service (dedicated backend)
- Storage: Azure SQL Standard (S2 tier)

**Monthly Costs**:
- Azure AD: $0 (included)
- App Service (B2): $75
- Azure SQL S2: $150
- Application Insights: $25 (monitoring)
- Backup Storage: $10
- **Total: $260/month**

**Per-User Cost**: $0.047/month (~$0.50/year per student)

---

### Scenario 4: Global Platform (100,000+ Users, Multi-Organization)

**Configuration**:
- Authentication: OAuth 2.0
- Infrastructure: Azure App Service (Premium)
- Storage: Cosmos DB (Provisioned throughput)

**Monthly Costs**:
- Azure AD: $0 (or Premium P1 @ $6/user for enhanced security)
- App Service (P2V2): $200
- Cosmos DB (10,000 RUs): $730
- CDN: $50
- Application Insights: $100
- Backup/Disaster Recovery: $50
- **Total: $1,130/month**

**Per-User Cost**: $0.011/month (~$0.13/year per user)

**Note**: Costs decrease per-user with scale. Cosmos DB is expensive up front but cost-effective at large scale.

---

## Related Documentation

For implementation details after making architectural decisions:

- **[TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md)** - Step-by-step Azure AD configuration and troubleshooting
- **[SECURITY.md](../../SECURITY.md)** - Security policy and best practices
- **[DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md)** - Current data models and storage patterns
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment procedures and checklists

**External Resources**:
- [Azure AD App Registration](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph API](https://docs.microsoft.com/graph/overview)
- [OAuth 2.0 PKCE Flow](https://oauth.net/2/pkce/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/azure/azure-sql/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)

---

**Last Updated**: 2025-11-24  
**Version**: 2.0  
**Document Type**: Technical Decision Guide  
**Target Audience**: IT Administrators, System Architects, Technical Decision-Makers
