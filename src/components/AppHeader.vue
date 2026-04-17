<template>
  <div class="app-header">
    <div class="app-header-left">
      <img src="../assets/icons/logo.svg" alt="Logo" class="app-logo" />
      <div class="custom-dropdown" @click="toggleDropdown">
        <button class="header-btn">
          <el-icon><Folder /></el-icon>
          <span>文件</span>
        </button>
        <div class="custom-dropdown-menu" v-if="dropdownVisible">
          <div class="custom-dropdown-item" @click="handleNew">
            <el-icon><Plus /></el-icon>
            <span>新建</span>
          </div>
          <div class="custom-dropdown-item" @click="handleOpenFolder">
            <el-icon><Folder /></el-icon>
            <span>打开文件夹</span>
          </div>
        </div>
      </div>
      <button class="header-btn">
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </button>
      <button class="header-btn">
        <el-icon><Tools /></el-icon>
        <span>工具</span>
      </button>
      <button class="header-btn">
        <el-icon><Monitor /></el-icon>
        <span>窗口</span>
      </button>
      <button class="header-btn">
        <el-icon><Help /></el-icon>
        <span>帮助</span>
      </button>
    </div>
    <div class="app-header-right">
      <div class="custom-dropdown" @click="toggleSettingDropdown">
        <button class="header-btn" title="设置">
          <el-icon><Setting /></el-icon>
        </button>
        <div class="custom-dropdown-menu" v-if="settingDropdownVisible">
          <div class="custom-dropdown-item" @click="handleSettings">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </div>
          <div class="custom-dropdown-item" @click="handlePreferences">
            <el-icon><Tools /></el-icon>
            <span>偏好设置</span>
          </div>
          <div class="custom-dropdown-item" @click="handleTheme">
            <el-icon><Moon /></el-icon>
            <span>主题</span>
          </div>
          <div class="custom-dropdown-item" @click="handleAbout">
            <el-icon><Help /></el-icon>
            <span>关于</span>
          </div>
        </div>
      </div>
      <div class="window-controls-placeholder"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Folder, Setting, Plus, Document, Edit, Help, Monitor, Tools, Moon } from '@element-plus/icons-vue';

// 响应式变量
const dropdownVisible = ref(false);
const settingDropdownVisible = ref(false);

// 方法
const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value;
  settingDropdownVisible.value = false;
};

const toggleSettingDropdown = () => {
  settingDropdownVisible.value = !settingDropdownVisible.value;
  dropdownVisible.value = false;
};

const handleNew = () => {
  console.log('新建文件');
  dropdownVisible.value = false;
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
  dropdownVisible.value = false;
};

const handleOpenFolder = async () => {
  if (window.electron && window.electron.dialog) {
    const result = await window.electron.dialog.openDirectory();
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('选择的目录:', result.filePaths[0]);
      // 这里可以触发事件，通知项目浏览器组件更新
      if (window.electron && window.electron.ipcRenderer) {
        console.log('发送folder-opened事件:', result.filePaths[0]);
        window.electron.ipcRenderer.send('folder-opened', result.filePaths[0]);
      }
    }
  } else {
    console.log('打开文件夹');
  }
  dropdownVisible.value = false;
};

const handleSettings = () => {
  console.log('打开设置');
  settingDropdownVisible.value = false;
};

const handlePreferences = () => {
  console.log('打开偏好设置');
  settingDropdownVisible.value = false;
};

const handleAbout = () => {
  console.log('打开关于');
  settingDropdownVisible.value = false;
};

const handleTheme = () => {
  console.log('打开主题设置');
  settingDropdownVisible.value = false;
};

// 点击外部区域关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const dropdowns = document.querySelectorAll('.custom-dropdown');
  let clickedInside = false;
  dropdowns.forEach(dropdown => {
    if (dropdown.contains(event.target as Node)) {
      clickedInside = true;
    }
  });
  if (!clickedInside) {
    dropdownVisible.value = false;
    settingDropdownVisible.value = false;
  }
};

// 快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // 按下F键时打开/关闭文件下拉菜单
  if (event.key === 'F' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    toggleDropdown();
  }
};

// 生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* 顶部按钮栏 */
.app-header {
  height: 33px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: #252526;
  border-bottom: 1px solid #424242;
  -webkit-app-region: drag;
}

.app-header-left {
  display: flex;
  align-items: center;
  gap: 5px;
  -webkit-app-region: no-drag;
}

.app-logo {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  -webkit-app-region: no-drag;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 5px;
  -webkit-app-region: no-drag;
}

.window-controls-placeholder {
  width: 130px;
  height: 33px;
  -webkit-app-region: no-drag;
  border-bottom: 1px solid #424242;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: none;
  background-color: #252526;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  color: #cccccc;
  transition: all 0.3s;
  height: 24px;
  -webkit-app-region: no-drag;
}

.header-btn:hover {
  background-color: #333333;
  color: #e1e1e1;
}

.header-btn:focus {
  outline: none;
}

/* 自定义下拉菜单 */
.custom-dropdown {
  position: relative;
  display: inline-block;
  -webkit-app-region: no-drag;
}

.custom-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #252526;
  border: 1px solid #424242;
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 150px;
  margin-top: 2px;
  outline: none;
}

/* 设置按钮的下拉菜单右对齐 */
.app-header-right .custom-dropdown-menu {
  left: auto;
  right: 0;
}

.custom-dropdown-menu:focus {
  outline: none;
}

.custom-dropdown-item:focus {
  outline: none;
}

.custom-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  color: #cccccc;
  transition: all 0.3s;
  font-size: 12px;
}

.custom-dropdown-item:hover {
  background-color: #333333;
  color: #e1e1e1;
}
</style>