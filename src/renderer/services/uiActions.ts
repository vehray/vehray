import { electronBridge } from './electronBridge';
import { useUiState } from '../state/uiState';
import { i18n } from '../shared/i18n';

type UiPreferences = {
  theme: 'dark' | 'light';
  locale: 'zh-CN' | 'en-US';
};

const SETTINGS_KEY = 'uiPreferences';

const applyTheme = (theme: UiPreferences['theme']) => {
  document.documentElement.setAttribute('data-theme', theme);
  if (window.electron?.ipcRenderer?.invoke) {
    void window.electron.ipcRenderer.invoke('window:set-theme', theme);
  }
};

const applyLocale = (locale: UiPreferences['locale']) => {
  i18n.global.locale.value = locale;
};

const persistPreferences = async (preferences: UiPreferences) => {
  const settings = (await electronBridge.readSettings<Record<string, unknown>>()) ?? {};
  await electronBridge.writeSettings({
    ...settings,
    [SETTINGS_KEY]: preferences
  });
};

export const uiActions = {
  async openFolder() {
    const folderPath = await electronBridge.openDirectory();
    if (!folderPath) return null;

    const { setActiveFolder } = useUiState();
    setActiveFolder(folderPath);
    electronBridge.publishFolderOpened(folderPath);
    return folderPath;
  },

  async openProject() {
    return this.openFolder();
  },

  async openFileToHistory() {
    const filePath = await electronBridge.openFile();
    if (!filePath) return null;

    const { addHistoryFile } = useUiState();
    addHistoryFile(filePath);
    return filePath;
  },

  refreshTree() {
    const { state } = useUiState();
    if (!state.activeFolderPath) return;
    electronBridge.publishFolderOpened(state.activeFolderPath);
  },

  toggleRightPanel() {
    const { state, setRightPanelVisible } = useUiState();
    setRightPanelVisible(!state.rightPanelVisible);
  },

  async initPreferences() {
    const { state, setTheme, setLocale } = useUiState();
    const settings = await electronBridge.readSettings<Record<string, unknown>>();
    const saved = (settings?.[SETTINGS_KEY] as Partial<UiPreferences> | undefined) ?? {};
    const theme = saved.theme === 'dark' || saved.theme === 'light' ? saved.theme : state.theme;
    const locale = saved.locale === 'en-US' || saved.locale === 'zh-CN' ? saved.locale : state.locale;
    setTheme(theme);
    setLocale(locale);
    applyTheme(theme);
    applyLocale(locale);
  },

  async setTheme(theme: UiPreferences['theme']) {
    const { state, setTheme } = useUiState();
    setTheme(theme);
    applyTheme(theme);
    await persistPreferences({ theme: state.theme, locale: state.locale });
  },

  async setLocale(locale: UiPreferences['locale']) {
    const { state, setLocale } = useUiState();
    setLocale(locale);
    applyLocale(locale);
    await persistPreferences({ theme: state.theme, locale: state.locale });
  }
};
