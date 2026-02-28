import { describe, it, expect } from 'vitest';
import { LinCommandBuilder, LinFrameParser, LIN_FRAME_LENGTH } from '../../src/main/modules/lin-protocol.ts';

describe('LinCommandBuilder', () => {
  describe('calculateChecksum', () => {
    it('should calculate correct checksum for a buffer', () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03]);
      const checksum = LinCommandBuilder.calculateChecksum(buffer, 3);
      // 0x01 + 0x02 + 0x03 = 0x06, 补码为 0xFA
      expect(checksum).toBe(0xFA);
    });
    
    it('should calculate correct checksum for empty buffer', () => {
      const buffer = Buffer.from([]);
      const checksum = LinCommandBuilder.calculateChecksum(buffer, 0);
      // 0的补码为0
      expect(checksum).toBe(0x00);
    });
  });
  
  describe('buildModeCommand', () => {
    it('should build correct mode command frame', () => {
      const mode = 1;
      const baudRate = 19200;
      const frame = LinCommandBuilder.buildModeCommand(mode, baudRate);
      
      expect(frame.length).toBe(LIN_FRAME_LENGTH);
      expect(frame[0]).toBe(0x11); // LIN_MODE_COMMAND
      expect(frame[1]).toBe(mode);
      expect(frame[2]).toBe((baudRate >> 8) & 0xFF); // 波特率高8位
      expect(frame[3]).toBe(baudRate & 0xFF); // 波特率低8位
      
      // 后面的字节应该是0，除了最后一个字节是校验和
      for (let i = 4; i < LIN_FRAME_LENGTH - 1; i++) {
        expect(frame[i]).toBe(0x00);
      }
      
      // 校验和应该是正确计算的
      const expectedChecksum = LinCommandBuilder.calculateChecksum(frame, LIN_FRAME_LENGTH - 1);
      expect(frame[LIN_FRAME_LENGTH - 1]).toBe(expectedChecksum);
    });
  });
  
  describe('buildHostSendCommand', () => {
    it('should build correct host send command frame', () => {
      const id = 0x01;
      const data = '01 02 03 04';
      const length = 4;
      const checkType = 'V1';
      
      const frame = LinCommandBuilder.buildHostSendCommand(id, data, length, checkType);
      
      expect(frame.length).toBe(LIN_FRAME_LENGTH);
      expect(frame[0]).toBe(0x22); // LIN_HOST_SEND
      expect(frame[1]).toBe(0x00); // 通道0
      expect(frame[2]).toBe(id);
      expect(frame[3]).toBe(0x00); // 传输方向0
      expect(frame[4]).toBe(0x01); // 校验和类型V1
      expect(frame[5]).toBe(length);
      
      // 检查数据部分
      expect(frame[6]).toBe(0x01);
      expect(frame[7]).toBe(0x02);
      expect(frame[8]).toBe(0x03);
      expect(frame[9]).toBe(0x04);
      
      // 校验和应该是正确计算的
      const expectedChecksum = LinCommandBuilder.calculateChecksum(frame, LIN_FRAME_LENGTH - 1);
      expect(frame[LIN_FRAME_LENGTH - 1]).toBe(expectedChecksum);
    });
  });
  
  describe('buildReadSlaveCommand', () => {
    it('should build correct read slave command frame', () => {
      const id = 0x01;
      const length = 4;
      const checkType = 'V2';
      
      const frame = LinCommandBuilder.buildReadSlaveCommand(id, length, checkType);
      
      expect(frame.length).toBe(LIN_FRAME_LENGTH);
      expect(frame[0]).toBe(0x33); // LIN_READ_SLAVE
      expect(frame[1]).toBe(0x01); // 通道1
      expect(frame[2]).toBe(id);
      expect(frame[3]).toBe(0x01); // 传输方向1
      expect(frame[4]).toBe(0x02); // 校验和类型V2
      expect(frame[5]).toBe(length);
      
      // 校验和应该是正确计算的
      const expectedChecksum = LinCommandBuilder.calculateChecksum(frame, LIN_FRAME_LENGTH - 1);
      expect(frame[LIN_FRAME_LENGTH - 1]).toBe(expectedChecksum);
    });
  });
});

describe('LinFrameParser', () => {
  describe('parseFrame', () => {
    it('should return null for non-16-byte frames', () => {
      const shortFrame = Buffer.from([0x00]);
      const result = LinFrameParser.parseFrame(shortFrame);
      expect(result).toBeNull();
    });
    
    it('should return null for unsupported frame types', () => {
      const unsupportedFrame = Buffer.alloc(16);
      unsupportedFrame[0] = 0x99; // 不支持的帧类型
      const result = LinFrameParser.parseFrame(unsupportedFrame);
      expect(result).toBeNull();
    });
    
    it('should parse LIN_READ_SLAVE frame correctly', () => {
      // 创建一个示例LIN_READ_SLAVE帧
      const frame = Buffer.alloc(16);
      frame[0] = 0x33; // LIN_READ_SLAVE
      frame[1] = 0x01; // 通道1
      frame[2] = 0x05; // ID
      frame[3] = 0x01; // 传输方向1
      frame[4] = 0x01; // 校验和类型V1
      frame[5] = 0x02; // 数据长度2
      frame[6] = 0x11; // 数据1
      frame[7] = 0x22; // 数据2
      frame[14] = 0xAA; // 校验和
      
      const result = LinFrameParser.parseFrame(frame);
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('5');
        expect(result.direction).toBe('接收');
        expect(result.channel).toBe('1');
        expect(result.data).toBe('11 22');
        expect(result.status).toBe('V1');
        expect(result.checksum).toBe('AA');
        expect(result.length).toBe(2);
      }
    });
    
    it('should parse LIN_SLAVE_RECEIVE frame correctly', () => {
      // 创建一个示例LIN_SLAVE_RECEIVE帧
      const frame = Buffer.alloc(16);
      frame[0] = 0x44; // LIN_SLAVE_RECEIVE
      frame[2] = 0x0A; // ID
      frame[4] = 0x02; // 校验和类型V2
      frame[5] = 0x01; // 数据长度1
      frame[6] = 0x33; // 数据
      frame[14] = 0xBB; // 校验和
      
      const result = LinFrameParser.parseFrame(frame);
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('A');
        expect(result.direction).toBe('接收');
        expect(result.data).toBe('33');
        expect(result.status).toBe('V2');
        expect(result.checksum).toBe('BB');
        expect(result.length).toBe(1);
      }
    });
  });
});
