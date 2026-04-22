<template>
  <div class="app-root">
    <AppHeader />
    <MainLayout />
    <AppStatusBar />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../features/layout/AppHeader.vue';
import MainLayout from '../features/layout/MainLayout.vue';
import AppStatusBar from '../features/layout/AppStatusBar.vue';
</script>

<style>
:root {
  --el-bg-color: #f5f7fa;
  --el-border-color: #e4e7ed;
  --el-fill-color-light: #f2f6fc;
  --el-text-primary: #303133;
  --el-text-secondary: #606266;
  --el-text-tertiary: #909399;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.app-root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
