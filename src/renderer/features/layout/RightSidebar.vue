<template>
  <div class="right-sidebar">
    <el-tooltip
      :content="propertiesTooltipText"
      placement="left"
      :show-after="250"
      popper-class="app-unified-tooltip"
    >
      <button class="sidebar-btn" @click="$emit('toggle-activity')">
        <el-icon><Operation /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Operation } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const propertiesTooltipText = computed(() => `${t('layout.sidebar.properties')} (Ctrl+Shift+P)`);

defineEmits<{
  (e: 'toggle-activity'): void;
}>();
</script>

<style scoped>
.right-sidebar {
  width: 33px;
  background-color: var(--app-bg-elevated);
  border-left: 1px solid var(--app-border);
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
