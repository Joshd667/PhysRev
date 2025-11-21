# Physics Knowledge Audit Tool

A Progressive Web App (PWA) for tracking and analyzing physics knowledge confidence across A-Level specification topics.

[![PWA](https://img.shields.io/badge/PWA-enabled-blue)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/license-proprietary-red)](./LICENSE)

---

## 📋 Overview

The Physics Knowledge Audit Tool helps students self-assess their confidence levels across physics topics, view analytics on their progress, and access curated revision resources. Built with Alpine.js and optimized for fast loading, it works offline and stores data locally.

**Target Users:** A-Level Physics students (UK)  
**Platform:** Web (Desktop & Mobile)  
**Storage:** IndexedDB (client-side, 100+ MB capacity)  
**Network:** Works offline after first visit

---

## ✨ Key Features

### 📊 Self-Assessment & Analytics
- Rate confidence (1-5 scale) on 100+ physics topics
- Visual analytics dashboard with charts and metrics
- Track progress over time with study velocity calculations
- Identify critical topics needing attention

### 📚 Study Materials System
- **Rich Note Editor** - Formatted notes with equations, colors, lists
- **Flashcard Decks** - Create, organize, and test yourself
- **Interactive Mindmaps** - Visual knowledge organization with drag-and-drop canvas
- **Topic Tagging** - Organize materials by physics topics

### 🎯 Revision Resources
- Curated videos, notes, simulations, and practice questions
- Filter by confidence level and topic tags
- Organized by specification sections

### 🔍 Advanced Search
- Real-time fuzzy search across topics
- Filter by confidence level and sections
- Relevance scoring with instant results

### ⚙️ Additional Features
- **Triple View Modes** - Browse by specification, Paper 1, Paper 2, or Paper 3
- **Dark Mode** - Automatic dark/light theme switching
- **PWA Support** - Install on device, works offline
- **Data Management** - Export/import, backup/restore
- **Manual Updates** - Control when app updates are installed

---

## 🚀 Quick Start

### Running Locally

```bash
# Clone or download the repository
cd physics-revision-main

# Start a local web server
python3 -m http.server 8000

# Open in browser
http://localhost:8000
```

**Requirements:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for CORS compliance)
- Internet connection (first visit only - downloads CDN libraries)

### First Use

1. Click "Login as Guest" (no account needed)
2. Browse topics by specification or paper
3. Rate your confidence on topics (1-5 stars)
4. View analytics dashboard to track progress
5. Access revision resources for each topic
6. Create study materials (notes, flashcards, mindmaps)

---

## 📖 Documentation

### User Guides
- **[Testing Guide](docs/guides/TESTING.md)** - Comprehensive testing checklists
- **[Attribution](docs/guides/ATTRIBUTION.md)** - Third-party licenses

### Developer Guides
- **[Development Guide](docs/guides/DEVELOPMENT.md)** - Setup, tools, and best practices
- **[Architecture Guide](docs/guides/ARCHITECTURE.md)** - Technical architecture details
- **[Deployment Guide](docs/guides/DEPLOYMENT.md)** - Production deployment instructions
- **[Content Management](docs/guides/CONTENT_MANAGEMENT.md)** - Managing CSV data files
- **[Pagination Usage](docs/guides/PAGINATION_USAGE.md)** - Using the pagination system
- **[Data Architecture](docs/guides/DATA_ARCHITECTURE.md)** - Technical data implementation guide

### Setup Guides
- **[Teams Authentication](docs/guides/TEAMS_AUTH_SETUP.md)** - Microsoft Teams login setup

### Security & Audits
- **[Security Policy](SECURITY.md)** - Security guidelines
- **[Security Audits](docs/audits/)** - XSS, localStorage, and console logger audits

### Legal & Compliance
- **[Legal Analysis](docs/legal/)** - UK legal compliance documentation

---

## 🏗️ Technology Stack

- **Frontend Framework**: [Alpine.js](https://alpinejs.dev/) v3.13.3
- **Database**: IndexedDB (client-side storage)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Math Rendering**: [KaTeX](https://katex.org/)
- **PWA**: Service Worker for offline support

---

## 📊 Performance

### Memory Optimization
- **90% reduction** - 1.2GB → 100-150MB
- Non-reactive static data architecture
- Smooth performance on mobile devices

### Load Times
- **JSON loading**: ~50ms (with combined-data.json)
- **CSV loading**: ~500ms (16 files)
- **Offline**: Instant (Service Worker cache)

For performance details, see [ARCHITECTURE.md](docs/guides/ARCHITECTURE.md).

---

## 🐛 Troubleshooting

### App shows blank screen
- Check browser console (F12) for errors
- Verify all CSV files exist in `resources/`
- Clear Service Worker cache (Settings → Admin → Force Refresh)

### Resources not loading
- Must use `http://localhost` (not `file://`)
- CORS restrictions prevent file:// protocol

### Data not persisting
- Check if IndexedDB is enabled
- Avoid private/incognito mode
- Check DevTools → Application → IndexedDB

For more troubleshooting, see [DEVELOPMENT.md](docs/guides/DEVELOPMENT.md#troubleshooting).

---

## 📦 Deployment

See the [Deployment Guide](docs/guides/DEPLOYMENT.md) for:
- GitHub Pages deployment
- Custom domain setup
- Production checklist
- Performance optimization

---

## 🔒 Security

- XSS protection with DOMPurify
- Input validation on all imports
- HMAC data integrity signing
- Regular security audits

See [SECURITY.md](SECURITY.md) for the security policy and `docs/audits/` for audit reports.

---

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and detailed release notes.

**Latest Version:** v2.15 (Critical Performance Optimization)

---

## 📄 License

This software is proprietary. All rights reserved. See [LICENSE](LICENSE) for details.

Third-party open-source libraries are used under their respective licenses. See [ATTRIBUTION.md](docs/guides/ATTRIBUTION.md).

---

## 🤝 Contributing

See [Architecture Notes](docs/guides/ARCHITECTURE.md) for design principles and patterns.

---

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Review the [troubleshooting section](#-troubleshooting)
3. See relevant documentation in `docs/guides/`
4. Verify all CSV files are present and properly formatted

---

## 🔗 Resources

- [Alpine.js Documentation](https://alpinejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

---

**Built for A-Level Physics Students**
