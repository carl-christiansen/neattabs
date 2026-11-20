import {
  VALID_COLORS,
  cloneDefaultRules,
  loadSettings,
  sanitizeColor,
  sanitizeHostTitlePosition,
  validateRegexPattern,
} from './shared.js';

let rowIdCounter = 0;
let toastTimer = null;
let lastToastTrigger = null;
const interactedFields = new WeakSet();

const elements = {};

/**
 * Formats a color label (e.g. "blue" -> "Blue").
 * @param {string} color
 * @returns {string}
 */
function formatColorLabel(color) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

/**
 * Updates the persistent save indicator text and visual state.
 * @param {string} text
 * @param {'saved' | 'dirty'} state
 */
function setSaveIndicator(text, state = 'saved') {
  elements.saveIndicator.textContent = text;
  elements.saveIndicator.dataset.state = state;
}

/**
 * Marks the form as having unsaved edits.
 */
function markDirty() {
  setSaveIndicator('Unsaved changes', 'dirty');
}

/**
 * Updates the rule counter badge, empty state notice, and Move Up/Down button states.
 */
function syncRulesMeta() {
  const rows = Array.from(elements.rulesList.querySelectorAll('.rule-row'));
  const count = rows.length;

  elements.ruleCount.textContent = `${count} ${count === 1 ? 'rule' : 'rules'}`;
  elements.emptyState.hidden = count > 0;

  rows.forEach((row, index) => {
    const upBtn = row.querySelector('.move-up-btn');
    const downBtn = row.querySelector('.move-down-btn');
    upBtn.disabled = index === 0;
    downBtn.disabled = index === count - 1;
  });
}

/**
 * Synchronizes ARIA error linkage and visibility on a single input field.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorEl
 * @param {string} message
 * @param {boolean} showError
 */
function applyFieldValidation(input, errorEl, message, showError) {
  input.setCustomValidity(message);

  const visible = Boolean(message) && showError;
  input.classList.toggle('is-invalid', visible);
  input.setAttribute('aria-invalid', visible ? 'true' : 'false');
  errorEl.textContent = visible ? message : '';
  errorEl.classList.toggle('is-visible', visible);

  const errorId = input.dataset.error;
  if (!errorId) {
    return;
  }

  const ids = (input.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== errorId);

  if (visible) {
    ids.push(errorId);
  }

  if (ids.length > 0) {
    input.setAttribute('aria-describedby', ids.join(' '));
  } else {
    input.removeAttribute('aria-describedby');
  }
}

/**
 * Validates all inputs within a rule row.
 * @param {HTMLElement} row
 * @param {{ showErrors?: boolean }} [options]
 * @returns {{ valid: boolean, firstInvalid: HTMLInputElement | null }}
 */
