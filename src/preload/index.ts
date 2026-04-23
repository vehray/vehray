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
    saveFile: (defaultPath?: string) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  },
  fs: {
    readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
    readSettings: () => ipcRenderer.invoke('fs:readSettings'),
    writeSettings: (settings: any) => ipcRenderer.invoke('fs:writeSettings', settings),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    createDirectory: (path: string) => ipcRenderer.invoke('fs:createDirectory', path),
    delete: (path: string) => ipcRenderer.invoke('fs:delete', path),
  },
  explorer: {
    openFolder: () => ipcRenderer.invoke('explorer:open-folder'),
    readDirectory: (directoryPath: string) => ipcRenderer.invoke('explorer:read-directory', directoryPath),
    readFile: (filePath: string) => ipcRenderer.invoke('explorer:read-file', filePath),
    createDirectory: (directoryPath: string) => ipcRenderer.invoke('explorer:create-directory', directoryPath),
    deleteEntry: (targetPath: string) => ipcRenderer.invoke('explorer:delete-entry', targetPath),
    revealInFolder: (targetPath: string) => ipcRenderer.invoke('explorer:reveal-in-folder', targetPath),
    watchFolder: (folderPath: string) => ipcRenderer.invoke('explorer:watch-folder', folderPath),
    unwatchFolder: () => ipcRenderer.invoke('explorer:unwatch-folder'),
    onFolderChanged: (callback: (payload: { folderPath: string; eventType: string; filename: string }) => void) => {
      const listener = (_event: any, payload: { folderPath: string; eventType: string; filename: string }) => callback(payload);
      ipcRenderer.on('explorer:folder-changed', listener);
      return () => ipcRenderer.removeListener('explorer:folder-changed', listener);
    },
  },
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
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
