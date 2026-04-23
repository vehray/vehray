<template>
  <div class="tree-item">
    <div
      class="tree-item-header"
      :class="{ selected: isSelected }"
      @click="handleClick"
      @contextmenu.prevent="$emit('contextmenu', item, $event)"
    >
      <el-icon v-if="item.type === 'directory'" class="expand-icon" :class="{ expanded: item.expanded }">
        <ArrowDown v-if="item.expanded" />
        <ArrowRight v-else />
      </el-icon>
      <el-icon v-else class="expand-icon placeholder-icon"></el-icon>
      <el-icon class="file-icon">
        <Folder v-if="item.type === 'directory'" />
        <Document v-else />
      </el-icon>
      <div v-if="isRenaming" class="rename-input-group">
        <input
          class="rename-input"
          :class="{ 'rename-input--error': renameNameDuplicate }"
          :value="renamingName"
          autofocus
          @click.stop
          @input="(event) => $emit('update:renaming-name', (event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="$emit('submit-rename')"
          @keydown.esc.prevent="$emit('cancel-rename')"
          @blur="$emit('blur-rename')"
        />
        <span v-if="renameNameDuplicate" class="rename-duplicate-hint">{{ t('layout.explorer.renameDuplicateName') }}</span>
      </div>
      <span v-else class="file-name">{{ item.name }}</span>
    </div>
    <div v-if="item.expanded && ((item.children && item.children.length > 0) || isCreatingParent)" class="tree-children">
      <div v-if="isCreatingParent" class="tree-item-header creating-row creating-folder-inline">
        <el-icon class="expand-icon placeholder-icon"></el-icon>
        <el-icon class="file-icon"><Folder /></el-icon>
        <div class="create-input-group">
          <input
            class="create-input"
            :class="{ 'create-input--error': createFolderNameDuplicate }"
            :value="creatingFolderName"
            autofocus
            @input="(event) => $emit('update:create-folder-name', (event.target as HTMLInputElement).value)"
            @keydown.enter.prevent="$emit('submit-create-folder')"
            @keydown.esc.prevent="$emit('cancel-create-folder')"
            @blur="$emit('blur-create-folder')"
          />
          <span v-if="createFolderNameDuplicate" class="create-duplicate-hint">{{
            t('layout.explorer.createFolderDuplicateName')
          }}</span>
        </div>
      </div>
      <ProjectTreeNode
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :selected-path="selectedPath"
        :creating-parent-path="creatingParentPath"
        :creating-folder-name="creatingFolderName"
        :create-folder-name-duplicate="createFolderNameDuplicate"
        :renaming-path="renamingPath"
        :renaming-name="renamingName"
        :rename-name-duplicate="renameNameDuplicate"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
        @update:create-folder-name="$emit('update:create-folder-name', $event)"
        @submit-create-folder="$emit('submit-create-folder')"
        @cancel-create-folder="$emit('cancel-create-folder')"
        @blur-create-folder="$emit('blur-create-folder')"
        @update:renaming-name="$emit('update:renaming-name', $event)"
        @submit-rename="$emit('submit-rename')"
        @cancel-rename="$emit('cancel-rename')"
        @blur-rename="$emit('blur-rename')"
        @contextmenu="(childItem, mouseEvent) => $emit('contextmenu', childItem, mouseEvent)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowRight, Document, Folder } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { FileTreeNode } from '../../state/uiState';
defineOptions({ name: 'ProjectTreeNode' });
const { t } = useI18n();
const props = defineProps<{
  item: FileTreeNode;
  selectedPath?: string | null;
  creatingParentPath?: string | null;
  creatingFolderName?: string;
  createFolderNameDuplicate?: boolean;
  renamingPath?: string | null;
  renamingName?: string;
  renameNameDuplicate?: boolean;
}>();

const isSelected = computed(() => props.selectedPath === props.item.path);
const isCreatingParent = computed(() => props.creatingParentPath === props.item.path);
const isRenaming = computed(() => props.renamingPath === props.item.path);

const handleClick = () => {
  emit('select', props.item);
  emit('toggle', props.item);
};

const emit = defineEmits<{
  (e: 'toggle', item: FileTreeNode): void;
  (e: 'select', item: FileTreeNode): void;
  (e: 'contextmenu', item: FileTreeNode, event: MouseEvent): void;
  (e: 'update:create-folder-name', value: string): void;
  (e: 'submit-create-folder'): void;
  (e: 'cancel-create-folder'): void;
  (e: 'blur-create-folder'): void;
  (e: 'update:renaming-name', value: string): void;
  (e: 'submit-rename'): void;
  (e: 'cancel-rename'): void;
  (e: 'blur-rename'): void;
}>();
</script>

<style scoped>
.tree-item-header {
  display: flex;
  align-items: center;
  min-height: 26px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--app-text-regular);
  cursor: pointer;
  user-select: none;
}

.tree-item-header:hover {
  background-color: var(--app-bg-soft-hover);
}

.tree-item-header.selected {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.expand-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
  color: var(--app-text-subtle);
}

.placeholder-icon {
  opacity: 0;
}

.file-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  color: var(--app-text-subtle);
}

.file-name {
  line-height: 1;
  color: var(--app-text-regular);
}

.rename-input-group {
  position: relative;
  flex: 1;
  min-width: 0;
}

.rename-input {
  width: 100%;
  height: 22px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background-color: var(--app-bg-elevated);
  color: var(--app-text-regular);
  font-size: 12px;
  padding: 0 8px;
  box-sizing: border-box;
  outline: none;
}

.rename-input:focus {
  border-color: var(--app-accent, #3b82f6);
}

.rename-input--error,
.rename-input--error:focus {
  border-color: #f87171;
}

.rename-duplicate-hint {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 10;
  font-size: 11px;
  line-height: 1.35;
  color: #f87171;
  padding: 5px 8px;
  background-color: var(--app-bg-elevated);
  border: 1px solid rgba(248, 113, 113, 0.45);
  border-radius: 4px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.creating-row {
  padding-right: 10px;
}

.creating-row.creating-folder-inline {
  overflow: visible;
  position: relative;
  z-index: 2;
}

.creating-folder-inline {
  align-items: center;
  gap: 8px;
}

.create-input-group {
  position: relative;
  flex: 1;
  min-width: 0;
  align-self: stretch;
}

.create-input-group .create-input {
  flex: none;
  width: 100%;
  box-sizing: border-box;
}

.create-input--error,
.create-input--error:focus {
  border-color: #f87171;
}

.create-duplicate-hint {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 10;
  font-size: 11px;
  line-height: 1.35;
  color: #f87171;
  padding: 5px 8px;
  background-color: var(--app-bg-elevated);
  border: 1px solid rgba(248, 113, 113, 0.45);
  border-radius: 4px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.create-input {
  flex: 1;
  height: 22px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background-color: var(--app-bg-elevated);
  color: var(--app-text-regular);
  font-size: 12px;
  padding: 0 8px;
  outline: none;
}

.create-input:focus {
  border-color: var(--app-accent, #3b82f6);
}

.tree-children {
  margin-left: 16px;
  overflow: visible;
}
</style>
