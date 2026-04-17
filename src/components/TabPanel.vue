<template>
  <div class="tab-panel">
    <div class="tab-bar">
      <div class="tab-item active" v-for="tab in tabs" :key="tab.id">
        <span class="tab-title">{{ tab.title }}</span>
        <button class="tab-close" @click="closeTab(tab.id)">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
    <div class="tab-content">
      <!-- 标签内容 -->
      <div class="tab-content-placeholder">
        标签内容区域
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Close } from '@element-plus/icons-vue';

interface Tab {
  id: string;
  title: string;
  content: string;
}

const tabs = ref<Tab[]>([
  { id: '1', title: '文件1', content: '内容1' },
  { id: '2', title: '文件2', content: '内容2' }
]);



const closeTab = (id: string) => {
  tabs.value = tabs.value.filter(tab => tab.id !== id);
};
</script>

<style scoped>
.tab-panel {
  background-color: #1e1e1e;
  border-top: 1px solid #424242;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-bar {
  background-color: #252526;
  border-bottom: 1px solid #424242;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 32px;
  overflow-x: auto;
  margin: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 24px;
  background-color: #333333;
  border: 1px solid #424242;
  border-radius: 3px 3px 0 0;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  color: #cccccc;
  white-space: nowrap;
}

.tab-item.active {
  background-color: #1e1e1e;
  border-bottom-color: #1e1e1e;
  color: #e1e1e1;
}

.tab-item:hover {
  background-color: #3a3a3a;
  color: #e1e1e1;
}

.tab-close {
  width: 16px;
  height: 16px;
  border: none;
  background-color: transparent;
  color: #999999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.3s;
}

.tab-close:hover {
  background-color: #444444;
  color: #e1e1e1;
}



.tab-content {
  flex: 1;
  background-color: #1e1e1e;
  overflow: hidden;
}

.tab-content-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  font-size: 14px;
}
</style>