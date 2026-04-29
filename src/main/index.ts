import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from 'electron';
import { createWindow, createChildWindow } from './modules/app-window.ts';
import { SerialPortManager } from './modules/serial-manager.ts';
import { LinControllerManager } from './modules/lin-controller.ts';
import { SettingsManager } from './modules/settings-manager.ts';
import { getScanManager } from './modules/scan-manager.ts';
import { FileExplorerService } from './modules/file-explorer-service.ts';
import { SerialPort } from 'serialport';
import { logger, LogLevel } from './modules/logger.ts';
import { TITLEBAR_OVERLAY_HEIGHT } from './modules/window-ui-constants.ts';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

// 禁用所有日志输出
logger.setEnabled(false);

// 全局变量
let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let explorerFolderWatcher: fs.FSWatcher | null = null;
type WindowInitTab = { id: string; title: string; content: string; dirty?: boolean };
type WindowInitContext = {
  initialTab: WindowInitTab | null;
  windowMode: 'normal' | 'single-tab';
  theme?: 'dark' | 'light';
};
const pendingWindowInitContexts = new Map<number, WindowInitContext>();
const detachedExplorerWindows = new Map<
  number,
  {
    sourceWindowId: number;
    autoDockEnabled: boolean;
    initialBounds: Electron.Rectangle;
    lastBounds: Electron.Rectangle;
    previewVisible: boolean;
    dockCommitTimer: ReturnType<typeof setTimeout> | null;
  }
>();
const EXPLORER_FOLDER_CHANGED_CHANNEL = 'explorer:folder-changed';
const CONTEXT_MENU_ACTION_CHANNEL = 'context-menu:action';
const isLdfFile = (filePath: string) => path.extname(filePath).toLowerCase() === '.ldf';

const copyEntryToDirectory = (sourcePath: string, destinationDirectory: string) => {
  const entryName = path.basename(sourcePath);
  const destinationPath = path.join(destinationDirectory, entryName);
  const sourceStat = fs.statSync(sourcePath);

  if (sourceStat.isDirectory()) {
    if (typeof fs.cpSync === 'function') {
      fs.cpSync(sourcePath, destinationPath, { recursive: true, errorOnExist: false, force: true });
      return;
    }
    fs.mkdirSync(destinationPath, { recursive: true });
    const children = fs.readdirSync(sourcePath);
    for (const child of children) {
      copyEntryToDirectory(path.join(sourcePath, child), destinationPath);
    }
    return;
  }

  fs.copyFileSync(sourcePath, destinationPath);
};

const stopExplorerFolderWatch = () => {
  if (!explorerFolderWatcher) return;
  try {
    explorerFolderWatcher.close();
  } catch (error) {
    console.warn('[explorer] close watcher failed:', error instanceof Error ? error.message : String(error));
  }
  explorerFolderWatcher = null;
};

const applyWindowTheme = (theme: 'dark' | 'light') => {
  const backgroundColor = theme === 'light' ? '#f7f8fa' : '#1e1e1e';
  const overlayColor = theme === 'light' ? '#ffffff' : '#252526';
  const symbolColor = theme === 'light' ? '#2f353d' : '#cccccc';

  const applyToWindow = (target: BrowserWindow | null) => {
    if (!target || target.isDestroyed()) return;
    target.setBackgroundColor(backgroundColor);
    if (process.platform !== 'darwin') {
      target.setTitleBarOverlay({
        color: overlayColor,
        symbolColor,
        height: TITLEBAR_OVERLAY_HEIGHT
      });
    }
  };

  applyToWindow(mainWindow);
  applyToWindow(settingsWindow);
};

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

ipcMain.handle('window:get-current-bounds', (event) => {
  const currentWindow = BrowserWindow.fromWebContents(event.sender);
  if (!currentWindow || currentWindow.isDestroyed()) return null;
  return currentWindow.getBounds();
});

