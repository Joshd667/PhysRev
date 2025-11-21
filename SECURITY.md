# Security Documentation

## Overview

This document outlines security considerations, known vulnerabilities, and mitigation strategies for the Physics Knowledge Audit Tool.

**Last Updated:** 2025-01-20
**Security Review Status:** Completed
**Overall Risk Level:** MEDIUM-LOW

---

## 🔒 Critical Security Issues

### 1. Subresource Integrity (SRI) for CDN Dependencies

**Status:** ⚠️ PARTIALLY IMPLEMENTED
**Severity:** CRITICAL
**Risk:** Supply chain attacks via CDN compromise

#### Current State

Some CDN dependencies lack SRI hashes:
- ✅ KaTeX: Has SRI hashes
- ❌ Alpine.js 3.13.3: Missing SRI
- ❌ DOMPurify 3.0.6: Missing SRI
- ❌ Chart.js: Missing SRI + missing version pin
- ❌ Lucide Icons 0.546.0: Missing SRI
- ❌ TailwindCSS CDN: Missing SRI (dynamic loading)

#### Why This Matters

Without SRI hashes, if a CDN is compromised, malicious code could be injected into the application without detection. This is a **supply chain attack vector**.

#### Mitigation Steps

**IMMEDIATE ACTION REQUIRED:**

1. **Generate SRI Hashes:**
   ```bash
   # Run the SRI hash generator
   node tools/generate-sri-hashes.js
   ```

2. **Add SRI Hashes to index.html:**
   - Copy the generated hashes
   - Add `integrity="sha384-..."` and `crossorigin="anonymous"` attributes
   - See examples in index.html (KaTeX already has this)

3. **Pin Chart.js Version:**
   - Currently: `https://cdn.jsdelivr.net/npm/chart.js` (no version)
   - Change to: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`

4. **Update Service Worker Cache:**
   - After adding SRI, update `sw.js` CRITICAL_RESOURCES array
   - Increment BUILD_TIMESTAMP to force cache refresh

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

For complete implementation details, see [ARCHITECTURE.md - XSS Protection](docs/guides/ARCHITECTURE.md#xss-protection).

---

## 🔐 Authentication & Authorization

### Guest Mode (Local-Only)

**Security Level:** HIGH ✅

- All data stored in IndexedDB (client-side only)
- No network transmission
- No authentication required
- Perfect for privacy-conscious users

### Microsoft Teams Integration

**Security Level:** MEDIUM ⚠️

**Current Issues:**

1. **Placeholder Credentials:**
   ```javascript
   // js/features/auth/teams.js
   CLIENT_ID: 'your-teams-app-client-id',  // ❌ Must be replaced
   TENANT_ID: 'your-tenant-id'             // ❌ Must be replaced
   ```

2. **Missing Configuration Management:**
   - Credentials hardcoded in source
   - No environment variable support
   - Risk of accidental credential exposure

**What To Do If You Need Teams Auth:**

**Option 1: Environment Configuration (Recommended)**
```javascript
// Create js/config.js (add to .gitignore!)
export const TEAMS_CONFIG = {
    CLIENT_ID: process.env.TEAMS_CLIENT_ID || 'your-client-id',
    TENANT_ID: process.env.TEAMS_TENANT_ID || 'your-tenant-id',
    // ...
};
```

**Option 2: Configuration File (Good for Testing)**
```javascript
// Create config.local.js (add to .gitignore!)
export const TEAMS_CONFIG = {
    CLIENT_ID: 'actual-client-id-here',
    TENANT_ID: 'actual-tenant-id-here',
    // ...
};
```

**Option 3: Remove Teams Auth Entirely**

If you don't plan to use Teams integration:
```bash
# Remove Teams auth to reduce attack surface
rm js/features/auth/teams.js
# Update js/features/auth/index.js to remove Teams import
```

**RECOMMENDATION:**
Until you have Azure AD credentials, **disable Teams auth in the UI** to avoid confusion:

```javascript
// In index.html, comment out Teams login button
<!-- Teams Login Button -->
<!-- TEMPORARILY DISABLED - Awaiting Azure AD credentials
<button @click="initiateTeamsLogin()">...</button>
-->
```

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

For implementation details, see [ARCHITECTURE.md - Storage & Caching](docs/guides/ARCHITECTURE.md#storage--caching-architecture).

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

### Pre-Deployment

- [ ] All CDN scripts have SRI hashes
- [ ] Chart.js version pinned
- [ ] Service Worker cache updated with new hashes
- [ ] All innerHTML usage audited and sanitized
- [ ] Console statements wrapped in debug flag
- [ ] Teams auth credentials configured OR disabled
- [ ] .gitignore created (prevent credential leaks)
- [ ] Security tests passing (100% coverage for security modules)
- [ ] CSP tested and working
- [ ] Privacy notice displayed on first use

### Post-Deployment Monitoring

- [ ] Monitor browser console for CSP violations
- [ ] Review error logs weekly
- [ ] Update CDN dependencies quarterly
- [ ] Re-run SRI hash generator after any CDN version updates
- [ ] Annual security review

---

## 📞 Security Contacts

**Report Security Issues:**
- Create issue on GitHub (if public repo)
- Email: [your-security-email@domain.com]
- Response time: 48 hours

**Security Review Schedule:**
- Minor review: Quarterly
- Major review: Annually
- Penetration testing: As needed

---

## 📚 References

- [Content Security Policy (CSP) - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Subresource Integrity (SRI) - MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetsecurity.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

**Version:** 1.0
**Last Review:** 2025-01-20
**Next Review:** 2025-04-20
