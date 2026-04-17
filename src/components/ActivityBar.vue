<template>
  <div 
    class="activity-bar" 
    :class="{ 'activity-bar-right': position === 'right' }"
  >
    <div class="activity-bar-header">
      <span class="activity-bar-title">{{ title }}</span>
      <div class="activity-bar-actions" :class="{ 'activity-bar-actions-right': position === 'right' }">
        <!-- 左侧活动栏：浮动按钮在左，关闭按钮在右 -->
        <template v-if="position === 'left'">
          <button class="action-btn" title="浮动/停靠" @click="toggleFloat">
            <el-icon :size="14"><Menu /></el-icon>
          </button>
          <button class="action-btn" title="关闭" @click="close">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </template>
        <!-- 右侧活动栏：关闭按钮在左，浮动按钮在右 -->
        <template v-else>
          <button class="action-btn" title="关闭" @click="close">
            <el-icon :size="14"><Close /></el-icon>
          </button>
          <button class="action-btn" title="浮动/停靠" @click="toggleFloat">
            <el-icon :size="14"><Menu /></el-icon>
          </button>
        </template>
      </div>
    </div>
    <div class="activity-bar-content">
      <!-- 活动栏内容 -->
      <div v-if="items.length > 0" class="activity-items-container">
        <div class="activity-item" v-for="item in items" :key="item.id" :title="item.title">
          <el-icon :size="16">{{ item.icon }}</el-icon>
        </div>
      </div>
      
      <!-- 属性内容 -->
      <div v-if="properties && properties.length > 0" class="properties-container">
        <div class="property-item" v-for="property in properties" :key="property.id">
          <div class="property-label">{{ property.label }}</div>
          <div class="property-value">{{ property.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { House, Search, Folder, Setting, Bell, Timer, ChatLineRound, Operation, Close, Menu } from '@element-plus/icons-vue';

interface ActivityItem {
  id: string;
  title: string;
  icon: any;
}

interface Property {
  id: string;
  label: string;
  value: string;
}

const props = withDefaults(defineProps<{
  title: string;
  items: ActivityItem[];
  properties?: Property[];
  customWidth?: number;
  position?: 'left' | 'right';
}>(), {
  customWidth: 200,
  position: 'left',
  properties: () => []
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-float'): void;
}>();

const close = () => {
  emit('close');
};

const toggleFloat = () => {
  emit('toggle-float');
};
</script>

<style scoped>
.activity-bar {
  min-width: 200px;
  max-width: 400px;
  background-color: #1e1e1e;
  border-right: 1px solid #424242;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
}

.activity-bar-right {
  border-right: none;
  border-left: 1px solid #424242;
}

.activity-bar-header {
  padding: 8px 12px;
  border-bottom: 1px solid #424242;
  background-color: #252526;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  box-sizing: border-box;
}

/* 右侧活动栏的头部布局 */
.activity-bar-right .activity-bar-header {
  flex-direction: row-reverse;
}

.activity-bar-title {
  font-size: 12px;
  color: #cccccc;
  font-weight: 500;
}

.activity-bar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 20px;
  height: 20px;
  border: none;
  background-color: transparent;
  color: #cccccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.3s;
}

.action-btn:hover {
  background-color: #333333;
  color: #e1e1e1;
}

/* 右侧活动栏的按钮顺序 */
.activity-bar-actions-right {
  flex-direction: row;
}

.activity-bar-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

/* 属性项样式 */
.property-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-label {
  font-size: 11px;
  color: #999999;
  font-weight: 500;
}

.property-value {
  font-size: 12px;
  color: #cccccc;
  background-color: #252526;
  border: 1px solid #424242;
  border-radius: 3px;
  padding: 6px 8px;
  min-height: 24px;
  display: flex;
  align-items: center;
}

.property-value:hover {
  background-color: #2d2d2d;
  border-color: #555555;
}

.activity-items-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #424242;
}

.activity-item {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cccccc;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.3s;
}

.activity-item:hover {
  background-color: #333333;
  color: #e1e1e1;
}

.properties-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>