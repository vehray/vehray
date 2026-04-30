<template>
  <div class="trace-view">
    <div class="trace-header">
      <div class="trace-header-top">
        <h2>Trace</h2>
        <div class="trace-actions">
          <button class="trace-btn" @click="toggleMockStream">{{ running ? '停止' : '启动' }}</button>
          <button class="trace-btn" @click="clearFrames">清空</button>
        </div>
      </div>
      <p>LIN 假数据流（10ms采集 + 20ms批量刷新）</p>
      <p>缓冲队列: {{ pendingCount }}</p>
    </div>
    <div ref="traceBodyRef" class="trace-body">
      <table class="trace-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>总线</th>
            <th>ID</th>
            <th>DLC</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in frames" :key="item.seq">
            <td>{{ item.time }}</td>
            <td>LIN</td>
            <td>{{ item.id }}</td>
            <td>{{ item.dlc }}</td>
            <td class="trace-data">{{ item.data }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

type TraceFrame = {
  seq: number;
  time: string;
  id: string;
  dlc: number;
  data: string;
};

const MAX_ROWS = 1200;
const INTERVAL_MS = 10;
const UI_FLUSH_MS = 20;
const frames = ref<TraceFrame[]>([]);
const running = ref(true);
const traceBodyRef = ref<HTMLElement | null>(null);
const pendingCount = ref(0);

let seq = 0;
let producerTimer: ReturnType<typeof setInterval> | null = null;
let uiFlushTimer: ReturnType<typeof setInterval> | null = null;
const frameBuffer: TraceFrame[] = [];

const toHex = (value: number, width: number) => value.toString(16).toUpperCase().padStart(width, '0');
const randomByte = () => Math.floor(Math.random() * 256);
const randomDlc = () => Math.floor(Math.random() * 8) + 1;
const nowTime = () => {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};

const produceRandomLinFrame = () => {
  const dlc = randomDlc();
  const bytes: string[] = [];
  for (let i = 0; i < dlc; i += 1) {
    bytes.push(toHex(randomByte(), 2));
  }
  frameBuffer.push({
    seq: seq += 1,
    time: nowTime(),
    id: `0x${toHex(Math.floor(Math.random() * 0x40), 2)}`,
    dlc,
    data: bytes.join(' ')
  });
  pendingCount.value = frameBuffer.length;
};

const flushFramesToUi = async () => {
  if (frameBuffer.length <= 0) return;
  const chunk = frameBuffer.splice(0, frameBuffer.length);
  frames.value.push(...chunk);
  if (frames.value.length > MAX_ROWS) {
    frames.value.splice(0, frames.value.length - MAX_ROWS);
  }
  pendingCount.value = frameBuffer.length;

  await nextTick();
  if (traceBodyRef.value) {
    traceBodyRef.value.scrollTop = traceBodyRef.value.scrollHeight;
  }
};

const startMockStream = () => {
  if (producerTimer || uiFlushTimer) return;
  producerTimer = setInterval(() => {
    produceRandomLinFrame();
  }, INTERVAL_MS);
  uiFlushTimer = setInterval(() => {
    void flushFramesToUi();
  }, UI_FLUSH_MS);
  running.value = true;
};

const stopMockStream = () => {
  if (producerTimer) {
    clearInterval(producerTimer);
    producerTimer = null;
  }
  if (uiFlushTimer) {
    clearInterval(uiFlushTimer);
    uiFlushTimer = null;
  }
  running.value = false;
};

const toggleMockStream = () => {
  if (running.value) {
    stopMockStream();
  } else {
    startMockStream();
  }
};

const clearFrames = () => {
  frames.value = [];
  frameBuffer.length = 0;
  pendingCount.value = 0;
};

onMounted(() => {
  startMockStream();
});

onUnmounted(() => {
  stopMockStream();
});
</script>

<style scoped>
.trace-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-bg);
}
.trace-header {
  border-bottom: 1px solid var(--app-border);
  padding: 12px 16px;
}
.trace-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.trace-header h2 {
  margin: 0;
  color: var(--app-text-primary);
  font-size: 16px;
}
.trace-header p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
}
.trace-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.trace-actions {
  display: flex;
  gap: 8px;
}
.trace-btn {
  border: 1px solid var(--app-border);
  background: var(--app-bg-elevated);
  color: var(--app-text-regular);
  border-radius: 6px;
  height: 26px;
  padding: 0 10px;
  cursor: pointer;
}
.trace-btn:hover {
  background: var(--app-bg-hover);
}
.trace-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
}
.trace-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--app-bg-elevated);
  color: var(--app-text-primary);
  text-align: left;
  border-bottom: 1px solid var(--app-border);
  padding: 6px 8px;
}
.trace-table td {
  border-bottom: 1px solid var(--app-border);
  color: var(--app-text-regular);
  padding: 4px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trace-data {
  font-family: Consolas, 'Courier New', monospace;
}
</style>
