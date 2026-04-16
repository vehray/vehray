<template>
  <div class="settings-window" @mousedown="startWindowDrag">
    <!-- 窗口标题栏 -->
    <div 
      class="window-titlebar"
    >
      <!-- 左侧：标题 -->
      <div class="window-title-container">
        <div class="window-title">设置</div>
      </div>
    </div>
    
    <!-- 窗口内容 -->
    <div class="window-content" @mousedown.stop>
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
    
    <!-- 底部按钮栏 -->
    <div class="settings-footer" @mousedown.stop>
      <div class="settings-buttons">
        <el-button type="success" @click="$emit('confirm')">确认</el-button>
        <el-button @click="$emit('close')">取消</el-button>
        <el-button type="primary" @click="$emit('apply')">应用</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue';

// 定义属性
const props = defineProps({
});

// 定义事件
const emit = defineEmits([
  'close',
  'confirm',
  'apply',
  'language-change',
  'theme-change'
]);

// 窗口状态
const activeTab = ref('0'); // 默认选中第一个标签页（设备连接）
const language = ref('zh-CN');
const theme = ref('light');

// 开始拖拽
const startWindowDrag = (event: MouseEvent) => {
  // 防止默认行为
  event.preventDefault();
  event.stopPropagation();
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
});
</script>

<style scoped>
/* 设置窗口 */
.settings-window {
  position: relative;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--fluent-border);
  pointer-events: auto;
  opacity: 1;
  /* 移除过渡效果，提高拖拽性能 */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  overflow: hidden;
  width: 100%;
  height: 100%;
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