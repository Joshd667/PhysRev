# PhysRev Documentation Guide Index

**Welcome to the PhysRev documentation!** This index will help you find the right guide for your needs.

---

## 📚 Quick Start

**New to the project?** Start here based on your role:

### For Developers
1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Understand the system architecture and design patterns
2. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Set up your local development environment
3. **[TESTING.md](TESTING.md)** - Run tests and validate changes

### For Educators & Content Creators
1. **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)** - Complete standalone guide for managing physics topics and resources

### For System Administrators
1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to production
2. **[TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md)** - Configure Microsoft Teams authentication

---

## 👥 Documentation by Audience

### 👩‍🏫 For Educators & Content Creators (Non-Technical)

| Guide | Description | When to Use |
|-------|-------------|-------------|
| **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)** | Complete standalone guide for adding/editing physics topics, learning objectives, and revision resources using Excel/CSV | Managing curriculum content, adding topics, updating resources |

> **Note:** CONTENT_MANAGEMENT.md is intentionally self-contained with all necessary information so educators don't need to reference technical documentation.

---

### 👨‍💻 For Developers

#### Essential Reading

| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture, technology stack, and design patterns | Alpine.js, IndexedDB, Service Workers, PWA, memory optimization, XSS protection |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Local development setup, workflow, and best practices | Quick start, testing, git workflow, common tasks, troubleshooting |
| **[DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md)** | Technical deep-dive into CSV loading, data pipeline, and revision mapping system | CSV parsing, parallel loading, JSON optimization, adding new data sources |

#### Testing & Quality Assurance

| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[TESTING.md](TESTING.md)** | Comprehensive manual and automated testing procedures | Manual checklists, automated tests (Vitest), PWA testing, cross-browser testing |
| **[CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md)** | Browser console debugging reference and development utilities | Debug logging, storage management, Service Worker debugging, performance profiling |

#### Deployment & Production

| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment guide and checklists | Generating optimized JSON, Service Worker versioning, hosting options (GitHub Pages, Netlify, Vercel) |

#### Performance & Optimization

| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[PERFORMANCE.md](PERFORMANCE.md)** | Performance optimization strategies and best practices | Memory optimization, intelligent caching, deduplication, rendering performance, monitoring |

#### Specialized Topics

| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[PAGINATION_USAGE.md](PAGINATION_USAGE.md)** | Using the pagination system for large lists | `$paginated` magic helper, load more buttons, virtual scrolling, performance optimization |

---

### 🔐 For System Administrators

| Guide | Description | When to Use |
|-------|-------------|-------------|
| **[TEAMS_LOGIN_INTEGRATION.md](TEAMS_LOGIN_INTEGRATION.md)** | Technical guide for Microsoft Teams login integration with Azure database options | Understanding architecture, choosing database options (SQL/Cosmos/Graph), implementing secure authentication and data storage |
| **[TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md)** | Microsoft Teams authentication configuration and Azure AD setup | Setting up organizational authentication, configuring OAuth, troubleshooting Teams login |

> **Current Status:** Teams authentication uses placeholder credentials and should be disabled until Azure AD is configured. Guest mode is fully functional.

---

### 📋 Reference Documentation

| Guide | Description |
|-------|-------------|
| **[ATTRIBUTION.md](ATTRIBUTION.md)** | Third-party licenses and legal compliance for open-source libraries used in the project |

---

## 📖 Documentation by Topic

