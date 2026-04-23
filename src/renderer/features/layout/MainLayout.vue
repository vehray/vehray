<template>
  <div class="layout-wrapper">
    <Sidebar @button-click="handleSidebarClick" />
    <div class="content-wrapper" ref="contentWrapper">
      <div
        v-if="showLeftActivity"
        class="left-activity"
        :class="{ 'close-armed-panel': isLeftCloseArmed || isLeftMaxArmed, 'close-armed-side': isLeftCloseArmed }"
        :style="{ width: leftActivityWidth + 'px' }"
      >
        <div class="activity-header">
          <div class="activity-title">{{ t('layout.explorer.title') }}</div>
          <button class="activity-close-btn" :title="t('common.close')" @click="closeLeftActivity">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
        <ProjectExplorer />
        <div class="activity-right-border"></div>
      </div>
      <div
        v-if="showLeftActivity"
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
        <div class="main-content" :style="{ height: mainContentHeight + 'px' }">
          <MainTabPanel ref="mainTabPanelRef" />
        </div>
        <div
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
          class="tab-panel-container"
          :class="{ 'close-armed-panel': isVerticalLimitArmed, 'close-armed-bottom': isVerticalCloseArmed }"
          :style="{ height: tabPanelHeight + 'px' }"
        >
          <TabPanel />
        </div>
      </div>
      <div
        v-if="showRightActivity"
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
        v-if="showRightActivity"
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
    <RightSidebar @toggle-activity="uiActions.toggleRightPanel" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Operation, Close } from '@element-plus/icons-vue';
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

const mainTabPanelRef = ref<any>(null);
const contentWrapper = ref<HTMLElement | null>(null);
const mainArea = ref<HTMLElement | null>(null);
const { t } = useI18n();

const { currentView, showLeftActivity, showRightActivity, toggleLeftActivity, closeLeftActivity, closeRightActivity } =
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
  startVerticalDrag
} = usePanelLayout({ contentWrapper, mainArea, showLeftActivity, showRightActivity });

const handleSidebarClick = (view: string) => {
  currentView.value = view;
  if (view === 'home' && mainTabPanelRef.value) mainTabPanelRef.value.loadHomeTab();
  if (view === 'file') toggleLeftActivity();
};

const handleRightActivityToggleFloat = () => {};

const rightActivityItems = computed(() => [{ id: '1', title: t('layout.sidebar.properties'), icon: Operation }]);
</script>

<style scoped>
.layout-wrapper { flex: 1; min-height: 0; display: flex; flex-direction: row; background-color: var(--app-bg); overflow: hidden; }
.content-wrapper { flex: 1; min-height: 0; display: flex; flex-direction: row; overflow: hidden; }
.left-activity { flex-shrink: 0; flex-grow: 0; display: flex; flex-direction: column; height: 100%; position: relative; }
.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  height: 34px;
}
.activity-title {
  display: inline-flex;
  align-items: center;
  line-height: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-regular);
}
.activity-close-btn {
  width: 20px;
  height: 20px;
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
