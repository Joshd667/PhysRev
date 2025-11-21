## 📦 Deployment Guide

This guide covers deploying the Physics Knowledge Audit Tool to production environments.

---

## Pre-Deployment Preparation

### 1. Generate Optimized Data File

For **10x faster loading** in production, generate `combined-data.json`:

**Tool Location:** `tools/csv-converter-unified.html`

**Two conversion modes:**
- **Server Mode** - Fetches CSVs from running web server (for deployed apps)
- **Local Mode** - Drag & drop CSV files (for offline/development)

**Steps:**
1. Start local server: `python3 -m http.server 8000`
2. Open `http://localhost:8000/tools/csv-converter-unified.html`
3. Choose "Server Mode" (easiest) or "Local Mode"
4. Click "Convert to JSON"
5. Save as `resources/combined-data.json`

**Benefits:**
- ⚡ **10x faster loading** - 1 HTTP request instead of 16 separate CSV files
- 📦 **Smaller payload** - Pre-processed and optimized
- ✅ **Includes groups** - No separate groups.csv fetch needed
- 🎯 **Revision mappings** - Pre-generated for instant access

**JSON v2.0 features:**
- Includes all 16 CSV files (10 subject cards + 5 revision resources + groups.csv)
- Pre-processed revision section mappings
- Version tracking and metadata
- Backward compatible with v1.x

> **Note:** After updating CSV files, re-run the converter to regenerate combined-data.json

### 2. Update Service Worker Version

Update the build timestamp in `sw.js` to force cache refresh:

```javascript
// sw.js - Line 1
const BUILD_TIMESTAMP = '20250121-001';  // Increment this
```

**Version format:** `YYYYMMDD-NNN` (date + build number)

This ensures users get the latest version by invalidating old caches.

### 3. Test Locally

Before deployment, verify everything works:

```bash
# Start local server
python3 -m http.server 8000

# Open in browser
http://localhost:8000
```

**Pre-deployment checklist:**
- [ ] App loads without errors (check console)
- [ ] All topics and resources display correctly
- [ ] Service Worker registers (DevTools → Application → Service Workers)
- [ ] Offline mode works (DevTools → Network → Offline checkbox)
- [ ] Data persists after hard refresh (Ctrl+Shift+R)
- [ ] combined-data.json loads successfully
- [ ] Run full manual testing checklist (see [TESTING.md](TESTING.md))

---

## Deployment Options

### Option 1: GitHub Pages (Recommended)

**Requirements:**
- GitHub repository
- `combined-data.json` generated
- Public repository (or GitHub Pro for private repos)

**Steps:**

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `main` (or `gh-pages`)
   - Folder: `/ (root)`
   - Click Save

3. **Wait for deployment** (1-2 minutes)

4. **Access your app:**
   - URL: `https://username.github.io/repo-name/`
   - GitHub shows deployment status in Actions tab

**Custom Domain (GitHub Pages):**

1. Add CNAME file to repository root:
   ```
   yourdomain.com
   ```

2. Configure DNS with your provider:
   - Add CNAME record: `www.yourdomain.com` → `username.github.io`
   - Or A records for apex domain (see [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site))

3. In GitHub Settings → Pages:
   - Custom domain: `yourdomain.com`
   - Enable "Enforce HTTPS" (required for Service Worker)

### Option 2: Netlify

**Steps:**

1. **Connect repository** (or drag & drop folder)
2. **Build settings:**
   - Build command: (leave empty - no build needed)
   - Publish directory: `.` (root)
3. **Deploy**
4. **Custom domain:** Netlify DNS or external DNS

**Advantages:**
- Instant deployments on git push
- Automatic HTTPS
- Branch previews
- Form handling (if needed later)

### Option 3: Vercel

**Steps:**

1. **Import git repository** or use Vercel CLI
2. **Framework preset:** Other
3. **Build settings:**
   - Build command: (leave empty)
   - Output directory: `.`
4. **Deploy**

**Advantages:**
- Fast global CDN
- Automatic HTTPS
- Preview deployments
- Edge functions (if needed later)

### Option 4: Other Static Hosts

Any static file host works (Firebase Hosting, Cloudflare Pages, AWS S3 + CloudFront, etc.)

