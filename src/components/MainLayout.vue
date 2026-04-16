<template>
  <div class="app-container">
    <!-- 顶部按钮栏 -->
    <div class="app-header">
      <div class="app-header-left">
        <img src="../assets/icons/logo.svg" alt="Logo" class="app-logo" />
        <div class="file-menu-container">
          <button class="header-btn" title="文件" @click="toggleFileMenu">
            <el-icon><Folder /></el-icon>
            <span>文件</span>
          </button>
          <!-- 文件下拉菜单 -->
          <div class="file-menu" v-if="fileMenuVisible">
            <div class="menu-item" @click="handleNew">
              <el-icon><Plus /></el-icon>
              <span>新建</span>
            </div>
            <div class="menu-item" @click="handleOpen">
              <el-icon><Document /></el-icon>
              <span>打开</span>
            </div>
          </div>
        </div>
      </div>
      <div class="app-header-right">
        <button class="header-btn" title="设置">
          <el-icon><Setting /></el-icon>
        </button>
        <div class="window-controls-placeholder"></div>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="app-content">
      <!-- 预留内容区域 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Folder, Setting, Plus, Document } from '@element-plus/icons-vue';

// 响应式变量
const fileMenuVisible = ref(false);

// 方法
const toggleFileMenu = () => {
  fileMenuVisible.value = !fileMenuVisible.value;
};

const handleNew = () => {
  console.log('新建文件');
  fileMenuVisible.value = false;
};

const handleOpen = () => {
  console.log('打开文件');
  fileMenuVisible.value = false;
};

// 点击外部区域关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const fileMenuContainer = document.querySelector('.file-menu-container');
  if (fileMenuContainer && !fileMenuContainer.contains(event.target as Node)) {
    fileMenuVisible.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
}

/* 顶部按钮栏 */
.app-header {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: #252526;
  border-bottom: 1px solid #424242;
}

.app-header-left {
  display: flex;
  align-items: center;
  gap: 5px;
}

.app-logo {
  width: 16px;
  height: 16px;
  margin-right: 10px;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.window-controls-placeholder {
  width: 130px; /* 增加宽度，确保设置按钮能够显示出来 */
  height: 32px; /* 与顶部按钮栏的高度一致 */
}

.app-content {
  flex: 1;
  background-color: #1e1e1e; /* 淡一些的暗黑背景颜色，比顶栏按钮区域的背景颜色要淡 */
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: none;
  background-color: transparent;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  color: #cccccc;
  transition: all 0.3s;
  height: 24px;
}

.header-btn:hover {
  background-color: #333333;
  color: #e1e1e1;
}

.file-menu-container {
  position: relative;
  display: inline-block;
}

.file-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #252526;
  border: 1px solid #333333;
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 150px;
  margin-top: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  color: #cccccc;
  transition: all 0.3s;
}

.menu-item:hover {
  background-color: #333333;
  color: #e1e1e1;
}
</style>