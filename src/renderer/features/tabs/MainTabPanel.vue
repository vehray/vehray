<template>
  <div class="main-tab-panel">
    <div class="main-tab-bar">
      <div
        class="main-tab-item"
        :class="{
          active: activeTabId === tab.id,
          dragging: draggingTabId === tab.id,
          'drag-over-before': dragOverTabId === tab.id && dragInsertPosition === 'before',
          'drag-over-after': dragOverTabId === tab.id && dragInsertPosition === 'after'
        }"
        v-for="tab in tabs"
        :key="tab.id"
        @click="switchTab(tab.id)"
        draggable="true"
        @dragstart="handleTabDragStart(tab.id)"
        @dragover.prevent="handleTabDragOver(tab.id, $event)"
        @drop.prevent="handleTabDrop(tab.id)"
        @dragend="handleTabDragEnd"
        @contextmenu.prevent.stop="openTabContextMenu(tab.id, $event)"
        @mouseenter="hoveringTabId = tab.id"
        @mouseleave="hoveringTabId = null"
      >
        <el-icon v-if="isLdfTabId(tab.id)" class="main-tab-file-icon"><Document /></el-icon>
        <span class="main-tab-title">{{ tab.id === 'home' ? t('tabs.homeTab') : tab.title }}</span>
        <span class="main-tab-status-slot">
          <span v-if="shouldShowDirtyDot(tab.id)" class="main-tab-dirty-dot" aria-hidden="true"></span>
          <button v-if="shouldShowCloseButton(tab.id)" class="main-tab-close" @click.stop="requestCloseTab(tab.id, $event)">
            <el-icon><Close /></el-icon>
          </button>
        </span>
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
      <div v-else-if="isActiveLdfTab" class="lin-ldf-editor-view">
        <div class="editor-content">
          <textarea
            class="ldf-textarea"
            :value="activeLdfText"
            @input="handleLdfInput"
          ></textarea>
        </div>
      </div>
      <div v-else-if="tabs.length > 0" class="tab-content-placeholder">
        {{ t('tabs.tabContentPlaceholder', { title: getActiveTab()?.title ?? '' }) }}
      </div>
      <div v-else class="no-tabs-content"><p>{{ t('tabs.noTabsHint') }}</p></div>
    </div>
    <div
      v-if="tabContextMenu.visible"
      class="tab-context-menu"
      :style="{ left: `${tabContextMenu.x}px`, top: `${tabContextMenu.y}px` }"
      @click.stop
    >
      <button class="tab-context-item" @click="handleSaveFromContextMenu">保存</button>
      <button class="tab-context-item" @click="handleCloseFromContextMenu">{{ t('common.close') }}</button>
      <button class="tab-context-item" @click="handleCloseOthersFromContextMenu">关闭其他</button>
      <button class="tab-context-item" @click="handleCloseAllFromContextMenu">关闭全部</button>
      <div v-if="contextMenuFilePath" class="tab-context-divider"></div>
      <button v-if="contextMenuFilePath" class="tab-context-item" @click="handleRevealTabInFolder">
        {{ t('layout.explorer.openContainingFolder') }}
      </button>
    </div>
    <div
      v-if="closeConfirmPopup.visible"
      class="tab-close-confirm"
      :style="{ left: `${closeConfirmPopup.x}px`, top: `${closeConfirmPopup.y}px` }"
      @click.stop
    >
      <div class="tab-close-confirm-title">该文件尚未保存</div>
      <div class="tab-close-confirm-actions">
        <button class="tab-close-confirm-btn danger" @click="confirmCloseDirtyTab">确认关闭</button>
        <button class="tab-close-confirm-btn" @click="cancelCloseDirtyTab">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { Close, Document } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { uiActions } from '../../services/uiActions';
import { useUiState } from '../../state/uiState';
import type { HistoryFileItem } from '../../state/uiState';
import { electronBridge } from '../../services/electronBridge';

