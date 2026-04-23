import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TabPanel from '../../src/renderer/features/tabs/TabPanel.vue';

describe('TabPanel', () => {
  it('点击标签后会切换激活态并显示背景类', async () => {
    const wrapper = mount(TabPanel, {
      global: {
        stubs: {
          'el-icon': { template: '<i><slot /></i>' }
        }
      }
    });

    const tabItems = wrapper.findAll('.tab-item');
    expect(tabItems[0].classes()).toContain('active');
    expect(tabItems[1].classes()).not.toContain('active');

    await tabItems[1].trigger('click');

    const updatedTabItems = wrapper.findAll('.tab-item');
    expect(updatedTabItems[1].classes()).toContain('active');
    expect(updatedTabItems[0].classes()).not.toContain('active');
  });
});
