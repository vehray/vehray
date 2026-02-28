import { app, BrowserWindow, ipcMain } from 'electron';
import { createWindow } from './modules/app-window.ts';
import { SerialPortManager } from './modules/serial-manager.ts';
import { LinControllerManager } from './modules/lin-controller.ts';
import { SettingsManager } from './modules/settings-manager.ts';
import { getScanManager } from './modules/scan-manager.ts';
import { SerialPort } from 'serialport';
import { logger, LogLevel } from './modules/logger.ts';

// 禁用所有日志输出
logger.setEnabled(false);

// 全局变量
let mainWindow: BrowserWindow | null = null;

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

ipcMain.handle('window:start-drag', () => {
  if (mainWindow) {
    mainWindow.startDragging();
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
