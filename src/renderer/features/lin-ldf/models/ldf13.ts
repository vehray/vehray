export interface Ldf13NodeConfig {
  master: string;
  timeBaseMs: number;
  jitterMs: number;
  slaves: string[];
}

export interface Ldf13NodeAttribute {
  node: string;
  configuredNad?: number;
  supplierId?: number;
  functionId?: number;
  variant?: number;
}

export interface Ldf13Signal {
  name: string;
  description?: string;
  signalType?: 'Scalar' | 'ByteArray';
  size: number;
  initValue: number;
  publisher: string;
  subscribers: string[];
  unit?: string;
  encoding?: string;
}

export interface Ldf13FrameSignal {
  signal: string;
  offset: number;
}

export interface Ldf13Frame {
  name: string;
  id: number;
  publisher: string;
  length: number;
  signals: Ldf13FrameSignal[];
}

export interface Ldf13ScheduleEntry {
  frame: string;
  delayMs: number;
}

export interface Ldf13ScheduleTable {
  name: string;
  entries: Ldf13ScheduleEntry[];
}

export interface Ldf13Document {
  protocolVersion: '1.3';
  languageVersion: string;
  bitrate: number;
  nodes: Ldf13NodeConfig;
  nodeAttributes: Ldf13NodeAttribute[];
  signals: Ldf13Signal[];
  frames: Ldf13Frame[];
  scheduleTables: Ldf13ScheduleTable[];
  unknownSectionsRaw?: string;
}

export const createDefaultLdf13Document = (): Ldf13Document => ({
  protocolVersion: '1.3',
  languageVersion: '2.0',
  bitrate: 19200,
  nodes: {
    master: 'MasterNode',
    timeBaseMs: 5,
    jitterMs: 0.1,
    slaves: ['SlaveNode1']
  },
  nodeAttributes: [
    {
      node: 'SlaveNode1',
      configuredNad: 1,
      supplierId: 0,
      functionId: 0,
      variant: 0
    }
  ],
  signals: [
    {
      name: 'DemoSignal',
      description: '',
      signalType: 'Scalar',
      size: 8,
      initValue: 0,
      publisher: 'MasterNode',
      subscribers: ['SlaveNode1'],
      unit: '',
      encoding: ''
    },
    ...Array.from({ length: 8 }, (_, i) => ({
      name: `MasterReqB${i}`,
      description: '',
      signalType: 'Scalar' as const,
      size: 8,
      initValue: 0,
      publisher: 'MasterNode',
      subscribers: ['SlaveNode1'],
      unit: '',
      encoding: ''
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      name: `SlaveRespB${i}`,
      description: '',
      signalType: 'Scalar' as const,
      size: 8,
      initValue: 0,
      publisher: 'SlaveNode1',
      subscribers: ['MasterNode'],
      unit: '',
      encoding: ''
    }))
  ],
  frames: [
    {
      name: 'DemoFrame',
      id: 0x10,
      publisher: 'MasterNode',
      length: 8,
      signals: [{ signal: 'DemoSignal', offset: 0 }]
    },
    {
      name: 'MasterReq',
      id: 0x3c,
      publisher: 'MasterNode',
      length: 8,
      signals: Array.from({ length: 8 }, (_, i) => ({ signal: `MasterReqB${i}`, offset: i * 8 }))
    },
    {
      name: 'SlaveResp',
      id: 0x3d,
      publisher: 'SlaveNode1',
      length: 8,
      signals: Array.from({ length: 8 }, (_, i) => ({ signal: `SlaveRespB${i}`, offset: i * 8 }))
    }
  ],
  scheduleTables: [
    {
      name: 'DefaultSchedule',
      entries: [{ frame: 'DemoFrame', delayMs: 10 }]
    }
  ],
  unknownSectionsRaw: ''
});
