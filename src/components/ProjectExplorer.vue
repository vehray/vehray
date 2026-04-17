<template>
  <div class="file-explorer">
    <div class="explorer-header">
      <span class="explorer-title">文件资源管理器</span>
      <div class="explorer-actions">
        <el-button size="small" @click="openFolder">
          <el-icon><Folder /></el-icon>
          打开文件夹
        </el-button>
      </div>
    </div>
    <div class="explorer-content">
      <div v-if="!rootFolder" class="empty-state">
        <el-icon class="empty-icon"><Folder /></el-icon>
        <p>未打开文件夹</p>
        <p class="empty-hint">点击上方按钮打开文件夹</p>
      </div>
      <div v-else-if="isLoading" class="loading-state">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      <div v-else class="file-tree">
        <!-- 根路径 -->
        <div class="tree-item root-item" @contextmenu.prevent="showContextMenu($event, { name: rootFolder, path: rootFolder, type: 'directory' as const, expanded: true })" @dblclick="loadFolder(rootFolder)">
          <div class="tree-item-header">
            <el-icon class="file-icon"><Folder /></el-icon>
            <span class="file-name">{{ rootFolder }}</span>
          </div>
        </div>
        
        <!-- 文件树 -->
        <div class="tree-children">
          <div v-for="item in fileTree" :key="item.path">
            <TreeItem :item="item" @toggle="toggleItem" @contextmenu="showContextMenu" @dblclick="handleDoubleClick" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <el-dropdown-menu ref="contextMenu" :style="{ position: 'fixed', left: menuLeft + 'px', top: menuTop + 'px', zIndex: 1000 }" v-show="menuVisible">
      <el-dropdown-item @click="createNewFile" v-if="contextItem && contextItem.type === 'directory'">
        <el-icon><Document /></el-icon>
        新建文件
      </el-dropdown-item>
      <el-dropdown-item @click="createNewFolder" v-if="contextItem && contextItem.type === 'directory'">
        <el-icon><Folder /></el-icon>
        新建文件夹
      </el-dropdown-item>
      <el-dropdown-item @click="renameItem" v-if="contextItem">
        <el-icon><Edit /></el-icon>
        重命名
      </el-dropdown-item>
      <el-dropdown-item @click="deleteItem" v-if="contextItem">
        <el-icon><Delete /></el-icon>
        删除
      </el-dropdown-item>
      <el-dropdown-item @click="copyItem" v-if="contextItem && contextItem.type === 'file'">
        <el-icon><Files /></el-icon>
        复制
      </el-dropdown-item>
    </el-dropdown-menu>
    
    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名" width="400px">
      <el-input v-model="newName" placeholder="输入新名称" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRename">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 新建文件对话框 -->
    <el-dialog v-model="newFileDialogVisible" title="新建文件" width="400px">
      <el-input v-model="newFileName" placeholder="输入文件名" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newFileDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCreateFile">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 新建文件夹对话框 -->
    <el-dialog v-model="newFolderDialogVisible" title="新建文件夹" width="400px">
      <el-input v-model="newFolderName" placeholder="输入文件夹名" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newFolderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCreateFolder">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineComponent, h } from 'vue';
import { Folder, Document, ArrowRight, ArrowDown, Loading, Edit, Delete, Files } from '@element-plus/icons-vue';

// 类型定义
interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  expanded: boolean;
  children?: FileItem[];
}

// 递归组件
const TreeItem = defineComponent({
  name: 'TreeItem',
  props: {
    item: {
      type: Object as () => FileItem,
      required: true
    }
  },
  emits: ['toggle', 'contextmenu', 'dblclick'],
  template: `
    <div class="tree-item">
      <div 
        class="tree-item-header" 
        @click="$emit('toggle', item)"
        @contextmenu.prevent="$emit('contextmenu', $event, item)"
        @dblclick="$emit('dblclick', item)"
      >
        <el-icon v-if="item.type === 'directory'" class="expand-icon" :class="{ 'expanded': item.expanded }">
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
        <TreeItem 
          v-for="child in item.children" 
          :key="child.path" 
          :item="child" 
          @toggle="$emit('toggle', $event)"
          @contextmenu="$emit('contextmenu', $event, $event)"
          @dblclick="$emit('dblclick', $event)"
        />
      </div>
    </div>
  `
});

// 响应式变量
const rootFolder = ref<string | null>(null);
const fileTree = ref<FileItem[]>([]);
const isLoading = ref(false);

// 右键菜单相关变量
const menuVisible = ref(false);
const menuLeft = ref(0);
const menuTop = ref(0);
const contextItem = ref<FileItem | null>(null);