function validateRuleRow(row, { showErrors = false } = {}) {
  const nameInput = row.querySelector('[data-field="name"]');
  const domainInput = row.querySelector('[data-field="domainPattern"]');
  const titleInput = row.querySelector('[data-field="titlePattern"]');
  const hostTitleCheckbox = row.querySelector('[data-field="prependHostToTitle"]');
  const hostStripInput = row.querySelector('[data-field="hostTitleStripPattern"]');

  const nameErrorEl = row.querySelector('[data-error-msg="name"]');
  const domainErrorEl = row.querySelector('[data-error-msg="domainPattern"]');
  const titleErrorEl = row.querySelector('[data-error-msg="titlePattern"]');
  const hostStripErrorEl = row.querySelector('[data-error-msg="hostTitleStripPattern"]');

  const nameValue = nameInput.value.trim();
  const domainResult = validateRegexPattern(domainInput.value);
  const titleResult = validateRegexPattern(titleInput.value);

  const nameMsg = nameValue ? '' : 'Error: Group name is required.';

  let domainMsg = '';
  if (!domainResult.valid) {
    domainMsg = `Error: Invalid regex — ${domainResult.error}`;
  }

  let titleMsg = '';
  if (!titleResult.valid) {
    titleMsg = `Error: Invalid regex — ${titleResult.error}`;
  }

  if (
    domainResult.valid &&
    titleResult.valid &&
    !domainResult.regex &&
    !titleResult.regex
  ) {
    domainMsg = 'Error: Enter a Domain Regex or a Title Regex.';
  }

  let hostStripMsg = '';
  if (hostTitleCheckbox.checked) {
    const hostStripResult = validateRegexPattern(hostStripInput.value);
    if (!hostStripResult.valid) {
      hostStripMsg = `Error: Invalid regex — ${hostStripResult.error}`;
    }
  }

  const showNameError = showErrors || interactedFields.has(nameInput);
  const showDomainError =
    showErrors ||
    interactedFields.has(domainInput) ||
    interactedFields.has(titleInput);
  const showTitleError = showErrors || interactedFields.has(titleInput);
  const showHostStripError =
    hostTitleCheckbox.checked &&
    (showErrors || interactedFields.has(hostStripInput));

  applyFieldValidation(nameInput, nameErrorEl, nameMsg, showNameError);
  applyFieldValidation(domainInput, domainErrorEl, domainMsg, showDomainError);
  applyFieldValidation(titleInput, titleErrorEl, titleMsg, showTitleError);
  applyFieldValidation(
    hostStripInput,
    hostStripErrorEl,
    hostStripMsg,
    showHostStripError
  );

  let firstInvalid = null;
  if (nameMsg) {
    firstInvalid = nameInput;
  } else if (domainMsg) {
    firstInvalid = domainInput;
  } else if (titleMsg) {
    firstInvalid = titleInput;
  } else if (hostStripMsg) {
    firstInvalid = hostStripInput;
  }

  return {
    valid: !nameMsg && !domainMsg && !titleMsg && !hostStripMsg,
    firstInvalid,
  };
}

/**
 * Creates a DOM row for a rule object and attaches event handlers.
 * @param {{ name?: string, color?: string, domainPattern?: string, titlePattern?: string, prependHostToTitle?: boolean, hostTitlePosition?: string, hostTitleStripPattern?: string }} [rule]
 * @returns {HTMLElement}
 */
