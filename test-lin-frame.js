// 直接测试LinCommandBuilder类的功能，不依赖Electron

// LIN通信协议相关常量
const LIN_FRAME_LENGTH = 16;
const LIN_MODE_COMMAND = 0x11;
const LIN_HOST_SEND = 0x22;
const LIN_READ_SLAVE = 0x33;
const LIN_SLAVE_RECEIVE = 0x44;

class LinCommandBuilder {
  // 计算校验和（补码和）
  static calculateChecksum(data, length) {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += data[i];
    }
    // 取反加1得到补码
    sum = (((~sum) & 0xFF) + 1) & 0xFF;
    return sum;
  }

  // 构建16字节LIN帧
  static buildFrame(frameType, data) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    // 设置帧类型
    frame[0] = frameType;
    
    // 复制数据到帧
    if (data) {
      data.copy(frame, 1, 0, Math.min(data.length, LIN_FRAME_LENGTH - 2));
    }
    
    // 计算校验和
    frame[LIN_FRAME_LENGTH - 1] = this.calculateChecksum(frame, LIN_FRAME_LENGTH - 1);
    
    return frame;
  }

  // 模式切换命令（对应C#的Send_Mode_Command）
  static buildModeCommand(mode, baudRate) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_MODE_COMMAND;
    frame[1] = mode; // 模式
    frame[2] = (baudRate >> 8) & 0xFF; // 波特率高8位
    frame[3] = baudRate & 0xFF; // 波特率低8位
    
    // 计算校验和
    frame[LIN_FRAME_LENGTH - 1] = this.calculateChecksum(frame, LIN_FRAME_LENGTH - 1);
    
    return frame;
  }

  // 主机发送数据命令（对应C#的Host_Send_Data）
  static buildHostSendCommand(id, data, length, checkType) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_HOST_SEND;
    frame[1] = 0; // 通道0
    frame[2] = id; // ID
    frame[3] = 0; // 传输方向0
    frame[4] = checkType === 'V1' ? 1 : 2; // 校验和类型
    frame[5] = length; // 数据长度
    
    // 复制数据 - 确保不超过8字节或指定长度
    if (data && length > 0) {
      const copyLength = Math.min(length, 8, data.length);
      data.copy(frame, 6, 0, copyLength);
    }
    
    // 计算校验和
    frame[LIN_FRAME_LENGTH - 1] = this.calculateChecksum(frame, LIN_FRAME_LENGTH - 1);
    
    return frame;
  }

  // 读取从机数据命令（对应C#的Read_Slave_Data）
  static buildReadSlaveCommand(id, length, checkType) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_READ_SLAVE;
    frame[1] = 1; // 通道1
    frame[2] = id; // ID
    frame[3] = 1; // 传输方向1
    frame[4] = checkType === 'V1' ? 1 : 2; // 校验和类型
    frame[5] = length; // 数据长度
    
    // 计算校验和
    frame[LIN_FRAME_LENGTH - 1] = this.calculateChecksum(frame, LIN_FRAME_LENGTH - 1);
    
    return frame;
  }
}

// 测试LIN命令帧构建
console.log('Testing LIN Command Builder...');

// 测试模式切换命令 - 切换到主机模式，波特率19200
const modeFrame = LinCommandBuilder.buildModeCommand(1, 19200);
console.log('Mode Command Frame (Host, 19200):', modeFrame.toString('hex'));
console.log('Frame Length:', modeFrame.length);

// 测试主机发送命令
const data = Buffer.from([0x01, 0x02, 0x03, 0x04]);
const hostSendFrame = LinCommandBuilder.buildHostSendCommand(0x10, data, 4, 'V1');
console.log('Host Send Frame (ID: 0x10, Data: 01020304):', hostSendFrame.toString('hex'));
console.log('Frame Length:', hostSendFrame.length);

// 测试校验和计算
const testData = Buffer.from([0x11, 0x01, 0x4B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const checksum = LinCommandBuilder.calculateChecksum(testData, 15);
console.log('Test Data:', testData.toString('hex'));
console.log('Calculated Checksum:', checksum.toString(16).padStart(2, '0'));

// 测试待机模式命令
const standbyFrame = LinCommandBuilder.buildModeCommand(0, 19200);
console.log('Standby Command Frame:', standbyFrame.toString('hex'));
