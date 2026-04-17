<template>
  <div class="layout-wrapper">
    <!-- 左侧按钮栏 -->
    <Sidebar @button-click="handleSidebarClick" />
    
    <!-- 内容区域 -->
    <div class="content-wrapper" ref="contentWrapper">
      <!-- 左侧活动栏（文件资源管理器） -->
      <div v-if="showLeftActivity" class="left-activity" :style="{ width: leftActivityWidth + 'px' }">
        <div class="activity-header">
          <div class="activity-title">文件资源管理器</div>
          <button class="activity-close-btn" title="关闭" @click="showLeftActivity = false">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
        <ProjectExplorer />
        <div class="activity-right-border"></div>
      </div>
      
      <!-- 左侧活动栏与主区域之间的分割条 -->
      <div 
        v-if="showLeftActivity"
        class="splitter left-splitter"
        :class="{ 'active': isLeftSplitterActive }"
        @mousedown="startLeftDrag"
        @mouseenter="isLeftSplitterActive = true"
        @mouseleave="isLeftSplitterActive = false"
      />
      
      <!-- 中间主区域（自适应填充） -->
      <div class="main-area">
        <!-- 主内容 -->
        <div class="main-content" :style="{ height: mainContentHeight + 'px' }">
          <MainTabPanel ref="mainTabPanelRef" />
        </div>
        
        <!-- 主内容与标签面板之间的分割条 -->
        <div 
          class="splitter vertical-splitter"
          :class="{ 'active': isVerticalSplitterActive }"
          @mousedown="startVerticalDrag"
          @mouseenter="isVerticalSplitterActive = true"
          @mouseleave="isVerticalSplitterActive = false"
        />
        
        <!-- 标签面板 -->
        <div class="tab-panel-container" :style="{ height: tabPanelHeight + 'px' }">
          <TabPanel />
        </div>
      </div>
      
      <!-- 右侧活动栏与主区域之间的分割条 -->
      <div 
        v-if="showRightActivity"
        class="splitter right-splitter"
        :class="{ 'active': isRightSplitterActive }"
        @mousedown="startRightDrag"
        @mouseenter="isRightSplitterActive = true"
        @mouseleave="isRightSplitterActive = false"
      />
      
      <!-- 右侧活动栏 -->
      <ActivityBar 
        v-if="showRightActivity"
        title="属性"
        :items="rightActivityItems"
        :properties="properties"
        :custom-width="rightActivityWidth"
        position="right"
        class="right-activity"
        @close="showRightActivity = false"
        @toggle-float="handleRightActivityToggleFloat"
      />
    </div>
    
    <!-- 右侧按钮栏 -->
    <RightSidebar @toggle-activity="showRightActivity = !showRightActivity" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Bell, Timer, ChatLineRound, Operation, Star, Document, Search, Download, Close } from '@element-plus/icons-vue';
import Sidebar from './Sidebar.vue';
import RightSidebar from './RightSidebar.vue';
import ActivityBar from './ActivityBar.vue';
import TabPanel from './TabPanel.vue';
import MainTabPanel from './MainTabPanel.vue';
import ProjectExplorer from './ProjectExplorer.vue';

// 响应式变量
const currentView = ref('');
const mainTabPanelRef = ref<any>(null);

// 左侧活动栏显示状态
const showLeftActivity = ref(true);
// 右侧活动栏显示状态
const showRightActivity = ref(false);

// 活动栏宽度（使用flex值）
const leftActivityWidth = ref(200);
const rightActivityWidth = ref(200);

// 主内容和标签面板高度
const mainContentHeight = ref(0);
const tabPanelHeight = ref(200); // 初始标签面板高度

// 分割条激活状态
const isLeftSplitterActive = ref(false);
const isRightSplitterActive = ref(false);
const isVerticalSplitterActive = ref(false);

// 拖拽相关变量
let leftDragStartX = 0;
let leftDragStartWidth = 0;
let rightDragStartX = 0;
let rightDragStartWidth = 0;
let containerWidth = 0;

