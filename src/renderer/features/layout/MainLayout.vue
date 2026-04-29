<template>
  <div class="layout-wrapper">
    <Sidebar v-if="!isSingleTabWindow" @button-click="handleSidebarClick" />
    <div class="content-wrapper" ref="contentWrapper">
      <div
        v-if="!isSingleTabWindow && showLeftActivity && !leftActivityPinned"
        class="left-activity"
        :class="{ 'close-armed-panel': isLeftCloseArmed || isLeftMaxArmed, 'close-armed-side': isLeftCloseArmed }"
        :style="{ width: leftActivityWidth + 'px' }"
      >
        <div
          class="activity-header"
          draggable="true"
          @dragstart="handleExplorerHeaderDragStart"
          @dragend="handleExplorerHeaderDragEnd"
          @contextmenu.prevent.stop="openLeftActivityContextMenu"
        >
          <div class="activity-title">{{ t('layout.explorer.title') }}</div>
          <div class="activity-header-actions">
            <el-tooltip :content="t('common.close')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
              <button class="activity-close-btn" @click="closeLeftActivityPanel">
                <el-icon :size="14"><Close /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </div>
        <ProjectExplorer />
        <div class="activity-right-border"></div>
      </div>
      <div
        v-if="!isSingleTabWindow && !showLeftActivity && explorerDockPreviewVisible"
        class="left-activity dock-preview-panel"
        :style="{ width: leftActivityWidth + 'px' }"
        @mouseup.left="handleExplorerDockPreviewCommit"
      >
        <div class="activity-header">
          <div class="activity-title">{{ t('layout.explorer.title') }}</div>
        </div>
        <div class="dock-preview-body">在此区域松开左键后还原资源管理器</div>
        <div class="activity-right-border"></div>
      </div>
      <div
        v-if="!isSingleTabWindow && showLeftActivity && leftActivityPinned"
        class="left-floating-panel"
        :class="{ closing: floatingClosing }"
        :style="{ width: `${leftFloatWidth}px`, '--floating-close-ms': `${floatingCloseAnimationMs}ms` }"
        @mousedown="refreshFloatingAutoClose"
        @mousemove="refreshFloatingAutoClose"
        @wheel.passive="refreshFloatingAutoClose"
        @mouseenter="refreshFloatingAutoClose"
      >
        <div
          class="activity-header floating-header"
          draggable="true"
          @dragstart="handleExplorerHeaderDragStart"
          @dragend="handleExplorerHeaderDragEnd"
          @contextmenu.prevent.stop="openLeftActivityContextMenu"
        >
          <div class="activity-title">{{ t('layout.explorer.title') }}</div>
          <div class="activity-header-actions">
            <el-tooltip :content="t('common.close')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
              <button class="activity-close-btn" @click="closeLeftActivityPanel">
                <el-icon :size="14"><Close /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </div>
        <ProjectExplorer />
        <div class="floating-resize-handle" @mousedown.stop.prevent="startLeftFloatResize"></div>
      </div>
      <div
        v-if="!isSingleTabWindow && leftActivityMenuVisible"
        class="activity-context-menu"
        :style="{ left: `${leftActivityMenuX}px`, top: `${leftActivityMenuY}px` }"
        @click.stop
      >
        <button class="activity-context-item" @click="handleToggleLeftFloatingFromMenu">
          {{ leftActivityPinned ? '还原停靠' : '浮动' }}
        </button>
        <button class="activity-context-item" @click="handleOpenLeftPanelInNewWindow">在新窗口打开</button>
        <button class="activity-context-item" @click="handleCloseLeftPanelFromMenu">关闭活动栏</button>
      </div>
      <div
        v-if="!isSingleTabWindow && showLeftActivity && !leftActivityPinned"
        class="splitter left-splitter"
        :class="{
          active: isLeftSplitterActive,
          'close-armed-splitter': isLeftCloseArmed,
          'max-armed-splitter': isLeftMaxArmed
        }"
        @mousedown="startLeftDrag"
        @mouseenter="isLeftSplitterActive = true"
        @mouseleave="isLeftSplitterActive = false"
      />
      <div class="main-area" ref="mainArea">
        <div class="main-content" :style="isSingleTabWindow ? { height: '100%' } : { height: mainContentHeight + 'px' }">
          <MainTabPanel ref="mainTabPanelRef" />
        </div>
        <div
          v-if="!isSingleTabWindow"
          class="splitter vertical-splitter"
          :class="{
            active: isVerticalSplitterActive,
            'close-armed-splitter': isVerticalCloseArmed
          }"
          @mousedown="startVerticalDrag"
          @mouseenter="isVerticalSplitterActive = true"
          @mouseleave="isVerticalSplitterActive = false"
        />
        <div
          v-if="!isSingleTabWindow"
          class="tab-panel-container"
          :class="{ 'close-armed-panel': isVerticalLimitArmed, 'close-armed-bottom': isVerticalCloseArmed }"
          :style="{ height: tabPanelHeight + 'px' }"
        >
          <TabPanel />
        </div>
      </div>
      <div
        v-if="!isSingleTabWindow && showRightActivity"
        class="splitter right-splitter"
        :class="{
          active: isRightSplitterActive,
          'close-armed-splitter': isRightCloseArmed,
          'max-armed-splitter': isRightMaxArmed
        }"
        @mousedown="startRightDrag"
        @mouseenter="isRightSplitterActive = true"
        @mouseleave="isRightSplitterActive = false"
      />
      <div
        v-if="!isSingleTabWindow && showRightActivity"
        class="right-activity"
        :class="{ 'close-armed-panel': isRightCloseArmed || isRightMaxArmed, 'close-armed-side': isRightCloseArmed }"
      >
        <ActivityBar
          :title="t('layout.sidebar.properties')"
          :items="rightActivityItems"
          :custom-width="rightActivityWidth"
          position="right"
          @close="closeRightActivity"
          @toggle-float="handleRightActivityToggleFloat"
        >
          <template #content>
            <PropertyTestPanel />
          </template>
        </ActivityBar>
      </div>
    </div>
    <RightSidebar v-if="!isSingleTabWindow" @toggle-activity="uiActions.toggleRightPanel" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Operation, Close, Folder, Document } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import Sidebar from './Sidebar.vue';
