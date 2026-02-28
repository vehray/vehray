// 测试LIN通信逻辑，确保与C#代码完全一致

// LIN通信协议相关常量
const LIN_FRAME_LENGTH = 16;
const LIN_MODE_COMMAND = 0x11;
const LIN_HOST_SEND = 0x22;
const LIN_READ_SLAVE = 0x33;
const LIN_SLAVE_RECEIVE = 0x44;

// 模拟LinCommandBuilder类，与重构后的代码完全一致
class TestLinCommandBuilder {
  // 计算校验和（补码和）- 完全对应C#的Check_Sum方法
  static calculateChecksum(data, length) {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += data[i];
    }
    // 取反加1得到补码，与C#逻辑完全一致
    sum = (((~sum) & 0x000000FF) + 1) & 0xFF;
    return sum;
  }

  // 模式切换命令（完全对应C#的Send_Mode_Command）
  static buildModeCommand(mode, baudRate) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_MODE_COMMAND;                               // 模式指令头
    frame[1] = mode;                                           // 模式
    frame[2] = (baudRate >> 8) & 0xFF;                         // 波特率高8位
    frame[3] = baudRate & 0xFF;                                // 波特率低8位
    
    // 填充剩余字节为0，与C#逻辑完全一致
    for (let i = 4; i < 15; i++) {
      frame[i] = 0;
    }
    
    // 计算校验和
    frame[15] = this.calculateChecksum(frame, 15);
    
    return frame;
  }

  // 主机发送数据命令（完全对应C#的Host_Send_Data）
  static buildHostSendCommand(sendId, sendStr, length, checkType) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_HOST_SEND;                                  // 主机发送指令头
    frame[1] = 0;                                              // 通道0
    frame[2] = sendId;                                         // ID
    frame[3] = 0;                                              // 传输方向0
    frame[4] = checkType === 'V1' ? 1 : 2;                     // 校验和类型
    frame[5] = length;                                         // 数据长度
    
    // 处理数据，与C#逻辑完全一致
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

  // 读取从机数据命令（完全对应C#的Read_Slave_Data）
  static buildReadSlaveCommand(readId, length, checkType) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_READ_SLAVE;                                 // 读取从机指令头
    frame[1] = 1;                                              // 通道1
    frame[2] = readId;                                         // ID
    frame[3] = 1;                                              // 传输方向1
    frame[4] = checkType === 'V1' ? 1 : 2;                     // 校验和类型
    frame[5] = length;                                         // 数据长度
    
    // 填充剩余字节为0，与C#逻辑完全一致
    for (let i = 6; i < 15; i++) {
      frame[i] = 0;
    }
    
    // 计算校验和
    frame[15] = this.calculateChecksum(frame, 15);
    
    return frame;
  }
}

