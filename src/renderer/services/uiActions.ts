import { electronBridge } from './electronBridge';
import { useUiState } from '../state/uiState';
import type { IconSizeLevel } from '../state/uiState';
import { i18n } from '../shared/i18n';
import { createDefaultLdf13Text, deserializeLdf13, normalizeLdf13, validateLdf13Document } from '../features/lin-ldf/services/ldf13Codec';

type UiPreferences = {
  theme: 'dark' | 'light';
  locale: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR';
  showHomeOnLaunch: boolean;
  accentColor: 'default' | 'blue' | 'green' | 'purple' | 'orange';
  iconSize: IconSizeLevel;
};

const SETTINGS_KEY = 'uiPreferences';
let ldfDraftCounter = 0;
const ACCENT_COLOR_MAP: Record<UiPreferences['accentColor'], string> = {
  default: '',
  blue: 'rgba(0, 120, 212, 0.15)',
  green: 'rgba(34, 197, 94, 0.18)',
  purple: 'rgba(168, 85, 247, 0.18)',
  orange: 'rgba(249, 115, 22, 0.18)'
};

const getNextLdfDocName = (titles: string[]) => {
  const used = new Set<number>();
  for (const title of titles) {
    const matched = title.match(/^ldf-doc-(\d+)\.ldf$/i);
    if (!matched?.[1]) continue;
    used.add(Number.parseInt(matched[1], 10));
  }

  let index = 1;
  while (used.has(index)) index += 1;
  return `ldf-doc-${index}.ldf`;
};

const toFileName = (filePath: string) => filePath.match(/[^\\/]+$/)?.[0] ?? filePath;
const tabIdToFilePath = (tabId: string) => {
  if (!tabId.startsWith('lin-ldf-editor-file:')) return null;
  try {
    return decodeURIComponent(tabId.slice('lin-ldf-editor-file:'.length));
  } catch {
    return null;
  }
};

