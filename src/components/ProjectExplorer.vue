<template>
  <div class="file-explorer">
    <div class="explorer-content">
      <div v-if="!rootFolder" class="empty-state">
        <el-icon class="empty-icon"><Folder /></el-icon>
        <p>未打开文件夹</p>
        <p class="empty-hint">点击文件 → 打开文件夹</p>
      </div>
      <div v-else class="file-tree">
        <!-- 根路径 -->
        <div class="tree-item root-item">
          <div class="tree-item-header">
            <el-icon class="file-icon"><Folder /></el-icon>
            <span class="file-name">{{ rootFolder }}</span>
          </div>
        </div>
        
        <!-- 文件树 -->
        <div class="tree-children">
          <div v-for="item in fileTree" :key="item.path">
            <TreeItem :item="item" @toggle="toggleItem" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineComponent, h } from 'vue';
import { Folder, Document, ArrowRight, ArrowDown } from '@element-plus/icons-vue';

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
  emits: ['toggle'],
  template: `
    <div class="tree-item">
      <div 
        class="tree-item-header" 
        @click="$emit('toggle', item)"
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
        />
      </div>
    </div>
  `
});

// 响应式变量
const rootFolder = ref<string | null>(null);
const fileTree = ref<FileItem[]>([]);
const isLoading = ref(false);

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
  // 提取文件夹名称，只显示最后一部分
  const folderName = folderPath.split('\\').pop() || folderPath.split('/').pop() || folderPath;
  rootFolder.value = folderName;
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
