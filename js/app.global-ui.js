import { getSettings, saveSettings } from './storage.js?v=3.4.14';

const APP_VERSION = 'v3.4.14';
const THEME_KEY = 'y4.theme';
const THEME_PATHS = {
  default: '',
  ocean: './css/theme-ocean.css?v=3.4.14',
  paper: './css/theme-paper.css?v=3.4.14',
  split: './css/theme-split.css?v=3.4.14',
  arcade: './css/theme-arcade.css?v=3.4.14',
  zen210: './css/theme-zen210.css?v=3.4.14'
};

function currentPage() {
  return document.body.dataset.page;
}

function applyTheme(themeName) {
  const theme = THEME_PATHS[themeName] != null ? themeName : 'default';
  localStorage.setItem(THEME_KEY, theme);

  const themeLink = document.getElementById('themeStylesheet');
  if (themeLink) {
    themeLink.setAttribute('href', THEME_PATHS[theme]);
  }

  const selector = document.getElementById('themeSelect');
  if (selector && selector.value !== theme) selector.value = theme;
}

function applySettingsToPage(settings) {
  document.documentElement.style.setProperty('--passage-font-scale', String(settings.passageFontScale || 1));
  document.documentElement.style.setProperty('--input-font-scale', String(settings.inputFontScale || 1));
  document.body.classList.toggle('hide-marks', Boolean(settings.hideMarks));
  document.body.classList.toggle('gentle-mode', Boolean(settings.gentleMode));
}

function initGlobalUI() {
  const versionInfo = document.getElementById('versionInfo');
  if (versionInfo) versionInfo.textContent = `NFER Reading Builder ${APP_VERSION}`;

  const selectedTheme = localStorage.getItem(THEME_KEY) || 'default';
  applyTheme(selectedTheme);

  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
  }

  let settings = getSettings();
  applySettingsToPage(settings);

  const settingsToggleBtn = document.getElementById('settingsToggleBtn');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const settingsPanel = document.getElementById('settingsPanel');

  const openCloseSettings = (nextHidden) => {
    if (settingsPanel) settingsPanel.hidden = nextHidden;
  };

  if (settingsToggleBtn && settingsPanel) {
    settingsToggleBtn.addEventListener('click', () => {
      openCloseSettings(!settingsPanel.hidden);
    });
  }

  if (settingsCloseBtn && settingsPanel) {
    settingsCloseBtn.addEventListener('click', () => openCloseSettings(true));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settingsPanel && !settingsPanel.hidden) {
      openCloseSettings(true);
    }
  });

  const passageFontRange = document.getElementById('passageFontRange');
  const inputFontRange = document.getElementById('inputFontRange');
  const hideMarksToggle = document.getElementById('hideMarksToggle');
  const gentleModeToggle = document.getElementById('gentleModeToggle');

  if (passageFontRange) passageFontRange.value = String(settings.passageFontScale || 1);
  if (inputFontRange) inputFontRange.value = String(settings.inputFontScale || 1);
  if (hideMarksToggle) hideMarksToggle.checked = Boolean(settings.hideMarks);
  if (gentleModeToggle) gentleModeToggle.checked = Boolean(settings.gentleMode);

  const syncSettings = () => {
    settings = {
      passageFontScale: Number(passageFontRange?.value || 1),
      inputFontScale: Number(inputFontRange?.value || 1),
      hideMarks: Boolean(hideMarksToggle?.checked),
      gentleMode: Boolean(gentleModeToggle?.checked)
    };
    saveSettings(settings);
    applySettingsToPage(settings);
    document.dispatchEvent(new CustomEvent('settings:changed', { detail: settings }));
  };

  [passageFontRange, inputFontRange].forEach((el) => el && el.addEventListener('input', syncSettings));
  [hideMarksToggle, gentleModeToggle].forEach((el) => el && el.addEventListener('change', syncSettings));

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => syncSettings());
  }
}

export { currentPage, initGlobalUI };
