/**
 * DeviceManagerViewModel.ts
 * 管理设备列表相关的业务逻辑
 * 遵循MVVM架构模式的视图模型(ViewModel)层
 */

import { ref, computed } from 'vue';
import { deviceModel, DeviceType, DEFAULT_DEVICE } from '../models/DeviceModel';

// 导入接口类型
import type { Device, SerialPortInfo } from '../models/DeviceModel';

/**
 * 设备管理视图模型类
 * 负责连接设备视图和设备模型，处理设备管理相关的业务逻辑
 */
export class DeviceManagerViewModel {
  // 响应式数据
  private _devices = ref<Device[]>(deviceModel.getDevices());
  private _availablePorts = ref<SerialPortInfo[]>(deviceModel.getAvailablePorts());
  private _selectedDeviceId = ref<string>('');

  /**
   * 设备列表
   */
  public get devices() {
    return this._devices.value;
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
   * 选中的设备ID
   */
  public get selectedDeviceId() {
    return this._selectedDeviceId.value;
  }

  public set selectedDeviceId(value: string) {
    this._selectedDeviceId.value = value;
  }

  /**
   * 选中的设备
   */
  public get selectedDevice() {
    return this._devices.value.find(device => device.id === this._selectedDeviceId.value);
  }

  /**
   * 设备类型列表
   */
  public get deviceTypes() {
    return Object.values(DeviceType);
  }

  /**
   * 加载设备列表
   * 从模型加载设备列表数据到视图模型
   */
  public loadDevices(): void {
    this._devices.value = deviceModel.getDevices();
    console.log('Devices loaded:', this._devices.value.length);
  }

  /**
   * 检查设备名称是否已存在
   * @param name 设备名称
   * @param excludeId 排除的设备ID（用于编辑设备时）
   */
  public isDeviceNameExists(name: string, excludeId: string = ''): boolean {
    return this._devices.value.some(device => device.name === name && device.id !== excludeId);
  }

  /**
   * 检查串口路径是否已被使用
   * @param port 串口路径
   * @param excludeId 排除的设备ID（用于编辑设备时）
   */
  public isPortInUse(port: string, excludeId: string = ''): boolean {
    return this._devices.value.some(device => device.serialConfig.port === port && device.id !== excludeId);
  }

  /**
   * 添加设备
   */
  public addDevice(deviceData: Omit<Device, 'id'>): Device | null {
    // 检查设备名称是否已存在
    if (this.isDeviceNameExists(deviceData.name)) {
      console.error('Device name already exists:', deviceData.name);
      throw new Error(`设备名称 "${deviceData.name}" 已存在，请使用其他名称`);
    }

    // 检查串口路径是否已被使用
    if (deviceData.serialConfig.port && this.isPortInUse(deviceData.serialConfig.port)) {
      console.error('Serial port already in use:', deviceData.serialConfig.port);
      throw new Error(`串口 "${deviceData.serialConfig.port}" 已被其他设备使用，请选择其他串口`);
    }

    const newDevice = deviceModel.addDevice(deviceData);
    this._devices.value = deviceModel.getDevices();
    this._selectedDeviceId.value = newDevice.id;
    console.log('Device added:', newDevice);
    return newDevice;
  }

  /**
   * 编辑设备
   */
  public updateDevice(id: string, deviceData: Partial<Device>): boolean {
    // 检查设备名称是否已被其他设备使用
    if (deviceData.name && this.isDeviceNameExists(deviceData.name, id)) {
      console.error('Device name already exists:', deviceData.name);
      throw new Error(`设备名称 "${deviceData.name}" 已存在，请使用其他名称`);
    }

    // 检查串口路径是否已被其他设备使用
    if (deviceData.serialConfig?.port && this.isPortInUse(deviceData.serialConfig.port, id)) {
      console.error('Serial port already in use:', deviceData.serialConfig.port);
      throw new Error(`串口 "${deviceData.serialConfig.port}" 已被其他设备使用，请选择其他串口`);
    }

    const success = deviceModel.updateDevice(id, deviceData);
    if (success) {
      this._devices.value = deviceModel.getDevices();
      console.log('Device updated:', id, deviceData);
    }
    return success;
  }

  /**
   * 删除设备
   */
  public deleteDevice(id: string): boolean {
    const success = deviceModel.deleteDevice(id);
    if (success) {
      this._devices.value = deviceModel.getDevices();
      if (this._selectedDeviceId.value === id) {
        this._selectedDeviceId.value = this._devices.value.length > 0 ? this._devices.value[0].id : '';
      }
      console.log('Device deleted:', id);
    }
    return success;
  }

  /**
   * 获取设备
   */
  public getDevice(id: string): Device | undefined {
    return deviceModel.getDeviceById(id);
  }

  /**
   * 刷新可用串口列表
   */
  public refreshAvailablePorts(ports: SerialPortInfo[]): void {
    this.availablePorts = ports;
    console.log('Available ports refreshed:', ports.length);
  }

  /**
   * 更新设备状态
   */
  public updateDeviceStatus(id: string, status: Partial<Device['status']>): boolean {
    const success = deviceModel.updateDeviceStatus(id, status);
    if (success) {
      this._devices.value = deviceModel.getDevices();
      console.log('Device status updated:', id, status);
    }
    return success;
  }

  /**
   * 创建默认设备
   */
  public createDefaultDevice(): Omit<Device, 'id'> {
    return {
      ...DEFAULT_DEVICE,
      name: `新设备_${Date.now()}`
    };
  }

  /**
   * 重置设备列表
   */
  public resetDevices(): void {
    deviceModel.resetToDefaults();
    this._devices.value = [];
    this._selectedDeviceId.value = '';
    console.log('Devices reset to defaults');
  }

  /**
   * 获取已使用的串口列表
   */
  public getUsedPorts(): string[] {
    return this._devices.value
      .filter(device => device.serialConfig.port)
      .map(device => device.serialConfig.port!);
  }

  /**
   * 获取可用的未被使用的串口列表
   * @param excludeDeviceId 排除的设备ID，用于编辑设备时保留当前设备的串口
   */
  public getAvailableUnusedPorts(excludeDeviceId: string = ''): SerialPortInfo[] {
    const usedPorts = this._devices.value
      .filter(device => device.serialConfig.port && device.id !== excludeDeviceId)
      .map(device => device.serialConfig.port!);
    return this._availablePorts.value.filter(port => !usedPorts.includes(port.path));
  }
}

// 导出单例实例
export const deviceManagerViewModel = new DeviceManagerViewModel();