**Requirements:**
- Must serve over HTTPS (for Service Worker)
- Must serve `index.html` for all routes (or configure routing)
- Must allow CORS for external CDN resources

---

## Subdirectory Deployment

If deploying to a subdirectory (e.g., `example.com/physics-audit/`), update Service Worker paths:

**Edit `sw.js`:**

```javascript
// Update urlsToCache paths with subdirectory prefix
const urlsToCache = [
  '/physics-audit/',
  '/physics-audit/index.html',
  '/physics-audit/css/style.css',
  '/physics-audit/js/app-loader.js',
  // ... update ALL paths
];
```

**Also update fetch handler:**

```javascript
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Add subdirectory check
  if (url.origin === location.origin && url.pathname.startsWith('/physics-audit/')) {
    // ... caching logic
  }
});
```

**Alternative:** Use relative paths by removing leading slashes:
```javascript
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  // ...
];
```

---

## Production Checklist

### Pre-Deployment

- [ ] Generate `combined-data.json` (see Pre-Deployment Preparation)
- [ ] Update Service Worker BUILD_TIMESTAMP
- [ ] Test locally with production data
- [ ] Verify all CSV data is current and accurate
- [ ] Check all external resource URLs work (videos, notes, etc.)
- [ ] Remove debug code and console.logs (if any)
- [ ] Test offline functionality locally

### Deployment

- [ ] Push to git repository (if using GitHub/Netlify/Vercel)
- [ ] Verify deployment completes without errors
- [ ] Check deployment logs for warnings

### Post-Deployment Verification

- [ ] **Test on production URL:**
  - [ ] App loads without errors (check browser console)
  - [ ] All topics display correctly
  - [ ] Resources load (videos, notes, simulations, questions)
  - [ ] Search works
  - [ ] Analytics dashboard renders
  - [ ] Settings panel functions (all tabs)

- [ ] **Test across browsers:**
  - [ ] Chrome/Edge (Chromium)
  - [ ] Firefox
  - [ ] Safari (if available)
  - [ ] Mobile browsers (iOS Safari, Android Chrome)

- [ ] **Test PWA features:**
  - [ ] Service Worker registers (DevTools → Application → Service Workers)
  - [ ] Offline mode works (toggle offline in DevTools)
  - [ ] Install prompt appears (Add to Home Screen)
  - [ ] App works offline after first visit

- [ ] **Test performance:**
  - [ ] Initial load < 3 seconds
  - [ ] JSON loading time < 200ms (check Network tab)
  - [ ] Memory usage < 150MB (check Performance Monitor)
  - [ ] No console errors or warnings

- [ ] **Test manual update flow:**
  - [ ] Update BUILD_TIMESTAMP in sw.js
  - [ ] Deploy changes
  - [ ] Visit app → update badge should appear on settings icon
  - [ ] Click badge → update installs
  - [ ] App refreshes with new version

- [ ] **External dependencies:**
  - [ ] All CDN links load (Alpine.js, TailwindCSS, Lucide, Chart.js, KaTeX)
  - [ ] Check Network tab for any 404s or failed requests

- [ ] **Complete full manual testing:** See [TESTING.md](TESTING.md)

---

## Service Worker Management

### Version Control

The app uses manual update control. Users must click the update badge to install new versions.

**How it works:**
1. User visits app → Service Worker checks for updates
2. If new version found → Badge appears on settings icon
3. User clicks badge → Update installs and app refreshes

**When to increment version:**
- ✅ Any code changes (JS, CSS, HTML)
- ✅ Data file changes (combined-data.json)
- ✅ Template changes
- ❌ External resource changes (videos, notes - just update CSVs)

### Cache Strategy

**Critical resources** (cached immediately):
- HTML, CSS, JS files
- combined-data.json
- Templates
- Core dependencies

**External resources** (network-first):
- CDN libraries (Alpine.js, TailwindCSS, etc.)
- External links (videos, notes, simulations)

### Debugging Service Worker

```javascript
// In browser console

// Check registration
navigator.serviceWorker.getRegistration()

// Force update
navigator.serviceWorker.getRegistration().then(reg => reg.update())

// Unregister (for testing)
navigator.serviceWorker.getRegistration().then(reg => reg.unregister())
```

