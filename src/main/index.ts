import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from 'electron';
import { createWindow, createChildWindow } from './modules/app-window.ts';
import { SerialPortManager } from './modules/serial-manager.ts';
import { LinControllerManager } from './modules/lin-controller.ts';
import { SettingsManager } from './modules/settings-manager.ts';
import { getScanManager } from './modules/scan-manager.ts';
import { SerialPort } from 'serialport';
import { logger, LogLevel } from './modules/logger.ts';
import fs from 'fs';
import path from 'path';

// 禁用所有日志输出
logger.setEnabled(false);

// 全局变量
let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

// 窗口控制IPC处理
ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window:start-drag', (event, mousePos) => {
  // 获取发送事件的窗口
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    // 在Electron中，startDragging()方法会自动处理鼠标位置
    // 但我们可以确保窗口在拖拽前是激活状态
    window.focus();
    window.startDragging();
  }
});

// 窗口调整IPC处理
ipcMain.handle('window:resize', (event, width: number, height: number) => {
  if (mainWindow) {
    // 设置最小窗口尺寸
    const minWidth = 800;
    const minHeight = 600;
    
    // 限制窗口尺寸
    const constrainedWidth = Math.max(minWidth, width);
    const constrainedHeight = Math.max(minHeight, height);
    
    // 获取屏幕尺寸
    const { width: screenWidth, height: screenHeight } = mainWindow.getBounds();
    const display = mainWindow.getScreen().getDisplayMatching({ x: 0, y: 0, width: screenWidth, height: screenHeight });
    
    // 限制窗口不超出屏幕范围
    const maxWidth = display.workArea.width;
    const maxHeight = display.workArea.height;
    
    const finalWidth = Math.min(constrainedWidth, maxWidth);
    const finalHeight = Math.min(constrainedHeight, maxHeight);
    
    mainWindow.setSize(finalWidth, finalHeight);
  }
});

// 获取窗口状态
ipcMain.handle('window:get-state', () => {
  if (mainWindow) {
    return {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
      bounds: mainWindow.getBounds()
    };
  }
  return null;
});

// 设置环境变量，解决CMD中文乱码问题
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 应用事件处理
app.on('ready', async () => {
  // 禁用原生菜单，使用Element Plus组件实现的菜单
  Menu.setApplicationMenu(null);
  
  // 创建窗口前设置编码
  if (process.platform === 'win32') {
    // 在Windows平台上，设置CMD编码为UTF-8
    try {
      const { execSync } = require('child_process');
      execSync('chcp 65001', { stdio: 'ignore' });
    } catch (error) {
      // 忽略错误
    }
  }
  
  mainWindow = createWindow();
  
  // 初始化串口监控
  if (mainWindow) {
    SerialPortManager.initializePortMonitoring(mainWindow);
  }
  
  // 监听主窗口焦点事件，当设置窗口打开时让其闪烁
  if (mainWindow) {
    mainWindow.on('focus', () => {
      if (settingsWindow && settingsWindow.isVisible()) {
        // 让设置窗口闪烁，模拟Windows默认行为
        settingsWindow.flashFrame(true);
        // 1秒后停止闪烁
        setTimeout(() => {
          if (settingsWindow && !settingsWindow.isDestroyed()) {
            settingsWindow.flashFrame(false);
          }
        }, 1000);
      }
    });
  }
  
  // 监听主窗口鼠标按下事件，当设置窗口打开时让其闪烁
  if (mainWindow) {
    mainWindow.on('mousedown', () => {
      if (settingsWindow && settingsWindow.isVisible()) {
        // 让设置窗口闪烁，模拟Windows默认行为
        settingsWindow.flashFrame(true);
        // 1秒后停止闪烁
        setTimeout(() => {
          if (settingsWindow && !settingsWindow.isDestroyed()) {
            settingsWindow.flashFrame(false);
          }
        }, 1000);
      }
    });
  }
  
  // 监听主窗口关闭事件，确保在主窗口关闭前关闭设置窗口
  if (mainWindow) {
    mainWindow.on('close', (event) => {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        // 先关闭设置窗口
        settingsWindow.close();
        settingsWindow = null;
      }
    });
  }
  
  // 窗口加载完成后，主动发送串口列表给渲染进程
  mainWindow.webContents.once('did-finish-load', () => {
    SerialPort.list().then(ports => {
      mainWindow?.webContents.send('serial:available-ports', ports);
    }).catch(error => {
      // 错误已在SerialPortManager中处理
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createWindow();
  }
});

// ===========================
// IPC事件处理
// ===========================

// 串口相关IPC处理
ipcMain.handle('serial:get-ports', async (event) => {
  try {
    const ports = await SerialPortManager.getPorts();
    return ports;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('serial:open-port', async (event, path: string, options: any, deviceId: string) => {
  // 正确传递参数给openPort方法，跳过event对象
  if (!mainWindow) {
    return { success: false, message: '主窗口未初始化' };
  }
  return await SerialPortManager.openPort(path, options, mainWindow, deviceId);
});

ipcMain.handle('serial:close-port', async (event, deviceId?: string) => {
  return await SerialPortManager.closePort(deviceId);
});

ipcMain.handle('serial:set-baud-rate', async (event, baudRate, deviceId?: string) => {
  return await SerialPortManager.setBaudRate(baudRate, deviceId);
});

// LIN控制器相关IPC处理
ipcMain.handle('lin:set-baud-rate', async (event, baudRate, deviceId?) => {
  return await LinControllerManager.setBaudRate(baudRate, deviceId);
});
ipcMain.handle('lin:set-mode', async (event, mode, deviceId?) => {
  return await LinControllerManager.setMode(mode, deviceId);
});
ipcMain.handle('lin:send-data', async (event, params) => {
  return await LinControllerManager.sendData(params);
});
ipcMain.handle('lin:read-slave', async (event, params) => {
  return await LinControllerManager.readSlave(params);
});
ipcMain.handle('lin:scan-slaves', async (event, params) => {
  try {
    // 设置超时处理
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('扫描超时：扫描过程花费时间过长'));
      }, 60000); // 60秒超时
    });
    
    // 执行扫描，使用 Promise.race 确保不会超时
    const result = await Promise.race([
      LinControllerManager.scanSlaves(params),
      timeoutPromise
    ]);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`扫描失败: ${errorMessage}`);
    throw error;
  }
});
ipcMain.handle('lin:abort-scan', async (event) => {
  return await LinControllerManager.abortScan();
});
ipcMain.handle('lin:get-scan-status', async (event) => {
  return await LinControllerManager.getScanStatus();
});

