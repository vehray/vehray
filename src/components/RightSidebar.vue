<template>
  <div class="right-sidebar">
    <button class="sidebar-btn" title="属性" @click="$emit('toggle-activity')">
      <el-icon><Operation /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Operation } from '@element-plus/icons-vue';

const emit = defineEmits<{
  (e: 'toggle-activity'): void;
}>();
</script>

<style scoped>
/* 右侧功能按钮栏 */
.right-sidebar {
  width: 33px;
  background-color: #252526;
  border-left: 1px solid #424242;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
}

/* 侧栏按钮 */
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

.sidebar-btn:focus {
  outline: none;
}
</style>