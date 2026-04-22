<template>
  <div class="layout-wrapper">
    <Sidebar @button-click="handleSidebarClick" />
    <div class="content-wrapper" ref="contentWrapper">
      <div v-if="showLeftActivity" class="left-activity" :style="{ width: leftActivityWidth + 'px' }">
        <div class="activity-header">
          <div class="activity-title">文件资源管理器</div>
          <button class="activity-close-btn" title="关闭" @click="closeLeftActivity">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
        <ProjectExplorer />
        <div class="activity-right-border"></div>
      </div>
      <div
        v-if="showLeftActivity"
        class="splitter left-splitter"
        :class="{ active: isLeftSplitterActive }"
        @mousedown="startLeftDrag"
        @mouseenter="isLeftSplitterActive = true"
        @mouseleave="isLeftSplitterActive = false"
      />
      <div class="main-area">
        <div class="main-content" :style="{ height: mainContentHeight + 'px' }">
          <MainTabPanel ref="mainTabPanelRef" />
        </div>
        <div
          class="splitter vertical-splitter"
          :class="{ active: isVerticalSplitterActive }"
          @mousedown="startVerticalDrag"
          @mouseenter="isVerticalSplitterActive = true"
          @mouseleave="isVerticalSplitterActive = false"
        />
        <div class="tab-panel-container" :style="{ height: tabPanelHeight + 'px' }">
          <TabPanel />
        </div>
      </div>
      <div
        v-if="showRightActivity"
        class="splitter right-splitter"
        :class="{ active: isRightSplitterActive }"
        @mousedown="startRightDrag"
        @mouseenter="isRightSplitterActive = true"
        @mouseleave="isRightSplitterActive = false"
      />
      <ActivityBar
        v-if="showRightActivity"
        title="属性"
        :items="rightActivityItems"
        :properties="properties"
        :custom-width="rightActivityWidth"
        position="right"
        class="right-activity"
        @close="closeRightActivity"
        @toggle-float="handleRightActivityToggleFloat"
      />
    </div>
    <RightSidebar @toggle-activity="uiActions.toggleRightPanel" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Operation, Close } from '@element-plus/icons-vue';
import Sidebar from './Sidebar.vue';
import RightSidebar from './RightSidebar.vue';
import ActivityBar from './ActivityBar.vue';
import MainTabPanel from '../tabs/MainTabPanel.vue';
import TabPanel from '../tabs/TabPanel.vue';
import ProjectExplorer from '../explorer/ProjectExplorer.vue';
import { useLayoutPanels } from '../../../viewmodels/useLayoutPanels';
import { usePanelLayout } from '../../../viewmodels/usePanelLayout';
import { uiActions } from '../../services/uiActions';

const mainTabPanelRef = ref<any>(null);
const contentWrapper = ref<HTMLElement | null>(null);

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
  startLeftDrag,
  startRightDrag,
  startVerticalDrag
} = usePanelLayout({ contentWrapper, showLeftActivity, showRightActivity });

const handleSidebarClick = (view: string) => {
  currentView.value = view;
  if (view === 'home' && mainTabPanelRef.value) mainTabPanelRef.value.loadHomeTab();
  if (view === 'file') toggleLeftActivity();
};

const handleRightActivityToggleFloat = () => {};

const rightActivityItems = [{ id: '1', title: '属性', icon: Operation }];
const properties = [
  { id: '1', label: '名称', value: '未命名' },
  { id: '2', label: '类型', value: '文件' },
  { id: '3', label: '大小', value: '0 KB' },
  { id: '4', label: '修改时间', value: '未修改' }
];
</script>

<style scoped>
.layout-wrapper { flex: 1; min-height: 0; display: flex; flex-direction: row; background-color: #1e1e1e; overflow: hidden; }
.content-wrapper { flex: 1; min-height: 0; display: flex; flex-direction: row; overflow: hidden; }
.left-activity { flex-shrink: 0; flex-grow: 0; display: flex; flex-direction: column; height: 100%; position: relative; }
.activity-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #424242; background-color: #252526; height: 32px; }
.activity-title { font-size: 12px; font-weight: 500; color: #cccccc; }
.activity-close-btn { width: 20px; height: 20px; border: none; background: transparent; color: #cccccc; cursor: pointer; }
.activity-right-border { position: absolute; right: 0; top: 0; bottom: 0; width: 1px; background-color: #424242; z-index: 1; }
.right-activity { flex-shrink: 0; flex-grow: 0; }
.main-area { flex: 1; min-height: 0; display: flex; flex-direction: column; background-color: #1e1e1e; min-width: 45%; }
.main-content { flex: 1; min-height: 0; background-color: #1e1e1e; display: flex; overflow: hidden; }
.tab-panel-container { flex-shrink: 0; overflow: hidden; width: 100%; border-left: 1px solid #424242; border-right: 1px solid #424242; border-top: 1px solid #424242; }
.splitter { width: 3px; cursor: col-resize; background-color: transparent; flex-shrink: 0; position: relative; z-index: 10; }
.splitter.vertical-splitter { width: 100%; height: 3px; cursor: row-resize; }
.splitter:hover, .splitter.active { background-color: rgba(0, 120, 212, 0.15); }
</style>
