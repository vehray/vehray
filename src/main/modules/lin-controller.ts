import { LinCommandBuilder, LinFrameParser } from './lin-protocol.ts';
import { SerialPortManager } from './serial-manager.ts';
import { logger } from './logger.ts';
import { getScanManager } from './scan-manager.ts';
import { ipcMain } from 'electron';

// 定义命令结果类型
export interface CommandResult {
  success: boolean;
  message: string;
}

// 定义发送数据参数类型
export interface SendDataParams {
  rawData?: Buffer | number[];
  id?: number;
  data?: number[] | Buffer | string;
  length?: number;
  checkType?: string;
}

// 定义读取从机参数类型
export interface ReadSlaveParams {
  id: number;
  length: number;
  checkType: string;
}

// 定义扫描结果类型
export interface ScanResult {
  id: number;
  baudRate: number;
  dataLength: number;
  checkType: string;
  data: string;
  checksum: string;
  detectedChecksumType: string;
  success: boolean;
  checksumError?: boolean;
  hasData?: boolean;
  needsVerification?: boolean;
}

// 定义扫描参数类型
export interface ScanParams {
  baudRates: number[];
  idRange: [number, number];
}

// LIN控制器状态
const linController = {
  currentMode: 0, // 当前运行模式：0待机 1主机 2从机 3监听
  currentBaudRate: 19200, // 默认LIN波特率
  isScanning: false, // 扫描状态
  scanResults: [] as any[], // 扫描结果存储
};

// ===========================
// LIN控制器管理
// ===========================
export class LinControllerManager {
  
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
  static async setMode(mode: number, deviceId?: string): Promise<CommandResult> {
    try {
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: '串口未打开' };
      }
      
      // 验证模式值范围
      if (mode < 0 || mode > 3) {
        return { success: false, message: '模式值超出范围（0-3）' };
      }
      
