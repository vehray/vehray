import type { ScanParams } from '../lin-controller.ts';
import type { ScanResult } from '../lin-controller.ts';
import type { ScanStrategy } from './base-scan-strategy.ts';
import { ScanProgress } from '../scan-progress.ts';
import { SerialPortManager } from '../serial-manager.ts';
import { LinControllerManager } from '../lin-controller.ts';
import { LinCommandBuilder } from '../lin-protocol.ts';
import { logger } from '../logger.ts';

/**
 * 并行扫描策略
 * 同时扫描多个ID，提高扫描效率
 */
export class ParallelScanStrategy implements ScanStrategy {
  private readonly maxParallelism: number = 5; // 最大并行数

  /**
   * 执行扫描
   * @param params 扫描参数
   * @param progress 进度管理器
   * @param abortSignal 中止信号
   * @returns 扫描结果数组
   */
  async scan(
    params: ScanParams,
    progress: ScanProgress,
    abortSignal?: AbortSignal
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    let currentTask = 0;

    // 从params中提取deviceId
    const deviceId = (params as any).deviceId;

    // 验证串口连接
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      throw new Error('串口未打开');
    }

    // 获取扫描间隔，默认为100ms
    const interval = (params as any).interval || 100;

    // 按顺序尝试每个波特率
    for (const baudRate of params.baudRates) {
      // 检查是否已中止
      if (abortSignal?.aborted) {
        throw new Error('扫描已中止');
      }

      try {
        // 设置波特率
        await this.setBaudRate(baudRate, deviceId);
        
        // 计算ID范围
        const ids = [];
        for (let id = params.idRange[0]; id <= params.idRange[1]; id++) {
          ids.push(id);
        }

        // 分批并行扫描
        const batches = this.splitIntoBatches(ids, this.maxParallelism);
        
        for (const batch of batches) {
          // 检查是否已中止
          if (abortSignal?.aborted) {
            throw new Error('扫描已中止');
          }

          // 并行执行批次中的所有ID
          const batchPromises = batch.map(id => {
            return this.scanSingleSlave(id, baudRate, abortSignal, deviceId);
          });

          // 等待批次完成
          const batchResults = await Promise.all(batchPromises);
          
          // 处理批次结果
          for (const result of batchResults) {
            currentTask++;
            progress.update(currentTask, `正在扫描: 波特率 ${baudRate}, ID 0x${result.id.toString(16).toUpperCase()}`);
            
            if (result.success) {
              results.push(result);
              logger.info(`发现从机: ID 0x${result.id.toString(16).toUpperCase()}, 波特率 ${baudRate}`);
            }
          }

          // 短暂延迟，避免连续发送过快
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`波特率 ${baudRate} 扫描失败: ${errorMessage}`);
        // 继续尝试下一个波特率
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
  private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
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
  private async setBaudRate(baudRate: number, deviceId?: string): Promise<void> {
    // 确保当前是待机模式
    await LinControllerManager.setMode(0, deviceId);
    
    // 设置波特率
    const baudResult = await LinControllerManager.setBaudRate(baudRate, deviceId);
    if (!baudResult.success) {
      throw new Error(`设置波特率失败: ${baudResult.message}`);
    }
    
    // 切换到主机模式
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
  private async scanSingleSlave(
    id: number,
    baudRate: number,
    abortSignal?: AbortSignal,
    deviceId?: string
  ): Promise<ScanResult> {
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      return this.createFailedResult(id, baudRate, '串口未打开');
    }

    // 尝试V1和V2校验类型
    const checkTypes = ['V1', 'V2'];
    
    for (const checkType of checkTypes) {
      try {
        // 检查是否已中止
        if (abortSignal?.aborted) {
          throw new Error('扫描已中止');
        }

        // 构建读取从机命令
        const command = LinCommandBuilder.buildReadSlaveCommand(id, 8, checkType);
        
        // 发送命令
        await serialPort.write(command);
        await serialPort.drain();

        // 等待响应（带超时）
        const response = await this.waitForResponse(serialPort, 800, abortSignal);
        
        if (response) {
          // 解析响应
          return this.parseResponse(id, baudRate, checkType, response);
        }
      } catch (error) {
        // 继续尝试下一种校验类型
        logger.debug(`扫描从机 ${id} 失败 (${checkType}): ${error}`);
      }
    }

    return this.createFailedResult(id, baudRate, '无响应');
  }

  /**
   * 等待响应
   * @param serialPort 串口实例
   * @param timeout 超时时间（毫秒）
   * @param abortSignal 中止信号
   * @returns 响应数据
   */
  private async waitForResponse(
    serialPort: any,
    timeout: number,
    abortSignal?: AbortSignal
  ): Promise<Buffer | null> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      let responseBuffer = Buffer.alloc(0);

      // 超时处理
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);

      // 数据接收处理
      const onData = (data: Buffer) => {
        responseBuffer = Buffer.concat([responseBuffer, data]);
        
        // 检查是否接收到完整的响应
        if (responseBuffer.length >= 16) {
          cleanup();
          resolve(responseBuffer.slice(0, 16));
        }
      };

      // 错误处理
      const onError = () => {
        cleanup();
        resolve(null);
      };

      // 清理函数
      let cleanup = () => {
        clearTimeout(timeoutId);
        serialPort.off('data', onData);
        serialPort.off('error', onError);
      };

      // 注册事件监听器
      serialPort.on('data', onData);
      serialPort.on('error', onError);

      // 中止处理
      if (abortSignal) {
        const onAbort = () => {
          cleanup();
          resolve(null);
        };
        abortSignal.addEventListener('abort', onAbort);
        cleanup = () => {
          clearTimeout(timeoutId);
          serialPort.off('data', onData);
          serialPort.off('error', onError);
          abortSignal?.removeEventListener('abort', onAbort);
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
  private parseResponse(
    id: number,
    baudRate: number,
    checkType: string,
    response: Buffer
  ): ScanResult {
    try {
      // 检查响应是否有效
      if (response.length !== 16) {
        return this.createFailedResult(id, baudRate, '响应长度错误');
      }

      // 检查帧类型
      if (response[0] !== 0x33 && response[0] !== 0x44) {
        return this.createFailedResult(id, baudRate, '无效的响应帧类型');
      }

      // 检查ID是否匹配
      if (response[2] !== id) {
        return this.createFailedResult(id, baudRate, 'ID不匹配');
      }

      // 解析数据长度
      const dataLength = response[5] || 0;
      
      // 解析数据
      let data = '';
      for (let i = 6; i < 6 + dataLength && i < 14; i++) {
        const byte = response[i];
        if (byte !== undefined) {
          data += byte.toString(16).toUpperCase().padStart(2, '0') + ' ';
        }
      }
      data = data.trim();

      // 记录完整的从机响应数据帧
      logger.debug(`从机响应数据帧: ${response.toString('hex')}`);
      
      // 从数据帧的第4个字节读取校验类型（完全按照C#代码逻辑）
      const checkTypeByte = response[4];
      
      // 记录校验类型字节值
      logger.debug(`读取到的校验类型字节: ${checkTypeByte}`);
      
      // 根据通信协议转换校验类型（完全按照C#代码逻辑）
      let detectedChecksumType = '帧头';
      if (checkTypeByte === 0) {
        detectedChecksumType = '校验和错误';
        logger.debug(`解析得到的校验类型: 校验和错误`);
      } else if (checkTypeByte === 1) {
        detectedChecksumType = 'V1';
        logger.debug(`解析得到的校验类型: V1`);
      } else if (checkTypeByte === 2) {
        detectedChecksumType = 'V2';
        logger.debug(`解析得到的校验类型: V2`);
      } else {
        logger.debug(`解析得到的校验类型: 帧头`);
      }

      // 重新计算校验和并验证
      const receivedChecksum = response[14];
      const receivedChecksumHex = receivedChecksum.toString(16).toUpperCase().padStart(2, '0');
      logger.debug(`接收到的校验和: ${receivedChecksumHex}`);
      
      // 提取数据字节
      const dataBytes = [];
      for (let i = 6; i < 6 + dataLength && i < 14; i++) {
        dataBytes.push(response[i]);
      }
      logger.debug(`提取的数据字节: ${dataBytes}`);
      
      // 按照C#代码中的Check_Sum方法实现校验和计算
      const calculateCheckSum = (data: Buffer, length: number): number => {
        let sum = 0;
        for (let i = 0; i < length; i++) {
          sum += data[i];
        }
        sum = (((~sum) & 0x000000FF) + 1);
        return sum & 0xFF;
      };
      
      // 计算CRC校验和（前15字节相加后，取反再加1）
      const crcChecksum = calculateCheckSum(response, 15);
      logger.debug(`使用CRC算法计算得到的校验和: ${crcChecksum.toString(16).toUpperCase().padStart(2, '0')}`);
      
      // 验证校验和是否正确
      const isChecksumCorrect = (receivedChecksum === crcChecksum);
      logger.debug(`校验和验证结果: ${isChecksumCorrect ? '通过' : '失败'}`);

      // 创建成功结果
      return {
        id,
        baudRate,
        dataLength,
        checkType: detectedChecksumType,
        data,
        checksum: receivedChecksumHex,
        detectedChecksumType: detectedChecksumType,
        success: true,
        checksumError: !isChecksumCorrect
      };
    } catch (error) {
      return this.createFailedResult(id, baudRate, '解析响应失败');
    }
  }

  /**
   * 创建失败结果
   * @param id 从机ID
   * @param baudRate 波特率
   * @param errorMessage 错误消息
   * @returns 失败的扫描结果
   */
  private createFailedResult(id: number, baudRate: number, errorMessage: string): ScanResult {
    return {
      id,
      baudRate,
      dataLength: 0,
      checkType: 'V1',
      data: '',
      success: false
    };
  }

  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getName(): string {
    return '并行扫描';
  }

  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getDescription(): string {
    return '同时扫描多个ID，提高扫描效率，适合需要快速扫描的场景';
  }
}
