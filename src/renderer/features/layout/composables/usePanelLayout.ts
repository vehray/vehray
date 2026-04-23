import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { LAYOUT_CONSTANTS } from '../../../shared/constants';

interface UsePanelLayoutOptions {
  contentWrapper: Ref<HTMLElement | null>;
  mainArea: Ref<HTMLElement | null>;
  showLeftActivity: Ref<boolean>;
  showRightActivity: Ref<boolean>;
}

export function usePanelLayout(options: UsePanelLayoutOptions) {
  const { contentWrapper, mainArea, showLeftActivity, showRightActivity } = options;
  const closeDragThreshold = 36;
  const closeRecoverThreshold = 16;

  const leftActivityWidth = ref(LAYOUT_CONSTANTS.INITIAL_LEFT_WIDTH);
  const rightActivityWidth = ref(LAYOUT_CONSTANTS.INITIAL_RIGHT_WIDTH);
  const mainContentHeight = ref(0);
  const tabPanelHeight = ref(LAYOUT_CONSTANTS.INITIAL_TAB_HEIGHT);

  const isLeftSplitterActive = ref(false);
  const isRightSplitterActive = ref(false);
  const isVerticalSplitterActive = ref(false);
  const isVerticalLimitArmed = ref(false);
  const isVerticalCloseArmed = ref(false);
  const isLeftMaxArmed = ref(false);
  const isRightMaxArmed = ref(false);
  const isVerticalMaxArmed = ref(false);
  const isLeftCloseArmed = ref(false);
  const isRightCloseArmed = ref(false);

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
  let latestLeftClientX: number | null = null;
  let latestRightClientX: number | null = null;
  let latestVerticalClientY: number | null = null;

  let leftWidthRatio = LAYOUT_CONSTANTS.MIN_SIDE_PERCENT / 100;
  let rightWidthRatio = LAYOUT_CONSTANTS.MIN_SIDE_PERCENT / 100;
  let tabHeightRatio = 0.3;
  let lastExpandedTabHeight = LAYOUT_CONSTANTS.INITIAL_TAB_HEIGHT;

  const getContainerWidth = () => {
    if (!contentWrapper.value) return 0;
    const horizontalSplitters =
      (showLeftActivity.value ? LAYOUT_CONSTANTS.HORIZONTAL_SPLITTER_SIZE : 0) +
      (showRightActivity.value ? LAYOUT_CONSTANTS.HORIZONTAL_SPLITTER_SIZE : 0);
    return contentWrapper.value.offsetWidth - horizontalSplitters;
  };

  const getContainerHeight = () => {
    if (!mainArea.value) return 0;
    return mainArea.value.offsetHeight - LAYOUT_CONSTANTS.MAIN_AREA_VERTICAL_OFFSET;
  };

  const getMinSideWidth = (width: number) =>
    Math.max(Math.floor(width * (LAYOUT_CONSTANTS.MIN_SIDE_PERCENT / 100)), LAYOUT_CONSTANTS.MIN_SIDE_WIDTH_PX);
  const getMinLeftWidth = (width: number) => getMinSideWidth(width);
  const getMinRightWidth = (width: number) => getMinSideWidth(width);
  const getMinCenterWidth = (width: number) =>
    Math.max(
      Math.floor(width * (LAYOUT_CONSTANTS.MIN_CENTER_PERCENT / 100)),
      LAYOUT_CONSTANTS.MIN_CENTER_WIDTH_PX
    );
  const getMaxSideWidth = (width: number) => Math.min(width - getMinCenterWidth(width), LAYOUT_CONSTANTS.MAX_SIDE_WIDTH_PX);

  const clampLeftWidth = (nextWidth: number, width: number, rightWidth: number) => {
    const minLeftWidth = getMinLeftWidth(width);
    const maxLeftByCenter = width - rightWidth - getMinCenterWidth(width);
    const maxLeftWidth = Math.max(minLeftWidth, Math.min(getMaxSideWidth(width), maxLeftByCenter));
    return Math.max(minLeftWidth, Math.min(maxLeftWidth, nextWidth));
  };

  const getLeftMaxWidth = (width: number, rightWidth: number) => {
    const minLeftWidth = getMinLeftWidth(width);
    const maxLeftByCenter = width - rightWidth - getMinCenterWidth(width);
    return Math.max(minLeftWidth, Math.min(getMaxSideWidth(width), maxLeftByCenter));
  };

  const clampRightWidth = (nextWidth: number, width: number, leftWidth: number) => {
    const minRightWidth = getMinRightWidth(width);
    const maxRightByCenter = width - leftWidth - getMinCenterWidth(width);
    const maxRightWidth = Math.max(minRightWidth, Math.min(getMaxSideWidth(width), maxRightByCenter));
    return Math.max(minRightWidth, Math.min(maxRightWidth, nextWidth));
  };

  const getRightMaxWidth = (width: number, leftWidth: number) => {
    const minRightWidth = getMinRightWidth(width);
    const maxRightByCenter = width - leftWidth - getMinCenterWidth(width);
    return Math.max(minRightWidth, Math.min(getMaxSideWidth(width), maxRightByCenter));
  };

  const calculateActivityWidth = () => {
    const availableWidth = getContainerWidth();
    if (availableWidth <= 0) return;

    if (showLeftActivity.value && showRightActivity.value) {
      let nextLeftWidth = clampLeftWidth(Math.round(availableWidth * leftWidthRatio), availableWidth, rightActivityWidth.value);
      let nextRightWidth = clampRightWidth(
        Math.round(availableWidth * rightWidthRatio),
        availableWidth,
        nextLeftWidth
      );
      nextLeftWidth = clampLeftWidth(nextLeftWidth, availableWidth, nextRightWidth);

      leftActivityWidth.value = nextLeftWidth;
      rightActivityWidth.value = nextRightWidth;
      leftWidthRatio = nextLeftWidth / availableWidth;
      rightWidthRatio = nextRightWidth / availableWidth;
      return;
    }

    if (showLeftActivity.value) {
      const minLeftWidth = getMinLeftWidth(availableWidth);
      const maxLeftWidth = Math.max(
        minLeftWidth,
        Math.min(getMaxSideWidth(availableWidth), availableWidth - getMinCenterWidth(availableWidth))
      );
      const nextLeftWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, leftActivityWidth.value));
      leftActivityWidth.value = nextLeftWidth;
      leftWidthRatio = nextLeftWidth / availableWidth;
      return;
    }

    if (showRightActivity.value) {
      const minRightWidth = getMinRightWidth(availableWidth);
      const maxRightWidth = Math.max(
        minRightWidth,
        Math.min(getMaxSideWidth(availableWidth), availableWidth - getMinCenterWidth(availableWidth))
      );
      const nextRightWidth = Math.max(minRightWidth, Math.min(maxRightWidth, rightActivityWidth.value));
      rightActivityWidth.value = nextRightWidth;
      rightWidthRatio = nextRightWidth / availableWidth;
    }
  };

  const resetSideWidthsToMinimum = () => {
    const availableWidth = getContainerWidth();
    if (availableWidth <= 0) return;

    const minSideWidth = getMinSideWidth(availableWidth);
    if (showLeftActivity.value) {
      leftActivityWidth.value = minSideWidth;
      leftWidthRatio = minSideWidth / availableWidth;
    }
    if (showRightActivity.value) {
      rightActivityWidth.value = minSideWidth;
      rightWidthRatio = minSideWidth / availableWidth;
    }
    calculateActivityWidth();
  };

  const calculateHeights = () => {
    const totalHeight = getContainerHeight();
    if (totalHeight <= 0) return;

    const nextTabHeight = Math.round(totalHeight * tabHeightRatio);
    const clampedTabPanelHeight = Math.max(
      LAYOUT_CONSTANTS.MIN_TAB_PANEL_HEIGHT,
      Math.min(totalHeight - LAYOUT_CONSTANTS.MIN_MAIN_CONTENT_HEIGHT, nextTabHeight)
    );

    tabPanelHeight.value = clampedTabPanelHeight;
    mainContentHeight.value = totalHeight - clampedTabPanelHeight;
    tabHeightRatio = clampedTabPanelHeight / totalHeight;
    if (clampedTabPanelHeight > 0) {
      lastExpandedTabHeight = clampedTabPanelHeight;
    }
  };

  const toggleBottomPanel = () => {
    const totalHeight = getContainerHeight();
    if (totalHeight <= 0) return;

    if (tabPanelHeight.value > 0) {
      lastExpandedTabHeight = tabPanelHeight.value;
      tabPanelHeight.value = 0;
      mainContentHeight.value = totalHeight;
      tabHeightRatio = 0;
      return;
    }

    const restoredHeight = Math.max(
      LAYOUT_CONSTANTS.MIN_TAB_PANEL_HEIGHT,
      Math.min(totalHeight - LAYOUT_CONSTANTS.MIN_MAIN_CONTENT_HEIGHT, lastExpandedTabHeight)
    );
    tabPanelHeight.value = restoredHeight;
    mainContentHeight.value = totalHeight - restoredHeight;
    tabHeightRatio = restoredHeight / totalHeight;
  };

  const stopLeftDrag = () => {
    if (leftDragFrameId) {
      cancelAnimationFrame(leftDragFrameId);
      leftDragFrameId = null;
    }
    latestLeftClientX = null;
    if (isLeftCloseArmed.value) {
      showLeftActivity.value = false;
      isLeftCloseArmed.value = false;
    }
    isLeftMaxArmed.value = false;
    document.removeEventListener('mousemove', onLeftDrag);
    document.removeEventListener('mouseup', stopLeftDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const onLeftDrag = (e: MouseEvent) => {
    latestLeftClientX = e.clientX;
    if (leftDragFrameId) return;

    leftDragFrameId = requestAnimationFrame(() => {
      leftDragFrameId = null;
      if (!contentWrapper.value) return;
      if (latestLeftClientX === null) return;

      const deltaX = latestLeftClientX - leftDragStartX;
      const newWidth = leftDragStartWidth + deltaX;
      const minLeftWidth = getMinLeftWidth(containerWidth);
      const maxLeftWidth = getLeftMaxWidth(containerWidth, rightActivityWidth.value);
      const closeBoundary = minLeftWidth - closeDragThreshold;
      const recoverBoundary = minLeftWidth - closeRecoverThreshold;
      if (newWidth < closeBoundary) {
        isLeftCloseArmed.value = true;
      } else if (newWidth > recoverBoundary) {
        isLeftCloseArmed.value = false;
      }
      isLeftMaxArmed.value = newWidth > maxLeftWidth;
      leftActivityWidth.value = clampLeftWidth(newWidth, containerWidth, rightActivityWidth.value);
      leftWidthRatio = leftActivityWidth.value / containerWidth;
    });
  };

  const startLeftDrag = (e: MouseEvent) => {
    if (!contentWrapper.value) return;

    leftDragStartX = e.clientX;
    leftDragStartWidth = leftActivityWidth.value;
    isLeftCloseArmed.value = false;
    isLeftMaxArmed.value = false;
    containerWidth = getContainerWidth();
    if (containerWidth <= 0) return;

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
    latestRightClientX = null;
    if (isRightCloseArmed.value) {
      showRightActivity.value = false;
      isRightCloseArmed.value = false;
    }
    isRightMaxArmed.value = false;
    document.removeEventListener('mousemove', onRightDrag);
    document.removeEventListener('mouseup', stopRightDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const onRightDrag = (e: MouseEvent) => {
    latestRightClientX = e.clientX;
    if (rightDragFrameId) return;

    rightDragFrameId = requestAnimationFrame(() => {
      rightDragFrameId = null;
      if (!contentWrapper.value) return;
      if (latestRightClientX === null) return;

      const deltaX = rightDragStartX - latestRightClientX;
      const newWidth = rightDragStartWidth + deltaX;
      const minRightWidth = getMinRightWidth(containerWidth);
      const maxRightWidth = getRightMaxWidth(containerWidth, leftActivityWidth.value);
      const closeBoundary = minRightWidth - closeDragThreshold;
      const recoverBoundary = minRightWidth - closeRecoverThreshold;
      if (newWidth < closeBoundary) {
        isRightCloseArmed.value = true;
      } else if (newWidth > recoverBoundary) {
        isRightCloseArmed.value = false;
      }
      isRightMaxArmed.value = newWidth > maxRightWidth;
      rightActivityWidth.value = clampRightWidth(newWidth, containerWidth, leftActivityWidth.value);
      rightWidthRatio = rightActivityWidth.value / containerWidth;
    });
  };

  const startRightDrag = (e: MouseEvent) => {
    if (!contentWrapper.value) return;

    rightDragStartX = e.clientX;
    rightDragStartWidth = rightActivityWidth.value;
    isRightCloseArmed.value = false;
    isRightMaxArmed.value = false;
    containerWidth = getContainerWidth();
    if (containerWidth <= 0) return;

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
    if (isVerticalCloseArmed.value) {
      tabPanelHeight.value = 0;
      mainContentHeight.value = containerHeight;
      tabHeightRatio = 0;
      isVerticalCloseArmed.value = false;
    }
    latestVerticalClientY = null;
    isVerticalLimitArmed.value = false;
    isVerticalMaxArmed.value = false;
    document.removeEventListener('mousemove', onVerticalDrag);
    document.removeEventListener('mouseup', stopVerticalDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const onVerticalDrag = (e: MouseEvent) => {
    latestVerticalClientY = e.clientY;
    if (verticalDragFrameId) return;

    verticalDragFrameId = requestAnimationFrame(() => {
      verticalDragFrameId = null;
      if (!mainArea.value) return;
      if (latestVerticalClientY === null) return;

      const deltaY = latestVerticalClientY - verticalDragStartY;
      const newHeight = verticalDragStartHeight - deltaY;
      const minHeight = LAYOUT_CONSTANTS.MIN_TAB_PANEL_HEIGHT;
      const maxHeight = containerHeight;
      const clampedHeight = Math.max(
        minHeight,
        Math.min(maxHeight, newHeight)
      );
      isVerticalMaxArmed.value = false;
      isVerticalCloseArmed.value = newHeight < minHeight;
      isVerticalLimitArmed.value = isVerticalCloseArmed.value;

      tabPanelHeight.value = clampedHeight;
      mainContentHeight.value = containerHeight - clampedHeight;
      tabHeightRatio = clampedHeight / containerHeight;
    });
  };

  const startVerticalDrag = (e: MouseEvent) => {
    if (!mainArea.value) return;

    verticalDragStartY = e.clientY;
    verticalDragStartHeight = tabPanelHeight.value;
    isVerticalCloseArmed.value = false;
    containerHeight = getContainerHeight();
    if (containerHeight <= 0) return;

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
    resetSideWidthsToMinimum();
    calculateHeights();
    window.addEventListener('resize', handleResize);
  });

  watch(showLeftActivity, (visible, previous) => {
    if (visible && !previous) {
      resetSideWidthsToMinimum();
    }
  });

  watch(showRightActivity, (visible, previous) => {
    if (visible && !previous) {
      resetSideWidthsToMinimum();
    }
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    stopLeftDrag();
    stopRightDrag();
    stopVerticalDrag();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  return {
    leftActivityWidth,
    rightActivityWidth,
    mainContentHeight,
    tabPanelHeight,
    isLeftSplitterActive,
    isRightSplitterActive,
    isVerticalSplitterActive,
    isVerticalLimitArmed,
    isVerticalCloseArmed,
    isLeftMaxArmed,
    isRightMaxArmed,
    isVerticalMaxArmed,
    isLeftCloseArmed,
    isRightCloseArmed,
    startLeftDrag,
    startRightDrag,
    startVerticalDrag,
    calculateActivityWidth,
    calculateHeights,
    toggleBottomPanel
  };
}
