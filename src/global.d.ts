// 全局类型声明文件

declare global {
  interface Window {
    electron: {
      platform: string;
      serial: {
        getPorts: () => Promise<any[]>;
        openPort: (path: string, options: any) => Promise<{ success: boolean; message: string }>;
        closePort: () => Promise<{ success: boolean; message: string }>;
        onRawData: (callback: (data: string) => void) => () => void;
        onError: (callback: (error: string) => void) => () => void;
      };
      lin: {
        setBaudRate: (baudRate: number) => Promise<{ success: boolean; message: string }>;
        setMode: (mode: number) => Promise<{ success: boolean; message: string }>;
        sendData: (params: any) => Promise<{ success: boolean; message: string }>;
        readSlave: (params: any) => Promise<{ success: boolean; message: string }>;
        scanSlaves: (params: any) => Promise<any[]>;
        abortScan: () => Promise<{ success: boolean; message: string }>;
        getScanStatus: () => Promise<{ isScanning: boolean; progress: number; currentLinId: string }>;
        onFrame: (callback: (frame: any) => void) => () => void;
        removeFrameListener?: (callback: (frame: any) => void) => void;
      };
    };
  }
}

export {};