ipcMain.handle('window:set-current-position', (event, x: number, y: number) => {
  const currentWindow = BrowserWindow.fromWebContents(event.sender);
  if (!currentWindow || currentWindow.isDestroyed()) return { success: false };
  currentWindow.setPosition(Math.round(x), Math.round(y));
  return { success: true };
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

ipcMain.handle('window:set-theme', (_event, theme: 'dark' | 'light') => {
  applyWindowTheme(theme);
  return { success: true };
});

ipcMain.handle('window:open-new', (_event, payload?: WindowInitTab | WindowInitContext | null) => {
  const nextWindow = createWindow();
  const sourceWindow = BrowserWindow.fromWebContents(_event.sender);
  let context: WindowInitContext | null = null;
  if (payload && typeof payload === 'object' && 'initialTab' in payload) {
    const initialTab = payload.initialTab && typeof payload.initialTab.id === 'string' ? payload.initialTab : null;
    const windowMode = payload.windowMode === 'single-tab' ? 'single-tab' : 'normal';
    const theme = payload.theme === 'light' ? 'light' : payload.theme === 'dark' ? 'dark' : undefined;
    context = { initialTab, windowMode, theme };
  } else if (payload && typeof payload === 'object' && 'id' in payload && typeof payload.id === 'string') {
    context = { initialTab: payload as WindowInitTab, windowMode: 'normal' };
  }
  if (context) {
    if (context.theme) {
      const backgroundColor = context.theme === 'light' ? '#f7f8fa' : '#1e1e1e';
      const overlayColor = context.theme === 'light' ? '#ffffff' : '#252526';
      const symbolColor = context.theme === 'light' ? '#2f353d' : '#cccccc';
      nextWindow.setBackgroundColor(backgroundColor);
      if (process.platform !== 'darwin') {
        nextWindow.setTitleBarOverlay({
          color: overlayColor,
          symbolColor,
          height: TITLEBAR_OVERLAY_HEIGHT
        });
      }
    }
    if (context.initialTab?.title) {
      nextWindow.setTitle(context.initialTab.title);
    }
    if (context.windowMode === 'single-tab' && context.initialTab?.id === 'explorer') {
      nextWindow.setMinimumSize(360, 480);
      nextWindow.setSize(420, 760);
      if (sourceWindow && !sourceWindow.isDestroyed()) {
        sourceWindow.webContents.send('layout:close-explorer');
      }
      if (sourceWindow && !sourceWindow.isDestroyed()) {
        const childId = nextWindow.id;
        detachedExplorerWindows.set(childId, {
          sourceWindowId: sourceWindow.id,
          autoDockEnabled: false,
          initialBounds: nextWindow.getBounds(),
          lastBounds: nextWindow.getBounds(),
          previewVisible: false,
          dockCommitTimer: null
        });
        setTimeout(() => {
          const current = detachedExplorerWindows.get(childId);
          if (!current) return;
          detachedExplorerWindows.set(childId, { ...current, autoDockEnabled: true });
        }, 800);
        sourceWindow.webContents.send('layout:explorer-detached-state', true);

        nextWindow.on('move', () => {
          const track = detachedExplorerWindows.get(childId);
          if (!track || !track.autoDockEnabled) return;
          const parent = BrowserWindow.fromId(track.sourceWindowId);
          if (!parent || parent.isDestroyed() || nextWindow.isDestroyed()) return;
          const childBounds = nextWindow.getBounds();
          track.lastBounds = childBounds;
          const parentBounds = parent.getBounds();
          const movedDistance = Math.hypot(
            childBounds.x - track.initialBounds.x,
            childBounds.y - track.initialBounds.y
          );
          // 只有明显拖动后，且进入主窗口左侧吸附区才触发回归，避免普通拖拽时误关闭
          const enteredDockZone =
            childBounds.x <= parentBounds.x + 96 &&
            childBounds.x + childBounds.width >= parentBounds.x &&
            childBounds.y < parentBounds.y + parentBounds.height - 40 &&
            childBounds.y + childBounds.height > parentBounds.y + 40;
          const eligibleForDock = movedDistance >= 80 && enteredDockZone;
          if (eligibleForDock) {
            if (!track.previewVisible) {
              track.previewVisible = true;
              parent.webContents.send('layout:explorer-dock-preview', true);
            }
          } else {
            if (track.dockCommitTimer) {
              clearTimeout(track.dockCommitTimer);
              track.dockCommitTimer = null;
            }
            if (track.previewVisible) {
              track.previewVisible = false;
              parent.webContents.send('layout:explorer-dock-preview', false);
            }
          }
        });

        nextWindow.webContents.on('context-menu', () => {
          const track = detachedExplorerWindows.get(childId);
          if (!track) return;
          const menu = Menu.buildFromTemplate([
            {
              label: '返回主窗口',
              click: () => {
                const parent = BrowserWindow.fromId(track.sourceWindowId);
                if (parent && !parent.isDestroyed()) {
                  parent.webContents.send('layout:explorer-dock-preview', false);
                  parent.webContents.send('layout:restore-explorer');
                  parent.webContents.send('layout:explorer-detached-state', false);
                }
                if (track.dockCommitTimer) {
                  clearTimeout(track.dockCommitTimer);
                }
                detachedExplorerWindows.delete(childId);
                if (!nextWindow.isDestroyed()) nextWindow.close();
              }
            }
          ]);
          menu.popup({ window: nextWindow });
        });
      }
    }
    const webContentsId = nextWindow.webContents.id;
    pendingWindowInitContexts.set(webContentsId, context);
    nextWindow.on('closed', () => {
      const track = detachedExplorerWindows.get(nextWindow.id);
      if (track) {
        if (track.dockCommitTimer) {
          clearTimeout(track.dockCommitTimer);
        }
        const parent = BrowserWindow.fromId(track.sourceWindowId);
        if (parent && !parent.isDestroyed()) {
          parent.webContents.send('layout:explorer-dock-preview', false);
          parent.webContents.send('layout:explorer-detached-state', false);
          parent.webContents.send('layout:restore-explorer');
        }
      }
      pendingWindowInitContexts.delete(webContentsId);
      detachedExplorerWindows.delete(nextWindow.id);
    });
  }
  return { success: true };
});

ipcMain.handle('window:get-init-context', (event) => {
  const senderId = event.sender.id;
  const initContext = pendingWindowInitContexts.get(senderId) ?? null;
  pendingWindowInitContexts.delete(senderId);
  return initContext;
});

ipcMain.handle('window:dock-explorer-commit', (event) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender);
  if (!sourceWindow || sourceWindow.isDestroyed()) {
    return { success: false };
  }
  for (const [childId, track] of detachedExplorerWindows.entries()) {
    if (track.sourceWindowId !== sourceWindow.id || !track.previewVisible) continue;
    const childWindow = BrowserWindow.fromId(childId);
    if (!childWindow || childWindow.isDestroyed()) continue;
    sourceWindow.webContents.send('layout:explorer-dock-preview', false);
    sourceWindow.webContents.send('layout:restore-explorer');
    sourceWindow.webContents.send('layout:explorer-detached-state', false);
    if (track.dockCommitTimer) {
      clearTimeout(track.dockCommitTimer);
    }
    detachedExplorerWindows.delete(childId);
    childWindow.close();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('window:dock-explorer-on-release', (event) => {
  const childWindow = BrowserWindow.fromWebContents(event.sender);
  if (!childWindow || childWindow.isDestroyed()) return { success: false };
  const track = detachedExplorerWindows.get(childWindow.id);
  if (!track) return { success: false };
  const parent = BrowserWindow.fromId(track.sourceWindowId);
  if (!parent || parent.isDestroyed()) return { success: false };
  const childBounds = childWindow.getBounds();
  const parentBounds = parent.getBounds();
  const movedDistance = Math.hypot(
    childBounds.x - track.initialBounds.x,
    childBounds.y - track.initialBounds.y
  );
  const inDockZone =
    childBounds.x <= parentBounds.x + 96 &&
    childBounds.x + childBounds.width >= parentBounds.x &&
    childBounds.y < parentBounds.y + parentBounds.height - 40 &&
    childBounds.y + childBounds.height > parentBounds.y + 40;
  if (movedDistance >= 80 && inDockZone) {
    parent.webContents.send('layout:explorer-dock-preview', false);
    parent.webContents.send('layout:restore-explorer');
    parent.webContents.send('layout:explorer-detached-state', false);
    detachedExplorerWindows.delete(childWindow.id);
    childWindow.close();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('window:restore-detached-explorer', (event) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender);
  if (!sourceWindow || sourceWindow.isDestroyed()) return { success: false };
  for (const [childId, track] of detachedExplorerWindows.entries()) {
    if (track.sourceWindowId !== sourceWindow.id) continue;
    const childWindow = BrowserWindow.fromId(childId);
    if (!childWindow || childWindow.isDestroyed()) continue;
    sourceWindow.webContents.send('layout:explorer-dock-preview', false);
    sourceWindow.webContents.send('layout:restore-explorer');
    sourceWindow.webContents.send('layout:explorer-detached-state', false);
    if (track.dockCommitTimer) clearTimeout(track.dockCommitTimer);
    detachedExplorerWindows.delete(childId);
    childWindow.close();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('window:focus-detached-explorer', (event) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender);
  if (!sourceWindow || sourceWindow.isDestroyed()) return { success: false };
  for (const [childId, track] of detachedExplorerWindows.entries()) {
    if (track.sourceWindowId !== sourceWindow.id) continue;
    const childWindow = BrowserWindow.fromId(childId);
    if (!childWindow || childWindow.isDestroyed()) continue;
    if (childWindow.isMinimized()) childWindow.restore();
    childWindow.focus();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('window:show-detached-explorer-context-menu', (event) => {
  const childWindow = BrowserWindow.fromWebContents(event.sender);
  if (!childWindow || childWindow.isDestroyed()) return { success: false };
  const track = detachedExplorerWindows.get(childWindow.id);
  if (!track) return { success: false };
  const parent = BrowserWindow.fromId(track.sourceWindowId);
  if (!parent || parent.isDestroyed()) return { success: false };

  const menu = Menu.buildFromTemplate([
    {
      label: '回到主窗口',
      click: () => {
        parent.webContents.send('layout:explorer-dock-preview', false);
        parent.webContents.send('layout:restore-explorer');
        parent.webContents.send('layout:explorer-detached-state', false);
        if (track.dockCommitTimer) {
          clearTimeout(track.dockCommitTimer);
        }
        detachedExplorerWindows.delete(childWindow.id);
        if (!childWindow.isDestroyed()) {
          childWindow.close();
        }
      }
    }
  ]);

  menu.popup({ window: childWindow });
  return { success: true };
});

ipcMain.handle('window:get-init-tab', (event) => {
  const senderId = event.sender.id;
  const initContext = pendingWindowInitContexts.get(senderId) ?? null;
  pendingWindowInitContexts.delete(senderId);
  return initContext?.initialTab ?? null;
});

ipcMain.handle('app:get-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion()
  };
});

ipcMain.handle('app:show-about-dialog', async () => {
  const targetWindow = mainWindow ?? BrowserWindow.getFocusedWindow() ?? undefined;
  await dialog.showMessageBox(targetWindow, {
    type: 'info',
    title: '关于',
    message: '关于',
    detail: `程序名称: ${app.getName()}\n版本信息: ${app.getVersion()}`,
    buttons: ['确定'],
    noLink: true
  });
  return { success: true };
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
      // 主窗口关闭时，联动关闭该主窗口分离出去的资源管理器子窗口
      for (const [childId, track] of detachedExplorerWindows.entries()) {
        if (track.sourceWindowId !== mainWindow?.id) continue;
        if (track.dockCommitTimer) {
          clearTimeout(track.dockCommitTimer);
        }
        const childWindow = BrowserWindow.fromId(childId);
        if (childWindow && !childWindow.isDestroyed()) {
          childWindow.close();
        }
        detachedExplorerWindows.delete(childId);
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
  stopExplorerFolderWatch();
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

// Explorer 基础架构：目录选择、目录读取、文件读取
ipcMain.handle('explorer:open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, folderPath: null };
  }
  return { canceled: false, folderPath: result.filePaths[0] };
});

ipcMain.handle('explorer:pick-import-entries', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'openDirectory', 'multiSelections']
  });
  return {
    canceled: result.canceled,
    filePaths: result.filePaths
  };
});

ipcMain.handle('explorer:read-directory', async (_event, directoryPath: string) => {
  return FileExplorerService.readDirectory(directoryPath);
});

ipcMain.handle('explorer:read-file', async (_event, filePath: string) => {
  const content = await FileExplorerService.readFile(filePath);
  return { success: true, content };
});

ipcMain.handle('explorer:create-directory', async (_event, directoryPath: string) => {
  await FileExplorerService.createDirectory(directoryPath);
  return { success: true };
});

ipcMain.handle('explorer:delete-entry', async (_event, targetPath: string) => {
  try {
    return await FileExplorerService.deleteEntry(targetPath);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle('explorer:reveal-in-folder', async (_event, targetPath: string) => {
  if (!targetPath) return { success: false, message: 'empty-path' };
  try {
    if (!fs.existsSync(targetPath)) {
      return { success: false, message: 'not-found' };
    }

    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      const error = await shell.openPath(targetPath);
      if (error) return { success: false, message: error };
      return { success: true };
    }
    // 官方语义：文件使用 showItemInFolder，在系统文件管理器中定位该文件
    shell.showItemInFolder(targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('explorer:watch-folder', async (_event, folderPath: string) => {
  stopExplorerFolderWatch();
  const emitChanged = (eventType: string, filename?: string | Buffer | null) => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const payload = {
        folderPath,
        eventType,
        filename: filename?.toString() ?? ''
      };
      mainWindow.webContents.send(EXPLORER_FOLDER_CHANGED_CHANNEL, payload);
    } catch (error) {
      console.warn('[explorer:watch-folder] emit changed failed:', error instanceof Error ? error.message : String(error));
    }
  };

  const bindWatcherErrorHandler = (watcher: fs.FSWatcher) => {
    watcher.on('error', (error) => {
      // 被监听目录删除/重命名时 watcher 会触发 error，必须兜底避免主进程崩溃
      console.warn('[explorer:watch-folder] watcher error:', error instanceof Error ? error.message : String(error));
      if (!mainWindow || mainWindow.isDestroyed()) {
        stopExplorerFolderWatch();
        return;
      }
      mainWindow.webContents.send(EXPLORER_FOLDER_CHANGED_CHANNEL, {
        folderPath,
        eventType: 'watcher-error',
        filename: ''
      });
      stopExplorerFolderWatch();
    });
  };

  try {
    explorerFolderWatcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
      try {
        emitChanged(eventType, filename);
      } catch (_error) {
        // watcher 回调必须完全兜底，避免异常冒泡导致进程退出
      }
    });
    bindWatcherErrorHandler(explorerFolderWatcher);
    return { success: true };
  } catch (_error) {
    try {
      // 某些环境不支持 recursive，回退到当前目录监听
      explorerFolderWatcher = fs.watch(folderPath, (eventType, filename) => {
        try {
          emitChanged(eventType, filename);
        } catch (_error) {
          // watcher 回调必须完全兜底，避免异常冒泡导致进程退出
        }
      });
      bindWatcherErrorHandler(explorerFolderWatcher);
      return { success: true };
    } catch (_fallbackError) {
      stopExplorerFolderWatch();
      return { success: false };
    }
  }
});

ipcMain.handle('explorer:unwatch-folder', async () => {
  stopExplorerFolderWatch();
  return { success: true };
});

ipcMain.handle('explorer:import-entries', async (_event, targetDirectory: string, sourcePaths: string[]) => {
  if (!targetDirectory || !Array.isArray(sourcePaths) || sourcePaths.length === 0) {
    return { success: false, message: 'invalid-params' };
  }

  try {
    if (!fs.existsSync(targetDirectory) || !fs.statSync(targetDirectory).isDirectory()) {
      return { success: false, message: 'target-not-directory' };
    }

    for (const sourcePath of sourcePaths) {
      if (!sourcePath || !fs.existsSync(sourcePath)) continue;
      copyEntryToDirectory(sourcePath, targetDirectory);
    }
    return { success: true, message: '' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
});

// 打开文件
ipcMain.handle('dialog:openFile', async () => {
  const options = {
    title: '打开 LDF 文件',
    properties: ['openFile'] as const,
    filters: [
      { name: 'LDF Files', extensions: ['ldf', 'LDF'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  };
  console.log('[dialog:openFile] options:', JSON.stringify(options));
  const result = await dialog.showOpenDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('dialog:saveFile', async (_event, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '保存 LDF 文件',
    defaultPath,
    filters: [
      { name: 'LDF Files', extensions: ['ldf', 'LDF'] },
      { name: 'All Files', extensions: ['*'] }
    ]
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

type ExplorerContextTargetType = 'root' | 'file' | 'directory';

ipcMain.on(
  'context-menu:show',
  (
    event,
    payload: {
      source: 'explorer';
      targetPath: string;
      targetType: ExplorerContextTargetType;
    }
  ) => {
    if (payload?.source !== 'explorer') return;

    const menu = Menu.buildFromTemplate([
      {
        label: '打开所在文件夹',
        click: () => {
          event.sender.send(CONTEXT_MENU_ACTION_CHANNEL, {
            source: 'explorer',
            action: 'revealInFolder',
            targetPath: payload.targetPath,
            targetType: payload.targetType
          });
        }
      },
      {
        label: '创建文件夹',
        click: () => {
          event.sender.send(CONTEXT_MENU_ACTION_CHANNEL, {
            source: 'explorer',
            action: 'createFolder',
            targetPath: payload.targetPath,
            targetType: payload.targetType
          });
        }
      }
    ]);

    menu.popup({
      window: BrowserWindow.fromWebContents(event.sender) ?? undefined
    });
  }
);

// 文件系统相关API
ipcMain.handle('fs:readDirectory', async (event, directoryPath) => {
  try {
    console.log('读取目录:', directoryPath);
    const entries = await FileExplorerService.readDirectory(directoryPath);
    return entries.map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.type
    }));
  } catch (error) {
    console.error('读取目录失败:', error);
    throw error;
  }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    console.log('读取文件:', filePath);
    const buffer = fs.readFileSync(filePath);
    const content = isLdfFile(filePath)
      ? iconv.decode(buffer, 'windows-1252')
      : buffer.toString('utf-8');
    return { success: true, content };
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    console.log('写入文件:', filePath);
    if (isLdfFile(filePath)) {
      fs.writeFileSync(filePath, iconv.encode(content, 'windows-1252'));
    } else {
      fs.writeFileSync(filePath, content, 'utf-8');
    }
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

ipcMain.handle('fs:delete', async (_event, targetPath: string) => {
  console.log('删除:', targetPath);
  return FileExplorerService.deleteEntry(targetPath);
});
