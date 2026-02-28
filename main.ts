import { app, BrowserWindow, ipcMain } from 'electron';
import { createWindow } from './src/main/modules/app-window';
import { SerialPortManager } from './src/main/modules/serial-manager';
import { LinControllerManager } from './src/main/modules/lin-controller';
import { SerialPort } from 'serialport';

// 全局变量
let mainWindow: BrowserWindow | null = null;

// 应用事件处理
app.on('ready', async () => {
  mainWindow = createWindow();
  
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

ipcMain.handle('serial:open-port', async (event, path: string, options: any) => {
  // 正确传递参数给openPort方法，跳过event对象
  if (!mainWindow) {
    return { success: false, message: '主窗口未初始化' };
  }
  return await SerialPortManager.openPort(path, options, mainWindow);
});

ipcMain.handle('serial:close-port', SerialPortManager.closePort);

// LIN控制器相关IPC处理
ipcMain.handle('lin:set-baud-rate', LinControllerManager.setBaudRate);
ipcMain.handle('lin:set-mode', LinControllerManager.setMode);
ipcMain.handle('lin:send-data', LinControllerManager.sendData);
ipcMain.handle('lin:read-slave', LinControllerManager.readSlave);
ipcMain.handle('lin:scan-slaves', LinControllerManager.scanSlaves);
ipcMain.handle('lin:abort-scan', LinControllerManager.abortScan);
ipcMain.handle('lin:get-scan-status', LinControllerManager.getScanStatus);
ipcMain.handle('lin:get-status', LinControllerManager.getCurrentStatus);
