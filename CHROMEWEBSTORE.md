# Chrome Web Store Listing — NeatTabs

> Last Updated: 2026-11-20

## Store Listing

**Extension Name**
NeatTabs

**Short Description**
Automatically organizes and groups tabs in the current window using customizable domain and title regex rules, with domain fallback.

**Detailed Description**
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

**Category**
Productivity

**Single Purpose**
Automatically organizes and groups open browser tabs in the current window according to user-defined domain and title rules.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 (Options Light) | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-1-options-light.png` |
| Screenshot 2 (Options Dark) | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-2-options-dark.png` |
| Small Promo Tile | 440×280 PNG | ✅ Ready | `store-assets/promo-small-440x280.png` |

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

- Tab URLs and titles are accessed **locally in the browser only** to evaluate user rules and group tabs — they are never logged, stored, or transmitted off-device.
- User-configured rules and extension preferences are stored in `chrome.storage.sync`, which syncs them across the user's own signed-in Chrome browsers via Google's Chrome Sync infrastructure.

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

**Privacy Policy URL**
`https://carl-christiansen.github.io/neattabs/privacy.html`

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name**
Macando AB

**Contact Email**
support@macando.se

**Support URL**
https://github.com/carl-christiansen/neattabs/issues

**Homepage URL**
https://github.com/carl-christiansen/neattabs

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-11-20 | Initial release: rule-based automatic & one-click tab grouping, domain fallback, optional host-in-title labels, synced settings. | Draft |