import RightSidebar from './RightSidebar.vue';
import ActivityBar from './ActivityBar.vue';
import PropertyTestPanel from './PropertyTestPanel.vue';
import MainTabPanel from '../tabs/MainTabPanel.vue';
import TabPanel from '../tabs/TabPanel.vue';
import ProjectExplorer from '../explorer/ProjectExplorer.vue';
import { useLayoutPanels } from './composables/useLayoutPanels';
import { usePanelLayout } from './composables/usePanelLayout';
import { uiActions } from '../../services/uiActions';
import { useUiState } from '../../state/uiState';
import { shortcutService } from '../../services/shortcutService';

const mainTabPanelRef = ref<any>(null);
const contentWrapper = ref<HTMLElement | null>(null);
const mainArea = ref<HTMLElement | null>(null);
const leftActivityPinned = ref(false);
const leftFloatWidth = ref(320);
let leftFloatResizeState: { startX: number; startWidth: number } | null = null;
const explorerHeaderDragStartPoint = ref<{ x: number; y: number } | null>(null);
let floatingAutoCloseTimer: ReturnType<typeof setTimeout> | null = null;
const floatingClosing = ref(false);
const leftActivityMenuVisible = ref(false);
const leftActivityMenuX = ref(0);
const leftActivityMenuY = ref(0);
const { t } = useI18n();
const { state } = useUiState();
const isSingleTabWindow = computed(() => state.windowMode === 'single-tab');

const { currentView, showLeftActivity, showRightActivity, toggleLeftActivity, openLeftActivity, closeLeftActivity, closeRightActivity } =
  useLayoutPanels();

