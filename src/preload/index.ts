// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  serial: {
    getPorts: () => ipcRenderer.invoke('serial:get-ports'),
    openPort: (path: string, options: any) => ipcRenderer.invoke('serial:open-port', path, options),
    closePort: () => ipcRenderer.invoke('serial:close-port'),
    onRawData: (callback: (data: string) => void) => {
      const listener = (event: any, data: string) => callback(data);
      ipcRenderer.on('serial:raw-data', listener);
      return () => ipcRenderer.removeListener('serial:raw-data', listener);
    },
    onError: (callback: (error: string) => void) => {
      const listener = (event: any, error: string) => callback(error);
      ipcRenderer.on('serial:error', listener);
      return () => ipcRenderer.removeListener('serial:error', listener);
    },
  },
  lin: {
    setBaudRate: (baudRate: number) => ipcRenderer.invoke('lin:set-baud-rate', baudRate),
    setMode: (mode: number) => ipcRenderer.invoke('lin:set-mode', mode),
    sendData: (params: any) => ipcRenderer.invoke('lin:send-data', params),
    readSlave: (params: any) => ipcRenderer.invoke('lin:read-slave', params),
    scanSlaves: (params: any) => ipcRenderer.invoke('lin:scan-slaves', params),
    abortScan: () => ipcRenderer.invoke('lin:abort-scan'),
    getScanStatus: () => ipcRenderer.invoke('lin:get-scan-status'),
    onFrame: (callback: (frame: any) => void) => {
      const listener = (event: any, frame: any) => callback(frame);
      ipcRenderer.on('lin:frame', listener);
      return () => ipcRenderer.removeListener('lin:frame', listener);
    },
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
  },
  fs: {
    readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
  },
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      const wrappedListener = (event: any, ...args: any[]) => listener(event, ...args);
      ipcRenderer.on(channel, wrappedListener);
      return wrappedListener;
    },
    off: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },
});
