<template>
  <div class="main-tab-panel" ref="mainTabPanelRootRef" tabindex="0" @mousedown="focusMainTabPanelRoot">
    <div v-if="!isSingleTabWindow" ref="mainTabBarRef" class="main-tab-bar">
      <div
        class="main-tab-item"
        :class="{
          active: activeTabId === tab.id,
          dragging: draggingTabId === tab.id,
          'drag-over-before': dragOverTabId === tab.id && dragInsertPosition === 'before',
          'drag-over-after': dragOverTabId === tab.id && dragInsertPosition === 'after'
        }"
        v-for="tab in visibleTabs"
        :key="tab.id"
        @click="switchTab(tab.id)"
        draggable="true"
        @dragstart="handleTabDragStart(tab.id)"
        @dragover.prevent="handleTabDragOver(tab.id, $event)"
        @drop.prevent="handleTabDrop(tab.id)"
        @dragend="handleTabDragEnd($event)"
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
      <div v-if="collapsedTabs.length > 0" class="main-tab-overflow-wrap" :class="{ open: overflowMenuVisible }">
        <button
          class="main-tab-overflow-btn"
          type="button"
          :title="overflowButtonLabel"
          @click.stop="toggleOverflowMenu"
        >
          <span class="main-tab-overflow-btn-text">{{ overflowButtonLabel }}</span>
          <span class="main-tab-overflow-btn-caret">▼</span>
        </button>
        <div
          v-if="overflowMenuVisible"
          class="main-tab-overflow-menu"
          @click.stop
        >
          <button
            v-for="tab in tabs"
            :key="`overflow-${tab.id}`"
            class="main-tab-overflow-item"
            :class="{ active: activeTabId === tab.id }"
            type="button"
            @click="switchToCollapsedTab(tab.id)"
          >
            <el-icon class="main-tab-overflow-item-icon"><Document /></el-icon>
            <span class="main-tab-overflow-item-title">{{ tab.id === 'home' ? t('tabs.homeTab') : tab.title }}</span>
          </button>
        </div>
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
      <KeepAlive v-else-if="isActiveLdfTab">
        <LdfEditorView
          :key="activeTabId"
          :model-value="activeLdfText"
          @update:model-value="handleLdfTextChange"
        />
      </KeepAlive>
      <div v-else-if="activeTabId === 'explorer'" class="single-explorer-view">
        <div
          v-if="isSingleTabWindow"
          class="single-explorer-title"
          @mousedown="handleSingleExplorerTitleMouseDown"
          @contextmenu.prevent.stop
        >
          {{ t('layout.explorer.title') }}
        </div>
        <ProjectExplorer />
      </div>
      <AppSettingsView v-else-if="activeTabId === 'app-settings'" />
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
      <button class="tab-context-item" @click="handleSaveFromContextMenu">{{ t('tabs.tabActions.save') }}</button>
      <button class="tab-context-item" @click="handleCloseFromContextMenu">{{ t('common.close') }}</button>
      <button class="tab-context-item" @click="handleCloseOthersFromContextMenu">{{ t('tabs.tabActions.closeOthers') }}</button>
      <button class="tab-context-item" @click="handleCloseAllFromContextMenu">{{ t('tabs.tabActions.closeAll') }}</button>
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
      <div class="tab-close-confirm-title">{{ t('tabs.tabActions.unsavedFile') }}</div>
      <div class="tab-close-confirm-actions">
        <button class="tab-close-confirm-btn danger" @click="confirmCloseDirtyTab">{{ t('tabs.tabActions.confirmClose') }}</button>
        <button class="tab-close-confirm-btn" @click="cancelCloseDirtyTab">{{ t('common.cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { Close, Document } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { uiActions } from '../../services/uiActions';
import { useUiState } from '../../state/uiState';
import type { HistoryFileItem } from '../../state/uiState';
import { electronBridge } from '../../services/electronBridge';
import LdfEditorView from '../lin-ldf/components/LdfEditorView.vue';
import AppSettingsView from '../settings/components/AppSettingsView.vue';
import ProjectExplorer from '../explorer/ProjectExplorer.vue';

const { state, ensureHomeTab, switchToTab, closeTab: closeStateTab, upsertTab, reorderTabs } = useUiState();
const { t } = useI18n();
const isSingleTabWindow = computed(() => state.windowMode === 'single-tab');
const tabs = computed(() => state.tabs);
const activeTabId = computed(() => state.activeTab);
const historyFiles = computed(() => state.historyFiles);
const isLdfTabId = (tabId: string) => tabId.startsWith('lin-ldf-editor') || tabId === 'free-document';
const isActiveLdfTab = computed(() => isLdfTabId(activeTabId.value));
const activeLdfTab = computed(() => tabs.value.find((item) => item.id === activeTabId.value) ?? null);
const activeLdfText = computed(() => (isActiveLdfTab.value ? activeLdfTab.value?.content || '' : ''));
const mainTabPanelRootRef = ref<HTMLElement | null>(null);
const mainTabBarRef = ref<HTMLElement | null>(null);
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
const overflowMenuVisible = ref(false);
const tabBarWidth = ref(0);
let tabBarResizeObserver: ResizeObserver | null = null;
let singleExplorerDragState: {
  startMouseX: number;
  startMouseY: number;
  startWindowX: number;
  startWindowY: number;
} | null = null;
const OVERFLOW_BUTTON_WIDTH = 112;
const TAB_BAR_SIDE_PADDING = 20;
const TAB_ITEM_GAP = 2;

const visibleTabs = computed(() => {
  const source = tabs.value;
  const barWidth = tabBarWidth.value;
  if (source.length <= 0 || barWidth <= 0) return source;

  const estimateTabWidth = (tab: (typeof source)[number]) => {
    const title = tab.id === 'home' ? t('tabs.homeTab') : tab.title;
    const textLen = Math.max(6, title.length);
    // 图标/留白/关闭按钮等固定占用 + 文本估算
    return Math.min(220, Math.max(96, 62 + textLen * 7));
  };

  const activeIndex = source.findIndex((tab) => tab.id === activeTabId.value);
  const budgetBase = Math.max(120, barWidth - TAB_BAR_SIDE_PADDING);
  const needOverflow = source.length > 1;
  const budget = Math.max(96, budgetBase - (needOverflow ? OVERFLOW_BUTTON_WIDTH : 0));

  let used = 0;
  const picked: typeof source = [];
  for (let i = 0; i < source.length; i += 1) {
    const tab = source[i];
    if (!tab) continue;
    const w = estimateTabWidth(tab) + (picked.length > 0 ? TAB_ITEM_GAP : 0);
    if (picked.length > 0 && used + w > budget) break;
    picked.push(tab);
    used += w;
  }
  if (picked.length >= source.length) return source;

  if (activeIndex >= 0 && !picked.some((tab) => tab.id === source[activeIndex]?.id)) {
    const forced = source[activeIndex];
    if (forced) {
      const next = [...picked];
      while (next.length > 0 && used + estimateTabWidth(forced) > budget) {
        const removed = next.pop();
        if (!removed) break;
        used -= estimateTabWidth(removed) + (next.length > 0 ? TAB_ITEM_GAP : 0);
      }
      if (next.length === 0) return [forced];
      next.push(forced);
      return next;
    }
  }
  return picked;
});

const collapsedTabs = computed(() => {
  const visibleIds = new Set(visibleTabs.value.map((tab) => tab.id));
  return tabs.value.filter((tab) => !visibleIds.has(tab.id));
});
const overflowButtonLabel = computed(() => {
  const total = tabs.value.length;
  const current = tabs.value.find((tab) => tab.id === activeTabId.value);
  const title = current ? (current.id === 'home' ? t('tabs.homeTab') : current.title) : t('tabs.homeTab');
  return `(${total}) ${title}`;
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
const isDropOutsideWindow = (event: DragEvent) => {
  const { screenX, screenY } = event;
  const winLeft = window.screenX;
  const winTop = window.screenY;
  const winRight = winLeft + window.outerWidth;
  const winBottom = winTop + window.outerHeight;
  return screenX < winLeft || screenX > winRight || screenY < winTop || screenY > winBottom;
};

const handleTabDragEnd = async (event: DragEvent) => {
  const draggedTabId = draggingTabId.value;
  draggingTabId.value = null;
  dragOverTabId.value = null;
  dragInsertPosition.value = 'before';
  previewAnchor.value = null;
  if (!draggedTabId || draggedTabId === 'home') return;
  if (!isDropOutsideWindow(event)) return;
  const tab = tabs.value.find((item) => item.id === draggedTabId);
  if (!tab) return;
  const result = await window.electron?.ipcRenderer?.invoke?.('window:open-new', {
    windowMode: 'single-tab',
    theme: state.theme,
    initialTab: {
      id: tab.id,
      title: tab.title,
      content: tab.content,
      dirty: Boolean(tab.dirty)
    }
  });
  if (result?.success) {
    closeStateTab(draggedTabId);
  }
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

const focusMainTabPanelRoot = () => {
  mainTabPanelRootRef.value?.focus({ preventScroll: true });
};

const recalcVisibleTabCount = () => {
  const bar = mainTabBarRef.value;
  if (!bar) return;
  tabBarWidth.value = Math.max(0, bar.clientWidth);
};

const isMainTabPanelFocused = (eventTarget: EventTarget | null) => {
  const root = mainTabPanelRootRef.value;
  if (!root) return false;
  const active = document.activeElement;
  if (active && root.contains(active)) return true;
  return eventTarget instanceof Node ? root.contains(eventTarget) : false;
};

const handleCtrlTabSwitch = (event: KeyboardEvent) => {
  if (event.defaultPrevented) return;
  if (!event.ctrlKey || event.key !== 'Tab') return;
  if (!isMainTabPanelFocused(event.target)) return;
  if (tabs.value.length <= 0) return;
  event.preventDefault();
  const currentIndex = tabs.value.findIndex((tab) => tab.id === activeTabId.value);
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
  const delta = event.shiftKey ? -1 : 1;
  const total = tabs.value.length;
  const nextIndex = (normalizedIndex + delta + total) % total;
  const nextTab = tabs.value[nextIndex];
  if (!nextTab) return;
  switchToTab(nextTab.id);
};

const toggleOverflowMenu = () => {
  overflowMenuVisible.value = !overflowMenuVisible.value;
};

const switchToCollapsedTab = (tabId: string) => {
  switchToTab(tabId);
  overflowMenuVisible.value = false;
};

onMounted(() => {
  if (state.showHomeOnLaunch) {
    loadHomeTab();
    return;
  }
  closeStateTab('home');
});
onMounted(() => {
  recalcVisibleTabCount();
  if (mainTabBarRef.value) {
    tabBarResizeObserver = new ResizeObserver(() => recalcVisibleTabCount());
    tabBarResizeObserver.observe(mainTabBarRef.value);
  }
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('keydown', handleCtrlTabSwitch);
});
onUnmounted(() => {
  handleSingleExplorerTitleMouseUp();
  tabBarResizeObserver?.disconnect();
  tabBarResizeObserver = null;
  document.removeEventListener('click', handleGlobalClick);
  document.removeEventListener('keydown', handleCtrlTabSwitch);
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
  overflowMenuVisible.value = false;
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

const handleLdfTextChange = (value: string) => {
  if (!isActiveLdfTab.value || !activeLdfTab.value) return;
  upsertTab({
    id: activeLdfTab.value.id,
    title: activeLdfTab.value.title,
    content: value,
    dirty: true
  });
};

const handleSingleExplorerTitleMouseDown = (event: MouseEvent) => {
  if (!isSingleTabWindow.value) return;
  if (event.button !== 0) return;
  event.preventDefault();
  void window.electron?.ipcRenderer?.invoke?.('window:get-current-bounds').then((bounds: any) => {
    if (!bounds) return;
    singleExplorerDragState = {
      startMouseX: event.screenX,
      startMouseY: event.screenY,
      startWindowX: bounds.x,
      startWindowY: bounds.y
    };
    document.addEventListener('mousemove', handleSingleExplorerTitleMouseMove);
    document.addEventListener('mouseup', handleSingleExplorerTitleMouseUp);
  });
};

const handleSingleExplorerTitleMouseMove = (event: MouseEvent) => {
  if (!singleExplorerDragState) return;
  const deltaX = event.screenX - singleExplorerDragState.startMouseX;
  const deltaY = event.screenY - singleExplorerDragState.startMouseY;
  const nextX = singleExplorerDragState.startWindowX + deltaX;
  const nextY = singleExplorerDragState.startWindowY + deltaY;
  void window.electron?.ipcRenderer?.invoke?.('window:set-current-position', nextX, nextY);
};

const handleSingleExplorerTitleMouseUp = () => {
  if (isSingleTabWindow.value) {
    void window.electron?.ipcRenderer?.invoke?.('window:dock-explorer-on-release');
  }
  singleExplorerDragState = null;
  document.removeEventListener('mousemove', handleSingleExplorerTitleMouseMove);
  document.removeEventListener('mouseup', handleSingleExplorerTitleMouseUp);
};

watch(
  () => tabs.value.length,
  () => {
    recalcVisibleTabCount();
    if (collapsedTabs.value.length <= 0) {
      overflowMenuVisible.value = false;
    }
  }
);

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
  height: var(--app-tabbar-height);
  position: relative;
  overflow: visible;
  z-index: 40;
}
.main-tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: var(--app-ui-control-height);
  border: none;
  border-radius: 3px;
  background-color: transparent;
  color: var(--app-text-regular);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  font-size: var(--app-ui-font-size);
  font-weight: 500;
  position: relative;
  flex: 0 0 auto;
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
  font-size: var(--app-ui-font-size);
  line-height: 1;
}
.main-tab-file-icon {
  font-size: var(--app-icon-size);
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
.main-tab-overflow-wrap {
  margin-left: auto;
  margin-right: 8px;
  position: relative;
  flex: 0 0 auto;
}
.main-tab-overflow-btn {
  height: var(--app-ui-control-height);
  min-width: 160px;
  max-width: 260px;
  padding: 0 8px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--app-bg-elevated) 84%, #ffffff 16%);
  color: var(--app-text-primary);
  font-size: var(--app-ui-font-size);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.main-tab-overflow-btn:hover {
  background: color-mix(in srgb, var(--app-bg-hover) 86%, #ffffff 14%);
  color: var(--app-text-primary);
}
.main-tab-overflow-btn-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.main-tab-overflow-btn-caret {
  font-size: 10px;
  opacity: 0.85;
  transition: transform 0.16s ease;
}
.main-tab-overflow-wrap.open .main-tab-overflow-btn-caret {
  transform: rotate(180deg);
}
.main-tab-overflow-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 9999;
  min-width: 230px;
  max-height: 320px;
  overflow: auto;
  padding: 6px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background-color: var(--app-bg-elevated);
  box-shadow:
    0 14px 30px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px color-mix(in srgb, var(--app-border) 55%, transparent);
  scrollbar-width: thin;
  scrollbar-color: var(--app-scrollbar-thumb) var(--app-scrollbar-track);
}
.main-tab-overflow-menu::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.main-tab-overflow-menu::-webkit-scrollbar-track {
  background-color: var(--app-scrollbar-track);
}
.main-tab-overflow-menu::-webkit-scrollbar-thumb {
  background-color: var(--app-scrollbar-thumb);
  border-radius: 999px;
  border: 2px solid var(--app-scrollbar-track);
}
.main-tab-overflow-menu::-webkit-scrollbar-thumb:hover {
  background-color: var(--app-scrollbar-thumb-hover);
}
.main-tab-overflow-menu::-webkit-scrollbar-thumb:active {
  background-color: var(--app-scrollbar-thumb-active);
}
.main-tab-overflow-item {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--app-text-regular);
  text-align: left;
  font-size: var(--app-ui-font-size);
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.main-tab-overflow-item-icon {
  color: var(--app-text-muted);
  font-size: var(--app-icon-size);
  flex: 0 0 auto;
}
.main-tab-overflow-item-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.main-tab-overflow-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
.main-tab-overflow-item.active {
  background-color: color-mix(in srgb, var(--app-accent) 18%, transparent);
  color: var(--app-text-primary);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 35%, transparent);
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
.single-explorer-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.single-explorer-title {
  height: var(--app-tabbar-height);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  color: var(--app-text-primary);
  font-size: var(--app-ui-font-size);
  font-weight: 600;
  flex: 0 0 auto;
  user-select: none;
  cursor: move;
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
