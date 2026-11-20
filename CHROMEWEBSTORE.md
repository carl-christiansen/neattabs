# Chrome Web Store Listing — NeatTabs

> Last Updated: 2026-11-20

## Store Listing

**Extension Name** [REQUIRED]
<!-- Must match manifest.json "name". Max 75 characters. -->
NeatTabs

**Short Description** [REQUIRED]
<!-- Max 132 characters. Shown in search results and tiles. Be specific about function. -->
Automatically organizes and groups tabs in the current window using customizable domain and title regex rules, with domain fallback.

**Detailed Description** [REQUIRED]
<!-- Max 16,000 characters. Plain text with line breaks — CWS strips markdown. -->
Automatically organize and group your open tabs in the current window using custom domain and page-title rules, with optional automatic grouping by website domain.

FEATURES
• Automatic tab grouping — Newly opened and navigated tabs are sorted into matching colored tab groups as you browse (can be toggled on or off anytime).
• One-click window cleanup — Click the toolbar icon anytime to organize all open tabs in your current window.
• Custom domain and title rules — Match tabs by website hostname, page title, or both using case-insensitive patterns, evaluated in your chosen priority order.
• Optional host labels in tab titles — Add a short [host] tag before or after matching tab titles (and optionally strip repeated domain suffixes) so you can tell similar dashboards or API docs apart at a glance.
• Automatic domain fallback — Optionally group unmatched tabs by their base domain so stray tabs stay tidy.
• Safe by default — Skips pinned tabs and internal browser pages automatically.
• Synced settings — Your rules and preferences sync across your signed-in Chrome browsers.
• Clean light and dark options page — Matches your system theme automatically.

HOW TO USE
1. Pin the extension to your Chrome toolbar.
2. Click the toolbar icon anytime to group open tabs in the current window by domain, or right-click and select Options to add your own custom rules.
3. Customize rule names, colors, matching patterns, priority order, host-in-title labels, and auto-grouping in Options.

PRIVACY
Your browsing stays private. Tab addresses and titles are processed locally in your browser solely to match your rules and organize your tabs. No browsing data is ever sent to external servers, sold, or shared with third parties. Your custom rules and preferences are synced only through your own Chrome profile.

PERMISSIONS
• Read your browsing history / tabs — Required to inspect open tab addresses and titles in order to match your grouping rules.
• Manage tab groups — Required to create, rename, color, and update tab groups.
• Storage — Required to save and sync your custom rules and preferences.
• Read and change data on sites you visit — Required only when you enable the optional "Host in Title" setting on a rule, so the extension can display a [host] label in the tab title of matching pages.

SUPPORT
Questions, feedback, or bug reports? Open an issue at https://github.com/carl-christiansen/neattabs/issues or email support@macando.se.

Version 1.0.0 — Initial release with automatic and one-click rule-based tab grouping, domain fallback, and optional host-in-title labels.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Automatically organizes and groups open browser tabs in the current window according to user-defined domain and title rules.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | `store-assets/screenshot-1-grouped-tabs.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `store-assets/screenshot-2-options.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `store-assets/screenshot-3-host-in-title.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | `store-assets/promo-small-440x280.png` |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes
- **Screenshot 1 (1280×800):** Chrome window showing multiple colored tab groups created by the extension (e.g., Work / Tracker, Git Repos, Swagger / APIs, Local Dev) with the extension icon visible in the toolbar.
- **Screenshot 2 (1280×800):** The Options page (`options.html`) showing the rule editor (rule names, colors, domain/title regex patterns, priority arrows, and auto-group / domain-fallback toggles).
- **Screenshot 3 (1280×800):** Close-up or full window demonstrating the optional "Host in Title" feature (e.g., `[orders-api] Swagger UI` in the tab strip alongside the matching rule setting).

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `tabs` | permissions | Required to read the URL, title, pinned state, and group membership of open tabs in the current window, listen for newly opened/updated tabs when auto-grouping is enabled, and place matching tabs into tab groups. |
| `tabGroups` | permissions | Required to query existing tab groups in the current window and create or update tab group titles and colors according to the user's configured rules. |
| `storage` | permissions | Required to save and sync the user's custom grouping rules and preferences via `chrome.storage.sync`, and to hold a short-lived lock in `chrome.storage.session` so rapid toolbar clicks do not race. |
| `scripting` | permissions | Required solely for the optional per-rule "Host in Title" feature, which runs a small script on matching tabs to prepend or append a `[host]` label to `document.title` so users can distinguish tabs that share generic titles (such as multiple Swagger/API environments). |
| `http://*/*` | host_permissions | Required so the optional "Host in Title" feature can update `document.title` on any HTTP page matching the user's custom domain/title rules (for example, local or internal dev servers). Because rules are user-defined regexes, hostnames cannot be known in advance. |
| `https://*/*` | host_permissions | Required so the optional "Host in Title" feature can update `document.title` on any HTTPS page matching the user's custom domain/title rules. Because rules are user-defined regexes, hostnames cannot be known in advance. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No (no personal data or browsing history is collected, transmitted to developer servers, or shared with third parties).

> Note for Chrome Web Store Dashboard form:
> - Tab URLs and titles are accessed **locally in the browser only** to evaluate user rules and group tabs — they are never logged, stored, or transmitted off-device.
> - User-configured rules and extension preferences are stored in `chrome.storage.sync`, which syncs them across the user's own signed-in Chrome browsers via Google's Chrome Sync infrastructure. Disclose this transparently in the Privacy Policy (already covered in `docs/privacy.html`).

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No (local matching only) | No | Match open tab URL/title against user rules locally | No |
| User activity | No | No | — | No |
| Website content | No (local title update only if enabled) | No | Optional `[host]` prefix/suffix in tab title | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
`https://carl-christiansen.github.io/neattabs/privacy.html`

> Setup step: Enable GitHub Pages in the repository (**Settings → Pages → Source: Deploy from a branch → Branch: `main`, Folder: `/docs`**), then verify the URL returns HTTP 200 before submitting to Chrome Web Store.

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]
Macando AB

**Contact Email** [REQUIRED]
support@macando.se

**Support URL / Email** [RECOMMENDED]
https://github.com/carl-christiansen/neattabs/issues

**Homepage URL** [RECOMMENDED]
https://github.com/carl-christiansen/neattabs

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-11-20 | Initial release: rule-based automatic & one-click tab grouping, domain fallback, optional host-in-title labels, synced settings. | Draft |

## Review Notes

### Known Issues / Limitations
- Broad `host_permissions` (`http://*/*`, `https://*/*`) + `scripting` are used exclusively for the optional "Host in Title" feature because users define arbitrary regex rules. Expect manual review (typically 1–5 business days).
- Restricted browser pages (`chrome://`, `chrome-extension://`, Chrome Web Store) are safely skipped and cannot be scripted or grouped.

### Rejection History
<!-- None yet -->
