import { ref } from 'vue';
import { electronBridge } from '../../../services/electronBridge';
import { useUiState, type FileTreeNode } from '../../../state/uiState';

const sortNodes = (nodes: FileTreeNode[]) =>
  [...nodes].sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

export function useProjectExplorer() {
  const { state, setActiveFolder, setFileTree } = useUiState();
  const isLoading = ref(false);
  const rootExpanded = ref(true);

  const rootFolder = ref<string | null>(state.activeFolderName);
  const fileTree = ref<FileTreeNode[]>([...state.fileTree]);

  const loadDirectoryNodes = async (directoryPath: string): Promise<FileTreeNode[]> => {
    const entries = await electronBridge.readDirectory(directoryPath);
    return sortNodes(
      entries.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        expanded: false
      }))
    );
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
    } finally {
      isLoading.value = false;
    }
  };

  return {
    rootFolder,
    fileTree,
    isLoading,
    rootExpanded,
    toggleRootFolder,
    toggleItem,
    loadFolder
  };
}