const {
  leftActivityWidth,
  rightActivityWidth,
  mainContentHeight,
  tabPanelHeight,
  isLeftSplitterActive,
  isRightSplitterActive,
  isVerticalSplitterActive,
  isVerticalLimitArmed,
  isVerticalCloseArmed,
  isLeftMaxArmed,
  isRightMaxArmed,
  isVerticalMaxArmed,
  isLeftCloseArmed,
  isRightCloseArmed,
  startLeftDrag,
  startRightDrag,
  startVerticalDrag,
  toggleBottomPanel
} = usePanelLayout({ contentWrapper, mainArea, showLeftActivity, showRightActivity });

const handleSidebarClick = (view: string) => {
  currentView.value = view;
  if (view === 'home' && mainTabPanelRef.value) mainTabPanelRef.value.loadHomeTab();
  if (view === 'file') {
    if (explorerDetachedVisible.value) {
      void handleFocusDetachedExplorer();
      return;
    }
    if (!showLeftActivity.value) {
      // 重新打开时保留上次的浮动/停靠状态
      showLeftActivity.value = true;
      return;
    }
    toggleLeftActivity();
  }
};

const toggleLeftPinned = () => {
  leftActivityPinned.value = !leftActivityPinned.value;
  if (leftActivityPinned.value) {
    leftFloatWidth.value = Math.max(260, leftActivityWidth.value);
    return;
  }
  leftActivityWidth.value = Math.max(220, Math.min(560, leftFloatWidth.value));
  clearFloatingAutoCloseTimer();
};

const closeLeftActivityPanel = () => {
  if (leftActivityPinned.value && showLeftActivity.value && !floatingClosing.value) {
    floatingClosing.value = true;
    const duration = floatingCloseAnimationMs.value;
    setTimeout(() => {
      floatingClosing.value = false;
      leftActivityMenuVisible.value = false;
      closeLeftActivity();
    }, duration);
    return;
  }
  leftActivityMenuVisible.value = false;
  closeLeftActivity();
};

const floatingCloseAnimationMs = computed(() => {
  if (state.floatingCloseAnimationSpeed === 'fast') return 140;
  if (state.floatingCloseAnimationSpeed === 'slow') return 340;
  return 220;
});

const clearFloatingAutoCloseTimer = () => {
  if (!floatingAutoCloseTimer) return;
  clearTimeout(floatingAutoCloseTimer);
  floatingAutoCloseTimer = null;
};

const refreshFloatingAutoClose = () => {
  clearFloatingAutoCloseTimer();
};

const handleDocumentPointerDownForFloatingAutoClose = (event: MouseEvent) => {
  if (!state.autoCloseFloatingOnIdle) return;
  if (!leftActivityPinned.value || !showLeftActivity.value || floatingClosing.value) return;
  if (leftFloatResizeState) return;
  const target = event.target as HTMLElement | null;
  if (!target) return;
  // 点击浮动面板内部不关闭；点击其他区域立即关闭
  if (target.closest('.left-floating-panel')) return;
  closeLeftActivityPanel();
};

const stopLeftFloatResize = () => {
  leftFloatResizeState = null;
  document.removeEventListener('mousemove', onLeftFloatResize);
  document.removeEventListener('mouseup', stopLeftFloatResize);
};

const onLeftFloatResize = (event: MouseEvent) => {
  if (!leftFloatResizeState || !contentWrapper.value) return;
  const wrapperRect = contentWrapper.value.getBoundingClientRect();
  const delta = event.clientX - leftFloatResizeState.startX;
  const minWidth = 260;
  const maxWidth = Math.max(minWidth, wrapperRect.width - 8);
  leftFloatWidth.value = Math.min(maxWidth, Math.max(minWidth, leftFloatResizeState.startWidth + delta));
};

const startLeftFloatResize = (event: MouseEvent) => {
  if (!leftActivityPinned.value) return;
  leftFloatResizeState = {
    startX: event.clientX,
    startWidth: leftFloatWidth.value
  };
  document.addEventListener('mousemove', onLeftFloatResize);
  document.addEventListener('mouseup', stopLeftFloatResize);
};

