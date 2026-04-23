import { ref } from 'vue';
import { useUiState, type FileTreeNode } from '../../../state/uiState';
import { explorerService } from '../services/explorerService';

export function useProjectExplorer() {
  const { state, setActiveFolder, setFileTree, clearActiveFolder } = useUiState();
  const isLoading = ref(false);
  const rootExpanded = ref(true);

  const rootFolder = ref<string | null>(state.activeFolderName);
  const fileTree = ref<FileTreeNode[]>([...state.fileTree]);

  const loadDirectoryNodes = async (directoryPath: string): Promise<FileTreeNode[]> => {
    return explorerService.loadDirectoryNodes(directoryPath);
  };

  const loadDirectoryContents = async (directory: FileTreeNode) => {
    isLoading.value = true;
    try {
      directory.children = await loadDirectoryNodes(directory.path);
    } finally {
      isLoading.value = false;
    }
  };

  const toggleItem = async (item: FileTreeNode) => {
    if (item.type !== 'directory') return;
    item.expanded = !item.expanded;
    if (item.expanded && (!item.children || item.children.length === 0)) {
      await loadDirectoryContents(item);
    }
  };

  const toggleRootFolder = () => {
    rootExpanded.value = !rootExpanded.value;
  };

  const loadFolder = async (folderPath: string) => {
    setActiveFolder(folderPath);
    rootFolder.value = state.activeFolderName;
    isLoading.value = true;
    try {
      const nodes = await loadDirectoryNodes(folderPath);
      fileTree.value = nodes;
      setFileTree(nodes);
    } catch (_error) {
      // 目录不存在/被删除时，避免未处理异常导致页面崩溃
      fileTree.value = [];
      setFileTree([]);
    } finally {
      isLoading.value = false;
    }
  };

  const closeFolder = () => {
    clearActiveFolder();
    rootFolder.value = null;
    fileTree.value = [];
    rootExpanded.value = true;
  };

  return {
    rootFolder,
    fileTree,
    isLoading,
    rootExpanded,
    toggleRootFolder,
    toggleItem,
    loadFolder,
    closeFolder
  };
}
