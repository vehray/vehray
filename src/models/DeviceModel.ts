/**
 * DeviceModel.ts
 * 管理设备连接相关的数据
 * 遵循MVVM架构模式的模型(Model)层
 */

// 设备类型常量
export const DeviceType = {
  LINTEST_M: 'LINTest-M',
  GENERIC: 'Generic'
} as const;

export type DeviceType = typeof DeviceType[keyof typeof DeviceType];

// 串口信息接口
export interface SerialPortInfo {
  path: string;
  manufacturer: string;
  serialNumber: string;
  pnpId: string;
  locationId: string;
}

// 串口配置接口
export interface SerialConfig {
  port: string;
  baudRate: number;
}

// LIN配置接口
export interface LinConfig {
  baudRate: number;
  mode: number;
}

// 设备状态接口
export interface DeviceStatus {
  serialConnected: boolean;
  linStatus: boolean;
  autoReconnect: boolean;
}

// 设备接口
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  serialConfig: SerialConfig;
  linConfig: LinConfig;
  status: DeviceStatus;
}

// 默认串口配置
export const DEFAULT_SERIAL_CONFIG: SerialConfig = {
  port: '',
  baudRate: 460800
};

// 默认LIN配置
export const DEFAULT_LIN_CONFIG: LinConfig = {
  baudRate: 19200,
  mode: 0 // 0: 待机, 1: 主机, 2: 从机, 3: 监听
};

// 默认设备状态
export const DEFAULT_DEVICE_STATUS: DeviceStatus = {
  serialConnected: false,
  linStatus: false,
  autoReconnect: true
};

// 默认设备
export const DEFAULT_DEVICE: Device = {
  id: '',
  name: '新设备',
  type: DeviceType.LINTEST_M,
  serialConfig: { ...DEFAULT_SERIAL_CONFIG },
  linConfig: { ...DEFAULT_LIN_CONFIG },
  status: { ...DEFAULT_DEVICE_STATUS }
};

/**
 * 设备模型类
 * 负责设备连接数据的管理
 */
export class DeviceModel {
  private devices: Device[];
  private availablePorts: SerialPortInfo[];

  constructor() {
    // 初始化默认配置
    this.devices = [];
    this.availablePorts = [];
  }

  /**
   * 获取设备列表
   */
  getDevices(): Device[] {
    return [...this.devices];
  }

  /**
   * 根据ID获取设备
   */
  getDeviceById(id: string): Device | undefined {
    return this.devices.find(device => device.id === id);
  }

  /**
   * 添加设备
   */
  addDevice(device: Omit<Device, 'id'>): Device {
    const newDevice: Device = {
      ...device,
      id: `device_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    this.devices.push(newDevice);
    return newDevice;
  }

  /**
   * 更新设备
   */
  updateDevice(id: string, deviceData: Partial<Device>): boolean {
    const index = this.devices.findIndex(device => device.id === id);
    if (index !== -1) {
      this.devices[index] = { ...this.devices[index], ...deviceData };
      return true;
    }
    return false;
  }

  /**
   * 删除设备
   */
  deleteDevice(id: string): boolean {
    const index = this.devices.findIndex(device => device.id === id);
    if (index !== -1) {
      this.devices.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取可用串口列表
   */
  getAvailablePorts(): SerialPortInfo[] {
    return [...this.availablePorts];
  }

  /**
   * 设置可用串口列表
   */
  setAvailablePorts(ports: SerialPortInfo[]): void {
    this.availablePorts = [...ports];
  }

  /**
   * 更新设备状态
   */
  updateDeviceStatus(id: string, status: Partial<DeviceStatus>): boolean {
    const device = this.devices.find(device => device.id === id);
    if (device) {
      device.status = { ...device.status, ...status };
      return true;
    }
    return false;
  }

  /**
   * 重置所有配置到默认值
   */
  resetToDefaults(): void {
    this.devices = [];
    this.availablePorts = [];
  }
}

// 导出单例实例
export const deviceModel = new DeviceModel();