---

## Troubleshooting

### App shows blank screen

**Causes:**
- Missing or corrupted combined-data.json
- Service Worker cache issues
- JavaScript errors

**Solutions:**
1. Check browser console (F12) for errors
2. Verify combined-data.json exists and is valid JSON
3. Clear Service Worker cache:
   - DevTools → Application → Storage → Clear site data
   - Or use "Force Refresh" in app Settings → Admin
4. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Service Worker not registering

**Causes:**
- Not using HTTPS (required for Service Worker)
- Localhost not on port 80/443/8000-9000
- Browser doesn't support Service Workers

**Solutions:**
1. Ensure site is served over HTTPS (or localhost)
2. Check DevTools → Application → Service Workers for errors
3. Verify sw.js is accessible at root URL
4. Test in supported browser (Chrome, Firefox, Safari, Edge)

### Resources not loading (404 errors)

**Causes:**
- Incorrect path in Service Worker (subdirectory issue)
- CORS restrictions
- Files not deployed

**Solutions:**
1. Check Network tab for failed requests
2. Verify all files exist in deployment
3. If using subdirectory, update sw.js paths (see Subdirectory Deployment)
4. Check server CORS headers allow external CDN requests

### Offline mode not working

**Causes:**
- Service Worker not registered
- Resources not cached
- Network-first strategy failing

**Solutions:**
1. Verify Service Worker is active (DevTools → Application)
2. Check cache contents (DevTools → Application → Cache Storage)
3. Visit pages while online first (to populate cache)
4. Update Service Worker version to refresh cache

### Updates not appearing

**Causes:**
- BUILD_TIMESTAMP not incremented
- Service Worker not checking for updates
- Browser caching sw.js file

**Solutions:**
1. Verify BUILD_TIMESTAMP was updated in sw.js
2. Hard refresh (Ctrl+Shift+R)
3. Manually trigger update:
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => reg.update())
   ```
4. Check deployment actually updated files

### Slow loading after deployment

**Causes:**
- Using CSV files instead of combined-data.json
- CDN resources loading slowly
- Large file sizes

**Solutions:**
1. Generate and deploy combined-data.json (see Pre-Deployment Preparation)
2. Check Network tab waterfall for bottlenecks
3. Consider using different CDN provider
4. Enable compression on server (gzip/brotli)

### CORS errors on external resources

**Causes:**
- Video/note links from sites blocking cross-origin requests
- Missing CORS headers

**Solutions:**
1. Links to videos/notes are just links - they open in new tabs (no CORS issue)
2. If embedding external content, ensure resource allows it
3. For CDN libraries, use CDNs with proper CORS headers

---

## Performance Optimization

### Data Loading

- ✅ **Use combined-data.json** - 10x faster than CSV loading
- ✅ **Enable compression** - gzip/brotli on server
- ✅ **CDN for libraries** - Don't self-host Alpine.js, TailwindCSS, etc.

### Caching

- ✅ **Service Worker** - Caches critical resources for offline use
- ✅ **Browser cache** - CDN libraries cached automatically
- ✅ **IndexedDB** - User data stored locally

### Monitoring

**Check these metrics:**
- Initial load time: < 3 seconds
- JSON load time: < 200ms
- Memory usage: < 150MB
- Time to interactive: < 4 seconds

**Tools:**
- Chrome DevTools → Performance
- Lighthouse audit (DevTools → Lighthouse)
- Network tab → Disable cache to test cold loads

---

## Security Considerations

- ✅ **HTTPS required** - For Service Worker and PWA features
- ✅ **XSS protection** - DOMPurify sanitizes user input
- ✅ **CSP headers** - Consider adding Content Security Policy
- ✅ **No server-side code** - Pure client-side app (no backend vulnerabilities)
- ✅ **Local storage only** - No data sent to external servers

See [SECURITY.md](../../SECURITY.md) for full security policy.

---

## Related Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Local development and testing
- **[TESTING.md](TESTING.md)** - Comprehensive testing checklists
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture
- **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)** - Managing CSV data files

---

