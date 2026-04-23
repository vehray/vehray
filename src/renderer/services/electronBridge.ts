export interface FsEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

export interface ExplorerEntry extends FsEntry {
  size: number;
  modifiedAt: number;
}

type FolderOpenedCallback = (folderPath: string) => void;
type ExplorerFolderChangedPayload = { folderPath: string; eventType: string; filename: string };
type ExplorerFolderChangedCallback = (payload: ExplorerFolderChangedPayload) => void;
type ExplorerContextTargetType = 'root' | 'file' | 'directory';
type ExplorerContextAction = 'revealInFolder' | 'createFolder';
type ExplorerContextActionPayload = {
  source: 'explorer';
  action: ExplorerContextAction;
  targetPath: string;
  targetType: ExplorerContextTargetType;
};
type ExplorerContextActionCallback = (payload: ExplorerContextActionPayload) => void;

const FOLDER_OPENED_CHANNEL = 'folder-opened';

const hasElectron = () => typeof window !== 'undefined' && !!window.electron;

const hasIpc = () => hasElectron() && !!window.electron.ipcRenderer;
const hasDialog = () => hasElectron() && !!window.electron.dialog;
const hasFs = () => hasElectron() && !!window.electron.fs;
const hasExplorer = () => hasElectron() && !!window.electron.explorer;

