<template>
  <div class="main-tab-panel">
    <div class="main-tab-bar">
      <div 
        class="main-tab-item" 
        :class="{ 'active': activeTabId === tab.id }"
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
      <!-- 主页标签内容 -->
      <div v-if="activeTabId === 'home' && tabs.some(tab => tab.id === 'home')" class="home-view">
        <div class="home-header">
          <h1>欢迎使用</h1>
          <p>这是应用的主页</p>
        </div>
        
        <!-- 左右布局 -->
        <div class="home-layout">
          <!-- 左侧操作按钮 -->
          <div class="home-left">
            <div class="action-buttons-square">
              <button class="action-button-square open-folder" @click="handleOpenFolder">
                <el-icon><Folder /></el-icon>
                <span>打开文件夹</span>
              </button>
              <button class="action-button-square open-project" @click="handleOpenProject">
                <el-icon><Document /></el-icon>
                <span>打开项目</span>
              </button>
              <button class="action-button-square open-file" @click="handleOpenFile">
                <el-icon><Document /></el-icon>
                <span>打开文件</span>
              </button>
            </div>
          </div>
          
          <!-- 右侧历史文件 -->
          <div class="home-right">
            <div class="history-files">
              <h3>最近打开的文件</h3>
              <div v-if="historyFiles.length > 0" class="history-list">
                <div 
                  v-for="(file, index) in historyFiles" 
                  :key="index"
                  class="history-item"
                  @click="openHistoryFile(file)"
                >
                  <el-icon><Document /></el-icon>
                  <div class="history-item-info">
                    <div class="history-item-name">{{ file.name }}</div>
                    <div class="history-item-path">{{ file.path }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="no-history">
                <el-icon><InfoFilled /></el-icon>
                <p>暂无历史文件</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 其他标签内容 -->
      <div v-else-if="tabs.length > 0" class="tab-content-placeholder">
        标签内容区域 - {{ getActiveTab()?.title }}
      </div>
      
      <!-- 无标签时的内容 -->
      <div v-else class="no-tabs-content">
        <div class="no-tabs-message">
          <el-icon :size="48"><InfoFilled /></el-icon>
          <p>请点击左侧的主页按钮</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Close, Folder, Search, Setting, Help, InfoFilled, Document } from '@element-plus/icons-vue';

interface Tab {
  id: string;
  title: string;
  content: string;
}

// 标签列表
const tabs = ref<Tab[]>([]);
// 当前激活的标签
const activeTabId = ref<string>('');

// 历史文件
interface HistoryFile {
  name: string;
  path: string;
}

const historyFiles = ref<HistoryFile[]>([]);

// 初始化标签
const initTabs = () => {
  // 添加默认的主页标签
  const homeTab: Tab = {
    id: 'home',
    title: '主页',
    content: 'home-content'
  };
  tabs.value = [homeTab];
  activeTabId.value = homeTab.id;
};

// 切换标签
const switchTab = (id: string) => {
  activeTabId.value = id;
};



// 关闭标签
const closeTab = (id: string) => {
  // 找到要关闭的标签索引
  const index = tabs.value.findIndex(tab => tab.id === id);
  if (index === -1) return;
  
  // 如果关闭的是当前激活的标签，切换到前一个标签
  if (id === activeTabId.value) {
    const newActiveIndex = index > 0 ? index - 1 : 0;
    activeTabId.value = tabs.value[newActiveIndex].id;
  }
  
  // 移除标签
  tabs.value = tabs.value.filter(tab => tab.id !== id);
};

// 加载主页标签
const loadHomeTab = () => {
  // 检查是否已经有主页标签
  const homeTabExists = tabs.value.some(tab => tab.id === 'home');
  if (!homeTabExists) {
    // 添加主页标签
    const homeTab: Tab = {
      id: 'home',
      title: '主页',
      content: 'home-content'
    };
    tabs.value.push(homeTab);
  }
  // 激活主页标签
  activeTabId.value = 'home';
};

