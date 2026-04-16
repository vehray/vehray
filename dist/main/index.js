import { BrowserWindow, app, ipcMain, Menu } from "electron";
import * as path from "path";
import path__default from "path";
import { fileURLToPath } from "url";
import { SerialPort } from "serialport";
import * as fs from "fs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};
const defaultConfig = {
  level: LogLevel.DEBUG,
  enabled: true
};
class Logger {
  config;
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  // 设置日志级别
  setLevel(level) {
    this.config.level = level;
  }
  // 关闭日志
  setEnabled(enabled) {
    this.config.enabled = enabled;
  }
  // 获取当前日志级别
  getLevel() {
    return this.config.level;
  }
  // 获取当前日志开关状态
  getEnabled() {
    return this.config.enabled;
  }
  // 调试日志
  debug(...args) {
    if (this.config.enabled && this.config.level <= LogLevel.DEBUG) {
      console.debug("[DEBUG]", ...args);
    }
  }
  // 信息日志
  info(...args) {
    if (this.config.enabled && this.config.level <= LogLevel.INFO) {
      console.info("[INFO]", ...args);
    }
  }
  // 警告日志
  warn(...args) {
    if (this.config.enabled && this.config.level <= LogLevel.WARN) {
      console.warn("[WARN]", ...args);
    }
  }
  // 错误日志
  error(...args) {
    if (this.config.enabled && this.config.level <= LogLevel.ERROR) {
      console.error("[ERROR]", ...args);
    }
  }
}
const logger = new Logger();
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path__default.dirname(__filename$1);
function createWindow() {
  logger.info("app-window.ts: createWindow function called");
  logger.debug("app-window.ts: __dirname:", __dirname$1);
  logger.debug("app-window.ts: process.cwd():", process.cwd());
  const preloadPath = path__default.resolve(process.cwd(), "dist/preload/index.mjs");
  logger.debug("app-window.ts: 预加载脚本路径:", preloadPath);
  logger.debug("app-window.ts: __dirname:", __dirname$1);
  logger.debug("app-window.ts: process.cwd():", process.cwd());
  import("fs").then((fs2) => {
    if (fs2.default.existsSync(preloadPath)) {
      logger.debug("app-window.ts: 预加载脚本文件存在");
    } else {
      logger.warn("app-window.ts: 预加载脚本文件不存在");
      logger.debug("__dirname目录内容:", fs2.default.readdirSync(__dirname$1));
      if (fs2.default.existsSync(path__default.join(__dirname$1, "dist"))) {
        const distContents = fs2.default.readdirSync(path__default.join(__dirname$1, "dist"));
        logger.debug("dist目录内容:", distContents);
        distContents.forEach((file) => {
          const filePath = path__default.join(__dirname$1, "dist", file);
          if (fs2.default.existsSync(filePath)) {
            const stats = fs2.default.statSync(filePath);
            if (stats.isDirectory()) {
              logger.debug(`${file} 是目录，内容:`, fs2.default.readdirSync(filePath));
            }
          }
        });
      }
    }
  }).catch((error) => {
    logger.error("app-window.ts: 检查预加载脚本文件时出错:", error instanceof Error ? error.message : String(error));
  });
  const mainWindow2 = new BrowserWindow({
    width: 1e3,
    height: 700,
    minWidth: 1e3,
    minHeight: 600,
    title: "LINAnalyzer",
    frame: false,
    // 移除默认系统边框
    titleBarStyle: "hidden",
    // 隐藏默认标题栏
    // 在Windows/Linux上添加窗口控件，设置与应用顶部按钮栏一致的高度和颜色
    ...process.platform !== "darwin" ? {
      titleBarOverlay: {
        height: 32,
        // 与应用顶部按钮栏高度一致
        color: "#252526",
        // 与应用顶部按钮栏背景颜色一致
        symbolColor: "#cccccc",
        // 与应用顶部按钮栏文字颜色一致
        buttons: ["minimize", "maximize", "close"]
        // 显示最小化、最大化和关闭按钮
      }
    } : {},
    backgroundColor: "#f5f7fa",
    // 设置背景色
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
    useContentSize: true,
    // 使用内容尺寸而不是窗口尺寸
    autoHideMenuBar: true,
    // 自动隐藏菜单栏
    show: false
    // 延迟显示窗口，确保渲染完成
  });
  mainWindow2.once("ready-to-show", () => {
    mainWindow2.show();
  });
  mainWindow2.webContents.on("did-finish-load", () => {
    mainWindow2.webContents.setZoomFactor(1);
  });
  mainWindow2.webContents.on("preload-script-error", (event, error, stack) => {
    logger.error("=== 预加载脚本错误 ===");
    logger.error("Error:", error);
    logger.error("Stack:", stack);
    logger.error("====================");
  });
  mainWindow2.webContents.on("console-message", (event, level, message, line, sourceId) => {
    logger.debug(`[Renderer Console] ${message} (${sourceId}:${line})`);
  });
  mainWindow2.setMenu(null);
  mainWindow2.webContents.on("preload-error", (event, error) => {
    logger.error("app-window.ts: Preload script load error:", error);
  });
  mainWindow2.webContents.on("did-finish-load", () => {
    logger.info("app-window.ts: Page loaded successfully");
  });
  mainWindow2.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    logger.error("app-window.ts: Page load failed:", errorDescription, "(Error code:", errorCode, ")");
  });
  const isDev = process.env.NODE_ENV === "development";
  logger.info(`Current environment: ${isDev ? "development" : "production"}`);
  if (isDev) {
    const vitePorts = [5173, 5174, 5175, 5176, 5177];
    let currentPortIndex = 0;
    const tryLoadVite = () => {
      if (currentPortIndex >= vitePorts.length) {
        logger.error("所有Vite端口都尝试失败，无法加载开发服务器");
        return;
      }
      const vitePort = vitePorts[currentPortIndex];
      const viteUrl = `http://localhost:${vitePort}`;
      logger.info(`Trying to load Vite development server: ${viteUrl}`);
      mainWindow2.webContents.removeAllListeners("did-fail-load");
      mainWindow2.webContents.removeAllListeners("did-finish-load");
      mainWindow2.webContents.once("did-fail-load", (event, errorCode, errorDescription) => {
        logger.error(`Page load failed: ${errorDescription} (Error code: ${errorCode})`);
        currentPortIndex++;
        logger.info(`Trying alternative port ${vitePorts[currentPortIndex]}`);
        tryLoadVite();
      });
      mainWindow2.webContents.once("did-finish-load", () => {
        logger.info("Page loaded successfully");
      });
      mainWindow2.loadURL(viteUrl);
    };
    tryLoadVite();
  } else {
    const rendererHtmlPath = path__default.resolve(process.cwd(), "dist/renderer/index.html");
    logger.debug("app-window.ts: 渲染进程HTML路径:", rendererHtmlPath);
    mainWindow2.loadFile(rendererHtmlPath);
  }
  mainWindow2.webContents.openDevTools({ mode: "detach" });
  return mainWindow2;
}
function createChildWindow(parentWindow, options) {
  const { width = 600, height = 400, title = "设置" } = options || {};
  const preloadPath = path__default.resolve(process.cwd(), "dist/preload/index.mjs");
  const childWindow = new BrowserWindow({
    width,
    height,
    title,
    parent: parentWindow,
    modal: false,
    // 移除modal属性，允许拖拽
    frame: false,
    // 移除默认系统边框
    titleBarStyle: "hidden",
    // 隐藏默认标题栏
    // 在Windows/Linux上添加窗口控件，设置与应用顶部按钮栏一致的高度和颜色
    ...process.platform !== "darwin" ? {
      titleBarOverlay: {
        height: 32,
        // 与应用顶部按钮栏高度一致
        color: "#252526",
        // 与应用顶部按钮栏背景颜色一致
        symbolColor: "#cccccc",
        // 与应用顶部按钮栏文字颜色一致
        buttons: ["minimize", "maximize", "close"]
        // 显示最小化、最大化和关闭按钮
      }
    } : {},
    backgroundColor: "#f5f7fa",
    // 设置背景色
    minWidth: 1e3,
    // 最小宽度
    minHeight: 600,
    // 最小高度
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
    useContentSize: true,
    // 使用内容尺寸而不是窗口尺寸
    autoHideMenuBar: true,
    // 自动隐藏菜单栏
    show: false
    // 延迟显示窗口，确保渲染完成
  });
  childWindow.once("ready-to-show", () => {
    childWindow.show();
  });
  childWindow.webContents.on("did-finish-load", () => {
    childWindow.webContents.setZoomFactor(1);
  });
  childWindow.setMenu(null);
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    const vitePorts = [5173, 5174, 5175, 5176, 5177];
    let currentPortIndex = 0;
    const tryLoadVite = () => {
      if (currentPortIndex >= vitePorts.length) {
        logger.error("所有Vite端口都尝试失败，无法加载开发服务器");
        return;
      }
      const vitePort = vitePorts[currentPortIndex];
      const viteUrl = `http://localhost:${vitePort}?window=settings`;
      logger.info(`Trying to load Vite development server for child window: ${viteUrl}`);
      childWindow.webContents.removeAllListeners("did-fail-load");
      childWindow.webContents.removeAllListeners("did-finish-load");
      childWindow.webContents.once("did-fail-load", (event, errorCode, errorDescription) => {
        logger.error(`Child window page load failed: ${errorDescription} (Error code: ${errorCode})`);
        currentPortIndex++;
        logger.info(`Trying alternative port ${vitePorts[currentPortIndex]}`);
        tryLoadVite();
      });
      childWindow.webContents.once("did-finish-load", () => {
        logger.info("Child window page loaded successfully");
      });
      childWindow.loadURL(viteUrl);
    };
    tryLoadVite();
  } else {
    const rendererHtmlPath = path__default.resolve(process.cwd(), "dist/renderer/index.html");
    logger.debug("app-window.ts: 子窗口渲染进程HTML路径:", rendererHtmlPath);
    childWindow.loadFile(rendererHtmlPath, { query: { window: "settings" } });
  }
  childWindow.webContents.openDevTools({ mode: "detach" });
  return childWindow;
}
const LIN_FRAME_LENGTH = 16;
const LIN_MODE_COMMAND = 17;
const LIN_HOST_SEND = 34;
const LIN_READ_SLAVE = 51;
const LIN_SLAVE_RECEIVE = 68;
class LinCommandBuilder {
  // 计算校验和（补码和）
  static calculateChecksum(data, length) {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += data[i];
    }
    sum = (~sum & 255) + 1 & 255;
    return sum;
  }
  // 模式切换命令
  static buildModeCommand(mode, baudRate) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    frame[0] = LIN_MODE_COMMAND;
    frame[1] = mode;
    frame[2] = baudRate >> 8 & 255;
    frame[3] = baudRate & 255;
    for (let i = 4; i < 15; i++) {
      frame[i] = 0;
    }
    frame[15] = this.calculateChecksum(frame, 15);
    return frame;
  }
  // 主机发送数据命令
  static buildHostSendCommand(sendId, sendStr, length, checkType) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    frame[0] = LIN_HOST_SEND;
    frame[1] = 0;
    frame[2] = sendId;
    frame[3] = 0;
    frame[4] = checkType === "V1" ? 1 : 2;
    frame[5] = length;
    if (sendStr && length > 0) {
      let si = 0;
      for (let i = 0; i < length && i < 8; i++) {
        if (si + 2 <= sendStr.length) {
          const hexStr = sendStr.substring(si, si + 2);
          frame[i + 6] = parseInt(hexStr, 16);
          si += 3;
        }
      }
    }
    frame[15] = this.calculateChecksum(frame, 15);
    return frame;
  }
  // 读取从机数据命令
  static buildReadSlaveCommand(readId, length, checkType) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    frame[0] = LIN_READ_SLAVE;
    frame[1] = 1;
    frame[2] = readId;
    frame[3] = 1;
    frame[4] = checkType === "V1" ? 1 : 2;
    frame[5] = length;
    for (let i = 6; i < 15; i++) {
      frame[i] = 0;
    }
    frame[15] = this.calculateChecksum(frame, 15);
    return frame;
  }
}
class LinFrameParser {
  // 计算V1校验和（只包含数据字节）
  static calculateV1Checksum(id, data, length) {
    let sum = 0;
    for (let i = 6; i < 6 + length && i < 14; i++) {
      sum += data[i];
    }
    return sum & 255;
  }
  // 计算V2校验和（包含ID和数据字节）
  static calculateV2Checksum(id, data, length) {
    let sum = id;
    for (let i = 6; i < 6 + length && i < 14; i++) {
      sum += data[i];
    }
    return sum & 255;
  }
  // 解析接收到的LIN帧
  static parseFrame(data) {
    if (data.length !== 16) {
      return null;
    }
    const frameType = data[0];
    let result = {
      type: frameType,
      raw: data,
      id: "",
      direction: "",
      channel: "",
      data: "",
      status: "",
      checksum: "",
      length: 0
    };
    switch (frameType) {
      case LIN_READ_SLAVE:
        result.channel = data[1].toString();
        result.id = data[2].toString(16).toUpperCase().padStart(2, "0");
        result.direction = "接收";
        result.length = data[5];
        let dataStr = "";
        for (let i = 6; i < result.length + 6 && i < 14; i++) {
          dataStr += data[i].toString(16).toUpperCase().padStart(2, "0") + " ";
        }
        result.data = dataStr.trim();
        result.checksum = data[14].toString(16).toUpperCase().padStart(2, "0");
        const receivedChecksum = parseInt(result.checksum, 16);
        const v1Checksum = this.calculateV1Checksum(data[2], data, result.length);
        const v2Checksum = this.calculateV2Checksum(data[2], data, result.length);
        if (receivedChecksum === v1Checksum) {
          result.status = "V1";
        } else if (receivedChecksum === v2Checksum) {
          result.status = "V2";
        } else {
          result.status = "校验和错误";
        }
        break;
      case LIN_SLAVE_RECEIVE:
        result.id = data[2].toString(16).toUpperCase().padStart(2, "0");
        result.direction = "接收";
        result.length = data[5];
        let slaveDataStr = "";
        for (let i = 6; i < result.length + 6 && i < 14; i++) {
          slaveDataStr += data[i].toString(16).toUpperCase().padStart(2, "0") + " ";
        }
        result.data = slaveDataStr.trim();
        result.checksum = data[14].toString(16).toUpperCase().padStart(2, "0");
        const slaveReceivedChecksum = parseInt(result.checksum, 16);
        const slaveV1Checksum = this.calculateV1Checksum(data[2], data, result.length);
        const slaveV2Checksum = this.calculateV2Checksum(data[2], data, result.length);
        if (slaveReceivedChecksum === slaveV1Checksum) {
          result.status = "V1";
        } else if (slaveReceivedChecksum === slaveV2Checksum) {
          result.status = "V2";
        } else {
          result.status = "校验和错误";
        }
        break;
      default:
        return null;
    }
    return result;
  }
}
const deviceSerialPorts = /* @__PURE__ */ new Map();
const deviceTypes = /* @__PURE__ */ new Map();
let activeDeviceId = null;
let lastPortList = [];
let mainWindowRef = null;
let portMonitoringInterval = null;
let lastPortEventTime = /* @__PURE__ */ new Map();
const PORT_EVENT_DEBOUNCE_TIME = 2e3;
class SerialPortManager {
  // 获取可用串口列表
  static async getPorts() {
    try {
      logger.debug("Starting to get serial port list...");
      const ports = await SerialPort.list();
      logger.debug("Raw serial port list obtained:", ports);
      if (!Array.isArray(ports)) {
        logger.error("Obtained port list is not an array:", ports);
        return [];
      }
      const mappedPorts = ports.map((port) => ({
        path: port.path || "",
        manufacturer: port.manufacturer || "未知",
        serialNumber: port.serialNumber || "无",
        pnpId: port.pnpId || "无",
        locationId: port.locationId || "无"
      })).filter((port) => port.path);
      logger.debug(`Found ${mappedPorts.length} available serial ports`);
      logger.debug("Converted serial port list:", mappedPorts);
      return mappedPorts;
    } catch (error) {
      logger.error("Failed to get serial port list:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }
  // 打开串口
  static openPort(path2, options, mainWindow2, deviceId) {
    try {
      logger.info(`Opening serial port ${path2} for device ${deviceId}`);
      if (typeof path2 !== "string") {
        logger.error(`Invalid serial port path: ${path2}, must be a string`);
        return Promise.resolve({ success: false, message: `串口路径必须是字符串类型: ${path2}` });
      }
      return new Promise((resolve) => {
        const closeAndOpen = async () => {
          if (deviceSerialPorts.has(deviceId)) {
            const existingPort = deviceSerialPorts.get(deviceId);
            if (existingPort && existingPort.isOpen) {
              logger.info(`Closing existing serial port for device ${deviceId}`);
              try {
                await existingPort.close();
                logger.info(`Existing serial port for device ${deviceId} closed successfully`);
              } catch (error) {
                logger.warn("Error closing existing serial port:", error instanceof Error ? error.message : String(error));
              }
            }
            deviceSerialPorts.delete(deviceId);
            deviceTypes.delete(deviceId);
          }
          const deviceType = options.deviceType || "LINTest-M";
          deviceTypes.set(deviceId, deviceType);
          let portConfig = {
            path: path2,
            baudRate: 460800,
            // 固定波特率，与C#代码一致
            dataBits: 8,
            stopBits: 1,
            parity: "none",
            flowControl: false,
            readTimeout: 500,
            writeTimeout: 500,
            // 添加写入超时
            autoOpen: false,
            dtrEnable: true,
            // DTR使能，与C#代码一致
            rtsEnable: true,
            // RTS使能，增加这个设置以确保硬件握手正常
            receivedBytesThreshold: 16,
            // 接收字节阈值，与C#代码一致
            encoding: "default"
            // 编码设置，与C#代码一致
          };
          if (deviceType === "LINTest-M") {
            logger.info(`Configuring LINTest-M device: ${deviceId}`);
            portConfig = {
              ...portConfig,
              baudRate: 460800,
              // LINTest-M设备的标准波特率
              dtrEnable: true,
              rtsEnable: true
            };
          }
          logger.debug(`Creating new SerialPort instance with configuration:`, portConfig);
          const port = new SerialPort(portConfig);
          let resolved = false;
          const resolveOnce = (result) => {
            if (!resolved) {
              resolved = true;
              logger.debug(`Serial port open result: ${result.success}, message: ${result.message}`);
              resolve(result);
            }
          };
          port.on("open", () => {
            logger.info(`Serial port ${path2} opened successfully for device ${deviceId}`);
            deviceSerialPorts.set(deviceId, port);
            activeDeviceId = deviceId;
            resolveOnce({ success: true, message: `串口 ${path2} 已打开` });
          });
          port.on("data", (data) => {
            logger.debug(`Received ${data.length} bytes from serial port ${path2}: ${data.toString("hex")}`);
            if (mainWindow2) {
              const frame = LinFrameParser.parseFrame(data);
              if (frame) {
                logger.debug(`Parsed LIN frame: ${JSON.stringify(frame)}`);
                mainWindow2.webContents.send("serial:lin-frame", {
                  ...frame,
                  deviceId
                  // 添加设备ID
                });
              } else {
                logger.debug("Failed to parse LIN frame");
              }
              mainWindow2.webContents.send("serial:raw-data", {
                data: data.toString("hex"),
                deviceId
                // 添加设备ID
              });
            }
          });
          port.on("error", (error) => {
            logger.error(`Serial port ${path2} error for device ${deviceId}: ${error.message}`);
            if (mainWindow2) {
              mainWindow2.webContents.send("serial:error", {
                error: error.message,
                deviceId
                // 添加设备ID
              });
            }
            resolveOnce({ success: false, message: `串口错误: ${error.message}` });
          });
          port.on("close", () => {
            logger.info(`Serial port ${path2} closed for device ${deviceId}`);
            deviceSerialPorts.delete(deviceId);
            if (activeDeviceId === deviceId) {
              activeDeviceId = null;
            }
            if (mainWindow2) {
              mainWindow2.webContents.send("serial:closed", {
                message: `串口 ${path2} 已关闭`,
                deviceId
                // 添加设备ID
              });
            }
          });
          logger.debug(`Attempting to open serial port: ${path2} for device ${deviceId}`);
          port.open((error) => {
            if (error) {
              logger.error(`Error opening serial port ${path2} for device ${deviceId}:`, error.message);
              resolveOnce({ success: false, message: `打开串口失败: ${error.message}` });
            }
          });
          setTimeout(() => {
            logger.error(`Timeout opening serial port: ${path2} for device ${deviceId}`);
            resolveOnce({ success: false, message: "打开串口超时" });
          }, 5e3);
        };
        closeAndOpen();
      });
    } catch (error) {
      logger.error("Unexpected error in openPort:", error instanceof Error ? error.message : String(error));
      return Promise.resolve({ success: false, message: `打开串口失败: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  // 关闭串口
  static async closePort(deviceId) {
    try {
      if (deviceId) {
        if (deviceSerialPorts.has(deviceId)) {
          const port = deviceSerialPorts.get(deviceId);
          if (port && port.isOpen) {
            logger.info(`Closing serial port for device ${deviceId}`);
            await port.close();
            logger.info(`Serial port for device ${deviceId} closed successfully`);
          }
          deviceSerialPorts.delete(deviceId);
          deviceTypes.delete(deviceId);
          if (activeDeviceId === deviceId) {
            activeDeviceId = null;
          }
          return { success: true, message: "串口已关闭" };
        }
        logger.debug(`No serial port to close for device ${deviceId}`);
        return { success: false, message: "该设备没有打开的串口" };
      } else {
        if (activeDeviceId && deviceSerialPorts.has(activeDeviceId)) {
          const port = deviceSerialPorts.get(activeDeviceId);
          if (port && port.isOpen) {
            logger.info(`Closing serial port for active device ${activeDeviceId}`);
            await port.close();
            logger.info(`Serial port for active device ${activeDeviceId} closed successfully`);
          }
          deviceSerialPorts.delete(activeDeviceId);
          deviceTypes.delete(activeDeviceId);
          activeDeviceId = null;
          return { success: true, message: "串口已关闭" };
        }
        logger.debug("No active serial port to close");
        return { success: false, message: "没有打开的串口" };
      }
    } catch (error) {
      logger.error("Failed to close serial port:", error instanceof Error ? error.message : String(error));
      return { success: false, message: `关闭串口失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  // 获取当前串口实例
  static getCurrentPort(deviceId) {
    if (deviceId) {
      return deviceSerialPorts.get(deviceId) || null;
    } else {
      return activeDeviceId ? deviceSerialPorts.get(activeDeviceId) || null : null;
    }
  }
  /**
   * 监控串口写入操作
   * @param deviceId 设备ID
   * @param data 要写入的数据
   */
  static async monitorWriteOperation(deviceId, data) {
    const serialPort = this.getCurrentPort(deviceId);
    if (!serialPort) {
      logger.warn(`监控写入操作失败: 设备 ${deviceId || "默认设备"} 未找到或未打开`);
      return;
    }
    logger.debug(`监控设备 ${deviceId || "默认设备"} 的写入操作`);
  }
  // 设置波特率
  static async setBaudRate(baudRate, deviceId) {
    try {
      const serialPort = this.getCurrentPort(deviceId);
      if (!serialPort) {
        return { success: false, message: "串口未打开" };
      }
      logger.info(`Setting baud rate to: ${baudRate} for device ${deviceId || activeDeviceId}`);
      serialPort.update({ baudRate });
      logger.info(`Baud rate set successfully to: ${baudRate} for device ${deviceId || activeDeviceId}`);
      return { success: true, message: `波特率已设置为: ${baudRate}` };
    } catch (error) {
      logger.error("Failed to set baud rate:", error instanceof Error ? error.message : String(error));
      return { success: false, message: `设置波特率失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  // 获取设备类型
  static getDeviceType(deviceId) {
    if (deviceId) {
      return deviceTypes.get(deviceId);
    }
    return activeDeviceId ? deviceTypes.get(activeDeviceId) : void 0;
  }
  // 初始化LINTest-M设备
  static async initializeLintestMDevice(deviceId) {
    try {
      const deviceType = this.getDeviceType(deviceId);
      if (deviceType !== "LINTest-M") {
        return { success: false, message: "设备类型不是LINTest-M" };
      }
      const serialPort = this.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: "串口未打开" };
      }
      logger.info(`Initializing LINTest-M device: ${deviceId}`);
      logger.info(`LINTest-M device initialized successfully: ${deviceId}`);
      return { success: true, message: "LINTest-M设备初始化成功" };
    } catch (error) {
      logger.error("Failed to initialize LINTest-M device:", error instanceof Error ? error.message : String(error));
      return { success: false, message: `初始化LINTest-M设备失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  // 为LINTest-M设备设置波特率
  static async setLintestMBaudRate(deviceId, baudRate) {
    try {
      const deviceType = this.getDeviceType(deviceId);
      if (deviceType !== "LINTest-M") {
        return { success: false, message: "设备类型不是LINTest-M" };
      }
      const serialPort = this.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: "串口未打开" };
      }
      logger.info(`Setting LINTest-M device baud rate: ${baudRate} for device ${deviceId}`);
      const supportedBaudRates = [4800, 9600, 10400, 19200, 2e4];
      if (!supportedBaudRates.includes(baudRate)) {
        logger.warn(`Baud rate ${baudRate} not in recommended list, but will try to set it anyway`);
      }
      serialPort.update({ baudRate });
      logger.info(`Baud rate set successfully: ${baudRate} for device ${deviceId}`);
      return { success: true, message: `波特率已设置为: ${baudRate}` };
    } catch (error) {
      logger.error("Failed to set LINTest-M device baud rate:", error instanceof Error ? error.message : String(error));
      return { success: false, message: `设置波特率失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  // 初始化串口监控
  static initializePortMonitoring(mainWindow2) {
    mainWindowRef = mainWindow2;
    this.startPortMonitoring();
    logger.info("Serial port monitoring initialized");
  }
  // 启动串口监控
  static startPortMonitoring() {
    if (portMonitoringInterval) {
      clearInterval(portMonitoringInterval);
    }
    this.detectPortChanges();
    portMonitoringInterval = setInterval(() => {
      this.detectPortChanges();
    }, 3e3);
    logger.info("Serial port monitoring started");
  }
  // 停止串口监控
  static stopPortMonitoring() {
    if (portMonitoringInterval) {
      clearInterval(portMonitoringInterval);
      portMonitoringInterval = null;
      logger.info("Serial port monitoring stopped");
    }
  }
  // 检测串口变化
  static async detectPortChanges() {
    try {
      const currentPorts = await this.getPorts();
      const addedPorts = currentPorts.filter(
        (currentPort) => !lastPortList.some((lastPort) => lastPort.path === currentPort.path)
      );
      const removedPorts = lastPortList.filter(
        (lastPort) => !currentPorts.some((currentPort) => currentPort.path === lastPort.path)
      );
      for (const port of addedPorts) {
        this.handlePortAdded(port);
      }
      for (const port of removedPorts) {
        this.handlePortRemoved(port);
      }
      lastPortList = currentPorts;
    } catch (error) {
      logger.error("Failed to detect port changes:", error instanceof Error ? error.message : String(error));
    }
  }
  // 处理串口添加
  static handlePortAdded(port) {
    const eventKey = `added-${port.path}`;
    const now = Date.now();
    if (lastPortEventTime.has(eventKey)) {
      const lastTime = lastPortEventTime.get(eventKey) || 0;
      if (now - lastTime < PORT_EVENT_DEBOUNCE_TIME) {
        logger.debug(`Ignoring duplicate port added event: ${port.path}`);
        return;
      }
    }
    lastPortEventTime.set(eventKey, now);
    logger.info(`Serial port added: ${port.path} (${port.manufacturer})`);
    if (mainWindowRef) {
      try {
        mainWindowRef.webContents.send("serial:port-added", port);
        logger.debug(`Sent port added event for: ${port.path}`);
      } catch (error) {
        logger.error(`Error sending port added event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  // 处理串口移除
  static handlePortRemoved(port) {
    const eventKey = `removed-${port.path}`;
    const now = Date.now();
    if (lastPortEventTime.has(eventKey)) {
      const lastTime = lastPortEventTime.get(eventKey) || 0;
      if (now - lastTime < PORT_EVENT_DEBOUNCE_TIME) {
        logger.debug(`Ignoring duplicate port removed event: ${port.path}`);
        return;
      }
    }
    lastPortEventTime.set(eventKey, now);
    logger.info(`Serial port removed: ${port.path} (${port.manufacturer})`);
    const affectedDevices = [];
    deviceSerialPorts.forEach((serialPort, deviceId) => {
    });
    if (mainWindowRef) {
      try {
        mainWindowRef.webContents.send("serial:port-removed", {
          port,
          affectedDevices
        });
        logger.debug(`Sent port removed event for: ${port.path} with ${affectedDevices.length} affected devices`);
      } catch (error) {
        logger.error(`Error sending port removed event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    deviceSerialPorts.forEach((serialPort, deviceId) => {
    });
  }
}
class ScanProgress {
  current = 0;
  total = 0;
  callbacks = [];
  isStarted = false;
  isCompleted = false;
  isFailed = false;
  errorMessage = "";
  currentLinId = "";
  currentBaudRate = "";
  /**
   * 开始进度跟踪
   * @param total 总任务数
   */
  start(total) {
    this.total = total;
    this.current = 0;
    this.isStarted = true;
    this.isCompleted = false;
    this.isFailed = false;
    this.errorMessage = "";
    this.currentLinId = "";
    this.notifyProgress();
  }
  /**
   * 更新进度
   * @param current 当前完成任务数
   * @param message 进度消息
   */
  update(current, message = "") {
    if (!this.isStarted || this.isCompleted || this.isFailed) {
      return;
    }
    this.current = Math.min(current, this.total);
    const linIdMatch = message.match(/ID 0x([0-9A-F]+)/);
    if (linIdMatch) {
      this.currentLinId = linIdMatch[1];
    }
    const baudRateMatch = message.match(/波特率 ([0-9]+)/);
    if (baudRateMatch) {
      this.currentBaudRate = baudRateMatch[1];
    }
    this.notifyProgress(message);
    if (this.current >= this.total) {
      this.complete();
    }
  }
  /**
   * 增加进度
   * @param increment 增加量
   * @param message 进度消息
   */
  increment(increment = 1, message = "") {
    this.update(this.current + increment, message);
  }
  /**
   * 完成进度跟踪
   */
  complete() {
    this.isCompleted = true;
    this.current = this.total;
    this.currentLinId = "";
    this.notifyProgress("扫描完成");
  }
  /**
   * 失败
   * @param errorMessage 错误消息
   */
  fail(errorMessage) {
    this.isFailed = true;
    this.errorMessage = errorMessage;
    this.currentLinId = "";
    this.notifyProgress(`扫描失败: ${errorMessage}`);
  }
  /**
   * 获取当前LIN ID
   * @returns 当前LIN ID
   */
  getCurrentLinId() {
    return this.currentLinId;
  }
  /**
   * 获取当前波特率
   * @returns 当前波特率
   */
  getCurrentBaudRate() {
    return this.currentBaudRate;
  }
  /**
   * 注册进度回调
   * @param callback 回调函数
   * @returns 取消注册函数
   */
  onProgress(callback) {
    this.callbacks.push(callback);
    if (this.isStarted) {
      this.notifyProgress();
    }
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }
  /**
   * 通知所有回调
   * @param message 进度消息
   */
  notifyProgress(message = "") {
    const progressMessage = message || `正在扫描... ${this.current}/${this.total}`;
    this.callbacks.forEach((callback) => {
      try {
        callback(this.current, this.total, progressMessage);
      } catch (error) {
        console.error("Progress callback error:", error);
      }
    });
  }
  /**
   * 获取当前进度
   * @returns 当前完成任务数
   */
  getCurrent() {
    return this.current;
  }
  /**
   * 获取总任务数
   * @returns 总任务数
   */
  getTotal() {
    return this.total;
  }
  /**
   * 获取进度百分比
   * @returns 进度百分比
   */
  getPercentage() {
    if (this.total === 0) {
      return 0;
    }
    return Math.round(this.current / this.total * 100);
  }
  /**
   * 是否已开始
   * @returns 是否已开始
   */
  getIsStarted() {
    return this.isStarted;
  }
  /**
   * 是否已完成
   * @returns 是否已完成
   */
  getIsCompleted() {
    return this.isCompleted;
  }
  /**
   * 是否失败
   * @returns 是否失败
   */
  getIsFailed() {
    return this.isFailed;
  }
  /**
   * 获取错误消息
   * @returns 错误消息
   */
  getErrorMessage() {
    return this.errorMessage;
  }
  /**
   * 重置进度
   */
  reset() {
    this.current = 0;
    this.total = 0;
    this.isStarted = false;
    this.isCompleted = false;
    this.isFailed = false;
    this.errorMessage = "";
  }
}
class SequentialScanStrategy {
  /**
   * 执行扫描
   * @param params 扫描参数
   * @param progress 进度管理器
   * @param abortSignal 中止信号
   * @returns 扫描结果数组
   */
  async scan(params, progress, abortSignal) {
    const results = [];
    let currentTask = 0;
    const deviceId = params.deviceId;
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      throw new Error("串口未打开");
    }
    const interval = params.interval || 50;
    logger.info(`开始扫描: 波特率 ${params.baudRates.join(", ")}, ID范围 ${params.idRange[0]}-${params.idRange[1]}, 间隔 ${interval}ms`);
    for (const baudRate of params.baudRates) {
      if (abortSignal?.aborted) {
        throw new Error("扫描已中止");
      }
      try {
        logger.debug(`开始扫描波特率: ${baudRate}`);
        await this.setBaudRate(baudRate, deviceId);
        for (let id = params.idRange[0]; id <= params.idRange[1]; id++) {
          if (abortSignal?.aborted) {
            throw new Error("扫描已中止");
          }
          currentTask++;
          progress.update(currentTask, `正在扫描: 波特率 ${baudRate}, ID 0x${id.toString(16).toUpperCase()}`);
          const result = await this.scanSingleSlave(id, baudRate, abortSignal, deviceId);
          if (result.success) {
            results.push(result);
            logger.info(`发现从机: ID 0x${id.toString(16).toUpperCase()}, 波特率 ${baudRate}, 数据长度 ${result.dataLength}, 数据 ${result.data}`);
            try {
              const scanManager = getScanManager();
              scanManager.emitScanResultEvent(result);
              logger.debug("开始等待用户输入...");
              const continueScanning = await scanManager.waitForUserInput();
              logger.debug("用户输入已获取，继续扫描:", continueScanning);
              if (abortSignal?.aborted) {
                logger.info("扫描已中止，退出扫描过程");
                throw new Error("扫描已中止");
              }
              if (!continueScanning) {
                logger.info("用户选择停止扫描，退出扫描过程");
                throw new Error("用户选择停止扫描");
              }
              logger.info("用户选择继续扫描，继续执行扫描过程");
              progress.update(currentTask, `继续扫描: 波特率 ${baudRate}, ID 0x${id.toString(16).toUpperCase()}`);
              await new Promise((resolve) => setTimeout(resolve, 10));
              logger.debug("继续扫描延迟完成，准备扫描下一个ID");
            } catch (error) {
              if (error instanceof Error && error.message === "用户选择停止扫描") {
                throw error;
              }
              logger.warn("发送扫描结果事件失败:", error);
            }
          }
          await new Promise((resolve) => setTimeout(resolve, Math.min(interval, 15)));
        }
        logger.debug(`波特率 ${baudRate} 扫描完成`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`波特率 ${baudRate} 扫描失败: ${errorMessage}`);
      }
    }
    logger.info(`扫描完成，共发现 ${results.length} 个从机`);
    return results;
  }
  /**
   * 设置波特率
   * @param baudRate 波特率
   * @param deviceId 设备ID
   */
  async setBaudRate(baudRate, deviceId) {
    try {
      const currentStatus = await LinControllerManager.getCurrentStatus();
      if (currentStatus.baudRate === baudRate && currentStatus.mode === 1) {
        logger.debug(`波特率已为: ${baudRate}，无需重新设置`);
        return;
      }
      const baudResult = await LinControllerManager.setBaudRate(baudRate, deviceId);
      if (!baudResult.success) {
        throw new Error(`设置波特率失败: ${baudResult.message}`);
      }
      if (currentStatus.mode !== 1) {
        const modeResult = await LinControllerManager.setMode(1, deviceId);
        if (!modeResult.success) {
          throw new Error(`切换到主机模式失败: ${modeResult.message}`);
        }
      }
      logger.debug(`波特率已设置为: ${baudRate}`);
    } catch (error) {
      logger.error(`设置波特率时出错: ${error}`);
      throw error;
    }
  }
  /**
   * 扫描单个从机
   * @param id 从机ID
   * @param baudRate 波特率
   * @param abortSignal 中止信号
   * @param deviceId 设备ID
   * @returns 扫描结果
   */
  async scanSingleSlave(id, baudRate, abortSignal, deviceId) {
    logger.debug(`开始扫描从机ID: ${id}, 波特率: ${baudRate}, 初始校验类型: V1, 初始长度: 1`);
    const quickResult = await this.determineDataLength(id, baudRate, "V1", abortSignal, deviceId, 1);
    if (!quickResult.success || !quickResult.data) {
      logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备无数据反馈，跳过`);
      return this.createFailedResult(id, baudRate, "无数据");
    }
    logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备有数据反馈，开始按长度1-8循环扫描`);
    for (let length = 1; length <= 8; length++) {
      if (abortSignal?.aborted) {
        throw new Error("扫描已中止");
      }
      const v1Result = await this.determineDataLength(id, baudRate, "V1", abortSignal, deviceId, length);
      if (v1Result.success && v1Result.checkType && (v1Result.checkType === "V1" || v1Result.checkType === "V2")) {
        logger.info(`发现从机: ID 0x${id.toString(16).toUpperCase()}, 波特率 ${baudRate}, 数据长度 ${v1Result.dataLength}, 校验类型 ${v1Result.checkType}`);
        return {
          ...v1Result,
          hasData: true,
          needsVerification: true
        };
      }
    }
    logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备V1扫描无有效校验，开始以V2按长度1-8循环扫描`);
    for (let length = 1; length <= 8; length++) {
      if (abortSignal?.aborted) {
        throw new Error("扫描已中止");
      }
      const v2Result = await this.determineDataLength(id, baudRate, "V2", abortSignal, deviceId, length);
      if (v2Result.success && v2Result.checkType && (v2Result.checkType === "V1" || v2Result.checkType === "V2")) {
        logger.info(`发现从机: ID 0x${id.toString(16).toUpperCase()}, 波特率 ${baudRate}, 数据长度 ${v2Result.dataLength}, 校验类型 ${v2Result.checkType}`);
        return {
          ...v2Result,
          hasData: true,
          needsVerification: true
        };
      }
    }
    return this.createFailedResult(id, baudRate, "无有效校验");
  }
  /**
   * 确定数据长度
   * 通过校验和验证机制来实现和确认数据长度
   * @param id 从机ID
   * @param baudRate 波特率
   * @param checkType 校验类型
   * @param abortSignal 中止信号
   * @param deviceId 设备ID
   * @param length 自定义长度
   * @returns 扫描结果
   */
  async determineDataLength(id, baudRate, checkType, abortSignal, deviceId, length = 8) {
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      return this.createFailedResult(id, baudRate, "串口未打开");
    }
    try {
      if (abortSignal?.aborted) {
        throw new Error("扫描已中止");
      }
      const frame = LinCommandBuilder.buildReadSlaveCommand(id, length, checkType);
      logger.debug(`发送读取命令: ID=0x${id.toString(16).toUpperCase()}, 长度=${length}, 校验类型=${checkType}`);
      await serialPort.write(frame);
      await serialPort.drain();
      const response = await this.waitForResponse(serialPort, 300, abortSignal);
      if (response) {
        logger.debug(`接收到响应数据: ${response.toString("hex")}`);
        logger.debug(`原始串口数据（16位）: ${response.toString("hex")}`);
        logger.debug(`数据定义对比:`);
        logger.debug(`- 帧头: 0x${response[0].toString(16).padStart(2, "0")} (应为0x33)`);
        logger.debug(`- Channel: ${response[1]} (应为1)`);
        logger.debug(`- ID: 0x${response[2].toString(16).padStart(2, "0")}`);
        logger.debug(`- LIN DIR: ${response[3]} (应为1)`);
        logger.debug(`- Check Type: ${response[4]} (0=错误, 1=V1, 2=V2)`);
        logger.debug(`- Length: ${response[5]} (1-8)`);
        logger.debug(`- Data 0-7: ${response.slice(6, 14).toString("hex")}`);
        logger.debug(`- LIN Check: 0x${response[14].toString(16).padStart(2, "0")}`);
        logger.debug(`- CRC: 0x${response[15].toString(16).padStart(2, "0")}`);
        const parsedResult = this.parseResponse(id, baudRate, checkType, response);
        if (parsedResult.success) {
          const checkTypeByte = response[4];
          let detectedCheckType = "未知";
          if (checkTypeByte === 1) {
            detectedCheckType = "V1";
          } else if (checkTypeByte === 2) {
            detectedCheckType = "V2";
          }
          const dataLength = parsedResult.dataLength;
          if (dataLength > 0 && dataLength <= 8 && parsedResult.data) {
            logger.info(`成功确定ID为0x${id.toString(16).toUpperCase()}的设备数据长度: ${dataLength}，校验类型: ${detectedCheckType}`);
            let secondaryCheckResult = false;
            if (detectedCheckType === "V1" || detectedCheckType === "V2") {
              const calculatedChecksum = detectedCheckType === "V1" ? LinFrameParser.calculateV1Checksum(id, response, dataLength) : LinFrameParser.calculateV2Checksum(id, response, dataLength);
              const receivedChecksum = response[14];
              secondaryCheckResult = calculatedChecksum === receivedChecksum;
              logger.debug(`二次校验结果: ${secondaryCheckResult}, 计算得到的校验和: ${calculatedChecksum.toString(16).toUpperCase()}, 接收到的校验和: ${receivedChecksum.toString(16).toUpperCase()}`);
            }
            return {
              ...parsedResult,
              checkType: detectedCheckType,
              detectedChecksumType: detectedCheckType,
              hasData: true,
              needsVerification: true,
              // 标记需要用户验证
              checksumError: !secondaryCheckResult,
              // 根据二次校验结果设置
              secondaryCheck: true
              // 标记已进行二次校验
            };
          }
        } else {
          logger.debug(`解析响应失败: 校验和错误或格式不正确`);
        }
      }
    } catch (error) {
      logger.debug(`读取数据时失败: ${error}`);
    }
    logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备没有数据反馈`);
    return {
      id,
      baudRate,
      dataLength: 0,
      checkType,
      data: "",
      success: false,
      hasData: false
    };
  }
  /**
   * 等待响应
   * @param serialPort 串口实例
   * @param timeout 超时时间（毫秒）
   * @param abortSignal 中止信号
   * @returns 响应数据
   */
  async waitForResponse(serialPort, timeout, abortSignal) {
    return new Promise((resolve) => {
      let timeoutId;
      let responseBuffer = Buffer.alloc(0);
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);
      const onData = (data) => {
        responseBuffer = Buffer.concat([responseBuffer, data]);
        if (responseBuffer.length >= 16) {
          cleanup();
          resolve(responseBuffer.slice(0, 16));
        }
      };
      const onError = () => {
        cleanup();
        resolve(null);
      };
      let cleanup = () => {
        clearTimeout(timeoutId);
        serialPort.off("data", onData);
        serialPort.off("error", onError);
      };
      serialPort.on("data", onData);
      serialPort.on("error", onError);
      if (abortSignal) {
        const onAbort = () => {
          cleanup();
          resolve(null);
        };
        abortSignal.addEventListener("abort", onAbort);
        cleanup = () => {
          clearTimeout(timeoutId);
          serialPort.off("data", onData);
          serialPort.off("error", onError);
          abortSignal?.removeEventListener("abort", onAbort);
        };
      }
    });
  }
  /**
   * 解析响应
   * @param id 从机ID
   * @param baudRate 波特率
   * @param checkType 校验类型
   * @param response 响应数据
   * @returns 扫描结果
   */
  parseResponse(id, baudRate, checkType, response) {
    try {
      if (response.length !== 16) {
        return this.createFailedResult(id, baudRate, "响应长度错误");
      }
      if (response[0] !== 51 && response[0] !== 68) {
        return this.createFailedResult(id, baudRate, "无效的响应帧类型");
      }
      if (response[2] !== id) {
        return this.createFailedResult(id, baudRate, "ID不匹配");
      }
      const dataLength = response[5] || 0;
      let data = "";
      for (let i = 6; i < 6 + dataLength && i < 14; i++) {
        const byte = response[i];
        if (byte !== void 0) {
          data += byte.toString(16).toUpperCase().padStart(2, "0") + " ";
        }
      }
      data = data.trim();
      logger.debug(`从机响应数据帧: ${response.toString("hex")}`);
      const checkTypeByte = response[4];
      logger.debug(`读取到的校验和类型字节: ${checkTypeByte}`);
      const receivedChecksum = response[14];
      const receivedChecksumHex = receivedChecksum.toString(16).toUpperCase().padStart(2, "0");
      logger.debug(`接收到的校验和（第15位）: ${receivedChecksumHex}`);
      logger.debug(`原始串口数据: ${response.toString("hex")}`);
      const crcChecksum = response[15];
      const crcChecksumHex = crcChecksum.toString(16).toUpperCase().padStart(2, "0");
      logger.debug(`接收到的CRC校验和（第16位）: ${crcChecksumHex}`);
      const v1Checksum = LinFrameParser.calculateV1Checksum(id, response, dataLength);
      const v2Checksum = LinFrameParser.calculateV2Checksum(id, response, dataLength);
      logger.debug(`计算得到的V1校验和: ${v1Checksum.toString(16).toUpperCase().padStart(2, "0")}`);
      logger.debug(`计算得到的V2校验和: ${v2Checksum.toString(16).toUpperCase().padStart(2, "0")}`);
      let calculatedCrc = 0;
      for (let i = 0; i < 15; i++) {
        calculatedCrc += response[i];
      }
      calculatedCrc = (~calculatedCrc & 255) + 1 & 255;
      logger.debug(`计算得到的CRC校验和: ${calculatedCrc.toString(16).toUpperCase().padStart(2, "0")}`);
      let detectedChecksumType = "未知";
      let isChecksumCorrect = false;
      if (checkTypeByte === 1) {
        detectedChecksumType = "V1";
        isChecksumCorrect = receivedChecksum === v1Checksum;
        logger.debug(`根据Check-Type字段确定校验和类型为V1，验证结果: ${isChecksumCorrect ? "通过" : "失败"}`);
      } else if (checkTypeByte === 2) {
        detectedChecksumType = "V2";
        isChecksumCorrect = receivedChecksum === v2Checksum;
        logger.debug(`根据Check-Type字段确定校验和类型为V2，验证结果: ${isChecksumCorrect ? "通过" : "失败"}`);
      } else if (checkTypeByte === 0) {
        if (receivedChecksum === v1Checksum) {
          detectedChecksumType = "V1";
          isChecksumCorrect = true;
          logger.debug(`校验和错误，自动检测为V1，验证通过`);
        } else if (receivedChecksum === v2Checksum) {
          detectedChecksumType = "V2";
          isChecksumCorrect = true;
          logger.debug(`校验和错误，自动检测为V2，验证通过`);
        } else {
          logger.debug(`校验和错误，无法自动检测校验和类型`);
        }
      } else {
        if (receivedChecksum === v1Checksum) {
          detectedChecksumType = "V1";
          isChecksumCorrect = true;
          logger.debug(`Check-Type字段无效，自动检测为V1，验证通过`);
        } else if (receivedChecksum === v2Checksum) {
          detectedChecksumType = "V2";
          isChecksumCorrect = true;
          logger.debug(`Check-Type字段无效，自动检测为V2，验证通过`);
        } else {
          logger.debug(`Check-Type字段无效，无法自动检测校验和类型`);
        }
      }
      return {
        id,
        baudRate,
        dataLength,
        checkType: detectedChecksumType,
        data,
        checksum: receivedChecksumHex,
        detectedChecksumType,
        success: true,
        checksumError: !isChecksumCorrect
      };
    } catch (error) {
      return this.createFailedResult(id, baudRate, "解析响应失败");
    }
  }
  /**
   * 创建失败结果
   * @param id 从机ID
   * @param baudRate 波特率
   * @param errorMessage 错误消息
   * @returns 失败的扫描结果
   */
  createFailedResult(id, baudRate, errorMessage) {
    return {
      id,
      baudRate,
      dataLength: 0,
      checkType: "V1",
      data: "",
      checksum: "",
      detectedChecksumType: "未知",
      success: false,
      checksumError: true
    };
  }
  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getName() {
    return "顺序扫描";
  }
  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getDescription() {
    return "按顺序尝试每个波特率和ID组合，可靠性高，适合大多数场景";
  }
}
class ParallelScanStrategy {
  maxParallelism = 5;
  // 最大并行数
  /**
   * 执行扫描
   * @param params 扫描参数
   * @param progress 进度管理器
   * @param abortSignal 中止信号
   * @returns 扫描结果数组
   */
  async scan(params, progress, abortSignal) {
    const results = [];
    let currentTask = 0;
    const deviceId = params.deviceId;
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      throw new Error("串口未打开");
    }
    const interval = params.interval || 100;
    for (const baudRate of params.baudRates) {
      if (abortSignal?.aborted) {
        throw new Error("扫描已中止");
      }
      try {
        await this.setBaudRate(baudRate, deviceId);
        const ids = [];
        for (let id = params.idRange[0]; id <= params.idRange[1]; id++) {
          ids.push(id);
        }
        const batches = this.splitIntoBatches(ids, this.maxParallelism);
        for (const batch of batches) {
          if (abortSignal?.aborted) {
            throw new Error("扫描已中止");
          }
          const batchPromises = batch.map((id) => {
            return this.scanSingleSlave(id, baudRate, abortSignal, deviceId);
          });
          const batchResults = await Promise.all(batchPromises);
          for (const result of batchResults) {
            currentTask++;
            progress.update(currentTask, `正在扫描: 波特率 ${baudRate}, ID 0x${result.id.toString(16).toUpperCase()}`);
            if (result.success) {
              results.push(result);
              logger.info(`发现从机: ID 0x${result.id.toString(16).toUpperCase()}, 波特率 ${baudRate}`);
            }
          }
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`波特率 ${baudRate} 扫描失败: ${errorMessage}`);
      }
    }
    return results;
  }
  /**
   * 将数组分成多个批次
   * @param array 原始数组
   * @param batchSize 批次大小
   * @returns 批次数组
   */
  splitIntoBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }
  /**
   * 设置波特率
   * @param baudRate 波特率
   * @param deviceId 设备ID
   */
  async setBaudRate(baudRate, deviceId) {
    await LinControllerManager.setMode(0, deviceId);
    const baudResult = await LinControllerManager.setBaudRate(baudRate, deviceId);
    if (!baudResult.success) {
      throw new Error(`设置波特率失败: ${baudResult.message}`);
    }
    const modeResult = await LinControllerManager.setMode(1, deviceId);
    if (!modeResult.success) {
      throw new Error(`切换到主机模式失败: ${modeResult.message}`);
    }
    logger.debug(`波特率已设置为: ${baudRate}`);
  }
  /**
   * 扫描单个从机
   * @param id 从机ID
   * @param baudRate 波特率
   * @param abortSignal 中止信号
   * @param deviceId 设备ID
   * @returns 扫描结果
   */
  async scanSingleSlave(id, baudRate, abortSignal, deviceId) {
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      return this.createFailedResult(id, baudRate, "串口未打开");
    }
    const checkTypes = ["V1", "V2"];
    for (const checkType of checkTypes) {
      try {
        if (abortSignal?.aborted) {
          throw new Error("扫描已中止");
        }
        const command = LinCommandBuilder.buildReadSlaveCommand(id, 8, checkType);
        await serialPort.write(command);
        await serialPort.drain();
        const response = await this.waitForResponse(serialPort, 800, abortSignal);
        if (response) {
          return this.parseResponse(id, baudRate, checkType, response);
        }
      } catch (error) {
        logger.debug(`扫描从机 ${id} 失败 (${checkType}): ${error}`);
      }
    }
    return this.createFailedResult(id, baudRate, "无响应");
  }
  /**
   * 等待响应
   * @param serialPort 串口实例
   * @param timeout 超时时间（毫秒）
   * @param abortSignal 中止信号
   * @returns 响应数据
   */
  async waitForResponse(serialPort, timeout, abortSignal) {
    return new Promise((resolve) => {
      let timeoutId;
      let responseBuffer = Buffer.alloc(0);
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);
      const onData = (data) => {
        responseBuffer = Buffer.concat([responseBuffer, data]);
        if (responseBuffer.length >= 16) {
          cleanup();
          resolve(responseBuffer.slice(0, 16));
        }
      };
      const onError = () => {
        cleanup();
        resolve(null);
      };
      let cleanup = () => {
        clearTimeout(timeoutId);
        serialPort.off("data", onData);
        serialPort.off("error", onError);
      };
      serialPort.on("data", onData);
      serialPort.on("error", onError);
      if (abortSignal) {
        const onAbort = () => {
          cleanup();
          resolve(null);
        };
        abortSignal.addEventListener("abort", onAbort);
        cleanup = () => {
          clearTimeout(timeoutId);
          serialPort.off("data", onData);
          serialPort.off("error", onError);
          abortSignal?.removeEventListener("abort", onAbort);
        };
      }
    });
  }
  /**
   * 解析响应
   * @param id 从机ID
   * @param baudRate 波特率
   * @param checkType 校验类型
   * @param response 响应数据
   * @returns 扫描结果
   */
  parseResponse(id, baudRate, checkType, response) {
    try {
      if (response.length !== 16) {
        return this.createFailedResult(id, baudRate, "响应长度错误");
      }
      if (response[0] !== 51 && response[0] !== 68) {
        return this.createFailedResult(id, baudRate, "无效的响应帧类型");
      }
      if (response[2] !== id) {
        return this.createFailedResult(id, baudRate, "ID不匹配");
      }
      const dataLength = response[5] || 0;
      let data = "";
      for (let i = 6; i < 6 + dataLength && i < 14; i++) {
        const byte = response[i];
        if (byte !== void 0) {
          data += byte.toString(16).toUpperCase().padStart(2, "0") + " ";
        }
      }
      data = data.trim();
      logger.debug(`从机响应数据帧: ${response.toString("hex")}`);
      const checkTypeByte = response[4];
      logger.debug(`读取到的校验类型字节: ${checkTypeByte}`);
      let detectedChecksumType = "帧头";
      if (checkTypeByte === 0) {
        detectedChecksumType = "校验和错误";
        logger.debug(`解析得到的校验类型: 校验和错误`);
      } else if (checkTypeByte === 1) {
        detectedChecksumType = "V1";
        logger.debug(`解析得到的校验类型: V1`);
      } else if (checkTypeByte === 2) {
        detectedChecksumType = "V2";
        logger.debug(`解析得到的校验类型: V2`);
      } else {
        logger.debug(`解析得到的校验类型: 帧头`);
      }
      const receivedChecksum = response[14];
      const receivedChecksumHex = receivedChecksum.toString(16).toUpperCase().padStart(2, "0");
      logger.debug(`接收到的校验和: ${receivedChecksumHex}`);
      const dataBytes = [];
      for (let i = 6; i < 6 + dataLength && i < 14; i++) {
        dataBytes.push(response[i]);
      }
      logger.debug(`提取的数据字节: ${dataBytes}`);
      const calculateCheckSum = (data2, length) => {
        let sum = 0;
        for (let i = 0; i < length; i++) {
          sum += data2[i];
        }
        sum = (~sum & 255) + 1;
        return sum & 255;
      };
      const crcChecksum = calculateCheckSum(response, 15);
      logger.debug(`使用CRC算法计算得到的校验和: ${crcChecksum.toString(16).toUpperCase().padStart(2, "0")}`);
      const isChecksumCorrect = receivedChecksum === crcChecksum;
      logger.debug(`校验和验证结果: ${isChecksumCorrect ? "通过" : "失败"}`);
      return {
        id,
        baudRate,
        dataLength,
        checkType: detectedChecksumType,
        data,
        checksum: receivedChecksumHex,
        detectedChecksumType,
        success: true,
        checksumError: !isChecksumCorrect
      };
    } catch (error) {
      return this.createFailedResult(id, baudRate, "解析响应失败");
    }
  }
  /**
   * 创建失败结果
   * @param id 从机ID
   * @param baudRate 波特率
   * @param errorMessage 错误消息
   * @returns 失败的扫描结果
   */
  createFailedResult(id, baudRate, errorMessage) {
    return {
      id,
      baudRate,
      dataLength: 0,
      checkType: "V1",
      data: "",
      success: false
    };
  }
  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getName() {
    return "并行扫描";
  }
  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getDescription() {
    return "同时扫描多个ID，提高扫描效率，适合需要快速扫描的场景";
  }
}
class AdaptiveScanStrategy {
  timeout = 1e3;
  // 默认超时时间
  retryCount = 2;
  // 默认重试次数
  successThreshold = 3;
  // 成功次数阈值
  currentSuccessCount = 0;
  /**
   * 执行扫描
   * @param params 扫描参数
   * @param progress 进度管理器
   * @param abortSignal 中止信号
   * @returns 扫描结果数组
   */
  async scan(params, progress, abortSignal) {
    const results = [];
    let currentTask = 0;
    const deviceId = params.deviceId;
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      throw new Error("串口未打开");
    }
    const userInterval = params.interval || 80;
    for (const baudRate of params.baudRates) {
      if (abortSignal?.aborted) {
        throw new Error("扫描已中止");
      }
      try {
        this.currentSuccessCount = 0;
        await this.setBaudRate(baudRate, deviceId);
        for (let id = params.idRange[0]; id <= params.idRange[1]; id++) {
          if (abortSignal?.aborted) {
            throw new Error("扫描已中止");
          }
          currentTask++;
          progress.update(currentTask, `正在扫描: 波特率 ${baudRate}, ID 0x${id.toString(16).toUpperCase()}`);
          const result = await this.scanSingleSlave(id, baudRate, abortSignal, deviceId);
          if (result.success) {
            results.push(result);
            this.currentSuccessCount++;
            logger.info(`发现从机: ID 0x${id.toString(16).toUpperCase()}, 波特率 ${baudRate}`);
            this.adjustParameters();
          }
          await new Promise((resolve) => setTimeout(resolve, this.getDynamicDelay(userInterval)));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`波特率 ${baudRate} 扫描失败: ${errorMessage}`);
      } finally {
        this.resetParameters();
      }
    }
    return results;
  }
  /**
   * 设置波特率
   * @param baudRate 波特率
   * @param deviceId 设备ID
   */
  async setBaudRate(baudRate, deviceId) {
    await LinControllerManager.setMode(0, deviceId);
    const baudResult = await LinControllerManager.setBaudRate(baudRate, deviceId);
    if (!baudResult.success) {
      throw new Error(`设置波特率失败: ${baudResult.message}`);
    }
    const modeResult = await LinControllerManager.setMode(1, deviceId);
    if (!modeResult.success) {
      throw new Error(`切换到主机模式失败: ${modeResult.message}`);
    }
    logger.debug(`波特率已设置为: ${baudRate}`);
  }
  /**
   * 扫描单个从机
   * @param id 从机ID
   * @param baudRate 波特率
   * @param abortSignal 中止信号
   * @param deviceId 设备ID
   * @returns 扫描结果
   */
  async scanSingleSlave(id, baudRate, abortSignal, deviceId) {
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      return this.createFailedResult(id, baudRate, "串口未打开");
    }
    const checkTypes = ["V1", "V2"];
    for (const checkType of checkTypes) {
      for (let retry = 0; retry < this.retryCount; retry++) {
        try {
          if (abortSignal?.aborted) {
            throw new Error("扫描已中止");
          }
          const command = LinCommandBuilder.buildReadSlaveCommand(id, 8, checkType);
          await serialPort.write(command);
          await serialPort.drain();
          const response = await this.waitForResponse(serialPort, this.timeout, abortSignal);
          if (response) {
            return this.parseResponse(id, baudRate, checkType, response);
          }
        } catch (error) {
          logger.debug(`扫描从机 ${id} 失败 (${checkType}, 重试 ${retry + 1}): ${error}`);
        }
      }
    }
    return this.createFailedResult(id, baudRate, "无响应");
  }
  /**
   * 等待响应
   * @param serialPort 串口实例
   * @param timeout 超时时间（毫秒）
   * @param abortSignal 中止信号
   * @returns 响应数据
   */
  async waitForResponse(serialPort, timeout, abortSignal) {
    return new Promise((resolve) => {
      let timeoutId;
      let responseBuffer = Buffer.alloc(0);
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);
      const onData = (data) => {
        responseBuffer = Buffer.concat([responseBuffer, data]);
        if (responseBuffer.length >= 16) {
          cleanup();
          resolve(responseBuffer.slice(0, 16));
        }
      };
      const onError = () => {
        cleanup();
        resolve(null);
      };
      let cleanup = () => {
        clearTimeout(timeoutId);
        serialPort.off("data", onData);
        serialPort.off("error", onError);
      };
      serialPort.on("data", onData);
      serialPort.on("error", onError);
      if (abortSignal) {
        const onAbort = () => {
          cleanup();
          resolve(null);
        };
        abortSignal.addEventListener("abort", onAbort);
        cleanup = () => {
          clearTimeout(timeoutId);
          serialPort.off("data", onData);
          serialPort.off("error", onError);
          abortSignal?.removeEventListener("abort", onAbort);
        };
      }
    });
  }
  /**
   * 解析响应
   * @param id 从机ID
   * @param baudRate 波特率
   * @param checkType 校验类型
   * @param response 响应数据
   * @returns 扫描结果
   */
  parseResponse(id, baudRate, checkType, response) {
    try {
      if (response.length !== 16) {
        return this.createFailedResult(id, baudRate, "响应长度错误");
      }
      if (response[0] !== 51 && response[0] !== 68) {
        return this.createFailedResult(id, baudRate, "无效的响应帧类型");
      }
      if (response[2] !== id) {
        return this.createFailedResult(id, baudRate, "ID不匹配");
      }
      const dataLength = response[5] || 0;
      let data = "";
      for (let i = 6; i < 6 + dataLength && i < 14; i++) {
        const byte = response[i];
        if (byte !== void 0) {
          data += byte.toString(16).toUpperCase().padStart(2, "0") + " ";
        }
      }
      data = data.trim();
      logger.debug(`从机响应数据帧: ${response.toString("hex")}`);
      const checkTypeByte = response[4];
      logger.debug(`读取到的校验类型字节: ${checkTypeByte}`);
      let detectedChecksumType = "帧头";
      if (checkTypeByte === 0) {
        detectedChecksumType = "校验和错误";
        logger.debug(`解析得到的校验类型: 校验和错误`);
      } else if (checkTypeByte === 1) {
        detectedChecksumType = "V1";
        logger.debug(`解析得到的校验类型: V1`);
      } else if (checkTypeByte === 2) {
        detectedChecksumType = "V2";
        logger.debug(`解析得到的校验类型: V2`);
      } else {
        logger.debug(`解析得到的校验类型: 帧头`);
      }
      const receivedChecksum = response[14];
      const receivedChecksumHex = receivedChecksum.toString(16).toUpperCase().padStart(2, "0");
      logger.debug(`接收到的校验和: ${receivedChecksumHex}`);
      const dataBytes = [];
      for (let i = 6; i < 6 + dataLength && i < 14; i++) {
        dataBytes.push(response[i]);
      }
      logger.debug(`提取的数据字节: ${dataBytes}`);
      const calculateCheckSum = (data2, length) => {
        let sum = 0;
        for (let i = 0; i < length; i++) {
          sum += data2[i];
        }
        sum = (~sum & 255) + 1;
        return sum & 255;
      };
      const crcChecksum = calculateCheckSum(response, 15);
      logger.debug(`使用CRC算法计算得到的校验和: ${crcChecksum.toString(16).toUpperCase().padStart(2, "0")}`);
      const isChecksumCorrect = receivedChecksum === crcChecksum;
      logger.debug(`校验和验证结果: ${isChecksumCorrect ? "通过" : "失败"}`);
      return {
        id,
        baudRate,
        dataLength,
        checkType: detectedChecksumType,
        data,
        checksum: receivedChecksumHex,
        detectedChecksumType,
        success: true,
        checksumError: !isChecksumCorrect
      };
    } catch (error) {
      return this.createFailedResult(id, baudRate, "解析响应失败");
    }
  }
  /**
   * 创建失败结果
   * @param id 从机ID
   * @param baudRate 波特率
   * @param errorMessage 错误消息
   * @returns 失败的扫描结果
   */
  createFailedResult(id, baudRate, errorMessage) {
    return {
      id,
      baudRate,
      dataLength: 0,
      checkType: "V1",
      data: "",
      success: false
    };
  }
  /**
   * 调整扫描参数
   */
  adjustParameters() {
    if (this.currentSuccessCount >= this.successThreshold) {
      if (this.timeout > 500) {
        this.timeout = Math.max(300, this.timeout - 100);
        logger.debug(`调整超时时间为: ${this.timeout}ms`);
      }
      if (this.retryCount > 1) {
        this.retryCount = 1;
        logger.debug(`调整重试次数为: ${this.retryCount}`);
      }
    }
  }
  /**
   * 获取动态延迟时间
   * @param userInterval 用户设置的扫描间隔（毫秒）
   * @returns 延迟时间（毫秒）
   */
  getDynamicDelay(userInterval) {
    if (this.currentSuccessCount >= this.successThreshold) {
      return Math.max(10, userInterval * 0.5);
    }
    return userInterval;
  }
  /**
   * 重置扫描参数
   */
  resetParameters() {
    this.timeout = 1e3;
    this.retryCount = 2;
    this.currentSuccessCount = 0;
  }
  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getName() {
    return "自适应扫描";
  }
  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getDescription() {
    return "根据响应情况动态调整扫描参数，平衡效率和可靠性，适合复杂环境";
  }
}
class ScanStrategyFactory {
  /**
   * 创建扫描策略
   * @param strategyType 策略类型
   * @returns 扫描策略实例
   */
  static createStrategy(strategyType) {
    switch (strategyType.toLowerCase()) {
      case "sequential":
        return new SequentialScanStrategy();
      case "parallel":
        return new ParallelScanStrategy();
      case "adaptive":
        return new AdaptiveScanStrategy();
      default:
        return new SequentialScanStrategy();
    }
  }
}
class ScanManager {
  strategy;
  progress;
  abortController = null;
  isScanning = false;
  isPaused = false;
  isWaitingForUserInput = false;
  scanId = null;
  userInputPromise = null;
  /**
   * 构造函数
   * @param strategyType 扫描策略类型
   */
  constructor(strategyType = "sequential") {
    this.strategy = ScanStrategyFactory.createStrategy(strategyType);
    this.progress = new ScanProgress();
  }
  /**
   * 设置扫描策略
   * @param strategyType 扫描策略类型
   */
  setStrategy(strategyType) {
    this.strategy = ScanStrategyFactory.createStrategy(strategyType);
    logger.info(`扫描策略已设置为: ${this.strategy.getName()}`);
  }
  /**
   * 获取当前扫描策略
   * @returns 当前扫描策略
   */
  getStrategy() {
    return this.strategy;
  }
  /**
   * 获取扫描进度管理器
   * @returns 扫描进度管理器
   */
  getProgress() {
    return this.progress;
  }
  /**
   * 开始扫描
   * @param params 扫描参数
   * @returns 扫描结果数组
   */
  async scan(params) {
    if (this.isScanning) {
      throw new Error("扫描已在进行中");
    }
    try {
      this.isScanning = true;
      this.isPaused = false;
      this.abortController = new AbortController();
      this.scanId = params.scanId || null;
      const totalTasks = params.baudRates.length * (params.idRange[1] - params.idRange[0] + 1);
      this.progress.start(totalTasks);
      logger.info(`开始扫描，策略: ${this.strategy.getName()}`);
      logger.debug("扫描参数:", params);
      const results = await this.strategy.scan(
        params,
        this.progress,
        this.abortController.signal
      );
      logger.info(`扫描完成，发现 ${results.length} 个从机`);
      return results;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logger.info("扫描已中止");
        this.progress.fail("扫描已中止");
        return [];
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`扫描失败: ${errorMessage}`);
      this.progress.fail(errorMessage);
      throw error;
    } finally {
      this.isScanning = false;
      this.isPaused = false;
      this.isWaitingForUserInput = false;
      this.abortController = null;
      this.scanId = null;
      this.userInputPromise = null;
    }
  }
  /**
   * 发送扫描结果事件
   * @param result 扫描结果
   */
  emitScanResultEvent(result) {
    if (this.scanId) {
      try {
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((window) => {
          try {
            window.webContents.send("scan:result", {
              scanId: this.scanId,
              result: {
                id: result.id,
                baudRate: result.baudRate,
                dataLength: result.dataLength,
                checkType: result.detectedChecksumType || result.checkType,
                data: result.data,
                checksum: result.checksum,
                detectedChecksumType: result.detectedChecksumType || result.checkType,
                success: result.success,
                checksumError: result.checksumError,
                hasData: result.hasData,
                needsVerification: result.needsVerification
              }
            });
            logger.debug(`发送扫描结果事件到窗口: ${JSON.stringify(result)}`);
          } catch (error) {
            logger.warn("向窗口发送扫描结果事件失败:", error);
          }
        });
      } catch (error) {
        logger.warn("发送扫描结果事件失败:", error);
      }
    }
  }
  /**
   * 等待用户输入
   * @returns Promise<boolean> 用户是否选择继续扫描
   */
  async waitForUserInput() {
    this.isWaitingForUserInput = true;
    logger.debug("开始等待用户输入，isWaitingForUserInput:", this.isWaitingForUserInput);
    return new Promise((resolve) => {
      const resolveUserInput = (value) => {
        this.isWaitingForUserInput = false;
        this.userInputPromise = null;
        logger.debug("用户输入已处理，选择:", value, "isWaitingForUserInput:", this.isWaitingForUserInput, "userInputPromise:", this.userInputPromise);
        resolve(value);
      };
      this.userInputPromise = { resolve: resolveUserInput };
      logger.debug("用户输入Promise已创建，userInputPromise:", this.userInputPromise !== null);
      if (this.abortController?.signal.aborted) {
        logger.debug("扫描已中止，自动选择停止");
        resolveUserInput(false);
      }
    });
  }
  /**
   * 处理用户输入
   * @param continueScanning 用户是否选择继续扫描
   */
  handleUserInput(continueScanning) {
    logger.debug("收到用户输入处理请求，继续扫描:", continueScanning, "isWaitingForUserInput:", this.isWaitingForUserInput, "userInputPromise存在:", this.userInputPromise !== null);
    if (this.userInputPromise && typeof this.userInputPromise.resolve === "function") {
      try {
        const promise = this.userInputPromise;
        promise.resolve(continueScanning);
        logger.debug("用户输入Promise已解析，继续扫描:", continueScanning);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`处理用户输入失败: ${errorMessage}`);
      }
    } else {
      logger.warn("用户输入处理失败: userInputPromise不存在或不包含resolve方法");
    }
  }
  /**
   * 检查是否正在等待用户输入
   * @returns boolean 是否正在等待用户输入
   */
  isWaitingForInput() {
    return this.isWaitingForUserInput;
  }
  /**
   * 检查是否正在等待用户输入
   * @returns boolean 是否正在等待用户输入
   */
  getIsWaitingForInput() {
    return this.isWaitingForUserInput;
  }
  /**
   * 暂停扫描
   */
  pause() {
    if (this.isScanning && !this.isPaused) {
      this.isPaused = true;
      logger.info("扫描已暂停");
      this.progress.updateMessage("扫描已暂停");
    }
  }
  /**
   * 恢复扫描
   */
  resume() {
    if (this.isScanning && this.isPaused) {
      this.isPaused = false;
      logger.info("扫描已恢复");
      this.progress.updateMessage("扫描已恢复");
    }
  }
  /**
   * 检查是否已暂停
   * @returns 是否已暂停
   */
  getIsPaused() {
    return this.isPaused;
  }
  /**
   * 中止扫描
   */
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      logger.info("扫描已中止");
    }
    this.isScanning = false;
    this.isPaused = false;
    this.isWaitingForUserInput = false;
    this.userInputPromise = null;
  }
  /**
   * 检查是否正在扫描
   * @returns 是否正在扫描
   */
  getIsScanning() {
    return this.isScanning;
  }
  /**
   * 重置扫描管理器
   */
  reset() {
    this.abort();
    this.progress.reset();
    this.isScanning = false;
    this.abortController = null;
  }
  /**
   * 注册进度回调
   * @param callback 回调函数
   * @returns 取消注册函数
   */
  onProgress(callback) {
    return this.progress.onProgress(callback);
  }
}
let globalScanManager = null;
function getScanManager() {
  if (!globalScanManager) {
    globalScanManager = new ScanManager();
  }
  return globalScanManager;
}
const linController = {
  currentMode: 0,
  // 当前运行模式：0待机 1主机 2从机 3监听
  currentBaudRate: 19200,
  // 默认LIN波特率
  isScanning: false,
  // 扫描状态
  scanResults: []
  // 扫描结果存储
};
class LinControllerManager {
  // static async setBaudRate(baudRate: number, deviceId?: string): Promise<CommandResult> {
  //   try {
  //     // 更新指定设备的LIN波特率
  //     // 注意：这里我们使用全局状态，实际项目中可能需要为每个设备维护独立状态
  //     linController.currentBaudRate = baudRate;
  //     return { success: true, message: `LIN波特率已设置为 ${baudRate}` };
  //   } catch (error) {
  //     console.error('设置LIN波特率失败:', error);
  //     return { success: false, message: `设置LIN波特率失败: ${(error as Error).message}` };
  //   }
  // }
  // 切换运行模式
  static async setMode(mode, deviceId) {
    try {
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: "串口未打开" };
      }
      if (mode < 0 || mode > 3) {
        return { success: false, message: "模式值超出范围（0-3）" };
      }
      if (linController.currentMode !== mode) {
        if (linController.currentMode !== 0) {
          logger.info(`当前模式: ${linController.currentMode}，需要先切换到待机模式`);
          const standbyFrame = LinCommandBuilder.buildModeCommand(0, linController.currentBaudRate);
          logger.debug("Switching to standby mode - sending frame:", standbyFrame.toString("hex"));
          const bytesWritten1 = await serialPort.write(standbyFrame);
          logger.debug(`Write standby frame successful, bytes written: ${bytesWritten1}`);
          await serialPort.drain();
          logger.debug("Standby frame drained successfully");
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        logger.info(`切换到目标模式: ${mode}`);
        const modeFrame = LinCommandBuilder.buildModeCommand(mode, linController.currentBaudRate);
        logger.debug("Switching to target mode - sending frame:", modeFrame.toString("hex"));
        const bytesWritten2 = await serialPort.write(modeFrame);
        logger.debug(`Write mode frame successful, bytes written: ${bytesWritten2}`);
        await serialPort.drain();
        logger.debug("Mode frame drained successfully");
        linController.currentMode = mode;
      }
      logger.info(`运行模式已切换为 ${mode}`);
      return { success: true, message: `运行模式已切换为 ${mode}` };
    } catch (error) {
      logger.error("Failed to switch operation mode:", error instanceof Error ? error.message : String(error));
      return { success: false, message: `切换运行模式失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  // 设置LIN波特率 
  static async setBaudRate(baudRate, deviceId) {
    try {
      logger.info(`开始设置波特率: ${baudRate}，设备ID: ${deviceId || "默认设备"}`);
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        logger.error(`串口未打开，设备ID: ${deviceId || "默认设备"}`);
        return { success: false, message: "串口未打开" };
      }
      logger.info(`获取到串口实例，设备ID: ${deviceId || "默认设备"}`);
      const validBaudRates = [4800, 9600, 10400, 19200, 2e4];
      if (!validBaudRates.includes(baudRate)) {
        logger.error(`无效的波特率值: ${baudRate}，设备ID: ${deviceId || "默认设备"}`);
        return { success: false, message: "无效的波特率值" };
      }
      if (linController.currentBaudRate === baudRate) {
        logger.info(`当前已经是目标波特率: ${baudRate}，无需切换，设备ID: ${deviceId || "默认设备"}`);
        return { success: true, message: "当前已经是目标波特率，无需切换" };
      }
      const originalMode = linController.currentMode;
      logger.info(`保存当前模式: ${originalMode}，设备ID: ${deviceId || "默认设备"}`);
      if (linController.currentMode !== 0) {
        logger.info(`当前模式: ${linController.currentMode}，需要先切换到待机模式以设置波特率，设备ID: ${deviceId || "默认设备"}`);
        const standbyFrame = LinCommandBuilder.buildModeCommand(0, linController.currentBaudRate);
        logger.debug(`设备ID: ${deviceId || "默认设备"}，切换到待机模式 - 发送帧: ${standbyFrame.toString("hex")}`);
        const bytesWritten1 = await serialPort.write(standbyFrame);
        logger.info(`设备ID: ${deviceId || "默认设备"}，写入待机模式命令成功，写入字节数: ${bytesWritten1}`);
        await serialPort.drain();
        logger.debug(`设备ID: ${deviceId || "默认设备"}，待机模式命令已刷新到串口`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        logger.debug(`设备ID: ${deviceId || "默认设备"}，等待100ms完成`);
      }
      logger.info(`设置新的波特率: ${baudRate}，设备ID: ${deviceId || "默认设备"}`);
      const baudRateFrame = LinCommandBuilder.buildModeCommand(0, baudRate);
      logger.debug(`设备ID: ${deviceId || "默认设备"}，设置新波特率 - 发送帧: ${baudRateFrame.toString("hex")}`);
      const bytesWritten2 = await serialPort.write(baudRateFrame);
      logger.info(`设备ID: ${deviceId || "默认设备"}，写入波特率设置命令成功，写入字节数: ${bytesWritten2}`);
      await serialPort.drain();
      logger.debug(`设备ID: ${deviceId || "默认设备"}，波特率设置命令已刷新到串口`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      logger.debug(`设备ID: ${deviceId || "默认设备"}，等待100ms完成`);
      if (originalMode !== 0) {
        logger.info(`切换回原来的模式: ${originalMode}，设备ID: ${deviceId || "默认设备"}`);
        const originalModeFrame = LinCommandBuilder.buildModeCommand(originalMode, baudRate);
        logger.debug(`设备ID: ${deviceId || "默认设备"}，切换回原模式 - 发送帧: ${originalModeFrame.toString("hex")}`);
        const bytesWritten3 = await serialPort.write(originalModeFrame);
        logger.info(`设备ID: ${deviceId || "默认设备"}，写入原模式命令成功，写入字节数: ${bytesWritten3}`);
        await serialPort.drain();
        logger.debug(`设备ID: ${deviceId || "默认设备"}，原模式命令已刷新到串口`);
        linController.currentMode = originalMode;
        logger.info(`设备ID: ${deviceId || "默认设备"}，当前模式已更新为: ${originalMode}`);
      }
      linController.currentBaudRate = baudRate;
      logger.info(`设备ID: ${deviceId || "默认设备"}，波特率已更新为: ${baudRate}`);
      logger.info(`波特率设置完成: ${baudRate}，设备ID: ${deviceId || "默认设备"}`);
      return { success: true, message: `波特率已设置为 ${baudRate}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`设置波特率失败，设备ID: ${deviceId || "默认设备"}，错误: ${errorMessage}`);
      return { success: false, message: `设置波特率失败: ${errorMessage}` };
    }
  }
  // 发送LIN数据帧
  static async sendData(params) {
    try {
      const deviceId = params.deviceId;
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: "串口未打开" };
      }
      if (!params.rawData && (params.id === void 0 || params.length === void 0 || params.checkType === void 0)) {
        return { success: false, message: "缺少必要参数" };
      }
      if (params.rawData) {
        let frame;
        if (Buffer.isBuffer(params.rawData)) {
          frame = params.rawData;
        } else if (Array.isArray(params.rawData)) {
          if (params.rawData.some((byte) => typeof byte !== "number" || byte < 0 || byte > 255)) {
            return { success: false, message: "rawData数组包含无效字节值" };
          }
          frame = Buffer.from(params.rawData);
        } else {
          return { success: false, message: "rawData参数格式错误" };
        }
        if (linController.currentMode !== 1) {
          const modeResult = await LinControllerManager.setMode(1, deviceId);
          if (!modeResult.success) {
            return modeResult;
          }
        }
        if (frame.length !== 16) {
          logger.warn(`Warning: rawData length is ${frame.length}, expected 16`);
          if (frame.length < 16) {
            const paddedFrame = Buffer.alloc(16);
            frame.copy(paddedFrame);
            frame = paddedFrame;
            frame[15] = LinCommandBuilder.calculateChecksum(frame, 15);
          } else {
            frame = frame.slice(0, 16);
            frame[15] = LinCommandBuilder.calculateChecksum(frame, 15);
          }
        }
        logger.debug(`Sending raw LIN frame for device ${deviceId}:`, frame.toString("hex"));
        const bytesWritten = await serialPort.write(frame);
        await serialPort.drain();
        logger.debug(`Raw frame sent successfully for device ${deviceId}, bytes written: ${bytesWritten}`);
        return { success: true, message: `发送LIN数据帧成功，已发送 ${bytesWritten} 字节` };
      } else {
        const { id, data, length, checkType } = params;
        if (id < 0 || id > 63) {
          return { success: false, message: "ID超出范围（0-63）" };
        }
        if (length < 1 || length > 8) {
          return { success: false, message: "数据长度超出范围（1-8）" };
        }
        if (linController.currentMode !== 1) {
          const modeResult = await LinControllerManager.setMode(1, deviceId);
          if (!modeResult.success) {
            return modeResult;
          }
        }
        let sendStr = "";
        if (data) {
          if (Array.isArray(data)) {
            if (data.some((byte) => typeof byte !== "number" || byte < 0 || byte > 255)) {
              return { success: false, message: "数据数组包含无效字节值" };
            }
            sendStr = data.map((byte) => byte.toString(16).padStart(2, "0")).join(" ");
          } else if (Buffer.isBuffer(data)) {
            sendStr = Array.from(data).map((byte) => byte.toString(16).padStart(2, "0")).join(" ");
          } else if (typeof data === "string") {
            sendStr = data;
          }
        }
        const frame = LinCommandBuilder.buildHostSendCommand(id, sendStr, length, checkType);
        logger.debug(`Sending LIN frame for device ${deviceId}:`, frame.toString("hex"));
        const bytesWritten = await serialPort.write(frame);
        await serialPort.drain();
        logger.debug(`LIN frame sent successfully for device ${deviceId}, bytes written: ${bytesWritten}`);
        return { success: true, message: `发送LIN数据帧成功，已发送 ${bytesWritten} 字节` };
      }
    } catch (error) {
      logger.error("Send LIN data failed:", error instanceof Error ? error.message : String(error));
      return { success: false, message: `发送LIN数据失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  // 读取从机数据
  static async readSlave(params) {
    try {
      const { deviceId } = params;
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: "串口未打开" };
      }
      const { id, length, checkType } = params;
      if (id < 0 || id > 63) {
        return { success: false, message: "ID超出范围（0-63）" };
      }
      if (length < 1 || length > 8) {
        return { success: false, message: "数据长度超出范围（1-8）" };
      }
      if (checkType !== "V1" && checkType !== "V2") {
        return { success: false, message: "校验类型必须为V1或V2" };
      }
      if (linController.currentMode !== 1) {
        const modeResult = await LinControllerManager.setMode(1, deviceId);
        if (!modeResult.success) {
          return modeResult;
        }
      }
      const frame = LinCommandBuilder.buildReadSlaveCommand(id, length, checkType);
      logger.debug(`Reading slave data for device ${deviceId} - sending frame:`, frame.toString("hex"));
      const bytesWritten = await serialPort.write(frame);
      await serialPort.drain();
      logger.debug(`Read slave frame sent successfully for device ${deviceId}, bytes written: ${bytesWritten}`);
      return { success: true, message: `读取从机数据命令已发送` };
    } catch (error) {
      logger.error("Read slave data failed:", error instanceof Error ? error.message : String(error));
      return { success: false, message: `读取从机数据失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  // 从机扫描功能
  static async scanSlaves(params) {
    logger.info("扫描从机功能被调用");
    try {
      const deviceId = params.deviceId;
      const scanId = params.scanId;
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        throw new Error("串口未打开");
      }
      linController.scanResults = [];
      linController.isScanning = true;
      const scanManager = getScanManager();
      const results = await scanManager.scan({
        ...params,
        scanId
      });
      const serializableResults = results.map((result) => ({
        id: result.id,
        baudRate: result.baudRate,
        dataLength: result.dataLength,
        checkType: result.detectedChecksumType || result.checkType,
        data: result.data,
        checksum: result.checksum,
        detectedChecksumType: result.detectedChecksumType || result.checkType,
        success: result.success,
        checksumError: result.checksumError,
        hasData: result.hasData,
        needsVerification: result.needsVerification
      }));
      logger.debug(`返回的序列化扫描结果: ${JSON.stringify(serializableResults)}`);
      logger.info(`扫描完成，发现 ${serializableResults.length} 个从机`);
      linController.isScanning = false;
      return serializableResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`扫描从机失败: ${errorMessage}`);
      linController.isScanning = false;
      throw error;
    }
  }
  // 添加扫描结果
  static addScanResult(result) {
    if (linController.isScanning) {
      linController.scanResults.push(result);
      logger.debug("添加扫描结果:", result);
    }
  }
  // 获取扫描结果
  static getScanResults() {
    return linController.scanResults;
  }
  // 中止扫描
  static async abortScan() {
    try {
      const scanManager = getScanManager();
      scanManager.abort();
      logger.info("扫描已中止");
      return { success: true, message: "扫描已中止" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`中止扫描失败: ${errorMessage}`);
      return { success: false, message: `中止扫描失败: ${errorMessage}` };
    }
  }
  // 获取扫描状态
  static async getScanStatus() {
    try {
      const scanManager = getScanManager();
      const progress = scanManager.getProgress();
      return {
        isScanning: scanManager.getIsScanning(),
        progress: progress.getPercentage(),
        currentLinId: progress.getCurrentLinId(),
        currentBaudRate: progress.getCurrentBaudRate()
      };
    } catch (error) {
      logger.error("获取扫描状态失败:", error);
      return { isScanning: false, progress: 0, currentLinId: "", currentBaudRate: "" };
    }
  }
  // 获取当前LIN控制器状态
  static getCurrentStatus() {
    return {
      mode: linController.currentMode,
      baudRate: linController.currentBaudRate,
      isScanning: linController.isScanning
    };
  }
}
const settingsPath = path.join(app.getPath("userData"), "settings.json");
class SettingsManager {
  /**
   * 保存设置到文件
   * @param settings 设置对象
   * @returns 保存结果
   */
  static saveSettings(settings) {
    try {
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      logger.info(`Settings saved successfully: ${settingsPath}`);
      return { success: true, message: "Settings saved successfully" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to save settings: ${errorMessage}`);
      return { success: false, message: `Failed to save settings: ${errorMessage}` };
    }
  }
  /**
   * 从文件读取设置
   * @returns 读取结果
   */
  static readSettings() {
    try {
      if (!fs.existsSync(settingsPath)) {
        logger.info(`Settings file does not exist, returning default settings: ${settingsPath}`);
        return { success: true, data: null, message: "Settings file does not exist, returning default settings" };
      }
      const data = fs.readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(data);
      logger.info(`Settings read successfully: ${settingsPath}`);
      return { success: true, data: settings, message: "Settings read successfully" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to read settings: ${errorMessage}`);
      return { success: false, data: null, message: `Failed to read settings: ${errorMessage}` };
    }
  }
  /**
   * 获取设置文件路径
   * @returns 设置文件路径
   */
  static getSettingsPath() {
    return settingsPath;
  }
}
logger.setEnabled(false);
let mainWindow = null;
let settingsWindow = null;
ipcMain.handle("window:minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});
ipcMain.handle("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.handle("window:close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
ipcMain.handle("window:start-drag", (event, mousePos) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.focus();
    window.startDragging();
  }
});
ipcMain.handle("window:resize", (event, width, height) => {
  if (mainWindow) {
    const minWidth = 800;
    const minHeight = 600;
    const constrainedWidth = Math.max(minWidth, width);
    const constrainedHeight = Math.max(minHeight, height);
    const { width: screenWidth, height: screenHeight } = mainWindow.getBounds();
    const display = mainWindow.getScreen().getDisplayMatching({ x: 0, y: 0, width: screenWidth, height: screenHeight });
    const maxWidth = display.workArea.width;
    const maxHeight = display.workArea.height;
    const finalWidth = Math.min(constrainedWidth, maxWidth);
    const finalHeight = Math.min(constrainedHeight, maxHeight);
    mainWindow.setSize(finalWidth, finalHeight);
  }
});
ipcMain.handle("window:get-state", () => {
  if (mainWindow) {
    return {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
      bounds: mainWindow.getBounds()
    };
  }
  return null;
});
process.env.NODE_ENV = process.env.NODE_ENV || "development";
app.on("ready", async () => {
  Menu.setApplicationMenu(null);
  if (process.platform === "win32") {
    try {
      const { execSync } = require2("child_process");
      execSync("chcp 65001", { stdio: "ignore" });
    } catch (error) {
    }
  }
  mainWindow = createWindow();
  if (mainWindow) {
    SerialPortManager.initializePortMonitoring(mainWindow);
  }
  if (mainWindow) {
    mainWindow.on("focus", () => {
      if (settingsWindow && settingsWindow.isVisible()) {
        settingsWindow.flashFrame(true);
        setTimeout(() => {
          if (settingsWindow && !settingsWindow.isDestroyed()) {
            settingsWindow.flashFrame(false);
          }
        }, 1e3);
      }
    });
  }
  if (mainWindow) {
    mainWindow.on("mousedown", () => {
      if (settingsWindow && settingsWindow.isVisible()) {
        settingsWindow.flashFrame(true);
        setTimeout(() => {
          if (settingsWindow && !settingsWindow.isDestroyed()) {
            settingsWindow.flashFrame(false);
          }
        }, 1e3);
      }
    });
  }
  if (mainWindow) {
    mainWindow.on("close", (event) => {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.close();
        settingsWindow = null;
      }
    });
  }
  mainWindow.webContents.once("did-finish-load", () => {
    SerialPort.list().then((ports) => {
      mainWindow?.webContents.send("serial:available-ports", ports);
    }).catch((error) => {
    });
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = createWindow();
  }
});
ipcMain.handle("serial:get-ports", async (event) => {
  try {
    const ports = await SerialPortManager.getPorts();
    return ports;
  } catch (error) {
    throw error;
  }
});
ipcMain.handle("serial:open-port", async (event, path2, options, deviceId) => {
  if (!mainWindow) {
    return { success: false, message: "主窗口未初始化" };
  }
  return await SerialPortManager.openPort(path2, options, mainWindow, deviceId);
});
ipcMain.handle("serial:close-port", async (event, deviceId) => {
  return await SerialPortManager.closePort(deviceId);
});
ipcMain.handle("serial:set-baud-rate", async (event, baudRate, deviceId) => {
  return await SerialPortManager.setBaudRate(baudRate, deviceId);
});
ipcMain.handle("lin:set-baud-rate", async (event, baudRate, deviceId) => {
  return await LinControllerManager.setBaudRate(baudRate, deviceId);
});
ipcMain.handle("lin:set-mode", async (event, mode, deviceId) => {
  return await LinControllerManager.setMode(mode, deviceId);
});
ipcMain.handle("lin:send-data", async (event, params) => {
  return await LinControllerManager.sendData(params);
});
ipcMain.handle("lin:read-slave", async (event, params) => {
  return await LinControllerManager.readSlave(params);
});
ipcMain.handle("lin:scan-slaves", async (event, params) => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("扫描超时：扫描过程花费时间过长"));
      }, 6e4);
    });
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
ipcMain.handle("lin:abort-scan", async (event) => {
  return await LinControllerManager.abortScan();
});
ipcMain.handle("lin:get-scan-status", async (event) => {
  return await LinControllerManager.getScanStatus();
});
ipcMain.handle("lin:scan-result-choice", async (event, continueScanning) => {
  try {
    const scanManager = getScanManager();
    scanManager.handleUserInput(continueScanning);
    return { success: true, message: "用户选择已处理" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`处理用户选择失败: ${errorMessage}`);
    return { success: false, message: `处理用户选择失败: ${errorMessage}` };
  }
});
ipcMain.handle("lin:get-status", async (event) => {
  return await LinControllerManager.getCurrentStatus();
});
ipcMain.handle("fs:writeSettings", (event, settings) => {
  return SettingsManager.saveSettings(settings);
});
ipcMain.handle("fs:readSettings", () => {
  return SettingsManager.readSettings();
});
ipcMain.handle("settings:open", () => {
  if (!mainWindow) {
    return { success: false, message: "主窗口未初始化" };
  }
  if (settingsWindow) {
    settingsWindow.close();
    settingsWindow = null;
  }
  settingsWindow = createChildWindow(mainWindow, {
    width: 800,
    height: 500,
    title: "设置"
  });
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
  return { success: true, message: "设置窗口已打开" };
});
ipcMain.handle("settings:close", () => {
  if (settingsWindow) {
    settingsWindow.close();
    settingsWindow = null;
    return { success: true, message: "设置窗口已关闭" };
  }
  return { success: false, message: "设置窗口未打开" };
});