### Getting Started
- **Setup & Installation:** [DEVELOPMENT.md](DEVELOPMENT.md#quick-start)
- **Architecture Overview:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **First Contribution:** [DEVELOPMENT.md](DEVELOPMENT.md#git-workflow)

### Content Management
- **Adding Physics Topics:** [CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md#step-by-step-adding-new-content)
- **Adding Revision Resources:** [CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md#adding-revision-resources)
- **Setting Up Paper 3:** [CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md#setting-up-paper-3-content)
- **CSV File Structure:** [CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md#csv-file-structure)
- **Technical Data Architecture:** [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md)

### Development Workflow
- **Local Development:** [DEVELOPMENT.md](DEVELOPMENT.md#quick-start)
- **Browser Console Commands:** [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md)
- **Testing Changes:** [TESTING.md](TESTING.md)
- **Service Worker Development:** [DEVELOPMENT.md](DEVELOPMENT.md#service-worker-development)
- **Git Best Practices:** [DEVELOPMENT.md](DEVELOPMENT.md#git-workflow)

### Architecture & Design
- **Technology Stack:** [ARCHITECTURE.md](ARCHITECTURE.md#technology-stack)
- **Memory Optimization:** [ARCHITECTURE.md](ARCHITECTURE.md#performance-architecture-non-reactive-static-data)
- **Storage Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md#storage--caching-architecture)
- **XSS Protection:** [ARCHITECTURE.md](ARCHITECTURE.md#xss-protection)
- **Production Logging:** [ARCHITECTURE.md](ARCHITECTURE.md#production-safe-logging)
- **Data Loading System:** [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md)
- **CSV to JSON Pipeline:** [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md#data-flow-architecture)

### Performance Optimization
- **Performance Guide Overview:** [PERFORMANCE.md](PERFORMANCE.md)
- **Memory Optimization:** [PERFORMANCE.md](PERFORMANCE.md#memory-optimization-non-reactive-static-data)
- **Intelligent Caching:** [PERFORMANCE.md](PERFORMANCE.md#rendering-optimization-intelligent-caching)
- **Deduplication:** [PERFORMANCE.md](PERFORMANCE.md#deduplication-preventing-duplicate-rendering)
- **Service Worker Caching:** [PERFORMANCE.md](PERFORMANCE.md#service-worker-offline--instant-loading)
- **IndexedDB Storage:** [PERFORMANCE.md](PERFORMANCE.md#indexeddb-asynchronous-storage)
- **Web Workers:** [PERFORMANCE.md](PERFORMANCE.md#web-workers-background-serialization)
- **Non-Reactive Static Data:** [ARCHITECTURE.md](ARCHITECTURE.md#performance-architecture-non-reactive-static-data)
- **JSON Optimization:** [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md#json-optimization)
- **Pagination System:** [PAGINATION_USAGE.md](PAGINATION_USAGE.md)
- **Virtual Scrolling:** [PAGINATION_USAGE.md](PAGINATION_USAGE.md#virtual-scrolling-advanced)
- **Performance Profiling:** [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#performance-profiling)

### Testing
- **Manual Testing Checklist:** [TESTING.md](TESTING.md#-manual-testing-checklist)
- **Automated Tests:** [TESTING.md](TESTING.md#-automated-testing)
- **PWA Testing:** [TESTING.md](TESTING.md#pwa)
- **Security Testing:** [TESTING.md](TESTING.md#security-manual-testing)
- **Cross-Browser Testing:** [TESTING.md](TESTING.md#cross-browser--device-testing)
- **Update Flow Testing:** [TESTING.md](TESTING.md#-testing-manual-updates-development)

### Deployment
- **Pre-Deployment Checklist:** [DEPLOYMENT.md](DEPLOYMENT.md#pre-deployment-preparation)
- **Generating Optimized JSON:** [DEPLOYMENT.md](DEPLOYMENT.md#1-generate-optimized-data-file)
- **Service Worker Versioning:** [DEPLOYMENT.md](DEPLOYMENT.md#2-update-service-worker-version)
- **GitHub Pages Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md#option-1-github-pages-recommended)
- **Netlify/Vercel Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md#option-2-netlify)
- **Production Checklist:** [DEPLOYMENT.md](DEPLOYMENT.md#production-checklist)
- **Troubleshooting:** [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting)

### Authentication
- **Teams Login Integration:** [TEAMS_LOGIN_INTEGRATION.md](TEAMS_LOGIN_INTEGRATION.md) (Technical guide with Azure database options)
- **Teams Auth Setup:** [TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md)
- **Azure AD Configuration:** [TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md#step-1-azure-ad-app-registration)
- **Disabling Teams Login:** [TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md#option-1-disable-teams-login)
- **Guest Mode:** Teams auth currently disabled, Guest mode is fully functional

### Debugging & Troubleshooting
- **Console Commands:** [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md)
- **Debug Logging:** [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#debug-logging)
- **Storage Debugging:** [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#storage-management)
- **Service Worker Debugging:** [CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#service-worker-commands)
- **Common Issues:** [DEVELOPMENT.md](DEVELOPMENT.md#troubleshooting)

### Advanced Features
- **Adding New Features:** [DEVELOPMENT.md](DEVELOPMENT.md#adding-a-new-feature)
- **Working with Pagination:** [PAGINATION_USAGE.md](PAGINATION_USAGE.md)
- **Adding New Data Sources:** [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md#adding-new-data-sources)
- **Custom Components:** [DEVELOPMENT.md](DEVELOPMENT.md#adding-a-new-feature)

---

## 🔍 Documentation Health

### Coverage Status
- ✅ **Architecture** - Complete
- ✅ **Development Setup** - Complete
- ✅ **Testing Procedures** - Complete
- ✅ **Deployment Guide** - Complete
- ✅ **Performance Optimization** - Complete
- ✅ **Content Management** - Complete (standalone for educators)
- ✅ **Console Reference** - Complete
- ✅ **Data Architecture** - Complete
- ✅ **Teams Auth** - Complete (with current status warnings)
- ✅ **Pagination** - Complete
- ✅ **Attribution** - Complete

### Cross-Link Validation
All cross-links have been validated. External documentation links point to:
- `../TODO.md` - Project TODO list
- `../../SECURITY.md` - Security policy
- `../../CHANGELOG.md` - Version history
- `../../README.md` - Main project README

---

## 🎯 Common Use Cases

### "I want to add new physics topics"
→ **[CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md#adding-a-new-topic)** (Standalone guide, no technical knowledge required)

### "I want to set up my development environment"
→ **[DEVELOPMENT.md](DEVELOPMENT.md#quick-start)**

### "I want to deploy to production"
1. **[DEPLOYMENT.md](DEPLOYMENT.md#pre-deployment-preparation)** - Generate optimized data
2. **[DEPLOYMENT.md](DEPLOYMENT.md#deployment-options)** - Choose hosting
3. **[DEPLOYMENT.md](DEPLOYMENT.md#production-checklist)** - Validate deployment

### "I need to debug an issue"
1. **[CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#debug-logging)** - Enable debug mode
2. **[CONSOLE_COMMANDS.md](CONSOLE_COMMANDS.md#common-debugging-workflows)** - Follow relevant workflow

### "The app is running slowly"
→ **[PERFORMANCE.md](PERFORMANCE.md)** - Complete performance optimization guide with troubleshooting
3. **[DEVELOPMENT.md](DEVELOPMENT.md#troubleshooting)** - Check common issues

### "I want to understand how data loading works"
1. **[DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md#data-flow-architecture)** - Overall pipeline
2. **[DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md#csv-loading-system)** - CSV loading details
3. **[DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md#json-optimization)** - Performance optimization

### "I want to add Microsoft Teams authentication"
→ **[TEAMS_AUTH_SETUP.md](TEAMS_AUTH_SETUP.md)** (Currently disabled, guide explains setup process)

### "I want to add pagination to a new list"
→ **[PAGINATION_USAGE.md](PAGINATION_USAGE.md#quick-start)**

### "I need to run tests"
→ **[TESTING.md](TESTING.md)** (Both manual and automated testing procedures)

---

## 📝 Contributing to Documentation

When updating documentation:

1. **Keep audience in mind:**
   - Educators: Non-technical, standalone, comprehensive
   - Developers: Technical detail, cross-references, DRY principle
   - Admins: Configuration-focused, security-conscious

2. **Maintain cross-links:**
   - Use relative paths: `[DEVELOPMENT.md](DEVELOPMENT.md)`
   - Link to specific sections when helpful: `[Quick Start](DEVELOPMENT.md#quick-start)`
   - Validate links after changes

3. **Follow existing patterns:**
   - Use emojis for visual navigation (📚 📖 👨‍💻 👩‍🏫 🔐 etc.)
   - Include "Last Updated" dates at bottom of files
   - Add tables of contents for long documents

4. **Special case - CONTENT_MANAGEMENT.md:**
   - Keep it self-contained and standalone
   - Duplicate necessary technical info for teacher audience
   - Don't require clicking through to other docs

5. **Update this index** when adding new guides or major sections

---

## 🔗 External Documentation

- **[Alpine.js Documentation](https://alpinejs.dev/)** - Reactive UI framework
- **[TailwindCSS Documentation](https://tailwindcss.com/)** - Utility-first CSS
- **[Chart.js Documentation](https://www.chartjs.org/)** - Charting library
- **[Vitest Documentation](https://vitest.dev/)** - Testing framework
- **[PWA Documentation](https://web.dev/progressive-web-apps/)** - Progressive Web Apps
- **[IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)** - Client-side storage
- **[Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)** - Offline support

---

## 📞 Getting Help

**Can't find what you need?**

1. **Search within docs:** Use your editor's search across all `.md` files
2. **Check cross-references:** Most guides link to related documentation
3. **Browse by topic:** See "Documentation by Topic" section above
4. **Check external resources:** See links to official documentation above
5. **Open an issue:** If documentation is missing or unclear

---

**Last Updated:** 2025-11-23
**Documentation Version:** 1.1
**Total Guides:** 11
