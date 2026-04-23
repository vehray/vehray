<template>
  <div ref="explorerRootRef" class="file-explorer" @click="handleExplorerClick">
    <div
      class="explorer-content"
      @contextmenu.prevent="openContextMenuForBlank"
    >
      <div class="virtual-tree-groups">
        <div class="tree-item">
          <div class="tree-item-header group-root" @click="toggleOpenEditors">
            <el-icon class="expand-icon" :class="{ expanded: openEditorsExpanded }">
              <ArrowDown v-if="openEditorsExpanded" />
              <ArrowRight v-else />
            </el-icon>
            <el-icon class="file-icon"><Document /></el-icon>
            <span class="file-name">{{ t('layout.explorer.openEditors') }}</span>
          </div>
          <div v-if="openEditorsExpanded" class="tree-children group-children">
            <button
              v-for="tab in openedEditorTabs"
              :key="tab.id"
              class="tree-item-header group-leaf-btn"
              type="button"
              @click="switchToTab(tab.id)"
              @contextmenu.prevent.stop="openContextMenuForOpenedEditor(tab.id, $event)"
            >
              <el-icon class="expand-icon placeholder-icon"></el-icon>
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="file-name">{{ tab.title }}</span>
            </button>
          </div>
        </div>
        <div class="tree-item">
          <div class="tree-item-header group-root" @click="openFoldersExpanded = !openFoldersExpanded">
            <el-icon class="expand-icon" :class="{ expanded: openFoldersExpanded }">
              <ArrowDown v-if="openFoldersExpanded" />
              <ArrowRight v-else />
            </el-icon>
            <el-icon class="file-icon"><Folder /></el-icon>
            <span class="file-name">{{ openFoldersTitle }}</span>
          </div>
          <div v-if="openFoldersExpanded" class="tree-children group-children">
            <div
              v-if="openedFolders.length === 0"
              class="group-empty-state"
              :class="{ 'drag-open-active': isDragImportActive }"
              @dblclick.stop="handleExplorerDoubleClick"
              @dragenter.prevent.stop="handleDragEnterExplorer"
              @dragover.prevent.stop="handleDragOverExplorer"
              @dragleave.prevent.stop="handleDragLeaveExplorer"
              @drop.prevent.stop="handleDropOnExplorer"
            >
              <el-icon class="empty-icon"><Folder /></el-icon>
              <p>{{ t('layout.explorer.noFolder') }}</p>
              <p class="empty-hint">{{ t('layout.explorer.hint') }}</p>
            </div>
            <div v-for="folder in openedFolders" :key="folder.path" class="tree-item-header">
              <el-icon class="expand-icon placeholder-icon"></el-icon>
              <el-icon class="file-icon"><Folder /></el-icon>
              <span class="file-name">{{ folder.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="rootFolder" class="file-tree">
        <div class="tree-item root-item">
          <div
            class="tree-item-header"
            :class="{ selected: selectedPath === state.activeFolderPath }"
            @click="handleRootClick"
            @contextmenu.prevent="openContextMenuForRoot"
          >
            <el-icon class="expand-icon" :class="{ expanded: rootExpanded }">
              <ArrowDown v-if="rootExpanded" />
              <ArrowRight v-else />
            </el-icon>
            <el-icon class="file-icon"><Folder /></el-icon>
            <span
              class="file-name"
              @mouseenter="showNameTooltip($event, rootFolder ?? '')"
              @mousemove="moveNameTooltip"
              @mouseleave="hideNameTooltip"
            >
              {{ rootFolder }}
            </span>
          </div>
        </div>
        <div class="tree-children" v-if="rootExpanded">
          <div
            v-if="creatingParentPath === state.activeFolderPath"
            class="tree-item-header creating-row creating-folder-inline"
          >
            <el-icon class="expand-icon placeholder-icon"></el-icon>
            <el-icon class="file-icon"><Folder /></el-icon>
            <div class="create-input-group">
              <input
                class="create-input"
                :class="{ 'create-input--error': isCreateFolderNameDuplicate }"
                v-model="creatingFolderName"
                autofocus
                @keydown.enter.prevent="submitCreateFolder"
                @keydown.esc.prevent="cancelCreateFolder"
                @blur="handleCreateFolderInputBlur"
              />
              <span v-if="isCreateFolderNameDuplicate" class="create-duplicate-hint">{{
                t('layout.explorer.createFolderDuplicateName')
              }}</span>
            </div>
          </div>
          <ProjectTreeNode
            v-for="item in fileTree"
            :key="item.path"
            :item="item"
            :selected-path="selectedPath"
            :creating-parent-path="creatingParentPath"
            :creating-folder-name="creatingFolderName"
            :create-folder-name-duplicate="isCreateFolderNameDuplicate"
            :renaming-path="renamingPath"
            :renaming-name="renamingName"
            :rename-name-duplicate="isRenameNameDuplicate"
            @toggle="toggleItem"
            @select="handleSelectNode"
            @update:create-folder-name="(value) => (creatingFolderName = value)"
            @submit-create-folder="submitCreateFolder"
            @cancel-create-folder="cancelCreateFolder"
            @blur-create-folder="handleCreateFolderInputBlur"
            @update:renaming-name="(value) => (renamingName = value)"
            @submit-rename="submitRename"
            @cancel-rename="cancelRename"
            @blur-rename="handleRenameInputBlur"
            @contextmenu="openContextMenuForNode"
          />
        </div>
      </div>
    </div>
    <div
      v-if="contextMenu.visible"
      ref="contextMenuRef"
      class="explorer-context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <button v-if="contextEditorTabId" class="context-menu-item" @click="handleCloseEditorFromContextMenu">
        <el-icon><Close /></el-icon>
        {{ t('common.close') }}
      </button>
      <div v-if="contextEditorTabId" class="context-menu-divider"></div>
      <button v-if="!state.activeFolderPath" class="context-menu-item" @click="handleOpenFolderFromContextMenu">
        <el-icon><Folder /></el-icon>
        {{ t('layout.header.openFolder') }}
      </button>
      <button v-if="state.activeFolderPath && !contextEditorTabId" class="context-menu-item" @click="handleRevealInFolder">
        <el-icon><FolderOpened /></el-icon>
        {{ t('layout.explorer.openContainingFolder') }}
      </button>
      <button v-if="state.activeFolderPath && !contextEditorTabId" class="context-menu-item" @click="handleCreateFolder">
        <el-icon><FolderAdd /></el-icon>
        {{ t('layout.explorer.createFolder') }}
      </button>
      <button v-if="contextTarget && !contextEditorTabId" class="context-menu-item" @click="handleStartRename">
        <el-icon><EditPen /></el-icon>
        {{ t('layout.explorer.rename') }}
      </button>
      <button
        v-if="!contextTarget && state.activeFolderPath && !contextEditorTabId"
        class="context-menu-item"
        @click="handleCloseFolder"
      >
        <el-icon><FolderDelete /></el-icon>
        {{ t('layout.explorer.closeFolder') }}
      </button>
      <div v-if="contextTarget && !contextEditorTabId" class="context-menu-divider"></div>
      <button v-if="contextTarget && !contextEditorTabId" class="context-menu-item danger" @click="toggleDeleteConfirm">
        <el-icon><Delete /></el-icon>
        {{ t('layout.explorer.delete') }}
      </button>
    </div>
    <div
      v-if="showDeleteConfirm && contextTarget"
      class="delete-confirm-popup"
      :style="{ left: `${deleteConfirmPopup.x}px`, top: `${deleteConfirmPopup.y}px` }"
      @click.stop
    >
      <div class="delete-confirm-title">{{ t('layout.explorer.deleteConfirmInline') }}</div>
      <div class="delete-confirm-row">
        <button class="confirm-btn" @click="confirmDeleteEntry">
          <el-icon><Check /></el-icon>
          {{ t('common.confirm') }}
        </button>
        <button class="cancel-btn" @click="cancelDeleteConfirm">
          <el-icon><Close /></el-icon>
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
    <div
      v-if="nameTooltip.visible"
      class="name-hover-tip"
      :style="{ left: `${nameTooltip.x}px`, top: `${nameTooltip.y}px` }"
    >
      {{ nameTooltip.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { Folder, ArrowRight, ArrowDown, FolderOpened, FolderAdd, FolderDelete, EditPen, Delete, Check, Close, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import ProjectTreeNode from './ProjectTreeNode.vue';
import { useProjectExplorer } from './composables/useProjectExplorer';
import { electronBridge } from '../../services/electronBridge';
import { explorerService } from './services/explorerService';
import { uiActions } from '../../services/uiActions';
import type { FileTreeNode } from '../../state/uiState';
import { useUiState } from '../../state/uiState';

const { rootFolder, fileTree, rootExpanded, toggleRootFolder, toggleItem, loadFolder, closeFolder } = useProjectExplorer();
const { t } = useI18n();
const { state, setSelectedExplorerEntry, switchToTab, closeTab } = useUiState();
let unsubscribeFolderOpened: (() => void) | null = null;
let unsubscribeFolderChanged: (() => void) | null = null;
let refreshTimer: number | null = null;
const selectedPath = ref<string | null>(null);
const contextTarget = ref<FileTreeNode | null>(null);
const contextEditorTabId = ref<string | null>(null);
const creatingParentPath = ref<string | null>(null);
const creatingFolderName = ref('');
const renamingPath = ref<string | null>(null);
const renamingName = ref('');
const explorerRootRef = ref<HTMLElement | null>(null);
const isDeleting = ref(false);
const isDragImportActive = ref(false);
const dragEnterCounter = ref(0);
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0
});
const showDeleteConfirm = ref(false);
const contextMenuRef = ref<HTMLElement | null>(null);
const deleteConfirmPopup = reactive({
  x: 0,
  y: 0
});
const nameTooltip = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0
});
const TOOLTIP_OFFSET_X = 14;
const TOOLTIP_OFFSET_Y = 18;
const openEditorsExpanded = ref(false);
const openFoldersExpanded = ref(true);
const openedEditorTabs = computed(() => state.tabs.filter((tab) => tab.id !== 'home'));
const openedFolders = computed(() =>
  state.activeFolderPath && state.activeFolderName ? [{ path: state.activeFolderPath, name: state.activeFolderName }] : []
);
const openFoldersTitle = computed(() => (openedFolders.value.length > 0 ? t('layout.explorer.openFolders') : t('layout.explorer.noFolder')));

const toggleOpenEditors = () => {
  if (openedEditorTabs.value.length === 0) return;
  openEditorsExpanded.value = !openEditorsExpanded.value;
};

watch(
  openedEditorTabs,
  (tabs) => {
    if (tabs.length === 0) openEditorsExpanded.value = false;
  },
  { deep: true }
);

const showNameTooltip = (event: MouseEvent, text: string) => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  if (target.scrollWidth <= target.clientWidth) return;
  nameTooltip.visible = true;
  nameTooltip.text = text;
  nameTooltip.x = event.clientX + TOOLTIP_OFFSET_X;
  nameTooltip.y = event.clientY + TOOLTIP_OFFSET_Y;
};

