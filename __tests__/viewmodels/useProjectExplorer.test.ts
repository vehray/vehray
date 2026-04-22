import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectExplorer } from '../../src/renderer/features/explorer/composables/useProjectExplorer';

describe('useProjectExplorer', () => {
  beforeEach(() => {
    (window as any).electron = {
      fs: {
        readDirectory: vi.fn()
      }
    };
  });

  it('加载目录时按目录优先和名称排序', async () => {
    const readDirectory = (window as any).electron.fs.readDirectory as ReturnType<typeof vi.fn>;
    readDirectory.mockResolvedValue([
      { name: 'z.txt', path: '/demo/z.txt', type: 'file' },
      { name: 'a-dir', path: '/demo/a-dir', type: 'directory' },
      { name: 'b-dir', path: '/demo/b-dir', type: 'directory' },
      { name: 'a.txt', path: '/demo/a.txt', type: 'file' }
    ]);

    const explorer = useProjectExplorer();
    await explorer.loadFolder('/demo');

    expect(explorer.fileTree.value.map((item) => item.name)).toEqual(['a-dir', 'b-dir', 'a.txt', 'z.txt']);
  });

  it('目录节点展开时懒加载子节点', async () => {
    const readDirectory = (window as any).electron.fs.readDirectory as ReturnType<typeof vi.fn>;
    readDirectory.mockResolvedValueOnce([{ name: 'src', path: '/demo/src', type: 'directory' }]);
    readDirectory.mockResolvedValueOnce([{ name: 'main.ts', path: '/demo/src/main.ts', type: 'file' }]);

    const explorer = useProjectExplorer();
    await explorer.loadFolder('/demo');

    const srcNode = explorer.fileTree.value[0];
    await explorer.toggleItem(srcNode);

    expect(srcNode.expanded).toBe(true);
    expect(srcNode.children?.[0].name).toBe('main.ts');
  });
});
