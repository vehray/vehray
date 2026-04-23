import { electronBridge } from './electronBridge';
import { useUiState } from '../state/uiState';
import { i18n } from '../shared/i18n';

type UiPreferences = {
  theme: 'dark' | 'light';
  locale: 'zh-CN' | 'zh-TW' | 'en-US';
};

const SETTINGS_KEY = 'uiPreferences';
let ldfDraftCounter = 0;

const getNextLdfDocName = (titles: string[]) => {
  const used = new Set<number>();
  for (const title of titles) {
    const matched = title.match(/^ldf-doc-(\d+)\.ldf$/i);
    if (!matched) continue;
    used.add(Number.parseInt(matched[1], 10));
  }

  let index = 1;
  while (used.has(index)) index += 1;
  return `ldf-doc-${index}.ldf`;
};

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

  async openFileToHistory(preselectedPath?: string) {
    const filePath = preselectedPath ?? await electronBridge.openFile();
    if (!filePath) return null;

    const { addHistoryFile, upsertTab, switchToTab } = useUiState();
    addHistoryFile(filePath);
    const content = await electronBridge.readFile(filePath);
    const fileName = filePath.match(/[^\\/]+$/)?.[0] ?? filePath;
    const tabId = `lin-ldf-editor-file:${encodeURIComponent(filePath)}`;
    upsertTab({
      id: tabId,
      title: fileName,
      content: content ?? ''
    });
    switchToTab(tabId);
    return filePath;
  },

  openLinLdfEditor(standard?: string) {
    const { upsertTab, switchToTab, state } = useUiState();
    const tabId = `lin-ldf-editor-draft-${Date.now()}-${ldfDraftCounter++}`;
    const initialContent = standard
      ? `/* ${standard} */\n\n`
      : '';
    upsertTab({
      id: tabId,
      title: getNextLdfDocName(state.tabs.map((tab) => tab.title)),
      content: initialContent
    });
    switchToTab(tabId);
  },

  async createLdfFile(standard?: string) {
    this.openLinLdfEditor(standard);
    return { success: true as const, reason: null, filePath: null };
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
    const locale = saved.locale === 'en-US' || saved.locale === 'zh-CN' || saved.locale === 'zh-TW' ? saved.locale : state.locale;
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