// 获取当前激活的标签
const getActiveTab = () => {
  return tabs.value.find(tab => tab.id === activeTabId.value);
};

// 生命周期
onMounted(() => {
  initTabs();
});

// 按钮点击事件处理函数
const handleOpenFolder = async () => {
  if (window.electron && window.electron.dialog) {
    const result = await window.electron.dialog.openDirectory();
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('选择的目录:', result.filePaths[0]);
      // 触发文件夹打开事件
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('folder-opened', result.filePaths[0]);
      }
    }
  } else {
    console.log('打开文件夹');
  }
};

const handleOpenProject = async () => {
  if (window.electron && window.electron.dialog) {
    const result = await window.electron.dialog.openDirectory();
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('选择的项目目录:', result.filePaths[0]);
      // 触发文件夹打开事件
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('folder-opened', result.filePaths[0]);
      }
    }
  } else {
    console.log('打开项目');
  }
};

const handleOpenFile = async () => {
  if (window.electron && window.electron.dialog) {
    const result = await window.electron.dialog.openFile();
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('选择的文件:', result.filePaths[0]);
      // 添加到历史文件
      addToHistory(result.filePaths[0]);
    }
  } else {
    console.log('打开文件');
  }
};

// 打开历史文件
const openHistoryFile = (file: HistoryFile) => {
  console.log('打开历史文件:', file.path);
};

// 添加到历史文件
const addToHistory = (filePath: string) => {
  // 提取文件名
  const fileName = filePath.match(/[^\\/]+$/)?.[0] || filePath;
  // 检查是否已存在
  const existingIndex = historyFiles.value.findIndex(file => file.path === filePath);
  if (existingIndex > -1) {
    // 移除旧的，添加到最前面
    historyFiles.value.splice(existingIndex, 1);
  }
  // 添加到最前面
  historyFiles.value.unshift({ name: fileName, path: filePath });
  // 限制历史文件数量
  if (historyFiles.value.length > 10) {
    historyFiles.value = historyFiles.value.slice(0, 10);
  }
};

// 暴露方法给父组件
defineExpose({
  loadHomeTab
});
</script>

<style scoped>
.main-tab-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
}

/* 标签栏 */
.main-tab-bar {
  background-color: #252526;
  border-bottom: 1px solid #424242;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 32px;
  overflow-x: auto;
  flex-shrink: 0;
  margin: 0;
}

.main-tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 24px;
  background-color: #333333;
  border: 1px solid #424242;
  border-radius: 3px 3px 0 0;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  color: #cccccc;
  white-space: nowrap;
}

.main-tab-item.active {
  background-color: #1e1e1e;
  border-bottom-color: #1e1e1e;
  color: #e1e1e1;
}

.main-tab-item:hover {
  background-color: #3a3a3a;
  color: #e1e1e1;
}

.main-tab-close {
  width: 16px;
  height: 16px;
  border: none;
  background-color: transparent;
  color: #999999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.3s;
}

.main-tab-close:hover {
  background-color: #444444;
  color: #e1e1e1;
}



