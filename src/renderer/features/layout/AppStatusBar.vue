<template>
  <div class="app-status-bar">
    <div class="status-item">状态: 正常</div>
    <div class="status-item">版本: 1.0.0</div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-status-bar {
  height: 24px;
  flex-shrink: 0;
  background-color: #252526;
  border-top: 1px solid #424242;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: #cccccc;
}

.status-item {
  margin-right: 20px;
}
</style>
