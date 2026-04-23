import { reactive, readonly } from 'vue';

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

export interface UiTabItem {
  id: string;
  title: string;
  content: string;
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
  activeTab: string;
  rightPanelVisible: boolean;
  tabs: UiTabItem[];
  historyFiles: HistoryFileItem[];
  theme: 'dark' | 'light';
  locale: 'zh-CN' | 'zh-TW' | 'en-US';
}

const state = reactive<UiState>({
  activeFolderPath: null,
  activeFolderName: null,
  fileTree: [],
  selectedExplorerEntry: null,
  activeTab: 'home',
  rightPanelVisible: false,
  tabs: [{ id: 'home', title: '主页', content: 'home-content' }],
  historyFiles: [],
  theme: 'dark',
  locale: 'zh-CN'
});

const resetState = () => {
  state.activeFolderPath = null;
  state.activeFolderName = null;
  state.fileTree = [];
  state.selectedExplorerEntry = null;
  state.activeTab = 'home';
  state.rightPanelVisible = false;
  state.tabs = [{ id: 'home', title: '主页', content: 'home-content' }];
  state.historyFiles = [];
  state.theme = 'dark';
  state.locale = 'zh-CN';
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

  const ensureHomeTab = () => {
    if (!state.tabs.some((tab) => tab.id === 'home')) {
      state.tabs.push({ id: 'home', title: '主页', content: 'home-content' });
    }
  };

  const upsertTab = (tab: UiTabItem) => {
    const index = state.tabs.findIndex((item) => item.id === tab.id);
    if (index === -1) {
      state.tabs.push(tab);
    } else {
      state.tabs[index] = tab;
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
    setActiveTab,
    setRightPanelVisible,
    setTheme,
    setLocale,
    ensureHomeTab,
    upsertTab,
    switchToTab,
    closeTab,
    addHistoryFile
  };
}

export function resetUiStateForTest() {
  resetState();
}