      // 如果当前不是目标模式，需要切换
      if (linController.currentMode !== mode) {
        // 如果当前不是待机模式，先切换到待机模式
        if (linController.currentMode !== 0) {
          logger.info(`当前模式: ${linController.currentMode}，需要先切换到待机模式`);
          
          // 构建待机模式命令
          const standbyFrame = LinCommandBuilder.buildModeCommand(0, linController.currentBaudRate);
          logger.debug('Switching to standby mode - sending frame:', standbyFrame.toString('hex'));
          
          // 发送待机模式命令
          const bytesWritten1 = await serialPort.write(standbyFrame);
          logger.debug(`Write standby frame successful, bytes written: ${bytesWritten1}`);
          await serialPort.drain();
          logger.debug('Standby frame drained successfully');
          
          // 等待100ms
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 切换到目标模式
        logger.info(`切换到目标模式: ${mode}`);
        const modeFrame = LinCommandBuilder.buildModeCommand(mode, linController.currentBaudRate);
        logger.debug('Switching to target mode - sending frame:', modeFrame.toString('hex'));
        
        // 发送目标模式命令
        const bytesWritten2 = await serialPort.write(modeFrame);
        logger.debug(`Write mode frame successful, bytes written: ${bytesWritten2}`);
        await serialPort.drain();
        logger.debug('Mode frame drained successfully');
        
        // 更新当前模式
        linController.currentMode = mode;
      }
      
      logger.info(`运行模式已切换为 ${mode}`);
      return { success: true, message: `运行模式已切换为 ${mode}` };
    } catch (error) {
      logger.error('Failed to switch operation mode:', error instanceof Error ? error.message : String(error));
      return { success: false, message: `切换运行模式失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // 设置LIN波特率 
  static async setBaudRate(baudRate: number, deviceId?: string): Promise<CommandResult> {
    try {
      logger.info(`开始设置波特率: ${baudRate}，设备ID: ${deviceId || '默认设备'}`);
      
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        logger.error(`串口未打开，设备ID: ${deviceId || '默认设备'}`);
        return { success: false, message: '串口未打开' };
      }
      
      logger.info(`获取到串口实例，设备ID: ${deviceId || '默认设备'}`);
      
      // 验证波特率值
      const validBaudRates = [4800, 9600, 10400, 19200, 20000];
      if (!validBaudRates.includes(baudRate)) {
        logger.error(`无效的波特率值: ${baudRate}，设备ID: ${deviceId || '默认设备'}`);
        return { success: false, message: '无效的波特率值' };
      }
      
      // 如果当前波特率与目标波特率相同，不需要切换
      if (linController.currentBaudRate === baudRate) {
        logger.info(`当前已经是目标波特率: ${baudRate}，无需切换，设备ID: ${deviceId || '默认设备'}`);
        return { success: true, message: '当前已经是目标波特率，无需切换' };
      }
      
      // 保存当前模式
      const originalMode = linController.currentMode;
      logger.info(`保存当前模式: ${originalMode}，设备ID: ${deviceId || '默认设备'}`);
      
      // 如果当前不是待机模式，先切换到待机模式
      if (linController.currentMode !== 0) {
        logger.info(`当前模式: ${linController.currentMode}，需要先切换到待机模式以设置波特率，设备ID: ${deviceId || '默认设备'}`);
        
        // 构建待机模式命令
        const standbyFrame = LinCommandBuilder.buildModeCommand(0, linController.currentBaudRate);
        logger.debug(`设备ID: ${deviceId || '默认设备'}，切换到待机模式 - 发送帧: ${standbyFrame.toString('hex')}`);
        
        // 发送待机模式命令
        const bytesWritten1 = await serialPort.write(standbyFrame);
        logger.info(`设备ID: ${deviceId || '默认设备'}，写入待机模式命令成功，写入字节数: ${bytesWritten1}`);
        await serialPort.drain();
        logger.debug(`设备ID: ${deviceId || '默认设备'}，待机模式命令已刷新到串口`);
        
        // 等待100ms
        await new Promise(resolve => setTimeout(resolve, 100));
        logger.debug(`设备ID: ${deviceId || '默认设备'}，等待100ms完成`);
      }
      
      // 在待机模式下设置新的波特率
      logger.info(`设置新的波特率: ${baudRate}，设备ID: ${deviceId || '默认设备'}`);
      const baudRateFrame = LinCommandBuilder.buildModeCommand(0, baudRate);
      logger.debug(`设备ID: ${deviceId || '默认设备'}，设置新波特率 - 发送帧: ${baudRateFrame.toString('hex')}`);
      
      // 发送波特率设置命令
      const bytesWritten2 = await serialPort.write(baudRateFrame);
      logger.info(`设备ID: ${deviceId || '默认设备'}，写入波特率设置命令成功，写入字节数: ${bytesWritten2}`);
      await serialPort.drain();
      logger.debug(`设备ID: ${deviceId || '默认设备'}，波特率设置命令已刷新到串口`);
      
      // 等待100ms
      await new Promise(resolve => setTimeout(resolve, 100));
      logger.debug(`设备ID: ${deviceId || '默认设备'}，等待100ms完成`);
      
      // 如果之前不是待机模式，切换回原来的模式
      if (originalMode !== 0) {
        logger.info(`切换回原来的模式: ${originalMode}，设备ID: ${deviceId || '默认设备'}`);
        const originalModeFrame = LinCommandBuilder.buildModeCommand(originalMode, baudRate);
        logger.debug(`设备ID: ${deviceId || '默认设备'}，切换回原模式 - 发送帧: ${originalModeFrame.toString('hex')}`);
        
        // 发送原模式命令
        const bytesWritten3 = await serialPort.write(originalModeFrame);
        logger.info(`设备ID: ${deviceId || '默认设备'}，写入原模式命令成功，写入字节数: ${bytesWritten3}`);
        await serialPort.drain();
        logger.debug(`设备ID: ${deviceId || '默认设备'}，原模式命令已刷新到串口`);
        
        // 更新当前模式
        linController.currentMode = originalMode;
        logger.info(`设备ID: ${deviceId || '默认设备'}，当前模式已更新为: ${originalMode}`);
      }
      
      // 更新当前波特率
      linController.currentBaudRate = baudRate;
      logger.info(`设备ID: ${deviceId || '默认设备'}，波特率已更新为: ${baudRate}`);
      
      logger.info(`波特率设置完成: ${baudRate}，设备ID: ${deviceId || '默认设备'}`);
      return { success: true, message: `波特率已设置为 ${baudRate}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`设置波特率失败，设备ID: ${deviceId || '默认设备'}，错误: ${errorMessage}`);
      return { success: false, message: `设置波特率失败: ${errorMessage}` };
    }
  }

  // 发送LIN数据帧
  static async sendData(params: SendDataParams): Promise<CommandResult> {
    try {
      // 从params中提取deviceId
      const deviceId = (params as any).deviceId;
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: '串口未打开' };
      }
      
      // 验证必要参数
      if (!params.rawData && (params.id === undefined || params.length === undefined || params.checkType === undefined)) {
        return { success: false, message: '缺少必要参数' };
      }
      
      // 检查是否直接提供了rawData参数
      if (params.rawData) {
        let frame: Buffer;
        // 如果提供了rawData，直接使用它
        if (Buffer.isBuffer(params.rawData)) {
          frame = params.rawData;
        } else if (Array.isArray(params.rawData)) {
          // 验证数组元素是否为有效字节
          if (params.rawData.some(byte => typeof byte !== 'number' || byte < 0 || byte > 255)) {
            return { success: false, message: 'rawData数组包含无效字节值' };
          }
          frame = Buffer.from(params.rawData);
        } else {
          return { success: false, message: 'rawData参数格式错误' };
        }
        
        // 确保当前是主机模式（模式1），无论是否使用rawData
        if (linController.currentMode !== 1) {
          const modeResult = await LinControllerManager.setMode(1, deviceId);
          if (!modeResult.success) {
            return modeResult;
          }
        }
        
        // 验证rawData长度是否为16字节
        if (frame.length !== 16) {
          logger.warn(`Warning: rawData length is ${frame.length}, expected 16`);
          // 如果长度不对，尝试填充或截断
          if (frame.length < 16) {
            const paddedFrame = Buffer.alloc(16);
            frame.copy(paddedFrame);
            frame = paddedFrame;
            // 重新计算校验和
            frame[15] = LinCommandBuilder.calculateChecksum(frame, 15);
          } else {
            frame = frame.slice(0, 16);
            // 重新计算校验和
            frame[15] = LinCommandBuilder.calculateChecksum(frame, 15);
          }
        }
        
        // 发送rawData帧
        logger.debug(`Sending raw LIN frame for device ${deviceId}:`, frame.toString('hex'));
        const bytesWritten = await serialPort.write(frame);
        await serialPort.drain();
        logger.debug(`Raw frame sent successfully for device ${deviceId}, bytes written: ${bytesWritten}`);
        
        return { success: true, message: `发送LIN数据帧成功，已发送 ${bytesWritten} 字节` };
      } else {
        // 否则，使用C#风格的参数构建帧
        const { id, data, length, checkType } = params;
        
        // 验证ID范围
        if (id! < 0 || id! > 0x3F) {
          return { success: false, message: 'ID超出范围（0-63）' };
        }
        
        // 验证数据长度
        if (length! < 1 || length! > 8) {
          return { success: false, message: '数据长度超出范围（1-8）' };
        }
        
        // 确保当前是主机模式（模式1）
        if (linController.currentMode !== 1) {
          const modeResult = await LinControllerManager.setMode(1, deviceId);
          if (!modeResult.success) {
            return modeResult;
          }
        }
        
        // 转换数据格式为C#期望的空格分隔十六进制字符串
        let sendStr = '';
        if (data) {
          if (Array.isArray(data)) {
            // 验证数组元素是否为有效字节
            if (data.some(byte => typeof byte !== 'number' || byte < 0 || byte > 255)) {
              return { success: false, message: '数据数组包含无效字节值' };
            }
            // 数组格式：[0x01, 0x02, 0x03] -> "01 02 03"
            sendStr = data.map(byte => byte.toString(16).padStart(2, '0')).join(' ');
          } else if (Buffer.isBuffer(data)) {
            // Buffer格式：Buffer.from([0x01, 0x02, 0x03]) -> "01 02 03"
            sendStr = Array.from(data).map(byte => byte.toString(16).padStart(2, '0')).join(' ');
          } else if (typeof data === 'string') {
            // 字符串格式：直接使用
            sendStr = data;
          }
        }
        
        // 构建主机发送命令帧
        const frame = LinCommandBuilder.buildHostSendCommand(id!, sendStr, length!, checkType!);
        
        // 发送数据帧
        logger.debug(`Sending LIN frame for device ${deviceId}:`, frame.toString('hex'));
        const bytesWritten = await serialPort.write(frame);
        await serialPort.drain();
        logger.debug(`LIN frame sent successfully for device ${deviceId}, bytes written: ${bytesWritten}`);
        
        return { success: true, message: `发送LIN数据帧成功，已发送 ${bytesWritten} 字节` };
      }
    } catch (error) {
      logger.error('Send LIN data failed:', error instanceof Error ? error.message : String(error));
      return { success: false, message: `发送LIN数据失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // 读取从机数据
  static async readSlave(params: ReadSlaveParams & { deviceId?: string }): Promise<CommandResult & { data?: any }> {
    try {
      const { deviceId } = params;
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        return { success: false, message: '串口未打开' };
      }
      
      const { id, length, checkType } = params;
      
      // 验证ID范围
      if (id < 0 || id > 0x3F) {
        return { success: false, message: 'ID超出范围（0-63）' };
      }
      
      // 验证数据长度
      if (length < 1 || length > 8) {
        return { success: false, message: '数据长度超出范围（1-8）' };
      }
      
      // 验证校验类型
      if (checkType !== 'V1' && checkType !== 'V2') {
        return { success: false, message: '校验类型必须为V1或V2' };
      }
      
      // 确保当前是主机模式（模式1）
      if (linController.currentMode !== 1) {
        const modeResult = await LinControllerManager.setMode(1, deviceId);
        if (!modeResult.success) {
          return modeResult;
        }
      }
      
      // 构建读取从机命令帧
      const frame = LinCommandBuilder.buildReadSlaveCommand(id, length, checkType);
      logger.debug(`Reading slave data for device ${deviceId} - sending frame:`, frame.toString('hex'));
      
      // 发送命令帧
      const bytesWritten = await serialPort.write(frame);
      await serialPort.drain();
      logger.debug(`Read slave frame sent successfully for device ${deviceId}, bytes written: ${bytesWritten}`);
      
      // 这里只返回命令发送成功的消息
      // 从机响应会通过串口的data事件返回，由SerialPortManager处理
      return { success: true, message: `读取从机数据命令已发送` };
    } catch (error) {
      logger.error('Read slave data failed:', error instanceof Error ? error.message : String(error));
      return { success: false, message: `读取从机数据失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // 从机扫描功能
  static async scanSlaves(params: ScanParams & { deviceId?: string; scanId?: string }): Promise<any[]> {
    logger.info('扫描从机功能被调用');
    
    try {
      // 从params中提取deviceId和scanId
      const deviceId = (params as any).deviceId;
      const scanId = (params as any).scanId;
      
      // 验证串口连接
      const serialPort = SerialPortManager.getCurrentPort(deviceId);
      if (!serialPort || !serialPort.isOpen) {
        throw new Error('串口未打开');
      }
      
      // 清空之前的扫描结果
      linController.scanResults = [];
      linController.isScanning = true;
      
      // 使用静态导入的扫描管理器
      const scanManager = getScanManager();
      
      // 执行扫描，传递scanId
      const results = await scanManager.scan({
        ...params,
        scanId
      });
      
      // 确保返回的数据是可序列化的，避免循环引用
      const serializableResults = results.map(result => ({
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
      
      // 记录返回的序列化结果
      logger.debug(`返回的序列化扫描结果: ${JSON.stringify(serializableResults)}`);
      
      logger.info(`扫描完成，发现 ${serializableResults.length} 个从机`);
      linController.isScanning = false;
      return serializableResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`扫描从机失败: ${errorMessage}`);
      linController.isScanning = false;
      throw error; // 抛出错误，让前端处理
    }
  }

  // 添加扫描结果
  static addScanResult(result: any): void {
    if (linController.isScanning) {
      linController.scanResults.push(result);
      logger.debug('添加扫描结果:', result);
    }
  }

  // 获取扫描结果
  static getScanResults(): any[] {
    return linController.scanResults;
  }

  // 中止扫描
  static async abortScan(): Promise<CommandResult> {
    try {
      const scanManager = getScanManager();
      scanManager.abort();
      logger.info('扫描已中止');
      return { success: true, message: '扫描已中止' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`中止扫描失败: ${errorMessage}`);
      return { success: false, message: `中止扫描失败: ${errorMessage}` };
    }
  }

  // 获取扫描状态
  static async getScanStatus(): Promise<{ isScanning: boolean; progress: number; currentLinId: string; currentBaudRate: string }> {
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
      logger.error('获取扫描状态失败:', error);
      return { isScanning: false, progress: 0, currentLinId: '', currentBaudRate: '' };
    }
  }
  
  // 获取当前LIN控制器状态
  static getCurrentStatus(): { mode: number; baudRate: number; isScanning: boolean } {
    return {
      mode: linController.currentMode,
      baudRate: linController.currentBaudRate,
      isScanning: linController.isScanning
    };
  }
}
