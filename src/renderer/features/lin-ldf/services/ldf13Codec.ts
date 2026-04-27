import type {
  Ldf13Document,
  Ldf13Frame,
  Ldf13NodeAttribute,
  Ldf13ScheduleTable,
  Ldf13Signal,
} from '../models/ldf13';
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

const normalizeQuotes = (source: string) => source.replace(/[“”]/g, '"');

const formatKbps = (bitrateBps: number) => {
  const kbps = bitrateBps / 1000;
  return formatFloat(kbps);
};

const parseLdfBitrate = (source: string): number | null => {
  const bitrateMatch = source.match(/Bitrate\s*=\s*(\d+)\s*;/i);
  if (bitrateMatch?.[1]) {
    return Number.parseInt(bitrateMatch[1], 10);
  }
  const linSpeedMatch = source.match(/LIN_speed\s*=\s*([\d.]+)\s*kbps\s*;/i);
  if (linSpeedMatch?.[1]) {
    const kbps = Number.parseFloat(linSpeedMatch[1]);
    if (Number.isFinite(kbps) && kbps > 0) {
      return Math.round(kbps * 1000);
    }
  }
  return null;
};

const parseBlock = (source: string, blockName: string) => {
  const headerRegex = new RegExp(`${blockName}\\s*\\{`, 'm');
  const matched = headerRegex.exec(source);
  if (!matched || typeof matched.index !== 'number') return '';
  const openBraceIndex = source.indexOf('{', matched.index);
  if (openBraceIndex < 0) return '';

  let depth = 1;
  for (let i = openBraceIndex + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex + 1, i);
      }
    }
  }
  return '';
};

const parseBlockRange = (source: string, blockName: string): [number, number] | null => {
  const headerRegex = new RegExp(`${blockName}\\s*\\{`, 'm');
  const matched = headerRegex.exec(source);
  if (!matched || typeof matched.index !== 'number') return null;
  const openBraceIndex = source.indexOf('{', matched.index);
  if (openBraceIndex < 0) return null;
  let depth = 1;
  for (let i = openBraceIndex + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return [matched.index, i + 1];
      }
    }
  }
  return null;
};

