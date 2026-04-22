import { onMounted, onUnmounted, ref, type Ref } from 'vue';

interface UsePanelLayoutOptions {
  contentWrapper: Ref<HTMLElement | null>;
  showLeftActivity: Ref<boolean>;
  showRightActivity: Ref<boolean>;
}

export function usePanelLayout(options: UsePanelLayoutOptions) {
  const { contentWrapper, showLeftActivity, showRightActivity } = options;

  const leftActivityWidth = ref(200);
  const rightActivityWidth = ref(200);
  const mainContentHeight = ref(0);
  const tabPanelHeight = ref(200);

  const isLeftSplitterActive = ref(false);
  const isRightSplitterActive = ref(false);
  const isVerticalSplitterActive = ref(false);

  let leftDragStartX = 0;
  let leftDragStartWidth = 0;
  let rightDragStartX = 0;
  let rightDragStartWidth = 0;
  let containerWidth = 0;

  let verticalDragStartY = 0;
  let verticalDragStartHeight = 0;
  let containerHeight = 0;

  let leftDragFrameId: number | null = null;
  let rightDragFrameId: number | null = null;
  let verticalDragFrameId: number | null = null;

  const minLeftPercent = 25;
  const minCenterPercent = 45;
  const minRightPercent = 25;
  const minTabPanelHeight = 100;
  const minMainContentHeight = 200;

  const calculateActivityWidth = () => {
    if (!contentWrapper.value) return;

    const availableWidth = contentWrapper.value.offsetWidth - 6;
    if (availableWidth <= 0) return;

    const fixedRightWidth = 200;
    rightActivityWidth.value = fixedRightWidth;

    if (showLeftActivity.value && showRightActivity.value) {
      const availableWidthForLeftAndCenter = availableWidth - fixedRightWidth;
      const minLeftPx = Math.floor(availableWidth * (minLeftPercent / 100));
      const maxLeftPx = availableWidthForLeftAndCenter - Math.floor(availableWidth * (minCenterPercent / 100));

      leftActivityWidth.value = Math.max(minLeftPx, Math.min(maxLeftPx, leftActivityWidth.value));
    }
  };

  const calculateHeights = () => {
    const mainArea = document.querySelector('.main-area');
    if (!mainArea) return;

    const totalHeight = (mainArea as HTMLElement).offsetHeight - 4;
    if (totalHeight <= 0) return;

    const clampedTabPanelHeight = Math.max(
      minTabPanelHeight,
      Math.min(totalHeight - minMainContentHeight, tabPanelHeight.value)
    );

    tabPanelHeight.value = clampedTabPanelHeight;
    mainContentHeight.value = totalHeight - clampedTabPanelHeight;
  };

  const stopLeftDrag = () => {
    if (leftDragFrameId) {
      cancelAnimationFrame(leftDragFrameId);
      leftDragFrameId = null;
    }
    document.removeEventListener('mousemove', onLeftDrag);
    document.removeEventListener('mouseup', stopLeftDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const onLeftDrag = (e: MouseEvent) => {
    if (leftDragFrameId) {
      cancelAnimationFrame(leftDragFrameId);
    }

    leftDragFrameId = requestAnimationFrame(() => {
      if (!contentWrapper.value) return;

      const deltaX = e.clientX - leftDragStartX;
      const newWidth = leftDragStartWidth + deltaX;
      const availableWidthForLeftAndCenter = containerWidth - rightActivityWidth.value;
      if (availableWidthForLeftAndCenter <= 0) return;

      const maxLeftWidth = availableWidthForLeftAndCenter - Math.floor(containerWidth * (minCenterPercent / 100));
      leftActivityWidth.value = Math.max(
        Math.floor(containerWidth * (minLeftPercent / 100)),
        Math.min(maxLeftWidth, newWidth)
      );
    });
  };

  const startLeftDrag = (e: MouseEvent) => {
    if (!contentWrapper.value) return;

    leftDragStartX = e.clientX;
    leftDragStartWidth = leftActivityWidth.value;
    containerWidth = contentWrapper.value.offsetWidth - 6;

    document.addEventListener('mousemove', onLeftDrag);
    document.addEventListener('mouseup', stopLeftDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopRightDrag = () => {
    if (rightDragFrameId) {
      cancelAnimationFrame(rightDragFrameId);
      rightDragFrameId = null;
    }
    document.removeEventListener('mousemove', onRightDrag);
    document.removeEventListener('mouseup', stopRightDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const onRightDrag = (e: MouseEvent) => {
    if (rightDragFrameId) {
      cancelAnimationFrame(rightDragFrameId);
    }

    rightDragFrameId = requestAnimationFrame(() => {
      if (!contentWrapper.value) return;

      const deltaX = rightDragStartX - e.clientX;
      const newWidth = rightDragStartWidth + deltaX;
      const availableWidthForRightAndCenter = containerWidth - leftActivityWidth.value;
      if (availableWidthForRightAndCenter <= 0) return;

      const maxRightWidth = availableWidthForRightAndCenter - Math.floor(containerWidth * (minCenterPercent / 100));
      rightActivityWidth.value = Math.max(
        Math.floor(containerWidth * (minRightPercent / 100)),
        Math.min(maxRightWidth, newWidth)
      );
    });
  };

  const startRightDrag = (e: MouseEvent) => {
    if (!contentWrapper.value) return;

    rightDragStartX = e.clientX;
    rightDragStartWidth = rightActivityWidth.value;
    containerWidth = contentWrapper.value.offsetWidth - 6;

    document.addEventListener('mousemove', onRightDrag);
    document.addEventListener('mouseup', stopRightDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopVerticalDrag = () => {
    if (verticalDragFrameId) {
      cancelAnimationFrame(verticalDragFrameId);
      verticalDragFrameId = null;
    }
    document.removeEventListener('mousemove', onVerticalDrag);
    document.removeEventListener('mouseup', stopVerticalDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const onVerticalDrag = (e: MouseEvent) => {
    if (verticalDragFrameId) {
      cancelAnimationFrame(verticalDragFrameId);
    }

    verticalDragFrameId = requestAnimationFrame(() => {
      const mainArea = document.querySelector('.main-area');
      if (!mainArea) return;

      const deltaY = e.clientY - verticalDragStartY;
      const newHeight = verticalDragStartHeight + deltaY;
      const clampedHeight = Math.max(minTabPanelHeight, Math.min(containerHeight - minMainContentHeight, newHeight));

      tabPanelHeight.value = clampedHeight;
      mainContentHeight.value = containerHeight - clampedHeight;
    });
  };

  const startVerticalDrag = (e: MouseEvent) => {
    const mainArea = document.querySelector('.main-area');
    if (!mainArea) return;

    verticalDragStartY = e.clientY;
    verticalDragStartHeight = tabPanelHeight.value;
    containerHeight = (mainArea as HTMLElement).offsetHeight - 4;

    document.addEventListener('mousemove', onVerticalDrag);
    document.addEventListener('mouseup', stopVerticalDrag);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResize = () => {
    calculateActivityWidth();
    calculateHeights();
  };

  onMounted(() => {
    calculateActivityWidth();
    calculateHeights();
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    stopLeftDrag();
    stopRightDrag();
    stopVerticalDrag();
  });

  return {
    leftActivityWidth,
    rightActivityWidth,
    mainContentHeight,
    tabPanelHeight,
    isLeftSplitterActive,
    isRightSplitterActive,
    isVerticalSplitterActive,
    startLeftDrag,
    startRightDrag,
    startVerticalDrag,
    calculateActivityWidth,
    calculateHeights
  };
}