function createRuleRow(rule = {}) {
  rowIdCounter += 1;
  const suffix = String(rowIdCounter);
  const fragment = elements.ruleRowTemplate.content.cloneNode(true);
  const row = fragment.querySelector('.rule-row');

  const nameInput = row.querySelector('[data-field="name"]');
  const domainInput = row.querySelector('[data-field="domainPattern"]');
  const titleInput = row.querySelector('[data-field="titlePattern"]');
  const colorSelect = row.querySelector('[data-field="color"]');
  const hostTitleCheckbox = row.querySelector('[data-field="prependHostToTitle"]');
  const hostOptionsSection = row.querySelector('[data-section="hostTitleOptions"]');
  const hostPosBeforeRadio = row.querySelector(
    '[data-field="hostTitlePosition"][value="before"]'
  );
  const hostPosAfterRadio = row.querySelector(
    '[data-field="hostTitlePosition"][value="after"]'
  );
  const hostStripInput = row.querySelector('[data-field="hostTitleStripPattern"]');
  const colorDot = row.querySelector('.color-dot');

  const nameLabel = row.querySelector('[data-label="name"]');
  const domainLabel = row.querySelector('[data-label="domainPattern"]');
  const titleLabel = row.querySelector('[data-label="titlePattern"]');
  const colorLabel = row.querySelector('[data-label="color"]');
  const hostTitleLabel = row.querySelector('[data-label="prependHostToTitle"]');
  const hostPosBeforeLabel = row.querySelector(
    '[data-label="hostTitlePositionBefore"]'
  );
  const hostPosAfterLabel = row.querySelector(
    '[data-label="hostTitlePositionAfter"]'
  );
  const hostStripLabel = row.querySelector('[data-label="hostTitleStripPattern"]');
  const hostStripHintEl = row.querySelector('[data-hint="hostTitleStripPattern"]');

  const nameErrorEl = row.querySelector('[data-error-msg="name"]');
  const domainErrorEl = row.querySelector('[data-error-msg="domainPattern"]');
  const titleErrorEl = row.querySelector('[data-error-msg="titlePattern"]');
  const hostStripErrorEl = row.querySelector(
    '[data-error-msg="hostTitleStripPattern"]'
  );

  nameInput.id = `rule-name-${suffix}`;
  nameLabel.htmlFor = nameInput.id;
  nameErrorEl.id = `rule-name-error-${suffix}`;
  nameInput.dataset.error = nameErrorEl.id;
  nameInput.setAttribute('aria-invalid', 'false');

  domainInput.id = `rule-domain-${suffix}`;
  domainLabel.htmlFor = domainInput.id;
  domainErrorEl.id = `rule-domain-error-${suffix}`;
  domainInput.dataset.error = domainErrorEl.id;
  domainInput.setAttribute('aria-invalid', 'false');

  titleInput.id = `rule-title-${suffix}`;
  titleLabel.htmlFor = titleInput.id;
  titleErrorEl.id = `rule-title-error-${suffix}`;
  titleInput.dataset.error = titleErrorEl.id;
  titleInput.setAttribute('aria-invalid', 'false');

  colorSelect.id = `rule-color-${suffix}`;
  colorLabel.htmlFor = colorSelect.id;

  hostTitleCheckbox.id = `rule-host-title-${suffix}`;
  hostTitleLabel.htmlFor = hostTitleCheckbox.id;
  hostOptionsSection.id = `rule-host-options-${suffix}`;
  hostTitleCheckbox.setAttribute('aria-controls', hostOptionsSection.id);

  const radioGroupName = `rule-host-position-${suffix}`;
  hostPosBeforeRadio.id = `rule-host-pos-before-${suffix}`;
  hostPosBeforeRadio.name = radioGroupName;
  hostPosBeforeLabel.htmlFor = hostPosBeforeRadio.id;

  hostPosAfterRadio.id = `rule-host-pos-after-${suffix}`;
  hostPosAfterRadio.name = radioGroupName;
  hostPosAfterLabel.htmlFor = hostPosAfterRadio.id;

  hostStripInput.id = `rule-host-strip-${suffix}`;
  hostStripLabel.htmlFor = hostStripInput.id;
  hostStripHintEl.id = `rule-host-strip-hint-${suffix}`;
  hostStripErrorEl.id = `rule-host-strip-error-${suffix}`;
  hostStripInput.dataset.error = hostStripErrorEl.id;
  hostStripInput.setAttribute('aria-describedby', hostStripHintEl.id);
  hostStripInput.setAttribute('aria-invalid', 'false');

  for (const color of VALID_COLORS) {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = formatColorLabel(color);
    colorSelect.append(option);
  }

  const initialColor = sanitizeColor(rule.color);
  const initialEnabled = Boolean(rule.prependHostToTitle);
  const initialPosition = sanitizeHostTitlePosition(rule.hostTitlePosition);

  nameInput.value = typeof rule.name === 'string' ? rule.name : '';
  domainInput.value = typeof rule.domainPattern === 'string' ? rule.domainPattern : '';
  titleInput.value = typeof rule.titlePattern === 'string' ? rule.titlePattern : '';
  colorSelect.value = initialColor;
  colorDot.dataset.color = initialColor;

  hostTitleCheckbox.checked = initialEnabled;
  hostOptionsSection.hidden = !initialEnabled;
  hostTitleCheckbox.setAttribute('aria-expanded', String(initialEnabled));

  hostPosBeforeRadio.checked = initialPosition === 'before';
  hostPosAfterRadio.checked = initialPosition === 'after';
  hostStripInput.value =
    typeof rule.hostTitleStripPattern === 'string' ? rule.hostTitleStripPattern : '';

  colorSelect.addEventListener('change', () => {
    colorDot.dataset.color = sanitizeColor(colorSelect.value);
    markDirty();
  });

  hostTitleCheckbox.addEventListener('change', () => {
    const enabled = hostTitleCheckbox.checked;
    hostOptionsSection.hidden = !enabled;
    hostTitleCheckbox.setAttribute('aria-expanded', String(enabled));
    validateRuleRow(row);
    markDirty();
  });

  for (const radio of [hostPosBeforeRadio, hostPosAfterRadio]) {
    radio.addEventListener('change', () => {
      markDirty();
    });
  }

  for (const input of [nameInput, domainInput, titleInput, hostStripInput]) {
    input.addEventListener('input', () => {
      markDirty();
      validateRuleRow(row);
    });

    input.addEventListener('blur', () => {
      interactedFields.add(input);
      validateRuleRow(row);
    });
  }

  const upBtn = row.querySelector('.move-up-btn');
  const downBtn = row.querySelector('.move-down-btn');
  const deleteBtn = row.querySelector('.delete-rule-btn');

  upBtn.addEventListener('click', () => {
    const prev = row.previousElementSibling;
    if (!prev) {
      return;
    }
    elements.rulesList.insertBefore(row, prev);
    syncRulesMeta();
    markDirty();
    upBtn.focus();
  });

  downBtn.addEventListener('click', () => {
    const next = row.nextElementSibling;
    if (!next) {
      return;
    }
    elements.rulesList.insertBefore(next, row);
    syncRulesMeta();
    markDirty();
    downBtn.focus();
  });

  deleteBtn.addEventListener('click', () => {
    const nextRow = row.nextElementSibling;
    const prevRow = row.previousElementSibling;
    const focusTarget =
      nextRow?.querySelector('.delete-rule-btn') ||
      prevRow?.querySelector('.delete-rule-btn') ||
      elements.addRuleBtn;

    row.remove();
    syncRulesMeta();
    markDirty();
    focusTarget.focus();
  });

  return row;
}

