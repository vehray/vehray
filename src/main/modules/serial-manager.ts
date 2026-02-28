import { SerialPort } from 'serialport';
import { BrowserWindow } from 'electron';
import { LinFrameParser } from './lin-protocol.ts';
import { logger } from './logger.ts';

// 定义端口信息类型
export interface PortInfo {
  path: string;
  manufacturer: string;
  serialNumber: string;
  pnpId: string;
  locationId: string;
}

// 定义命令结果类型
export interface CommandResult {
  success: boolean;
  message: string;
}

// 设备ID到串口实例的映射
const deviceSerialPorts = new Map<string, SerialPort>();

// 设备ID到设备类型的映射
const deviceTypes = new Map<string, string>();

// 当前活动设备ID
let activeDeviceId: string | null = null;

// 上次检测的串口列表
let lastPortList: PortInfo[] = [];

// 主窗口引用
let mainWindowRef: BrowserWindow | null = null;

// 串口监控定时器
let portMonitoringInterval: NodeJS.Timeout | null = null;

// 端口事件防抖
let lastPortEventTime: Map<string, number> = new Map();
const PORT_EVENT_DEBOUNCE_TIME = 2000; // 2秒防抖

// ===========================
// 串口通信管理
// ===========================
export class SerialPortManager {
  // 获取可用串口列表
  static async getPorts(): Promise<PortInfo[]> {
    try {
      logger.debug('Starting to get serial port list...');
      const ports = await SerialPort.list();
      logger.debug('Raw serial port list obtained:', ports);
      
      if (!Array.isArray(ports)) {
        logger.error('Obtained port list is not an array:', ports);
        return [];
      }
      
      const mappedPorts = ports.map(port => ({
        path: port.path || '',
        manufacturer: port.manufacturer || '未知',
        serialNumber: port.serialNumber || '无',
        pnpId: port.pnpId || '无',
        locationId: port.locationId || '无'
      })).filter(port => port.path); // 过滤掉没有路径的端口
      
      logger.debug(`Found ${mappedPorts.length} available serial ports`);
      logger.debug('Converted serial port list:', mappedPorts);
      return mappedPorts;
    } catch (error) {
      logger.error('Failed to get serial port list:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // 打开串口
  static openPort(path: string, options: any, mainWindow: BrowserWindow, deviceId: string): Promise<CommandResult> {
    try {
      logger.info(`Opening serial port ${path} for device ${deviceId}`);
      
      // 验证path参数是否为字符串
      if (typeof path !== 'string') {
        logger.error(`Invalid serial port path: ${path}, must be a string`);
        return Promise.resolve({ success: false, message: `串口路径必须是字符串类型: ${path}` });
      }
      
      return new Promise<CommandResult>((resolve) => {
        // 关闭该设备已打开的串口
        const closeAndOpen = async () => {
          if (deviceSerialPorts.has(deviceId)) {
            const existingPort = deviceSerialPorts.get(deviceId);
            if (existingPort && existingPort.isOpen) {
              logger.info(`Closing existing serial port for device ${deviceId}`);
              try {
                await existingPort.close();
                logger.info(`Existing serial port for device ${deviceId} closed successfully`);
              } catch (error) {
                logger.warn('Error closing existing serial port:', error instanceof Error ? error.message : String(error));
                // 忽略关闭错误，继续执行
              }
            }
            deviceSerialPorts.delete(deviceId);
            deviceTypes.delete(deviceId);
          }
          
          // 保存设备类型
          const deviceType = options.deviceType || 'LINTest-M';
          deviceTypes.set(deviceId, deviceType);
          
          // 根据设备类型配置串口参数
          let portConfig = {
            path: path,
            baudRate: 460800, // 固定波特率，与C#代码一致
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: false,
            readTimeout: 500,
            writeTimeout: 500, // 添加写入超时
            autoOpen: false,
            dtrEnable: true, // DTR使能，与C#代码一致
            rtsEnable: true, // RTS使能，增加这个设置以确保硬件握手正常
            receivedBytesThreshold: 16, // 接收字节阈值，与C#代码一致
            encoding: 'default' // 编码设置，与C#代码一致
          };
          
          // 如果是LINTest-M设备，应用特定配置
          if (deviceType === 'LINTest-M') {
            logger.info(`Configuring LINTest-M device: ${deviceId}`);
            // LINTest-M设备的特定配置
            portConfig = {
              ...portConfig,
              baudRate: 460800, // LINTest-M设备的标准波特率
              dtrEnable: true,
              rtsEnable: true
            };
          }
          
          logger.debug(`Creating new SerialPort instance with configuration:`, portConfig);
          const port = new SerialPort(portConfig);
          
          // 标志位，确保Promise只被解析一次
          let resolved = false;
          
          // 解析Promise的辅助函数
          const resolveOnce = (result: CommandResult) => {
            if (!resolved) {
              resolved = true;
              logger.debug(`Serial port open result: ${result.success}, message: ${result.message}`);
              resolve(result);
            }
          };
          
          // 串口事件处理
          port.on('open', () => {
            logger.info(`Serial port ${path} opened successfully for device ${deviceId}`);
            // 将新打开的串口存储到映射中
            deviceSerialPorts.set(deviceId, port);
            // 设置当前活动设备ID
            activeDeviceId = deviceId;
            resolveOnce({ success: true, message: `串口 ${path} 已打开` });
          });
        
          port.on('data', (data) => {
            logger.debug(`Received ${data.length} bytes from serial port ${path}: ${data.toString('hex')}`);
            if (mainWindow) {
              // 解析LIN帧
              const frame = LinFrameParser.parseFrame(data);
              if (frame) {
                logger.debug(`Parsed LIN frame: ${JSON.stringify(frame)}`);
                mainWindow.webContents.send('serial:lin-frame', {
                  ...frame,
                  deviceId: deviceId // 添加设备ID
                });
              } else {
                logger.debug('Failed to parse LIN frame');
              }
              // 发送原始数据
              mainWindow.webContents.send('serial:raw-data', {
                data: data.toString('hex'),
                deviceId: deviceId // 添加设备ID
              });
            }
          });
        
          port.on('error', (error) => {
            logger.error(`Serial port ${path} error for device ${deviceId}: ${error.message}`);
            if (mainWindow) {
              mainWindow.webContents.send('serial:error', {
                error: error.message,
                deviceId: deviceId // 添加设备ID
              });
            }
            resolveOnce({ success: false, message: `串口错误: ${error.message}` });
          });
        
          port.on('close', () => {
            logger.info(`Serial port ${path} closed for device ${deviceId}`);
            deviceSerialPorts.delete(deviceId);
            if (activeDeviceId === deviceId) {
              activeDeviceId = null;
            }
            if (mainWindow) {
              mainWindow.webContents.send('serial:closed', {
                message: `串口 ${path} 已关闭`,
                deviceId: deviceId // 添加设备ID
              });
            }
          });
          
          // 手动打开串口 - 使用回调方式处理，因为SerialPort的open方法可能不返回Promise
          logger.debug(`Attempting to open serial port: ${path} for device ${deviceId}`);
          port.open((error) => {
            if (error) {
              logger.error(`Error opening serial port ${path} for device ${deviceId}:`, error.message);
              resolveOnce({ success: false, message: `打开串口失败: ${error.message}` });
            }
            // 成功的情况由port.on('open')事件处理
          });
          
          // 添加超时处理，防止Promise永远不被解析
          setTimeout(() => {
            logger.error(`Timeout opening serial port: ${path} for device ${deviceId}`);
            resolveOnce({ success: false, message: '打开串口超时' });
          }, 5000);
        };
        
        // 执行关闭和打开操作
        closeAndOpen();
      });
    } catch (error) {
      logger.error('Unexpected error in openPort:', error instanceof Error ? error.message : String(error));
      return Promise.resolve({ success: false, message: `打开串口失败: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  // 关闭串口
  static async closePort(deviceId?: string): Promise<CommandResult> {
    try {
      if (deviceId) {
        // 关闭指定设备的串口
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
          return { success: true, message: '串口已关闭' };
        }
        logger.debug(`No serial port to close for device ${deviceId}`);
        return { success: false, message: '该设备没有打开的串口' };
      } else {
        // 关闭当前活动设备的串口
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
          return { success: true, message: '串口已关闭' };
        }
        logger.debug('No active serial port to close');
        return { success: false, message: '没有打开的串口' };
      }
    } catch (error) {
      logger.error('Failed to close serial port:', error instanceof Error ? error.message : String(error));
      return { success: false, message: `关闭串口失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // 获取当前串口实例
  static getCurrentPort(deviceId?: string): SerialPort | null {
    if (deviceId) {
      // 获取指定设备的串口实例
      return deviceSerialPorts.get(deviceId) || null;
    } else {
      // 获取当前活动设备的串口实例
      return activeDeviceId ? deviceSerialPorts.get(activeDeviceId) || null : null;
    }
  }

  /**
   * 监控串口写入操作
   * @param deviceId 设备ID
   * @param data 要写入的数据
   */
  static async monitorWriteOperation(deviceId?: string, data?: Buffer): Promise<void> {
    const serialPort = this.getCurrentPort(deviceId);
    if (!serialPort) {
      logger.warn(`监控写入操作失败: 设备 ${deviceId || '默认设备'} 未找到或未打开`);
      return;
    }

    logger.debug(`监控设备 ${deviceId || '默认设备'} 的写入操作`);
  }

  // 设置波特率
  static async setBaudRate(baudRate: number, deviceId?: string): Promise<CommandResult> {
    try {
      const serialPort = this.getCurrentPort(deviceId);
      if (!serialPort) {
        return { success: false, message: '串口未打开' };
      }
      
      logger.info(`Setting baud rate to: ${baudRate} for device ${deviceId || activeDeviceId}`);
      serialPort.update({ baudRate });
      logger.info(`Baud rate set successfully to: ${baudRate} for device ${deviceId || activeDeviceId}`);
      return { success: true, message: `波特率已设置为: ${baudRate}` };
    } catch (error) {
      logger.error('Failed to set baud rate:', error instanceof Error ? error.message : String(error));
      return { success: false, message: `设置波特率失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  
  // 获取设备类型
  static getDeviceType(deviceId?: string): string | undefined {
    if (deviceId) {
      return deviceTypes.get(deviceId);
    }
    return activeDeviceId ? deviceTypes.get(activeDeviceId) : undefined;
  }
  
  // 初始化LINTest-M设备
  static async initializeLintestMDevice(deviceId: string): Promise<CommandResult> {
    try {
      const deviceType = this.getDeviceType(deviceId);
      if (deviceType !== 'LINTest-M') {
        return { success: false, message: '设备类型不是LINTest-M' };
      }
      
      const serialPort = this.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: '串口未打开' };
      }
      
      logger.info(`Initializing LINTest-M device: ${deviceId}`);
      
      // LINTest-M设备的初始化逻辑
      // 这里可以添加特定的初始化命令
      
      // 初始化成功后，设置默认参数
      logger.info(`LINTest-M device initialized successfully: ${deviceId}`);
      return { success: true, message: 'LINTest-M设备初始化成功' };
    } catch (error) {
      logger.error('Failed to initialize LINTest-M device:', error instanceof Error ? error.message : String(error));
      return { success: false, message: `初始化LINTest-M设备失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  
  // 为LINTest-M设备设置波特率
  static async setLintestMBaudRate(deviceId: string, baudRate: number): Promise<CommandResult> {
    try {
      const deviceType = this.getDeviceType(deviceId);
      if (deviceType !== 'LINTest-M') {
        return { success: false, message: '设备类型不是LINTest-M' };
      }
      
      const serialPort = this.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: '串口未打开' };
      }
      
      logger.info(`Setting LINTest-M device baud rate: ${baudRate} for device ${deviceId}`);
      
      // 验证波特率是否支持
      const supportedBaudRates = [4800, 9600, 10400, 19200, 20000];
      if (!supportedBaudRates.includes(baudRate)) {
        logger.warn(`Baud rate ${baudRate} not in recommended list, but will try to set it anyway`);
      }
      
      // 设置串口波特率
      serialPort.update({ baudRate });
      
      logger.info(`Baud rate set successfully: ${baudRate} for device ${deviceId}`);
      return { success: true, message: `波特率已设置为: ${baudRate}` };
    } catch (error) {
      logger.error('Failed to set LINTest-M device baud rate:', error instanceof Error ? error.message : String(error));
      return { success: false, message: `设置波特率失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  
  // 初始化串口监控
  static initializePortMonitoring(mainWindow: BrowserWindow): void {
    mainWindowRef = mainWindow;
    
    // 启动串口监控
    this.startPortMonitoring();
    
    logger.info('Serial port monitoring initialized');
  }
  
  // 启动串口监控
  static startPortMonitoring(): void {
    // 停止之前的监控
    if (portMonitoringInterval) {
      clearInterval(portMonitoringInterval);
    }
    
    // 立即执行一次检测
    this.detectPortChanges();
    
    // 设置定时检测，每3秒检测一次
    portMonitoringInterval = setInterval(() => {
      this.detectPortChanges();
    }, 3000);
    
    logger.info('Serial port monitoring started');
  }
  
  // 停止串口监控
  static stopPortMonitoring(): void {
    if (portMonitoringInterval) {
      clearInterval(portMonitoringInterval);
      portMonitoringInterval = null;
      logger.info('Serial port monitoring stopped');
    }
  }
  
  // 检测串口变化
  static async detectPortChanges(): Promise<void> {
    try {
      const currentPorts = await this.getPorts();
      
      // 检测新增的串口
      const addedPorts = currentPorts.filter(currentPort => 
        !lastPortList.some(lastPort => lastPort.path === currentPort.path)
      );
      
      // 检测移除的串口
      const removedPorts = lastPortList.filter(lastPort => 
        !currentPorts.some(currentPort => currentPort.path === lastPort.path)
      );
      
      // 处理新增串口
      for (const port of addedPorts) {
        this.handlePortAdded(port);
      }
      
      // 处理移除串口
      for (const port of removedPorts) {
        this.handlePortRemoved(port);
      }
      
      // 更新上次的串口列表
      lastPortList = currentPorts;
    } catch (error) {
      logger.error('Failed to detect port changes:', error instanceof Error ? error.message : String(error));
    }
  }
  
  // 处理串口添加
  static handlePortAdded(port: PortInfo): void {
    const eventKey = `added-${port.path}`;
    const now = Date.now();
    
    // 防抖处理，避免短时间内多次触发相同的事件
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
      // 确保只发送一次事件
      try {
        mainWindowRef.webContents.send('serial:port-added', port);
        logger.debug(`Sent port added event for: ${port.path}`);
      } catch (error) {
        logger.error(`Error sending port added event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  // 处理串口移除
  static handlePortRemoved(port: PortInfo): void {
    const eventKey = `removed-${port.path}`;
    const now = Date.now();
    
    // 防抖处理，避免短时间内多次触发相同的事件
    if (lastPortEventTime.has(eventKey)) {
      const lastTime = lastPortEventTime.get(eventKey) || 0;
      if (now - lastTime < PORT_EVENT_DEBOUNCE_TIME) {
        logger.debug(`Ignoring duplicate port removed event: ${port.path}`);
        return;
      }
    }
    
    lastPortEventTime.set(eventKey, now);
    logger.info(`Serial port removed: ${port.path} (${port.manufacturer})`);
    
    // 查找使用该串口的设备
    const affectedDevices: string[] = [];
    
    // 查找使用该串口的设备
    deviceSerialPorts.forEach((serialPort, deviceId) => {
      // 这里需要根据设备ID获取设备的串口路径
      // 由于我们没有设备配置的存储，暂时无法实现
      // 后续需要从设备管理模块获取设备配置信息
    });
    
    if (mainWindowRef) {
      // 确保只发送一次事件
      try {
        mainWindowRef.webContents.send('serial:port-removed', {
          port,
          affectedDevices
        });
        logger.debug(`Sent port removed event for: ${port.path} with ${affectedDevices.length} affected devices`);
      } catch (error) {
        logger.error(`Error sending port removed event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 关闭使用该串口的所有设备连接
    deviceSerialPorts.forEach((serialPort, deviceId) => {
      // 这里需要根据设备ID获取设备的串口路径
      // 由于我们没有设备配置的存储，暂时无法实现
      // 后续需要从设备管理模块获取设备配置信息
    });
  }
}
