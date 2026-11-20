# NeatTabs

A lightweight, minimalist Manifest V3 Chrome extension that organizes and groups tabs in the current window using customizable domain and title regex rules, with optional automatic domain-based fallback grouping.

## Features

- **Automatic grouping:** Newly created and navigated tabs are sorted into matching colored tab groups as you browse (toggleable in Options).
- **One-click grouping:** Click the **NeatTabs** toolbar icon anytime to organize all open tabs in the current window.
- **Custom regex rules:** Match tabs by hostname (`new URL(tab.url).hostname`), page title, or either, evaluated top to bottom (first match wins).
- **Optional host in tab titles:** Enable **Host in Title** on any rule to prepend or append `[host]` to matching tab titles, with an optional regex filter to strip repeated suffixes (for example, turning `orders-api.company.com` into `[orders-api] Swagger UI`).
- **Automatic domain fallback:** Optionally group unmatched tabs by their base hostname in `grey`.
- **Safe tab filtering:** Skips pinned tabs, empty URLs, and internal browser pages (`chrome://`, `chrome-extension://`, `about:blank`, etc.).
- **Synced settings:** Rules and preferences are stored in `chrome.storage.sync`.
- **Adaptive theme:** Minimalist Options UI supporting light and dark system themes with zero external dependencies.

## Supported Colors

`grey`, `blue`, `red`, `yellow`, `green`, `pink`, `purple`, `cyan`, `orange`

## Install from Source (Developer Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/carl-christiansen/neattabs.git
   ```
2. Open Google Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the cloned `neattabs` folder.
5. Pin **NeatTabs** from the Extensions menu (puzzle-piece icon) for one-click access.

## Usage

- **Group tabs:** Click the **NeatTabs** icon in the Chrome toolbar to organize tabs in the current window.
- **Configure rules:** Right-click the extension icon and choose **Options** (or open **Extension options** from `chrome://extensions`). NeatTabs starts with no pre-configured rules and domain fallback enabled so you can add only the rules you want.
- **Reorder priority:** Use the `↑` and `↓` buttons on any rule row to change evaluation order, then click **Save Settings**.

## Privacy

NeatTabs processes tab URLs and titles locally in your browser solely to match your rules and organize tabs. No browsing data is collected, logged, or sent to external servers. Custom rules and preferences are stored via `chrome.storage.sync`. See the full [Privacy Policy](https://carl-christiansen.github.io/neattabs/privacy.html).

## Project Structure

- `manifest.json` — Manifest V3 configuration.
- `shared.js` — Defaults, regex validation, and tab-grouping planner.
- `background.js` — MV3 service worker handling toolbar clicks and tab events.
- `options.html`, `options.css`, `options.js` — Options page UI and settings persistence.
- `icons/` — Extension icons (`16×16`, `48×48`, `128×128`).
- `docs/privacy.html` — Public privacy policy page.
- `package-extension.py` — Builds a clean Chrome Web Store submission ZIP.

## Support

Found a bug or have a suggestion? Open an issue at [github.com/carl-christiansen/neattabs/issues](https://github.com/carl-christiansen/neattabs/issues) or email `support@macando.se`.
