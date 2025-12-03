# Security Policy

**For Developers & System Administrators**

This document outlines security considerations, known vulnerabilities, and mitigation strategies for the Physics Knowledge Audit Tool.

**Last Updated:** 2025-11-21
**Security Review Status:** Completed
**Overall Risk Level:** MEDIUM-LOW

---

## Table of Contents

- [Critical Security Issues](#-critical-security-issues)
  - [Subresource Integrity (SRI) for CDN Dependencies](#1-subresource-integrity-sri-for-cdn-dependencies)
  - [Content Security Policy (CSP) Limitations](#2-content-security-policy-csp---unsafe-inline-and-unsafe-eval)
  - [XSS Prevention](#3-xss-prevention---innerhtml-usage)
- [Authentication & Authorization](#-authentication--authorization)
  - [Guest Mode](#guest-mode-local-only)
  - [Microsoft Teams Integration](#microsoft-teams-integration)
- [Data Integrity & Privacy](#%EF%B8%8F-data-integrity--privacy)
- [Testing & Validation](#-testing--validation)
- [Known Vulnerabilities](#-known-vulnerabilities)
- [Security Checklist](#-security-checklist-before-production)
- [Reporting Security Issues](#-reporting-security-issues)
- [Related Documentation](#-related-documentation)

---

## 🔒 Critical Security Issues

### 1. Subresource Integrity (SRI) for CDN Dependencies

**Status:** ⚠️ PARTIALLY IMPLEMENTED
**Severity:** CRITICAL
**Risk:** Supply chain attacks via CDN compromise

#### Current State

Some CDN dependencies lack SRI hashes:
- ✅ KaTeX: Has SRI hashes (lines 88-90 of index.html)
- ⚠️ Alpine.js 3.13.3: Missing SRI (preload at line 62, script tag elsewhere)
- ⚠️ DOMPurify 3.0.6: Missing SRI (line 97)
- ⚠️ Chart.js: Missing SRI + missing version pin (line 104+)
- ⚠️ Lucide Icons: Missing SRI
- ⚠️ TailwindCSS CDN: Missing SRI (may not be possible with CDN build)

#### Why This Matters

Without SRI hashes, if a CDN is compromised, malicious code could be injected into the application without detection. This is a **supply chain attack vector**.

#### Mitigation Steps

**Tool Available:** `tools/generate-sri-hashes.js`

**Implementation Steps:**

1. **Generate SRI Hashes:**
   ```bash
   node tools/generate-sri-hashes.js
   ```

2. **Add SRI Hashes to index.html:**
   - Copy the generated hashes
   - Add `integrity="sha384-..."` and `crossorigin="anonymous"` attributes
   - See example: KaTeX already has SRI (lines 88-90)

3. **Pin Chart.js Version:**
   - Currently: `https://cdn.jsdelivr.net/npm/chart.js` (unpinned)
   - Change to: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`
   - Version 4.4.1 is current as per package.json

4. **Update Service Worker:**
   - Increment BUILD_TIMESTAMP in `sw.js` (line 1)
   - Format: `const BUILD_TIMESTAMP = 'YYYYMMDD-NNN'`
   - Forces cache refresh with new SRI attributes

5. **Test CSP Compatibility:**
   - Verify resources load correctly
   - Check browser console for CSP violations
   - Test offline mode (Service Worker caching)

**See [docs/TODO.md#subresource-integrity-sri-hashes](docs/TODO.md#subresource-integrity-sri-hashes)** for detailed implementation checklist.

#### Alternative: Move to Bundled Dependencies

For maximum security, consider using a build system (Vite) to bundle dependencies instead of relying on CDNs:

**Pros:**
- Complete control over code
- No CDN dependency
- Smaller bundle size (tree-shaking)
- Built-in SRI via build tools

**Cons:**
- Requires build step
- More complex deployment
- Loses CDN caching benefits

---

### 2. Content Security Policy (CSP) - `unsafe-inline` and `unsafe-eval`

**Status:** ⚠️ DOCUMENTED LIMITATION
**Severity:** CRITICAL
**Risk:** Reduced XSS protection

#### Current State

The CSP allows `unsafe-inline` and `unsafe-eval` in `script-src`:

```html
<meta http-equiv="Content-Security-Policy"
      content="script-src 'self' ... 'unsafe-inline' 'unsafe-eval';">
```

#### Why This Is Necessary (But Problematic)

**Required For:**
- Alpine.js reactive template system (uses inline event handlers via `x-on`)
- Alpine.js expression evaluation (uses `new Function()` internally)
- TailwindCSS config (inline script tag)

**Security Impact:**
- Significantly weakens CSP protection against XSS
- Allows any inline script to execute
- Allows `eval()` and `Function()` constructor

#### Mitigation Strategy

Since we cannot remove `unsafe-inline`/`unsafe-eval` without breaking Alpine.js, we implement **defense-in-depth**:

1. **✅ DOMPurify Integration**
   - All user-generated content sanitized
   - HTML injection prevention in 9+ critical files

2. **✅ Input Validation**
   - Confidence levels validated (1-5 range)
   - Test scores validated (0-100 range)
   - Prototype pollution prevention

3. **✅ HMAC Data Integrity**
   - All saved data cryptographically signed
   - Prevents tampering with client-side data

4. **✅ Local-First Architecture**
   - No external data transmission
   - No third-party analytics
   - Reduced attack surface

5. **✅ Regular Security Audits**
   - innerHTML usage audited
   - XSS test coverage in test suite

#### Future Options

**Option 1: Nonce-Based CSP (Long-term)**
- Use `script-src 'nonce-{random}'` instead of `unsafe-inline`
- Requires refactoring Alpine.js usage
- Complex with Service Worker caching

**Option 2: Migrate to Vue 3 / React**
- These frameworks support strict CSP
- Major rewrite required
- Not recommended due to project stability

**RECOMMENDATION:** Accept this limitation with current mitigations. Document as a known security consideration. Continue monitoring Alpine.js for CSP improvements.

---

### 3. XSS Prevention - innerHTML Usage

**Status:** ✅ AUDIT COMPLETE (2025-01-20)
**Severity:** HIGH (now mitigated)
**Risk:** XSS attacks prevented with DOMPurify

#### Implementation Status

All user-content injection points have been secured with DOMPurify sanitization:

✅ **Notes System:**
- `js/features/notes/display.js` - Snippet extraction sanitized
- `js/features/notes/management.js` - Editor loading sanitized
- `js/features/notes/editor.js` - Content processing sanitized

✅ **Mindmaps:**
- `js/features/mindmaps/canvas.js` - Node rendering sanitized (3 locations)

✅ **Safe Patterns Documented:**
- Template loading from trusted sources (no user input)
- Sanitization helpers in search module
- KaTeX equations (library has built-in XSS protection)

**Total Vulnerabilities Fixed:** 7 critical injection points

#### Sanitization Examples

**Text Extraction (Snippets):**
```javascript
DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],        // Strip all HTML
    KEEP_CONTENT: true       // Keep text only
});
```

**Rich Text Editor:**
```javascript
DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'li', ...],
    ALLOWED_ATTR: ['href', 'style', 'class'],
    ALLOWED_STYLES: {
        '*': {
            'color': [/^#[0-9A-Fa-f]{3,6}$/],
            'font-size': [/^\d+px$/]
        }
    }
});
```

For complete implementation details, see [ARCHITECTURE.md - XSS Protection](docs/ARCHITECTURE.md#xss-protection).

---

## 🔐 Authentication & Authorization

### Guest Mode (Local-Only)

**Security Level:** HIGH ✅
**Status:** Fully functional and recommended

- All data stored in IndexedDB (client-side only)
- No network transmission
- No authentication required
- Perfect for privacy-conscious users
- Full feature parity with Teams mode

### Microsoft Teams Integration

**Security Level:** LOW ⚠️
**Status:** 🔴 ACTIVE BUT NON-FUNCTIONAL (Placeholder Credentials)

**CRITICAL SECURITY RISKS:**

1. **Teams Login Button is ENABLED with Fake Credentials**
   - Users can click "Login with Microsoft Teams"
   - OAuth flow will fail with "Application not found" error
   - Creates user confusion and support burden
   - **Location:** `index.html` (line 231-242)

2. **Placeholder Credentials in Source Code:**
   ```javascript
   // js/features/auth/teams.js (lines 7-17)
   const TEAMS_CONFIG = {
       CLIENT_ID: 'your-teams-app-client-id',  // ❌ PLACEHOLDER
       TENANT_ID: 'your-tenant-id',            // ❌ PLACEHOLDER
       REDIRECT_URI: window.location.origin + '/auth-callback.html',  // ✅ Correct path
   };
   ```

3. **✅ Redirect URI Now Correct:**
   - Code points to: `/auth-callback.html`
   - File located at: `/auth-callback.html` (project root) ✅
   - **Location:** `js/features/auth/teams.js` (line 11)

4. **OneDrive Sync NOT Implemented:**
   - Configuration variables exist
   - Functions are called but empty/incomplete
   - Data still stored locally in IndexedDB (not synced)
   - Misleading documentation in code comments

**IMMEDIATE ACTIONS REQUIRED:**

**Option 1: Disable Teams Button (🔴 RECOMMENDED)**
```html
<!-- In index.html (line 231-242), comment out Teams button -->
<!-- TEMPORARILY DISABLED - Awaiting Azure AD App Registration
<button @click="initiateTeamsLogin()" ...>
    Login with Microsoft Teams
</button>
-->
```

**Option 2: Fix for Production Use**

See **[docs/TEAMS_AUTH_IMPLEMENTATION.md](docs/TEAMS_AUTH_IMPLEMENTATION.md)** for complete setup guide including:
- Azure AD app registration
- Creating `js/features/auth/teams-config.js` with real credentials
- Fixing redirect URI mismatch
- Testing procedures
- Security testing checklist

**Credential Protection:**
- ✅ `.gitignore` already configured (line 30: `js/features/auth/teams-config.js`)
- ✅ `auth-callback.html` exists at project root
- ❌ No configuration template file yet (should create `teams-config.template.js`)

**RECOMMENDATION:** **Disable the Teams button immediately** to prevent user confusion. Guest mode provides full functionality while Teams auth is being configured.

**See Also:**
- **[docs/TODO.md](docs/TODO.md#authentication--infrastructure)** - Teams auth TODO items
- **[docs/TEAMS_AUTH_ARCHITECTURE.md](docs/TEAMS_AUTH_ARCHITECTURE.md)** - Architecture and decision guide
- **[docs/TEAMS_AUTH_IMPLEMENTATION.md](docs/TEAMS_AUTH_IMPLEMENTATION.md)** - Complete setup guide

---

## 🛡️ Data Integrity & Privacy

### Local Storage Architecture

**Security Level:** EXCELLENT ✅

- 100% client-side data storage
- No external transmission
- No cookies
- No third-party analytics
- GDPR compliant by design

### HMAC Data Signing

**Implementation:** `js/utils/data-integrity.js`

All saved data is cryptographically signed:
- Device-specific HMAC secret
- SHA-256 hashing
- Tamper detection
- Prevents score/confidence manipulation

**Coverage:**
- ✅ Confidence levels (validated 1-5)
- ✅ Test results (validated 0-100)
- ✅ Import/export data

### Storage Security

**Primary Storage:** IndexedDB (all user data)
**Secondary:** localStorage (debug flag only)

**IndexedDB Security:**
- ✅ Same-origin policy (domain-isolated)
- ✅ No network transmission (local-only)
- ✅ HMAC signing on sensitive data
- ✅ Automatic migration from legacy localStorage
- ⚠️ Not encrypted at rest (browser limitation)
- ⚠️ Accessible via JavaScript (XSS risk mitigated)

**localStorage Usage (Minimal):**
- ✅ Debug flag only (`DEBUG` boolean)
- ✅ Migration code (one-time, backward compatibility)
- ✅ Non-sensitive data only

**Mitigations:**
- XSS prevention with DOMPurify (100% coverage)
- Input validation on all imports
- Local-first architecture (no transmission)
- User-controlled data clearing

**GDPR Compliance:**
- ✅ All data stored locally (not transmitted)
- ✅ No cookies (PECR compliant)
- ✅ User has full control (export/clear)
- ✅ 30-day retention for analytics
- ✅ No personal data in localStorage

For implementation details, see [ARCHITECTURE.md - Storage & Caching](docs/ARCHITECTURE.md#storage--caching-architecture).

---

## 📊 Testing & Validation

### Current Test Coverage

**Overall:** ~10% (LOW)
**Security Modules:** ~60% (MEDIUM)

**Test Files:**
- `tests/search.test.js` - XSS prevention ✅
- `tests/data-validation.test.js` - Input validation ✅

### Security Test Coverage Goals

| Module | Current | Target |
|--------|---------|--------|
| XSS Prevention | 100% ✅ | 100% |
| Data Validation | 80% | 100% |
| Auth Flows | 0% | 80% |
| Storage Integrity | 0% | 80% |

---

## 🚨 Known Vulnerabilities

### Active Issues

1. **Missing SRI Hashes** - CRITICAL
   - Impact: Supply chain attack vector (CDN compromise could inject malicious DOMPurify)
   - Attack Scenario: Compromised DOMPurify CDN could bypass all XSS sanitization
   - Mitigation: Add SRI hashes to verify CDN integrity (in progress)
   - Tool: `tools/generate-sri-hashes.js`
   - Timeline: Complete within 1 week

2. **CSP Weaknesses** - CRITICAL (Accepted)
   - Impact: Reduced XSS protection
   - Mitigation: Defense-in-depth with DOMPurify (✅ Complete)
   - Timeline: Ongoing monitoring

### Accepted Risks

1. **No Build System**
   - Risk: Larger file sizes, no minification
   - Justification: Performance adequate, complexity not warranted
   - Review: Annually

2. **CSP unsafe-inline/eval**
   - Risk: Weakened CSP protection
   - Justification: Required for Alpine.js, mitigated by other controls
   - Review: Monitor Alpine.js CSP improvements

---

## 📋 Security Checklist (Before Production)

**See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for complete deployment guide.

### Pre-Deployment

- [ ] **SRI Hashes:** All CDN scripts have `integrity` attributes
- [ ] **Chart.js:** Version pinned to 4.4.1
- [ ] **Service Worker:** BUILD_TIMESTAMP incremented in `sw.js` (line 1)
- [ ] **XSS Protection:** All innerHTML usage audited and sanitized
- [ ] **Debug Mode:** Console logging disabled in production (or wrapped in logger.debug)
- [ ] **Teams Auth:** Either fully configured OR button disabled in `index.html`
- [ ] **Git Protection:** `.gitignore` configured (includes `teams-config.js`)
- [ ] **Security Tests:** All tests passing (`npm test`)
- [ ] **CSP:** Content Security Policy tested and working
- [ ] **Combined Data:** `combined-data.json` generated for fast loading

### Post-Deployment Monitoring

- [ ] **CSP Violations:** Monitor browser console in production
- [ ] **Error Logs:** Review weekly for security issues
- [ ] **Dependency Updates:** Check CDN dependencies quarterly
- [ ] **SRI Updates:** Re-run `tools/generate-sri-hashes.js` after dependency updates
- [ ] **Security Review:** Annual comprehensive security audit
- [ ] **Teams Auth:** Monitor for failed login attempts if enabled

### Security Testing

See **[docs/TESTING.md#security-manual-testing](docs/TESTING.md#security-manual-testing)** for:
- XSS attempt testing in all user input fields
- Script injection prevention testing
- DOMPurify sanitization verification
- IndexedDB security inspection
- Console logger debug mode testing

---

## 📞 Reporting Security Issues

**For Security Vulnerabilities:**
1. **DO NOT** create public GitHub issues for security vulnerabilities
2. Contact the repository maintainer directly
3. Expected response time: 48 hours
4. Provide detailed reproduction steps and impact assessment

**For Security Questions:**
- Open a GitHub issue with the `security` label
- Reference this document and related guides

**Security Review Schedule:**
- Minor review: Quarterly
- Major review: Annually
- Penetration testing: As needed

---

## 📚 Related Documentation

**Security Implementation:**
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - XSS protection implementation details
- **[docs/TEAMS_AUTH_IMPLEMENTATION.md](docs/TEAMS_AUTH_IMPLEMENTATION.md)** - Teams authentication security guide
- **[docs/TODO.md](docs/TODO.md)** - Outstanding security tasks (SRI hashes, Teams auth)

**Security Audits:**
- **[docs/audits/xss-audit.md](docs/audits/xss-audit.md)** - XSS vulnerability audit (2025-01-20)
- **[docs/audits/localstorage-security-audit.md](docs/audits/localstorage-security-audit.md)** - Storage security audit
- **[docs/audits/console-logger-audit.md](docs/audits/console-logger-audit.md)** - Logger security audit

**Testing & Development:**
- **[docs/TESTING.md](docs/TESTING.md)** - Security testing procedures
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Secure development practices
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production security checklist

---

## 📖 External Resources

**Web Security Standards:**
- [Content Security Policy (CSP) - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Subresource Integrity (SRI) - MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetsecurity.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

**Libraries & Tools:**
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify) - HTML sanitization
- [Alpine.js Security](https://alpinejs.dev/advanced/csp) - CSP considerations
- [IndexedDB Security](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API#security) - Storage security

**OAuth & Authentication:**
- [OAuth 2.0 PKCE Flow](https://oauth.net/2/pkce/) - Secure authentication
- [Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph API Security](https://docs.microsoft.com/en-us/graph/security-authorization)

---

**Version:** 2.0
**Last Review:** 2025-11-21
**Next Review:** 2026-02-21 (Quarterly)
**Priority Focus:** SRI implementation, Teams auth configuration
