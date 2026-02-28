/**
 * DeviceViewModel.ts
 * 管理设备连接相关的业务逻辑
 * 遵循MVVM架构模式的视图模型(ViewModel)层
 */

import { ref, computed } from 'vue';
import { deviceModel, SerialConfig, LinConfig, DeviceStatus, SerialPortInfo } from '../models/DeviceModel';

/**
 * 设备视图模型类
 * 负责连接设备视图和设备模型，处理设备连接相关的业务逻辑
 */
export class DeviceViewModel {
  // 响应式数据
  private _serialConfig = ref<SerialConfig>(deviceModel.getSerialConfig());
  private _linConfig = ref<LinConfig>(deviceModel.getLinConfig());
  private _deviceStatus = ref<DeviceStatus>(deviceModel.getDeviceStatus());
  private _availablePorts = ref<SerialPortInfo[]>(deviceModel.getAvailablePorts());

  /**
   * 串口配置
   */
  public get serialConfig() {
    return this._serialConfig.value;
  }

  public set serialConfig(value: SerialConfig) {
    this._serialConfig.value = value;
    deviceModel.setSerialConfig(value);
  }

  /**
   * LIN配置
   */
  public get linConfig() {
    return this._linConfig.value;
  }

  public set linConfig(value: LinConfig) {
    this._linConfig.value = value;
    deviceModel.setLinConfig(value);
  }

  /**
   * 设备状态
   */
  public get deviceStatus() {
    return this._deviceStatus.value;
  }

  public set deviceStatus(value: DeviceStatus) {
    this._deviceStatus.value = value;
    deviceModel.setDeviceStatus(value);
  }

  /**
   * 可用串口列表
   */
  public get availablePorts() {
    return this._availablePorts.value;
  }

  public set availablePorts(value: SerialPortInfo[]) {
    this._availablePorts.value = value;
    deviceModel.setAvailablePorts(value);
  }

  /**
   * 串口连接状态
   */
  public get serialConnected() {
    return this._deviceStatus.value.serialConnected;
  }

  public set serialConnected(value: boolean) {
    this._deviceStatus.value = {
      ...this._deviceStatus.value,
      serialConnected: value
    };
    deviceModel.setDeviceStatus({ serialConnected: value });
  }

  /**
   * LIN状态
   */
  public get linStatus() {
    return this._deviceStatus.value.linStatus;
  }

  public set linStatus(value: boolean) {
    this._deviceStatus.value = {
      ...this._deviceStatus.value,
      linStatus: value
    };
    deviceModel.setDeviceStatus({ linStatus: value });
  }

  /**
   * 自动重连
   */
  public get autoReconnect() {
    return this._deviceStatus.value.autoReconnect;
  }

  public set autoReconnect(value: boolean) {
    this._deviceStatus.value = {
      ...this._deviceStatus.value,
      autoReconnect: value
    };
    deviceModel.setDeviceStatus({ autoReconnect: value });
  }

  /**
   * 处理串口配置变更
   * @param config 新的串口配置
   */
  public handleSerialConfigChange(config: Partial<SerialConfig>): void {
    this.serialConfig = {
      ...this.serialConfig,
      ...config
    };
    console.log('Serial config changed:', this.serialConfig);
  }

  /**
   * 处理LIN配置变更
   * @param config 新的LIN配置
   */
  public handleLinConfigChange(config: Partial<LinConfig>): void {
    this.linConfig = {
      ...this.linConfig,
      ...config
    };
    console.log('LIN config changed:', this.linConfig);
  }

  /**
   * 处理自动重连变更
   * @param value 新的自动重连状态
   */
  public handleAutoReconnectChange(value: boolean): void {
    this.autoReconnect = value;
    console.log('Auto reconnect changed:', this.autoReconnect);
  }

  /**
   * 加载设备状态
   * 从模型加载设备状态数据到视图模型
   */
  public loadDeviceStatus(): void {
    this._serialConfig.value = deviceModel.getSerialConfig();
    this._linConfig.value = deviceModel.getLinConfig();
    this._deviceStatus.value = deviceModel.getDeviceStatus();
    this._availablePorts.value = deviceModel.getAvailablePorts();
    
    console.log('Device status loaded:', {
      serialConfig: this.serialConfig,
      linConfig: this.linConfig,
      deviceStatus: this.deviceStatus,
      availablePorts: this.availablePorts.length
    });
  }

  /**
   * 重置设备配置
   * 重置所有设备配置到默认值
   */
  public resetDeviceConfig(): void {
    deviceModel.resetToDefaults();
    this.loadDeviceStatus();
    console.log('Device config reset to defaults');
  }

  /**
   * 刷新可用串口列表
   * @param ports 新的可用串口列表
   */
  public refreshAvailablePorts(ports: SerialPortInfo[]): void {
    this.availablePorts = ports;
    console.log('Available ports refreshed:', ports.length);
  }

  /**
   * 获取当前设备配置
   */
  public getCurrentDeviceConfig() {
    return {
      serialConfig: this.serialConfig,
      linConfig: this.linConfig,
      deviceStatus: this.deviceStatus,
      availablePorts: this.availablePorts
    };
  }
}

// 导出单例实例
export const deviceViewModel = new DeviceViewModel();
