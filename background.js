import {
  STORAGE_KEYS,
  cloneDefaultRules,
  loadSettings,
  planTabGroups,
} from './shared.js';

const LOCK_KEY = 'groupingLockAt';
const LOCK_TTL_MS = 10_000;

/**
 * Acquires a short-lived session storage lock so rapid icon clicks cannot overlap.
 * @returns {Promise<boolean>}
 */
async function acquireGroupingLock() {
  if (!chrome.storage?.session) {
    return true;
  }

  try {
    const now = Date.now();
    const { [LOCK_KEY]: lockAt } = await chrome.storage.session.get(LOCK_KEY);
    if (typeof lockAt === 'number' && now - lockAt < LOCK_TTL_MS) {
      return false;
    }

    await chrome.storage.session.set({ [LOCK_KEY]: now });
    return true;
  } catch (err) {
    console.warn('RuleTabGrouper: Failed to acquire grouping lock:', err);
    return true;
  }
}

/**
 * Releases the grouping lock in session storage.
 * @returns {Promise<void>}
 */
async function releaseGroupingLock() {
  if (!chrome.storage?.session) {
    return;
  }

  try {
    await chrome.storage.session.remove(LOCK_KEY);
  } catch (err) {
    console.warn('RuleTabGrouper: Failed to release grouping lock:', err);
  }
}

/**
 * Groups open tabs in the active window according to stored rules and fallback preferences.
 * @param {chrome.tabs.Tab} [activeTab]
 * @returns {Promise<void>}
 */
export async function groupCurrentWindowTabs(activeTab) {
  const locked = await acquireGroupingLock();
  if (!locked) {
    return;
  }

  try {
    const { rules, groupUnmatchedByDomain } = await loadSettings();
    const tabs = await chrome.tabs.query({ currentWindow: true });

    const windowId =
      typeof activeTab?.windowId === 'number'
        ? activeTab.windowId
        : tabs[0]?.windowId;

    if (windowId == null || tabs.length === 0) {
      return;
    }

    const plans = planTabGroups(tabs, { rules, groupUnmatchedByDomain });
    if (plans.length === 0) {
      return;
    }

    const existingGroups = await chrome.tabGroups.query({ windowId });
    const existingByTitle = new Map();
    for (const group of existingGroups) {
      if (group.title && !existingByTitle.has(group.title)) {
        existingByTitle.set(group.title, group);
      }
    }

    const tabGroupById = new Map(tabs.map((tab) => [tab.id, tab.groupId]));

    for (const plan of plans) {
      if (plan.tabIds.length === 0) {
        continue;
      }

      try {
        const existing = existingByTitle.get(plan.title);

        if (existing) {
          const tabsToMove = plan.tabIds.filter(
            (id) => tabGroupById.get(id) !== existing.id
          );

          if (tabsToMove.length > 0) {
            await chrome.tabs.group({
              groupId: existing.id,
              tabIds: tabsToMove,
            });
          }

          if (existing.title !== plan.title || existing.color !== plan.color) {
            await chrome.tabGroups.update(existing.id, {
              title: plan.title,
              color: plan.color,
            });
          }
        } else {
          const groupId = await chrome.tabs.group({
            tabIds: plan.tabIds,
            createProperties: { windowId },
          });

          await chrome.tabGroups.update(groupId, {
            title: plan.title,
            color: plan.color,
          });

          existingByTitle.set(plan.title, {
            id: groupId,
            title: plan.title,
            color: plan.color,
          });
        }
      } catch (err) {
        console.warn(
          `RuleTabGrouper: Failed to apply group "${plan.title}":`,
          err
        );
      }
    }
  } finally {
    await releaseGroupingLock();
  }
}

let pendingOperation = Promise.resolve();

/**
 * Serializes tab-grouping operations within the current service worker turn so
 * simultaneous tab events do not race and create duplicate groups.
 * @param {() => Promise<void>} task
 * @returns {Promise<void>}
 */
function runSerialized(task) {
  const next = (async () => {
    try {
      await pendingOperation;
    } catch {
      // Previous operation error was already handled.
    }
    await task();
  })();
  pendingOperation = next;
  return next;
}

/**
 * Groups a single newly created or updated tab according to stored rules.
 * @param {chrome.tabs.Tab} tab
 * @returns {Promise<void>}
 */
export async function groupSingleTab(tab) {
  if (!tab || tab.id == null || tab.pinned || tab.windowId == null || !tab.url) {
    return;
  }

  await runSerialized(async () => {
    const { rules, groupUnmatchedByDomain, autoGroupTabs } = await loadSettings();
    if (!autoGroupTabs) {
      return;
    }

    const plans = planTabGroups([tab], { rules, groupUnmatchedByDomain });
    if (plans.length === 0) {
      return;
    }

    const plan = plans[0];

    try {
      const existingGroups = await chrome.tabGroups.query({
        windowId: tab.windowId,
      });
      const existing = existingGroups.find((g) => g.title === plan.title);

      if (existing) {
        if (tab.groupId !== existing.id) {
          await chrome.tabs.group({
            groupId: existing.id,
            tabIds: [tab.id],
          });
        }

        if (existing.title !== plan.title || existing.color !== plan.color) {
          await chrome.tabGroups.update(existing.id, {
            title: plan.title,
            color: plan.color,
          });
        }
      } else {
        const groupId = await chrome.tabs.group({
          tabIds: [tab.id],
          createProperties: { windowId: tab.windowId },
        });

        await chrome.tabGroups.update(groupId, {
          title: plan.title,
          color: plan.color,
        });
      }
    } catch (err) {
      console.warn(
        `RuleTabGrouper: Failed to auto-group tab ${tab.id} into "${plan.title}":`,
        err
      );
    }
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const stored = await chrome.storage.sync.get([...STORAGE_KEYS]);
    const updates = {};

    if (stored.rules === undefined) {
      updates.rules = cloneDefaultRules();
    }

    if (stored.groupUnmatchedByDomain === undefined) {
      updates.groupUnmatchedByDomain = true;
    }

    if (stored.autoGroupTabs === undefined) {
      updates.autoGroupTabs = true;
    }

    if (Object.keys(updates).length > 0) {
      await chrome.storage.sync.set(updates);
    }
  } catch (err) {
    console.error('RuleTabGrouper: Failed to initialize default settings:', err);
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    await groupSingleTab(tab);
  } catch (err) {
    console.error('RuleTabGrouper: Error auto-grouping created tab:', err);
  }
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (!changeInfo.url && !changeInfo.title && changeInfo.status !== 'complete') {
    return;
  }

  try {
    await groupSingleTab(tab);
  } catch (err) {
    console.error('RuleTabGrouper: Error auto-grouping updated tab:', err);
  }
});

chrome.action.onClicked.addListener(async (activeTab) => {
  try {
    await groupCurrentWindowTabs(activeTab);
  } catch (err) {
    console.error('RuleTabGrouper: Error grouping tabs:', err);
  }
});
