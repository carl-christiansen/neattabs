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

export const VALID_HOST_TITLE_POSITIONS = Object.freeze(['before', 'after']);

export const DEFAULT_HOST_TITLE_POSITION = 'before';

export const STORAGE_KEYS = Object.freeze([
  'rules',
  'groupUnmatchedByDomain',
  'autoGroupTabs',
]);

/**
 * Default grouping rules evaluated in priority order.
 */
export const DEFAULT_RULES = Object.freeze([
  Object.freeze({
    name: 'Work / Tracker',
    color: 'blue',
    domainPattern: 'atlassian\\.net|jira|linear\\.app',
    titlePattern: '',
    prependHostToTitle: false,
    hostTitlePosition: 'before',
    hostTitleStripPattern: '',
  }),
  Object.freeze({
    name: 'Git Repos',
    color: 'green',
    domainPattern: 'github\\.com|gitlab\\.com',
    titlePattern: '',
    prependHostToTitle: false,
    hostTitlePosition: 'before',
    hostTitleStripPattern: '',
  }),
  Object.freeze({
    name: 'Swagger / APIs',
    color: 'yellow',
    domainPattern: 'swagger',
    titlePattern: 'swagger|openapi',
    prependHostToTitle: false,
    hostTitlePosition: 'before',
    hostTitleStripPattern: '',
  }),
  Object.freeze({
    name: 'Local Dev',
    color: 'purple',
    domainPattern: 'localhost|127\\.0\\.0\\.1',
    titlePattern: '',
    prependHostToTitle: false,
    hostTitlePosition: 'before',
    hostTitleStripPattern: '',
  }),
]);

/**
 * Returns mutable shallow copies of the default rules.
 * @returns {Array<{name: string, color: string, domainPattern: string, titlePattern: string, prependHostToTitle: boolean, hostTitlePosition: 'before' | 'after', hostTitleStripPattern: string}>}
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
 * Ensures a host title position is valid, falling back to 'before' otherwise.
 * @param {unknown} position
 * @returns {'before' | 'after'}
 */
