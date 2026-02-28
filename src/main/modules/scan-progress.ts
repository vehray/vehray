/**
 * 
 * 扫描进度回调函数类型
 */
export type ProgressCallback = (
  current: number,
  total: number,
  message: string
) => void;

/**
 * 扫描进度管理器
 * 用于跟踪和报告扫描进度
 */
export class ScanProgress {
  private current: number = 0;
  private total: number = 0;
  private callbacks: ProgressCallback[] = [];
  private isStarted: boolean = false;
  private isCompleted: boolean = false;
  private isFailed: boolean = false;
  private errorMessage: string = '';
  private currentLinId: string = '';
  private currentBaudRate: string = '';

  /**
   * 开始进度跟踪
   * @param total 总任务数
   */
  start(total: number): void {
    this.total = total;
    this.current = 0;
    this.isStarted = true;
    this.isCompleted = false;
    this.isFailed = false;
    this.errorMessage = '';
    this.currentLinId = '';
    this.notifyProgress();
  }

  /**
   * 更新进度
   * @param current 当前完成任务数
   * @param message 进度消息
   */
  update(current: number, message: string = ''): void {
    if (!this.isStarted || this.isCompleted || this.isFailed) {
      return;
    }

    this.current = Math.min(current, this.total);
    
    // 从消息中解析LIN ID
    const linIdMatch = message.match(/ID 0x([0-9A-F]+)/);
    if (linIdMatch) {
      this.currentLinId = linIdMatch[1];
    }
    
    // 从消息中解析波特率
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
  increment(increment: number = 1, message: string = ''): void {
    this.update(this.current + increment, message);
  }

  /**
   * 完成进度跟踪
   */
  complete(): void {
    this.isCompleted = true;
    this.current = this.total;
    this.currentLinId = '';
    this.notifyProgress('扫描完成');
  }

  /**
   * 失败
   * @param errorMessage 错误消息
   */
  fail(errorMessage: string): void {
    this.isFailed = true;
    this.errorMessage = errorMessage;
    this.currentLinId = '';
    this.notifyProgress(`扫描失败: ${errorMessage}`);
  }

  /**
   * 获取当前LIN ID
   * @returns 当前LIN ID
   */
  getCurrentLinId(): string {
    return this.currentLinId;
  }

  /**
   * 获取当前波特率
   * @returns 当前波特率
   */
  getCurrentBaudRate(): string {
    return this.currentBaudRate;
  }

  /**
   * 注册进度回调
   * @param callback 回调函数
   * @returns 取消注册函数
   */
  onProgress(callback: ProgressCallback): () => void {
    this.callbacks.push(callback);
    
    // 如果已经开始，立即通知当前进度
    if (this.isStarted) {
      this.notifyProgress();
    }

    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有回调
   * @param message 进度消息
   */
  private notifyProgress(message: string = ''): void {
    const progressMessage = message || `正在扫描... ${this.current}/${this.total}`;
    this.callbacks.forEach(callback => {
      try {
        callback(this.current, this.total, progressMessage);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  /**
   * 获取当前进度
   * @returns 当前完成任务数
   */
  getCurrent(): number {
    return this.current;
  }

  /**
   * 获取总任务数
   * @returns 总任务数
   */
  getTotal(): number {
    return this.total;
  }

  /**
   * 获取进度百分比
   * @returns 进度百分比
   */
  getPercentage(): number {
    if (this.total === 0) {
      return 0;
    }
    return Math.round((this.current / this.total) * 100);
  }

  /**
   * 是否已开始
   * @returns 是否已开始
   */
  getIsStarted(): boolean {
    return this.isStarted;
  }

  /**
   * 是否已完成
   * @returns 是否已完成
   */
  getIsCompleted(): boolean {
    return this.isCompleted;
  }

  /**
   * 是否失败
   * @returns 是否失败
   */
  getIsFailed(): boolean {
    return this.isFailed;
  }

  /**
   * 获取错误消息
   * @returns 错误消息
   */
  getErrorMessage(): string {
    return this.errorMessage;
  }

  /**
   * 重置进度
   */
  reset(): void {
    this.current = 0;
    this.total = 0;
    this.isStarted = false;
    this.isCompleted = false;
    this.isFailed = false;
    this.errorMessage = '';
  }
}

/**
 * 进度事件类型
 */
export interface ProgressEvent {
  current: number;
  total: number;
  percentage: number;
  message: string;
  isCompleted: boolean;
  isFailed: boolean;
  errorMessage: string;
}
