<template>
  <div class="app-root">
    <MainLayout />
  </div>
</template>

<script setup lang="ts">
import MainLayout from './components/MainLayout.vue';
</script>

<style>
/* 全局样式 */
:root {
  --el-bg-color: #f5f7fa;
  --el-border-color: #e4e7ed;
  --el-fill-color-light: #f2f6fc;
  --el-text-primary: #303133;
  --el-text-secondary: #606266;
  --el-text-tertiary: #909399;
  --fluent-border: #e4e7ed;
  --fluent-surface: #ffffff;
  --fluent-surface-hover: #f5f7fa;
  --fluent-text-primary: #303133;
  --fluent-text-secondary: #606266;
  --fluent-text-tertiary: #909399;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  background-color: var(--el-bg-color);
}

.app-root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color);
}
</style>