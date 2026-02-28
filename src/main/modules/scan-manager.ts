import type { ScanParams } from './lin-controller.ts';
import type { ScanResult } from './lin-controller.ts';
import { ScanStrategyFactory } from './scan-strategies/base-scan-strategy.ts';
import type { ScanStrategy, StrategyType } from './scan-strategies/base-scan-strategy.ts';
import { ScanProgress } from './scan-progress.ts';
import { logger } from './logger.ts';
import { ipcMain, BrowserWindow } from 'electron';

/**
 * 扫描管理器
 * 负责协调扫描过程，管理扫描策略和进度
 */
export class ScanManager {
  private strategy: ScanStrategy;
  private progress: ScanProgress;
  private abortController: AbortController | null = null;
  private isScanning: boolean = false;
  private isPaused: boolean = false;
  private isWaitingForUserInput: boolean = false;
  private scanId: string | null = null;
  private userInputPromise: { resolve: (value: boolean) => void } | null = null;

  /**
   * 构造函数
   * @param strategyType 扫描策略类型
   */
  constructor(strategyType: StrategyType = 'sequential') {
    this.strategy = ScanStrategyFactory.createStrategy(strategyType);
    this.progress = new ScanProgress();
  }

  /**
   * 设置扫描策略
   * @param strategyType 扫描策略类型
   */
  setStrategy(strategyType: StrategyType): void {
    this.strategy = ScanStrategyFactory.createStrategy(strategyType);
    logger.info(`扫描策略已设置为: ${this.strategy.getName()}`);
  }

  /**
   * 获取当前扫描策略
   * @returns 当前扫描策略
   */
  getStrategy(): ScanStrategy {
    return this.strategy;
  }

  /**
   * 获取扫描进度管理器
   * @returns 扫描进度管理器
   */
  getProgress(): ScanProgress {
    return this.progress;
  }

  /**
   * 开始扫描
   * @param params 扫描参数
   * @returns 扫描结果数组
   */
  async scan(params: ScanParams): Promise<ScanResult[]> {
    if (this.isScanning) {
      throw new Error('扫描已在进行中');
    }

    try {
      this.isScanning = true;
      this.isPaused = false;
      this.abortController = new AbortController();
      this.scanId = (params as any).scanId || null;
      
      // 计算总任务数
      const totalTasks = params.baudRates.length * (params.idRange[1] - params.idRange[0] + 1);
      this.progress.start(totalTasks);

      logger.info(`开始扫描，策略: ${this.strategy.getName()}`);
      logger.debug('扫描参数:', params);

      // 执行扫描
      const results = await this.strategy.scan(
        params,
        this.progress,
        this.abortController.signal
      );

      logger.info(`扫描完成，发现 ${results.length} 个从机`);
      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('扫描已中止');
        this.progress.fail('扫描已中止');
        return [];
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`扫描失败: ${errorMessage}`);
      this.progress.fail(errorMessage);
      throw error;
    } finally {
      // 确保所有状态被重置
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
  emitScanResultEvent(result: ScanResult): void {
    if (this.scanId) {
      try {
        // 获取所有打开的窗口
        const windows = BrowserWindow.getAllWindows();
        
        // 向所有窗口发送扫描结果事件
        windows.forEach(window => {
          try {
            window.webContents.send('scan:result', {
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
            logger.warn('向窗口发送扫描结果事件失败:', error);
          }
        });
      } catch (error) {
        logger.warn('发送扫描结果事件失败:', error);
      }
    }
  }

  /**
   * 等待用户输入
   * @returns Promise<boolean> 用户是否选择继续扫描
   */
  async waitForUserInput(): Promise<boolean> {
    this.isWaitingForUserInput = true;
    logger.debug('开始等待用户输入，isWaitingForUserInput:', this.isWaitingForUserInput);
    
    // 创建一个新的Promise来等待用户输入
    return new Promise<boolean>((resolve) => {
      // 保存resolve函数的引用
      const resolveUserInput = (value: boolean) => {
        // 确保状态被正确重置
        this.isWaitingForUserInput = false;
        this.userInputPromise = null;
        logger.debug('用户输入已处理，选择:', value, 'isWaitingForUserInput:', this.isWaitingForUserInput, 'userInputPromise:', this.userInputPromise);
        resolve(value);
      };
      
      // 保存resolve函数
      this.userInputPromise = { resolve: resolveUserInput };
      logger.debug('用户输入Promise已创建，userInputPromise:', this.userInputPromise !== null);
      
      // 检查是否已经被中止
      if (this.abortController?.signal.aborted) {
        logger.debug('扫描已中止，自动选择停止');
        resolveUserInput(false);
      }
    });
  }

  /**
   * 处理用户输入
   * @param continueScanning 用户是否选择继续扫描
   */
  handleUserInput(continueScanning: boolean): void {
    logger.debug('收到用户输入处理请求，继续扫描:', continueScanning, 'isWaitingForUserInput:', this.isWaitingForUserInput, 'userInputPromise存在:', this.userInputPromise !== null);
    
    // 确保userInputPromise存在且包含resolve方法
    if (this.userInputPromise && typeof this.userInputPromise.resolve === 'function') {
      try {
        // 调用resolve函数
        const promise = this.userInputPromise;
        promise.resolve(continueScanning);
        logger.debug('用户输入Promise已解析，继续扫描:', continueScanning);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`处理用户输入失败: ${errorMessage}`);
      }
    } else {
      logger.warn('用户输入处理失败: userInputPromise不存在或不包含resolve方法');
    }
  }

  /**
   * 检查是否正在等待用户输入
   * @returns boolean 是否正在等待用户输入
   */
  isWaitingForInput(): boolean {
    return this.isWaitingForUserInput;
  }

  /**
   * 检查是否正在等待用户输入
   * @returns boolean 是否正在等待用户输入
   */
  getIsWaitingForInput(): boolean {
    return this.isWaitingForUserInput;
  }

  /**
   * 暂停扫描
   */
  pause(): void {
    if (this.isScanning && !this.isPaused) {
      this.isPaused = true;
      logger.info('扫描已暂停');
      this.progress.updateMessage('扫描已暂停');
    }
  }

  /**
   * 恢复扫描
   */
  resume(): void {
    if (this.isScanning && this.isPaused) {
      this.isPaused = false;
      logger.info('扫描已恢复');
      this.progress.updateMessage('扫描已恢复');
    }
  }

  /**
   * 检查是否已暂停
   * @returns 是否已暂停
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * 中止扫描
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      logger.info('扫描已中止');
    }
    
    // 重置扫描状态
    this.isScanning = false;
    this.isPaused = false;
    this.isWaitingForUserInput = false;
    this.userInputPromise = null;
  }

  /**
   * 检查是否正在扫描
   * @returns 是否正在扫描
   */
  getIsScanning(): boolean {
    return this.isScanning;
  }

  /**
   * 重置扫描管理器
   */
  reset(): void {
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
  onProgress(callback: (current: number, total: number, message: string) => void): () => void {
    return this.progress.onProgress(callback);
  }
}

/**
 * 全局扫描管理器实例
 */
let globalScanManager: ScanManager | null = null;

/**
 * 获取全局扫描管理器实例
 * @returns 全局扫描管理器实例
 */
export function getScanManager(): ScanManager {
  if (!globalScanManager) {
    globalScanManager = new ScanManager();
  }
  return globalScanManager;
}

/**
 * 销毁全局扫描管理器实例
 */
export function destroyScanManager(): void {
  if (globalScanManager) {
    globalScanManager.reset();
    globalScanManager = null;
  }
}