const { state, ensureHomeTab, switchToTab, closeTab: closeStateTab, upsertTab, reorderTabs } = useUiState();
const { t } = useI18n();
const tabs = computed(() => state.tabs);
const activeTabId = computed(() => state.activeTab);
const historyFiles = computed(() => state.historyFiles);
const isLdfTabId = (tabId: string) => tabId.startsWith('lin-ldf-editor') || tabId === 'free-document';
const isActiveLdfTab = computed(() => isLdfTabId(activeTabId.value));
const activeLdfTab = computed(() => tabs.value.find((item) => item.id === activeTabId.value) ?? null);
const activeLdfText = computed(() => (isActiveLdfTab.value ? activeLdfTab.value?.content || '' : ''));
const draggingTabId = ref<string | null>(null);
const dragOverTabId = ref<string | null>(null);
const dragInsertPosition = ref<'before' | 'after'>('before');
const previewAnchor = ref<{ tabId: string; position: 'before' | 'after' } | null>(null);
const hoveringTabId = ref<string | null>(null);
const tabContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  tabId: ''
});
const closeConfirmPopup = reactive({
  visible: false,
  x: 0,
  y: 0,
  tabId: ''
});

const switchTab = (id: string) => switchToTab(id);
const handleTabDragStart = (tabId: string) => {
  draggingTabId.value = tabId;
  previewAnchor.value = null;
};
const handleTabDragOver = (tabId: string, event: DragEvent) => {
  if (!draggingTabId.value || draggingTabId.value === tabId) return;
  const target = event.currentTarget as HTMLElement | null;
  let position: 'before' | 'after' = 'before';
  if (target) {
    const rect = target.getBoundingClientRect();
    position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
  }
  dragInsertPosition.value = position;
  dragOverTabId.value = tabId;
  if (previewAnchor.value && previewAnchor.value.tabId === tabId && previewAnchor.value.position === position) return;
  reorderTabs(draggingTabId.value, tabId, position);
  previewAnchor.value = { tabId, position };
};
const handleTabDrop = (tabId: string) => {
  if (!draggingTabId.value) return;
  draggingTabId.value = null;
  dragOverTabId.value = null;
  dragInsertPosition.value = 'before';
  previewAnchor.value = null;
};
const handleTabDragEnd = () => {
  draggingTabId.value = null;
  dragOverTabId.value = null;
  dragInsertPosition.value = 'before';
  previewAnchor.value = null;
};
const loadHomeTab = () => {
  ensureHomeTab();
  switchToTab('home');
};
const getActiveTab = () => tabs.value.find(tab => tab.id === activeTabId.value);
const isTabDirty = (tabId: string) => Boolean(tabs.value.find((tab) => tab.id === tabId)?.dirty);
const shouldShowCloseButton = (tabId: string) => !isTabDirty(tabId) || hoveringTabId.value === tabId;
const shouldShowDirtyDot = (tabId: string) => isTabDirty(tabId) && hoveringTabId.value !== tabId;
const contextMenuTab = computed(() => tabs.value.find((tab) => tab.id === tabContextMenu.tabId) ?? null);
const contextMenuFilePath = computed(() => {
  const id = contextMenuTab.value?.id ?? '';
  if (!id.startsWith('lin-ldf-editor-file:')) return null;
  try {
    return decodeURIComponent(id.slice('lin-ldf-editor-file:'.length));
  } catch {
    return null;
  }
});

onMounted(() => loadHomeTab());
onMounted(() => {
  document.addEventListener('click', handleGlobalClick);
});
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick);
});

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
  void uiActions.openFileToHistory(file.path);
};

const openTabContextMenu = (tabId: string, event: MouseEvent) => {
  tabContextMenu.tabId = tabId;
  tabContextMenu.x = event.clientX;
  tabContextMenu.y = event.clientY;
  tabContextMenu.visible = true;
};

const closeTabContextMenu = () => {
  tabContextMenu.visible = false;
};

const openCloseConfirmPopup = (tabId: string, x: number, y: number) => {
  closeConfirmPopup.tabId = tabId;
  closeConfirmPopup.x = x + 12;
  closeConfirmPopup.y = y + 16;
  closeConfirmPopup.visible = true;
};

const cancelCloseDirtyTab = () => {
  closeConfirmPopup.visible = false;
  closeConfirmPopup.tabId = '';
};

const confirmCloseDirtyTab = () => {
  if (!closeConfirmPopup.tabId) return;
  closeStateTab(closeConfirmPopup.tabId);
  cancelCloseDirtyTab();
};

const handleGlobalClick = () => {
  closeTabContextMenu();
  cancelCloseDirtyTab();
};

const requestCloseTab = (tabId: string, event?: MouseEvent) => {
  const tab = tabs.value.find((item) => item.id === tabId);
  if (!tab) return;
  if (!tab.dirty) {
    closeStateTab(tabId);
    return;
  }
  const pointerX = event?.clientX ?? tabContextMenu.x;
  const pointerY = event?.clientY ?? tabContextMenu.y;
  openCloseConfirmPopup(tabId, pointerX, pointerY);
};

