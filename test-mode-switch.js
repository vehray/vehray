// 测试模式切换逻辑
// 模拟发送数据时自动切换到主机模式

// LIN通信协议相关常量
const LIN_FRAME_LENGTH = 16;
const LIN_MODE_COMMAND = 0x11;
const LIN_HOST_SEND = 0x22;
const LIN_READ_SLAVE = 0x33;
const LIN_SLAVE_RECEIVE = 0x44;

// 模拟LinCommandBuilder类
class TestLinCommandBuilder {
  // 计算校验和（补码和）
  static calculateChecksum(data, length) {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += data[i];
    }
    sum = (((~sum) & 0x000000FF) + 1) & 0xFF;
    return sum;
  }

  // 模式切换命令
  static buildModeCommand(mode, baudRate) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_MODE_COMMAND;                     // 模式指令头
    frame[1] = mode;                                 // 模式
    frame[2] = (baudRate >> 8) & 0xFF;               // 波特率高8位
    frame[3] = baudRate & 0xFF;                      // 波特率低8位
    
    for (let i = 4; i < 15; i++) {
      frame[i] = 0;                                  // 填充剩余字节为0
    }
    
    frame[15] = this.calculateChecksum(frame, 15);   // 校验和
    
    return frame;
  }

  // 主机发送数据命令
  static buildHostSendCommand(sendId, sendStr, length, checkType) {
    const frame = Buffer.alloc(LIN_FRAME_LENGTH);
    frame.fill(0);
    
    frame[0] = LIN_HOST_SEND;                        // 主机发送指令头
    frame[1] = 0;                                    // 通道0
    frame[2] = sendId;                               // ID
    frame[3] = 0;                                    // 传输方向0
    frame[4] = checkType === 'V1' ? 1 : 2;           // 校验和类型
    frame[5] = length;                               // 数据长度
    
    if (sendStr && length > 0) {
      let si = 0;
      for (let i = 0; i < length && i < 8; i++) {
        if (si + 2 <= sendStr.length) {
          const hexStr = sendStr.substring(si, si + 2);
          frame[i + 6] = parseInt(hexStr, 16);       // 数据字节
          si += 3;                                    // 跳过空格
        }
      }
    }
    
    frame[15] = this.calculateChecksum(frame, 15);   // 校验和
    
    return frame;
  }
}

// 模拟LIN控制器状态
const linController = {
  currentMode: 0, // 当前运行模式：0待机 1主机 2从机 3监听
  currentBaudRate: 19200, // 默认LIN波特率
};

// 模拟模式切换逻辑
async function setMode(mode) {
  console.log(`当前模式: ${linController.currentMode}, 目标模式: ${mode}`);
  
  // 如果当前不是目标模式，需要切换
  if (linController.currentMode !== mode) {
    // 如果当前不是待机模式，先切换到待机模式
    if (linController.currentMode !== 0) {
      console.log(`需要先切换到待机模式`);
      
      // 构建待机模式命令
      const standbyFrame = TestLinCommandBuilder.buildModeCommand(0, linController.currentBaudRate);
      console.log('切换到待机模式 - 发送帧:', standbyFrame.toString('hex'));
      
      // 模拟发送待机模式命令
      console.log('发送待机模式命令成功');
      
      // 等待100ms
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 切换到目标模式
    console.log(`切换到目标模式: ${mode}`);
    const modeFrame = TestLinCommandBuilder.buildModeCommand(mode, linController.currentBaudRate);
    console.log('切换到目标模式 - 发送帧:', modeFrame.toString('hex'));
    
    // 模拟发送目标模式命令
    console.log('发送目标模式命令成功');
    
    // 更新当前模式
    linController.currentMode = mode;
    console.log(`模式切换成功，当前模式: ${linController.currentMode}`);
  } else {
    console.log('当前已经是目标模式，无需切换');
  }
}

// 模拟发送数据逻辑
async function sendData(params) {
  console.log('\n=== 测试发送数据 ===');
  console.log('发送参数:', params);
  
  // 确保当前是主机模式（模式1），无论是否使用rawData
  if (linController.currentMode !== 1) {
    console.log('当前不是主机模式，需要切换模式');
    await setMode(1);
  }
  
  // 构建数据帧
  let frame;
  if (params.rawData) {
    frame = params.rawData;
    console.log('使用rawData发送数据');
  } else {
    const { id, data, length, checkType } = params;
    
    // 转换数据格式
    let sendStr = '';
    if (data) {
      if (Array.isArray(data)) {
        sendStr = data.map(byte => byte.toString(16).padStart(2, '0')).join(' ');
      } else if (typeof data === 'string') {
        sendStr = data;
      }
    }
    
    frame = TestLinCommandBuilder.buildHostSendCommand(id, sendStr, length, checkType);
    console.log('构建数据帧成功');
  }
  
  // 模拟发送数据
  console.log('发送数据帧:', frame.toString('hex'));
  console.log('数据发送成功');
}

// 运行测试
async function runTests() {
  console.log('=== 测试模式切换逻辑 ===\n');
  
  // 测试1: 当前为待机模式，发送数据应切换到主机模式
  console.log('测试1: 当前为待机模式，发送数据应切换到主机模式');
  linController.currentMode = 0; // 待机模式
  await sendData({
    id: 0x10,
    data: [0x01, 0x02, 0x03, 0x04],
    length: 4,
    checkType: 'V1'
  });
  
  // 测试2: 当前为从机模式，发送数据应先切换到待机模式，再切换到主机模式
  console.log('\n\n测试2: 当前为从机模式，发送数据应先切换到待机模式，再切换到主机模式');
  linController.currentMode = 2; // 从机模式
  await sendData({
    id: 0x20,
    data: [0xAA, 0xBB, 0xCC, 0xDD],
    length: 4,
    checkType: 'V2'
  });
  
  // 测试3: 当前为监听模式，使用rawData发送数据应先切换到待机模式，再切换到主机模式
  console.log('\n\n测试3: 当前为监听模式，使用rawData发送数据应先切换到待机模式，再切换到主机模式');
  linController.currentMode = 3; // 监听模式
  
  // 构建rawData
  const rawData = TestLinCommandBuilder.buildHostSendCommand(0x30, '11 22 33', 3, 'V1');
  await sendData({
    rawData: rawData
  });
  
  // 测试4: 当前已经是主机模式，发送数据不应切换模式
  console.log('\n\n测试4: 当前已经是主机模式，发送数据不应切换模式');
  linController.currentMode = 1; // 主机模式
  await sendData({
    id: 0x40,
    data: [0x00, 0x11, 0x22],
    length: 3,
    checkType: 'V1'
  });
  
  console.log('\n\n=== 所有测试完成 ===');
}

// 执行测试
runTests().catch(error => {
  console.error('测试失败:', error);
});
