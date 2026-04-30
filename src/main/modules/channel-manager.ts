import { PcanLinManager } from './pcan-lin-manager.ts';
import { SerialPortManager } from './serial-manager.ts';
import type { BrowserWindow } from 'electron';

export type ChannelType = 'lin' | 'can' | 'serial';

export interface HardwareOption {
  id: string;
  name: string;
  provider: string;
  extra?: Record<string, string | number | boolean>;
}

export interface ChannelDescriptor {
  id: string;
  name: string;
  type: ChannelType;
  enabled: boolean;
  binding: {
    hardwareId: string | null;
    hardwareName: string | null;
  };
}

export interface CommandResult {
  success: boolean;
  message: string;
}

const channels: ChannelDescriptor[] = [
  {
    id: 'lin-primary',
    name: 'LIN 主通道',
    type: 'lin',
    enabled: true,
    binding: {
      hardwareId: null,
      hardwareName: null
    }
  },
  {
    id: 'can-primary',
    name: 'CAN 主通道',
    type: 'can',
    enabled: true,
    binding: {
      hardwareId: null,
      hardwareName: null
    }
  },
  {
    id: 'serial-primary',
    name: '串口主通道',
    type: 'serial',
    enabled: true,
    binding: {
      hardwareId: null,
      hardwareName: null
    }
  }
];

const cloneChannels = (): ChannelDescriptor[] => channels.map((channel) => ({ ...channel, binding: { ...channel.binding } }));
const canOpenSessions = new Map<string, { bitrate: number; openedAt: number }>();
const serialChannelDeviceMap = new Map<string, string>();
const defaultChannelByType: Record<ChannelType, string> = {
  lin: 'lin-primary',
  can: 'can-primary',
  serial: 'serial-primary'
};

export class ChannelManager {
  private static getChannel(channelId: string): ChannelDescriptor | undefined {
    return channels.find((item) => item.id === channelId);
  }

  private static getBoundHardware(channelId: string): { channel: ChannelDescriptor; hardwareId: string } | null {
    const channel = this.getChannel(channelId);
    if (!channel || !channel.binding.hardwareId) {
      return null;
    }
    return { channel, hardwareId: channel.binding.hardwareId };
  }

  static async listChannels(): Promise<ChannelDescriptor[]> {
    return cloneChannels();
  }

  static getDefaultChannels(): Record<ChannelType, string> {
    return { ...defaultChannelByType };
  }

  static getDefaultChannelId(channelType: ChannelType): string {
    return defaultChannelByType[channelType];
  }

  static setDefaultChannel(channelType: ChannelType, channelId: string): CommandResult {
    const channel = channels.find((item) => item.id === channelId);
    if (!channel) return { success: false, message: `通道不存在: ${channelId}` };
    if (channel.type !== channelType) return { success: false, message: `通道类型不匹配: ${channelId}` };
    defaultChannelByType[channelType] = channelId;
    return { success: true, message: `默认${channelType.toUpperCase()}通道已设置` };
  }

  static async listHardwareOptions(channelType: ChannelType): Promise<HardwareOption[]> {
    if (channelType === 'lin') {
      const pcanDevices = await PcanLinManager.listDevices();
      return pcanDevices.map((device) => ({
        id: device.id,
        name: `${device.name}${device.connected ? '' : ' (未连接)'}`,
        provider: 'PCAN',
        extra: {
          channel: device.channel,
          connected: device.connected,
          backend: device.backend
        }
      }));
    }

    if (channelType === 'can') {
      return [
        { id: 'pcanusbpro-can1', name: 'PCAN-USB Pro CAN 1', provider: 'PCAN', extra: { channel: 'CAN1' } },
        { id: 'pcanusbpro-can2', name: 'PCAN-USB Pro CAN 2', provider: 'PCAN', extra: { channel: 'CAN2' } }
      ];
    }

    if (channelType === 'serial') {
      const serialPorts = await SerialPortManager.getPorts();
      return serialPorts.map((port) => ({
        id: `serial:${port.path}`,
        name: `${port.path} (${port.manufacturer || 'Unknown'})`,
        provider: 'SerialPort'
      }));
    }

    return [];
  }

