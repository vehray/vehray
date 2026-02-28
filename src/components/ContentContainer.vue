<template>
  <div class="content-container">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
// ContentContainer组件，用于统一标签页内容的布局和对齐
</script>

<style scoped>
/* Fluent Design System 样式变量 */
:root {
  /* 主要颜色 */
  --fluent-primary: #0078d4;
  --fluent-primary-hover: #106ebe;
  --fluent-primary-pressed: #005a9e;
  
  /* 背景颜色 */
  --fluent-background: #ffffff;
  --fluent-surface: #f3f2f1;
  --fluent-surface-hover: #e5e5e5;
  --fluent-surface-pressed: #d9d9d9;
  
  /* 文本颜色 */
  --fluent-text-primary: #111827;
  --fluent-text-secondary: #374151;
  --fluent-text-tertiary: #6b7280;
  --fluent-text-disabled: #9ca3af;
  
  /* 边框和阴影 */
  --fluent-border: #e5e7eb;
  --fluent-border-hover: #d1d5db;
  --fluent-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  --fluent-shadow-hover: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  
  /* 过渡效果 */
  --fluent-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 内容容器 */
.content-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  background-color: var(--fluent-background);
  display: flex;
  flex-direction: column;
}

/* 标题样式 */
.content-container h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--fluent-text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--fluent-primary);
  letter-spacing: 0.25px;
}

/* 卡片样式 */
.content-container .config-card {
  margin: 0 0 16px 0;
  border-radius: 4px;
  box-shadow: var(--fluent-shadow);
  transition: var(--fluent-transition);
}

.content-container .config-card:hover {
  box-shadow: var(--fluent-shadow-hover);
}

/* 标签页样式 */
.content-container :deep(.el-tabs--border-card) {
  border-radius: 4px;
  overflow: hidden;
}

.content-container :deep(.el-tabs--border-card > .el-tabs__content) {
  padding: 16px;
}

/* 表单样式 */
.content-container :deep(.el-form) {
  width: 100%;
}

.content-container :deep(.el-form-item) {
  margin-bottom: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .content-container h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .content-container .config-card {
    margin-bottom: 12px;
  }
  
  .content-container :deep(.el-tabs--border-card > .el-tabs__content) {
    padding: 12px;
  }
  
  .content-container :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>