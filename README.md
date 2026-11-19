# RuleTabGrouper

A lightweight, minimalist Manifest V3 Google Chrome extension that organizes and groups tabs in the current window using customizable domain and title regex rules, with automatic domain-based fallback grouping.

## Features

- **Automatic grouping:** Newly created and navigated tabs are automatically sorted into matching groups (can be toggled in Options).
- **One-click grouping:** Click the RuleTabGrouper toolbar icon anytime to re-group all open tabs in the active window.
- **Sequential rule matching:** Rules are evaluated top to bottom (first matching rule wins).
- **Case-insensitive regex:** Match against tab hostname (`new URL(tab.url).hostname`), page title, or either.
- **Automatic domain fallback:** Unmatched tabs can optionally be grouped by base hostname (e.g., `google.com`) in `grey`.
- **Safe tab filtering:** Automatically skips pinned tabs, empty URLs, and browser/internal pages (`chrome://`, `chrome-extension://`, `about:blank`, etc.).
- **Synced settings:** Rules and preferences are stored in `chrome.storage.sync`.
- **Adaptive theme:** Minimalist Options UI supporting light and dark system themes with zero external dependencies.

## Default Rules

| Rule Name | Color | Domain Regex | Title Regex |
| :--- | :--- | :--- | :--- |
| Work / Tracker | `blue` | `atlassian\.net\|jira\|linear\.app` | — |
| Git Repos | `green` | `github\.com\|gitlab\.com` | — |
| Swagger / APIs | `yellow` | `swagger` | `swagger\|openapi` |
| Local Dev | `purple` | `localhost\|127\.0\.0\.1` | — |

Supported Chrome tab group colors: `grey`, `blue`, `red`, `yellow`, `green`, `pink`, `purple`, `cyan`, `orange`.

## How to Load Unpacked in Chrome (Developer Mode)

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** on in the top-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Select this directory (`/home/dev/tab-grouper` or your cloned folder containing `manifest.json`).
5. Pin **RuleTabGrouper** from the Extensions menu (puzzle-piece icon) for quick one-click access.

## Usage

- **Group tabs:** Click the **RuleTabGrouper** icon in the Chrome toolbar to organize tabs in the current window.
- **Configure rules:** Right-click the extension icon and choose **Options** (or open **Extension options** from `chrome://extensions`).
- **Reorder priority:** Use the `↑` and `↓` buttons on any rule row to change rule evaluation order, then click **Save Settings**.

## Files

- `manifest.json` — Manifest V3 configuration (`tabs`, `tabGroups`, `storage`).
- `shared.js` — Shared defaults, regex validation, and tab-grouping planner.
- `background.js` — MV3 service worker listening to `chrome.runtime.onInstalled` and `chrome.action.onClicked`.
- `options.html`, `options.css`, `options.js` — Options page UI and settings persistence.
- `README.md` — Documentation and unpacked installation guide.
