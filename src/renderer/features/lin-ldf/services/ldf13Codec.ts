import type { Ldf13Document, Ldf13Frame, Ldf13Signal } from '../models/ldf13';
import { createDefaultLdf13Document } from '../models/ldf13';

const formatFloat = (value: number) => {
  if (Number.isInteger(value)) return `${value}`;
  return `${value}`.replace(/\.?0+$/, '');
};

const parseNumber = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
    return Number.parseInt(trimmed, 16);
  }
  return Number.parseFloat(trimmed);
};

export const serializeLdf13 = (doc: Ldf13Document): string => {
  const signalRows = doc.signals
    .map((signal) => `  ${signal.name}: ${signal.size}, ${signal.initValue}, ${signal.publisher}, ${signal.subscribers.join(', ')};`)
    .join('\n');

  const frameRows = doc.frames
    .map((frame) => {
      const frameSignals = frame.signals.map((item) => `    ${item.signal}, ${item.offset};`).join('\n');
      return `  ${frame.name}: 0x${frame.id.toString(16).toUpperCase()}, ${frame.publisher}, ${frame.length} {\n${frameSignals}\n  }`;
    })
    .join('\n');

  return [
    'LIN_description_file;',
    '',
    `LIN_protocol_version = "${doc.protocolVersion}";`,
    `LIN_language_version = "${doc.languageVersion}";`,
    `Bitrate = ${doc.bitrate};`,
    '',
    'Nodes {',
    `  Master: ${doc.nodes.master}, ${formatFloat(doc.nodes.timeBaseMs)} ms, ${formatFloat(doc.nodes.jitterMs)} ms;`,
    `  Slaves: ${doc.nodes.slaves.join(', ')};`,
    '}',
    '',
    'Signals {',
    signalRows,
    '}',
    '',
    'Frames {',
    frameRows,
    '}',
    ''
  ].join('\n');
};

const parseSignals = (block: string): Ldf13Signal[] => {
  const rows = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'));

  return rows.map((line) => {
    const matched = line.match(/^([A-Za-z_]\w*)\s*:\s*([^;]+);$/);
    if (!matched) {
      throw new Error(`Invalid signal row: ${line}`);
    }
    const values = matched[2].split(',').map((item) => item.trim());
    if (values.length < 4) {
      throw new Error(`Signal row must contain 4+ fields: ${line}`);
    }
    return {
      name: matched[1],
      size: Number.parseInt(values[0], 10),
      initValue: parseNumber(values[1]),
      publisher: values[2],
      subscribers: values.slice(3)
    };
  });
};

const parseFrames = (block: string): Ldf13Frame[] => {
  const frameMatches = block.matchAll(/([A-Za-z_]\w*)\s*:\s*(0x[0-9A-Fa-f]+|\d+)\s*,\s*([A-Za-z_]\w*)\s*,\s*(\d+)\s*\{([\s\S]*?)\}/g);
  const frames: Ldf13Frame[] = [];

  for (const match of frameMatches) {
    const signalRows = match[5]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//'));

    frames.push({
      name: match[1],
      id: parseNumber(match[2]),
      publisher: match[3],
      length: Number.parseInt(match[4], 10),
      signals: signalRows.map((line) => {
        const signalMatch = line.match(/^([A-Za-z_]\w*)\s*,\s*(\d+);$/);
        if (!signalMatch) {
          throw new Error(`Invalid frame signal row: ${line}`);
        }
        return {
          signal: signalMatch[1],
          offset: Number.parseInt(signalMatch[2], 10)
        };
      })
    });
  }

  return frames;
};

export const deserializeLdf13 = (source: string): Ldf13Document => {
  const protocolMatch = source.match(/LIN_protocol_version\s*=\s*"([^"]+)";/);
  if (!protocolMatch || protocolMatch[1] !== '1.3') {
    throw new Error('Only LIN protocol version 1.3 is supported.');
  }

  const languageMatch = source.match(/LIN_language_version\s*=\s*"([^"]+)";/);
  const bitrateMatch = source.match(/Bitrate\s*=\s*(\d+)\s*;/);
  const nodesMatch = source.match(/Nodes\s*\{([\s\S]*?)\}/);
  const signalsMatch = source.match(/Signals\s*\{([\s\S]*?)\}/);
  const framesMatch = source.match(/Frames\s*\{([\s\S]*?)\}\s*$/m);

  if (!languageMatch || !bitrateMatch || !nodesMatch || !signalsMatch || !framesMatch) {
    throw new Error('Missing required LDF sections.');
  }

  const masterMatch = nodesMatch[1].match(/Master\s*:\s*([A-Za-z_]\w*)\s*,\s*([\d.]+)\s*ms\s*,\s*([\d.]+)\s*ms\s*;/);
  const slavesMatch = nodesMatch[1].match(/Slaves\s*:\s*([^;]+);/);
  if (!masterMatch || !slavesMatch) {
    throw new Error('Invalid Nodes section.');
  }

  return {
    protocolVersion: '1.3',
    languageVersion: languageMatch[1],
    bitrate: Number.parseInt(bitrateMatch[1], 10),
    nodes: {
      master: masterMatch[1],
      timeBaseMs: parseNumber(masterMatch[2]),
      jitterMs: parseNumber(masterMatch[3]),
      slaves: slavesMatch[1].split(',').map((item) => item.trim()).filter(Boolean)
    },
    signals: parseSignals(signalsMatch[1]),
    frames: parseFrames(framesMatch[1])
  };
};

export const normalizeLdf13 = (source: string): string => serializeLdf13(deserializeLdf13(source));

export const createDefaultLdf13Text = (): string => serializeLdf13(createDefaultLdf13Document());
