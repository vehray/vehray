<template>
  <div class="tab-panel">
    <div class="tab-bar">
      <div class="tab-item" :class="{ active: activeTabId === tab.id }" v-for="tab in tabs" :key="tab.id" @click="switchTab(tab.id)">
        <span class="tab-title">{{ tab.title }}</span>
        <button class="tab-close" @click.stop="closeTab(tab.id)">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
    <div class="tab-content">
      <div class="tab-content-placeholder">标签内容区域</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Close } from '@element-plus/icons-vue';

interface Tab {
  id: string;
  title: string;
  content: string;
}

const tabs = ref<Tab[]>([
  { id: '1', title: '文件1', content: '内容1' },
  { id: '2', title: '文件2', content: '内容2' }
]);
const activeTabId = ref('1');

const switchTab = (id: string) => {
  activeTabId.value = id;
};

const closeTab = (id: string) => {
  const currentIndex = tabs.value.findIndex(tab => tab.id === id);
  tabs.value = tabs.value.filter(tab => tab.id !== id);
  if (tabs.value.length === 0) {
    activeTabId.value = '';
    return;
  }
  if (activeTabId.value === id) {
    const fallback = tabs.value[Math.max(0, currentIndex - 1)] ?? tabs.value[0];
    activeTabId.value = fallback.id;
  }
};
</script>

<style scoped>
.tab-panel {
  background-color: var(--app-bg);
  border-top: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-bar {
  background-color: var(--app-bg-elevated);
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  height: 34px;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 24px;
  border: none;
  border-radius: 3px;
  background-color: transparent;
  color: var(--app-text-regular);
  transition: background-color 0.2s ease, color 0.2s ease;
  font-size: 12px;
  font-weight: 500;
}

.tab-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.tab-item.active {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.tab-title {
  font-size: 12px;
  line-height: 1;
}

.tab-close {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-close:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.tab-content {
  flex: 1;
  background-color: var(--app-bg);
  overflow: hidden;
}

.tab-content-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-faint);
  font-size: 14px;
}
</style>
