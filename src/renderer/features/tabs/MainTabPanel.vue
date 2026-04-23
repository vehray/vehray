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
        <span class="main-tab-title">{{ tab.id === 'home' ? t('tabs.homeTab') : tab.title }}</span>
        <button class="main-tab-close" @click.stop="closeTab(tab.id)">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
    <div class="main-tab-content">
      <div v-if="activeTabId === 'home' && tabs.some(tab => tab.id === 'home')" class="home-view">
        <div class="home-header">
          <h1>{{ t('tabs.welcomeTitle') }}</h1>
          <p>{{ t('tabs.welcomeDescription') }}</p>
        </div>
        <div class="home-layout">
          <div class="home-left">
            <div class="action-buttons-square">
              <button class="action-button-square open-folder" @click="handleOpenFolder">{{ t('tabs.openFolder') }}</button>
              <button class="action-button-square open-project" @click="handleOpenProject">{{ t('tabs.openProject') }}</button>
              <button class="action-button-square open-file" @click="handleOpenFile">{{ t('tabs.openFile') }}</button>
            </div>
          </div>
          <div class="home-right">
            <div class="history-files">
              <h3>{{ t('tabs.recentFiles') }}</h3>
              <div v-if="historyFiles.length > 0" class="history-list">
                <div v-for="(file, index) in historyFiles" :key="index" class="history-item" @click="openHistoryFile(file)">
                  <div class="history-item-name">{{ file.name }}</div>
                  <div class="history-item-path">{{ file.path }}</div>
                </div>
              </div>
              <div v-else class="no-history"><p>{{ t('tabs.emptyRecentFiles') }}</p></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="tabs.length > 0" class="tab-content-placeholder">
        {{ t('tabs.tabContentPlaceholder', { title: getActiveTab()?.title ?? '' }) }}
      </div>
      <div v-else class="no-tabs-content"><p>{{ t('tabs.noTabsHint') }}</p></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { uiActions } from '../../services/uiActions';
import { useUiState } from '../../state/uiState';
import type { HistoryFileItem } from '../../state/uiState';

const { state, ensureHomeTab, switchToTab, closeTab: closeStateTab } = useUiState();
const { t } = useI18n();
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
.main-tab-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--app-bg);
  border-left: 1px solid var(--app-border);
  border-right: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}
.main-tab-bar {
  background-color: var(--app-bg-elevated);
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  height: 34px;
}
.main-tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 24px;
  border: none;
  border-radius: 3px;
  background-color: transparent;
  color: var(--app-text-regular);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  font-size: 12px;
  font-weight: 500;
}
.main-tab-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
.main-tab-item.active {
  color: var(--app-text-primary);
}
.main-tab-title {
  font-size: 12px;
  line-height: 1;
}
.main-tab-close {
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
.main-tab-close:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
.main-tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: var(--app-bg);
}
.home-view { width: 100%; height: 100%; padding: 24px; overflow-y: auto; }
.home-layout { display: flex; gap: 24px; margin-top: 20px; }
.home-left { flex: 0 0 200px; }
.home-right { flex: 1; min-width: 0; }
.action-buttons-square { display: flex; flex-direction: column; gap: 12px; }
.action-button-square { padding: 16px; border: 1px solid var(--app-border); background: var(--app-bg-elevated); color: var(--app-text-regular); cursor: pointer; }
.history-files { background-color: var(--app-bg-elevated); border: 1px solid var(--app-border); border-radius: 8px; padding: 16px; min-height: 240px; }
.history-item { padding: 8px; border-radius: 4px; cursor: pointer; }
.history-item:hover { background-color: var(--app-bg-hover); }
.history-item-name { color: var(--app-text-primary); font-size: 14px; }
.history-item-path { color: var(--app-text-muted); font-size: 12px; }
.tab-content-placeholder, .no-tabs-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--app-text-faint); }
</style>