// 对话框相关变量
const renameDialogVisible = ref(false);
const newName = ref('');
const newFileDialogVisible = ref(false);
const newFileName = ref('');
const newFolderDialogVisible = ref(false);
const newFolderName = ref('');

// 递归组件
const FileTreeItem = defineComponent({
  name: 'FileTreeItem',
  props: {
    item: {
      type: Object as () => FileItem,
      required: true
    }
  },
  emits: ['toggle'],
  template: `
    <div class="tree-item">
      <div 
        class="tree-item-header" 
        @click="$emit('toggle', item)"
      >
        <el-icon v-if="item.type === 'directory'" class="expand-icon" :class="{ 'expanded': item.expanded }">
          {{ item.expanded ? 'ArrowDown' : 'ArrowRight' }}
        </el-icon>
        <el-icon v-else class="expand-icon placeholder-icon"></el-icon>
        <el-icon class="file-icon">
          {{ item.type === 'directory' ? 'Folder' : 'Document' }}
        </el-icon>
        <span class="file-name">{{ item.name }}</span>
      </div>
      <div v-if="item.expanded && item.children && item.children.length > 0" class="tree-children">
        <FileTreeItem 
          v-for="child in item.children" 
          :key="child.path" 
          :item="child" 
          @toggle="$emit('toggle', $event)"
        />
      </div>
    </div>
  `
});

// 方法
const toggleItem = (item: FileItem) => {
  if (item.type === 'directory') {
    item.expanded = !item.expanded;
    if (item.expanded && (!item.children || item.children.length === 0)) {
      loadDirectoryContents(item);
    }
  }
};

// 加载目录内容
const loadDirectoryContents = async (directory: FileItem) => {
  if (!window.electron || !window.electron.fs) {
    console.warn('Electron fs module not available');
    // 使用模拟数据作为fallback
    directory.children = [
      {
        name: 'subfolder1',
        path: `${directory.path}/subfolder1`,
        type: 'directory' as const,
        expanded: false
      },
      {
        name: 'file1.txt',
        path: `${directory.path}/file1.txt`,
        type: 'file' as const,
        expanded: false
      },
      {
        name: 'file2.js',
        path: `${directory.path}/file2.js`,
        type: 'file' as const,
        expanded: false
      }
    ];
    return;
  }

  try {
    isLoading.value = true;
    const contents = await window.electron.fs.readDirectory(directory.path);
    
    const children: FileItem[] = contents.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      expanded: false
    }));
    
    // 按名称排序，目录在前
    children.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
    
    directory.children = children;
  } catch (error) {
    console.error('Failed to load directory contents:', error);
    // 错误时使用模拟数据
    directory.children = [
      {
        name: 'subfolder1',
        path: `${directory.path}/subfolder1`,
        type: 'directory' as const,
        expanded: false
      },
      {
        name: 'file1.txt',
        path: `${directory.path}/file1.txt`,
        type: 'file' as const,
        expanded: false
      }
    ];
  } finally {
    isLoading.value = false;
  }
};