// 垂直拖拽相关变量
let verticalDragStartY = 0;
let verticalDragStartHeight = 0;
let containerHeight = 0;

// 最小宽度限制（百分比）
const minLeftPercent = 25;
const minCenterPercent = 45;
const minRightPercent = 25;

// 最小高度限制
const minTabPanelHeight = 100; // 标签面板最小高度
const minMainContentHeight = 200; // 主内容最小高度

// 像素到百分比的转换因子
const contentWrapper = ref<HTMLElement | null>(null);

// 计算活动栏宽度
const calculateActivityWidth = () => {
  if (!contentWrapper.value) return;
  
  // 获取内容区域的宽度
  const availableWidth = contentWrapper.value.offsetWidth - 6; // 减去两个分割条的宽度
  if (availableWidth <= 0) return;
  
  // 右侧栏宽度保持固定
  const fixedRightWidth = 200;
  
  // 确保右侧栏宽度固定
  rightActivityWidth.value = fixedRightWidth;
  
  if (showLeftActivity.value && showRightActivity.value) {
    // 计算左侧栏和中间区域的可用宽度
    const availableWidthForLeftAndCenter = availableWidth - fixedRightWidth;
    
    // 左侧栏宽度限制
    const minLeftPx = Math.floor(availableWidth * (minLeftPercent / 100));
    const maxLeftPx = availableWidthForLeftAndCenter - Math.floor(availableWidth * (minCenterPercent / 100));
    
    // 确保左侧栏宽度在合理范围内
    leftActivityWidth.value = Math.max(
      minLeftPx,
      Math.min(maxLeftPx, leftActivityWidth.value)
    );
  }
};

// 计算主内容和标签面板高度
const calculateHeights = () => {
  const mainArea = document.querySelector('.main-area');
  if (!mainArea) return;
  
  const totalHeight = mainArea.offsetHeight - 4; // 减去垂直分割条的高度和 margin
  if (totalHeight <= 0) return;
  
  // 确保标签面板高度在合理范围内
  const clampedTabPanelHeight = Math.max(
    minTabPanelHeight,
    Math.min(totalHeight - minMainContentHeight, tabPanelHeight.value)
  );
  
  tabPanelHeight.value = clampedTabPanelHeight;
  mainContentHeight.value = totalHeight - clampedTabPanelHeight;
};

// 侧边栏按钮点击处理
const handleSidebarClick = (view: string) => {
  currentView.value = view;
  
  // 点击主页按钮时加载主页标签
  if (view === 'home') {
    if (mainTabPanelRef.value) {
      mainTabPanelRef.value.loadHomeTab();
    }
  }
  
  // 点击文件按钮时切换左侧活动栏的显示状态
  if (view === 'file') {
    showLeftActivity.value = !showLeftActivity.value;
  }
};



// 右侧活动栏关闭处理
const handleRightActivityClose = () => {
  console.log('关闭右侧活动栏');
  // 这里可以添加关闭右侧活动栏的逻辑
};

// 右侧活动栏浮动/停靠切换处理
const handleRightActivityToggleFloat = () => {
  console.log('切换右侧活动栏浮动/停靠');
  // 这里可以添加切换右侧活动栏浮动/停靠的逻辑
};

