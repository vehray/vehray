<template>
  <div class="navigation-menu" :class="{ 'collapsed': isCollapsed }">
    <!-- 折叠/展开按钮 -->
    <div class="collapse-btn" @click="toggleCollapse" @mousedown="startResize($event)">
      <el-icon>
        <ArrowRight v-if="isCollapsed" />
        <ArrowLeft v-else />
      </el-icon>
    </div>
    
    <!-- 导航菜单 -->
    <el-menu
      :default-active="activeKey"
      class="el-menu-vertical-demo"
      :collapse="isCollapsed"
      :text-color="'#111827'"
      :background-color="'#f3f2f1'"
      :active-text-color="'#0078d4'"
      :hover-text-color="'#111827'"
      @select="handleSelect"
    >
      <!-- 遍历菜单项，支持子菜单 -->
      <template v-for="item in menuItems" :key="item.key">
        <!-- 有子菜单的项 -->
        <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.key">
          <template #title>
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </template>
          <!-- 子菜单项 -->
          <el-menu-item
            v-for="child in item.children"
            :key="child.key"
            :index="child.key"
          >
            <el-icon :size="16"><component :is="child.icon" /></el-icon>
            <template #title>{{ child.label }}</template>
          </el-menu-item>
        </el-sub-menu>
        <!-- 无子菜单的项 -->
        <el-menu-item v-else :index="item.key">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </template>
    </el-menu>
    
    <!-- 设置按钮 -->
    <div class="settings-btn" @click="handleSettingsClick">
      <el-icon :size="20"><Setting /></el-icon>
      <span v-if="!isCollapsed">设置</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { ArrowRight, ArrowLeft, Setting } from '@element-plus/icons-vue';

// 定义属性
const props = defineProps({
  menuItems: {
    type: Array,
    required: true
  },
  activeKey: {
    type: String,
    required: true
  },
  isCollapsed: {
    type: Boolean,
    default: false
  },
  autoCollapse: {
    type: Boolean,
    default: true
  },
  autoCollapseThreshold: {
    type: Number,
    default: 1024
  }
});

// 定义事件
const emit = defineEmits([
  'select',
  'toggle-collapse',
  'settings-click',
  'resize'
]);

// 手动折叠状态（用于跟踪用户的手动操作）
const manuallyCollapsed = ref(false);

// 处理菜单选择
const handleSelect = (key: string, keyPath: string[]) => {
  if (key !== 'settings') {
    emit('select', key);
  }
};

// 切换折叠状态
const toggleCollapse = () => {
  manuallyCollapsed.value = !props.isCollapsed;
  emit('toggle-collapse');
};

// 处理设置按钮点击
const handleSettingsClick = () => {
  emit('settings-click');
};

// 处理窗口大小变化
const handleResize = () => {
  if (props.autoCollapse && !manuallyCollapsed.value) {
    const isBelowThreshold = window.innerWidth < props.autoCollapseThreshold;
    if (isBelowThreshold !== props.isCollapsed) {
      emit('toggle-collapse');
    }
  }
};

// 监听属性变化
watch(
  () => props.isCollapsed,
  (newValue) => {
    // 当通过自动折叠改变状态时，重置手动折叠标记
    if (props.autoCollapse && !manuallyCollapsed.value) {
      // 状态已由父组件更新，无需额外操作
    }
  }
);

// 组件挂载时添加窗口大小监听
onMounted(() => {
  window.addEventListener('resize', handleResize);
  // 初始检查窗口大小
  handleResize();
});

// 拖拽调整大小相关变量
let isResizing = ref(false);
let startX = 0;
let startWidth = 0;
const minWidth = 64;
const maxWidth = 300;

// 开始拖拽调整大小
const startResize = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  isResizing.value = true;
  startX = event.clientX;
  startWidth = document.querySelector('.navigation-menu')?.offsetWidth || 200;
  
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('mouseleave', stopResize);
};

// 拖拽调整大小中
const onResize = (event: MouseEvent) => {
  if (!isResizing.value) return;
  
  event.preventDefault();
  
  const deltaX = event.clientX - startX;
  let newWidth = startWidth + deltaX;
  
  // 限制最小和最大宽度
  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  
  // 触发宽度变化事件
  emit('resize', newWidth);
};

// 停止拖拽调整大小
const stopResize = () => {
  isResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('mouseleave', stopResize);
};

// 组件卸载时移除窗口大小监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* 导航菜单容器 */
.navigation-menu {
  height: 100%;
  background-color: #f3f2f1;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 折叠状态 */
.navigation-menu.collapsed {
  width: 64px;
}

/* 折叠/展开按钮 */
.collapse-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  background-color: #f3f2f1;
  color: #6b7280;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  z-index: 10;
  border-left: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background-color: #e5e5e5;
  color: #374151;
  width: 12px;
}

.collapse-btn:active {
  background-color: #d9d9d9;
}

/* 导航菜单样式 */
.el-menu-vertical-demo {
  border-right: none;
  background-color: #f3f2f1;
  flex: 1;
  margin-top: 16px;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 100%;
}

/* 菜单项悬停样式 */
.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: #e5e5e5 !important;
}

/* 菜单项选中样式 */
.el-menu-item.is-active {
  background-color: rgba(0, 120, 212, 0.1) !important;
  color: #0078d4 !important;
}

/* 子菜单项容器样式 */
.el-sub-menu .el-menu {
  background-color: #f3f2f1 !important;
}

/* 设置按钮样式 */
.settings-btn {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 56px;
  cursor: pointer;
  border-top: 1px solid #e5e7eb;
  background-color: #f3f2f1;
}

/* 折叠状态下的设置按钮 */
.navigation-menu.collapsed .settings-btn {
  justify-content: center;
  padding: 0;
}
</style>