<template>
  <div class="app-status-bar">
    <div class="status-item">{{ t('layout.status.normal') }}</div>
    <div class="status-item">{{ t('layout.status.version', { version: '1.0.0' }) }}</div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style scoped>
.app-status-bar {
  height: var(--app-statusbar-height);
  flex-shrink: 0;
  background-color: var(--app-bg-elevated);
  border-top: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: var(--app-ui-font-size);
  color: var(--app-text-regular);
}

.status-item {
  margin-right: 20px;
}
</style>
