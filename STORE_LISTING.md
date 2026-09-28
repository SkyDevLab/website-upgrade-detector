# Microsoft Edge Add-ons & Chrome Web Store Listing Information

Use this document to copy and paste metadata directly into the **Microsoft Edge Partner Center** (or **Chrome Web Store Developer Dashboard**) when publishing the extension.

---

## 1. Basic Metadata

* **Name:** Website Upgrade Detector
* **Short Description (under 132 chars):**
  Detect JavaScript/CSS libraries on websites, check current versions, and see latest published releases on npm in one click.
* **Category:** Developer Tools
* **Language:** English (United States)
* **Pricing:** Free
* **Website / Homepage:** https://github.com/Skyrunner-Dev-ops/website-upgrade-detector
* **Support URL:** https://github.com/Skyrunner-Dev-ops/website-upgrade-detector/issues
* **Privacy Policy URL:** https://github.com/Skyrunner-Dev-ops/website-upgrade-detector/blob/main/PRIVACY.md

---

## 2. Detailed Description (Store Markdown / Plain Text)

```text
Website Upgrade Detector by SkyDevLab is an essential developer utility that detects JavaScript and CSS libraries running on any webpage, determines their currently detected versions, and checks the official npm registry in real-time to highlight newer releases.

Whether inspecting client sites, performing tech stack audits, or assessing modernization opportunities, Website Upgrade Detector provides immediate, deterministic clarity without any backend or accounts required.

KEY FEATURES:
• One-Click Stack Audit: Click "Scan Website" to instantly detect popular web libraries and frameworks.
• Smart Version Detection: Identifies versions from runtime globals, script CDN URLs, stylesheet links, and DOM attributes.
• Real-Time npm Registry Lookups: Queries the official npm registry directly to retrieve the latest published version.
• SemVer 2.0.0 Accuracy: Full semantic version comparison distinguishing major breaking updates from patch/minor improvements.
• Clear Upgrade Report: Displays library cards with detected vs. latest versions, upgrade status badges, and expandable evidence trails.
• Conflict Resolution: Transparently handles pages with differing runtime vs. CDN script versions.
• 6-Hour Smart Cache: Avoids repetitive network requests while offering a one-click "Refresh Versions" cache bypass.
• 100% Privacy-Preserving: Operates entirely locally. Never collects or transmits your browsing history, webpage content, or personal data.

SUPPORTED MVP LIBRARIES:
• React (react)
• Vue.js (vue)
• Angular (@angular/core)
• jQuery (jquery)
• Bootstrap (bootstrap)
• Tailwind CSS (tailwindcss)
• Axios (axios)
• Lodash (lodash)
• Moment.js (moment)
• Three.js (three)

HOW TO USE:
1. Navigate to any website.
2. Click the Website Upgrade Detector icon in your browser toolbar.
3. Click "Scan Website".
4. Review detected libraries, versions, and available updates.
5. Click on any library card to expand evidence details or jump directly to its npm package page.

PRIVACY & PERMISSIONS:
Website Upgrade Detector values your privacy. The extension only sends the public npm package name (e.g. "jquery", "react") to registry.npmjs.org. No website URLs, cookies, form data, or browsing records are ever recorded or transmitted.
```

---

## 3. Search Keywords / Tags

```text
developer tools, web audit, tech stack detector, npm, javascript libraries, css frameworks, semver, react, vue, angular, jquery, bootstrap, tailwind, library versions, upgrade detector
```

---

## 4. Store Assets Checklist

* [x] **Small Icon (32x32):** `public/icons/icon32.png`
* [x] **Medium Icon (48x48):** `public/icons/icon48.png`
* [x] **Store Icon (128x128):** `store-assets/icon128.png`
* [x] **High-Res Promo Icon (512x512):** `store-assets/icon512.png`
* [x] **Original Art (1024x1024):** `store-assets/icon-original.jpg`
* [x] **Store Package Archive (ZIP):** `dist-zip/website-upgrade-detector-v1.0.0.zip` (generated via `npm run package`)

---

## 5. Justification for Requested Permissions

* **`activeTab` & `scripting`:** Required to safely execute deterministic library detectors in the execution context of the webpage the user explicitly chooses to scan.
* **`storage`:** Required to persist the 6-hour local cache of npm latest version strings, preventing redundant network requests.
* **`https://registry.npmjs.org/*`:** Required to make direct, authenticated-free queries to the public npm registry for latest published release tags.
