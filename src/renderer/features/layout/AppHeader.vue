<template>
  <div class="app-header">
    <div class="app-header-left">
      <img src="../../../assets/icons/logo.svg" alt="Logo" class="app-logo" />
      <div class="custom-dropdown" @click="toggleDropdown">
        <button class="header-btn">
          <el-icon><Folder /></el-icon>
          <span>{{ t('layout.header.file') }}</span>
        </button>
        <div class="custom-dropdown-menu" v-if="dropdownVisible">
          <div class="custom-dropdown-item" @click="handleNew">
            <el-icon><Plus /></el-icon>
            <span>{{ t('common.newFile') }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handleOpenFile">
            <el-icon><Document /></el-icon>
            <span>{{ t('layout.header.openFile') }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handleOpenFolder">
            <el-icon><Folder /></el-icon>
            <span>{{ t('layout.header.openFolder') }}</span>
          </div>
        </div>
      </div>
      <button class="header-btn">
        <el-icon><Edit /></el-icon>
        <span>{{ t('layout.header.edit') }}</span>
      </button>
      <button class="header-btn">
        <el-icon><Tools /></el-icon>
        <span>{{ t('layout.header.tools') }}</span>
      </button>
      <button class="header-btn">
        <el-icon><Monitor /></el-icon>
        <span>{{ t('layout.header.window') }}</span>
      </button>
      <button class="header-btn">
        <el-icon><Help /></el-icon>
        <span>{{ t('layout.header.help') }}</span>
      </button>
    </div>
    <div class="app-header-right">
      <div class="custom-dropdown" @click="toggleSettingDropdown">
        <button class="header-btn" :title="t('layout.header.settings')">
          <el-icon><Setting /></el-icon>
        </button>
        <div class="custom-dropdown-menu" v-if="settingDropdownVisible">
          <div class="custom-dropdown-item" @click="handleSettings">
            <el-icon><Setting /></el-icon>
            <span>{{ t('layout.header.settings') }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handlePreferences">
            <el-icon><Tools /></el-icon>
            <span>{{ t('layout.header.preferences') }}</span>
          </div>
          <div class="custom-dropdown-item theme-menu-trigger" @click.stop="toggleThemeMenu">
            <el-icon><Moon /></el-icon>
            <span>{{ t('layout.header.theme') }}</span>
            <el-icon class="submenu-arrow"><ArrowRight /></el-icon>
            <div class="theme-submenu" v-if="themeSubmenuVisible">
              <div class="custom-dropdown-item" :class="{ selected: state.theme === 'dark' }" @click.stop="handleThemeChange('dark')">
                <el-icon><Moon /></el-icon>
                <span>{{ t('layout.header.themeDark') }}</span>
              </div>
              <div class="custom-dropdown-item" :class="{ selected: state.theme === 'light' }" @click.stop="handleThemeChange('light')">
                <el-icon><Sunny /></el-icon>
                <span>{{ t('layout.header.themeLight') }}</span>
              </div>
            </div>
          </div>
          <div class="custom-dropdown-item locale-menu-trigger" @click.stop="toggleLocaleMenu">
            <el-icon><Monitor /></el-icon>
            <span>{{ t('layout.header.language') }}</span>
            <el-icon class="submenu-arrow"><ArrowRight /></el-icon>
            <div class="locale-submenu" v-if="localeSubmenuVisible">
              <div class="custom-dropdown-item" :class="{ selected: state.locale === 'zh-CN' }" @click.stop="handleLocaleChange('zh-CN')">
                <span>中文</span>
              </div>
              <div class="custom-dropdown-item" :class="{ selected: state.locale === 'en-US' }" @click.stop="handleLocaleChange('en-US')">
                <span>English</span>
              </div>
            </div>
          </div>
          <div class="custom-dropdown-item" @click="handleAbout">
            <el-icon><Help /></el-icon>
            <span>{{ t('layout.header.about') }}</span>
          </div>
        </div>
      </div>
      <div class="window-controls-placeholder"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Folder, Setting, Plus, Document, Edit, Help, Monitor, Tools, Moon, ArrowRight, Sunny } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { uiActions } from '../../services/uiActions';
import { useUiState } from '../../state/uiState';

const dropdownVisible = ref(false);
const settingDropdownVisible = ref(false);
const themeSubmenuVisible = ref(false);
const localeSubmenuVisible = ref(false);
const { t } = useI18n();
const { state } = useUiState();

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value;
  settingDropdownVisible.value = false;
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
};

const toggleSettingDropdown = () => {
  settingDropdownVisible.value = !settingDropdownVisible.value;
  dropdownVisible.value = false;
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
};

const handleNew = () => {
  console.log('新建文件');
  dropdownVisible.value = false;
};

const handleOpenFile = async () => {
  const filePath = await uiActions.openFileToHistory();
  if (filePath) {
    console.log('选择的文件:', filePath);
  }
  dropdownVisible.value = false;
};

const handleOpenFolder = async () => {
  const folderPath = await uiActions.openFolder();
  if (folderPath) {
    console.log('选择的目录:', folderPath);
  }
  dropdownVisible.value = false;
};

const handleSettings = () => {
  settingDropdownVisible.value = false;
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
};

const handlePreferences = () => {
  settingDropdownVisible.value = false;
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
};

const handleAbout = () => {
  settingDropdownVisible.value = false;
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
};

const toggleThemeMenu = () => {
  themeSubmenuVisible.value = !themeSubmenuVisible.value;
  localeSubmenuVisible.value = false;
};

const handleThemeChange = (theme: 'dark' | 'light') => {
  void uiActions.setTheme(theme);
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
  settingDropdownVisible.value = false;
};

const toggleLocaleMenu = () => {
  localeSubmenuVisible.value = !localeSubmenuVisible.value;
  themeSubmenuVisible.value = false;
};

const handleLocaleChange = (locale: 'zh-CN' | 'en-US') => {
  void uiActions.setLocale(locale);
  localeSubmenuVisible.value = false;
  themeSubmenuVisible.value = false;
  settingDropdownVisible.value = false;
};

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
    themeSubmenuVisible.value = false;
    localeSubmenuVisible.value = false;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'F' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    toggleDropdown();
  }
  if (event.key === 'Escape') {
    dropdownVisible.value = false;
    settingDropdownVisible.value = false;
    themeSubmenuVisible.value = false;
    localeSubmenuVisible.value = false;
  }
};

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
.app-header {
  /* 规则：header 高度 = main overlay 高度(34px) + 1px，避免右上角控件遮挡底边线 */
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: var(--app-bg-elevated);
  border-bottom: 1px solid var(--app-border);
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
  /* 与 .app-header 保持一致，保证右上角底边线连续 */
  height: 35px;
  -webkit-app-region: no-drag;
  border-bottom: 1px solid var(--app-border);
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 10px;
  border: none;
  background-color: var(--app-bg-elevated);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--app-text-regular);
  transition: background-color 0.2s ease, color 0.2s ease;
  height: 24px;
  -webkit-app-region: no-drag;
}

