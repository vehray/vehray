import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uiActions } from '../../src/renderer/services/uiActions';
import { resetUiStateForTest, useUiState } from '../../src/renderer/state/uiState';
import { electronBridge } from '../../src/renderer/services/electronBridge';

vi.mock('../../src/renderer/services/electronBridge', () => ({
  electronBridge: {
    openDirectory: vi.fn(),
    openFile: vi.fn(),
    publishFolderOpened: vi.fn()
  }
}));

describe('uiActions', () => {
  beforeEach(() => {
    resetUiStateForTest();
    vi.clearAllMocks();
  });

  it('openFolder 会更新 activeFolder 并发布刷新事件', async () => {
    vi.mocked(electronBridge.openDirectory).mockResolvedValue('C:/demo/project');

    const result = await uiActions.openFolder();
    const { state } = useUiState();

    expect(result).toBe('C:/demo/project');
    expect(state.activeFolderPath).toBe('C:/demo/project');
    expect(vi.mocked(electronBridge.publishFolderOpened)).toHaveBeenCalledWith('C:/demo/project');
  });

  it('toggleRightPanel 会切换右侧面板状态', () => {
    const { state } = useUiState();
    expect(state.rightPanelVisible).toBe(false);

    uiActions.toggleRightPanel();
    expect(state.rightPanelVisible).toBe(true);

    uiActions.toggleRightPanel();
    expect(state.rightPanelVisible).toBe(false);
  });

  it('refreshTree 会基于当前目录发布刷新事件', () => {
    const { setActiveFolder } = useUiState();
    setActiveFolder('C:/demo/project');

    uiActions.refreshTree();

    expect(vi.mocked(electronBridge.publishFolderOpened)).toHaveBeenCalledWith('C:/demo/project');
  });
});
