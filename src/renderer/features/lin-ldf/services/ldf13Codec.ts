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

export const serializeLdf13 = (doc: Ldf13Document): string => {
  const signalRows = doc.signals
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

  const frameRows = doc.frames
    .map((frame) => {
      const frameSignals = frame.signals.map((item) => `    ${item.signal}, ${item.offset};`).join('\n');
      return `  ${frame.name}: 0x${frame.id.toString(16).toUpperCase()}, ${frame.publisher}, ${frame.length} {\n${frameSignals}\n  }`;
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
    `Bitrate = ${doc.bitrate};`,
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

export const deserializeLdf13 = (source: string): Ldf13Document => {
  const protocolMatch = source.match(/LIN_protocol_version\s*=\s*"([^"]+)";/);
  if (!protocolMatch || protocolMatch[1] !== '1.3') {
    throw new Error('Only LIN protocol version 1.3 is supported.');
  }

  const languageMatch = source.match(/LIN_language_version\s*=\s*"([^"]+)";/);
  const bitrateMatch = source.match(/Bitrate\s*=\s*(\d+)\s*;/);
  const nodesBlock = parseBlock(source, 'Nodes');
  const nodeAttributesBlock = parseBlock(source, 'Node_attributes');
  const signalsBlock = parseBlock(source, 'Signals');
  const framesBlock = parseBlock(source, 'Frames');
  const scheduleTablesBlock = parseBlock(source, 'Schedule_tables');

  if (!languageMatch || !bitrateMatch || !nodesBlock || !signalsBlock || !framesBlock) {
    throw new Error('Missing required LDF sections.');
  }

  const masterMatch = nodesBlock.match(/Master\s*:\s*([A-Za-z_]\w*)\s*,\s*([\d.]+)\s*ms\s*,\s*([\d.]+)\s*ms\s*;/);
  const slavesMatch = nodesBlock.match(/Slaves\s*:\s*([^;]+);/);
  if (!masterMatch || !slavesMatch) {
    throw new Error('Invalid Nodes section.');
  }

  const coreBlockNames = ['Nodes', 'Node_attributes', 'Signals', 'Frames', 'Schedule_tables'];
  const unknownSectionsRaw = source
    .split(/\n{2,}/)
    .filter((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return false;
      return !coreBlockNames.some((block) => trimmed.startsWith(`${block} {`));
    })
    .filter((chunk) => !/^(LIN_description_file;|LIN_protocol_version|LIN_language_version|Bitrate)/m.test(chunk.trim()))
    .join('\n\n');

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
    nodeAttributes: parseNodeAttributes(nodeAttributesBlock),
    signals: parseSignals(signalsBlock),
    frames: parseFrames(framesBlock),
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