export const serializeLdf13 = (doc: Ldf13Document): string => {
  const isDiagnosticSignalName = (name: string) =>
    /^MasterReqB[0-7]$/.test(name) || /^SlaveRespB[0-7]$/.test(name);
  const isDiagnosticFrame = (frame: Ldf13Frame) => {
    const normalizedName = frame.name.toLowerCase();
    if (normalizedName !== 'masterreq' && normalizedName !== 'slaveresp') {
      return false;
    }
    if (frame.id !== 0x3c && frame.id !== 0x3d) {
      return false;
    }
    return frame.signals.every((item) => isDiagnosticSignalName(item.signal));
  };
  const diagnosticFrames = doc.frames.filter(isDiagnosticFrame);
  const regularFrames = doc.frames.filter((frame) => !isDiagnosticFrame(frame));
  const diagnosticSignalNameSet = new Set<string>(
    diagnosticFrames.flatMap((frame) => frame.signals.map((item) => item.signal))
  );
  const regularSignals = doc.signals.filter((signal) => !diagnosticSignalNameSet.has(signal.name));
  const diagnosticSignals = doc.signals.filter((signal) => diagnosticSignalNameSet.has(signal.name));

  const signalRows = regularSignals
    .map((signal) => {
      const meta: string[] = [];
      if (signal.description?.trim()) {
        meta.push(`desc=${encodeURIComponent(signal.description.trim())}`);
      }
      if (signal.signalType) {
        meta.push(`type=${signal.signalType}`);
      }
      const metaTail = meta.length > 0 ? ` // @meta ${meta.join('&')}` : '';
      return `  ${signal.name}: ${signal.size}, ${signal.initValue}, ${signal.publisher}, ${signal.subscribers.join(', ')};${metaTail}`;
    })
    .join('\n');

  const frameRows = regularFrames
    .map((frame) => {
      const frameSignals = frame.signals.map((item) => `    ${item.signal}, ${item.offset};`).join('\n');
      return `  ${frame.name}: 0x${frame.id.toString(16).toUpperCase()}, ${frame.publisher}, ${frame.length} {\n${frameSignals}\n  }`;
    })
    .join('\n');

  const diagnosticSignalRows = diagnosticSignals
    .map((signal) => `  ${signal.name}: ${signal.size}, ${signal.initValue} ;`)
    .join('\n');

  const diagnosticFrameRows = diagnosticFrames
    .map((frame) => {
      const frameSignals = frame.signals.map((item) => `    ${item.signal}, ${item.offset} ;`).join('\n');
      return `  ${frame.name}: 0x${frame.id.toString(16).toLowerCase()} {\n${frameSignals}\n  }`;
    })
    .join('\n');

  const nodeAttrRows = doc.nodeAttributes
    .map((attr) => {
      const configuredNad = attr.configuredNad ?? 1;
      const supplierId = attr.supplierId ?? 0;
      const functionId = attr.functionId ?? 0;
      const variant = attr.variant ?? 0;
      return `  ${attr.node} { configured_nad = ${configuredNad}; supplier_id = ${supplierId}; function_id = ${functionId}; variant = ${variant}; }`;
    })
    .join('\n');

  const scheduleRows = doc.scheduleTables
    .map((table) => {
      const entries = table.entries
        .map((entry) => `    ${entry.frame} delay ${formatFloat(entry.delayMs)} ms;`)
        .join('\n');
      return `  ${table.name} {\n${entries}\n  }`;
    })
    .join('\n');

  return [
    'LIN_description_file;',
    '',
    `LIN_protocol_version = "${doc.protocolVersion}";`,
    `LIN_language_version = "${doc.languageVersion}";`,
    `LIN_speed = ${formatKbps(doc.bitrate)} kbps;`,
    '',
    'Nodes {',
    `  Master: ${doc.nodes.master}, ${formatFloat(doc.nodes.timeBaseMs)} ms, ${formatFloat(doc.nodes.jitterMs)} ms;`,
    `  Slaves: ${doc.nodes.slaves.join(', ')};`,
    '}',
    '',
    'Node_attributes {',
    nodeAttrRows,
    '}',
    '',
    'Signals {',
    signalRows,
    '}',
    '',
    'Frames {',
    frameRows,
    '}',
    '',
    'Diagnostic_signals {',
    diagnosticSignalRows,
    '}',
    '',
    'Diagnostic_frames {',
    diagnosticFrameRows,
    '}',
    '',
    'Schedule_tables {',
    scheduleRows,
    '}',
    doc.unknownSectionsRaw?.trim() ? `\n${doc.unknownSectionsRaw.trim()}\n` : '',
    ''
  ].join('\n');
};

const parseSignals = (block: string): Ldf13Signal[] => {
  const rows = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'));

  return rows.map((line) => {
    const metaMatch = line.match(/\/\/\s*@meta\s+(.+)$/);
    const rawLine = line.replace(/\/\/.*$/, '').trim();
    const matched = rawLine.match(/^([A-Za-z_]\w*)\s*:\s*([^;]+);$/);
    if (!matched) {
      throw new Error(`Invalid signal row: ${line}`);
    }
    const values = matched[2].split(',').map((item) => item.trim());
    if (values.length < 4) {
      throw new Error(`Signal row must contain 4+ fields: ${line}`);
    }
    const metaPairs = (metaMatch?.[1] ?? '')
      .split('&')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [k, ...rest] = item.split('=');
        return [k, rest.join('=')] as const;
      });
    const metaMap = new Map(metaPairs);
    const signalTypeRaw = metaMap.get('type');
    const signalType: 'Scalar' | 'ByteArray' = signalTypeRaw === 'ByteArray' ? 'ByteArray' : 'Scalar';
    const descriptionRaw = metaMap.get('desc') ?? '';
    let description = '';
    if (descriptionRaw) {
      try {
        description = decodeURIComponent(descriptionRaw);
      } catch {
        description = descriptionRaw;
      }
    }
    return {
      name: matched[1],
      description,
      signalType,
      size: Number.parseInt(values[0], 10),
      initValue: parseNumber(values[1]),
      publisher: values[2],
      subscribers: values.slice(3)
    };
  });
};

