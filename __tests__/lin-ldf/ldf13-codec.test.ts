import { describe, expect, it } from 'vitest';
import {
  createDefaultLdf13Text,
  deserializeLdf13,
  normalizeLdf13,
  serializeLdf13,
  validateLdf13Document,
} from '../../src/renderer/features/lin-ldf/services/ldf13Codec.ts';

const SAMPLE_LDF = `
LIN_description_file;

LIN_protocol_version = "1.3";
LIN_language_version = "2.0";
Bitrate = 19200;

Nodes {
  Master: LIN_Commander, 5 ms, 0.1 ms;
  Slaves: LIN_Responder, LIN_Node2;
}

Node_attributes {
  LIN_Responder { configured_nad = 1; supplier_id = 2; function_id = 3; variant = 4; }
  LIN_Node2 { configured_nad = 10; supplier_id = 20; function_id = 30; variant = 40; }
}

Signals {
  Cmd_A: 8, 0x10, LIN_Commander, LIN_Responder; // @meta desc=%E6%B5%8B%E8%AF%95A&type=Scalar
  Cmd_B: 16, 1, LIN_Commander, LIN_Responder, LIN_Node2; // @meta desc=Signal%20B&type=ByteArray
}

Frames {
  MasterReq: 0x3C, LIN_Commander, 8 {
    Cmd_A, 0;
    Cmd_B, 8;
  }
}

Schedule_tables {
  MainSchedule {
    MasterReq delay 10 ms;
    MasterReq delay 12.5 ms;
  }
}

Diagnostic_frames {
  // keep unknown section as raw
}
`.trim();

const SAMPLE_LDF_WITH_LIN_SPEED = SAMPLE_LDF.replace('Bitrate = 19200;', 'LIN_speed = 19.2 kbps;');
const SAMPLE_LDF_WITH_SMART_QUOTES = SAMPLE_LDF
  .replace('"1.3"', '“1.3”')
  .replace('"2.0"', '“2.0”');
const SAMPLE_LDF_WITH_IMPLICIT_FRAME_LENGTH = SAMPLE_LDF.replace(
  'MasterReq: 0x3C, LIN_Commander, 8 {',
  'MasterReq: 0x3C, LIN_Commander {'
);
const SAMPLE_LDF_WITH_DIAGNOSTIC_BLOCKS = `
LIN_description_file;
LIN_protocol_version = "1.3";
LIN_language_version = "1.3";
LIN_speed = 19.2 kbps;

Nodes {
  Master: CEM, 5 ms, 0.1 ms;
  Slaves: LSM, CPM;
}

Signals {
  SigA: 8, 0, CEM, LSM;
}

Diagnostic_signals {
  MasterReqB0: 8, 0;
  SlaveRespB0: 8, 0;
}

Frames {
  FrmA: 16, CEM {
    SigA, 0;
  }
}

Diagnostic_frames {
  MasterReq: 60 {
    MasterReqB0, 0;
  }
  SlaveResp: 61 {
    SlaveRespB0, 0;
  }
}

Schedule_tables {
  Main {
    FrmA delay 10 ms;
  }
}
`.trim();

