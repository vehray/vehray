import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MainTabPanel from '../../src/components/MainTabPanel.vue';
import { resetUiStateForTest, useUiState } from '../../src/viewmodels/ui-state';

vi.mock('../../src/viewmodels/services/electron-bridge', () => ({
  electronBridge: {
    openDirectory: vi.fn(async () => null),
    openFile: vi.fn(async () => 'C:/demo/report.txt'),
    publishFolderOpened: vi.fn()
  }
}));

describe('MainTabPanel', () => {
  beforeEach(() => {
    resetUiStateForTest();
  });

  it('点击打开文件后会写入历史记录', async () => {
    const wrapper = mount(MainTabPanel, {
      global: {
        stubs: {
          'el-icon': { template: '<i><slot /></i>' }
        }
      }
    });

    await wrapper.get('.action-button-square.open-file').trigger('click');

    const { state } = useUiState();
    expect(state.historyFiles[0]?.path).toBe('C:/demo/report.txt');
  });
});
