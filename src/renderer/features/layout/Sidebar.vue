<template>
  <div class="main-sidebar">
    <el-tooltip :content="homeTooltipText" placement="right" :show-after="250" popper-class="app-unified-tooltip">
      <button class="sidebar-btn" @click="$emit('button-click', 'home')">
        <el-icon><House /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip :content="fileTooltipText" placement="right" :show-after="250" popper-class="app-unified-tooltip">
      <button class="sidebar-btn" @click="$emit('button-click', 'file')">
        <el-icon><Folder /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { House, Folder } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const homeTooltipText = computed(() => `${t('layout.sidebar.home')} (Ctrl+Shift+H)`);
const fileTooltipText = computed(() => `${t('layout.sidebar.file')} (Ctrl+Shift+E)`);

defineEmits<{
  (e: 'button-click', view: string): void;
}>();
</script>

<style scoped>
.main-sidebar {
  width: var(--app-sidebar-width);
  background-color: var(--app-bg-elevated);
  border-right: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
}

.sidebar-btn {
  width: var(--app-icon-hit-size);
  height: var(--app-icon-hit-size);
  border: none;
  background-color: transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-regular);
  transition: all 0.3s;
}

.sidebar-btn :deep(.el-icon) {
  font-size: var(--app-icon-size);
}

.sidebar-btn:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
</style>
