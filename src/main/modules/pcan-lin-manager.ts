import { BrowserWindow } from 'electron';
import { logger } from './logger.ts';

export interface CommandResult {
  success: boolean;
  message: string;
}

export interface PcanLinDeviceInfo {
  id: string;
  name: string;
  hardware: 'PCAN-USB Pro';
  channel: 'LIN1' | 'LIN2';
  connected: boolean;
  backend: 'mock' | 'native';
}

export interface PcanLinOpenParams {
  deviceId: string;
  baudRate: number;
}

export interface PcanLinFrame {
  deviceId: string;
  id: number;
  direction: 'tx' | 'rx';
  data: number[];
  timestamp: number;
  checksumType: 'classic' | 'enhanced';
}

const availableDevices: PcanLinDeviceInfo[] = [
  {
    id: 'pcanusbpro-lin1',
    name: 'PCAN-USB Pro LIN 1',
    hardware: 'PCAN-USB Pro',
    channel: 'LIN1',
    connected: true,
    backend: 'mock'
  },
  {
    id: 'pcanusbpro-lin2',
    name: 'PCAN-USB Pro LIN 2',
    hardware: 'PCAN-USB Pro',
    channel: 'LIN2',
    connected: true,
    backend: 'mock'
  }
];

type OpenSession = {
  baudRate: number;
  openedAt: number;
  txCount: number;
  rxCount: number;
};

const openedSessions = new Map<string, OpenSession>();
let mainWindowRef: BrowserWindow | null = null;

const getDevice = (deviceId: string): PcanLinDeviceInfo | undefined =>
  availableDevices.find((device) => device.id === deviceId);

const emitFrame = (frame: PcanLinFrame) => {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
  mainWindowRef.webContents.send('pcan-lin:frame', frame);
};

export class PcanLinManager {
  static bindMainWindow(mainWindow: BrowserWindow): void {
    mainWindowRef = mainWindow;
  }

  static async listDevices(): Promise<PcanLinDeviceInfo[]> {
    return availableDevices;
  }

  static async openDevice(params: PcanLinOpenParams): Promise<CommandResult> {
    const { deviceId, baudRate } = params;
    const target = getDevice(deviceId);
    if (!target) {
      return { success: false, message: `设备不存在: ${deviceId}` };
    }
    if (!target.connected) {
      return { success: false, message: `设备未连接: ${deviceId}` };
    }
    if (baudRate < 1000 || baudRate > 20000) {
      return { success: false, message: `LIN 波特率超出范围: ${baudRate}` };
    }

    openedSessions.set(deviceId, {
      baudRate,
      openedAt: Date.now(),
      txCount: 0,
      rxCount: 0
    });
    logger.info(`[pcan-lin] 打开设备: ${deviceId}, 波特率: ${baudRate}`);
    return { success: true, message: `PCAN LIN 设备已打开: ${deviceId}` };
  }

  static async closeDevice(deviceId: string): Promise<CommandResult> {
    if (!openedSessions.has(deviceId)) {
      return { success: false, message: `设备未打开: ${deviceId}` };
    }
    openedSessions.delete(deviceId);
    logger.info(`[pcan-lin] 关闭设备: ${deviceId}`);
    return { success: true, message: `PCAN LIN 设备已关闭: ${deviceId}` };
  }

  static async sendFrame(payload: {
    deviceId: string;
    id: number;
    data: number[];
    checksumType?: 'classic' | 'enhanced';
  }): Promise<CommandResult> {
    const session = openedSessions.get(payload.deviceId);
    if (!session) {
      return { success: false, message: `设备未打开: ${payload.deviceId}` };
    }
    if (payload.id < 0 || payload.id > 0x3f) {
      return { success: false, message: `LIN ID 超出范围: ${payload.id}` };
    }
    if (!Array.isArray(payload.data) || payload.data.length > 8) {
      return { success: false, message: 'LIN 数据长度必须为 0-8 字节' };
    }
    if (payload.data.some((byte) => byte < 0 || byte > 0xff)) {
      return { success: false, message: 'LIN 数据字节必须在 0-255 范围内' };
    }

    session.txCount += 1;
    const checksumType = payload.checksumType ?? 'enhanced';
    emitFrame({
      deviceId: payload.deviceId,
      id: payload.id,
      direction: 'tx',
      data: payload.data,
      checksumType,
      timestamp: Date.now()
    });

    // mock backend: 回环一帧 rx，便于前端先联调。
    setTimeout(() => {
      const activeSession = openedSessions.get(payload.deviceId);
      if (!activeSession) return;
      activeSession.rxCount += 1;
      emitFrame({
        deviceId: payload.deviceId,
        id: payload.id,
        direction: 'rx',
        data: payload.data,
        checksumType,
        timestamp: Date.now()
      });
    }, 10);

    return { success: true, message: 'PCAN LIN 数据发送成功' };
  }

  static async getStatus(deviceId: string): Promise<
    | (CommandResult & {
        opened: boolean;
        baudRate?: number;
        txCount?: number;
        rxCount?: number;
      })
  > {
    const session = openedSessions.get(deviceId);
    if (!session) {
      return {
        success: true,
        message: '设备当前未打开',
        opened: false
      };
    }
    return {
      success: true,
      message: '设备状态获取成功',
      opened: true,
      baudRate: session.baudRate,
      txCount: session.txCount,
      rxCount: session.rxCount
    };
  }
}
