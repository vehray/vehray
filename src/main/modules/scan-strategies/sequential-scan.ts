import type { ScanParams } from '../lin-controller.ts';
import type { ScanResult } from '../lin-controller.ts';
import type { ScanStrategy } from './base-scan-strategy.ts';
import { ScanProgress } from '../scan-progress.ts';
import { SerialPortManager } from '../serial-manager.ts';
import { LinControllerManager } from '../lin-controller.ts';
import { LinCommandBuilder, LinFrameParser } from '../lin-protocol.ts';
import { logger } from '../logger.ts';
import { getScanManager } from '../scan-manager.ts';

/**
 * 顺序扫描策略
 * 按顺序尝试每个波特率和ID组合
 */
export class SequentialScanStrategy implements ScanStrategy {
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

    // 获取扫描间隔，默认为50ms
    const interval = (params as any).interval || 50;
    logger.info(`开始扫描: 波特率 ${params.baudRates.join(', ')}, ID范围 ${params.idRange[0]}-${params.idRange[1]}, 间隔 ${interval}ms`);

    // 按顺序尝试每个波特率
    for (const baudRate of params.baudRates) {
      // 检查是否已中止
      if (abortSignal?.aborted) {
        throw new Error('扫描已中止');
      }

      try {
        logger.debug(`开始扫描波特率: ${baudRate}`);
        // 设置波特率
        await this.setBaudRate(baudRate, deviceId);
        
        // 按顺序尝试每个ID
        for (let id = params.idRange[0]; id <= params.idRange[1]; id++) {
          // 检查是否已中止
          if (abortSignal?.aborted) {
            throw new Error('扫描已中止');
          }

          // 更新进度
          currentTask++;
          progress.update(currentTask, `正在扫描: 波特率 ${baudRate}, ID 0x${id.toString(16).toUpperCase()}`);

          // 扫描单个从机
          const result = await this.scanSingleSlave(id, baudRate, abortSignal, deviceId);
          if (result.success) {
            results.push(result);
            logger.info(`发现从机: ID 0x${id.toString(16).toUpperCase()}, 波特率 ${baudRate}, 数据长度 ${result.dataLength}, 数据 ${result.data}`);
            
            // 发送扫描结果事件
            try {
              const scanManager = getScanManager();
              scanManager.emitScanResultEvent(result);
              
              // 等待用户输入
              logger.debug('开始等待用户输入...');
              const continueScanning = await scanManager.waitForUserInput();
              logger.debug('用户输入已获取，继续扫描:', continueScanning);
              
              // 检查是否已经被中止
              if (abortSignal?.aborted) {
                logger.info('扫描已中止，退出扫描过程');
                throw new Error('扫描已中止');
              }
              
              if (!continueScanning) {
                // 用户选择停止扫描
                logger.info('用户选择停止扫描，退出扫描过程');
                throw new Error('用户选择停止扫描');
              }
              
              // 继续扫描
              logger.info('用户选择继续扫描，继续执行扫描过程');
              progress.update(currentTask, `继续扫描: 波特率 ${baudRate}, ID 0x${id.toString(16).toUpperCase()}`);
              
              // 短暂延迟，确保扫描过程能够正常继续
              await new Promise(resolve => setTimeout(resolve, 10));
              logger.debug('继续扫描延迟完成，准备扫描下一个ID');

            } catch (error) {
              if (error instanceof Error && error.message === '用户选择停止扫描') {
                throw error;
              }
              logger.warn('发送扫描结果事件失败:', error);
            }
          }

          // 短暂延迟，避免发送过快，使用更合理的延迟时间
          await new Promise(resolve => setTimeout(resolve, Math.min(interval, 15)));
        }
        logger.debug(`波特率 ${baudRate} 扫描完成`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`波特率 ${baudRate} 扫描失败: ${errorMessage}`);
        // 继续尝试下一个波特率
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
  private async setBaudRate(baudRate: number, deviceId?: string): Promise<void> {
    try {
      // 先检查当前波特率，如果已经是目标波特率，跳过设置
      const currentStatus = await LinControllerManager.getCurrentStatus();
      if (currentStatus.baudRate === baudRate && currentStatus.mode === 1) {
        logger.debug(`波特率已为: ${baudRate}，无需重新设置`);
        return;
      }

      // 使用LinControllerManager的方法设置波特率
      const baudResult = await LinControllerManager.setBaudRate(baudRate, deviceId);
      if (!baudResult.success) {
        throw new Error(`设置波特率失败: ${baudResult.message}`);
      }

      // 确保当前是主机模式
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
  private async scanSingleSlave(
    id: number,
    baudRate: number,
    abortSignal?: AbortSignal,
    deviceId?: string
  ): Promise<ScanResult> {
    // 先进行ID扫描，校验默认V1，长度默认为1
    logger.debug(`开始扫描从机ID: ${id}, 波特率: ${baudRate}, 初始校验类型: V1, 初始长度: 1`);
    
    // 快速判断是否有数据（长度为1，校验类型为V1）
    const quickResult = await this.determineDataLength(id, baudRate, 'V1', abortSignal, deviceId, 1);
    
    if (!quickResult.success || !quickResult.data) {
      // 无数据反馈，跳过
      logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备无数据反馈，跳过`);
      return this.createFailedResult(id, baudRate, '无数据');
    }
    
    // 有数据反馈，先以V1按长度1-8循环扫描
    logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备有数据反馈，开始按长度1-8循环扫描`);
    for (let length = 1; length <= 8; length++) {
      // 检查是否已中止
      if (abortSignal?.aborted) {
        throw new Error('扫描已中止');
      }
      
      const v1Result = await this.determineDataLength(id, baudRate, 'V1', abortSignal, deviceId, length);
      
      // 检查校验标志位
      if (v1Result.success && v1Result.checkType && (v1Result.checkType === 'V1' || v1Result.checkType === 'V2')) {
        // 校验标志位为1或2，返回结果
        logger.info(`发现从机: ID 0x${id.toString(16).toUpperCase()}, 波特率 ${baudRate}, 数据长度 ${v1Result.dataLength}, 校验类型 ${v1Result.checkType}`);
        return {
          ...v1Result,
          hasData: true,
          needsVerification: true
        };
      }
    }
    
    // 然后以V2按长度1-8循环扫描
    logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备V1扫描无有效校验，开始以V2按长度1-8循环扫描`);
    for (let length = 1; length <= 8; length++) {
      // 检查是否已中止
      if (abortSignal?.aborted) {
        throw new Error('扫描已中止');
      }
      
      const v2Result = await this.determineDataLength(id, baudRate, 'V2', abortSignal, deviceId, length);
      
      // 检查校验标志位
      if (v2Result.success && v2Result.checkType && (v2Result.checkType === 'V1' || v2Result.checkType === 'V2')) {
        // 校验标志位为1或2，返回结果
        logger.info(`发现从机: ID 0x${id.toString(16).toUpperCase()}, 波特率 ${baudRate}, 数据长度 ${v2Result.dataLength}, 校验类型 ${v2Result.checkType}`);
        return {
          ...v2Result,
          hasData: true,
          needsVerification: true
        };
      }
    }

    return this.createFailedResult(id, baudRate, '无有效校验');
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
  private async determineDataLength(
    id: number,
    baudRate: number,
    checkType: string,
    abortSignal?: AbortSignal,
    deviceId?: string,
    length: number = 8
  ): Promise<ScanResult> {
    const serialPort = SerialPortManager.getCurrentPort(deviceId);
    if (!serialPort || !serialPort.isOpen) {
      return this.createFailedResult(id, baudRate, '串口未打开');
    }

    try {
      // 检查是否已中止
      if (abortSignal?.aborted) {
        throw new Error('扫描已中止');
      }

      // 构建读取命令，使用指定的长度
      const frame = LinCommandBuilder.buildReadSlaveCommand(id, length, checkType);
      
      // 发送命令
      logger.debug(`发送读取命令: ID=0x${id.toString(16).toUpperCase()}, 长度=${length}, 校验类型=${checkType}`);
      await serialPort.write(frame);
      await serialPort.drain();
      
      // 减少响应等待时间，提高扫描速度
      const response = await this.waitForResponse(serialPort, 300, abortSignal);
      
      if (response) {
        logger.debug(`接收到响应数据: ${response.toString('hex')}`);
        logger.debug(`原始串口数据（16位）: ${response.toString('hex')}`);
        logger.debug(`数据定义对比:`);
        logger.debug(`- 帧头: 0x${response[0].toString(16).padStart(2, '0')} (应为0x33)`);
        logger.debug(`- Channel: ${response[1]} (应为1)`);
        logger.debug(`- ID: 0x${response[2].toString(16).padStart(2, '0')}`);
        logger.debug(`- LIN DIR: ${response[3]} (应为1)`);
        logger.debug(`- Check Type: ${response[4]} (0=错误, 1=V1, 2=V2)`);
        logger.debug(`- Length: ${response[5]} (1-8)`);
        logger.debug(`- Data 0-7: ${response.slice(6, 14).toString('hex')}`);
        logger.debug(`- LIN Check: 0x${response[14].toString(16).padStart(2, '0')}`);
        logger.debug(`- CRC: 0x${response[15].toString(16).padStart(2, '0')}`);
        
        // 解析响应
        const parsedResult = this.parseResponse(id, baudRate, checkType, response);
        
        // 检查是否成功
        if (parsedResult.success) {
          // 检查校验标志位
          const checkTypeByte = response[4];
          let detectedCheckType = '未知';
          
          if (checkTypeByte === 1) {
            detectedCheckType = 'V1';
          } else if (checkTypeByte === 2) {
            detectedCheckType = 'V2';
          }
          
          // 验证数据长度
          const dataLength = parsedResult.dataLength;
          if (dataLength > 0 && dataLength <= 8 && parsedResult.data) {
            logger.info(`成功确定ID为0x${id.toString(16).toUpperCase()}的设备数据长度: ${dataLength}，校验类型: ${detectedCheckType}`);
            
            // 进行二次校验
            let secondaryCheckResult = false;
            if (detectedCheckType === 'V1' || detectedCheckType === 'V2') {
              // 根据类型计算校验和
              const calculatedChecksum = detectedCheckType === 'V1' ? 
                LinFrameParser.calculateV1Checksum(id, response, dataLength) : 
                LinFrameParser.calculateV2Checksum(id, response, dataLength);
              
              // 获取接收到的校验和
              const receivedChecksum = response[14];
              
              // 比较校验和
              secondaryCheckResult = (calculatedChecksum === receivedChecksum);
              logger.debug(`二次校验结果: ${secondaryCheckResult}, 计算得到的校验和: ${calculatedChecksum.toString(16).toUpperCase()}, 接收到的校验和: ${receivedChecksum.toString(16).toUpperCase()}`);
            }
            
            return {
              ...parsedResult,
              checkType: detectedCheckType,
              detectedChecksumType: detectedCheckType,
              hasData: true,
              needsVerification: true, // 标记需要用户验证
              checksumError: !secondaryCheckResult, // 根据二次校验结果设置
              secondaryCheck: true // 标记已进行二次校验
            };
          }
        } else {
          logger.debug(`解析响应失败: 校验和错误或格式不正确`);
        }
      }
    } catch (error) {
      logger.debug(`读取数据时失败: ${error}`);
    }

    // 如果读取失败，说明设备可能没有数据，返回失败结果
    logger.debug(`ID为0x${id.toString(16).toUpperCase()}的设备没有数据反馈`);
    return {
      id,
      baudRate,
      dataLength: 0,
      checkType,
      data: '',
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
      
      // 读取Check-Type字段（第4字节）
      const checkTypeByte = response[4];
      logger.debug(`读取到的校验和类型字节: ${checkTypeByte}`);
      
      // 读取LIN校验和值（第15位，索引14）
      const receivedChecksum = response[14];
      const receivedChecksumHex = receivedChecksum.toString(16).toUpperCase().padStart(2, '0');
      logger.debug(`接收到的校验和（第15位）: ${receivedChecksumHex}`);
      logger.debug(`原始串口数据: ${response.toString('hex')}`);
      
      // 读取CRC校验和值（第16位，索引15）
      const crcChecksum = response[15];
      const crcChecksumHex = crcChecksum.toString(16).toUpperCase().padStart(2, '0');
      logger.debug(`接收到的CRC校验和（第16位）: ${crcChecksumHex}`);
      
      // 使用LinFrameParser来解析和验证校验和
      // 计算V1和V2校验和
      const v1Checksum = LinFrameParser.calculateV1Checksum(id, response, dataLength);
      const v2Checksum = LinFrameParser.calculateV2Checksum(id, response, dataLength);
      logger.debug(`计算得到的V1校验和: ${v1Checksum.toString(16).toUpperCase().padStart(2, '0')}`);
      logger.debug(`计算得到的V2校验和: ${v2Checksum.toString(16).toUpperCase().padStart(2, '0')}`);
      
      // 计算CRC校验和（前15字节相加后，取反再加1）
      let calculatedCrc = 0;
      for (let i = 0; i < 15; i++) {
        calculatedCrc += response[i];
      }
      calculatedCrc = (((~calculatedCrc) & 0x000000FF) + 1) & 0xFF;
      logger.debug(`计算得到的CRC校验和: ${calculatedCrc.toString(16).toUpperCase().padStart(2, '0')}`);
      
      // 根据Check-Type字段和计算结果确定校验和类型
      let detectedChecksumType = '未知';
      let isChecksumCorrect = false;
      
      // 首先根据Check-Type字段确定校验和类型
      if (checkTypeByte === 1) {
        detectedChecksumType = 'V1';
        isChecksumCorrect = (receivedChecksum === v1Checksum);
        logger.debug(`根据Check-Type字段确定校验和类型为V1，验证结果: ${isChecksumCorrect ? '通过' : '失败'}`);
      } else if (checkTypeByte === 2) {
        detectedChecksumType = 'V2';
        isChecksumCorrect = (receivedChecksum === v2Checksum);
        logger.debug(`根据Check-Type字段确定校验和类型为V2，验证结果: ${isChecksumCorrect ? '通过' : '失败'}`);
      } else if (checkTypeByte === 0) {
        // 校验和错误，尝试自动检测
        if (receivedChecksum === v1Checksum) {
          detectedChecksumType = 'V1';
          isChecksumCorrect = true;
          logger.debug(`校验和错误，自动检测为V1，验证通过`);
        } else if (receivedChecksum === v2Checksum) {
          detectedChecksumType = 'V2';
          isChecksumCorrect = true;
          logger.debug(`校验和错误，自动检测为V2，验证通过`);
        } else {
          logger.debug(`校验和错误，无法自动检测校验和类型`);
        }
      } else {
        // Check-Type字段无效，尝试自动检测
        if (receivedChecksum === v1Checksum) {
          detectedChecksumType = 'V1';
          isChecksumCorrect = true;
          logger.debug(`Check-Type字段无效，自动检测为V1，验证通过`);
        } else if (receivedChecksum === v2Checksum) {
          detectedChecksumType = 'V2';
          isChecksumCorrect = true;
          logger.debug(`Check-Type字段无效，自动检测为V2，验证通过`);
        } else {
          logger.debug(`Check-Type字段无效，无法自动检测校验和类型`);
        }
      }
      
      // 创建结果，即使校验和错误也返回成功结果，因为数据本身是有效的
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
      checksum: '',
      detectedChecksumType: '未知',
      success: false,
      checksumError: true
    };
  }

  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getName(): string {
    return '顺序扫描';
  }

  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getDescription(): string {
    return '按顺序尝试每个波特率和ID组合，可靠性高，适合大多数场景';
  }
}
