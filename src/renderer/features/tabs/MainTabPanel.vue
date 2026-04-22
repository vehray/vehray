<template>
  <div class="main-tab-panel">
    <div class="main-tab-bar">
      <div
        class="main-tab-item"
        :class="{ active: activeTabId === tab.id }"
        v-for="tab in tabs"
        :key="tab.id"
        @click="switchTab(tab.id)"
      >
        <span class="main-tab-title">{{ tab.title }}</span>
        <button class="main-tab-close" @click.stop="closeTab(tab.id)">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
    <div class="main-tab-content">
      <div v-if="activeTabId === 'home' && tabs.some(tab => tab.id === 'home')" class="home-view">
        <div class="home-header">
          <h1>欢迎使用</h1>
          <p>这是应用的主页</p>
        </div>
        <div class="home-layout">
          <div class="home-left">
            <div class="action-buttons-square">
              <button class="action-button-square open-folder" @click="handleOpenFolder">打开文件夹</button>
              <button class="action-button-square open-project" @click="handleOpenProject">打开项目</button>
              <button class="action-button-square open-file" @click="handleOpenFile">打开文件</button>
            </div>
          </div>
          <div class="home-right">
            <div class="history-files">
              <h3>最近打开的文件</h3>
              <div v-if="historyFiles.length > 0" class="history-list">
                <div v-for="(file, index) in historyFiles" :key="index" class="history-item" @click="openHistoryFile(file)">
                  <div class="history-item-name">{{ file.name }}</div>
                  <div class="history-item-path">{{ file.path }}</div>
                </div>
              </div>
              <div v-else class="no-history"><p>暂无历史文件</p></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="tabs.length > 0" class="tab-content-placeholder">标签内容区域 - {{ getActiveTab()?.title }}</div>
      <div v-else class="no-tabs-content"><p>请点击左侧的主页按钮</p></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { uiActions } from '../../services/uiActions';
import { useUiState } from '../../state/uiState';
import type { HistoryFileItem } from '../../state/uiState';

const { state, ensureHomeTab, switchToTab, closeTab: closeStateTab } = useUiState();
const tabs = computed(() => state.tabs);
const activeTabId = computed(() => state.activeTab);
const historyFiles = computed(() => state.historyFiles);

const switchTab = (id: string) => switchToTab(id);
const closeTab = (id: string) => closeStateTab(id);
const loadHomeTab = () => {
  ensureHomeTab();
  switchToTab('home');
};
const getActiveTab = () => tabs.value.find(tab => tab.id === activeTabId.value);

onMounted(() => loadHomeTab());

const handleOpenFolder = async () => {
  await uiActions.openFolder();
};
const handleOpenProject = async () => {
  await uiActions.openProject();
};
const handleOpenFile = async () => {
  await uiActions.openFileToHistory();
};
const openHistoryFile = (file: HistoryFileItem) => {
  console.log('打开历史文件:', file.path);
};

defineExpose({ loadHomeTab });
</script>

<style scoped>
.main-tab-panel { width: 100%; height: 100%; display: flex; flex-direction: column; background-color: #1e1e1e; }
.main-tab-bar { background-color: #252526; border-bottom: 1px solid #424242; display: flex; gap: 4px; padding: 0 12px; height: 32px; }
.main-tab-item { display: flex; align-items: center; gap: 4px; padding: 0 12px; height: 24px; background-color: #333333; border: 1px solid #424242; color: #ccc; cursor: pointer; }
.main-tab-item.active { background-color: #1e1e1e; color: #e1e1e1; }
.main-tab-close { border: none; background: transparent; color: #999; cursor: pointer; }
.main-tab-content { flex: 1; overflow: hidden; position: relative; }
.home-view { width: 100%; height: 100%; padding: 24px; overflow-y: auto; }
.home-layout { display: flex; gap: 24px; margin-top: 20px; }
.home-left { flex: 0 0 200px; }
.home-right { flex: 1; min-width: 0; }
.action-buttons-square { display: flex; flex-direction: column; gap: 12px; }
.action-button-square { padding: 16px; border: 1px solid #424242; background: #252526; color: #ccc; cursor: pointer; }
.history-files { background-color: #252526; border: 1px solid #424242; border-radius: 8px; padding: 16px; min-height: 240px; }
.history-item { padding: 8px; border-radius: 4px; cursor: pointer; }
.history-item:hover { background-color: #2d2d2d; }
.history-item-name { color: #fff; font-size: 14px; }
.history-item-path { color: #999; font-size: 12px; }
.tab-content-placeholder, .no-tabs-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; }
</style>
