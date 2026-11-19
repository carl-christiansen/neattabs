/**
 * Supported Chrome tab group colors.
 */
export const VALID_COLORS = Object.freeze([
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
]);

export const DEFAULT_FALLBACK_COLOR = 'grey';

export const STORAGE_KEYS = Object.freeze(['rules', 'groupUnmatchedByDomain']);

/**
 * Default grouping rules evaluated in priority order.
 */
export const DEFAULT_RULES = Object.freeze([
  Object.freeze({
    name: 'Work / Tracker',
    color: 'blue',
    domainPattern: 'atlassian\\.net|jira|linear\\.app',
    titlePattern: '',
  }),
  Object.freeze({
    name: 'Git Repos',
    color: 'green',
    domainPattern: 'github\\.com|gitlab\\.com',
    titlePattern: '',
  }),
  Object.freeze({
    name: 'Swagger / APIs',
    color: 'yellow',
    domainPattern: 'swagger',
    titlePattern: 'swagger|openapi',
  }),
  Object.freeze({
    name: 'Local Dev',
    color: 'purple',
    domainPattern: 'localhost|127\\.0\\.0\\.1',
    titlePattern: '',
  }),
]);

/**
 * Returns mutable shallow copies of the default rules.
 * @returns {Array<{name: string, color: string, domainPattern: string, titlePattern: string}>}
 */
export function cloneDefaultRules() {
  return DEFAULT_RULES.map((rule) => ({ ...rule }));
}

/**
 * Ensures a tab group color is valid, falling back to grey otherwise.
 * @param {unknown} color
 * @returns {string}
 */
export function sanitizeColor(color) {
  return typeof color === 'string' && VALID_COLORS.includes(color)
    ? color
    : DEFAULT_FALLBACK_COLOR;
}

/**
 * Validates and compiles an optional case-insensitive regex pattern string.
 * @param {unknown} pattern
 * @returns {{ valid: boolean, regex: RegExp | null, error?: string }}
 */
export function validateRegexPattern(pattern) {
  const trimmed = typeof pattern === 'string' ? pattern.trim() : '';
  if (!trimmed) {
    return { valid: true, regex: null };
  }

  try {
    return { valid: true, regex: new RegExp(trimmed, 'i') };
  } catch (err) {
    return {
      valid: false,
      regex: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Extracts a lowercase hostname from http/https URLs, skipping system or blank pages.
 * @param {unknown} urlString
 * @returns {string | null}
 */
export function extractWebHostname(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  return parsed.hostname.toLowerCase() || null;
}

/**
 * Strips leading "www." from a hostname for cleaner fallback group titles.
 * @param {string} hostname
 * @returns {string}
 */
export function getFallbackDomain(hostname) {
  return hostname.replace(/^www\./i, '');
}

/**
 * Compiles stored rule objects into executable RegExp matchers, skipping invalid/empty rules.
 * @param {unknown} rules
 * @returns {Array<{name: string, color: string, domainRegex: RegExp | null, titleRegex: RegExp | null}>}
 */
export function compileRules(rules) {
  if (!Array.isArray(rules)) {
    return [];
  }

  const compiled = [];
  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') {
      continue;
    }

    const domainResult = validateRegexPattern(rule.domainPattern);
    const titleResult = validateRegexPattern(rule.titlePattern);

    if (!domainResult.regex && !titleResult.regex) {
      continue;
    }

    const name = typeof rule.name === 'string' ? rule.name.trim() : '';
    compiled.push({
      name: name || 'Untitled Group',
      color: sanitizeColor(rule.color),
      domainRegex: domainResult.regex,
      titleRegex: titleResult.regex,
    });
  }

  return compiled;
}

/**
 * Returns the first compiled rule matching either the hostname or page title.
 * @param {string} hostname
 * @param {string} title
 * @param {ReturnType<typeof compileRules>} compiledRules
 */
export function matchTabToRule(hostname, title, compiledRules) {
  const safeTitle = typeof title === 'string' ? title : '';

  for (const rule of compiledRules) {
    const domainMatched = rule.domainRegex ? rule.domainRegex.test(hostname) : false;
    const titleMatched = rule.titleRegex ? rule.titleRegex.test(safeTitle) : false;

    if (domainMatched || titleMatched) {
      return rule;
    }
  }

  return null;
}

/**
 * Computes desired tab groups for a list of tabs given user rules and fallback setting.
 * @param {Array<{id?: number, url?: string, title?: string, pinned?: boolean}>} tabs
 * @param {{ rules?: unknown, groupUnmatchedByDomain?: boolean }} [settings]
 * @returns {Array<{ title: string, color: string, tabIds: number[] }>}
 */
export function planTabGroups(tabs, settings = {}) {
  if (!Array.isArray(tabs) || tabs.length === 0) {
    return [];
  }

  const { rules = [], groupUnmatchedByDomain = true } = settings;
  const compiledRules = compileRules(rules);
  const planned = new Map();

  for (const tab of tabs) {
    if (!tab || tab.id == null || tab.pinned || !tab.url) {
      continue;
    }

    const hostname = extractWebHostname(tab.url);
    if (!hostname) {
      continue;
    }

    const matchedRule = matchTabToRule(hostname, tab.title || '', compiledRules);
    let title;
    let color;
    let isRuleMatch;

    if (matchedRule) {
      title = matchedRule.name;
      color = matchedRule.color;
      isRuleMatch = true;
    } else if (groupUnmatchedByDomain) {
      title = getFallbackDomain(hostname);
      color = DEFAULT_FALLBACK_COLOR;
      isRuleMatch = false;
    } else {
      continue;
    }

    let entry = planned.get(title);
    if (!entry) {
      entry = { title, color, tabIds: [], fromRule: isRuleMatch };
      planned.set(title, entry);
    } else if (!entry.fromRule && isRuleMatch) {
      // Upgrade fallback group color if an explicit rule uses the same group name.
      entry.color = color;
      entry.fromRule = true;
    }

    entry.tabIds.push(tab.id);
  }

  return Array.from(planned.values(), ({ title, color, tabIds }) => ({
    title,
    color,
    tabIds,
  }));
}

/**
 * Loads rules and fallback preference from chrome.storage.sync with defaults.
 * @param {{ get: (keys: string[]) => Promise<Record<string, unknown>> }} [storage]
 * @returns {Promise<{ rules: Array<object>, groupUnmatchedByDomain: boolean }>}
 */
export async function loadSettings(storage = chrome.storage.sync) {
  const stored = await storage.get([...STORAGE_KEYS]);

  return {
    rules: Array.isArray(stored.rules) ? stored.rules : cloneDefaultRules(),
    groupUnmatchedByDomain:
      typeof stored.groupUnmatchedByDomain === 'boolean'
        ? stored.groupUnmatchedByDomain
        : true,
  };
}