const moveNameTooltip = (event: MouseEvent) => {
  if (!nameTooltip.visible) return;
  nameTooltip.x = event.clientX + TOOLTIP_OFFSET_X;
  nameTooltip.y = event.clientY + TOOLTIP_OFFSET_Y;
};

const hideNameTooltip = () => {
  nameTooltip.visible = false;
};

const selectRootEntry = () => {
  if (!state.activeFolderPath || !rootFolder.value) {
    setSelectedExplorerEntry(null);
    return;
  }
  setSelectedExplorerEntry({
    name: rootFolder.value,
    path: state.activeFolderPath,
    type: 'directory'
  });
};

const selectNodeEntry = (item: FileTreeNode) => {
  setSelectedExplorerEntry({
    name: item.name,
    path: item.path,
    type: item.type,
    size: item.size,
    modifiedAt: item.modifiedAt
  });
};

const closeContextMenu = () => {
  contextMenu.visible = false;
  showDeleteConfirm.value = false;
  contextEditorTabId.value = null;
};

const handleExplorerClick = (event: MouseEvent) => {
  closeContextMenu();
  if (!creatingParentPath.value) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('.creating-folder-inline')) return;
  cancelCreateFolder();
};

const openContextMenu = (event: MouseEvent) => {
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.visible = true;
  showDeleteConfirm.value = false;
};

