## 📦 Deployment

### GitHub Pages / Static Hosting

1. Ensure `combined-data.json` exists in `resources/`
2. Push to GitHub repository
3. Enable GitHub Pages (Settings → Pages → Deploy from branch)
4. Access at `https://username.github.io/repo-name/`

### Custom Domain

Update Service Worker cache paths if deploying to subdirectory:
```javascript
// In sw.js, update paths if needed
const urlsToCache = [
  '/your-subdomain/index.html',
  '/your-subdomain/css/style.css',
  // ...
];
```

### Production Checklist

- [ ] Generate `combined-data.json` for fast loading
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Verify Service Worker registers correctly
- [ ] Test offline functionality
- [ ] Check all external CDN links work
- [ ] Complete manual testing checklist (see [TESTING.md](docs/guides/TESTING.md))
- [ ] Test manual update flow (increment version, verify badge, test backup)

---

