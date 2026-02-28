// LIN通信协议相关常量
export const LIN_FRAME_LENGTH = 16;
export const LIN_MODE_COMMAND = 0x11;
export const LIN_HOST_SEND = 0x22;
export const LIN_READ_SLAVE = 0x33;
export const LIN_SLAVE_RECEIVE = 0x44;

// 定义LIN帧解析结果类型
export interface ParsedLinFrame {
  type: number;
  raw: Buffer;
  id: string;
  direction: string;
  channel: string;
  data: string;
  status: string;
  checksum: string;
  length: number;
}

// ===========================
// LIN命令构建器
// ===========================
export class LinCommandBuilder {
  // 计算校验和（补码和）
  static calculateChecksum(data: Buffer, length: number): number {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += data[i];
    }
    // 取反加1得到补码
    sum = (((~sum) & 0x000000FF) + 1) & 0xFF;
    return sum;
  }

  // 模式切换命令
  static buildModeCommand(mode: number, baudRate: number): Buffer {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_MODE_COMMAND;                               // 模式指令头
    frame[1] = mode;                                           // 模式
    frame[2] = (baudRate >> 8) & 0xFF;                         // 波特率高8位
    frame[3] = baudRate & 0xFF;                                // 波特率低8位
    
    // 填充剩余字节为0
    for (let i = 4; i < 15; i++) {
      frame[i] = 0;
    }
    
    // 计算校验和
    frame[15] = this.calculateChecksum(frame, 15);
    
    return frame;
  }

  // 主机发送数据命令
  static buildHostSendCommand(sendId: number, sendStr: string, length: number, checkType: string): Buffer {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_HOST_SEND;                                  // 主机发送指令头
    frame[1] = 0;                                              // 通道0
    frame[2] = sendId;                                         // ID
    frame[3] = 0;                                              // 传输方向0
    frame[4] = checkType === 'V1' ? 1 : 2;                     // 校验和类型
    frame[5] = length;                                         // 数据长度
    
    // 处理数据
    if (sendStr && length > 0) {
      let si = 0;
      for (let i = 0; i < length && i < 8; i++) {
        if (si + 2 <= sendStr.length) {
          const hexStr = sendStr.substring(si, si + 2);
          frame[i + 6] = parseInt(hexStr, 16);
          si += 3; // 跳过空格
        }
      }
    }
    
    // 计算校验和
    frame[15] = this.calculateChecksum(frame, 15);
    
    return frame;
  }

  // 读取从机数据命令
  static buildReadSlaveCommand(readId: number, length: number, checkType: string): Buffer {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_READ_SLAVE;                                 // 读取从机指令头
    frame[1] = 1;                                              // 通道1
    frame[2] = readId;                                         // ID
    frame[3] = 1;                                              // 传输方向1
    frame[4] = checkType === 'V1' ? 1 : 2;                     // 校验和类型
    frame[5] = length;                                         // 数据长度
    
    // 填充剩余字节为0
    for (let i = 6; i < 15; i++) {
      frame[i] = 0;
    }
    
    // 计算校验和
    frame[15] = this.calculateChecksum(frame, 15);
    
    return frame;
  }
}

// ===========================
// LIN帧解析器
// ===========================
export class LinFrameParser {
  // 计算V1校验和（只包含数据字节）
  static calculateV1Checksum(id: number, data: Buffer, length: number): number {
    let sum = 0;
    // 只计算数据字节（从索引6开始）
    for (let i = 6; i < (6 + length) && i < 14; i++) {
      sum += data[i];
    }
    // 取低8位
    return sum & 0xFF;
  }

  // 计算V2校验和（包含ID和数据字节）
  static calculateV2Checksum(id: number, data: Buffer, length: number): number {
    let sum = id;
    // 计算ID和数据字节
    for (let i = 6; i < (6 + length) && i < 14; i++) {
      sum += data[i];
    }
    // 取低8位
    return sum & 0xFF;
  }

  // 解析接收到的LIN帧
  static parseFrame(data: Buffer): ParsedLinFrame | null {
    // 只处理16字节的完整帧
    if (data.length !== 16) {
      return null;
    }
    
    const frameType = data[0];
    let result: ParsedLinFrame = { 
      type: frameType, 
      raw: data,
      id: '',
      direction: '',
      channel: '',
      data: '',
      status: '',
      checksum: '',
      length: 0
    };
    
    // 根据帧类型解析
    switch (frameType) {
      case LIN_READ_SLAVE: // 0x33
        result.channel = data[1].toString();
        result.id = data[2].toString(16).toUpperCase().padStart(2, '0');
        result.direction = '接收';
        
        result.length = data[5];
        
        // 解析数据
        let dataStr = '';
        for (let i = 6; i < (result.length + 6) && i < 14; i++) {
          dataStr += data[i].toString(16).toUpperCase().padStart(2, '0') + ' ';
        }
        result.data = dataStr.trim();
        
        result.checksum = data[14].toString(16).toUpperCase().padStart(2, '0');
        
        // 重新计算校验和并验证
        const receivedChecksum = parseInt(result.checksum, 16);
        const v1Checksum = this.calculateV1Checksum(data[2], data, result.length);
        const v2Checksum = this.calculateV2Checksum(data[2], data, result.length);
        
        // 确定校验和类型并验证
        if (receivedChecksum === v1Checksum) {
          result.status = 'V1';
        } else if (receivedChecksum === v2Checksum) {
          result.status = 'V2';
        } else {
          result.status = '校验和错误';
        }
        break;
        
      case LIN_SLAVE_RECEIVE: // 0x44
        result.id = data[2].toString(16).toUpperCase().padStart(2, '0');
        result.direction = '接收';
        
        result.length = data[5];
        
        // 解析数据
        let slaveDataStr = '';
        for (let i = 6; i < (result.length + 6) && i < 14; i++) {
          slaveDataStr += data[i].toString(16).toUpperCase().padStart(2, '0') + ' ';
        }
        result.data = slaveDataStr.trim();
        
        result.checksum = data[14].toString(16).toUpperCase().padStart(2, '0');
        
        // 重新计算校验和并验证
        const slaveReceivedChecksum = parseInt(result.checksum, 16);
        const slaveV1Checksum = this.calculateV1Checksum(data[2], data, result.length);
        const slaveV2Checksum = this.calculateV2Checksum(data[2], data, result.length);
        
        // 确定校验和类型并验证
        if (slaveReceivedChecksum === slaveV1Checksum) {
          result.status = 'V1';
        } else if (slaveReceivedChecksum === slaveV2Checksum) {
          result.status = 'V2';
        } else {
          result.status = '校验和错误';
        }
        break;
        
      default:
        // 其他类型的帧不处理
        return null;
    }
    
    return result;
  }
}