const openLeftActivityContextMenu = (event: MouseEvent) => {
  leftActivityMenuVisible.value = true;
  leftActivityMenuX.value = event.clientX;
  leftActivityMenuY.value = event.clientY;
};

const handleToggleLeftFloatingFromMenu = () => {
  toggleLeftPinned();
  leftActivityMenuVisible.value = false;
};

const handleCloseLeftPanelFromMenu = () => {
  closeLeftActivityPanel();
  leftActivityMenuVisible.value = false;
};

const handleOpenLeftPanelInNewWindow = async () => {
  leftActivityMenuVisible.value = false;
  await window.electron?.ipcRenderer?.invoke?.('window:open-new', {
    windowMode: 'single-tab',
    theme: state.theme,
    initialTab: {
      id: 'explorer',
      title: t('layout.explorer.title'),
      content: 'explorer-view',
      dirty: false
    }
  });
};

const handleExplorerDockPreviewCommit = async () => {
  if (!explorerDockPreviewVisible.value) return;
  await window.electron?.ipcRenderer?.invoke?.('window:dock-explorer-commit');
};

const handleFocusDetachedExplorer = async () => {
  await window.electron?.ipcRenderer?.invoke?.('window:focus-detached-explorer');
};

const isDropOutsideWindow = (event: DragEvent) => {
  const { screenX, screenY } = event;
  const winLeft = window.screenX;
  const winTop = window.screenY;
  const winRight = winLeft + window.outerWidth;
  const winBottom = winTop + window.outerHeight;
  return screenX < winLeft || screenX > winRight || screenY < winTop || screenY > winBottom;
};

const handleExplorerHeaderDragStart = (event: DragEvent) => {
  explorerHeaderDragStartPoint.value = { x: event.screenX, y: event.screenY };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'explorer-header');
  }
};

const handleExplorerHeaderDragEnd = async (event: DragEvent) => {
  const start = explorerHeaderDragStartPoint.value;
  explorerHeaderDragStartPoint.value = null;
  if (!start) return;
  const movedDistance = Math.hypot(event.screenX - start.x, event.screenY - start.y);
  if (movedDistance < 24) return;
  if (!isDropOutsideWindow(event)) return;
  await handleOpenLeftPanelInNewWindow();
};

const closeLeftActivityContextMenu = () => {
  leftActivityMenuVisible.value = false;
};

const handleRightActivityToggleFloat = () => {};

const handleToggleExplorerShortcut = () => {
  if (explorerDetachedVisible.value) {
    void handleFocusDetachedExplorer();
    return;
  }
  if (!showLeftActivity.value) {
    showLeftActivity.value = true;
    return;
  }
  toggleLeftActivity();
};

const handleTogglePropertiesShortcut = () => {
  uiActions.toggleRightPanel();
};

const handleToggleBottomPanelShortcut = () => {
  toggleBottomPanel();
};

const handleGoHomeShortcut = () => {
  handleSidebarClick('home');
};

const selectedEntryTypeLabel = computed(() => {
  if (!state.selectedExplorerEntry) return t('properties.unselected');
  return state.selectedExplorerEntry.type === 'directory' ? t('properties.directory') : t('properties.file');
});

const selectedEntryTypeIcon = computed(() => {
  if (!state.selectedExplorerEntry) return Operation;
  return state.selectedExplorerEntry.type === 'directory' ? Folder : Document;
});

const rightActivityItems = computed(() => [{ id: '1', title: selectedEntryTypeLabel.value, icon: selectedEntryTypeIcon.value }]);