const focusCreateFolderInput = () => {
  void nextTick(() => {
    const input = explorerRootRef.value?.querySelector<HTMLInputElement>('.creating-row .create-input');
    if (!input) return;
    input.focus();
    input.select();
  });
};

const focusRenameInput = () => {
  void nextTick(() => {
    const input = explorerRootRef.value?.querySelector<HTMLInputElement>('.rename-input');
    if (!input) return;
    input.focus();
    input.select();
  });
};

const openContextMenuForRoot = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  selectedPath.value = state.activeFolderPath;
  selectRootEntry();
  contextTarget.value = null;
  contextEditorTabId.value = null;
  if (!state.activeFolderPath) return;
  openContextMenu(event);
};

const openContextMenuForBlank = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const target = event.target as HTMLElement | null;
  if (target?.closest('.tree-item-header')) return;
  selectedPath.value = state.activeFolderPath;
  selectRootEntry();
  contextTarget.value = null;
  contextEditorTabId.value = null;
  openContextMenu(event);
};

const openContextMenuForNode = (item: FileTreeNode, event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  selectedPath.value = item.path;
  selectNodeEntry(item);
  contextTarget.value = item;
  contextEditorTabId.value = null;
  openContextMenu(event);
};

const openContextMenuForOpenedEditor = (tabId: string, event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  switchToTab(tabId);
  contextTarget.value = null;
  contextEditorTabId.value = tabId;
  openContextMenu(event);
};

