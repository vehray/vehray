<template>
  <div class="activity-bar" :class="{ 'activity-bar-right': position === 'right' }" :style="panelStyle">
    <div class="activity-bar-header">
      <span class="activity-bar-title">{{ title }}</span>
      <div class="activity-bar-actions" :class="{ 'activity-bar-actions-right': position === 'right' }">
        <template v-if="position === 'left'">
          <el-tooltip :content="t('common.close')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
            <button class="action-btn" @click="close">
              <el-icon :size="14"><Close /></el-icon>
            </button>
          </el-tooltip>
        </template>
        <template v-else>
          <el-tooltip :content="t('common.close')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
            <button class="action-btn" @click="close">
              <el-icon :size="14"><Close /></el-icon>
            </button>
          </el-tooltip>
        </template>
      </div>
    </div>
    <div class="activity-bar-content">
      <div v-if="items.length > 0" class="activity-items-container">
        <div class="activity-item" v-for="item in items" :key="item.id" :title="item.title">
          <el-icon :size="16"><component :is="item.icon" /></el-icon>
          <span class="activity-item-text">{{ item.title }}</span>
        </div>
      </div>
      <slot name="content">
        <div v-if="properties && properties.length > 0" class="properties-container">
          <div class="property-item" v-for="property in properties" :key="property.id">
            <div class="property-label">{{ property.label }}</div>
            <div class="property-value">{{ property.value }}</div>
          </div>
        </div>
        <div v-else class="empty-tip">暂无属性数据</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

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

const props = withDefaults(
  defineProps<{
    title: string;
    items: ActivityItem[];
    properties?: Property[];
    customWidth?: number;
    position?: 'left' | 'right';
  }>(),
  {
    customWidth: 200,
    position: 'left',
    properties: () => []
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-float'): void;
}>();

const close = () => emit('close');
const { t } = useI18n();
const panelStyle = computed(() => ({
  width: `${props.customWidth}px`
}));
</script>

<style scoped>
.activity-bar {
  background-color: var(--app-bg);
  border-right: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
}

.activity-bar-right {
  border-right: none;
  border-left: 1px solid var(--app-border);
}

.activity-bar-header {
  padding: 0 12px;
  border-bottom: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
}

.activity-bar-right .activity-bar-header {
  flex-direction: row-reverse;
}

.activity-bar-title {
  display: inline-flex;
  align-items: center;
  line-height: 1;
  font-size: 12px;
  color: var(--app-text-regular);
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
  color: var(--app-text-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.action-btn:hover {
  background-color: var(--app-bg-hover);
}

.activity-bar-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-label {
  font-size: 11px;
  color: var(--app-text-muted);
}

.property-value {
  font-size: 12px;
  color: var(--app-text-regular);
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 3px;
  padding: 6px 8px;
}

.activity-items-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-border);
}

.activity-item {
  min-height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-text-regular);
  cursor: default;
  border-radius: 3px;
  padding: 2px 4px;
}

.activity-item:hover {
  background-color: var(--app-bg-hover);
}

.activity-item-text {
  font-size: 12px;
  line-height: 1;
  color: var(--app-text-regular);
}

.properties-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-tip {
  font-size: 12px;
  color: var(--app-text-muted);
}
</style>
