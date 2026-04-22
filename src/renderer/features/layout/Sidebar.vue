<template>
  <div class="main-sidebar">
    <button class="sidebar-btn" title="主页" @click="$emit('button-click', 'home')">
      <el-icon><House /></el-icon>
    </button>
    <button class="sidebar-btn" title="文件" @click="$emit('button-click', 'file')">
      <el-icon><Folder /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { House, Folder } from '@element-plus/icons-vue';

defineEmits<{
  (e: 'button-click', view: string): void;
}>();
</script>

<style scoped>
.main-sidebar {
  width: 33px;
  background-color: #252526;
  border-right: 1px solid #424242;
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
  color: #cccccc;
  transition: all 0.3s;
}

.sidebar-btn:hover {
  background-color: #333333;
  color: #e1e1e1;
}
</style>