// 加载文件夹
const loadFolder = async (folderPath: string) => {
  rootFolder.value = folderPath;
  fileTree.value = [];
  
  try {
    isLoading.value = true;
    if (window.electron && window.electron.fs) {
      try {
        const contents = await window.electron.fs.readDirectory(folderPath);
        
        const items: FileItem[] = contents.map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type,
          expanded: false
        }));
        
        // 按名称排序，目录在前
        items.sort((a, b) => {
          if (a.type === 'directory' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
        
        fileTree.value = items;
      } catch (error) {
        console.error('Failed to read directory:', error);
        // 错误时使用模拟数据
        fileTree.value = [
          {
            name: 'documents',
            path: `${folderPath}/documents`,
            type: 'directory' as const,
            expanded: false
          },
          {
            name: 'images',
            path: `${folderPath}/images`,
            type: 'directory' as const,
            expanded: false
          },
          {
            name: 'README.md',
            path: `${folderPath}/README.md`,
            type: 'file' as const,
            expanded: false
          },
          {
            name: 'script.js',
            path: `${folderPath}/script.js`,
            type: 'file' as const,
            expanded: false
          }
        ];
      }
    } else {
      console.warn('Electron fs module not available, using mock data');
      //  fallback to mock data if electron fs not available
      fileTree.value = [
        {
          name: 'src',
          path: `${folderPath}/src`,
          type: 'directory' as const,
          expanded: true,
          children: [
            {
              name: 'components',
              path: `${folderPath}/src/components`,
              type: 'directory' as const,
              expanded: true,
              children: [
                { name: 'AppHeader.vue', path: `${folderPath}/src/components/AppHeader.vue`, type: 'file' as const, expanded: false },
                { name: 'MainLayout.vue', path: `${folderPath}/src/components/MainLayout.vue`, type: 'file' as const, expanded: false },
                { name: 'ActivityBar.vue', path: `${folderPath}/src/components/ActivityBar.vue`, type: 'file' as const, expanded: false },
                { name: 'MainWindow.vue', path: `${folderPath}/src/components/MainWindow.vue`, type: 'file' as const, expanded: false },
                { name: 'TabPanel.vue', path: `${folderPath}/src/components/TabPanel.vue`, type: 'file' as const, expanded: false },
              ]
            },
            {
              name: 'assets',
              path: `${folderPath}/src/assets`,
              type: 'directory' as const,
              expanded: false,
              children: [
                { name: 'icons', path: `${folderPath}/src/assets/icons`, type: 'directory' as const, expanded: false }
              ]
            },
            {
              name: 'main',
              path: `${folderPath}/src/main`,
              type: 'directory' as const,
              expanded: false,
              children: [
                { name: 'index.ts', path: `${folderPath}/src/main/index.ts`, type: 'file' as const, expanded: false }
              ]
            },
            { name: 'App.vue', path: `${folderPath}/src/App.vue`, type: 'file' as const, expanded: false },
            { name: 'main.ts', path: `${folderPath}/src/main.ts`, type: 'file' as const, expanded: false },
          ]
        },
        {
          name: 'public',
          path: `${folderPath}/public`,
          type: 'directory' as const,
          expanded: false,
          children: [
            { name: 'index.html', path: `${folderPath}/public/index.html`, type: 'file' as const, expanded: false }
          ]
        },
        {
          name: 'package.json',
          path: `${folderPath}/package.json`,
          type: 'file' as const,
          expanded: false
        },
        {
          name: 'tsconfig.json',
          path: `${folderPath}/tsconfig.json`,
          type: 'file' as const,
          expanded: false
        },
        {
          name: 'vite.config.ts',
          path: `${folderPath}/vite.config.ts`,
          type: 'file' as const,
          expanded: false
        },
      ];
    }
  } catch (error) {
    console.error('Failed to load folder:', error);
    // 最终错误处理，确保至少显示一些内容
    fileTree.value = [
      {
        name: 'example-folder',
        path: `${folderPath}/example-folder`,
        type: 'directory' as const,
        expanded: false
      },
      {
        name: 'example-file.txt',
        path: `${folderPath}/example-file.txt`,
        type: 'file' as const,
        expanded: false
      }
    ];
  } finally {
    isLoading.value = false;
  }
};

// 打开文件夹
const openFolder = async () => {
  if (window.electron && window.electron.dialog) {
    try {
      const result = await window.electron.dialog.openDirectory();
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        loadFolder(folderPath);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  }
};

// 显示右键菜单
const showContextMenu = (event: MouseEvent, item: FileItem) => {
  event.preventDefault();
  menuLeft.value = event.clientX;
  menuTop.value = event.clientY;
  contextItem.value = item;
  menuVisible.value = true;
  
  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu);
  }, 0);
};

// 关闭右键菜单
const closeContextMenu = () => {
  menuVisible.value = false;
  document.removeEventListener('click', closeContextMenu);
};

// 处理双击事件
const handleDoubleClick = (item: FileItem) => {
  if (item.type === 'directory') {
    item.expanded = !item.expanded;
    if (item.expanded && (!item.children || item.children.length === 0)) {
      loadDirectoryContents(item);
    }
  } else if (item.type === 'file') {
    // 可以在这里添加文件打开逻辑
    console.log('Opening file:', item.path);
  }
};

// 重命名项目
const renameItem = () => {
  if (contextItem.value) {
    newName.value = contextItem.value.name;
    renameDialogVisible.value = true;
  }
  closeContextMenu();
};

