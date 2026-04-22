import { beforeEach, describe, expect, it } from 'vitest';
import { resetUiStateForTest, useUiState } from '../../src/viewmodels/ui-state';

describe('ui-state', () => {
  beforeEach(() => {
    resetUiStateForTest();
  });

  it('切换与关闭标签时保持激活标签正确', () => {
    const { state, ensureHomeTab, upsertTab, switchToTab, closeTab } = useUiState();
    ensureHomeTab();
    upsertTab({ id: 'trace', title: 'Trace', content: 'trace-content' });
    switchToTab('trace');
    closeTab('trace');

    expect(state.activeTab).toBe('home');
    expect(state.tabs.some((tab) => tab.id === 'trace')).toBe(false);
  });

  it('历史文件去重并限制最多10条', () => {
    const { state, addHistoryFile } = useUiState();

    for (let i = 0; i < 12; i += 1) {
      addHistoryFile(`C:/demo/file-${i}.txt`);
    }
    addHistoryFile('C:/demo/file-5.txt');

    expect(state.historyFiles.length).toBe(10);
    expect(state.historyFiles[0].path).toBe('C:/demo/file-5.txt');
  });
});
