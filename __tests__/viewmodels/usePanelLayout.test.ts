import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { usePanelLayout } from '../../src/renderer/features/layout/composables/usePanelLayout';

describe('usePanelLayout', () => {
  it('左右面板都可见时会约束左侧宽度并固定右侧宽度', () => {
    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetWidth', { value: 1000, configurable: true });

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      showLeftActivity,
      showRightActivity
    });

    layout.leftActivityWidth.value = 700;
    layout.calculateActivityWidth();

    expect(layout.rightActivityWidth.value).toBe(200);
    expect(layout.leftActivityWidth.value).toBeLessThanOrEqual(349);
  });

  it('左侧拖拽会更新左栏宽度', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetWidth', { value: 1000, configurable: true });

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      showLeftActivity,
      showRightActivity
    });

    layout.leftActivityWidth.value = 300;
    layout.startLeftDrag(new MouseEvent('mousedown', { clientX: 200 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 240 }));
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(layout.leftActivityWidth.value).toBeGreaterThan(300);
    vi.unstubAllGlobals();
  });
});