.header-btn :deep(.el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.header-btn span {
  display: inline-flex;
  align-items: center;
  line-height: 1;
  transform: translateY(-0.5px);
}

.header-btn:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.custom-dropdown {
  position: relative;
  display: inline-block;
  -webkit-app-region: no-drag;
}

.custom-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 150px;
  margin-top: 2px;
}

.app-header-right .custom-dropdown-menu {
  left: auto;
  right: 0;
}

.custom-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  color: var(--app-text-regular);
  transition: all 0.3s;
  font-size: 12px;
}

.theme-menu-trigger {
  position: relative;
}

.locale-menu-trigger {
  position: relative;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.8;
}

.theme-submenu {
  position: absolute;
  top: -1px;
  left: calc(100% + 4px);
  min-width: 120px;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.locale-submenu {
  position: absolute;
  top: -1px;
  left: calc(100% + 4px);
  min-width: 120px;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.theme-submenu .custom-dropdown-item {
  justify-content: flex-start;
}

.locale-submenu .custom-dropdown-item {
  justify-content: flex-start;
}

.theme-submenu .custom-dropdown-item.selected {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.locale-submenu .custom-dropdown-item.selected {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.custom-dropdown-item :deep(.el-icon) {
  font-size: 14px;
  line-height: 1;
}

.custom-dropdown-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
</style>