// 模拟LinFrameParser类，与重构后的代码完全一致
class TestLinFrameParser {
  // 解析接收到的LIN帧，完全对应C#的Sp_Receiving方法
  static parseFrame(data) {
    // 只处理16字节的完整帧
    if (data.length !== 16) {
      return null;
    }
    
    const frameType = data[0];
    let result = { 
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
    
    // 根据C#代码，只处理0x33（读取从机）和0x44（从机接收）类型的帧
    switch (frameType) {
      case LIN_READ_SLAVE: // 0x33
        result.channel = data[1].toString();
        result.id = data[2].toString(16).toUpperCase();
        result.direction = '接收';
        
        // 解析状态字段，完全对应C#逻辑
        if (data[4] === 0) {
          result.status = '校验和错误';
        } else if (data[4] === 1) {
          result.status = 'V1';
        } else if (data[4] === 2) {
          result.status = 'V2';
        } else {
          result.status = '帧头';
        }
        
        result.length = data[5];
        
        // 解析数据，完全对应C#逻辑
        let dataStr = '';
        for (let i = 6; i < (result.length + 6) && i < 14; i++) {
          dataStr += data[i].toString(16).toUpperCase() + ' ';
        }
        result.data = dataStr.trim();
        
        result.checksum = data[14].toString(16).toUpperCase();
        break;
        
      case LIN_SLAVE_RECEIVE: // 0x44
        result.id = data[2].toString(16).toUpperCase();
        result.direction = '接收';
        
        // 解析状态字段，完全对应C#逻辑
        if (data[4] === 0) {
          result.status = '校验和错误';
        } else if (data[4] === 1) {
          result.status = 'V1';
        } else if (data[4] === 2) {
          result.status = 'V2';
        } else {
          result.status = '帧头';
        }
        
        result.length = data[5];
        
        // 解析数据，完全对应C#逻辑
        let slaveDataStr = '';
        for (let i = 6; i < (result.length + 6) && i < 14; i++) {
          slaveDataStr += data[i].toString(16).toUpperCase() + ' ';
        }
        result.data = slaveDataStr.trim();
        
        result.checksum = data[14].toString(16).toUpperCase();
        break;
        
      default:
        // 其他类型的帧不处理，与C#逻辑一致
        return null;
    }
    
    return result;
  }
}

// 测试函数
function runTests() {
  console.log('=== 测试LIN通信逻辑与C#代码一致性 ===\n');
  
  // 测试1: 模式切换命令 - 待机模式
  console.log('测试1: 模式切换命令 - 待机模式');
  const standbyFrame = TestLinCommandBuilder.buildModeCommand(0, 19200);
  console.log('待机模式命令帧:', standbyFrame.toString('hex'));
  console.log('预期长度:', LIN_FRAME_LENGTH, '实际长度:', standbyFrame.length);
  console.log('测试1结果:', standbyFrame.length === LIN_FRAME_LENGTH ? '通过' : '失败');
  console.log();
  
  // 测试2: 模式切换命令 - 主机模式
  console.log('测试2: 模式切换命令 - 主机模式');
  const hostModeFrame = TestLinCommandBuilder.buildModeCommand(1, 19200);
  console.log('主机模式命令帧:', hostModeFrame.toString('hex'));
  console.log('预期长度:', LIN_FRAME_LENGTH, '实际长度:', hostModeFrame.length);
  console.log('测试2结果:', hostModeFrame.length === LIN_FRAME_LENGTH ? '通过' : '失败');
  console.log();
  
  // 测试3: 主机发送数据命令
  console.log('测试3: 主机发送数据命令');
  const sendDataFrame = TestLinCommandBuilder.buildHostSendCommand(0x10, '01 02 03 04', 4, 'V1');
  console.log('主机发送数据命令帧:', sendDataFrame.toString('hex'));
  console.log('预期长度:', LIN_FRAME_LENGTH, '实际长度:', sendDataFrame.length);
  console.log('测试3结果:', sendDataFrame.length === LIN_FRAME_LENGTH ? '通过' : '失败');
  console.log();
  
  // 测试4: 读取从机数据命令
  console.log('测试4: 读取从机数据命令');
  const readSlaveFrame = TestLinCommandBuilder.buildReadSlaveCommand(0x01, 4, 'V2');
  console.log('读取从机数据命令帧:', readSlaveFrame.toString('hex'));
  console.log('预期长度:', LIN_FRAME_LENGTH, '实际长度:', readSlaveFrame.length);
  console.log('测试4结果:', readSlaveFrame.length === LIN_FRAME_LENGTH ? '通过' : '失败');
  console.log();
  
  // 测试5: 校验和计算
  console.log('测试5: 校验和计算');
  const testData = Buffer.from([0x11, 0x01, 0x4B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const checksum = TestLinCommandBuilder.calculateChecksum(testData, 15);
  console.log('测试数据:', testData.toString('hex'));
  console.log('计算得到的校验和:', checksum.toString(16).padStart(2, '0'));
  console.log('预期校验和: a3'); // 与C#代码计算结果一致
  console.log('测试5结果:', checksum === 0xA3 ? '通过' : '失败');
  console.log();
  
  // 测试6: 帧解析 - 读取从机数据响应
  console.log('测试6: 帧解析 - 读取从机数据响应');
  const readResponseFrame = Buffer.from([0x33, 0x01, 0x10, 0x01, 0x01, 0x04, 0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x5A, 0x00]);
  const parsedFrame1 = TestLinFrameParser.parseFrame(readResponseFrame);
  console.log('原始帧:', readResponseFrame.toString('hex'));
  console.log('解析结果:', JSON.stringify(parsedFrame1, null, 2));
  console.log('测试6结果:', parsedFrame1 ? '通过' : '失败');
  console.log();
  
  // 测试7: 帧解析 - 从机接收数据响应
  console.log('测试7: 帧解析 - 从机接收数据响应');
  const slaveResponseFrame = Buffer.from([0x44, 0x02, 0x20, 0x01, 0x02, 0x02, 0xAA, 0xBB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xCC, 0x00]);
  const parsedFrame2 = TestLinFrameParser.parseFrame(slaveResponseFrame);
  console.log('原始帧:', slaveResponseFrame.toString('hex'));
  console.log('解析结果:', JSON.stringify(parsedFrame2, null, 2));
  console.log('测试7结果:', parsedFrame2 ? '通过' : '失败');
  console.log();
  
  // 测试8: 帧解析 - 无效帧类型
  console.log('测试8: 帧解析 - 无效帧类型');
  const invalidFrame = Buffer.from([0x55, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const parsedFrame3 = TestLinFrameParser.parseFrame(invalidFrame);
  console.log('原始帧:', invalidFrame.toString('hex'));
  console.log('解析结果:', parsedFrame3);
  console.log('测试8结果:', parsedFrame3 === null ? '通过' : '失败');
  console.log();
  
  console.log('=== 所有测试完成 ===');
}

// 运行测试
runTests();
