import { BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.ts';
import { TITLEBAR_OVERLAY_HEIGHT } from './window-ui-constants.ts';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// 窗口创建函数
export function createWindow(): BrowserWindow {
  logger.info('app-window.ts: createWindow function called');
  logger.debug('app-window.ts: __dirname:', __dirname);
  logger.debug('app-window.ts: process.cwd():', process.cwd());
  
  // 正确计算预加载脚本路径，确保使用绝对路径
  // 开发模式下，electron-vite会将main.js编译到dist/main目录，所以__dirname是dist/main
  // 预加载脚本编译到dist/preload目录，相对于项目根目录
  // 使用process.cwd()获取项目根目录，确保路径正确
  const preloadPath = path.resolve(process.cwd(), 'dist/preload/index.mjs');
  logger.debug('app-window.ts: 预加载脚本路径:', preloadPath);
  logger.debug('app-window.ts: __dirname:', __dirname);
  logger.debug('app-window.ts: process.cwd():', process.cwd());
  
  // 检查预加载脚本文件是否存在
  import('fs').then(fs => {
    if (fs.default.existsSync(preloadPath)) {
      logger.debug('app-window.ts: 预加载脚本文件存在');
    } else {
      logger.warn('app-window.ts: 预加载脚本文件不存在');
      // 列出dist目录的内容，以便调试
      logger.debug('__dirname目录内容:', fs.default.readdirSync(__dirname));
      if (fs.default.existsSync(path.join(__dirname, 'dist'))) {
        const distContents = fs.default.readdirSync(path.join(__dirname, 'dist'));
        logger.debug('dist目录内容:', distContents);
        distContents.forEach(file => {
          const filePath = path.join(__dirname, 'dist', file);
          if (fs.default.existsSync(filePath)) {
            const stats = fs.default.statSync(filePath);
            if (stats.isDirectory()) {
              logger.debug(`${file} 是目录，内容:`, fs.default.readdirSync(filePath));
            }
          }
        });
      }
    }
  }).catch(error => {
    logger.error('app-window.ts: 检查预加载脚本文件时出错:', error instanceof Error ? error.message : String(error));
  });
  
  // 创建浏览器窗口时添加详细的webPreferences配置
  // 确保与Electron 40+兼容
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 1000,
    minHeight: 600,
    title: 'LINAnalyzer',
    frame: false, // 移除默认系统边框
    titleBarStyle: 'hidden', // 隐藏默认标题栏
    // 在Windows/Linux上添加窗口控件，设置与应用顶部按钮栏一致的高度和颜色
    ...(process.platform !== 'darwin' ? { 
      titleBarOverlay: {
        height: TITLEBAR_OVERLAY_HEIGHT, // 与应用顶部按钮栏高度一致
        color: '#252526', // 与应用顶部按钮栏背景颜色一致
        symbolColor: '#cccccc', // 与应用顶部按钮栏文字颜色一致
        buttons: ['minimize', 'maximize', 'close'] // 显示最小化、最大化和关闭按钮
      } 
    } : {}),
    backgroundColor: '#1e1e1e', // 与渲染层深色背景保持一致，避免缩放时白底闪烁
    webPreferences: {
      // 预加载脚本配置
      preload: preloadPath,
      
      // 安全配置
      contextIsolation: true,
      nodeIntegration: false,
      
      // 沙盒配置 - Electron 40+可能需要
      sandbox: false,
      
      // 允许运行ES模块格式的预加载脚本
      webSecurity: true,
      
      // 添加调试日志
      devTools: true
    },
    // 高DPI支持
    useContentSize: true, // 使用内容尺寸而不是窗口尺寸
    autoHideMenuBar: true, // 自动隐藏菜单栏
    show: false // 延迟显示窗口，确保渲染完成
  });
  
  // 启用高DPI支持
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // 设置窗口的DPI感知
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(1.0);
  });
  
  // 添加更多预加载相关的事件监听
  mainWindow.webContents.on('preload-script-error', (event, error, stack) => {
    logger.error('=== 预加载脚本错误 ===');
    logger.error('Error:', error);
    logger.error('Stack:', stack);
    logger.error('====================');
  });
  
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    logger.debug(`[Renderer Console] ${message} (${sourceId}:${line})`);
  });

  // 移除默认菜单栏
  mainWindow.setMenu(null);
  
  // 添加预加载脚本加载状态监听
  mainWindow.webContents.on('preload-error', (event, error) => {
    logger.error('app-window.ts: Preload script load error:', error);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('app-window.ts: Page loaded successfully');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logger.error('app-window.ts: Page load failed:', errorDescription, '(Error code:', errorCode, ')');
  });

  // 根据环境变量决定加载方式
  const isDev = process.env.NODE_ENV === 'development';
  logger.info(`Current environment: ${isDev ? 'development' : 'production'}`);
  
  if (isDev) {
    // 开发模式：加载Vite开发服务器
    // 尝试从环境变量获取Vite端口，或者使用默认端口5173
    const vitePorts = [5173, 5174, 5175, 5176, 5177];
    let currentPortIndex = 0;
    
    // 递归尝试加载不同端口
    const tryLoadVite = () => {
      if (currentPortIndex >= vitePorts.length) {
        logger.error('所有Vite端口都尝试失败，无法加载开发服务器');
        return;
      }
      
      const vitePort = vitePorts[currentPortIndex];
      const viteUrl = `http://localhost:${vitePort}`;
      logger.info(`Trying to load Vite development server: ${viteUrl}`);
      
      // 清除之前的事件监听器
      mainWindow.webContents.removeAllListeners('did-fail-load');
      mainWindow.webContents.removeAllListeners('did-finish-load');
      
      // 监听加载失败事件
      mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        logger.error(`Page load failed: ${errorDescription} (Error code: ${errorCode})`);
        currentPortIndex++;
        logger.info(`Trying alternative port ${vitePorts[currentPortIndex]}`);
        tryLoadVite(); // 尝试下一个端口
      });
      
      // 监听加载完成事件
      mainWindow.webContents.once('did-finish-load', () => {
        logger.info('Page loaded successfully');
      });
      
      // 尝试加载URL
      mainWindow.loadURL(viteUrl);
    };
    
    // 开始尝试加载Vite开发服务器
    tryLoadVite();
  } else {
    // 生产模式：加载本地文件
    // 使用process.cwd()获取项目根目录，确保路径正确
    const rendererHtmlPath = path.resolve(process.cwd(), 'dist/renderer/index.html');
    logger.debug('app-window.ts: 渲染进程HTML路径:', rendererHtmlPath);
    mainWindow.loadFile(rendererHtmlPath);
  }
  // 确保开发者工具打开，便于查看渲染进程日志
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  return mainWindow;
}

