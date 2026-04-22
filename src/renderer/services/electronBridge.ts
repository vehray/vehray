export interface FsEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

type FolderOpenedCallback = (folderPath: string) => void;

const FOLDER_OPENED_CHANNEL = 'folder-opened';

const hasElectron = () => typeof window !== 'undefined' && !!window.electron;

const hasIpc = () => hasElectron() && !!window.electron.ipcRenderer;
const hasDialog = () => hasElectron() && !!window.electron.dialog;
const hasFs = () => hasElectron() && !!window.electron.fs;

export const electronBridge = {
  async openDirectory(): Promise<string | null> {
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
    if (!hasFs()) return [];
    const items = await window.electron.fs.readDirectory(directoryPath);
    return items.map((item) => ({
      ...item,
      type: item.type === 'directory' ? 'directory' : 'file'
    })) as FsEntry[];
  }
};
