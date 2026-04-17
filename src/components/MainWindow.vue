<template>
  <div class="main-window">
    <!-- 主页内容 -->
    <div v-if="currentView === 'home'" class="home-view">
      <div class="home-header">
        <h1>欢迎使用</h1>
        <p>这是应用的主页</p>
      </div>
      <div class="home-content">
        <div class="home-card">
          <el-icon><Folder /></el-icon>
          <h3>文件管理</h3>
          <p>浏览和管理您的文件</p>
        </div>
        <div class="home-card">
          <el-icon><Search /></el-icon>
          <h3>搜索</h3>
          <p>快速查找内容</p>
        </div>
        <div class="home-card">
          <el-icon><Setting /></el-icon>
          <h3>设置</h3>
          <p>自定义应用配置</p>
        </div>
        <div class="home-card">
          <el-icon><Help /></el-icon>
          <h3>帮助</h3>
          <p>获取使用指南</p>
        </div>
      </div>
      
      <!-- 操作按钮区 -->
      <div class="action-buttons">
        <button class="action-button open-folder" @click="handleOpenFolder">
          <el-icon><Folder /></el-icon>
          <span>打开文件夹</span>
        </button>
        <button class="action-button open-project" @click="handleOpenProject">
          <el-icon><Document /></el-icon>
          <span>打开项目</span>
        </button>
        <button class="action-button open-file" @click="handleOpenFile">
          <el-icon><Document /></el-icon>
          <span>打开文件</span>
        </button>
      </div>
    </div>
    
    <!-- 其他视图 -->
    <div v-else class="empty-view">
      <div class="empty-content">
        <el-icon :size="48"><InfoFilled /></el-icon>
        <p>请点击左侧的主页按钮</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Folder, Search, Setting, Help, InfoFilled, Document } from '@element-plus/icons-vue';

const props = defineProps<{
  currentView: string;
}>();

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
    }
  } else {
    console.log('打开文件');
  }
};
</script>

<style scoped>
.main-window {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 主页视图 */
.home-view {
  flex: 1;
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

/* 空视图 */
.empty-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  color: #666666;
}

.empty-content el-icon {
  margin-bottom: 16px;
}

.empty-content p {
  font-size: 14px;
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
</style>