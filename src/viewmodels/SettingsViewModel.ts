/**
 * SettingsViewModel.ts
 * 管理设置相关的业务逻辑
 * 遵循MVVM架构模式的视图模型(ViewModel)层
 */

import { ref, computed } from 'vue';
import { settingsModel, Language, Theme, SettingsData } from '../models/SettingsModel';

/**
 * 设置视图模型类
 * 负责连接设置视图和设置模型，处理设置相关的业务逻辑
 */
export class SettingsViewModel {
  // 响应式数据
  private _language = ref<Language>(settingsModel.getLanguage());
  private _theme = ref<Theme>(settingsModel.getTheme());

  /**
   * 语言
   */
  public get language() {
    return this._language.value;
  }

  public set language(value: Language) {
    this._language.value = value;
    this.handleLanguageChange(value);
  }

  /**
   * 主题
   */
  public get theme() {
    return this._theme.value;
  }

  public set theme(value: Theme) {
    this._theme.value = value;
    this.handleThemeChange(value);
  }

  /**
   * 处理语言变更
   * @param language 新的语言
   */
  private handleLanguageChange(language: Language): void {
    try {
      // 保存到模型
      settingsModel.setLanguage(language);
      // 应用语言变更
      this.applyLanguage(language);
      console.log('Language changed to:', language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  /**
   * 处理主题变更
   * @param theme 新的主题
   */
  private handleThemeChange(theme: Theme): void {
    try {
      // 保存到模型
      settingsModel.setTheme(theme);
      // 应用主题变更
      this.applyTheme(theme);
      console.log('Theme changed to:', theme);
    } catch (error) {
      console.error('Failed to change theme:', error);
    }
  }

  /**
   * 应用语言变更
   * @param language 语言
   */
  private applyLanguage(language: Language): void {
    // 这里可以实现语言包的加载和应用
    // 目前只做简单的控制台输出
    console.log('Applying language:', language);
    
    // 示例：更新文档标题
    if (language === 'zh-CN') {
      document.title = 'LINAnalyzer - 设置';
    } else {
      document.title = 'LINAnalyzer - Settings';
    }
  }

  /**
   * 应用主题变更
   * @param theme 主题
   */
  private applyTheme(theme: Theme): void {
    // 移除现有的主题类
    document.body.classList.remove('theme-light', 'theme-dark');
    // 添加新的主题类
    document.body.classList.add(`theme-${theme}`);
    
    // 这里可以实现更复杂的主题切换逻辑
    console.log('Applying theme:', theme);
  }

  /**
   * 加载设置
   * 从模型加载设置数据到视图模型
   */
  public loadSettings(): void {
    const settings = settingsModel.getSettings();
    this._language.value = settings.language;
    this._theme.value = settings.theme;
    
    // 应用设置
    this.applyLanguage(settings.language);
    this.applyTheme(settings.theme);
    
    console.log('Settings loaded:', settings);
  }

  /**
   * 重置设置
   * 重置所有设置到默认值
   */
  public resetSettings(): void {
    settingsModel.resetToDefaults();
    this.loadSettings();
    console.log('Settings reset to defaults');
  }

  /**
   * 获取当前设置
   */
  public getCurrentSettings(): SettingsData {
    return settingsModel.getSettings();
  }
}

// 导出单例实例
export const settingsViewModel = new SettingsViewModel();
