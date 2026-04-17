// preload.ts - 完整版本，暴露所有必要的API
import { contextBridge, ipcRenderer } from 'electron';

// 完整的API暴露，包含所有必要的串口和LIN功能
contextBridge.exposeInMainWorld('electron', {
  // 测试API
  preloadTest: 'preload script loaded',
  
  // IPC渲染器，用于调用主进程方法
  ipcRenderer: {
    invoke: async (channel: string, ...args: any[]) => {
      return await ipcRenderer.invoke(channel, ...args);
    },
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      ipcRenderer.on(channel, listener);
    },
    off: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      ipcRenderer.off(channel, listener);
    }
  },
  
  // 串口相关API
  serial: {
    // 获取可用串口列表
    getPorts: async () => {
      return await ipcRenderer.invoke('serial:get-ports');
    },
    
    // 打开串口
    openPort: async (path: string, options: any, deviceId: string) => {
      return await ipcRenderer.invoke('serial:open-port', path, options, deviceId);
    },
    
    // 关闭串口
    closePort: async (deviceId?: string) => {
      return await ipcRenderer.invoke('serial:close-port', deviceId);
    },
    
    // 监听可用串口列表推送
    onAvailablePorts: (callback: (ports: any[]) => void) => {
      const listener = (event: any, ports: any[]) => {
        // 确保传递给回调的是数组
        const portsArray = Array.isArray(ports) ? ports : [];
        callback(portsArray);
      };
      ipcRenderer.on('serial:available-ports', listener);
      return () => {
        ipcRenderer.removeListener('serial:available-ports', listener);
      };
    },
    
    // 监听LIN帧数据
    onLinFrame: (callback: (frame: any) => void) => {
      const listener = (event: any, frame: any) => {
        callback(frame);
      };
      ipcRenderer.on('serial:lin-frame', listener);
      return () => {
        ipcRenderer.removeListener('serial:lin-frame', listener);
      };
    },
    
    // 监听原始数据
    onRawData: (callback: (data: string) => void) => {
      const listener = (event: any, data: string) => {
        callback(data);
      };
      ipcRenderer.on('serial:raw-data', listener);
      return () => {
        ipcRenderer.removeListener('serial:raw-data', listener);
      };
    },
    
    // 监听串口错误
    onError: (callback: (error: string) => void) => {
      const listener = (event: any, error: string) => {
        callback(error);
      };
      ipcRenderer.on('serial:error', listener);
      return () => {
        ipcRenderer.removeListener('serial:error', listener);
      };
    },
    
    // 监听串口关闭
    onClose: (callback: (message: string) => void) => {
      const listener = (event: any, data: any) => {
        // 处理对象类型的参数
        const message = typeof data === 'object' && data.message ? data.message : String(data);
        callback(message);
      };
      ipcRenderer.on('serial:closed', listener);
      return () => {
        ipcRenderer.removeListener('serial:closed', listener);
      };
    },
    
    // 监听串口添加
    onPortAdded: (callback: (port: any) => void) => {
      const listener = (event: any, port: any) => {
        callback(port);
      };
      ipcRenderer.on('serial:port-added', listener);
      return () => {
        ipcRenderer.removeListener('serial:port-added', listener);
      };
    },
    
    // 监听串口移除
    onPortRemoved: (callback: (data: any) => void) => {
      const listener = (event: any, data: any) => {
        callback(data);
      };
      ipcRenderer.on('serial:port-removed', listener);
      return () => {
        ipcRenderer.removeListener('serial:port-removed', listener);
      };
    },
    
    // 设置波特率
    setBaudRate: async (baudRate: number) => {
      return await ipcRenderer.invoke('serial:set-baud-rate', baudRate);
    }
  },
  
  // LIN控制器相关API
    lin: {
      // 设置LIN波特率
      setBaudRate: async (baudRate: number, deviceId?: string) => {
        return await ipcRenderer.invoke('lin:set-baud-rate', baudRate, deviceId);
      },
      
      // 切换运行模式
      setMode: async (mode: number, deviceId?: string) => {
        return await ipcRenderer.invoke('lin:set-mode', mode, deviceId);
      },
      
      // 发送LIN数据帧
      sendData: async (params: any) => {
        return await ipcRenderer.invoke('lin:send-data', params);
      },
      
      // 读取从机数据
      readSlave: async (params: any) => {
        return await ipcRenderer.invoke('lin:read-slave', params);
      },
      
      // 获取当前LIN控制器状态
      getStatus: async () => {
        return await ipcRenderer.invoke('lin:get-status');
      },
      
      // 扫描从机
      scanSlaves: async (params: any) => {
        return await ipcRenderer.invoke('lin:scan-slaves', params);
      },
      
      // 中止扫描
      abortScan: async () => {
        return await ipcRenderer.invoke('lin:abort-scan');
      },
      
      // 获取扫描状态
      getScanStatus: async () => {
        return await ipcRenderer.invoke('lin:get-scan-status');
      },
      
      // 监听扫描结果事件
      onScanResult: (callback: (data: any) => void) => {
        const listener = (event: any, data: any) => {
          callback(data);
        };
        ipcRenderer.on('scan:result', listener);
        return () => {
          ipcRenderer.removeListener('scan:result', listener);
        };
      },
      
      // 处理扫描结果用户选择
      scanResultChoice: async (continueScanning: boolean) => {
        return await ipcRenderer.invoke('lin:scan-result-choice', continueScanning);
      }
    },
  
  // 文件系统相关API（用于设置保存和读取）
  fs: {
    // 保存设置
    writeSettings: async (settings: any) => {
      return await ipcRenderer.invoke('fs:writeSettings', settings);
    },
    
    // 读取设置
    readSettings: async () => {
      return await ipcRenderer.invoke('fs:readSettings');
    },
    
    // 读取目录内容
    readDirectory: async (directoryPath: string) => {
      return await ipcRenderer.invoke('fs:readDirectory', directoryPath);
    },
    
    // 读取文件
    readFile: async (filePath: string, encoding: string = 'utf8') => {
      return await ipcRenderer.invoke('fs:readFile', filePath, encoding);
    },
    
    // 写入文件
    writeFile: async (filePath: string, content: string, encoding: string = 'utf8') => {
      return await ipcRenderer.invoke('fs:writeFile', filePath, content, encoding);
    },
    
    // 创建目录
    createDirectory: async (directoryPath: string) => {
      return await ipcRenderer.invoke('fs:createDirectory', directoryPath);
    },
    
    // 删除文件或目录
    delete: async (path: string) => {
      return await ipcRenderer.invoke('fs:delete', path);
    },
    
    // 重命名文件或目录
    rename: async (oldPath: string, newPath: string) => {
      return await ipcRenderer.invoke('fs:rename', oldPath, newPath);
    },
    
    // 复制文件
    copyFile: async (srcPath: string, destPath: string) => {
      return await ipcRenderer.invoke('fs:copyFile', srcPath, destPath);
    }
  },

  // 对话框相关API（用于打开文件管理器）
  dialog: {
    // 打开目录选择对话框
    openDirectory: async () => {
      return await ipcRenderer.invoke('dialog:openDirectory');
    },
    
    // 打开文件选择对话框
    openFile: async () => {
      return await ipcRenderer.invoke('dialog:openFile');
    }
  }
});