/**
 * Replaces the rules list in the DOM with the provided rules array.
 * @param {Array<object>} rules
 */
function renderRules(rules) {
  elements.rulesList.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const rule of rules) {
    fragment.append(createRuleRow(rule));
  }
  elements.rulesList.append(fragment);
  syncRulesMeta();
}

/**
 * Extracts rule objects from the current DOM rows.
 * @returns {Array<{name: string, color: string, domainPattern: string, titlePattern: string, prependHostToTitle: boolean, hostTitlePosition: 'before' | 'after', hostTitleStripPattern: string}>}
 */
function collectRulesFromDOM() {
  const rows = elements.rulesList.querySelectorAll('.rule-row');
  return Array.from(rows, (row) => ({
    name: row.querySelector('[data-field="name"]').value.trim(),
    color: sanitizeColor(row.querySelector('[data-field="color"]').value),
    domainPattern: row.querySelector('[data-field="domainPattern"]').value.trim(),
    titlePattern: row.querySelector('[data-field="titlePattern"]').value.trim(),
    prependHostToTitle: row.querySelector('[data-field="prependHostToTitle"]').checked,
    hostTitlePosition: sanitizeHostTitlePosition(
      row.querySelector('[data-field="hostTitlePosition"]:checked')?.value
    ),
    hostTitleStripPattern: row
      .querySelector('[data-field="hostTitleStripPattern"]')
      .value.trim(),
  }));
}

/**
 * Hides the toast popover cleanly across native Popover API and fallback browsers.
 */
