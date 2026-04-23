// 全局类型声明文件

declare global {
  interface Window {
    electron: {
      platform: string;
      preloadTest: string;
      serial: {
        getPorts: () => Promise<any[]>;
        openPort: (path: string, options: any, deviceId: string) => Promise<{ success: boolean; message: string }>;
        closePort: (deviceId?: string) => Promise<{ success: boolean; message: string }>;
        setBaudRate: (baudRate: number, deviceId?: string) => Promise<{ success: boolean; message: string }>;
        onAvailablePorts: (callback: (ports: any[]) => void) => () => void;
        onLinFrame: (callback: (frame: any) => void) => () => void;
        onRawData: (callback: (data: string) => void) => () => void;
        onError: (callback: (error: string) => void) => () => void;
        onClose: (callback: (message: string) => void) => () => void;
        onPortAdded: (callback: (port: any) => void) => () => void;
        onPortRemoved: (callback: (data: any) => void) => () => void;
      };
      lin: {
        setBaudRate: (baudRate: number, deviceId?: string) => Promise<{ success: boolean; message: string }>;
        setMode: (mode: number, deviceId?: string) => Promise<{ success: boolean; message: string }>;
        sendData: (params: any) => Promise<{ success: boolean; message: string }>;
        readSlave: (params: any) => Promise<{ success: boolean; message: string }>;
        scanSlaves: (params: any) => Promise<any[]>;
        abortScan: () => Promise<{ success: boolean; message: string }>;
        getScanStatus: () => Promise<{ isScanning: boolean; progress: number; currentLinId: string }>;
        getStatus: () => Promise<any>;
        onScanResult: (callback: (data: any) => void) => () => void;
        scanResultChoice: (continueScanning: boolean) => Promise<{ success: boolean; message: string }>;
      };
      dialog: {
        openDirectory: () => Promise<{ canceled: boolean; filePaths: string[] }>;
        openFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
        saveFile: (defaultPath?: string) => Promise<{ canceled: boolean; filePath?: string }>;
      };
      fs: {
        readDirectory: (path: string) => Promise<{ name: string; path: string; type: string }[]>;
        readSettings: () => Promise<any>;
        writeSettings: (settings: any) => Promise<any>;
        readFile: (path: string) => Promise<{ success: boolean; content: string }>;
        writeFile: (path: string, content: string) => Promise<{ success: boolean }>;
        rename: (oldPath: string, newPath: string) => Promise<{ success: boolean }>;
        createDirectory: (path: string) => Promise<{ success: boolean }>;
        delete: (path: string) => Promise<{ success: boolean; message?: string }>;
      };
      explorer: {
        openFolder: () => Promise<{ canceled: boolean; folderPath: string | null }>;
        readDirectory: (path: string) => Promise<{
          name: string;
          path: string;
          type: 'file' | 'directory';
          size: number;
          modifiedAt: number;
        }[]>;
        readFile: (path: string) => Promise<{ success: boolean; content: string }>;
        createDirectory: (path: string) => Promise<{ success: boolean }>;
        deleteEntry: (path: string) => Promise<{ success: boolean; message?: string }>;
        revealInFolder: (path: string) => Promise<{ success: boolean; message?: string }>;
        watchFolder: (path: string) => Promise<{ success: boolean }>;
        unwatchFolder: () => Promise<{ success: boolean }>;
        onFolderChanged: (callback: (payload: { folderPath: string; eventType: string; filename: string }) => void) => () => void;
        pickImportEntries: () => Promise<{ canceled: boolean; filePaths: string[] }>;
        importEntries: (
          targetDirectory: string,
          sourcePaths: string[]
        ) => Promise<{ success: boolean; message?: string }>;
      };
      contextMenu: {
        show: (payload: { source: 'explorer'; targetPath: string; targetType: 'root' | 'file' | 'directory' }) => void;
        onAction: (callback: (payload: {
          source: 'explorer';
          action: 'revealInFolder' | 'createFolder';
          targetPath: string;
          targetType: 'root' | 'file' | 'directory';
        }) => void) => () => void;
      };
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
        off: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
      };
    };
  }
}

export {};
