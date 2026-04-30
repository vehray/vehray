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
type ChannelType = 'lin' | 'can' | 'serial';

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

  async saveFile(defaultPath?: string): Promise<string | null> {
    if (!hasDialog() || !window.electron.dialog.saveFile) return null;
    const result = await window.electron.dialog.saveFile(defaultPath);
    if (result.canceled || !result.filePath) return null;
    return result.filePath;
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
  },

  async listChannels(): Promise<Array<{
    id: string;
    name: string;
    type: ChannelType;
    enabled: boolean;
    binding: { hardwareId: string | null; hardwareName: string | null };
  }>> {
    if (!hasElectron() || !window.electron.channel?.list) return [];
    return await window.electron.channel.list();
  },

  async getDefaultChannels(): Promise<{ lin: string; can: string; serial: string } | null> {
    if (!hasElectron() || !window.electron.channel?.getDefaults) return null;
    return await window.electron.channel.getDefaults();
  },

  async setDefaultChannel(params: { channelType: 'lin' | 'can' | 'serial'; channelId: string }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.setDefault) return false;
    const result = await window.electron.channel.setDefault(params);
    return Boolean(result?.success);
  },

  async listChannelHardwareOptions(channelType: ChannelType): Promise<Array<{
    id: string;
    name: string;
    provider: string;
    extra?: Record<string, string | number | boolean>;
  }>> {
    if (!hasElectron() || !window.electron.channel?.listHardwareOptions) return [];
    return await window.electron.channel.listHardwareOptions(channelType);
  },

  async bindChannelHardware(params: { channelId: string; hardwareId: string }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.bindHardware) return false;
    const result = await window.electron.channel.bindHardware(params);
    return Boolean(result?.success);
  },

  async unbindChannelHardware(channelId: string): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.unbindHardware) return false;
    const result = await window.electron.channel.unbindHardware(channelId);
    return Boolean(result?.success);
  },

  async openLinChannel(params: { channelId: string; baudRate: number }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.openLin) return false;
    const result = await window.electron.channel.openLin(params);
    return Boolean(result?.success);
  },
  async openDefaultLinChannel(params: { baudRate: number }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.openDefaultLin) return false;
    const result = await window.electron.channel.openDefaultLin(params);
    return Boolean(result?.success);
  },

  async closeLinChannel(channelId: string): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.closeLin) return false;
    const result = await window.electron.channel.closeLin(channelId);
    return Boolean(result?.success);
  },
  async closeDefaultLinChannel(): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.closeDefaultLin) return false;
    const result = await window.electron.channel.closeDefaultLin();
    return Boolean(result?.success);
  },

  async sendLinFrameByChannel(params: {
    channelId: string;
    id: number;
    data: number[];
    checksumType?: 'classic' | 'enhanced';
  }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.sendLinFrame) return false;
    const result = await window.electron.channel.sendLinFrame(params);
    return Boolean(result?.success);
  },
  async sendLinFrameByDefaultChannel(params: {
    id: number;
    data: number[];
    checksumType?: 'classic' | 'enhanced';
  }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.sendDefaultLinFrame) return false;
    const result = await window.electron.channel.sendDefaultLinFrame(params);
    return Boolean(result?.success);
  },

  async getLinChannelStatus(channelId: string): Promise<{
    success: boolean;
    message: string;
    opened?: boolean;
    baudRate?: number;
    txCount?: number;
    rxCount?: number;
    hardwareId?: string | null;
    hardwareName?: string | null;
  } | null> {
    if (!hasElectron() || !window.electron.channel?.getLinStatus) return null;
    return await window.electron.channel.getLinStatus(channelId);
  },
  async getDefaultLinChannelStatus(): Promise<{
    success: boolean;
    message: string;
    opened?: boolean;
    baudRate?: number;
    txCount?: number;
    rxCount?: number;
    hardwareId?: string | null;
    hardwareName?: string | null;
  } | null> {
    if (!hasElectron() || !window.electron.channel?.getDefaultLinStatus) return null;
    return await window.electron.channel.getDefaultLinStatus();
  },

  async openCanChannel(params: { channelId: string; bitrate: number }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.openCan) return false;
    const result = await window.electron.channel.openCan(params);
    return Boolean(result?.success);
  },
  async openDefaultCanChannel(params: { bitrate: number }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.openDefaultCan) return false;
    const result = await window.electron.channel.openDefaultCan(params);
    return Boolean(result?.success);
  },

  async closeCanChannel(channelId: string): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.closeCan) return false;
    const result = await window.electron.channel.closeCan(channelId);
    return Boolean(result?.success);
  },
  async closeDefaultCanChannel(): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.closeDefaultCan) return false;
    const result = await window.electron.channel.closeDefaultCan();
    return Boolean(result?.success);
  },

  async getCanChannelStatus(channelId: string): Promise<{ success: boolean; message: string; opened?: boolean; bitrate?: number } | null> {
    if (!hasElectron() || !window.electron.channel?.getCanStatus) return null;
    return await window.electron.channel.getCanStatus(channelId);
  },
  async getDefaultCanChannelStatus(): Promise<{ success: boolean; message: string; opened?: boolean; bitrate?: number } | null> {
    if (!hasElectron() || !window.electron.channel?.getDefaultCanStatus) return null;
    return await window.electron.channel.getDefaultCanStatus();
  },

  async openSerialChannel(params: { channelId: string; baudRate: number }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.openSerial) return false;
    const result = await window.electron.channel.openSerial(params);
    return Boolean(result?.success);
  },
  async openDefaultSerialChannel(params: { baudRate: number }): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.openDefaultSerial) return false;
    const result = await window.electron.channel.openDefaultSerial(params);
    return Boolean(result?.success);
  },

  async closeSerialChannel(channelId: string): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.closeSerial) return false;
    const result = await window.electron.channel.closeSerial(channelId);
    return Boolean(result?.success);
  },
  async closeDefaultSerialChannel(): Promise<boolean> {
    if (!hasElectron() || !window.electron.channel?.closeDefaultSerial) return false;
    const result = await window.electron.channel.closeDefaultSerial();
    return Boolean(result?.success);
  },

  async getSerialChannelStatus(channelId: string): Promise<{ success: boolean; message: string; opened?: boolean; deviceId?: string } | null> {
    if (!hasElectron() || !window.electron.channel?.getSerialStatus) return null;
    return await window.electron.channel.getSerialStatus(channelId);
  },
  async getDefaultSerialChannelStatus(): Promise<{ success: boolean; message: string; opened?: boolean; deviceId?: string } | null> {
    if (!hasElectron() || !window.electron.channel?.getDefaultSerialStatus) return null;
    return await window.electron.channel.getDefaultSerialStatus();
  },

  async listPcanLinDevices(): Promise<{
    id: string;
    name: string;
    hardware: 'PCAN-USB Pro';
    channel: 'LIN1' | 'LIN2';
    connected: boolean;
    backend: 'mock' | 'native';
  }[]> {
    if (!hasElectron() || !window.electron.pcanLin?.listDevices) return [];
    return await window.electron.pcanLin.listDevices();
  },

  async openPcanLinDevice(params: { deviceId: string; baudRate: number }): Promise<boolean> {
    if (!hasElectron() || !window.electron.pcanLin?.openDevice) return false;
    const result = await window.electron.pcanLin.openDevice(params);
    return Boolean(result?.success);
  },

  async closePcanLinDevice(deviceId: string): Promise<boolean> {
    if (!hasElectron() || !window.electron.pcanLin?.closeDevice) return false;
    const result = await window.electron.pcanLin.closeDevice(deviceId);
    return Boolean(result?.success);
  },

  async sendPcanLinFrame(payload: {
    deviceId: string;
    id: number;
    data: number[];
    checksumType?: 'classic' | 'enhanced';
  }): Promise<boolean> {
    if (!hasElectron() || !window.electron.pcanLin?.sendFrame) return false;
    const result = await window.electron.pcanLin.sendFrame(payload);
    return Boolean(result?.success);
  },

  subscribePcanLinFrame(
    callback: (frame: {
      deviceId: string;
      id: number;
      direction: 'tx' | 'rx';
      data: number[];
      timestamp: number;
      checksumType: 'classic' | 'enhanced';
    }) => void
  ): () => void {
    if (!hasElectron() || !window.electron.pcanLin?.onFrame) return () => {};
    return window.electron.pcanLin.onFrame(callback);
  }
};