// 开始左侧分割条拖拽
const startLeftDrag = (e: MouseEvent) => {
  if (!contentWrapper.value) return;
  
  leftDragStartX = e.clientX;
  leftDragStartWidth = leftActivityWidth.value;
  containerWidth = contentWrapper.value.offsetWidth - 6;
  
  document.addEventListener('mousemove', onLeftDrag);
  document.addEventListener('mouseup', stopLeftDrag);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

// 左侧分割条拖拽中
let leftDragFrameId: number | null = null;

const onLeftDrag = (e: MouseEvent) => {
  // 使用 requestAnimationFrame 优化拖动流畅度
  if (leftDragFrameId) {
    cancelAnimationFrame(leftDragFrameId);
  }
  
  leftDragFrameId = requestAnimationFrame(() => {
    if (!contentWrapper.value) return;
    
    const deltaX = e.clientX - leftDragStartX;
    const newWidth = leftDragStartWidth + deltaX;
    
    // 计算总宽度减去右侧栏宽度，得到左侧栏和中间区域的可用宽度
    const availableWidthForLeftAndCenter = containerWidth - rightActivityWidth.value;
    if (availableWidthForLeftAndCenter <= 0) return;
    
    // 计算左侧栏的最大允许宽度（基于中间区域的最小宽度）
    const maxLeftWidth = availableWidthForLeftAndCenter - Math.floor(containerWidth * (minCenterPercent / 100));
    
    // 限制左侧栏的宽度范围
    leftActivityWidth.value = Math.max(
      Math.floor(containerWidth * (minLeftPercent / 100)),
      Math.min(maxLeftWidth, newWidth)
    );
  });
};

// 停止左侧分割条拖拽
const stopLeftDrag = () => {
  if (leftDragFrameId) {
    cancelAnimationFrame(leftDragFrameId);
    leftDragFrameId = null;
  }
  document.removeEventListener('mousemove', onLeftDrag);
  document.removeEventListener('mouseup', stopLeftDrag);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// 开始右侧分割条拖拽
const startRightDrag = (e: MouseEvent) => {
  if (!contentWrapper.value) return;
  
  rightDragStartX = e.clientX;
  rightDragStartWidth = rightActivityWidth.value;
  containerWidth = contentWrapper.value.offsetWidth - 6;
  
  document.addEventListener('mousemove', onRightDrag);
  document.addEventListener('mouseup', stopRightDrag);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

// 右侧分割条拖拽中
let rightDragFrameId: number | null = null;

const onRightDrag = (e: MouseEvent) => {
  // 使用 requestAnimationFrame 优化拖动流畅度
  if (rightDragFrameId) {
    cancelAnimationFrame(rightDragFrameId);
  }
  
  rightDragFrameId = requestAnimationFrame(() => {
    if (!contentWrapper.value) return;
    
    const deltaX = rightDragStartX - e.clientX;
    const newWidth = rightDragStartWidth + deltaX;
    
    // 计算总宽度减去左侧栏宽度，得到右侧栏和中间区域的可用宽度
    const availableWidthForRightAndCenter = containerWidth - leftActivityWidth.value;
    if (availableWidthForRightAndCenter <= 0) return;
    
    // 计算右侧栏的最大允许宽度（基于中间区域的最小宽度）
    const maxRightWidth = availableWidthForRightAndCenter - Math.floor(containerWidth * (minCenterPercent / 100));
    
    // 限制右侧栏的宽度范围
    rightActivityWidth.value = Math.max(
      Math.floor(containerWidth * (minRightPercent / 100)),
      Math.min(maxRightWidth, newWidth)
    );
  });
};

// 停止右侧分割条拖拽
const stopRightDrag = () => {
  if (rightDragFrameId) {
    cancelAnimationFrame(rightDragFrameId);
    rightDragFrameId = null;
  }
  document.removeEventListener('mousemove', onRightDrag);
  document.removeEventListener('mouseup', stopRightDrag);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// 开始垂直分割条拖拽
const startVerticalDrag = (e: MouseEvent) => {
  const mainArea = document.querySelector('.main-area');
  if (!mainArea) return;
  
  verticalDragStartY = e.clientY;
  verticalDragStartHeight = tabPanelHeight.value;
  containerHeight = mainArea.offsetHeight - 4; // 减去垂直分割条的高度和 margin
  
  document.addEventListener('mousemove', onVerticalDrag);
  document.addEventListener('mouseup', stopVerticalDrag);
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
};

// 垂直分割条拖拽中
let verticalDragFrameId: number | null = null;

const onVerticalDrag = (e: MouseEvent) => {
  // 使用 requestAnimationFrame 优化拖动流畅度
  if (verticalDragFrameId) {
    cancelAnimationFrame(verticalDragFrameId);
  }
  
  verticalDragFrameId = requestAnimationFrame(() => {
    const mainArea = document.querySelector('.main-area');
    if (!mainArea) return;
    
    const deltaY = e.clientY - verticalDragStartY;
    // 修正方向：向下拖动时标签面板高度增加
    const newHeight = verticalDragStartHeight + deltaY;
    
    // 确保标签面板高度在合理范围内
    const clampedHeight = Math.max(
      minTabPanelHeight,
      Math.min(containerHeight - minMainContentHeight, newHeight)
    );
    
    tabPanelHeight.value = clampedHeight;
    mainContentHeight.value = containerHeight - clampedHeight;
  });
};

// 停止垂直分割条拖拽
const stopVerticalDrag = () => {
  if (verticalDragFrameId) {
    cancelAnimationFrame(verticalDragFrameId);
    verticalDragFrameId = null;
  }
  document.removeEventListener('mousemove', onVerticalDrag);
  document.removeEventListener('mouseup', stopVerticalDrag);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// 窗口大小变化处理
const handleResize = () => {
  calculateActivityWidth();
  calculateHeights();
};

// 生命周期
onMounted(() => {
  calculateActivityWidth();
  calculateHeights();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const leftActivityItems = [
  { id: '1', title: '收藏', icon: Star },
  { id: '2', title: '书签', icon: Document },
  { id: '3', title: '历史', icon: Search },
  { id: '4', title: '下载', icon: Download }
];

const rightActivityItems = [
  { id: '1', title: '属性', icon: Operation }
];

// 属性数据
const properties = [
  { id: '1', label: '名称', value: '未命名' },
  { id: '2', label: '类型', value: '文件' },
  { id: '3', label: '大小', value: '0 KB' },
  { id: '4', label: '修改时间', value: '未修改' }
];
</script>

<style scoped>
.layout-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  background-color: #1e1e1e;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

/* 左侧活动栏 */
.left-activity {
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* 活动栏头部 */
.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #424242;
  background-color: #252526;
  height: 32px;
  box-sizing: border-box;
}

/* 活动栏标题 */
.activity-title {
  font-size: 12px;
  font-weight: 500;
  color: #cccccc;
}

/* 活动栏关闭按钮 */
.activity-close-btn {
  width: 20px;
  height: 20px;
  border: none;
  background-color: transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cccccc;
  transition: all 0.3s;
}

.activity-close-btn:hover {
  background-color: #333333;
  color: #e1e1e1;
}

/* 活动栏右侧分割线 */
.activity-right-border {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #424242;
  z-index: 1;
}

/* 项目浏览器容器 */
.left-activity :deep(.project-explorer) {
  flex: 1;
  overflow: hidden;
}

/* 右侧活动栏 */
.right-activity {
  flex-shrink: 0;
  flex-grow: 0;
}

/* 中间主区域 */
.main-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  min-width: 45%;
}

/* 主内容 */
.main-content {
  flex: 1;
  min-height: 0;
  background-color: #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 标签面板容器 */
.tab-panel-container {
  flex-shrink: 0;
  overflow: hidden;
  width: 100%;
  margin-left: -1px;
  margin-right: -1px;
  padding-left: 1px;
  padding-right: 1px;
  border-left: 1px solid #424242;
  border-right: 1px solid #424242;
  border-top: 1px solid #424242;
}

/* 标签面板 */
.tab-panel-container :deep(.tab-panel) {
  height: 100%;
}

/* 分割条通用样式 */
.splitter {
  width: 3px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

/* 左侧分割条 */
.splitter.left-splitter {
  margin: 0;
}

/* 右侧分割条 */
.splitter.right-splitter {
  margin: 0;
}

/* 垂直分割条（调整高度） */
.splitter.vertical-splitter {
  width: 100%;
  height: 3px;
  cursor: row-resize;
  flex-direction: column;
  margin: 0;
}

.splitter::before {
  content: '';
  width: 1px;
  height: 100%;
  background-color: transparent;
  transition: background-color 0.2s;
}

.splitter.vertical-splitter::before {
  width: 100%;
  height: 1px;
}

.splitter:hover::before,
.splitter.active::before {
  background-color: #0078d4;
}

.splitter:hover,
.splitter.active {
  background-color: rgba(0, 120, 212, 0.15);
}
</style>