describe('ldf13Codec serialization pipeline', () => {
  it('deserializeLdf13 should parse core sections and metadata', () => {
    const doc = deserializeLdf13(SAMPLE_LDF);

    expect(doc.protocolVersion).toBe('1.3');
    expect(doc.languageVersion).toBe('2.0');
    expect(doc.bitrate).toBe(19200);
    expect(doc.nodes.master).toBe('LIN_Commander');
    expect(doc.nodes.slaves).toEqual(['LIN_Responder', 'LIN_Node2']);
    expect(doc.nodeAttributes).toHaveLength(2);
    expect(doc.frames).toHaveLength(1);
    expect(doc.scheduleTables[0]?.entries).toHaveLength(2);

    expect(doc.signals[0]).toMatchObject({
      name: 'Cmd_A',
      initValue: 0x10,
      signalType: 'Scalar',
      description: '测试A',
    });
    expect(doc.signals[1]).toMatchObject({
      name: 'Cmd_B',
      signalType: 'ByteArray',
      description: 'Signal B',
    });
    expect(doc.unknownSectionsRaw).not.toContain('Diagnostic_frames');
  });

  it('deserializeLdf13 should accept LIN_speed syntax in kbps', () => {
    const doc = deserializeLdf13(SAMPLE_LDF_WITH_LIN_SPEED);
    expect(doc.bitrate).toBe(19200);
  });

  it('deserializeLdf13 should accept smart quotes around version fields', () => {
    const doc = deserializeLdf13(SAMPLE_LDF_WITH_SMART_QUOTES);
    expect(doc.protocolVersion).toBe('1.3');
    expect(doc.languageVersion).toBe('2.0');
  });

  it('deserializeLdf13 should use default frame length when omitted', () => {
    const doc = deserializeLdf13(SAMPLE_LDF_WITH_IMPLICIT_FRAME_LENGTH);
    expect(doc.frames[0]?.length).toBe(8);
  });

  it('deserializeLdf13 should parse diagnostic blocks into reserved frames', () => {
    const doc = deserializeLdf13(SAMPLE_LDF_WITH_DIAGNOSTIC_BLOCKS);
    const masterReq = doc.frames.find((x) => x.id === 60);
    const slaveResp = doc.frames.find((x) => x.id === 61);
    expect(masterReq?.name).toBe('MasterReq');
    expect(slaveResp?.name).toBe('SlaveResp');
    expect(masterReq?.publisher).toBe('CEM');
    expect(slaveResp?.publisher).toBe('LSM');
    expect(masterReq?.signals[0]).toEqual({ signal: 'MasterReqB0', offset: 0 });
  });

  it('serializeLdf13 + deserializeLdf13 should keep semantic data', () => {
    const original = deserializeLdf13(SAMPLE_LDF);

    // 模拟编辑器中一次修改后再写回。
    original.signals[0]!.description = '命令A';
    original.signals[0]!.initValue = 42;
    original.scheduleTables[0]!.entries.push({ frame: 'MasterReq', delayMs: 15 });

    const text = serializeLdf13(original);
    expect(text).toContain('LIN_speed = 19.2 kbps;');
    const reparsed = deserializeLdf13(text);

    expect(reparsed.signals[0]).toMatchObject({
      description: '命令A',
      initValue: 42,
      signalType: 'Scalar',
    });
    expect(reparsed.scheduleTables[0]?.entries.map((x) => x.delayMs)).toEqual([10, 12.5, 15]);
    expect(reparsed.frames[0]?.signals).toEqual([
      { signal: 'Cmd_A', offset: 0 },
      { signal: 'Cmd_B', offset: 8 },
    ]);
  });

  it('normalizeLdf13 should be idempotent', () => {
    const once = normalizeLdf13(SAMPLE_LDF);
    const twice = normalizeLdf13(once);
    expect(twice).toBe(once);
  });

  it('createDefaultLdf13Text should roundtrip to a valid document', () => {
    const text = createDefaultLdf13Text();
    expect(text).toContain('Diagnostic_signals {');
    expect(text).toContain('Diagnostic_frames {');
    expect(text).toContain('MasterReqB0: 8, 0 ;');
    expect(text).toContain('SlaveResp: 0x3d {');
    const doc = deserializeLdf13(text);
    const issues = validateLdf13Document(doc);
    const errors = issues.filter((x) => x.level === 'error');
    expect(errors).toHaveLength(0);
  });

  it('validateLdf13Document should report overlap and missing references', () => {
    const doc = deserializeLdf13(SAMPLE_LDF);
    doc.frames[0]!.signals.push({ signal: 'Cmd_A', offset: 4 }); // overlap with Cmd_A[0..7]
    doc.scheduleTables[0]!.entries.push({ frame: 'NoSuchFrame', delayMs: 10 }); // missing frame

    const issues = validateLdf13Document(doc);
    expect(issues.some((x) => x.code === 'frame.signal.overlap')).toBe(true);
    expect(issues.some((x) => x.code === 'schedule.frame.notFound')).toBe(true);
  });

  it('deserializeLdf13 should reject non-1.3 protocol version', () => {
    expect(() =>
      deserializeLdf13(
        SAMPLE_LDF.replace('LIN_protocol_version = "1.3";', 'LIN_protocol_version = "2.0";')
      )
    ).toThrow('Only LIN protocol version 1.3 is supported.');
  });
});

