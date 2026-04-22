import { electronBridge } from './electron-bridge';
import { useUiState } from '../ui-state';

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
  }
};
