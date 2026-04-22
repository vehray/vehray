import { computed, ref } from 'vue';
import { useUiState } from './ui-state';

export function useLayoutPanels() {
  const { state, setRightPanelVisible } = useUiState();
  const showLeftActivity = ref(true);
  const showRightActivity = computed({
    get: () => state.rightPanelVisible,
    set: (visible: boolean) => setRightPanelVisible(visible)
  });
  const currentView = ref('');

  const toggleLeftActivity = () => {
    showLeftActivity.value = !showLeftActivity.value;
  };

  const toggleRightActivity = () => {
    setRightPanelVisible(!showRightActivity.value);
  };

  const closeLeftActivity = () => {
    showLeftActivity.value = false;
  };

  const closeRightActivity = () => {
    setRightPanelVisible(false);
  };

  return {
    showLeftActivity,
    showRightActivity,
    currentView,
    toggleLeftActivity,
    toggleRightActivity,
    closeLeftActivity,
    closeRightActivity
  };
}