const handleSelectNode = (item: FileTreeNode) => {
  selectedPath.value = item.path;
  selectNodeEntry(item);
};

const handleRootClick = () => {
  selectedPath.value = state.activeFolderPath;
  selectRootEntry();
  toggleRootFolder();
};

const handleExplorerDoubleClick = async (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('.tree-item-header, .create-input, .explorer-context-menu, .delete-confirm-popup')) {
    return;
  }
  await uiActions.openFolder();
};

const handleOpenFolderFromContextMenu = async () => {
  closeContextMenu();
  await uiActions.openFolder();
};

const handleCloseEditorFromContextMenu = () => {
  if (!contextEditorTabId.value) return;
  closeTab(contextEditorTabId.value);
  closeContextMenu();
};

const handleDragEnterExplorer = () => {
  dragEnterCounter.value += 1;
  isDragImportActive.value = true;
};

const handleDragOverExplorer = () => {
  isDragImportActive.value = true;
};

const handleDragLeaveExplorer = () => {
  dragEnterCounter.value = Math.max(0, dragEnterCounter.value - 1);
  if (dragEnterCounter.value === 0) {
    isDragImportActive.value = false;
  }
};

const handleDropOnExplorer = async (event: DragEvent) => {
  dragEnterCounter.value = 0;
  isDragImportActive.value = false;
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return;

  const droppedFiles = Array.from(dataTransfer.files ?? []);
  let droppedPaths = droppedFiles
    .map((item) => (item as File & { path?: string }).path)
    .filter((item): item is string => Boolean(item));

  if (droppedPaths.length === 0) {
    const uriList = dataTransfer.getData('text/uri-list') || dataTransfer.getData('text/plain');
    if (uriList) {
      droppedPaths = uriList
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          if (!item.startsWith('file://')) return '';
          try {
            return decodeURIComponent(item.replace(/^file:\/\/\/?/, ''));
          } catch {
            return '';
          }
        })
        .filter(Boolean);
    }
  }

  if (droppedPaths.length === 0) return;

  const normalizeParentPath = (targetPath: string) => {
    const normalized = targetPath.replace(/[\\/]+$/, '');
    const match = normalized.match(/^(.*)[\\/][^\\/]+$/);
    return match?.[1] ?? normalized;
  };

  // 优先尝试将拖入项作为目录打开；若拖入的是文件则回退到其父目录
  let folderPath = droppedPaths[0];
  try {
    await electronBridge.readDirectoryDetailed(folderPath);
  } catch {
    folderPath = normalizeParentPath(folderPath);
  }
  if (!folderPath) return;

  try {
    await loadFolder(folderPath);
    selectedPath.value = folderPath;
    selectRootEntry();
    await electronBridge.watchExplorerFolder(folderPath);
    electronBridge.publishFolderOpened(folderPath);
  } catch {
    ElMessage.error(t('layout.explorer.loadFolderFailed'));
  }
};

const getCurrentRootPath = () => state.activeFolderPath ?? '';

const getParentPath = (targetPath: string) => {
  const normalized = targetPath.replace(/[\\/]+$/, '');
  const match = normalized.match(/^(.*)[\\/][^\\/]+$/);
  return match?.[1] ?? normalized;
};

