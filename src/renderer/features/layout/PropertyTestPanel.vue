<template>
  <div class="property-panel">
    <section v-if="selectedEntry" class="panel-section">
      <div class="field-list">
        <div class="field-item">
          <span class="field-label">{{ t('properties.name') }}</span>
          <span class="field-value">{{ selectedEntry.name }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ t('properties.type') }}</span>
          <span class="field-value">{{
            selectedEntry.type === 'directory' ? t('properties.directory') : t('properties.file')
          }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ t('properties.path') }}</span>
          <div class="path-row">
            <span ref="pathValueRef" class="field-value value-path" @mousedown="handlePathMouseDown">{{ selectedEntry.path }}</span>
            <button class="copy-btn" type="button" :title="t('common.copy')" @click="copyPath(selectedEntry.path)">
              <el-icon><DocumentCopy /></el-icon>
            </button>
          </div>
        </div>
        <div class="field-item">
          <span class="field-label">{{ t('properties.size') }}</span>
          <span class="field-value">{{ formatSize(selectedEntry.size, selectedEntry.type) }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ t('properties.modifiedAt') }}</span>
          <span class="field-value">{{ formatModifiedAt(selectedEntry.modifiedAt) }}</span>
        </div>
      </div>
    </section>

    <section v-else class="panel-section">
      <div class="empty-hint">{{ t('properties.selectHint') }}</div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useUiState } from '../../state/uiState';

const { state } = useUiState();
const { t } = useI18n();
const pathValueRef = ref<HTMLElement | null>(null);
const isPathSelecting = ref(false);
let pointerClientX = 0;
let pointerClientY = 0;
let dragScrollRafId: number | null = null;

const selectedEntry = computed(() => state.selectedExplorerEntry);

const formatSize = (size: number | undefined, type: 'file' | 'directory') => {
  if (type === 'directory') return t('properties.notApplicable');
  if (typeof size !== 'number' || Number.isNaN(size) || size < 0) return t('properties.notApplicable');
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const fixed = value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${fixed} ${units[unitIndex]}`;
};

const formatModifiedAt = (timestamp: number | undefined) => {
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp) || timestamp <= 0) return t('properties.notApplicable');
  return new Date(timestamp).toLocaleString();
};

const writeClipboard = async (text: string) => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

const copyPath = async (path: string) => {
  try {
    await writeClipboard(path);
    ElMessage.success(t('properties.pathCopied'));
  } catch {
    ElMessage.error(t('properties.pathCopyFailed'));
  }
};

const stopPathDragScroll = () => {
  if (!isPathSelecting.value && dragScrollRafId === null) return;
  isPathSelecting.value = false;
  if (dragScrollRafId !== null) {
    window.cancelAnimationFrame(dragScrollRafId);
    dragScrollRafId = null;
  }
  const target = pathValueRef.value;
  target?.classList.remove('is-drag-scrolling');
};

const runDragAutoScroll = () => {
  if (!isPathSelecting.value) {
    dragScrollRafId = null;
    return;
  }
  const target = pathValueRef.value;
  if (!target) {
    dragScrollRafId = window.requestAnimationFrame(runDragAutoScroll);
    return;
  }
  const rect = target.getBoundingClientRect();
  const edgeWidth = 28;
  const maxSpeed = 14;
  const verticalPadding = 10;

  if (pointerClientY >= rect.top - verticalPadding && pointerClientY <= rect.bottom + verticalPadding) {
    const rightThreshold = rect.right - edgeWidth;
    const leftThreshold = rect.left + edgeWidth;
    if (pointerClientX >= rightThreshold) {
      const ratio = Math.min((pointerClientX - rightThreshold) / edgeWidth, 1);
      target.scrollLeft += Math.max(1, Math.round(maxSpeed * ratio));
    } else if (pointerClientX <= leftThreshold) {
      const ratio = Math.min((leftThreshold - pointerClientX) / edgeWidth, 1);
      target.scrollLeft -= Math.max(1, Math.round(maxSpeed * ratio));
    }
  }

  dragScrollRafId = window.requestAnimationFrame(runDragAutoScroll);
};

const handlePathMouseDown = (event: MouseEvent) => {
  if (event.button !== 0) return;
  const target = pathValueRef.value;
  if (!target || target.scrollWidth <= target.clientWidth) return;
  pointerClientX = event.clientX;
  pointerClientY = event.clientY;
  isPathSelecting.value = true;
  target.classList.add('is-drag-scrolling');
  if (dragScrollRafId === null) {
    dragScrollRafId = window.requestAnimationFrame(runDragAutoScroll);
  }
};

const handleWindowMouseMove = (event: MouseEvent) => {
  pointerClientX = event.clientX;
  pointerClientY = event.clientY;
  if (!isPathSelecting.value) return;
  if ((event.buttons & 1) === 0) {
    stopPathDragScroll();
  }
};

onMounted(() => {
  window.addEventListener('mousemove', handleWindowMouseMove);
  window.addEventListener('mouseup', stopPathDragScroll);
  window.addEventListener('blur', stopPathDragScroll);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleWindowMouseMove);
  window.removeEventListener('mouseup', stopPathDragScroll);
  window.removeEventListener('blur', stopPathDragScroll);
});

</script>

<style scoped>
.property-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-section {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg-elevated);
  padding: 10px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  color: var(--app-text-muted);
}

.field-value {
  min-height: 20px;
  font-size: 12px;
  line-height: 1.35;
  color: var(--app-text-regular);
  padding: 4px 6px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  word-break: break-all;
}

.path-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.value-path {
  flex: 1;
  display: flex;
  align-items: center;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 11px;
  user-select: text;
  -webkit-user-select: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: normal;
}

.value-path.is-drag-scrolling {
  text-overflow: clip;
}

.copy-btn {
  flex-shrink: 0;
  height: 28px;
  width: 30px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-regular);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.empty-hint {
  font-size: 12px;
  color: var(--app-text-muted);
  line-height: 1.5;
}

</style>