const resolveInitialLdfContent = (standard?: string) => {
  const normalized = (standard || '').trim().toLowerCase();
  if (normalized === 'ldf 1.3') {
    return createDefaultLdf13Text();
  }
  return standard ? `/* ${standard} */\n\n` : '';
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

const applyAccentColor = (accentColor: UiPreferences['accentColor']) => {
  const value = ACCENT_COLOR_MAP[accentColor];
  if (!value) {
    document.documentElement.style.removeProperty('--app-accent');
    return;
  }
  document.documentElement.style.setProperty('--app-accent', value);
};

const iconLevelToPixels = (level: IconSizeLevel) => {
  const table: Record<IconSizeLevel, number> = { 1: 11, 2: 12, 3: 13, 4: 14, 5: 15, 6: 17, 7: 19, 8: 21, 9: 23, 10: 26 };
  return table[level];
};

const applyIconSize = (iconSize: UiPreferences['iconSize']) => {
  const iconPx = iconLevelToPixels(iconSize);
  const hitPx = iconPx + 10;
  const sidebarPx = hitPx + 9;
  const uiFontPx = Math.max(11, Math.min(15, Math.round(iconPx * 0.88)));
  const rowPx = iconPx + 13;
  const headerPx = Math.max(35, rowPx + 9);
  const logoPx = Math.max(16, Math.round(iconPx * 1.15));
  const tabbarPx = Math.max(34, rowPx + 8);
  const statusPx = Math.max(24, rowPx - 2);
  document.documentElement.style.setProperty('--app-icon-size', `${iconPx}px`);
  document.documentElement.style.setProperty('--app-icon-hit-size', `${hitPx}px`);
  document.documentElement.style.setProperty('--app-sidebar-width', `${sidebarPx}px`);
  document.documentElement.style.setProperty('--app-ui-font-size', `${uiFontPx}px`);
  document.documentElement.style.setProperty('--app-ui-row-height', `${rowPx}px`);
  document.documentElement.style.setProperty('--app-ui-control-height', `${hitPx}px`);
  document.documentElement.style.setProperty('--app-header-height', `${headerPx}px`);
  document.documentElement.style.setProperty('--app-logo-size', `${logoPx}px`);
  document.documentElement.style.setProperty('--app-tabbar-height', `${tabbarPx}px`);
  document.documentElement.style.setProperty('--app-statusbar-height', `${statusPx}px`);
};

const normalizeIconSize = (value: unknown, fallback: IconSizeLevel): IconSizeLevel => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10) return value as IconSizeLevel;
  if (typeof value === 'string') {
    if (/^level[1-6]$/.test(value)) return Number(value.slice('level'.length)) as IconSizeLevel;
    if (value === 'small') return 2;
    if (value === 'medium') return 4;
    if (value === 'large') return 6;
  }
  return fallback;
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
      content: content ?? '',
      dirty: false
    });
    switchToTab(tabId);
    return filePath;
  },

  openLinLdfEditor(standard?: string) {
    const { upsertTab, switchToTab, state } = useUiState();
    const tabId = `lin-ldf-editor-draft-${Date.now()}-${ldfDraftCounter++}`;
    const initialContent = resolveInitialLdfContent(standard);
    upsertTab({
      id: tabId,
      title: getNextLdfDocName(state.tabs.map((tab) => tab.title)),
      content: initialContent,
      dirty: true
    });
    switchToTab(tabId);
  },

  openSettings() {
    const { upsertTab, switchToTab } = useUiState();
    upsertTab({
      id: 'app-settings',
      title: '设置',
      content: 'settings-content',
      dirty: false
    });
    switchToTab('app-settings');
  },

  async createLdfFile(standard?: string) {
    this.openLinLdfEditor(standard);
    return { success: true as const, reason: null, filePath: null };
  },

  async saveTabById(tabId: string) {
    const { state, upsertTab, switchToTab, closeTab } = useUiState();
    const activeTab = state.tabs.find((tab) => tab.id === tabId);
    if (!activeTab || activeTab.id === 'home') {
      return { success: false as const, reason: 'no-active-tab' as const };
    }

    const existingPath = tabIdToFilePath(activeTab.id);
    let selectedPath = existingPath;
    if (!selectedPath) {
      const defaultSavePath = activeTab.title ?? 'ldf-doc-1.ldf';
      selectedPath = await electronBridge.saveFile(defaultSavePath);
      if (!selectedPath) return { success: false as const, reason: 'cancelled' as const };
    }
    const rawContent = activeTab.content ?? '';
    let serializedContent = rawContent;
    if (activeTab.id.startsWith('lin-ldf-editor')) {
      try {
        const doc = deserializeLdf13(rawContent);
        const issues = validateLdf13Document(doc);
        const errors = issues.filter((item) => item.level === 'error');
        if (errors.length > 0) {
          return { success: false as const, reason: 'validation-failed' as const, details: errors.map((x) => x.message) };
        }
        serializedContent = normalizeLdf13(rawContent);
      } catch {
        // 序列化失败时回退保存原始文本，避免用户内容无法落盘
        serializedContent = rawContent;
      }
    }

    const success = await electronBridge.writeFile(selectedPath, serializedContent);
    if (!success) return { success: false as const, reason: 'write-failed' as const };

    const nextTabId = `lin-ldf-editor-file:${encodeURIComponent(selectedPath)}`;
    upsertTab({
      id: nextTabId,
      title: toFileName(selectedPath),
      content: serializedContent,
      dirty: false
    });
    switchToTab(nextTabId);
    if (activeTab.id !== nextTabId && activeTab.id.startsWith('lin-ldf-editor-draft-')) {
      closeTab(activeTab.id);
    }
    return { success: true as const, filePath: selectedPath };
  },

  async saveActiveTab() {
    const { state } = useUiState();
    return this.saveTabById(state.activeTab);
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
    const { state, setTheme, setLocale, setShowHomeOnLaunch, setAccentColor, setIconSize } = useUiState();
    const settings = await electronBridge.readSettings<Record<string, unknown>>();
    const saved = (settings?.[SETTINGS_KEY] as Partial<UiPreferences> | undefined) ?? {};
    const theme = saved.theme === 'dark' || saved.theme === 'light' ? saved.theme : state.theme;
    const locale = saved.locale === 'en-US'
      || saved.locale === 'zh-CN'
      || saved.locale === 'zh-TW'
      || saved.locale === 'ja-JP'
      || saved.locale === 'ko-KR'
      ? saved.locale
      : state.locale;
    const showHomeOnLaunch = typeof saved.showHomeOnLaunch === 'boolean' ? saved.showHomeOnLaunch : state.showHomeOnLaunch;
    const accentColor = saved.accentColor === 'blue'
      || saved.accentColor === 'green'
      || saved.accentColor === 'purple'
      || saved.accentColor === 'orange'
      || saved.accentColor === 'default'
      ? saved.accentColor
      : state.accentColor;
    const iconSize = normalizeIconSize(saved.iconSize, state.iconSize);
    setTheme(theme);
    setLocale(locale);
    setShowHomeOnLaunch(showHomeOnLaunch);
    setAccentColor(accentColor);
    setIconSize(iconSize);
    applyTheme(theme);
    applyLocale(locale);
    applyAccentColor(accentColor);
    applyIconSize(iconSize);
  },

  async setTheme(theme: UiPreferences['theme']) {
    const { state, setTheme } = useUiState();
    setTheme(theme);
    applyTheme(theme);
    await persistPreferences({
      theme: state.theme,
      locale: state.locale,
      showHomeOnLaunch: state.showHomeOnLaunch,
      accentColor: state.accentColor,
      iconSize: state.iconSize
    });
  },

  async setLocale(locale: UiPreferences['locale']) {
    const { state, setLocale } = useUiState();
    setLocale(locale);
    applyLocale(locale);
    await persistPreferences({
      theme: state.theme,
      locale: state.locale,
      showHomeOnLaunch: state.showHomeOnLaunch,
      accentColor: state.accentColor,
      iconSize: state.iconSize
    });
  },

  async setShowHomeOnLaunch(enabled: boolean) {
    const { state, setShowHomeOnLaunch, ensureHomeTab, closeTab, switchToTab } = useUiState();
    setShowHomeOnLaunch(enabled);
    if (enabled) {
      ensureHomeTab();
    } else if (state.tabs.some((tab) => tab.id === 'home')) {
      const fallback = state.tabs.find((tab) => tab.id !== 'home')?.id;
      closeTab('home');
      if (fallback) switchToTab(fallback);
    }
    await persistPreferences({
      theme: state.theme,
      locale: state.locale,
      showHomeOnLaunch: state.showHomeOnLaunch,
      accentColor: state.accentColor,
      iconSize: state.iconSize
    });
  },

  async setAccentColor(accentColor: UiPreferences['accentColor']) {
    const { state, setAccentColor } = useUiState();
    setAccentColor(accentColor);
    applyAccentColor(accentColor);
    await persistPreferences({
      theme: state.theme,
      locale: state.locale,
      showHomeOnLaunch: state.showHomeOnLaunch,
      accentColor: state.accentColor,
      iconSize: state.iconSize
    });
  },

  async setIconSize(iconSize: UiPreferences['iconSize'], persist = true) {
    const { state, setIconSize } = useUiState();
    setIconSize(iconSize);
    applyIconSize(iconSize);
    if (!persist) return;
    await persistPreferences({
      theme: state.theme,
      locale: state.locale,
      showHomeOnLaunch: state.showHomeOnLaunch,
      accentColor: state.accentColor,
      iconSize: state.iconSize
    });
  }
};
