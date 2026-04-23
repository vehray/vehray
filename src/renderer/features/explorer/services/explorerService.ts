import { electronBridge } from '../../../services/electronBridge';
import type { FileTreeNode } from '../../../state/uiState';

const getParentPath = (targetPath: string) => {
  const normalized = targetPath.replace(/[\\/]+$/, '');
  const match = normalized.match(/^(.*)[\\/][^\\/]+$/);
  return match?.[1] ?? normalized;
};

const joinPath = (parentPath: string, childName: string) => {
  const separator = parentPath.includes('\\') ? '\\' : '/';
  const normalizedParent = parentPath.replace(/[\\/]+$/, '');
  return `${normalizedParent}${separator}${childName}`;
};

const sortNodes = (nodes: FileTreeNode[]) =>
  [...nodes].sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

export const explorerService = {
  async loadDirectoryNodes(directoryPath: string): Promise<FileTreeNode[]> {
    const entries = await electronBridge.readDirectoryDetailed(directoryPath);
    return sortNodes(
      entries.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        expanded: false,
        size: item.size,
        modifiedAt: item.modifiedAt
      }))
    );
  },

  getDirectoryForCreate(target: FileTreeNode | null, rootPath: string): string {
    if (!target) return rootPath;
    return target.type === 'directory' ? target.path : getParentPath(target.path);
  },

  getRevealTargetPath(target: FileTreeNode | null, rootPath: string): string {
    return target?.path ?? rootPath;
  },

  /** 与创建目录时使用的路径规则一致，便于创建成功后选中对应节点 */
  getChildPath(parentPath: string, childName: string): string {
    return joinPath(parentPath, childName.trim());
  },

  async createDirectory(parentPath: string, folderName: string): Promise<boolean> {
    if (!folderName.trim()) return false;
    const nextPath = joinPath(parentPath, folderName.trim());
    return electronBridge.createDirectory(nextPath);
  },

  async deleteEntry(targetPath: string): Promise<boolean> {
    if (!targetPath.trim()) return false;
    return electronBridge.deletePath(targetPath);
  },

  async renameEntry(targetPath: string, nextName: string): Promise<{ success: boolean; nextPath: string }> {
    const trimmedPath = targetPath.trim();
    const trimmedName = nextName.trim();
    if (!trimmedPath || !trimmedName) return { success: false, nextPath: trimmedPath };
    const parentPath = getParentPath(trimmedPath);
    const nextPath = joinPath(parentPath, trimmedName);
    if (nextPath === trimmedPath) return { success: true, nextPath };
    const success = await electronBridge.renamePath(trimmedPath, nextPath);
    return { success, nextPath };
  },

  async revealInFolder(targetPath: string): Promise<boolean> {
    return electronBridge.revealInFolder(targetPath);
  }
};
