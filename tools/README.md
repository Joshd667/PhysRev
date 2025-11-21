# Developer Tools

This directory contains development and build tools for the Physics Audit application.

## 🚀 Getting Started

**Access all tools via the dashboard:**
- Open `tools/index.html` in your browser
- Or visit: [http://localhost:8000/tools/](http://localhost:8000/tools/) (when running locally)

---

## 📦 Available Tools

### Documentation Hub

#### `documentation.html`
Centralized documentation portal with all guides organized by role.

**What you'll find:**
- **For Educators:** Content management guide (CSV editing, adding topics)
- **For Developers:** Architecture, development setup, data flow, testing, console commands
- **For Admins:** Deployment guide, Teams authentication setup
- **Reference:** Attribution, licenses, complete index
- **External Links:** Alpine.js, TailwindCSS, Chart.js, and more

**Quick links by role:**
- Educators → Content Management
- Developers → Architecture + Development Setup
- Admins → Deployment Guide

---

### CSV to JSON Converter

#### `csv-converter.html`
The all-in-one converter with both server and local modes.

**Features:**
- **Server Mode:** Fetches CSVs from running web server
- **Local Mode:** Drag-and-drop file uploads (works offline)
- Processes all 16 CSV files (10 subject + 5 resource + groups.csv)
- Builds revision mappings and groups configuration
- **Performance:** Reduces load time from ~20 seconds to ~1 second

**When to use:** Whenever you update CSV data files

**Output:** `combined-data.json` → place in `resources/` folder

---

### Security Tools

#### `generate-sri-hashes.js`
Node.js CLI tool that generates Subresource Integrity (SRI) hashes for CDN dependencies.

**What it does:**
- Fetches libraries from CDNs (Alpine.js, DOMPurify, Chart.js, Lucide)
- Generates SHA-384 cryptographic hashes
- Outputs integrity attributes for `<script>` tags

**Why:** Protects against CDN compromises and supply chain attacks

**Usage:**
```bash
node tools/generate-sri-hashes.js
```

**When to use:** Whenever you update CDN library versions in `index.html`

**Requirements:**
- Node.js installed
- Internet connection

---

### Testing Tools

#### `test-imports.html`
Module import verification tool for development.

**What it does:**
- Tests all JavaScript module imports
- Reports success/failure for each module
- Displays error messages and stack traces

**When to use:**
- During development to catch broken imports
- After refactoring module structure
- When debugging module loading issues

**Access:** Open in browser from running web server

---


## 🔄 Typical Workflows

### Updating CSV Data
1. Edit CSV files in `resources/subject-cards/` or `resources/revision/`
2. Open `tools/index.html` in browser
3. Run CSV to JSON Converter (unified version)
4. Download `combined-data.json`
5. Place in `resources/` folder
6. Reload app - 10x faster! ⚡

### Updating CDN Libraries
1. Update library versions in `index.html`
2. Run: `node tools/generate-sri-hashes.js`
3. Copy generated integrity hashes
4. Add to corresponding `<script>` tags in `index.html`

### Debugging Module Imports
1. Make code changes
2. Open `tools/test-imports.html` in browser
3. Check for any failed imports
4. Fix errors and re-test

---

## 📝 Notes

- All browser-based tools require the app to be served via HTTP(S)
- Use `python -m http.server 8000` or similar for local development
- Tools work best in modern browsers with ES6 module support
- For CSV converters: ensure all 16 CSV files exist before running

---

## 🛠️ Tool Status Reference

| Tool | Type | Requires Server | Node.js Required |
|------|------|----------------|------------------|
| documentation.html | Browser | No | No |
| csv-converter.html | Browser | Optional (has both modes) | No |
| generate-sri-hashes.js | CLI | No | Yes |
| test-imports.html | Browser | Yes | No |