// 处理扫描结果用户选择
ipcMain.handle('lin:scan-result-choice', async (event, continueScanning: boolean) => {
  try {
    const scanManager = getScanManager();
    scanManager.handleUserInput(continueScanning);
    return { success: true, message: '用户选择已处理' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`处理用户选择失败: ${errorMessage}`);
    return { success: false, message: `处理用户选择失败: ${errorMessage}` };
  }
});
ipcMain.handle('lin:get-status', async (event) => {
  return await LinControllerManager.getCurrentStatus();
});

// 设置相关IPC处理
ipcMain.handle('fs:writeSettings', (event, settings) => {
  return SettingsManager.saveSettings(settings);
});

ipcMain.handle('fs:readSettings', () => {
  return SettingsManager.readSettings();
});

// 设置窗口IPC处理
ipcMain.handle('settings:open', () => {
  if (!mainWindow) {
    return { success: false, message: '主窗口未初始化' };
  }
  
  // 如果设置窗口已经存在，先关闭它
  if (settingsWindow) {
    settingsWindow.close();
    settingsWindow = null;
  }
  
  // 创建新的设置窗口作为主窗口的子窗口
  settingsWindow = createChildWindow(mainWindow, {
    width: 800,
    height: 500,
    title: '设置'
  });
  
  // 监听设置窗口关闭事件
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  
  return { success: true, message: '设置窗口已打开' };
});

ipcMain.handle('settings:close', () => {
  if (settingsWindow) {
    settingsWindow.close();
    settingsWindow = null;
    return { success: true, message: '设置窗口已关闭' };
  }
  return { success: false, message: '设置窗口未打开' };
});

// 打开文件管理器
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  return result;
});

// 打开文件
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile']
  });
  return result;
});

// 处理文件夹打开事件
ipcMain.on('folder-opened', (event, folderPath) => {
  console.log('主进程接收到folder-opened事件:', folderPath);
  // 转发事件到所有渲染进程
  if (mainWindow) {
    console.log('主进程转发folder-opened事件到渲染进程:', folderPath);
    mainWindow.webContents.send('folder-opened', folderPath);
  }
});

// 文件系统相关API
ipcMain.handle('fs:readDirectory', async (event, directoryPath) => {
  try {
    console.log('读取目录:', directoryPath);
    const files = fs.readdirSync(directoryPath, { withFileTypes: true });

    return files.map((file: any) => ({
      name: file.name,
      path: path.join(directoryPath, file.name),
      type: file.isDirectory() ? 'directory' : 'file'
    }));
  } catch (error) {
    console.error('读取目录失败:', error);
    throw error;
  }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    console.log('读取文件:', filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    console.log('写入文件:', filePath);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('写入文件失败:', error);
    throw error;
  }
});

ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
  try {
    console.log('重命名:', oldPath, '->', newPath);
    fs.renameSync(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error('重命名失败:', error);
    throw error;
  }
});

ipcMain.handle('fs:createDirectory', async (event, dirPath) => {
  try {
    console.log('创建目录:', dirPath);
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('创建目录失败:', error);
    throw error;
  }
});

ipcMain.handle('fs:delete', async (event, targetPath) => {
  try {
    console.log('删除:', targetPath);
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmdirSync(targetPath, { recursive: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    return { success: true };
  } catch (error) {
    console.error('删除失败:', error);
    throw error;
  }
});
