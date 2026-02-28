import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger.ts';

// 设置文件路径
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

/**
 * 设置管理器
 * 用于处理设置的保存和读取
 */
export class SettingsManager {
  /**
   * 保存设置到文件
   * @param settings 设置对象
   * @returns 保存结果
   */
  static saveSettings(settings: any): { success: boolean; message: string } {
    try {
      // 确保目录存在
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入设置文件
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      logger.info(`Settings saved successfully: ${settingsPath}`);
      return { success: true, message: 'Settings saved successfully' };
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
  static readSettings(): { success: boolean; data: any | null; message: string } {
    try {
      // 检查设置文件是否存在
      if (!fs.existsSync(settingsPath)) {
        logger.info(`Settings file does not exist, returning default settings: ${settingsPath}`);
        return { success: true, data: null, message: 'Settings file does not exist, returning default settings' };
      }
      
      // 读取设置文件
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      logger.info(`Settings read successfully: ${settingsPath}`);
      return { success: true, data: settings, message: 'Settings read successfully' };
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
  static getSettingsPath(): string {
    return settingsPath;
  }
}
