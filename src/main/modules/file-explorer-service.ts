import fs from 'fs/promises';
import path from 'path';

export type ExplorerEntryType = 'file' | 'directory';

export interface ExplorerEntry {
  name: string;
  path: string;
  type: ExplorerEntryType;
  size: number;
  modifiedAt: number;
}

const toEntryType = (isDirectory: boolean): ExplorerEntryType =>
  isDirectory ? 'directory' : 'file';

export class FileExplorerService {
  static async readDirectory(directoryPath: string): Promise<ExplorerEntry[]> {
    const dirents = await fs.readdir(directoryPath, { withFileTypes: true });

    const entries = await Promise.all(
      dirents.map(async (dirent) => {
        const absolutePath = path.join(directoryPath, dirent.name);
        const stats = await fs.stat(absolutePath);
        return {
          name: dirent.name,
          path: absolutePath,
          type: toEntryType(dirent.isDirectory()),
          size: stats.size,
          modifiedAt: stats.mtimeMs
        } satisfies ExplorerEntry;
      })
    );

    return entries.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  static async createDirectory(directoryPath: string): Promise<void> {
    await fs.mkdir(directoryPath, { recursive: false });
  }

  /**
   * 仅在主进程执行文件系统删除；永不向外抛异常，避免未捕获错误导致进程退出。
   */
  static async deleteEntry(targetPath: string): Promise<{ success: boolean; message: string }> {
    const trimmed = typeof targetPath === 'string' ? targetPath.trim() : '';
    if (!trimmed) {
      return { success: false, message: 'empty-path' };
    }
    try {
      await fs.rm(trimmed, { recursive: true, force: true });
      return { success: true, message: '' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[FileExplorerService.deleteEntry]', message);
      return { success: false, message };
    }
  }
}
