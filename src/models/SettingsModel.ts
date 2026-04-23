/**
 * SettingsModel.ts
 * 管理应用程序的设置数据
 * 遵循MVVM架构模式的模型(Model)层
 */

// 语言类型
export type Language = 'zh-CN' | 'zh-TW' | 'en-US';

// 主题类型
export type Theme = 'light' | 'dark';

// 设置数据接口
export interface SettingsData {
  language: Language;
  theme: Theme;
}

// 默认设置
export const DEFAULT_SETTINGS: SettingsData = {
  language: 'zh-CN',
  theme: 'light'
};

/**
 * 设置模型类
 * 负责设置数据的存储、读取和管理
 */
export class SettingsModel {
  private settings: SettingsData;
  private readonly storageKey = 'app-settings';

  constructor() {
    // 从本地存储加载设置
    this.settings = this.loadSettings();
  }

  /**
   * 加载设置
   * 从本地存储读取设置数据，如果不存在则使用默认设置
   */
  private loadSettings(): SettingsData {
    try {
      const storedSettings = localStorage.getItem(this.storageKey);
      if (storedSettings) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * 保存设置
   * 将设置数据保存到本地存储
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * 获取所有设置
   */
  getSettings(): SettingsData {
    return { ...this.settings };
  }

  /**
   * 获取语言设置
   */
  getLanguage(): Language {
    return this.settings.language;
  }

  /**
   * 设置语言
   */
  setLanguage(language: Language): void {
    this.settings.language = language;
    this.saveSettings();
  }

  /**
   * 获取主题设置
   */
  getTheme(): Theme {
    return this.settings.theme;
  }

  /**
   * 设置主题
   */
  setTheme(theme: Theme): void {
    this.settings.theme = theme;
    this.saveSettings();
  }

  /**
   * 重置所有设置到默认值
   */
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

// 导出单例实例
export const settingsModel = new SettingsModel();