const findNodeByPath = (nodes: FileTreeNode[], targetPath: string): FileTreeNode | null => {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeByPath(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
};

const getSiblingNodesForCreate = (parentPath: string): FileTreeNode[] => {
  const rootPath = state.activeFolderPath ?? '';
  if (!rootPath) return [];
  if (parentPath === rootPath) {
    return fileTree.value;
  }
  const parentNode = findNodeByPath(fileTree.value, parentPath);
  return parentNode?.children ?? [];
};

const getSiblingNodesForRename = (targetPath: string): FileTreeNode[] => {
  const rootPath = state.activeFolderPath ?? '';
  if (!rootPath) return [];
  const parentPath = getParentPath(targetPath);
  if (parentPath === rootPath) {
    return fileTree.value;
  }
  const parentNode = findNodeByPath(fileTree.value, parentPath);
  return parentNode?.children ?? [];
};

const isCreateFolderNameDuplicate = computed(() => {
  const parent = creatingParentPath.value;
  const raw = creatingFolderName.value.trim();
  if (!parent || !raw) return false;
  if (/[\\/:"*?<>|]/.test(raw)) return false;
  const siblings = getSiblingNodesForCreate(parent);
  const lower = raw.toLowerCase();
  return siblings.some((n) => n.name.toLowerCase() === lower);
});

const isRenameNameDuplicate = computed(() => {
  const targetPath = renamingPath.value;
  const raw = renamingName.value.trim();
  if (!targetPath || !raw) return false;
  if (/[\\/:"*?<>|]/.test(raw)) return false;
  const siblings = getSiblingNodesForRename(targetPath);
  const lower = raw.toLowerCase();
  return siblings.some((n) => n.path !== targetPath && n.name.toLowerCase() === lower);
});

const removeNodeByPath = (nodes: FileTreeNode[], targetPath: string): FileTreeNode[] => {
  const next: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.path === targetPath) continue;
    const cloned: FileTreeNode = {
      ...node,
      children: node.children ? removeNodeByPath(node.children, targetPath) : undefined
    };
    next.push(cloned);
  }
  return next;
};

const mergeNodesKeepingExpandedState = (nextNodes: FileTreeNode[], prevNodes: FileTreeNode[]): FileTreeNode[] => {
  const prevMap = new Map(prevNodes.map((node) => [node.path, node]));
  return nextNodes.map((node) => {
    const prev = prevMap.get(node.path);
    if (!prev) return node;

    const merged: FileTreeNode = {
      ...node,
      expanded: prev.expanded
    };

    if (prev.expanded && prev.children && prev.children.length > 0) {
      merged.children = prev.children;
    }
    return merged;
  });
};

const normalizePathTrim = (p: string) => p.replace(/[/\\]+$/, '') || p;

const expandDirectoryIfNeeded = async (node: FileTreeNode) => {
  if (node.type !== 'directory') return;
  if (!node.expanded) {
    node.expanded = true;
  }
  if (!node.children || node.children.length === 0) {
    node.children = await explorerService.loadDirectoryNodes(node.path);
  }
};

/** 从工作区根展开到 descendantPath（含）路径上的每一级目录，便于看到新建节点 */
const ensureExpandedToPath = async (rootPath: string, descendantPath: string) => {
  rootExpanded.value = true;
  const root = normalizePathTrim(rootPath);
  const full = normalizePathTrim(descendantPath);
  if (!full.toLowerCase().startsWith(root.toLowerCase())) return;

  const rest = full.slice(root.length).replace(/^[\\/]+/, '');
  if (!rest) return;

  const segments = rest.split(/[/\\]+/).filter(Boolean);
  let acc = root;
  for (const seg of segments) {
    acc = explorerService.getChildPath(acc, seg);
    const node = findNodeByPath(fileTree.value, acc);
    if (!node) continue;
    await expandDirectoryIfNeeded(node);
  }
};

const handleRevealInFolder = async () => {
  const rootPath = getCurrentRootPath();
  if (!rootPath) return;
  const selectedTarget =
    contextTarget.value ?? (selectedPath.value ? ({ path: selectedPath.value } as FileTreeNode) : null);
  const targetPath = explorerService.getRevealTargetPath(selectedTarget, rootPath);
  await explorerService.revealInFolder(targetPath);
  closeContextMenu();
};

const handleCreateFolder = async () => {
  const rootPath = getCurrentRootPath();
  if (!rootPath) return;
  cancelRename();
  // 优先使用右键目标；若为空则回退到当前选中的目录
  let effectiveTarget = contextTarget.value;
  if (!effectiveTarget && selectedPath.value && selectedPath.value !== rootPath) {
    const selectedNode = findNodeByPath(fileTree.value, selectedPath.value);
    if (selectedNode?.type === 'directory') {
      effectiveTarget = selectedNode;
    }
  }

  if (effectiveTarget?.type === 'directory' && !effectiveTarget.expanded) {
    await toggleItem(effectiveTarget);
  }
  if (!rootExpanded.value) {
    rootExpanded.value = true;
  }

  const parentPath = explorerService.getDirectoryForCreate(effectiveTarget, rootPath);
  creatingFolderName.value = '';
  creatingParentPath.value = parentPath;
  closeContextMenu();
  focusCreateFolderInput();
};

const cancelRename = () => {
  renamingPath.value = null;
  renamingName.value = '';
};

const handleStartRename = () => {
  if (!contextTarget.value) return;
  renamingPath.value = contextTarget.value.path;
  renamingName.value = contextTarget.value.name;
  closeContextMenu();
  focusRenameInput();
};

const applyRenameToTree = (nodes: FileTreeNode[], fromPath: string, toPath: string, toName: string): FileTreeNode[] => {
  const normalize = (value: string) => value.replace(/[\\/]+$/, '');
  const fromNorm = normalize(fromPath);
  return nodes.map((node) => {
    const currentNorm = normalize(node.path);
    const matched = currentNorm === fromNorm || currentNorm.startsWith(`${fromNorm}\\`) || currentNorm.startsWith(`${fromNorm}/`);
    const nextPath = matched ? `${toPath}${node.path.slice(fromPath.length)}` : node.path;
    const nextName = currentNorm === fromNorm ? toName : node.name;
    return {
      ...node,
      name: nextName,
      path: nextPath,
      children: node.children ? applyRenameToTree(node.children, fromPath, toPath, toName) : undefined
    };
  });
};

const submitRename = async () => {
  const targetPath = renamingPath.value;
  const rootPath = getCurrentRootPath();
  const nextName = renamingName.value.trim();
  if (!targetPath || !rootPath) return;
  if (!nextName) {
    cancelRename();
    return;
  }
  if (/[\\/:"*?<>|]/.test(nextName)) {
    ElMessage.warning(t('layout.explorer.folderNameInvalid'));
    return;
  }
  if (isRenameNameDuplicate.value) return;

  const previousPath = targetPath;
  const result = await explorerService.renameEntry(previousPath, nextName);
  if (!result.success) {
    ElMessage.error(t('layout.explorer.renameFailed'));
    return;
  }

  if (result.nextPath !== previousPath) {
    fileTree.value = applyRenameToTree(fileTree.value, previousPath, result.nextPath, nextName);
    if (selectedPath.value === previousPath) {
      selectedPath.value = result.nextPath;
      setSelectedExplorerEntry({
        name: nextName,
        path: result.nextPath,
        type: contextTarget.value?.type ?? 'file',
        size: contextTarget.value?.size,
        modifiedAt: contextTarget.value?.modifiedAt
      });
    }
  }
  cancelRename();
  ElMessage.success(t('layout.explorer.renameSuccess'));
};

const handleRenameInputBlur = () => {
  if (!renamingPath.value) return;
  if (!renamingName.value.trim()) {
    cancelRename();
    return;
  }
  if (isRenameNameDuplicate.value) {
    void nextTick(() => focusRenameInput());
    return;
  }
  void submitRename();
};

const handleCloseFolder = () => {
  if (contextTarget.value || !state.activeFolderPath) {
    closeContextMenu();
    return;
  }
  void electronBridge.unwatchExplorerFolder();
  closeFolder();
  selectedPath.value = null;
  setSelectedExplorerEntry(null);
  contextTarget.value = null;
  cancelCreateFolder();
  cancelRename();
  closeContextMenu();
};

const cancelCreateFolder = () => {
  creatingParentPath.value = null;
  creatingFolderName.value = '';
};

const submitCreateFolder = async () => {
  const rootPath = getCurrentRootPath();
  const parentPath = creatingParentPath.value;
  const folderName = creatingFolderName.value.trim();
  if (!rootPath || !parentPath) return;
  if (!folderName) {
    cancelCreateFolder();
    return;
  }
  if (/[\\/:"*?<>|]/.test(folderName)) {
    ElMessage.warning(t('layout.explorer.folderNameInvalid'));
    return;
  }
  if (isCreateFolderNameDuplicate.value) {
    return;
  }

  try {
    const created = await explorerService.createDirectory(parentPath, folderName);
    if (created) {
      if (parentPath === rootPath) {
        const previousRootNodes = [...fileTree.value];
        const refreshedRootNodes = await explorerService.loadDirectoryNodes(rootPath);
        fileTree.value = mergeNodesKeepingExpandedState(refreshedRootNodes, previousRootNodes);
        rootExpanded.value = true;
      } else {
        const parentNode = findNodeByPath(fileTree.value, parentPath);
        if (parentNode) {
          const prevChildren = parentNode.children ? [...parentNode.children] : [];
          const refreshedChildren = await explorerService.loadDirectoryNodes(parentPath);
          parentNode.children = mergeNodesKeepingExpandedState(refreshedChildren, prevChildren);
          parentNode.expanded = true;
        } else {
          await loadFolder(rootPath);
        }
      }
      const newFolderPath = explorerService.getChildPath(parentPath, folderName);
      await ensureExpandedToPath(rootPath, newFolderPath);
      selectedPath.value = newFolderPath;
      ElMessage.success(t('layout.explorer.createFolderSuccess'));
      cancelCreateFolder();
    } else {
      ElMessage.error(t('layout.explorer.createFolderFailed'));
    }
  } catch {
    ElMessage.error(t('layout.explorer.createFolderFailed'));
  }
};

const handleCreateFolderInputBlur = () => {
  if (!creatingParentPath.value) return;
  if (!creatingFolderName.value.trim()) {
    cancelCreateFolder();
    return;
  }
  if (isCreateFolderNameDuplicate.value) {
    void nextTick(() => focusCreateFolderInput());
    return;
  }
  void submitCreateFolder();
};

const toggleDeleteConfirm = () => {
  if (!showDeleteConfirm.value) {
    void nextTick(() => {
      const rect = contextMenuRef.value?.getBoundingClientRect();
      deleteConfirmPopup.x = rect?.left ?? contextMenu.x;
      deleteConfirmPopup.y = (rect?.bottom ?? contextMenu.y) + 8;
      showDeleteConfirm.value = true;
    });
    return;
  }
  showDeleteConfirm.value = false;
};

const cancelDeleteConfirm = () => {
  showDeleteConfirm.value = false;
};

const confirmDeleteEntry = async () => {
  const target = contextTarget.value;
  const rootPath = getCurrentRootPath();
  if (!target || !rootPath || isDeleting.value) return;
  isDeleting.value = true;

  try {
    // 先在树上移除节点，再执行文件系统删除（乐观更新）
    const prevTree = fileTree.value;
    fileTree.value = removeNodeByPath(fileTree.value, target.path);

    await electronBridge.unwatchExplorerFolder();
    const deleted = await explorerService.deleteEntry(target.path);
    if (!deleted) {
      fileTree.value = prevTree;
      ElMessage.error(t('layout.explorer.deleteFailed'));
      closeContextMenu();
      return;
    }

    if (target.path === selectedPath.value) {
      selectedPath.value = rootPath;
      selectRootEntry();
    }
    await loadFolder(rootPath);
    ElMessage.success(t('layout.explorer.deleteSuccess'));
    closeContextMenu();
  } catch {
    // 删除异常时回滚树并重载一次，确保状态一致
    await loadFolder(rootPath);
    ElMessage.error(t('layout.explorer.deleteFailed'));
    closeContextMenu();
  } finally {
    if (state.activeFolderPath) {
      try {
        await electronBridge.watchExplorerFolder(state.activeFolderPath);
      } catch (_error) {
        // watcher 重建失败时保持静默，避免再次触发异常中断
      }
    }
    isDeleting.value = false;
  }
};

onMounted(() => {
  if (state.activeFolderPath) {
    selectedPath.value = state.activeFolderPath;
    selectRootEntry();
  }
  if (state.activeFolderPath) {
    void electronBridge.watchExplorerFolder(state.activeFolderPath);
  }

  unsubscribeFolderOpened = electronBridge.subscribeFolderOpened((folderPath) => {
    cancelRename();
    selectedPath.value = folderPath;
    setSelectedExplorerEntry({
      name: folderPath.split(/[\\/]/).filter(Boolean).at(-1) ?? folderPath,
      path: folderPath,
      type: 'directory'
    });
    void electronBridge.watchExplorerFolder(folderPath);
    void loadFolder(folderPath).catch(() => {
      ElMessage.error(t('layout.explorer.loadFolderFailed'));
    });
  });

  unsubscribeFolderChanged = electronBridge.subscribeExplorerFolderChanged((payload) => {
    if (!state.activeFolderPath) return;
    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
    }
    refreshTimer = window.setTimeout(() => {
      if (!state.activeFolderPath) return;
      void loadFolder(state.activeFolderPath).catch(() => {
        // watcher 触发时目录可能刚被删除，静默保护避免异常中断
      });
    }, 180);
  });

  document.addEventListener('click', closeContextMenu);
});
onUnmounted(() => {
  hideNameTooltip();
  unsubscribeFolderOpened?.();
  unsubscribeFolderChanged?.();
  unsubscribeFolderOpened = null;
  unsubscribeFolderChanged = null;
  if (refreshTimer) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  dragEnterCounter.value = 0;
  isDragImportActive.value = false;
  void electronBridge.unwatchExplorerFolder();
  document.removeEventListener('click', closeContextMenu);
});
</script>

<style scoped>
.file-explorer { height: 100%; display: flex; flex-direction: column; background-color: var(--app-bg); color: var(--app-text-regular); }
.explorer-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-height: 0; }
.virtual-tree-groups {
  padding-top: 4px;
  margin-bottom: 4px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.virtual-tree-groups > .tree-item:last-child {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.virtual-tree-groups > .tree-item:last-child > .group-children {
  flex: 1;
  min-height: 0;
}
.group-root {
  font-weight: 500;
}
.group-children {
  margin-left: 16px;
  display: flex;
  flex-direction: column;
}
.group-placeholder {
  color: var(--app-text-faint);
}
.group-leaf-btn {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
}
.group-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 8px;
  padding: 12px 10px;
  min-height: 0;
  flex: 1;
  color: var(--app-text-subtle);
  text-align: center;
  border: none;
  border-radius: 0;
  background-color: transparent;
}
.group-empty-state .empty-hint {
  margin-top: 4px;
  padding: 0;
  border: none;
  border-radius: 0;
  background-color: transparent;
}
.explorer-content.drag-open-active {
  box-shadow: inset 0 0 0 1px var(--app-accent, #3b82f6);
  background-color: color-mix(in srgb, var(--app-accent, #3b82f6) 8%, transparent);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  color: var(--app-text-subtle);
  text-align: center;
  padding: 0 12px;
}
.empty-state p {
  max-width: 170px;
  line-height: 1.35;
  word-break: break-word;
}
.empty-icon {
  font-size: 20px;
  line-height: 1;
}
.empty-hint {
  font-size: 12px;
}
.tree-item-header {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 26px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--app-text-regular);
  cursor: pointer;
}
.tree-item-header:hover { background-color: var(--app-bg-soft-hover); }
.tree-item-header.selected { background-color: var(--app-bg-hover); color: var(--app-text-primary); }
.expand-icon { width: 12px; height: 12px; margin-right: 4px; color: var(--app-text-subtle); }
.placeholder-icon { opacity: 0; }
.file-icon { width: 14px; height: 14px; margin-right: 6px; color: var(--app-text-subtle); }
.file-name {
  flex: 1;
  min-width: 0;
  line-height: 1;
  color: var(--app-text-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-hover-tip {
  position: fixed;
  z-index: 5000;
  max-width: 260px;
  padding: 5px 8px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  color: var(--app-text-regular);
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
  pointer-events: none;
}

.tree-children {
  margin-left: 16px;
  overflow: visible;
}

.creating-row {
  padding-right: 10px;
}

.creating-row.creating-folder-inline {
  overflow: visible;
  position: relative;
  z-index: 2;
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
.explorer-context-menu {
  position: fixed;
  z-index: 2400;
  min-width: 168px;
  padding: 4px;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}
.context-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: var(--app-text-regular);
  text-align: left;
  padding: 7px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.2;
}
.context-menu-item:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.context-menu-divider {
  height: 1px;
  margin: 6px 6px;
  background-color: var(--app-border);
  opacity: 0.8;
}

.context-menu-item.danger:hover {
  background-color: rgba(220, 53, 69, 0.2);
  color: #ff7b86;
}

.delete-confirm-popup {
  position: fixed;
  z-index: 2500;
  min-width: 168px;
  padding: 8px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background-color: var(--app-bg-elevated);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.delete-confirm-title {
  font-size: 11px;
  color: var(--app-text-subtle);
  margin-bottom: 6px;
}

.delete-confirm-row {
  display: flex;
  gap: 6px;
}

.confirm-btn,
.cancel-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--app-border);
  border-radius: 5px;
  background-color: var(--app-bg-elevated);
  color: var(--app-text-regular);
  font-size: 12px;
  line-height: 1;
  height: 26px;
  cursor: pointer;
}

.confirm-btn:hover {
  border-color: rgba(220, 53, 69, 0.45);
  background-color: rgba(220, 53, 69, 0.18);
  color: #ff7b86;
}

.cancel-btn:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}
</style>