const parseFrames = (block: string): Ldf13Frame[] => {
  const frameMatches = block.matchAll(
    /([A-Za-z_]\w*)\s*:\s*(0x[0-9A-Fa-f]+|\d+)\s*,\s*([A-Za-z_]\w*)(?:\s*,\s*(\d+))?\s*\{([\s\S]*?)\}/g
  );
  const frames: Ldf13Frame[] = [];

  for (const match of frameMatches) {
    const signalRows = match[5]
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .filter((line) => line);

    frames.push({
      name: match[1],
      id: parseNumber(match[2]),
      publisher: match[3],
      length: match[4] ? Number.parseInt(match[4], 10) : 8,
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

const parseNodeAttributes = (block: string): Ldf13NodeAttribute[] => {
  if (!block.trim()) return [];
  const matches = block.matchAll(/([A-Za-z_]\w*)\s*\{([\s\S]*?)\}/g);
  const parsed: Ldf13NodeAttribute[] = [];
  for (const match of matches) {
    const body = match[2] ?? '';
    const readField = (key: string) => {
      const field = body.match(new RegExp(`${key}\\s*=\\s*([^;]+);`, 'i'));
      return field?.[1] ? parseNumber(field[1]) : undefined;
    };
    parsed.push({
      node: match[1],
      configuredNad: readField('configured_nad'),
      supplierId: readField('supplier_id'),
      functionId: readField('function_id'),
      variant: readField('variant'),
    });
  }
  return parsed;
};

const parseScheduleTables = (block: string): Ldf13ScheduleTable[] => {
  if (!block.trim()) return [];
  const tables: Ldf13ScheduleTable[] = [];
  const matches = block.matchAll(/([A-Za-z_]\w*)\s*\{([\s\S]*?)\}/g);
  for (const match of matches) {
    const rows = (match[2] ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//'));
    const entries = rows
      .map((line) => {
        const entryMatch = line.match(/^([A-Za-z_]\w*)\s+delay\s+([\d.]+)\s*ms\s*;$/i);
        if (!entryMatch) return null;
        return {
          frame: entryMatch[1],
          delayMs: parseNumber(entryMatch[2]),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    tables.push({
      name: match[1],
      entries,
    });
  }
  return tables;
};

const parseDiagnosticSignals = (
  block: string,
  masterNode: string,
  slaveNodes: string[]
): Ldf13Signal[] => {
  if (!block.trim()) return [];
  const firstSlave = slaveNodes[0] ?? masterNode;
  const rows = block
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, '').trim())
    .filter((line) => line);

  const signals: Ldf13Signal[] = [];
  for (const row of rows) {
    const matched = row.match(/^([A-Za-z_]\w*)\s*:\s*(\d+)\s*,\s*([^;]+)\s*;$/);
    if (!matched) continue;
    const name = matched[1];
    const size = Number.parseInt(matched[2], 10);
    const initValue = parseNumber(matched[3]);
    const isMasterReq = /^MasterReq/i.test(name);
    const publisher = isMasterReq ? masterNode : firstSlave;
    const subscribers = isMasterReq ? [...slaveNodes] : [masterNode];
    signals.push({
      name,
      size,
      initValue,
      publisher,
      subscribers,
      description: '',
      signalType: 'Scalar',
      unit: '',
      encoding: ''
    });
  }
  return signals;
};

const parseDiagnosticFrames = (
  block: string,
  masterNode: string,
  slaveNodes: string[]
): Ldf13Frame[] => {
  if (!block.trim()) return [];
  const firstSlave = slaveNodes[0] ?? masterNode;
  const matches = block.matchAll(/([A-Za-z_]\w*)\s*:\s*(0x[0-9A-Fa-f]+|\d+)\s*\{([\s\S]*?)\}/g);
  const frames: Ldf13Frame[] = [];
  for (const match of matches) {
    const name = match[1];
    const id = parseNumber(match[2]);
    const rows = (match[3] ?? '')
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .filter((line) => line);
    const signals = rows
      .map((line) => {
        const sm = line.match(/^([A-Za-z_]\w*)\s*,\s*(\d+)\s*;$/);
        if (!sm) return null;
        return { signal: sm[1], offset: Number.parseInt(sm[2], 10) };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    const publisher =
      id === 0x3c || /^MasterReq/i.test(name)
        ? masterNode
        : id === 0x3d || /^SlaveResp/i.test(name)
          ? firstSlave
          : masterNode;
    frames.push({
      name,
      id,
      publisher,
      length: 8,
      signals
    });
  }
  return frames;
};

export const deserializeLdf13 = (source: string): Ldf13Document => {
  const normalizedSource = normalizeQuotes(source);
  const protocolMatch = normalizedSource.match(/LIN_protocol_version\s*=\s*"([^"]+)";/);
  if (!protocolMatch || protocolMatch[1] !== '1.3') {
    throw new Error('Only LIN protocol version 1.3 is supported.');
  }

  const languageMatch = normalizedSource.match(/LIN_language_version\s*=\s*"([^"]+)";/);
  const bitrate = parseLdfBitrate(normalizedSource);
  const nodesBlock = parseBlock(normalizedSource, 'Nodes');
  const nodeAttributesBlock = parseBlock(normalizedSource, 'Node_attributes');
  const signalsBlock = parseBlock(normalizedSource, 'Signals');
  const diagnosticSignalsBlock = parseBlock(normalizedSource, 'Diagnostic_signals');
  const framesBlock = parseBlock(normalizedSource, 'Frames');
  const diagnosticFramesBlock = parseBlock(normalizedSource, 'Diagnostic_frames');
  const scheduleTablesBlock = parseBlock(normalizedSource, 'Schedule_tables');

  if (!languageMatch || bitrate === null || !nodesBlock || !signalsBlock || !framesBlock) {
    throw new Error('Missing required LDF sections.');
  }

  const masterMatch = nodesBlock.match(/Master\s*:\s*([A-Za-z_]\w*)\s*,\s*([\d.]+)\s*ms\s*,\s*([\d.]+)\s*ms\s*;/);
  const slavesMatch = nodesBlock.match(/Slaves\s*:\s*([^;]+);/);
  if (!masterMatch || !slavesMatch) {
    throw new Error('Invalid Nodes section.');
  }

  const maskRanges: Array<[number, number]> = [];
  const pushRange = (range: [number, number] | null) => {
    if (range) maskRanges.push(range);
  };
  pushRange(parseBlockRange(normalizedSource, 'Nodes'));
  pushRange(parseBlockRange(normalizedSource, 'Node_attributes'));
  pushRange(parseBlockRange(normalizedSource, 'Signals'));
  pushRange(parseBlockRange(normalizedSource, 'Diagnostic_signals'));
  pushRange(parseBlockRange(normalizedSource, 'Frames'));
  pushRange(parseBlockRange(normalizedSource, 'Diagnostic_frames'));
  pushRange(parseBlockRange(normalizedSource, 'Schedule_tables'));

  for (const declarationPattern of [
    /^\s*LIN_description_file\s*;[^\n]*$/im,
    /^\s*LIN_protocol_version\s*=\s*".*?"\s*;[^\n]*$/im,
    /^\s*LIN_language_version\s*=\s*".*?"\s*;[^\n]*$/im,
    /^\s*(?:Bitrate\s*=\s*\d+|LIN_speed\s*=\s*[\d.]+\s*kbps)\s*;[^\n]*$/im,
  ]) {
    const matched = declarationPattern.exec(normalizedSource);
    if (matched && typeof matched.index === 'number') {
      maskRanges.push([matched.index, matched.index + matched[0].length]);
    }
  }

  const sortedRanges = maskRanges.sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  const unknownChunks: string[] = [];
  for (const [start, end] of sortedRanges) {
    if (start > cursor) {
      unknownChunks.push(normalizedSource.slice(cursor, start));
    }
    cursor = Math.max(cursor, end);
  }
  if (cursor < normalizedSource.length) {
    unknownChunks.push(normalizedSource.slice(cursor));
  }
  const unknownSectionsRaw = unknownChunks
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const slaveNodes = slavesMatch[1].split(',').map((item) => item.trim()).filter(Boolean);
  const regularSignals = parseSignals(signalsBlock);
  const diagnosticSignals = parseDiagnosticSignals(diagnosticSignalsBlock, masterMatch[1], slaveNodes);
  const signalMap = new Map<string, Ldf13Signal>();
  for (const signal of [...regularSignals, ...diagnosticSignals]) {
    signalMap.set(signal.name, signal);
  }
  const regularFrames = parseFrames(framesBlock);
  const diagnosticFrames = parseDiagnosticFrames(diagnosticFramesBlock, masterMatch[1], slaveNodes);
  const frameMap = new Map<string, Ldf13Frame>();
  for (const frame of [...regularFrames, ...diagnosticFrames]) {
    frameMap.set(frame.name, frame);
  }

  return {
    protocolVersion: '1.3',
    languageVersion: languageMatch[1],
    bitrate,
    nodes: {
      master: masterMatch[1],
      timeBaseMs: parseNumber(masterMatch[2]),
      jitterMs: parseNumber(masterMatch[3]),
      slaves: slaveNodes
    },
    nodeAttributes: parseNodeAttributes(nodeAttributesBlock),
    signals: Array.from(signalMap.values()),
    frames: Array.from(frameMap.values()),
    scheduleTables: parseScheduleTables(scheduleTablesBlock),
    unknownSectionsRaw,
  };
};

export const normalizeLdf13 = (source: string): string => serializeLdf13(deserializeLdf13(source));

export const createDefaultLdf13Text = (): string => serializeLdf13(createDefaultLdf13Document());

export interface Ldf13ValidationIssue {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export const validateLdf13Document = (doc: Ldf13Document): Ldf13ValidationIssue[] => {
  const issues: Ldf13ValidationIssue[] = [];
  const nodeSet = new Set<string>([doc.nodes.master, ...doc.nodes.slaves]);

  const signalNameSet = new Set<string>();
  for (const signal of doc.signals) {
    if (signalNameSet.has(signal.name)) {
      issues.push({ level: 'error', code: 'signal.duplicate', message: `Duplicate signal name: ${signal.name}` });
    }
    signalNameSet.add(signal.name);
    if (!nodeSet.has(signal.publisher)) {
      issues.push({ level: 'error', code: 'signal.publisher.missingNode', message: `Signal publisher not found: ${signal.publisher}` });
    }
    for (const sub of signal.subscribers) {
      if (!nodeSet.has(sub)) {
        issues.push({ level: 'warning', code: 'signal.subscriber.missingNode', message: `Signal subscriber not found: ${sub}` });
      }
    }
  }

  const frameNameSet = new Set<string>();
  const frameIdSet = new Set<number>();
  for (const frame of doc.frames) {
    if (frameNameSet.has(frame.name)) {
      issues.push({ level: 'error', code: 'frame.duplicateName', message: `Duplicate frame name: ${frame.name}` });
    }
    frameNameSet.add(frame.name);
    if (frameIdSet.has(frame.id)) {
      issues.push({ level: 'error', code: 'frame.duplicateId', message: `Duplicate frame id: ${frame.id}` });
    }
    frameIdSet.add(frame.id);
    if (!nodeSet.has(frame.publisher)) {
      issues.push({ level: 'error', code: 'frame.publisher.missingNode', message: `Frame publisher not found: ${frame.publisher}` });
    }
    const usedBits = new Set<number>();
    for (const item of frame.signals) {
      const signal = doc.signals.find((x) => x.name === item.signal);
      if (!signal) {
        issues.push({ level: 'error', code: 'frame.signal.notFound', message: `Frame ${frame.name} references missing signal: ${item.signal}` });
        continue;
      }
      const start = item.offset;
      const end = start + signal.size - 1;
      if (end >= frame.length * 8) {
        issues.push({ level: 'error', code: 'frame.signal.outOfRange', message: `Signal ${item.signal} exceeds frame ${frame.name} length` });
      }
      for (let b = start; b <= end; b += 1) {
        if (usedBits.has(b)) {
          issues.push({ level: 'error', code: 'frame.signal.overlap', message: `Signal overlap in frame ${frame.name} at bit ${b}` });
          break;
        }
        usedBits.add(b);
      }
    }
  }

  for (const table of doc.scheduleTables) {
    for (const entry of table.entries) {
      if (!frameNameSet.has(entry.frame)) {
        issues.push({ level: 'error', code: 'schedule.frame.notFound', message: `Schedule ${table.name} references missing frame: ${entry.frame}` });
      }
      if (entry.delayMs <= 0) {
        issues.push({ level: 'warning', code: 'schedule.delay.nonPositive', message: `Schedule ${table.name} has non-positive delay for frame ${entry.frame}` });
      }
    }
  }

  return issues;
};
