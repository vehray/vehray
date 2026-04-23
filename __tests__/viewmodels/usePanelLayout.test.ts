import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { usePanelLayout } from '../../src/renderer/features/layout/composables/usePanelLayout';

describe('usePanelLayout', () => {
  it('左右面板都可见时会约束左右宽度并保留中心区域', () => {
    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetWidth', { value: 1000, configurable: true });
    const mainAreaEl = document.createElement('div');

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const mainArea = ref<HTMLElement | null>(mainAreaEl);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      mainArea,
      showLeftActivity,
      showRightActivity
    });

    layout.leftActivityWidth.value = 700;
    layout.calculateActivityWidth();

    expect(layout.rightActivityWidth.value).toBeGreaterThanOrEqual(170);
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
    const mainAreaEl = document.createElement('div');

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const mainArea = ref<HTMLElement | null>(mainAreaEl);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      mainArea,
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

  it('垂直拖拽向上时下方面板高度增加', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetWidth', { value: 1000, configurable: true });
    const mainAreaEl = document.createElement('div');
    Object.defineProperty(mainAreaEl, 'offsetHeight', { value: 600, configurable: true });

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const mainArea = ref<HTMLElement | null>(mainAreaEl);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      mainArea,
      showLeftActivity,
      showRightActivity
    });

    layout.tabPanelHeight.value = 200;
    layout.startVerticalDrag(new MouseEvent('mousedown', { clientY: 300 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientY: 260 }));
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(layout.tabPanelHeight.value).toBeGreaterThan(200);
    vi.unstubAllGlobals();
  });

  it('垂直拖拽到最小后松开会关闭下方面板', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetWidth', { value: 1000, configurable: true });
    const mainAreaEl = document.createElement('div');
    Object.defineProperty(mainAreaEl, 'offsetHeight', { value: 600, configurable: true });

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const mainArea = ref<HTMLElement | null>(mainAreaEl);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      mainArea,
      showLeftActivity,
      showRightActivity
    });

    layout.tabPanelHeight.value = 180;
    layout.startVerticalDrag(new MouseEvent('mousedown', { clientY: 300 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientY: 520 }));
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(layout.tabPanelHeight.value).toBe(0);
    vi.unstubAllGlobals();
  });

  it('左侧拖到最小后继续外拖会关闭左侧面板', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetWidth', { value: 1000, configurable: true });
    const mainAreaEl = document.createElement('div');

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const mainArea = ref<HTMLElement | null>(mainAreaEl);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      mainArea,
      showLeftActivity,
      showRightActivity
    });

    layout.leftActivityWidth.value = 260;
    layout.startLeftDrag(new MouseEvent('mousedown', { clientX: 260 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: -60 }));
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(showLeftActivity.value).toBe(false);
    vi.unstubAllGlobals();
  });

  it('右侧拖到最小后继续外拖会关闭右侧面板', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetWidth', { value: 1000, configurable: true });
    const mainAreaEl = document.createElement('div');

    const contentWrapper = ref<HTMLElement | null>(wrapper);
    const mainArea = ref<HTMLElement | null>(mainAreaEl);
    const showLeftActivity = ref(true);
    const showRightActivity = ref(true);

    const layout = usePanelLayout({
      contentWrapper,
      mainArea,
      showLeftActivity,
      showRightActivity
    });

    layout.rightActivityWidth.value = 260;
    layout.startRightDrag(new MouseEvent('mousedown', { clientX: 740 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 1080 }));
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(showRightActivity.value).toBe(false);
    vi.unstubAllGlobals();
  });
});
