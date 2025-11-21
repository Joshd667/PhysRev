# Developer Tools

This directory contains development and build tools for the Physics Audit application.

## 🚀 Getting Started

**Access all tools via the dashboard:**
- Open `tools/index.html` in your browser
- Or visit: [http://localhost:8000/tools/](http://localhost:8000/tools/) (when running locally)

---

## 📦 Available Tools

### CSV to JSON Converters

#### `csv-converter-unified.html` ⭐ **Recommended**
The most feature-complete converter with both server and local modes.

**Features:**
- Server Mode: Fetches CSVs from running web server
- Local Mode: Drag-and-drop file uploads (works offline)
- Processes all 16 CSV files (10 subject + 5 resource + groups.csv)
- Builds revision mappings and groups configuration
- **Performance:** Reduces load time from ~20 seconds to ~1 second

**When to use:** Whenever you update CSV data files

**Output:** `combined-data.json` → place in `resources/` folder

---

#### `csv-converter.html`
Server-only version that fetches CSVs from web server.

**Use case:** When running app on localhost or web server

---

#### `csv-converter-local.html`
Offline version with drag-and-drop file upload interface.

**Use case:** Quick conversions without running a web server

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

### Authentication

#### `auth-callback.html`
OAuth callback handler for third-party authentication.

**What it does:**
- Receives OAuth redirects from providers (Google, Microsoft, etc.)
- Allows parent window to extract authentication tokens
- Auto-closes after 3 seconds

**Important:**
- Do not delete this file - required for OAuth flows
- Automatically used by authentication system
- No manual interaction needed

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
| csv-converter-unified.html | Browser | Optional | No |
| csv-converter.html | Browser | Yes | No |
| csv-converter-local.html | Browser | No | No |
| generate-sri-hashes.js | CLI | No | Yes |
| test-imports.html | Browser | Yes | No |
| auth-callback.html | Browser | Yes | No |
