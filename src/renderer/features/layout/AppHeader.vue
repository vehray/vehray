<template>
  <div class="app-header" @mousemove="handleHeaderInteraction">
    <div class="app-header-left">
      <img src="../../../assets/icons/logo.svg" alt="Logo" class="app-logo" />
      <div class="custom-dropdown" @click="toggleDropdown" @mouseenter="handleLeftDropdownHover('file')">
        <button class="header-btn">
          <el-icon><Folder /></el-icon>
          <span class="menu-label">
            {{ t('layout.header.file') }}(<span :class="{ 'mnemonic-active': isAltPressed }">F</span>)
          </span>
        </button>
        <div class="custom-dropdown-menu" v-if="dropdownVisible">
          <div class="custom-dropdown-item new-menu-trigger" @click.stop="toggleNewMenu" @mouseenter="openNewSubmenu">
            <el-icon><Plus /></el-icon>
            <span>{{ t('common.newFile') }}</span>
            <el-icon class="submenu-arrow"><ArrowRight /></el-icon>
            <div class="new-submenu" v-if="newSubmenuVisible">
              <div class="custom-dropdown-item" @click.stop="handleNewProject">
                <el-icon><Plus /></el-icon>
                <span>{{ t('layout.header.newProject') }}</span>
              </div>
              <div class="custom-dropdown-item ldf-standard-trigger" @click.stop="openLdfStandardSubmenu" @mouseenter="openLdfStandardSubmenu">
                <el-icon><Plus /></el-icon>
                <span>{{ t('layout.header.newLdfFile') }}</span>
                <el-icon class="submenu-arrow"><ArrowRight /></el-icon>
                <div class="ldf-standard-submenu" v-if="ldfStandardSubmenuVisible">
                  <div class="custom-dropdown-item" @click.stop="handleCreateLdfFile('LDF 1.3')">
                    <span>LDF 1.3</span>
                  </div>
                  <div class="custom-dropdown-item is-disabled">
                    <span>LDF 2.0</span>
                  </div>
                  <div class="custom-dropdown-item is-disabled">
                    <span>LDF 2.1</span>
                  </div>
                  <div class="custom-dropdown-item is-disabled">
                    <span>LDF 2.2</span>
                  </div>
                  <div class="custom-dropdown-item is-disabled">
                    <span>SAE J2602:2012</span>
                  </div>
                  <div class="custom-dropdown-item is-disabled">
                    <span>ISO 17987:2015</span>
                  </div>
                  <div class="custom-dropdown-item is-disabled">
                    <span>SAE J2602:2021</span>
                  </div>
                  <div class="custom-dropdown-item is-disabled">
                    <span>OEM variant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="custom-dropdown-item" @click="handleOpenFile">
            <el-icon><Document /></el-icon>
            <span>{{ t('layout.header.openFile') }}</span>
            <span class="shortcut-hint">{{ openFileShortcut }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handleOpenFolder">
            <el-icon><Folder /></el-icon>
            <span>{{ t('layout.header.openFolder') }}</span>
            <span class="shortcut-hint">{{ openFolderShortcut }}</span>
          </div>
          <div class="menu-divider"></div>
          <div class="custom-dropdown-item" @click="handleSaveFile">
            <el-icon><Document /></el-icon>
            <span>{{ t('layout.header.save') }}</span>
            <span class="shortcut-hint">{{ saveFileShortcut }}</span>
          </div>
        </div>
      </div>
      <div class="custom-dropdown" @click="toggleEditDropdown" @mouseenter="handleLeftDropdownHover('edit')">
        <button class="header-btn">
          <el-icon><Edit /></el-icon>
          <span class="menu-label">{{ t('layout.header.edit') }}(<span class="mnemonic-char" :class="{ 'mnemonic-active': isAltPressed }">E</span>)</span>
        </button>
        <div class="custom-dropdown-menu" v-if="editDropdownVisible">
          <div class="custom-dropdown-item" @click="handlePlaceholderAction">
            <el-icon><Edit /></el-icon>
            <span>{{ t('layout.header.placeholderEdit1') }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handlePlaceholderAction">
            <el-icon><Edit /></el-icon>
            <span>{{ t('layout.header.placeholderEdit2') }}</span>
          </div>
        </div>
      </div>
      <div class="custom-dropdown" @click="toggleToolsDropdown" @mouseenter="handleLeftDropdownHover('tools')">
        <button class="header-btn">
          <el-icon><Tools /></el-icon>
          <span class="menu-label">{{ t('layout.header.tools') }}(<span class="mnemonic-char" :class="{ 'mnemonic-active': isAltPressed }">T</span>)</span>
        </button>
        <div class="custom-dropdown-menu" v-if="toolsDropdownVisible">
          <div class="custom-dropdown-item" @click="handleOpenLinLdfEditor">
            <el-icon><Tools /></el-icon>
            <span>{{ t('layout.header.linLdfEditor') }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handlePlaceholderAction">
            <el-icon><Tools /></el-icon>
            <span>{{ t('layout.header.placeholderTools2') }}</span>
          </div>
        </div>
      </div>
      <div class="custom-dropdown" @click="toggleWindowDropdown" @mouseenter="handleLeftDropdownHover('window')">
        <button class="header-btn">
          <el-icon><Monitor /></el-icon>
          <span class="menu-label">{{ t('layout.header.window') }}(<span class="mnemonic-char" :class="{ 'mnemonic-active': isAltPressed }">W</span>)</span>
        </button>
        <div class="custom-dropdown-menu" v-if="windowDropdownVisible">
          <div class="custom-dropdown-item" @click="handlePlaceholderAction">
            <el-icon><Monitor /></el-icon>
            <span>{{ t('layout.header.placeholderWindow1') }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handlePlaceholderAction">
            <el-icon><Monitor /></el-icon>
            <span>{{ t('layout.header.placeholderWindow2') }}</span>
          </div>
        </div>
      </div>
      <div class="custom-dropdown" @click="toggleHelpDropdown" @mouseenter="handleLeftDropdownHover('help')">
        <button class="header-btn">
          <el-icon><Help /></el-icon>
          <span class="menu-label">{{ t('layout.header.help') }}(<span class="mnemonic-char" :class="{ 'mnemonic-active': isAltPressed }">H</span>)</span>
        </button>
        <div class="custom-dropdown-menu" v-if="helpDropdownVisible">
          <div class="custom-dropdown-item" @click="handleAbout">
            <el-icon><Help /></el-icon>
            <span>{{ t('layout.header.about') }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="app-header-right">
      <div class="custom-dropdown" @click="toggleAvatarDropdown" @mouseenter="handleRightDropdownHover('account')">
        <el-tooltip
          :content="accountTooltipText"
          placement="bottom"
          :show-after="250"
          :disabled="isAccountTooltipDisabled"
          popper-class="app-unified-tooltip"
        >
          <button class="avatar-btn" type="button">
            <span class="avatar-text">{{ avatarText }}</span>
            <span class="avatar-status-dot" :class="avatarStatusClass"></span>
          </button>
        </el-tooltip>
        <div class="custom-dropdown-menu account-dropdown-menu" v-if="avatarDropdownVisible">
          <div class="custom-dropdown-item account-status-item">
            <span class="status-dot-inline" :class="avatarStatusClass"></span>
            <span>{{ accountStatusText }}</span>
          </div>
          <div v-if="loginStatus === 'loggedIn'" class="account-detail-panel">
            <div class="account-detail-row">
              <span class="account-detail-label">{{ t('layout.header.accountName') }}</span>
              <span class="account-detail-value">{{ accountProfile.name }}</span>
            </div>
            <div class="account-detail-row">
              <span class="account-detail-label">{{ t('layout.header.accountEmail') }}</span>
              <span class="account-detail-value">{{ accountProfile.email }}</span>
            </div>
            <div class="account-detail-row">
              <span class="account-detail-label">{{ t('layout.header.accountTier') }}</span>
              <span class="account-detail-value">{{ accountProfile.tier }}</span>
            </div>
            <div class="account-detail-row">
              <span class="account-detail-label">{{ t('layout.header.accountLastLogin') }}</span>
              <span class="account-detail-value">{{ accountProfile.lastLogin }}</span>
            </div>
          </div>
          <div v-if="loginStatus !== 'loggedIn'" class="custom-dropdown-item" @click="handleLogin">
            <el-icon><User /></el-icon>
            <span>{{ t('layout.header.loginEntry') }}</span>
          </div>
          <div v-else class="custom-dropdown-item" @click="handleAccountCenter">
            <el-icon><UserFilled /></el-icon>
            <span>{{ t('layout.header.accountCenter') }}</span>
          </div>
          <div v-if="loginStatus === 'loggedIn'" class="custom-dropdown-item" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>{{ t('layout.header.logout') }}</span>
          </div>
        </div>
      </div>
      <div class="custom-dropdown" @click="toggleSettingDropdown" @mouseenter="handleRightDropdownHover('settings')">
        <el-tooltip
          :content="settingsTooltipText"
          placement="bottom"
          :show-after="250"
          :disabled="isSettingsTooltipDisabled"
          popper-class="app-unified-tooltip"
        >
          <button class="header-btn" type="button">
            <el-icon><Setting /></el-icon>
          </button>
        </el-tooltip>
        <div class="custom-dropdown-menu" v-if="settingDropdownVisible">
          <div class="custom-dropdown-item" @click="handleSettings">
            <el-icon><Setting /></el-icon>
            <span>{{ t('layout.header.settings') }}</span>
          </div>
          <div class="custom-dropdown-item" @click="handlePreferences">
            <el-icon><Tools /></el-icon>
            <span>{{ t('layout.header.preferences') }}</span>
          </div>
          <div class="custom-dropdown-item theme-menu-trigger" @click.stop="toggleThemeMenu" @mouseenter="openThemeSubmenu">
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
          <div class="custom-dropdown-item locale-menu-trigger" @click.stop="toggleLocaleMenu" @mouseenter="openLocaleSubmenu">
            <el-icon><Monitor /></el-icon>
            <span>{{ t('layout.header.language') }}</span>
            <el-icon class="submenu-arrow"><ArrowRight /></el-icon>
            <div class="locale-submenu" v-if="localeSubmenuVisible">
              <div
                v-for="item in localeOptions"
                :key="item.value"
                class="custom-dropdown-item"
                :class="{ selected: state.locale === item.value }"
                @click.stop="handleLocaleChange(item.value)"
              >
                <span class="locale-flag" aria-hidden="true">{{ item.flag }}</span>
                <span>{{ item.label }}</span>
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
import { computed, ref, onMounted, onUnmounted } from 'vue';
import {
  Folder,
  Setting,
  Plus,
  Document,
  Edit,
  Help,
  Monitor,
  Tools,
  Moon,
  ArrowRight,
  Sunny,
  User,
  UserFilled,
  SwitchButton
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { uiActions } from '../../services/uiActions';
import { useUiState } from '../../state/uiState';
import { shortcutService } from '../../services/shortcutService';

const dropdownVisible = ref(false);
const settingDropdownVisible = ref(false);
const editDropdownVisible = ref(false);
const toolsDropdownVisible = ref(false);
const windowDropdownVisible = ref(false);
const helpDropdownVisible = ref(false);
const themeSubmenuVisible = ref(false);
const localeSubmenuVisible = ref(false);
const newSubmenuVisible = ref(false);
const ldfStandardSubmenuVisible = ref(false);
const avatarDropdownVisible = ref(false);
const loginStatus = ref<'loggedOut' | 'loggingIn' | 'loggedIn'>('loggedOut');
const isAltPressed = ref(false);
const AUTO_CLOSE_DELAY_MS = 2200;
let autoCloseTimer: number | null = null;
const accountProfile = {
  name: 'Vehray User',
  email: 'user@vehray.app',
  tier: 'Pro',
  lastLogin: '2026-04-23 10:30'
};
const { t } = useI18n();
const { state } = useUiState();
const openFileShortcut = shortcutService.getBinding('openFile');
const openFolderShortcut = shortcutService.getBinding('openFolder');
const saveFileShortcut = shortcutService.getBinding('saveFile');
type LeftDropdownType = 'file' | 'edit' | 'tools' | 'window' | 'help';
type RightDropdownType = 'settings' | 'account';
type LocaleType = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR';

const localeOptions: Array<{ value: LocaleType; flag: string; label: string }> = [
  { value: 'zh-CN', flag: '🇨🇳', label: '简体中文' },
  { value: 'zh-TW', flag: '🇹🇼', label: '繁體中文' },
  { value: 'en-US', flag: '🇺🇸', label: 'English' },
  { value: 'ja-JP', flag: '🇯🇵', label: '日本語' },
  { value: 'ko-KR', flag: '🇰🇷', label: '한국어' }
];

const hasAnyLeftDropdownOpen = computed(
  () => dropdownVisible.value || editDropdownVisible.value || toolsDropdownVisible.value || windowDropdownVisible.value || helpDropdownVisible.value
);
const hasAnyRightDropdownOpen = computed(() => settingDropdownVisible.value || avatarDropdownVisible.value);

const closeAllDropdowns = () => {
  if (autoCloseTimer !== null) {
    window.clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  dropdownVisible.value = false;
  settingDropdownVisible.value = false;
  avatarDropdownVisible.value = false;
  editDropdownVisible.value = false;
  toolsDropdownVisible.value = false;
  windowDropdownVisible.value = false;
  helpDropdownVisible.value = false;
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
  newSubmenuVisible.value = false;
  ldfStandardSubmenuVisible.value = false;
};

const scheduleAutoClose = () => {
  if (autoCloseTimer !== null) {
    window.clearTimeout(autoCloseTimer);
  }
  autoCloseTimer = window.setTimeout(() => {
    closeAllDropdowns();
  }, AUTO_CLOSE_DELAY_MS);
};

const handleHeaderInteraction = () => {
  if (!hasAnyLeftDropdownOpen.value && !hasAnyRightDropdownOpen.value) return;
  scheduleAutoClose();
};

const activateLeftDropdown = (type: LeftDropdownType) => {
  dropdownVisible.value = type === 'file';
  editDropdownVisible.value = type === 'edit';
  toolsDropdownVisible.value = type === 'tools';
  windowDropdownVisible.value = type === 'window';
  helpDropdownVisible.value = type === 'help';
  newSubmenuVisible.value = false;
  ldfStandardSubmenuVisible.value = false;
  scheduleAutoClose();
};

const activateRightDropdown = (type: RightDropdownType) => {
  settingDropdownVisible.value = type === 'settings';
  avatarDropdownVisible.value = type === 'account';
  themeSubmenuVisible.value = false;
  localeSubmenuVisible.value = false;
  scheduleAutoClose();
};

const avatarStatusClass = computed(() => {
  if (loginStatus.value === 'loggedIn') return 'status-green';
  if (loginStatus.value === 'loggingIn') return 'status-yellow';
  return 'status-red';
});

const accountStatusText = computed(() => {
  if (loginStatus.value === 'loggedIn') return t('layout.header.loginStatusLoggedIn');
  if (loginStatus.value === 'loggingIn') return t('layout.header.loginStatusPending');
  return t('layout.header.loginStatusLoggedOut');
});

const accountTooltipText = computed(() => {
  if (loginStatus.value === 'loggedIn') return t('layout.header.loginStatusLoggedIn');
  if (loginStatus.value === 'loggingIn') return t('layout.header.loginStatusPending');
  return t('layout.header.login');
});
const settingsTooltipText = computed(() => t('layout.header.settings'));
const isAccountTooltipDisabled = computed(() => avatarDropdownVisible.value || settingDropdownVisible.value);
const isSettingsTooltipDisabled = computed(() => avatarDropdownVisible.value || settingDropdownVisible.value);

const avatarText = computed(() => (loginStatus.value === 'loggedIn' ? 'U' : 'L'));

const handleLeftDropdownHover = (type: LeftDropdownType) => {
  if (!hasAnyLeftDropdownOpen.value) return;
  activateLeftDropdown(type);
};

const handleRightDropdownHover = (type: RightDropdownType) => {
  if (!hasAnyRightDropdownOpen.value) return;
  activateRightDropdown(type);
};

const toggleDropdown = () => {
  if (dropdownVisible.value) {
    closeAllDropdowns();
    return;
  }
  activateLeftDropdown('file');
};

const toggleSettingDropdown = () => {
  if (settingDropdownVisible.value) {
    closeAllDropdowns();
    return;
  }
  activateRightDropdown('settings');
};

const toggleAvatarDropdown = () => {
  if (avatarDropdownVisible.value) {
    closeAllDropdowns();
    return;
  }
  activateRightDropdown('account');
};

const toggleEditDropdown = () => {
  if (editDropdownVisible.value) {
    closeAllDropdowns();
    return;
  }
  activateLeftDropdown('edit');
};

const toggleToolsDropdown = () => {
  if (toolsDropdownVisible.value) {
    closeAllDropdowns();
    return;
  }
  activateLeftDropdown('tools');
};

const toggleWindowDropdown = () => {
  if (windowDropdownVisible.value) {
    closeAllDropdowns();
    return;
  }
  activateLeftDropdown('window');
};

const toggleHelpDropdown = () => {
  if (helpDropdownVisible.value) {
    closeAllDropdowns();
    return;
  }
  activateLeftDropdown('help');
};

const handleNew = () => {
  console.log('新建文件');
  dropdownVisible.value = false;
};

const toggleNewMenu = () => {
  if (!dropdownVisible.value) return;
  newSubmenuVisible.value = true;
  ldfStandardSubmenuVisible.value = false;
  scheduleAutoClose();
};

const openNewSubmenu = () => {
  if (!dropdownVisible.value) return;
  newSubmenuVisible.value = true;
  ldfStandardSubmenuVisible.value = false;
  scheduleAutoClose();
};

const openLdfStandardSubmenu = () => {
  if (!dropdownVisible.value || !newSubmenuVisible.value) return;
  ldfStandardSubmenuVisible.value = true;
  scheduleAutoClose();
};

const handleNewProject = async () => {
  await uiActions.openProject();
  closeAllDropdowns();
};

const handleCreateLdfFile = async (standard?: string) => {
  await uiActions.createLdfFile(standard);
  closeAllDropdowns();
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

const handleSaveFile = async () => {
  await uiActions.saveActiveTab();
  dropdownVisible.value = false;
};

const handleOpenLinLdfEditor = () => {
  uiActions.openLinLdfEditor();
  closeAllDropdowns();
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

const handleAbout = async () => {
  await window.electron?.ipcRenderer?.invoke?.('app:show-about-dialog');
  closeAllDropdowns();
};

const handleLogin = () => {
  loginStatus.value = 'loggingIn';
  window.setTimeout(() => {
    loginStatus.value = 'loggedIn';
  }, 800);
  closeAllDropdowns();
};

const handleLogout = () => {
  loginStatus.value = 'loggedOut';
  closeAllDropdowns();
};

const handleAccountCenter = () => {
  closeAllDropdowns();
};

const toggleThemeMenu = () => {
  themeSubmenuVisible.value = !themeSubmenuVisible.value;
  localeSubmenuVisible.value = false;
};

const openThemeSubmenu = () => {
  if (!settingDropdownVisible.value) return;
  themeSubmenuVisible.value = true;
  localeSubmenuVisible.value = false;
  scheduleAutoClose();
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

const openLocaleSubmenu = () => {
  if (!settingDropdownVisible.value) return;
  localeSubmenuVisible.value = true;
  themeSubmenuVisible.value = false;
  scheduleAutoClose();
};

const handleLocaleChange = (locale: LocaleType) => {
  void uiActions.setLocale(locale);
  localeSubmenuVisible.value = false;
  themeSubmenuVisible.value = false;
  settingDropdownVisible.value = false;
};

const handlePlaceholderAction = () => {
  closeAllDropdowns();
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
    closeAllDropdowns();
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Alt') {
    isAltPressed.value = true;
  }
  if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    dropdownVisible.value = true;
    settingDropdownVisible.value = false;
    editDropdownVisible.value = false;
    toolsDropdownVisible.value = false;
    windowDropdownVisible.value = false;
    helpDropdownVisible.value = false;
    themeSubmenuVisible.value = false;
    localeSubmenuVisible.value = false;
  }
  if (event.key === 'Escape') {
    closeAllDropdowns();
  }
};

const handleKeyup = (event: KeyboardEvent) => {
  if (event.key === 'Alt') {
    isAltPressed.value = false;
  }
};

const handleWindowBlur = () => {
  isAltPressed.value = false;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('keyup', handleKeyup);
  window.addEventListener('blur', handleWindowBlur);
});

onUnmounted(() => {
  if (autoCloseTimer !== null) {
    window.clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('keyup', handleKeyup);
  window.removeEventListener('blur', handleWindowBlur);
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

.header-btn > span {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.menu-label {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.menu-label .mnemonic-char {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.menu-label .mnemonic-active {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.header-btn:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.avatar-btn {
  width: 20px;
  height: 20px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg-hover);
  border-radius: 999px;
  color: var(--app-text-regular);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  position: relative;
  transform: translateY(-1px);
}

.avatar-btn:hover {
  background-color: var(--app-accent);
  border-color: var(--app-accent);
  color: #fff;
}

.avatar-text {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.avatar-status-dot {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  right: -2px;
  bottom: -2px;
  border: 1px solid var(--app-bg-elevated);
}

.status-dot-inline {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.status-red {
  background-color: #ef4444;
}

.status-yellow {
  background-color: #f59e0b;
}

.status-green {
  background-color: #22c55e;
}

.account-dropdown-menu {
  min-width: 230px;
}

.account-status-item {
  cursor: default;
  opacity: 0.9;
}

.account-detail-panel {
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.account-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.account-detail-label {
  font-size: 12px;
  opacity: 0.72;
}

.account-detail-value {
  font-size: 12px;
  color: var(--app-text-primary);
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  width: max-content;
  min-width: max-content;
  max-width: min(80vw, 420px);
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
  white-space: nowrap;
}

.shortcut-hint {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.72;
}

.menu-divider {
  height: 1px;
  margin: 4px 8px;
  background-color: var(--app-border);
}

.theme-menu-trigger {
  position: relative;
}

.locale-menu-trigger {
  position: relative;
}

.new-menu-trigger {
  position: relative;
}

.ldf-standard-trigger {
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
  width: max-content;
  min-width: max-content;
  max-width: min(80vw, 420px);
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
  width: max-content;
  min-width: max-content;
  max-width: min(80vw, 420px);
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.new-submenu {
  position: absolute;
  top: -1px;
  left: calc(100% + 4px);
  width: max-content;
  min-width: max-content;
  max-width: min(80vw, 420px);
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.ldf-standard-submenu {
  position: absolute;
  top: -1px;
  left: calc(100% + 4px);
  width: max-content;
  min-width: max-content;
  max-width: min(80vw, 420px);
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1002;
}

.ldf-standard-submenu .custom-dropdown-item.is-disabled {
  color: var(--app-text-muted);
  cursor: not-allowed;
  pointer-events: none;
}

.theme-submenu .custom-dropdown-item {
  justify-content: flex-start;
}

.locale-submenu .custom-dropdown-item {
  justify-content: flex-start;
}

.locale-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  margin-right: 2px;
  font-size: 13px;
  line-height: 1;
  font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
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
