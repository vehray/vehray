import { reactive, readonly } from 'vue';
export type IconSizeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  expanded: boolean;
  size?: number;
  modifiedAt?: number;
  children?: FileTreeNode[];
}

export interface ExplorerSelection {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: number;
}

export interface InspectorPropertyField {
  label: string;
  value: string;
}

export interface InspectorPropertyGroup {
  title: string;
  fields: InspectorPropertyField[];
}

export interface InspectorSelection {
  kind: 'linbus';
  title: string;
  groups: InspectorPropertyGroup[];
}

export interface UiTabItem {
  id: string;
  title: string;
  content: string;
  dirty?: boolean;
}

export interface HistoryFileItem {
  name: string;
  path: string;
}

interface UiState {
  activeFolderPath: string | null;
  activeFolderName: string | null;
  fileTree: FileTreeNode[];
  selectedExplorerEntry: ExplorerSelection | null;
  selectedInspectorEntry: InspectorSelection | null;
  activeTab: string;
  rightPanelVisible: boolean;
  tabs: UiTabItem[];
  historyFiles: HistoryFileItem[];
  theme: 'dark' | 'light';
  locale: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR';
  showHomeOnLaunch: boolean;
  accentColor: 'default' | 'blue' | 'green' | 'purple' | 'orange';
  iconSize: IconSizeLevel;
  windowMode: 'normal' | 'single-tab';
}

const state = reactive<UiState>({
  activeFolderPath: null,
  activeFolderName: null,
  fileTree: [],
  selectedExplorerEntry: null,
  selectedInspectorEntry: null,
  activeTab: 'home',
  rightPanelVisible: false,
  tabs: [{ id: 'home', title: '主页', content: 'home-content', dirty: false }],
  historyFiles: [],
  theme: 'dark',
  locale: 'zh-CN',
  showHomeOnLaunch: true,
  accentColor: 'default',
  iconSize: 4,
  windowMode: 'normal'
});

const resetState = () => {
  state.activeFolderPath = null;
  state.activeFolderName = null;
  state.fileTree = [];
  state.selectedExplorerEntry = null;
  state.selectedInspectorEntry = null;
  state.activeTab = 'home';
  state.rightPanelVisible = false;
  state.tabs = [{ id: 'home', title: '主页', content: 'home-content', dirty: false }];
  state.historyFiles = [];
  state.theme = 'dark';
  state.locale = 'zh-CN';
  state.showHomeOnLaunch = true;
  state.accentColor = 'default';
  state.iconSize = 4;
  state.windowMode = 'normal';
};

export function useUiState() {
  const setActiveFolder = (folderPath: string) => {
    const parts = folderPath.split(/[\\/]/).filter(Boolean);
    state.activeFolderPath = folderPath;
    state.activeFolderName = parts.at(-1) ?? folderPath;
  };

  const setFileTree = (nodes: FileTreeNode[]) => {
    state.fileTree = nodes;
  };

  const clearActiveFolder = () => {
    state.activeFolderPath = null;
    state.activeFolderName = null;
    state.fileTree = [];
    state.selectedExplorerEntry = null;
  };

  const setSelectedExplorerEntry = (entry: ExplorerSelection | null) => {
    state.selectedExplorerEntry = entry;
    if (entry) {
      state.selectedInspectorEntry = null;
    }
  };

  const setSelectedInspectorEntry = (entry: InspectorSelection | null) => {
    state.selectedInspectorEntry = entry;
    if (entry) {
      state.selectedExplorerEntry = null;
    }
  };

  const setActiveTab = (tabId: string) => {
    state.activeTab = tabId;
  };

  const setRightPanelVisible = (visible: boolean) => {
    state.rightPanelVisible = visible;
  };

  const setTheme = (theme: UiState['theme']) => {
    state.theme = theme;
  };

  const setLocale = (locale: UiState['locale']) => {
    state.locale = locale;
  };

  const setShowHomeOnLaunch = (enabled: boolean) => {
    state.showHomeOnLaunch = enabled;
  };

  const setAccentColor = (accentColor: UiState['accentColor']) => {
    state.accentColor = accentColor;
  };

  const setIconSize = (iconSize: UiState['iconSize']) => {
    state.iconSize = iconSize;
  };

  const setWindowMode = (mode: UiState['windowMode']) => {
    state.windowMode = mode;
  };

  const ensureHomeTab = () => {
    if (!state.tabs.some((tab) => tab.id === 'home')) {
      state.tabs.push({ id: 'home', title: '主页', content: 'home-content', dirty: false });
    }
  };

  const upsertTab = (tab: UiTabItem) => {
    const index = state.tabs.findIndex((item) => item.id === tab.id);
    if (index === -1) {
      state.tabs.push(tab);
    } else {
      state.tabs[index] = { ...state.tabs[index], ...tab };
    }
  };

  const switchToTab = (tabId: string) => {
    if (state.tabs.some((tab) => tab.id === tabId)) {
      state.activeTab = tabId;
    }
  };

  const closeTab = (tabId: string) => {
    const index = state.tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;

    if (state.tabs.length === 1) {
      state.tabs = [];
      state.activeTab = '';
      return;
    }

    if (state.activeTab === tabId) {
      const fallbackIndex = index > 0 ? index - 1 : 1;
      state.activeTab = state.tabs[fallbackIndex]?.id ?? '';
    }

    state.tabs = state.tabs.filter((tab) => tab.id !== tabId);
  };

  const reorderTabs = (fromTabId: string, toTabId: string, position: 'before' | 'after' = 'before') => {
    if (fromTabId === toTabId) return;
    const fromIndex = state.tabs.findIndex((tab) => tab.id === fromTabId);
    const toIndex = state.tabs.findIndex((tab) => tab.id === toTabId);
    if (fromIndex === -1 || toIndex === -1) return;

    const updated = [...state.tabs];
    const [moved] = updated.splice(fromIndex, 1);
    let insertIndex = toIndex;
    if (fromIndex < toIndex) {
      insertIndex = position === 'after' ? toIndex : toIndex - 1;
    } else if (fromIndex > toIndex) {
      insertIndex = position === 'after' ? toIndex + 1 : toIndex;
    }
    updated.splice(Math.max(0, insertIndex), 0, moved);
    state.tabs = updated;
  };

  const addHistoryFile = (filePath: string) => {
    const fileName = filePath.match(/[^\\/]+$/)?.[0] ?? filePath;
    const existingIndex = state.historyFiles.findIndex((file) => file.path === filePath);
    if (existingIndex > -1) state.historyFiles.splice(existingIndex, 1);

    state.historyFiles.unshift({ name: fileName, path: filePath });
    if (state.historyFiles.length > 10) {
      state.historyFiles = state.historyFiles.slice(0, 10);
    }
  };

  return {
    state: readonly(state),
    setActiveFolder,
    setFileTree,
    clearActiveFolder,
    setSelectedExplorerEntry,
    setSelectedInspectorEntry,
    setActiveTab,
    setRightPanelVisible,
    setTheme,
    setLocale,
    setShowHomeOnLaunch,
    setAccentColor,
    setIconSize,
    setWindowMode,
    ensureHomeTab,
    upsertTab,
    switchToTab,
    closeTab,
    reorderTabs,
    addHistoryFile
  };
}

export function resetUiStateForTest() {
  resetState();
}