const handleCloseFromContextMenu = () => {
  if (!tabContextMenu.tabId) return;
  requestCloseTab(tabContextMenu.tabId);
  closeTabContextMenu();
};

const handleSaveFromContextMenu = async () => {
  if (!tabContextMenu.tabId) return;
  await uiActions.saveTabById(tabContextMenu.tabId);
  closeTabContextMenu();
};

const handleCloseOthersFromContextMenu = () => {
  const currentId = tabContextMenu.tabId;
  if (!currentId) return;
  const targetTabs = tabs.value.filter((tab) => tab.id !== currentId && tab.id !== 'home');
  for (const tab of targetTabs) {
    if (tab.dirty) {
      requestCloseTab(tab.id);
      break;
    }
    closeStateTab(tab.id);
  }
  switchToTab(currentId);
  closeTabContextMenu();
};

const handleCloseAllFromContextMenu = () => {
  const targetTabs = tabs.value.filter((tab) => tab.id !== 'home');
  for (const tab of targetTabs) {
    if (tab.dirty) {
      requestCloseTab(tab.id);
      break;
    }
    closeStateTab(tab.id);
  }
  switchToTab('home');
  closeTabContextMenu();
};

const handleRevealTabInFolder = async () => {
  if (!contextMenuFilePath.value) return;
  await electronBridge.revealInFolder(contextMenuFilePath.value);
  closeTabContextMenu();
};

const handleLdfInput = (event: Event) => {
  if (!isActiveLdfTab.value || !activeLdfTab.value) return;
  const target = event.target as HTMLTextAreaElement;
  upsertTab({
    id: activeLdfTab.value.id,
    title: activeLdfTab.value.title,
    content: target.value,
    dirty: true
  });
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
  position: relative;
}
.main-tab-item::before,
.main-tab-item::after {
  content: '';
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: 2px;
  background-color: var(--app-accent);
  border-radius: 2px;
  opacity: 0;
  transform: scaleY(0.5);
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.main-tab-item::before {
  left: -1px;
}
.main-tab-item::after {
  right: -1px;
}
.main-tab-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
.main-tab-item.active {
  background-color: var(--app-bg-hover);
  box-shadow: inset 0 0 0 1px var(--app-border);
  color: var(--app-text-primary);
}
.main-tab-item.dragging {
  opacity: 0.55;
}
.main-tab-item.drag-over-before::before {
  opacity: 1;
  transform: scaleY(1);
}
.main-tab-item.drag-over-after::after {
  opacity: 1;
  transform: scaleY(1);
}
.main-tab-item.drag-over-before,
.main-tab-item.drag-over-after {
  background-color: color-mix(in srgb, var(--app-accent) 12%, transparent);
}
.main-tab-title {
  font-size: 12px;
  line-height: 1;
}
.main-tab-file-icon {
  font-size: 13px;
  color: var(--app-text-muted);
}
.main-tab-status-slot {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
.main-tab-dirty-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background-color: #ef4444;
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
.lin-ldf-editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}
.editor-content {
  flex: 1;
  min-height: 0;
}
.ldf-textarea {
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  border-radius: 0;
  background-color: transparent;
  color: var(--app-text-regular);
  padding: 0;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  outline: none;
}

.tab-context-menu {
  position: fixed;
  z-index: 2600;
  min-width: 156px;
  padding: 4px;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.tab-context-item {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--app-text-regular);
  text-align: left;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.tab-context-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.tab-context-divider {
  height: 1px;
  background-color: var(--app-border);
  margin: 4px 0;
}

.tab-close-confirm {
  position: fixed;
  z-index: 2700;
  min-width: 154px;
  padding: 6px;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.tab-close-confirm-title {
  font-size: 12px;
  color: var(--app-text-regular);
  margin-bottom: 8px;
}

.tab-close-confirm-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.tab-close-confirm-btn {
  border: 1px solid var(--app-border);
  background: transparent;
  color: var(--app-text-regular);
  font-size: 12px;
  padding: 4px 9px;
  border-radius: 4px;
  cursor: pointer;
}

.tab-close-confirm-btn:hover {
  background-color: var(--app-bg-hover);
}

.tab-close-confirm-btn.danger {
  border-color: #dc2626;
  color: #f87171;
  font-size: 11px;
  padding: 3px 7px;
}
</style>