/* 标签内容区域 */
.main-tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 主页视图 */
.home-view {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

.home-header {
  margin-bottom: 32px;
}

.home-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.home-header p {
  font-size: 14px;
  color: #999999;
}

.home-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.home-card {
  background-color: #252526;
  border: 1px solid #424242;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.home-card:hover {
  background-color: #2d2d2d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.home-card el-icon {
  font-size: 48px;
  color: #666666;
  margin-bottom: 16px;
}

.home-card h3 {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 8px;
}

.home-card p {
  font-size: 14px;
  color: #999999;
  line-height: 1.4;
}

/* 操作按钮区 */
.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 40px;
  justify-content: center;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1px solid #424242;
  border-radius: 6px;
  background-color: #252526;
  color: #cccccc;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-button:hover {
  background-color: #2d2d2d;
  border-color: #555555;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 背景光效 */
.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.action-button:hover::before {
  left: 100%;
}

/* 不同按钮的颜色 */
.action-button.open-folder {
  border-color: #3c78d8;
  box-shadow: 0 0 10px rgba(60, 120, 216, 0.2);
}

.action-button.open-folder:hover {
  border-color: #4285f4;
  box-shadow: 0 0 15px rgba(66, 133, 244, 0.4);
}

.action-button.open-project {
  border-color: #34a853;
  box-shadow: 0 0 10px rgba(52, 168, 83, 0.2);
}

.action-button.open-project:hover {
  border-color: #34a853;
  box-shadow: 0 0 15px rgba(52, 168, 83, 0.4);
}

.action-button.open-file {
  border-color: #fbbc05;
  box-shadow: 0 0 10px rgba(251, 188, 5, 0.2);
}

.action-button.open-file:hover {
  border-color: #fbbc05;
  box-shadow: 0 0 15px rgba(251, 188, 5, 0.4);
}

/* 按钮图标 */
.action-button el-icon {
  font-size: 16px;
}

/* 左右布局 */
.home-layout {
  display: flex;
  gap: 24px;
  margin-top: 32px;
}

.home-left {
  flex: 0 0 200px;
}

.home-right {
  flex: 1;
  min-width: 0;
}

/* 方形操作按钮 */
.action-buttons-square {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button-square {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 1px solid #424242;
  border-radius: 8px;
  background-color: #252526;
  color: #cccccc;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-align: center;
  min-height: 120px;
}

.action-button-square:hover {
  background-color: #2d2d2d;
  border-color: #555555;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 方形按钮的背景光效 */
.action-button-square::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.action-button-square:hover::before {
  left: 100%;
}

/* 不同方形按钮的颜色 */
.action-button-square.open-folder {
  border-color: #3c78d8;
  box-shadow: 0 0 10px rgba(60, 120, 216, 0.2);
}

.action-button-square.open-folder:hover {
  border-color: #4285f4;
  box-shadow: 0 0 15px rgba(66, 133, 244, 0.4);
}

.action-button-square.open-project {
  border-color: #34a853;
  box-shadow: 0 0 10px rgba(52, 168, 83, 0.2);
}

.action-button-square.open-project:hover {
  border-color: #34a853;
  box-shadow: 0 0 15px rgba(52, 168, 83, 0.4);
}

.action-button-square.open-file {
  border-color: #fbbc05;
  box-shadow: 0 0 10px rgba(251, 188, 5, 0.2);
}

.action-button-square.open-file:hover {
  border-color: #fbbc05;
  box-shadow: 0 0 15px rgba(251, 188, 5, 0.4);
}

/* 方形按钮图标 */
.action-button-square el-icon {
  font-size: 32px;
}

/* 历史文件 */
.history-files {
  background-color: #252526;
  border: 1px solid #424242;
  border-radius: 8px;
  padding: 24px;
  height: 100%;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

.history-files h3 {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 16px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.history-item:hover {
  background-color: #2d2d2d;
}

.history-item el-icon {
  font-size: 16px;
  color: #666666;
  margin-top: 2px;
}

.history-item-info {
  flex: 1;
  min-width: 0;
}

.history-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-path {
  font-size: 12px;
  color: #999999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #666666;
  text-align: center;
}

.no-history el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-history p {
  font-size: 14px;
}

/* 标签内容占位符 */
.tab-content-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  font-size: 14px;
}

/* 无标签时的内容 */
.no-tabs-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e1e1e;
}

.no-tabs-message {
  text-align: center;
  color: #666666;
}

.no-tabs-message el-icon {
  margin-bottom: 16px;
}

/* 滚动条样式 */
.main-tab-bar::-webkit-scrollbar {
  height: 6px;
}

.main-tab-bar::-webkit-scrollbar-track {
  background: #252526;
}

.main-tab-bar::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 3px;
}

.main-tab-bar::-webkit-scrollbar-thumb:hover {
  background: #555555;
}

.home-view::-webkit-scrollbar {
  width: 6px;
}

.home-view::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.home-view::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 3px;
}

.home-view::-webkit-scrollbar-thumb:hover {
  background: #555555;
}
</style>
