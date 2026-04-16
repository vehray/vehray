<template>
  <div class="app-header">
    <!-- 左侧：Logo 和 菜单栏 -->
    <div class="app-header-left">
      <!-- 左侧：Logo -->
      <div class="app-logo">
        <el-icon :size="24"><DataAnalysis /></el-icon>
      </div>
      
      <!-- 菜单栏 -->
      <div class="menu-bar">
        <el-menu mode="horizontal" background-color="transparent" text-color="#333" active-text-color="#0078d4" :ellipsis="false">
          <el-sub-menu index="1">
            <template #title>文件</template>
              <el-sub-menu index="1-1">
                <template #title>新建</template>
                <el-menu-item index="1-1-1" @click="$emit('createReverseProject')">新建逆向分析项目</el-menu-item>
              </el-sub-menu>
            <el-menu-item index="1-2">打开项目</el-menu-item>
            <el-menu-item index="1-3">保存项目</el-menu-item>
            <el-menu-item index="1-4">退出</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="2">编辑</el-menu-item>
          <el-menu-item index="3">视图</el-menu-item>
          <el-menu-item index="4" @click="$emit('openDeviceManagement')">设备</el-menu-item>
          <el-sub-menu index="5">
            <template #title>工具箱</template>
            <el-sub-menu index="5-1">
              <template #title>逆向分析工具</template>
              <el-sub-menu index="5-1-1">
                <template #title>LIN总线逆向分析</template>
                <el-menu-item index="5-1-1-1" @click="$emit('openSlaveScanner')">从机扫描</el-menu-item>
                <el-menu-item index="5-1-1-2" @click="$emit('openScheduleTables')">列表收发</el-menu-item>
                <el-menu-item index="5-1-1-3" @click="$emit('openBruteForce')">爆破发送</el-menu-item>
              </el-sub-menu>
            </el-sub-menu>
          </el-sub-menu>
          <el-menu-item index="6">帮助</el-menu-item>
        </el-menu>
      </div>
    </div>
    
    <!-- 拖拽区域（放在中间，确保有足够空间） -->
    <div class="drag-area"></div>
    
    <!-- 右侧：搜索和设置按钮 -->
    <div class="app-header-right">
      <div class="search-container">
        <el-input
          :model-value="searchQuery"
          placeholder="搜索..."
          size="small"
          prefix-icon="Search"
          style="width: 120px"
          @input="$emit('search', $event)"
        />
      </div>
      <button class="header-btn settings-btn" @click="$emit('openSettings')" title="设置">
        <el-icon><Setting /></el-icon>
      </button>
      <button class="header-btn login-btn" @click="$emit('login')" title="登录">
        <el-icon><UserFilled /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DataAnalysis, Setting, UserFilled, Search } from '@element-plus/icons-vue';

const props = defineProps<{
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: 'search', query: string): void;
  (e: 'openSettings'): void;
  (e: 'login'): void;
  (e: 'openDeviceManagement'): void;
  (e: 'openSlaveScanner'): void;
  (e: 'openScheduleTables'): void;
  (e: 'openBruteForce'): void;
  (e: 'createReverseProject'): void;
}>();
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-logo {
  font-size: 24px;
  color: #0078d4;
  cursor: pointer;
}

.menu-bar {
  flex: 1;
  min-width: 0;
}

.drag-area {
  flex: 1;
  height: 100%;
  cursor: move;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-container {
  margin-right: 10px;
}

.header-btn {
  width: 36px;
  height: 36px;
  border: none;
  background-color: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  transition: all 0.3s;
}

.header-btn:hover {
  background-color: var(--el-fill-color-light);
  color: #0078d4;
}

.settings-btn {
  margin-right: 5px;
}
</style>