function hideToast() {
  clearTimeout(toastTimer);
  toastTimer = null;

  const toast = elements.statusToast;
  if (typeof toast.hidePopover === 'function') {
    try {
      if (toast.matches(':popover-open')) {
        toast.hidePopover();
      }
    } catch {
      toast.classList.remove(':popover-open');
    }
  } else {
    toast.classList.remove(':popover-open');
  }
}

/**
 * Schedules toast auto-dismissal after 3.5 seconds unless focus is inside the toast.
 */
function scheduleToastDismiss() {
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (!elements.statusToast.contains(document.activeElement)) {
      hideToast();
    }
  }, 3500);
}

/**
 * Announces status text to assistive technologies and displays a manual popover toast.
 * @param {string} message
 * @param {{ variant?: 'success' | 'error', triggerEl?: HTMLElement | null }} [options]
 */
function showToast(message, { variant = 'success', triggerEl = null } = {}) {
  const toast = elements.statusToast;
  lastToastTrigger = triggerEl || document.activeElement;

  toast.dataset.variant = variant;
  elements.statusToastText.textContent = message;

  if (typeof document.ariaNotify === 'function') {
    document.ariaNotify(message);
  } else {
    elements.statusLive.textContent = '';
    elements.statusLive.textContent = message;
  }

  if (typeof toast.showPopover === 'function') {
    try {
      if (!toast.matches(':popover-open')) {
        toast.showPopover();
      }
    } catch {
      toast.classList.add(':popover-open');
    }
  } else {
    toast.classList.add(':popover-open');
  }

  scheduleToastDismiss();
}

/**
 * Validates all rules and saves settings to chrome.storage.sync.
 * @param {HTMLElement | null} triggerEl
 */
