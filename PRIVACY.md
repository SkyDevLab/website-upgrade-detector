# Privacy Policy for Website Upgrade Detector

*Last updated: September 28, 2026*
*Developer: SkyDevLab*

**Website Upgrade Detector** is committed to protecting your privacy. This extension is designed from the ground up as a client-side developer utility with strict privacy guarantees.

---

## 1. Information We Do NOT Collect

Website Upgrade Detector does **NOT** collect, transmit, store, or sell any of the following:

* Webpage contents, DOM trees, or HTML source code
* Browsing history or visited website URLs
* Cookies, local storage, or session tokens
* Form inputs, passwords, or personal credentials
* IP addresses, user identity, or device telemetry
* Analytics or tracking cookies

---

## 2. Information Handled Locally

When you click **Scan Website**:
1. The extension temporarily inspects the active tab in memory to detect the presence of common open-source JavaScript and CSS libraries (such as React, Vue, jQuery, Bootstrap, Axios).
2. All version parsing and comparisons are performed **100% locally** within your browser.
3. Detected library metadata is never saved to external servers.

---

## 3. Network Requests (npm Registry Only)

To retrieve the latest published versions of detected libraries:
* The extension sends an anonymous HTTP `GET` request directly to the public **npm registry** (`https://registry.npmjs.org/<package-name>/latest`).
* **Only the public npm package name** (e.g. `jquery`, `react`, `@angular/core`) is transmitted.
* **No website URL, domain, or user-identifying parameter is ever included in the npm request.**
* Lookup results are cached in local browser storage (`chrome.storage.local`) for 6 hours to minimize network traffic.

---

## 4. Permissions Explanation

The extension requests only the minimum required permissions:

* **`activeTab` & `scripting`:** Used strictly when you click the extension popup to inspect runtime library globals and script tags in the foreground tab.
* **`storage`:** Used solely to save the 6-hour local cache of npm latest version strings to prevent redundant registry requests.
* **`host_permissions` (`https://registry.npmjs.org/*`):** Required to fetch published release metadata directly from the public npm registry.

---

## 5. Third-Party Sharing

Website Upgrade Detector does not share data with any third parties, advertisers, or data brokers. There are no advertising SDKs, analytics trackers, or remote telemetry scripts bundled with this extension.

---

## 6. Open Source & Verifiability

This extension is completely open-source under the MIT License. The complete source code can be reviewed on GitHub:
[https://github.com/Skyrunner-Dev-ops/website-upgrade-detector](https://github.com/Skyrunner-Dev-ops/website-upgrade-detector)

---

## 7. Contact & Support

For privacy inquiries or bug reports, please file an issue on GitHub or contact SkyDevLab at:
* Email: Pratapsinghsurya19@gmail.com
* GitHub Issues: https://github.com/Skyrunner-Dev-ops/website-upgrade-detector/issues
