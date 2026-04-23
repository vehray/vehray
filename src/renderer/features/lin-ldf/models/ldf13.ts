export interface Ldf13NodeConfig {
  master: string;
  timeBaseMs: number;
  jitterMs: number;
  slaves: string[];
}

export interface Ldf13Signal {
  name: string;
  size: number;
  initValue: number;
  publisher: string;
  subscribers: string[];
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

export interface Ldf13Document {
  protocolVersion: '1.3';
  languageVersion: string;
  bitrate: number;
  nodes: Ldf13NodeConfig;
  signals: Ldf13Signal[];
  frames: Ldf13Frame[];
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
  signals: [
    {
      name: 'DemoSignal',
      size: 8,
      initValue: 0,
      publisher: 'MasterNode',
      subscribers: ['SlaveNode1']
    }
  ],
  frames: [
    {
      name: 'DemoFrame',
      id: 0x10,
      publisher: 'MasterNode',
      length: 8,
      signals: [{ signal: 'DemoSignal', offset: 0 }]
    }
  ]
});
