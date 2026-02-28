<template>
  <div v-if="visible" class="settings-window-container">
    <div 
      class="settings-window" 
      :style="{
        left: position.x + 'px',
        top: position.y + 'px',
        width: size.width + 'px',
        height: size.height + 'px'
      }"
      ref="windowRef"
    >
      <!-- 窗口标题栏 -->
      <div 
        class="window-titlebar" 
        @mousedown="startDrag"
      >
        <div class="window-title">设置</div>
        <div class="window-controls">
          <button class="window-btn" @click="closeWindow" title="关闭">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
      
      <!-- 窗口内容 -->
      <div class="window-content">
      
      <!-- 窗口调整大小句柄 -->
      <div 
        class="window-resize-handle" 
        @mousedown="startResize"
      ></div>
        <el-tabs v-model="activeTab" type="border-card">
          
          <!-- 语言选择模块 -->
          <el-tab-pane label="语言">
            <div class="settings-section">
              <h3 class="section-title">语言选择</h3>
              <div class="language-options">
                <el-radio-group v-model="language" @change="handleLanguageChange">
                  <el-radio-button label="zh-CN">中文</el-radio-button>
                  <el-radio-button label="en-US">English</el-radio-button>
                </el-radio-group>
              </div>
              <div class="setting-description">
                选择应用程序的显示语言
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 主题切换模块 -->
          <el-tab-pane label="主题">
            <div class="settings-section">
              <h3 class="section-title">主题切换</h3>
              <div class="theme-options">
                <el-radio-group v-model="theme" @change="handleThemeChange">
                  <el-radio-button label="light">浅色主题</el-radio-button>
                  <el-radio-button label="dark">深色主题</el-radio-button>
                </el-radio-group>
              </div>
              <div class="setting-description">
                选择应用程序的显示主题
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue';
import { Close } from '@element-plus/icons-vue';

// 定义属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits([
  'close',
  'language-change',
  'theme-change'
]);

// 组件引用
const windowRef = ref<HTMLElement | null>(null);

// 窗口状态
const activeTab = ref('0'); // 默认选中第一个标签页（设备连接）
const language = ref('zh-CN');
const theme = ref('light');
const position = ref({ x: 200, y: 100 });
const size = ref({ width: 600, height: 400 });
const isDragging = ref(false);
const isResizing = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const resizeStart = ref({ x: 0, y: 0, width: 600, height: 400 });

// 非响应式变量，用于拖拽过程中的临时存储
let tempPosition = { x: 200, y: 100 };
let tempSize = { width: 600, height: 400 };
let lastDragTime = 0;
let lastResizeTime = 0;
const DRAG_THROTTLE = 16; // 约60fps
const RESIZE_THROTTLE = 16; // 约60fps
const MIN_WINDOW_WIDTH = 400;
const MIN_WINDOW_HEIGHT = 300;

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    isDragging.value = true;
    dragStart.value = {
      x: event.clientX - position.value.x,
      y: event.clientY - position.value.y
    };
    // 初始化临时位置
    tempPosition = { ...position.value };
    lastDragTime = 0;
  }
};

// 开始调整大小
const startResize = (event: MouseEvent) => {
  isResizing.value = true;
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: size.value.width,
    height: size.value.height
  };
  // 初始化临时大小
  tempSize = { ...size.value };
  lastResizeTime = 0;
  
  // 防止默认行为
  event.preventDefault();
  event.stopPropagation();
};