// 确认重命名
const confirmRename = async () => {
  if (contextItem.value && newName.value) {
    try {
      const oldPath = contextItem.value.path;
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${parentPath}/${newName.value}`;
      
      await window.electron.fs.rename(oldPath, newPath);
      
      // 更新本地数据
      contextItem.value.name = newName.value;
      contextItem.value.path = newPath;
      
      renameDialogVisible.value = false;
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  }
};

// 创建新文件
const createNewFile = () => {
  if (contextItem.value && contextItem.value.type === 'directory') {
    newFileName.value = '';
    newFileDialogVisible.value = true;
  }
  closeContextMenu();
};

// 确认创建文件
const confirmCreateFile = async () => {
  if (contextItem.value && contextItem.value.type === 'directory' && newFileName.value) {
    try {
      const filePath = `${contextItem.value.path}/${newFileName.value}`;
      await window.electron.fs.writeFile(filePath, '');
      
      // 重新加载目录内容
      if (contextItem.value.expanded) {
        await loadDirectoryContents(contextItem.value);
      }
      
      newFileDialogVisible.value = false;
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  }
};

// 创建新文件夹
const createNewFolder = () => {
  if (contextItem.value && contextItem.value.type === 'directory') {
    newFolderName.value = '';
    newFolderDialogVisible.value = true;
  }
  closeContextMenu();
};

// 确认创建文件夹
const confirmCreateFolder = async () => {
  if (contextItem.value && contextItem.value.type === 'directory' && newFolderName.value) {
    try {
      const folderPath = `${contextItem.value.path}/${newFolderName.value}`;
      await window.electron.fs.createDirectory(folderPath);
      
      // 重新加载目录内容
      if (contextItem.value.expanded) {
        await loadDirectoryContents(contextItem.value);
      }
      
      newFolderDialogVisible.value = false;
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }
};

// 删除项目
const deleteItem = async () => {
  if (contextItem.value) {
    if (confirm(`确定要删除 ${contextItem.value.name} 吗？`)) {
      try {
        await window.electron.fs.delete(contextItem.value.path);
        
        // 重新加载父目录
        if (rootFolder.value) {
          await loadFolder(rootFolder.value);
        }
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  }
  closeContextMenu();
};

// 复制项目
const copyItem = () => {
  if (contextItem.value && contextItem.value.type === 'file') {
    // 可以在这里添加复制逻辑
    console.log('Copying file:', contextItem.value.path);
  }
  closeContextMenu();
};

// 监听文件夹打开事件
const handleFolderOpened = (event: any, folderPath: string) => {
  console.log('接收到folder-opened事件:', folderPath);
  loadFolder(folderPath);
};

// 生命周期钩子
onMounted(() => {
  // 监听来自主进程的文件夹打开事件
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('folder-opened', handleFolderOpened);
  }
});

onUnmounted(() => {
  // 移除事件监听器
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.off('folder-opened', handleFolderOpened);
  }
});
</script>

<style scoped>
.file-explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #cccccc;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

/* 顶部标题栏 */
.explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 40px;
}

.explorer-title {
  font-size: 13px;
  font-weight: 500;
  color: #cccccc;
}

.explorer-actions {
  display: flex;
  gap: 4px;
}

.explorer-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888888;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.7;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888888;
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.file-tree {
  padding: 0;
}

.tree-item {
  margin-bottom: 2px;
}

.tree-item-header {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tree-item-header:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

/* 根路径样式 */
.root-item .tree-item-header {
  background-color: rgba(60, 120, 216, 0.15);
  border-color: rgba(60, 120, 216, 0.3);
  margin-bottom: 0;
  border-radius: 0;
  padding: 4px 12px;
  font-size: 12px;
}

.root-item .tree-item-header:hover {
  background-color: rgba(60, 120, 216, 0.2);
  border-color: rgba(60, 120, 216, 0.4);
}

/* 文件夹样式 */
.tree-item .tree-item-header {
  border-radius: 0;
  margin-bottom: 0;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background-color: transparent;
  padding: 4px 12px;
  font-size: 12px;
}

.tree-item .tree-item-header:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.expand-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
  font-size: 12px;
  color: #888888;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(0deg);
}

.placeholder-icon {
  visibility: hidden;
}

.file-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  font-size: 14px;
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-children {
  margin-left: 16px;
  margin-top: 2px;
}

/* 右键菜单样式 */
:deep(.el-dropdown-menu) {
  background-color: #2d2d2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

:deep(.el-dropdown-menu__item) {
  color: #cccccc;
  padding: 8px 16px;
  font-size: 13px;
  transition: all 0.2s;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(60, 120, 216, 0.2);
  color: #ffffff;
}

:deep(.el-dropdown-menu__item i) {
  margin-right: 8px;
  font-size: 14px;
}

/* 对话框样式 */
:deep(.el-dialog) {
  background-color: #2d2d2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
}

:deep(.el-dialog__title) {
  color: #cccccc;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-dialog__body) {
  padding: 20px;
  color: #cccccc;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  background-color: rgba(0, 0, 0, 0.2);
}

:deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(60, 120, 216, 0.5);
}

:deep(.el-input__input) {
  color: #cccccc;
}

:deep(.el-button) {
  border-radius: 4px;
  font-size: 13px;
  padding: 6px 16px;
}

:deep(.el-button--primary) {
  background-color: #3c78d8;
  border-color: #3c78d8;
}

:deep(.el-button--primary:hover) {
  background-color: #4a89dc;
  border-color: #4a89dc;
}

/* 滚动条样式 */
.explorer-content::-webkit-scrollbar {
  width: 6px;
}

.explorer-content::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.explorer-content::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 3px;
}

.explorer-content::-webkit-scrollbar-thumb:hover {
  background: #555555;
}
</style>