export const electronBridge = {
  async openDirectory(): Promise<string | null> {
    if (hasExplorer()) {
      const result = await window.electron.explorer.openFolder();
      return result.canceled ? null : result.folderPath;
    }
    if (!hasDialog()) return null;
    const result = await window.electron.dialog.openDirectory();
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  },

  async openFile(): Promise<string | null> {
    if (!hasDialog()) return null;
    const result = await window.electron.dialog.openFile();
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  },

  publishFolderOpened(folderPath: string) {
    if (!hasIpc()) return;
    window.electron.ipcRenderer.send(FOLDER_OPENED_CHANNEL, folderPath);
  },

  subscribeFolderOpened(callback: FolderOpenedCallback): () => void {
    if (!hasIpc()) return () => {};
    const listener = (_event: any, folderPath: string) => callback(folderPath);
    window.electron.ipcRenderer.on(FOLDER_OPENED_CHANNEL, listener);
    return () => window.electron.ipcRenderer.off(FOLDER_OPENED_CHANNEL, listener);
  },

  async readDirectory(directoryPath: string): Promise<FsEntry[]> {
    if (hasExplorer()) {
      const items = await window.electron.explorer.readDirectory(directoryPath);
      return items.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type
      }));
    }
    if (!hasFs()) return [];
    const items = await window.electron.fs.readDirectory(directoryPath);
    return items.map((item) => ({
      ...item,
      type: item.type === 'directory' ? 'directory' : 'file'
    })) as FsEntry[];
  },

  async readDirectoryDetailed(directoryPath: string): Promise<ExplorerEntry[]> {
    if (hasExplorer()) {
      const items = await window.electron.explorer.readDirectory(directoryPath);
      return items.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        modifiedAt: item.modifiedAt
      }));
    }
    const fallback = await this.readDirectory(directoryPath);
    return fallback.map((item) => ({
      ...item,
      size: 0,
      modifiedAt: 0
    }));
  },

  async readFile(filePath: string): Promise<string | null> {
    if (hasExplorer()) {
      const result = await window.electron.explorer.readFile(filePath);
      return result.success ? result.content : null;
    }
    if (!hasFs() || !window.electron.fs.readFile) return null;
    const result = await window.electron.fs.readFile(filePath);
    return result?.success ? result.content : null;
  },

  async writeFile(filePath: string, content: string): Promise<boolean> {
    if (!hasFs() || !window.electron.fs.writeFile) return false;
    const result = await window.electron.fs.writeFile(filePath, content);
    return Boolean(result?.success);
  },

  async createDirectory(directoryPath: string): Promise<boolean> {
    if (hasExplorer() && window.electron.explorer.createDirectory) {
      const result = await window.electron.explorer.createDirectory(directoryPath);
      return Boolean(result?.success);
    }
    if (!hasFs() || !window.electron.fs.createDirectory) return false;
    const result = await window.electron.fs.createDirectory(directoryPath);
    return Boolean(result?.success);
  },

  async renamePath(oldPath: string, newPath: string): Promise<boolean> {
    if (!hasFs() || !window.electron.fs.rename) return false;
    try {
      const result = await window.electron.fs.rename(oldPath, newPath);
      return Boolean(result?.success);
    } catch (error) {
      console.warn('renamePath invoke error:', error);
      return false;
    }
  },

  async deletePath(targetPath: string): Promise<boolean> {
    if (hasExplorer() && window.electron.explorer.deleteEntry) {
      try {
        const result = await window.electron.explorer.deleteEntry(targetPath);
        if (!result?.success) {
          console.warn('deletePath (explorer) failed:', result?.message ?? 'unknown-error');
        }
        return Boolean(result?.success);
      } catch (error) {
        console.warn('deletePath (explorer) invoke error:', error);
        return false;
      }
    }
    if (!hasFs() || !window.electron.fs.delete) return false;
    try {
      const result = await window.electron.fs.delete(targetPath);
      if (!result?.success) {
        console.warn('deletePath failed:', result?.message ?? 'unknown-error');
      }
      return Boolean(result?.success);
    } catch (error) {
      console.warn('deletePath invoke error:', error);
      return false;
    }
  },

  async revealInFolder(targetPath: string): Promise<boolean> {
    if (hasExplorer() && window.electron.explorer.revealInFolder) {
      const result = await window.electron.explorer.revealInFolder(targetPath);
      if (!result?.success) {
        console.warn('revealInFolder failed:', result?.message ?? 'unknown-error');
      }
      return Boolean(result?.success);
    }
    return false;
  },

  async watchExplorerFolder(folderPath: string): Promise<boolean> {
    if (!hasExplorer() || !window.electron.explorer.watchFolder) return false;
    const result = await window.electron.explorer.watchFolder(folderPath);
    return Boolean(result?.success);
  },

  async unwatchExplorerFolder(): Promise<boolean> {
    if (!hasExplorer() || !window.electron.explorer.unwatchFolder) return false;
    const result = await window.electron.explorer.unwatchFolder();
    return Boolean(result?.success);
  },

  async pickExplorerImportEntries(): Promise<string[]> {
    if (!hasExplorer() || !window.electron.explorer.pickImportEntries) return [];
    const result = await window.electron.explorer.pickImportEntries();
    if (!result || result.canceled) return [];
    return Array.isArray(result.filePaths) ? result.filePaths : [];
  },

  async importExplorerEntries(targetDirectory: string, sourcePaths: string[]): Promise<boolean> {
    if (!hasExplorer() || !window.electron.explorer.importEntries) return false;
    const result = await window.electron.explorer.importEntries(targetDirectory, sourcePaths);
    if (!result?.success) {
      console.warn('importExplorerEntries failed:', result?.message ?? 'unknown-error');
    }
    return Boolean(result?.success);
  },

  subscribeExplorerFolderChanged(callback: ExplorerFolderChangedCallback): () => void {
    if (!hasExplorer() || !window.electron.explorer.onFolderChanged) return () => {};
    return window.electron.explorer.onFolderChanged(callback);
  },

  showExplorerContextMenu(payload: { targetPath: string; targetType: ExplorerContextTargetType }) {
    if (!hasElectron() || !window.electron.contextMenu?.show) return;
    window.electron.contextMenu.show({
      source: 'explorer',
      targetPath: payload.targetPath,
      targetType: payload.targetType
    });
  },

  subscribeExplorerContextAction(callback: ExplorerContextActionCallback): () => void {
    if (!hasElectron() || !window.electron.contextMenu?.onAction) return () => {};
    return window.electron.contextMenu.onAction((payload) => {
      if (payload.source !== 'explorer') return;
      callback(payload);
    });
  },

  async readSettings<T>(): Promise<T | null> {
    if (!hasFs() || !window.electron.fs.readSettings) return null;
    const response = await window.electron.fs.readSettings();
    if (!response?.success) return null;
    return response.data as T | null;
  },

  async writeSettings(settings: unknown): Promise<boolean> {
    if (!hasFs() || !window.electron.fs.writeSettings) return false;
    const response = await window.electron.fs.writeSettings(settings);
    return Boolean(response?.success);
  }
};