let disposeToggleExplorerShortcut: (() => void) | null = null;
let disposeTogglePropertiesShortcut: (() => void) | null = null;
let disposeToggleBottomPanelShortcut: (() => void) | null = null;
let disposeGoHomeShortcut: (() => void) | null = null;
let restoreExplorerListener: ((event: any, ...args: any[]) => void) | null = null;
let closeExplorerListener: ((event: any, ...args: any[]) => void) | null = null;
let explorerDockPreviewListener: ((event: any, ...args: any[]) => void) | null = null;
const explorerDockPreviewVisible = ref(false);
let explorerDetachedStateListener: ((event: any, ...args: any[]) => void) | null = null;
const explorerDetachedVisible = ref(false);

onMounted(() => {
  disposeToggleExplorerShortcut = shortcutService.onAction('toggleExplorer', handleToggleExplorerShortcut);
  disposeTogglePropertiesShortcut = shortcutService.onAction('toggleProperties', handleTogglePropertiesShortcut);
  disposeToggleBottomPanelShortcut = shortcutService.onAction('toggleBottomPanel', handleToggleBottomPanelShortcut);
  disposeGoHomeShortcut = shortcutService.onAction('goHome', handleGoHomeShortcut);
  restoreExplorerListener = window.electron?.ipcRenderer?.on?.('layout:restore-explorer', () => {
    leftActivityPinned.value = false;
    openLeftActivity();
  }) ?? null;
  closeExplorerListener = window.electron?.ipcRenderer?.on?.('layout:close-explorer', () => {
    closeLeftActivityPanel();
    explorerDockPreviewVisible.value = false;
  }) ?? null;
  explorerDockPreviewListener = window.electron?.ipcRenderer?.on?.('layout:explorer-dock-preview', (_event, visible: boolean) => {
    explorerDockPreviewVisible.value = Boolean(visible);
  }) ?? null;
  explorerDetachedStateListener = window.electron?.ipcRenderer?.on?.('layout:explorer-detached-state', (_event, visible: boolean) => {
    explorerDetachedVisible.value = Boolean(visible);
  }) ?? null;
  clearFloatingAutoCloseTimer();
  document.addEventListener('click', closeLeftActivityContextMenu);
  document.addEventListener('mousedown', handleDocumentPointerDownForFloatingAutoClose);
});

onUnmounted(() => {
  clearFloatingAutoCloseTimer();
  stopLeftFloatResize();
  disposeToggleExplorerShortcut?.();
  disposeTogglePropertiesShortcut?.();
  disposeToggleBottomPanelShortcut?.();
  disposeGoHomeShortcut?.();
  disposeToggleExplorerShortcut = null;
  disposeTogglePropertiesShortcut = null;
  disposeToggleBottomPanelShortcut = null;
  disposeGoHomeShortcut = null;
  if (restoreExplorerListener) {
    window.electron?.ipcRenderer?.off?.('layout:restore-explorer', restoreExplorerListener);
    restoreExplorerListener = null;
  }
  if (closeExplorerListener) {
    window.electron?.ipcRenderer?.off?.('layout:close-explorer', closeExplorerListener);
    closeExplorerListener = null;
  }
  if (explorerDockPreviewListener) {
    window.electron?.ipcRenderer?.off?.('layout:explorer-dock-preview', explorerDockPreviewListener);
    explorerDockPreviewListener = null;
  }
  if (explorerDetachedStateListener) {
    window.electron?.ipcRenderer?.off?.('layout:explorer-detached-state', explorerDetachedStateListener);
    explorerDetachedStateListener = null;
  }
  document.removeEventListener('click', closeLeftActivityContextMenu);
  document.removeEventListener('mousedown', handleDocumentPointerDownForFloatingAutoClose);
});

watch(
  () => [state.autoCloseFloatingOnIdle, state.floatingCloseAnimationSpeed, leftActivityPinned.value, showLeftActivity.value] as const,
  () => {
    if (!state.autoCloseFloatingOnIdle || !leftActivityPinned.value || !showLeftActivity.value) {
      clearFloatingAutoCloseTimer();
    }
  }
);
</script>

