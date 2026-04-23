import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electron", {
  // 测试API
  preloadTest: "preload script loaded",
  // IPC渲染器，用于调用主进程方法
  ipcRenderer: {
    invoke: async (channel, ...args) => {
      return await ipcRenderer.invoke(channel, ...args);
    },
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel, listener) => {
      ipcRenderer.on(channel, listener);
    },
    off: (channel, listener) => {
      ipcRenderer.off(channel, listener);
    }
  },
  // 串口相关API
  serial: {
    // 获取可用串口列表
    getPorts: async () => {
      return await ipcRenderer.invoke("serial:get-ports");
    },
    // 打开串口
    openPort: async (path, options, deviceId) => {
      return await ipcRenderer.invoke("serial:open-port", path, options, deviceId);
    },
    // 关闭串口
    closePort: async (deviceId) => {
      return await ipcRenderer.invoke("serial:close-port", deviceId);
    },
    // 监听可用串口列表推送
    onAvailablePorts: (callback) => {
      const listener = (event, ports) => {
        const portsArray = Array.isArray(ports) ? ports : [];
        callback(portsArray);
      };
      ipcRenderer.on("serial:available-ports", listener);
      return () => {
        ipcRenderer.removeListener("serial:available-ports", listener);
      };
    },
    // 监听LIN帧数据
    onLinFrame: (callback) => {
      const listener = (event, frame) => {
        callback(frame);
      };
      ipcRenderer.on("serial:lin-frame", listener);
      return () => {
        ipcRenderer.removeListener("serial:lin-frame", listener);
      };
    },
    // 监听原始数据
    onRawData: (callback) => {
      const listener = (event, data) => {
        callback(data);
      };
      ipcRenderer.on("serial:raw-data", listener);
      return () => {
        ipcRenderer.removeListener("serial:raw-data", listener);
      };
    },
    // 监听串口错误
    onError: (callback) => {
      const listener = (event, error) => {
        callback(error);
      };
      ipcRenderer.on("serial:error", listener);
      return () => {
        ipcRenderer.removeListener("serial:error", listener);
      };
    },
    // 监听串口关闭
    onClose: (callback) => {
      const listener = (event, data) => {
        const message = typeof data === "object" && data.message ? data.message : String(data);
        callback(message);
      };
      ipcRenderer.on("serial:closed", listener);
      return () => {
        ipcRenderer.removeListener("serial:closed", listener);
      };
    },
    // 监听串口添加
    onPortAdded: (callback) => {
      const listener = (event, port) => {
        callback(port);
      };
      ipcRenderer.on("serial:port-added", listener);
      return () => {
        ipcRenderer.removeListener("serial:port-added", listener);
      };
    },
    // 监听串口移除
    onPortRemoved: (callback) => {
      const listener = (event, data) => {
        callback(data);
      };
      ipcRenderer.on("serial:port-removed", listener);
      return () => {
        ipcRenderer.removeListener("serial:port-removed", listener);
      };
    },
    // 设置波特率
    setBaudRate: async (baudRate) => {
      return await ipcRenderer.invoke("serial:set-baud-rate", baudRate);
    }
  },
  // LIN控制器相关API
  lin: {
    // 设置LIN波特率
    setBaudRate: async (baudRate, deviceId) => {
      return await ipcRenderer.invoke("lin:set-baud-rate", baudRate, deviceId);
    },
    // 切换运行模式
    setMode: async (mode, deviceId) => {
      return await ipcRenderer.invoke("lin:set-mode", mode, deviceId);
    },
    // 发送LIN数据帧
    sendData: async (params) => {
      return await ipcRenderer.invoke("lin:send-data", params);
    },
    // 读取从机数据
    readSlave: async (params) => {
      return await ipcRenderer.invoke("lin:read-slave", params);
    },
    // 获取当前LIN控制器状态
    getStatus: async () => {
      return await ipcRenderer.invoke("lin:get-status");
    },
    // 扫描从机
    scanSlaves: async (params) => {
      return await ipcRenderer.invoke("lin:scan-slaves", params);
    },
    // 中止扫描
    abortScan: async () => {
      return await ipcRenderer.invoke("lin:abort-scan");
    },
    // 获取扫描状态
    getScanStatus: async () => {
      return await ipcRenderer.invoke("lin:get-scan-status");
    },
    // 监听扫描结果事件
    onScanResult: (callback) => {
      const listener = (event, data) => {
        callback(data);
      };
      ipcRenderer.on("scan:result", listener);
      return () => {
        ipcRenderer.removeListener("scan:result", listener);
      };
    },
    // 处理扫描结果用户选择
    scanResultChoice: async (continueScanning) => {
      return await ipcRenderer.invoke("lin:scan-result-choice", continueScanning);
    }
  },
  // 文件系统相关API（用于设置保存和读取）
  fs: {
    // 保存设置
    writeSettings: async (settings) => {
      return await ipcRenderer.invoke("fs:writeSettings", settings);
    },
    // 读取设置
    readSettings: async () => {
      return await ipcRenderer.invoke("fs:readSettings");
    },
    // 读取目录内容
    readDirectory: async (directoryPath) => {
      return await ipcRenderer.invoke("fs:readDirectory", directoryPath);
    },
    // 读取文件
    readFile: async (path) => {
      return await ipcRenderer.invoke("fs:readFile", path);
    },
    // 写入文件
    writeFile: async (path, content) => {
      return await ipcRenderer.invoke("fs:writeFile", path, content);
    },
    // 重命名文件或目录
    rename: async (oldPath, newPath) => {
      return await ipcRenderer.invoke("fs:rename", oldPath, newPath);
    },
    // 创建目录
    createDirectory: async (path) => {
      return await ipcRenderer.invoke("fs:createDirectory", path);
    },
    // 删除文件或目录
    delete: async (path) => {
      return await ipcRenderer.invoke("fs:delete", path);
    }
  },
  // Explorer 相关API
  explorer: {
    openFolder: async () => {
      return await ipcRenderer.invoke("explorer:open-folder");
    },
    readDirectory: async (directoryPath) => {
      return await ipcRenderer.invoke("explorer:read-directory", directoryPath);
    },
    readFile: async (filePath) => {
      return await ipcRenderer.invoke("explorer:read-file", filePath);
    },
    createDirectory: async (directoryPath) => {
      return await ipcRenderer.invoke("explorer:create-directory", directoryPath);
    },
    deleteEntry: async (targetPath) => {
      return await ipcRenderer.invoke("explorer:delete-entry", targetPath);
    },
    revealInFolder: async (targetPath) => {
      return await ipcRenderer.invoke("explorer:reveal-in-folder", targetPath);
    },
    watchFolder: async (folderPath) => {
      return await ipcRenderer.invoke("explorer:watch-folder", folderPath);
    },
    unwatchFolder: async () => {
      return await ipcRenderer.invoke("explorer:unwatch-folder");
    },
    onFolderChanged: (callback) => {
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on("explorer:folder-changed", listener);
      return () => {
        ipcRenderer.removeListener("explorer:folder-changed", listener);
      };
    },
    pickImportEntries: async () => {
      return await ipcRenderer.invoke("explorer:pick-import-entries");
    },
    importEntries: async (targetDirectory, sourcePaths) => {
      return await ipcRenderer.invoke("explorer:import-entries", targetDirectory, sourcePaths);
    }
  },
  // 全局上下文菜单API
  contextMenu: {
    show: (payload) => {
      ipcRenderer.send("context-menu:show", payload);
    },
    onAction: (callback) => {
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on("context-menu:action", listener);
      return () => {
        ipcRenderer.removeListener("context-menu:action", listener);
      };
    }
  },
  // 对话框相关API（用于打开文件管理器）
  dialog: {
    // 打开目录选择对话框
    openDirectory: async () => {
      return await ipcRenderer.invoke("dialog:openDirectory");
    },
    // 打开文件选择对话框
    openFile: async () => {
      return await ipcRenderer.invoke("dialog:openFile");
    },
    // 打开保存文件对话框
    saveFile: async (defaultPath) => {
      return await ipcRenderer.invoke("dialog:saveFile", defaultPath);
    }
  }
});
