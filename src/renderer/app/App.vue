<template>
  <div class="app-root">
    <AppHeader />
    <MainLayout />
    <AppStatusBar />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import AppHeader from '../features/layout/AppHeader.vue';
import MainLayout from '../features/layout/MainLayout.vue';
import AppStatusBar from '../features/layout/AppStatusBar.vue';
import { shortcutService } from '../services/shortcutService';
import { uiActions } from '../services/uiActions';

let disposeOpenFileShortcut: (() => void) | null = null;
let disposeOpenFolderShortcut: (() => void) | null = null;

onMounted(() => {
  void shortcutService.initialize();
  disposeOpenFileShortcut = shortcutService.onAction('openFile', () => {
    void uiActions.openFileToHistory();
  });
  disposeOpenFolderShortcut = shortcutService.onAction('openFolder', () => {
    void uiActions.openFolder();
  });
});

onUnmounted(() => {
  disposeOpenFileShortcut?.();
  disposeOpenFolderShortcut?.();
  disposeOpenFileShortcut = null;
  disposeOpenFolderShortcut = null;
  shortcutService.dispose();
});
</script>

<style>
:root {
  --el-bg-color: var(--app-bg);
  --el-border-color: var(--app-border);
  --el-fill-color-light: var(--app-bg-elevated);
  --el-text-primary: var(--app-text-primary);
  --el-text-secondary: var(--app-text-regular);
  --el-text-tertiary: var(--app-text-muted);
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
  background-color: var(--app-bg);
  color: var(--app-text-regular);
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--app-scrollbar-thumb) var(--app-scrollbar-track);
}

*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

*::-webkit-scrollbar-track {
  background-color: var(--app-scrollbar-track);
}

*::-webkit-scrollbar-thumb {
  background-color: var(--app-scrollbar-thumb);
  border-radius: 999px;
  border: 2px solid var(--app-scrollbar-track);
}

*::-webkit-scrollbar-thumb:hover {
  background-color: var(--app-scrollbar-thumb-hover);
}

*::-webkit-scrollbar-thumb:active {
  background-color: var(--app-scrollbar-thumb-active);
}

*::-webkit-scrollbar-corner {
  background-color: var(--app-scrollbar-track);
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

.app-root,
.app-root * {
  user-select: none;
  -webkit-user-select: none;
}

.app-root input,
.app-root textarea,
.app-root [contenteditable='true'] {
  user-select: text;
  -webkit-user-select: text;
}

.app-unified-tooltip.el-popper {
  max-width: 260px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background-color: var(--app-bg-elevated);
  color: var(--app-text-regular);
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
}

.app-unified-tooltip .el-popper__arrow {
  display: none;
}
</style>