// 处理鼠标移动
const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    // 节流处理，限制拖拽事件处理频率
    const currentTime = performance.now();
    if (currentTime - lastDragTime < DRAG_THROTTLE) {
      return;
    }
    lastDragTime = currentTime;
    
    // 更新临时位置
    tempPosition = {
      x: event.clientX - dragStart.value.x,
      y: event.clientY - dragStart.value.y
    };
    
    // 直接更新DOM样式，使用transform代替left/top
    if (windowRef.value) {
      windowRef.value.style.transform = `translate(${tempPosition.x}px, ${tempPosition.y}px)`;
      windowRef.value.style.left = '0';
      windowRef.value.style.top = '0';
    }
  } else if (isResizing.value) {
    // 节流处理，限制调整大小事件处理频率
    const currentTime = performance.now();
    if (currentTime - lastResizeTime < RESIZE_THROTTLE) {
      return;
    }
    lastResizeTime = currentTime;
    
    // 计算新的窗口大小
    const deltaX = event.clientX - resizeStart.value.x;
    const deltaY = event.clientY - resizeStart.value.y;
    
    // 计算新的宽度和高度，确保不小于最小值
    const newWidth = Math.max(MIN_WINDOW_WIDTH, resizeStart.value.width + deltaX);
    const newHeight = Math.max(MIN_WINDOW_HEIGHT, resizeStart.value.height + deltaY);
    
    // 更新临时大小
    tempSize = {
      width: newWidth,
      height: newHeight
    };
    
    // 直接更新DOM样式
    if (windowRef.value) {
      windowRef.value.style.width = `${newWidth}px`;
      windowRef.value.style.height = `${newHeight}px`;
    }
  }
};

// 结束拖拽
const handleMouseUp = () => {
  if (isDragging.value) {
    // 更新响应式变量
    position.value = { ...tempPosition };
    // 重置transform，使用left/top
    if (windowRef.value) {
      windowRef.value.style.transform = 'none';
      windowRef.value.style.left = `${tempPosition.x}px`;
      windowRef.value.style.top = `${tempPosition.y}px`;
    }
    isDragging.value = false;
  } else if (isResizing.value) {
    // 更新响应式变量
    size.value = { ...tempSize };
    isResizing.value = false;
  }
};

// 关闭窗口
const closeWindow = () => {
  emit('close');
};

// 处理语言变更
const handleLanguageChange = (value: string) => {
  emit('language-change', value);
};

// 处理主题变更
const handleThemeChange = (value: string) => {
  emit('theme-change', value);
};



// 组件挂载
onMounted(() => {
  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  
  // 加载保存的设置
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    language.value = savedLanguage;
  }
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    theme.value = savedTheme;
  }
});

// 组件卸载
onUnmounted(() => {
  // 移除全局鼠标事件监听
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
/* 设置窗口容器 */
.settings-window-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0);
}

/* 设置窗口 */
.settings-window {
  position: absolute;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--fluent-border);
  z-index: 1001;
  pointer-events: auto;
  opacity: 1;
  /* 移除过渡效果，提高拖拽性能 */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  overflow: hidden;
}

/* 窗口标题栏 */
.window-titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f3f2f1;
  border-bottom: 1px solid var(--fluent-border);
  cursor: move;
  border-radius: 4px 4px 0 0;
  opacity: 1;
}

.window-title {
  font-weight: 600;
  color: var(--fluent-text-primary);
}

.window-controls {
  display: flex;
  gap: 4px;
}

.window-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--fluent-text-secondary);
  transition: all 0.2s;
}

.window-btn:hover {
  background-color: var(--fluent-surface-hover);
  color: var(--fluent-text-primary);
}

/* 窗口内容 */
.window-content {
  padding: 16px;
  max-height: 500px;
  overflow: auto;
}

/* 设置部分 */
.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--fluent-text-primary);
}

/* 语言选项 */
.language-options {
  margin-bottom: 12px;
}

/* 主题选项 */
.theme-options {
  margin-bottom: 12px;
}

/* 设置描述 */
.setting-description {
  font-size: 14px;
  color: var(--fluent-text-tertiary);
  margin-top: 8px;
  line-height: 1.4;
}

/* 窗口调整大小句柄 */
.window-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background-color: transparent;
  z-index: 10;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .settings-window {
    width: 90%;
    max-width: 500px;
  }
  
  .window-content {
    max-height: 400px;
  }
}
</style>