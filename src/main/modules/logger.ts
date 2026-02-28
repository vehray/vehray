// 日志级别常量
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  OFF: 4
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// 日志管理器配置接口
interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
}

// 默认日志配置
const defaultConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  enabled: true
};

// 日志管理器类
export class Logger {
  private config: LoggerConfig;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  // 设置日志级别
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
  
  // 关闭日志
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
  
  // 获取当前日志级别
  getLevel(): LogLevel {
    return this.config.level;
  }
  
  // 获取当前日志开关状态
  getEnabled(): boolean {
    return this.config.enabled;
  }
  
  // 调试日志
  debug(...args: any[]): void {
    if (this.config.enabled && this.config.level <= LogLevel.DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  }
  
  // 信息日志
  info(...args: any[]): void {
    if (this.config.enabled && this.config.level <= LogLevel.INFO) {
      console.info('[INFO]', ...args);
    }
  }
  
  // 警告日志
  warn(...args: any[]): void {
    if (this.config.enabled && this.config.level <= LogLevel.WARN) {
      console.warn('[WARN]', ...args);
    }
  }
  
  // 错误日志
  error(...args: any[]): void {
    if (this.config.enabled && this.config.level <= LogLevel.ERROR) {
      console.error('[ERROR]', ...args);
    }
  }
}

// 导出默认日志实例
export const logger = new Logger();
