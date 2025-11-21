# Changelog

**Major milestones for the Physics Knowledge Audit Tool.**

## Why This Format?

This changelog focuses on **major milestones** rather than detailed feature changes. For granular change history:
- **Recent changes**: See [GitHub commit history](https://github.com/Joshd667/PhysRev/commits/)
- **Pull requests**: See [GitHub PRs](https://github.com/Joshd667/PhysRev/pulls)
- **Code review**: Use `git log` or `git blame` for specific file changes

**Rationale:** A milestone-based changelog is easier to maintain, reduces duplication with git history, and focuses on user-impacting changes rather than implementation details.

---

## 2025-11 - Comprehensive Documentation Overhaul

**📚 Developer & User Documentation Expansion**

Massively expanded and restructured project documentation to reflect current build state, improve developer onboarding, and clarify security risks.

**New Documentation:**
- **[docs/guides/README.md](docs/guides/README.md)** - Comprehensive documentation index (NEW)
- **[CONSOLE_COMMANDS.md](docs/guides/CONSOLE_COMMANDS.md)** - Browser console debugging reference (NEW)
- **[TODO.md](docs/TODO.md)** - Outstanding tasks and known issues tracker (NEW)

**Expanded Guides:**
- **[DEPLOYMENT.md](docs/guides/DEPLOYMENT.md)** - 32 → 462 lines: Comprehensive production deployment guide
- **[TEAMS_AUTH_SETUP.md](docs/guides/TEAMS_AUTH_SETUP.md)** - 297 → 626 lines: Critical security warnings, implementation details
- **[TESTING.md](docs/guides/TESTING.md)** - 80 → 192 test items: Comprehensive testing coverage
- **[DEVELOPMENT.md](docs/guides/DEVELOPMENT.md)** - 281 → 622 lines: Complete developer onboarding guide
- **[PAGINATION_USAGE.md](docs/guides/PAGINATION_USAGE.md)** - Added current usage context

**Updated Documentation:**
- **[SECURITY.md](SECURITY.md)** - Updated to v2.0 with improved cohesiveness
- **[ARCHITECTURE.md](docs/guides/ARCHITECTURE.md)** - Clarity improvements
- **[CONTENT_MANAGEMENT.md](docs/guides/CONTENT_MANAGEMENT.md)** - Enhanced for teachers
- **[DATA_ARCHITECTURE.md](docs/guides/DATA_ARCHITECTURE.md)** - Technical implementation guide
- **[README.md](README.md)** - Updated navigation and categorization

**Key Improvements:**
- 📚 **Comprehensive documentation index** with audience-based navigation and topic organization
- ⚠️ **Critical security warnings** for Teams auth (ACTIVE but NON-FUNCTIONAL with placeholder credentials)
- 🔧 **BUILD_TIMESTAMP versioning** documented consistently across all guides
- 🧪 **192 comprehensive test items** covering security, performance, accessibility
- 🎨 **Console commands** consolidated into dedicated reference guide
- 📊 **Cross-referenced documentation** for easier navigation
- 🗺️ **Current build state** accurately reflected in all documentation

**Documentation Commits:**
- 5811c56 - Update SECURITY.md with current state
- 5f454f3 - Create CONSOLE_COMMANDS.md reference guide
- 6ef27bb - Expand DEVELOPMENT.md
- 343b1ec - Expand TESTING.md
- 764e07c - Expand TEAMS_AUTH_SETUP.md with security warnings
- 312f4b2 - Improve PAGINATION_USAGE.md
- 1684634 - Expand DEPLOYMENT.md
- 81674e2 - Add DATA_ARCHITECTURE.md
- 53329f1 - Improve CONTENT_MANAGEMENT.md
- f8a71fa - Clean up ATTRIBUTION.md
- 27addaf - Add TODO.md tracker

---

## v2.15 - Critical Performance Optimization (2025-11-13)

**⚡ Memory Optimization: 90% Reduction (1.2GB → 100-150MB)**

Fundamental architecture change to eliminate Alpine.js Proxy overhead on large static datasets:
- Moved 70MB of read-only specification data outside Alpine's reactive system
- Stored in module-level variables accessed via getter methods
- Result: 90% memory reduction, smooth navigation, mobile/tablet usability restored

**🎨 Mindmap Canvas Performance Overhaul**

Complete rewrite of canvas rendering and interaction system:
- **Canvas panning/zooming**: Hardware-accelerated CSS transforms (60fps, zero CPU overhead)
- **Event listeners**: Automatic cleanup on close (prevents memory leaks)
- **Memory limits**: Undo stack, test history, analytics limited to prevent unbounded growth
- **UI improvements**: Background panning, inline formatting, line style editing

**Technical Details:** See [ARCHITECTURE.md](docs/guides/ARCHITECTURE.md) for complete implementation details.

---

## v2.14 - UI Improvements & IndexedDB Migration (2025-10-26 to 2025-11-19)

**🎛️ UI Enhancements**
- **Sliding Sort Controls**: Compact slider button for flashcard/test-set sorting (date, count, attempts, score)
- **Notes Card View**: Responsive card grid with preview panel, inline actions, tag chips, timestamps
- **Reactive Data Fixes**: Alpine reactivity restored for card metrics, pin badges update instantly

**🗄️ IndexedDB Migration**
- **Major Storage Upgrade**: localStorage → IndexedDB (5-10MB → 100s of MB capacity)
- **Automatic Migration**: Seamless data migration on first load after update
- **Performance**: Asynchronous operations, transaction support, no quota errors
- **Benefits**: 10-50x more storage capacity, better foundation for future features

**Technical Details:** See commit history for implementation details.

---

## Archive - Versions v2.13 and Earlier

Older versions (v2.13, v2.12, v2.11, v2.10, v2.9, v2.8, v2.7, v2.6, v2.5, v2.4, v2.3) have been archived.

**For detailed change history:**
- **Git commits**: `git log --oneline --all` or [GitHub commit history](https://github.com/Joshd667/PhysRev/commits/)
- **Specific files**: `git log --follow <file_path>`
- **Date range**: `git log --since="2025-01-01" --until="2025-10-01"`

**Major archived milestones included:**
- Separated Storage Architecture, Flashcard Editor Rich Text, Editor Modal UI Improvements
- Performance Optimization, Manual Update Control, Code Optimization & Refactoring
- CSV-Based Revision Mappings, Equation Editor, Topic Tagging
- Security & Reliability, Navigation Bug Fix