export function sanitizeHostTitlePosition(position) {
  return typeof position === 'string' && VALID_HOST_TITLE_POSITIONS.includes(position)
    ? position
    : DEFAULT_HOST_TITLE_POSITION;
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
 * Extracts host (including non-default port) from http/https URLs, stripping leading "www.".
 * @param {unknown} urlString
 * @returns {string | null}
 */
export function extractWebHost(urlString) {
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

  const host = parsed.host.toLowerCase().replace(/^www\./i, '');
  return host || null;
}

/**
 * Extracts host from urlString and optionally removes parts matching a regex pattern.
 * @param {unknown} urlString
 * @param {string | RegExp | null} [stripPatternOrRegex]
 * @returns {string | null}
 */
export function formatHostForTitle(urlString, stripPatternOrRegex = null) {
  const host = extractWebHost(urlString);
  if (!host) {
    return null;
  }

  let stripRegex = null;
  if (stripPatternOrRegex instanceof RegExp) {
    stripRegex = stripPatternOrRegex;
  } else if (typeof stripPatternOrRegex === 'string' && stripPatternOrRegex.trim()) {
    stripRegex = validateRegexPattern(stripPatternOrRegex).regex;
  }

  if (!stripRegex) {
    return host;
  }

  // Construct a fresh global RegExp so repeated calls never share mutable lastIndex state.
  const flags = stripRegex.flags.includes('g')
    ? stripRegex.flags
    : `${stripRegex.flags}g`;
  const globalRegex = new RegExp(stripRegex.source, flags);

  const cleaned = host
    .replace(globalRegex, '')
    .replace(/\.{2,}/g, '.')
    .replace(/\.+(?=:\d+$)/g, '')
    .replace(/^\.+|\.+$/g, '')
    .replace(/:+$/, '')
    .trim();

  return cleaned || null;
}

/**
 * Places or updates a "[host]" tag before or after a tab title without duplicating tags.
 * @param {unknown} currentTitle
 * @param {string} hostLabel
 * @param {'before' | 'after'} [position]
 * @param {string[]} [previousTags]
 * @returns {string}
 */
export function formatTabTitle(
  currentTitle,
  hostLabel,
  position = DEFAULT_HOST_TITLE_POSITION,
  previousTags = []
) {
  let baseTitle = typeof currentTitle === 'string' ? currentTitle : '';
  if (!hostLabel || typeof hostLabel !== 'string') {
    return baseTitle;
  }

  const safePos = sanitizeHostTitlePosition(position);
  const tag = `[${hostLabel}]`;
  const candidates = Array.from(
    new Set(
      [tag, ...(Array.isArray(previousTags) ? previousTags : [])].filter(
        (t) => typeof t === 'string' && t.length > 0
      )
    )
  ).sort((a, b) => b.length - a.length);

  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of candidates) {
      if (baseTitle === candidate) {
        baseTitle = '';
        changed = true;
        break;
      }
      if (baseTitle.startsWith(`${candidate} `)) {
        baseTitle = baseTitle.slice(candidate.length + 1);
        changed = true;
        break;
      }
      if (baseTitle.endsWith(` ${candidate}`)) {
        baseTitle = baseTitle.slice(0, -(candidate.length + 1));
        changed = true;
        break;
      }
    }
  }

  if (!baseTitle) {
    return tag;
  }

  return safePos === 'after' ? `${baseTitle} ${tag}` : `${tag} ${baseTitle}`;
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
 * @returns {Array<{name: string, color: string, domainRegex: RegExp | null, titleRegex: RegExp | null, prependHostToTitle: boolean, hostTitlePosition: 'before' | 'after', hostTitleStripRegex: RegExp | null}>}
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

    const hostTitleStripResult = validateRegexPattern(rule.hostTitleStripPattern);
    const name = typeof rule.name === 'string' ? rule.name.trim() : '';
    compiled.push({
      name: name || 'Untitled Group',
      color: sanitizeColor(rule.color),
      domainRegex: domainResult.regex,
      titleRegex: titleResult.regex,
      prependHostToTitle: Boolean(rule.prependHostToTitle),
      hostTitlePosition: sanitizeHostTitlePosition(rule.hostTitlePosition),
      hostTitleStripRegex: hostTitleStripResult.regex,
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
 * @returns {Array<{ title: string, color: string, tabIds: number[], hostTitleUpdates: Array<{ tabId: number, hostLabel: string, rawHost: string | null, position: 'before' | 'after' }> }>}
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
    let hostTitleUpdate = null;

    if (matchedRule) {
      title = matchedRule.name;
      color = matchedRule.color;
      isRuleMatch = true;
      if (matchedRule.prependHostToTitle) {
        const rawHost = extractWebHost(tab.url);
        const hostLabel = formatHostForTitle(tab.url, matchedRule.hostTitleStripRegex);
        if (hostLabel) {
          hostTitleUpdate = {
            tabId: tab.id,
            hostLabel,
            rawHost,
            position: matchedRule.hostTitlePosition,
          };
        }
      }
    } else if (groupUnmatchedByDomain) {
      title = getFallbackDomain(hostname);
      color = DEFAULT_FALLBACK_COLOR;
      isRuleMatch = false;
    } else {
      continue;
    }

    let entry = planned.get(title);
    if (!entry) {
      entry = {
        title,
        color,
        tabIds: [],
        fromRule: isRuleMatch,
        hostTitleUpdates: [],
      };
      planned.set(title, entry);
    } else if (!entry.fromRule && isRuleMatch) {
      // Upgrade fallback group color if an explicit rule uses the same group name.
      entry.color = color;
      entry.fromRule = true;
    }

    entry.tabIds.push(tab.id);
    if (hostTitleUpdate) {
      entry.hostTitleUpdates.push(hostTitleUpdate);
    }
  }

  return Array.from(
    planned.values(),
    ({ title, color, tabIds, hostTitleUpdates }) => ({
      title,
      color,
      tabIds,
      hostTitleUpdates,
    })
  );
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
    autoGroupTabs:
      typeof stored.autoGroupTabs === 'boolean' ? stored.autoGroupTabs : true,
  };
}
