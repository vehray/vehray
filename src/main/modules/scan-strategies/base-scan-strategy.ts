import type { ScanParams } from '../lin-controller.ts';
import type { ScanResult } from '../lin-controller.ts';
import { ScanProgress } from '../scan-progress.ts';
import { SequentialScanStrategy } from './sequential-scan.ts';
import { ParallelScanStrategy } from './parallel-scan.ts';
import { AdaptiveScanStrategy } from './adaptive-scan.ts';

/**
 * 扫描策略接口
 * 定义了不同扫描算法的统一接口
 */
export interface ScanStrategy {
  /**
   * 执行扫描
   * @param params 扫描参数
   * @param progress 进度管理器
   * @param abortSignal 中止信号
   * @returns 扫描结果数组
   */
  scan(
    params: ScanParams,
    progress: ScanProgress,
    abortSignal?: AbortSignal
  ): Promise<ScanResult[]>;

  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getName(): string;

  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getDescription(): string;
}

/**
 * 扫描策略工厂
 * 用于创建不同的扫描策略实例
 */
export class ScanStrategyFactory {
  /**
   * 创建扫描策略
   * @param strategyType 策略类型
   * @returns 扫描策略实例
   */
  static createStrategy(strategyType: string): ScanStrategy {
    switch (strategyType.toLowerCase()) {
      case 'sequential':
        return new SequentialScanStrategy();
      case 'parallel':
        return new ParallelScanStrategy();
      case 'adaptive':
        return new AdaptiveScanStrategy();
      default:
        return new SequentialScanStrategy();
    }
  }
}

/**
 * 扫描策略类型
 */
export type StrategyType = 'sequential' | 'parallel' | 'adaptive';