  static async bindHardware(channelId: string, hardwareId: string): Promise<CommandResult> {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return { success: false, message: `通道不存在: ${channelId}` };
    }

    const options = await this.listHardwareOptions(channel.type);
    const target = options.find((option) => option.id === hardwareId);
    if (!target) {
      return { success: false, message: `硬件不存在: ${hardwareId}` };
    }

    channel.binding.hardwareId = target.id;
    channel.binding.hardwareName = target.name;
    return { success: true, message: `通道 ${channel.name} 已绑定 ${target.name}` };
  }

  static async unbindHardware(channelId: string): Promise<CommandResult> {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return { success: false, message: `通道不存在: ${channelId}` };
    }
    channel.binding.hardwareId = null;
    channel.binding.hardwareName = null;
    return { success: true, message: `通道 ${channel.name} 已解绑` };
  }

  static async openLinChannel(channelId: string, baudRate: number): Promise<CommandResult> {
    const bound = this.getBoundHardware(channelId);
    if (!bound) {
      return { success: false, message: `通道未绑定硬件: ${channelId}` };
    }
    if (bound.channel.type !== 'lin') {
      return { success: false, message: `通道类型不是 LIN: ${channelId}` };
    }
    return await PcanLinManager.openDevice({ deviceId: bound.hardwareId, baudRate });
  }

  static async openDefaultLinChannel(baudRate: number): Promise<CommandResult> {
    return this.openLinChannel(this.getDefaultChannelId('lin'), baudRate);
  }

  static async closeLinChannel(channelId: string): Promise<CommandResult> {
    const bound = this.getBoundHardware(channelId);
    if (!bound) {
      return { success: false, message: `通道未绑定硬件: ${channelId}` };
    }
    if (bound.channel.type !== 'lin') {
      return { success: false, message: `通道类型不是 LIN: ${channelId}` };
    }
    return await PcanLinManager.closeDevice(bound.hardwareId);
  }

  static async closeDefaultLinChannel(): Promise<CommandResult> {
    return this.closeLinChannel(this.getDefaultChannelId('lin'));
  }

  static async sendLinFrameByChannel(params: {
    channelId: string;
    id: number;
    data: number[];
    checksumType?: 'classic' | 'enhanced';
  }): Promise<CommandResult> {
    const bound = this.getBoundHardware(params.channelId);
    if (!bound) {
      return { success: false, message: `通道未绑定硬件: ${params.channelId}` };
    }
    if (bound.channel.type !== 'lin') {
      return { success: false, message: `通道类型不是 LIN: ${params.channelId}` };
    }
    return await PcanLinManager.sendFrame({
      deviceId: bound.hardwareId,
      id: params.id,
      data: params.data,
      checksumType: params.checksumType
    });
  }

  static async sendLinFrameByDefaultChannel(params: {
    id: number;
    data: number[];
    checksumType?: 'classic' | 'enhanced';
  }): Promise<CommandResult> {
    return this.sendLinFrameByChannel({
      channelId: this.getDefaultChannelId('lin'),
      id: params.id,
      data: params.data,
      checksumType: params.checksumType
    });
  }

  static async getLinChannelStatus(channelId: string): Promise<
    CommandResult & {
      opened?: boolean;
      baudRate?: number;
      txCount?: number;
      rxCount?: number;
      hardwareId?: string | null;
      hardwareName?: string | null;
    }
  > {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return { success: false, message: `通道不存在: ${channelId}` };
    }
    if (channel.type !== 'lin') {
      return { success: false, message: `通道类型不是 LIN: ${channelId}` };
    }
    if (!channel.binding.hardwareId) {
      return {
        success: true,
        message: 'LIN 通道未绑定硬件',
        opened: false,
        hardwareId: null,
        hardwareName: null
      };
    }
    const status = await PcanLinManager.getStatus(channel.binding.hardwareId);
    return {
      ...status,
      hardwareId: channel.binding.hardwareId,
      hardwareName: channel.binding.hardwareName
    };
  }

  static async getDefaultLinChannelStatus(): Promise<
    CommandResult & {
      opened?: boolean;
      baudRate?: number;
      txCount?: number;
      rxCount?: number;
      hardwareId?: string | null;
      hardwareName?: string | null;
    }
  > {
    return this.getLinChannelStatus(this.getDefaultChannelId('lin'));
  }

  static async openCanChannel(channelId: string, bitrate: number): Promise<CommandResult> {
    const bound = this.getBoundHardware(channelId);
    if (!bound) return { success: false, message: `通道未绑定硬件: ${channelId}` };
    if (bound.channel.type !== 'can') return { success: false, message: `通道类型不是 CAN: ${channelId}` };
    if (bitrate < 10000 || bitrate > 5000000) return { success: false, message: `CAN 波特率超出范围: ${bitrate}` };
    canOpenSessions.set(channelId, { bitrate, openedAt: Date.now() });
    return { success: true, message: `CAN 通道已打开: ${channelId}` };
  }

  static async openDefaultCanChannel(bitrate: number): Promise<CommandResult> {
    return this.openCanChannel(this.getDefaultChannelId('can'), bitrate);
  }

  static async closeCanChannel(channelId: string): Promise<CommandResult> {
    if (!canOpenSessions.has(channelId)) return { success: false, message: `CAN 通道未打开: ${channelId}` };
    canOpenSessions.delete(channelId);
    return { success: true, message: `CAN 通道已关闭: ${channelId}` };
  }

  static async closeDefaultCanChannel(): Promise<CommandResult> {
    return this.closeCanChannel(this.getDefaultChannelId('can'));
  }

  static async getCanChannelStatus(channelId: string): Promise<CommandResult & { opened?: boolean; bitrate?: number }> {
    const session = canOpenSessions.get(channelId);
    if (!session) return { success: true, message: 'CAN 通道未打开', opened: false };
    return { success: true, message: 'CAN 通道状态获取成功', opened: true, bitrate: session.bitrate };
  }

  static async getDefaultCanChannelStatus(): Promise<CommandResult & { opened?: boolean; bitrate?: number }> {
    return this.getCanChannelStatus(this.getDefaultChannelId('can'));
  }

  static async openSerialChannel(mainWindow: BrowserWindow, channelId: string, baudRate: number): Promise<CommandResult> {
    const bound = this.getBoundHardware(channelId);
    if (!bound) return { success: false, message: `通道未绑定硬件: ${channelId}` };
    if (bound.channel.type !== 'serial') return { success: false, message: `通道类型不是串口: ${channelId}` };
    if (!bound.hardwareId.startsWith('serial:')) return { success: false, message: `无效串口硬件ID: ${bound.hardwareId}` };

    const path = bound.hardwareId.replace(/^serial:/, '');
    const deviceId = `channel-serial-${channelId}`;
    serialChannelDeviceMap.set(channelId, deviceId);
    return await SerialPortManager.openPort(path, { deviceType: 'Generic' }, mainWindow, deviceId);
  }

  static async openDefaultSerialChannel(mainWindow: BrowserWindow, baudRate: number): Promise<CommandResult> {
    return this.openSerialChannel(mainWindow, this.getDefaultChannelId('serial'), baudRate);
  }

  static async closeSerialChannel(channelId: string): Promise<CommandResult> {
    const deviceId = serialChannelDeviceMap.get(channelId);
    if (!deviceId) return { success: false, message: `串口通道未打开: ${channelId}` };
    const result = await SerialPortManager.closePort(deviceId);
    serialChannelDeviceMap.delete(channelId);
    return result;
  }

  static async closeDefaultSerialChannel(): Promise<CommandResult> {
    return this.closeSerialChannel(this.getDefaultChannelId('serial'));
  }

  static async getSerialChannelStatus(channelId: string): Promise<CommandResult & { opened?: boolean; deviceId?: string }> {
    const deviceId = serialChannelDeviceMap.get(channelId);
    if (!deviceId) return { success: true, message: '串口通道未打开', opened: false };
    const port = SerialPortManager.getCurrentPort(deviceId);
    return { success: true, message: '串口通道状态获取成功', opened: Boolean(port?.isOpen), deviceId };
  }

  static async getDefaultSerialChannelStatus(): Promise<CommandResult & { opened?: boolean; deviceId?: string }> {
    return this.getSerialChannelStatus(this.getDefaultChannelId('serial'));
  }
}