<style scoped>
.layout-wrapper { flex: 1; min-height: 0; display: flex; flex-direction: row; background-color: var(--app-bg); overflow: hidden; }
.content-wrapper { flex: 1; min-height: 0; display: flex; flex-direction: row; overflow: hidden; position: relative; }
.left-activity { flex-shrink: 0; flex-grow: 0; display: flex; flex-direction: column; height: 100%; position: relative; }
.left-floating-panel {
  position: absolute;
  z-index: 120;
  left: 0;
  top: 0;
  bottom: 0;
  min-height: 260px;
  border: 1px solid var(--app-border);
  border-radius: 0 6px 6px 0;
  background-color: var(--app-bg);
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
  transition: opacity var(--floating-close-ms, 220ms) ease, transform var(--floating-close-ms, 220ms) ease;
}
.left-floating-panel.closing {
  opacity: 0;
  transform: translateX(-12px) scale(0.985);
  pointer-events: none;
}
.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  height: var(--app-tabbar-height);
}
.floating-header { user-select: none; }
.activity-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.floating-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}
.activity-context-menu {
  position: fixed;
  z-index: 2600;
  min-width: 180px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg-elevated);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
  padding: 4px;
}
.activity-context-item {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--app-text-regular);
  text-align: left;
  padding: 7px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--app-ui-font-size);
}
.activity-context-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
.activity-title {
  display: inline-flex;
  align-items: center;
  line-height: 1;
  font-size: var(--app-ui-font-size);
  font-weight: 500;
  color: var(--app-text-regular);
}
.activity-close-btn {
  width: var(--app-icon-hit-size);
  height: var(--app-icon-hit-size);
  border: none;
  background: transparent;
  color: var(--app-text-regular);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.activity-right-border {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--app-border);
  opacity: 0.8;
  z-index: 2;
}
.dock-preview-panel {
  border: 1px dashed color-mix(in srgb, #8b93a1 55%, var(--app-border));
  background: color-mix(in srgb, #9aa3b2 10%, var(--app-bg));
}
.dock-preview-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-muted);
  font-size: var(--app-ui-font-size);
}
.right-activity { flex-shrink: 0; flex-grow: 0; position: relative; }
.main-area { flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column; background-color: var(--app-bg); }
.main-content {
  flex: 1;
  min-height: 0;
  background-color: var(--app-bg);
  display: flex;
  overflow: hidden;
}
.tab-panel-container { flex-shrink: 0; overflow: hidden; width: 100%; border-left: 1px solid var(--app-border); border-right: 1px solid var(--app-border); border-top: 1px solid var(--app-border); }
.splitter {
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  transition: background-color 0.2s ease;
}

.splitter::before {
  content: '';
  position: absolute;
  top: 34px;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  background-color: var(--app-border);
  opacity: 0.8;
  border-radius: 999px;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.splitter.vertical-splitter {
  width: 100%;
  height: 4px;
  cursor: row-resize;
}

.splitter.vertical-splitter::before {
  top: 50%;
  left: 0;
  right: 0;
  bottom: auto;
  transform: translateY(-50%);
  width: auto;
  height: 1px;
}

.splitter:hover,
.splitter.active {
  background-color: var(--app-accent);
}

.splitter:hover::before,
.splitter.active::before {
  background-color: var(--app-text-primary);
  opacity: 1;
}

.close-armed-panel {
  opacity: 0.5;
  transition: opacity 0.15s ease, transform 0.15s ease;
  position: relative;
}

.close-armed-side {
  transform: scaleX(0.97);
}

.close-armed-bottom {
  transform: scaleY(0.96);
  transform-origin: bottom;
}

.close-armed-splitter {
  background-color: rgba(185, 28, 28, 0.16) !important;
}

.close-armed-splitter::before {
  background-color: #ef4444 !important;
  opacity: 1 !important;
}

.max-armed-splitter {
  background-color: rgba(59, 130, 246, 0.16) !important;
}

.max-armed-splitter::before {
  background-color: #3b82f6 !important;
  opacity: 1 !important;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.45);
}

</style>
