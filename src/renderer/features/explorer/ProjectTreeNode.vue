<template>
  <div class="tree-item">
    <div class="tree-item-header" @click="$emit('toggle', item)">
      <el-icon v-if="item.type === 'directory'" class="expand-icon" :class="{ expanded: item.expanded }">
        <ArrowDown v-if="item.expanded" />
        <ArrowRight v-else />
      </el-icon>
      <el-icon v-else class="expand-icon placeholder-icon"></el-icon>
      <el-icon class="file-icon">
        <Folder v-if="item.type === 'directory'" />
        <Document v-else />
      </el-icon>
      <span class="file-name">{{ item.name }}</span>
    </div>
    <div v-if="item.expanded && item.children && item.children.length > 0" class="tree-children">
      <ProjectTreeNode v-for="child in item.children" :key="child.path" :item="child" @toggle="$emit('toggle', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowRight, Document, Folder } from '@element-plus/icons-vue';
import type { FileTreeNode } from '../../state/uiState';
defineOptions({ name: 'ProjectTreeNode' });
defineProps<{ item: FileTreeNode }>();
defineEmits<{ (e: 'toggle', item: FileTreeNode): void }>();
</script>