async function saveSettings(triggerEl) {
  const rows = Array.from(elements.rulesList.querySelectorAll('.rule-row'));
  let firstInvalidInput = null;

  for (const row of rows) {
    const result = validateRuleRow(row, { showErrors: true });
    if (!result.valid && !firstInvalidInput) {
      firstInvalidInput = result.firstInvalid;
    }
  }

  if (firstInvalidInput) {
    firstInvalidInput.focus();
    showToast('Please fix the highlighted rule errors before saving.', {
      variant: 'error',
      triggerEl,
    });
    return;
  }

  const rules = collectRulesFromDOM();
  const groupUnmatchedByDomain = elements.fallbackToggle.checked;
  const autoGroupTabs = elements.autoGroupToggle.checked;

  try {
    await chrome.storage.sync.set({
      rules,
      groupUnmatchedByDomain,
      autoGroupTabs,
    });
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setSaveIndicator(`Saved at ${timestamp}`, 'saved');
    showToast('Settings saved.', { variant: 'success', triggerEl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showToast(`Failed to save settings: ${message}`, {
      variant: 'error',
      triggerEl,
    });
  }
}

/**
 * Restores default rules and fallback settings, then persists them to chrome.storage.sync.
 * @param {HTMLElement | null} triggerEl
 */
async function performResetToDefaults(triggerEl) {
  const defaultRules = cloneDefaultRules();
  const groupUnmatchedByDomain = true;
  const autoGroupTabs = true;

  try {
    await chrome.storage.sync.set({
      rules: defaultRules,
      groupUnmatchedByDomain,
      autoGroupTabs,
    });
    renderRules(defaultRules);
    elements.fallbackToggle.checked = groupUnmatchedByDomain;
    elements.autoGroupToggle.checked = autoGroupTabs;
    setSaveIndicator('Reset to defaults', 'saved');
    showToast('Reset to default rules and saved.', {
      variant: 'success',
      triggerEl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showToast(`Failed to reset settings: ${message}`, {
      variant: 'error',
      triggerEl,
    });
  }
}

/**
 * Initializes the options page DOM references, listeners, and stored settings.
 */
async function initOptionsPage() {
  elements.form = document.getElementById('settings-form');
  elements.autoGroupToggle = document.getElementById('auto-group-toggle');
  elements.fallbackToggle = document.getElementById('fallback-toggle');
  elements.rulesList = document.getElementById('rules-list');
  elements.ruleCount = document.getElementById('rule-count');
  elements.emptyState = document.getElementById('empty-state');
  elements.addRuleBtn = document.getElementById('add-rule-btn');
  elements.resetBtn = document.getElementById('reset-btn');
  elements.saveBtn = document.getElementById('save-btn');
  elements.saveIndicator = document.getElementById('save-indicator');
  elements.ruleRowTemplate = document.getElementById('rule-row-template');
  elements.resetDialog = document.getElementById('reset-dialog');
  elements.resetCancelBtn = document.getElementById('reset-cancel-btn');
  elements.resetConfirmBtn = document.getElementById('reset-confirm-btn');
  elements.statusToast = document.getElementById('status-toast');
  elements.statusToastText = document.getElementById('status-toast-text');
  elements.statusToastClose = document.getElementById('status-toast-close');
  elements.statusLive = document.getElementById('status-live');

  elements.autoGroupToggle.addEventListener('change', () => {
    markDirty();
  });

  elements.fallbackToggle.addEventListener('change', () => {
    markDirty();
  });

  elements.addRuleBtn.addEventListener('click', () => {
    const newRow = createRuleRow({
      name: '',
      color: 'blue',
      domainPattern: '',
      titlePattern: '',
      prependHostToTitle: false,
      hostTitlePosition: 'before',
      hostTitleStripPattern: '',
    });
    elements.rulesList.append(newRow);
    syncRulesMeta();
    markDirty();
    newRow.querySelector('[data-field="name"]').focus();
  });

  elements.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveSettings(elements.saveBtn);
  });

  elements.resetBtn.addEventListener('click', () => {
    if (typeof elements.resetDialog.showModal === 'function') {
      elements.resetDialog.showModal();
    } else {
      void performResetToDefaults(elements.resetBtn);
    }
  });

  elements.resetCancelBtn.addEventListener('click', () => {
    elements.resetDialog.close();
    elements.resetBtn.focus();
  });

  elements.resetConfirmBtn.addEventListener('click', async () => {
    // Close modal before displaying toast so the notification is not hidden behind an inert layer.
    elements.resetDialog.close();
    await performResetToDefaults(elements.resetBtn);
  });

  elements.statusToast.addEventListener('focusin', () => {
    clearTimeout(toastTimer);
    toastTimer = null;
  });

  elements.statusToast.addEventListener('focusout', (event) => {
    const nextFocused = event.relatedTarget;
    if (!nextFocused || !elements.statusToast.contains(nextFocused)) {
      scheduleToastDismiss();
    }
  });

  elements.statusToast.addEventListener('toggle', (event) => {
    if (event.newState === 'closed') {
      clearTimeout(toastTimer);
      toastTimer = null;
      if (
        lastToastTrigger &&
        lastToastTrigger.isConnected &&
        (elements.statusToast.contains(document.activeElement) ||
          document.activeElement === document.body)
      ) {
        lastToastTrigger.focus();
      }
    }
  });

  if (!Object.hasOwn(HTMLElement.prototype, 'popover')) {
    elements.statusToastClose.addEventListener('click', () => {
      hideToast();
      if (lastToastTrigger && lastToastTrigger.isConnected) {
        lastToastTrigger.focus();
      }
    });
  }

  try {
    const settings = await loadSettings();
    elements.autoGroupToggle.checked = settings.autoGroupTabs;
    elements.fallbackToggle.checked = settings.groupUnmatchedByDomain;
    renderRules(settings.rules);
    setSaveIndicator('All changes saved', 'saved');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    renderRules(cloneDefaultRules());
    elements.autoGroupToggle.checked = true;
    elements.fallbackToggle.checked = true;
    showToast(`Could not load stored settings (${message}); showing defaults.`, {
      variant: 'error',
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  void initOptionsPage();
});
