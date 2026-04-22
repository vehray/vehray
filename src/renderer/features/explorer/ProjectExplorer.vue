<template>
  <div class="file-explorer">
    <div class="explorer-content">
      <div v-if="!rootFolder" class="empty-state">
        <el-icon class="empty-icon"><Folder /></el-icon>
        <p>未打开文件夹</p>
        <p class="empty-hint">点击文件 → 打开文件夹</p>
      </div>
      <div v-else class="file-tree">
        <div class="tree-item root-item">
          <div class="tree-item-header" @click="toggleRootFolder">
            <el-icon class="expand-icon" :class="{ expanded: rootExpanded }">
              <ArrowDown v-if="rootExpanded" />
              <ArrowRight v-else />
            </el-icon>
            <el-icon class="file-icon"><Folder /></el-icon>
            <span class="file-name">{{ rootFolder }}</span>
          </div>
        </div>
        <div class="tree-children" v-if="rootExpanded">
          <ProjectTreeNode v-for="item in fileTree" :key="item.path" :item="item" @toggle="toggleItem" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { Folder, ArrowRight, ArrowDown } from '@element-plus/icons-vue';
import ProjectTreeNode from './ProjectTreeNode.vue';
import { useProjectExplorer } from '../../../viewmodels/useProjectExplorer';
import { electronBridge } from '../../../viewmodels/services/electron-bridge';

const { rootFolder, fileTree, rootExpanded, toggleRootFolder, toggleItem, loadFolder } = useProjectExplorer();
let unsubscribeFolderOpened: (() => void) | null = null;

onMounted(() => {
  unsubscribeFolderOpened = electronBridge.subscribeFolderOpened((folderPath) => {
    void loadFolder(folderPath);
  });
});
onUnmounted(() => {
  unsubscribeFolderOpened?.();
  unsubscribeFolderOpened = null;
});
</script>

<style scoped>
.file-explorer { height: 100%; display: flex; flex-direction: column; background-color: #1e1e1e; color: #cccccc; }
.explorer-content { flex: 1; overflow-y: auto; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888; }
.tree-item .tree-item-header { display: flex; align-items: center; padding: 4px 12px; font-size: 12px; cursor: pointer; }
.tree-item .tree-item-header:hover { background-color: rgba(255, 255, 255, 0.08); }
.expand-icon { width: 12px; height: 12px; margin-right: 4px; }
.file-icon { width: 14px; height: 14px; margin-right: 6px; }
.tree-children { margin-left: 16px; }
</style>