// 创建子窗口函数
export function createChildWindow(parentWindow: BrowserWindow, options?: { width?: number, height?: number, title?: string }): BrowserWindow {
  const { width = 600, height = 400, title = '设置' } = options || {};
  
  // 正确计算预加载脚本路径
  const preloadPath = path.resolve(process.cwd(), 'dist/preload/index.mjs');
  
  // 创建子窗口
  const childWindow = new BrowserWindow({
    width,
    height,
    title,
    parent: parentWindow,
    modal: false, // 移除modal属性，允许拖拽
    frame: false, // 移除默认系统边框
    titleBarStyle: 'hidden', // 隐藏默认标题栏
    // 在Windows/Linux上添加窗口控件，设置与应用顶部按钮栏一致的高度和颜色
    ...(process.platform !== 'darwin' ? { 
      titleBarOverlay: {
        height: TITLEBAR_OVERLAY_HEIGHT, // 与应用顶部按钮栏高度一致
        color: '#252526', // 与应用顶部按钮栏背景颜色一致
        symbolColor: '#cccccc', // 与应用顶部按钮栏文字颜色一致
        buttons: ['minimize', 'maximize', 'close'] // 显示最小化、最大化和关闭按钮
      } 
    } : {}),
    backgroundColor: '#1e1e1e', // 与渲染层深色背景保持一致，避免缩放时白底闪烁
    minWidth: 1000, // 最小宽度
    minHeight: 600, // 最小高度
    webPreferences: {
      // 预加载脚本配置
      preload: preloadPath,
      
      // 安全配置
      contextIsolation: true,
      nodeIntegration: false,
      
      // 沙盒配置 - Electron 40+可能需要
      sandbox: false,
      
      // 允许运行ES模块格式的预加载脚本
      webSecurity: true,
      
      // 添加调试日志
      devTools: true
    },
    // 高DPI支持
    useContentSize: true, // 使用内容尺寸而不是窗口尺寸
    autoHideMenuBar: true, // 自动隐藏菜单栏
    show: false // 延迟显示窗口，确保渲染完成
  });
  
  // 启用高DPI支持
  childWindow.once('ready-to-show', () => {
    childWindow.show();
  });
  
  // 设置窗口的DPI感知
  childWindow.webContents.on('did-finish-load', () => {
    childWindow.webContents.setZoomFactor(1.0);
  });
  
  // 移除默认菜单栏
  childWindow.setMenu(null);
  
  // 根据环境变量决定加载方式
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // 开发模式：加载Vite开发服务器
    // 尝试从环境变量获取Vite端口，或者使用默认端口5173
    const vitePorts = [5173, 5174, 5175, 5176, 5177];
    let currentPortIndex = 0;
    
    // 递归尝试加载不同端口
    const tryLoadVite = () => {
      if (currentPortIndex >= vitePorts.length) {
        logger.error('所有Vite端口都尝试失败，无法加载开发服务器');
        return;
      }
      
      const vitePort = vitePorts[currentPortIndex];
      const viteUrl = `http://localhost:${vitePort}?window=settings`;
      logger.info(`Trying to load Vite development server for child window: ${viteUrl}`);
      
      // 清除之前的事件监听器
      childWindow.webContents.removeAllListeners('did-fail-load');
      childWindow.webContents.removeAllListeners('did-finish-load');
      
      // 监听加载失败事件
      childWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        logger.error(`Child window page load failed: ${errorDescription} (Error code: ${errorCode})`);
        currentPortIndex++;
        logger.info(`Trying alternative port ${vitePorts[currentPortIndex]}`);
        tryLoadVite(); // 尝试下一个端口
      });
      
      // 监听加载完成事件
      childWindow.webContents.once('did-finish-load', () => {
        logger.info('Child window page loaded successfully');
      });
      
      // 尝试加载URL
      childWindow.loadURL(viteUrl);
    };
    
    // 开始尝试加载Vite开发服务器
    tryLoadVite();
  } else {
    // 生产模式：加载本地文件
    // 使用process.cwd()获取项目根目录，确保路径正确
    const rendererHtmlPath = path.resolve(process.cwd(), 'dist/renderer/index.html');
    logger.debug('app-window.ts: 子窗口渲染进程HTML路径:', rendererHtmlPath);
    childWindow.loadFile(rendererHtmlPath, { query: { window: 'settings' } });
  }
  
  // 确保开发者工具打开，便于查看渲染进程日志
  childWindow.webContents.openDevTools({ mode: 'detach' });

  return childWindow;
}
