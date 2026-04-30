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
      pcanLin: {
        listDevices: () => Promise<{
          id: string;
          name: string;
          hardware: 'PCAN-USB Pro';
          channel: 'LIN1' | 'LIN2';
          connected: boolean;
          backend: 'mock' | 'native';
        }[]>;
        openDevice: (params: { deviceId: string; baudRate: number }) => Promise<{ success: boolean; message: string }>;
        closeDevice: (deviceId: string) => Promise<{ success: boolean; message: string }>;
        sendFrame: (payload: {
          deviceId: string;
          id: number;
          data: number[];
          checksumType?: 'classic' | 'enhanced';
        }) => Promise<{ success: boolean; message: string }>;
        getStatus: (deviceId: string) => Promise<{
          success: boolean;
          message: string;
          opened: boolean;
          baudRate?: number;
          txCount?: number;
          rxCount?: number;
        }>;
        onFrame: (callback: (frame: {
          deviceId: string;
          id: number;
          direction: 'tx' | 'rx';
          data: number[];
          timestamp: number;
          checksumType: 'classic' | 'enhanced';
        }) => void) => () => void;
      };
      channel: {
        list: () => Promise<Array<{
          id: string;
          name: string;
          type: 'lin' | 'can' | 'serial';
          enabled: boolean;
          binding: { hardwareId: string | null; hardwareName: string | null };
        }>>;
        getDefaults: () => Promise<{ lin: string; can: string; serial: string }>;
        setDefault: (params: { channelType: 'lin' | 'can' | 'serial'; channelId: string }) => Promise<{ success: boolean; message: string }>;
        listHardwareOptions: (channelType: 'lin' | 'can' | 'serial') => Promise<Array<{
          id: string;
          name: string;
          provider: string;
          extra?: Record<string, string | number | boolean>;
        }>>;
        bindHardware: (params: { channelId: string; hardwareId: string }) => Promise<{ success: boolean; message: string }>;
        unbindHardware: (channelId: string) => Promise<{ success: boolean; message: string }>;
        openLin: (params: { channelId: string; baudRate: number }) => Promise<{ success: boolean; message: string }>;
        openDefaultLin: (params: { baudRate: number }) => Promise<{ success: boolean; message: string }>;
        closeLin: (channelId: string) => Promise<{ success: boolean; message: string }>;
        closeDefaultLin: () => Promise<{ success: boolean; message: string }>;
        sendLinFrame: (params: {
          channelId: string;
          id: number;
          data: number[];
          checksumType?: 'classic' | 'enhanced';
        }) => Promise<{ success: boolean; message: string }>;
        sendDefaultLinFrame: (params: {
          id: number;
          data: number[];
          checksumType?: 'classic' | 'enhanced';
        }) => Promise<{ success: boolean; message: string }>;
        getLinStatus: (channelId: string) => Promise<{
          success: boolean;
          message: string;
          opened?: boolean;
          baudRate?: number;
          txCount?: number;
          rxCount?: number;
          hardwareId?: string | null;
          hardwareName?: string | null;
        }>;
        getDefaultLinStatus: () => Promise<{
          success: boolean;
          message: string;
          opened?: boolean;
          baudRate?: number;
          txCount?: number;
          rxCount?: number;
          hardwareId?: string | null;
          hardwareName?: string | null;
        }>;
        openCan: (params: { channelId: string; bitrate: number }) => Promise<{ success: boolean; message: string }>;
        openDefaultCan: (params: { bitrate: number }) => Promise<{ success: boolean; message: string }>;
        closeCan: (channelId: string) => Promise<{ success: boolean; message: string }>;
        closeDefaultCan: () => Promise<{ success: boolean; message: string }>;
        getCanStatus: (channelId: string) => Promise<{
          success: boolean;
          message: string;
          opened?: boolean;
          bitrate?: number;
        }>;
        getDefaultCanStatus: () => Promise<{
          success: boolean;
          message: string;
          opened?: boolean;
          bitrate?: number;
        }>;
        openSerial: (params: { channelId: string; baudRate: number }) => Promise<{ success: boolean; message: string }>;
        openDefaultSerial: (params: { baudRate: number }) => Promise<{ success: boolean; message: string }>;
        closeSerial: (channelId: string) => Promise<{ success: boolean; message: string }>;
        closeDefaultSerial: () => Promise<{ success: boolean; message: string }>;
        getSerialStatus: (channelId: string) => Promise<{
          success: boolean;
          message: string;
          opened?: boolean;
          deviceId?: string;
        }>;
        getDefaultSerialStatus: () => Promise<{
          success: boolean;
          message: string;
          opened?: boolean;
          deviceId?: string;
        }>;
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
