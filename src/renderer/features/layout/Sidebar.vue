<template>
  <div class="main-sidebar">
    <button class="sidebar-btn" :title="t('layout.sidebar.home')" @click="$emit('button-click', 'home')">
      <el-icon><House /></el-icon>
    </button>
    <button class="sidebar-btn" :title="t('layout.sidebar.file')" @click="$emit('button-click', 'file')">
      <el-icon><Folder /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { House, Folder } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

defineEmits<{
  (e: 'button-click', view: string): void;
}>();
</script>

<style scoped>
.main-sidebar {
  width: 33px;
  background-color: var(--app-bg-elevated);
  border-right: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
}

.sidebar-btn {
  width: 24px;
  height: 24px;
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

.sidebar-btn:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
</style>
