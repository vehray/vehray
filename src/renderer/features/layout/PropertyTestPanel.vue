<template>
  <div class="property-panel">
    <section v-if="selectedInspectorEntry" class="panel-section">
      <div class="group-list">
        <section v-for="group in selectedInspectorEntry.groups" :key="group.title" class="group-section">
          <div class="group-title">{{ group.title }}</div>
          <div v-if="isLinBusSelection && group.title === t('properties.context.common')" class="field-list">
            <div v-for="field in group.fields" :key="`${group.title}-${field.label}`" class="common-kv-row">
              <span class="common-kv-label">{{ field.label }}</span>
              <span class="common-kv-value">{{ field.value }}</span>
            </div>
          </div>
          <div v-else class="field-list">
            <div v-for="field in group.fields" :key="`${group.title}-${field.label}`" class="field-item">
              <span class="field-label">{{ field.label }}</span>
              <el-select
                v-if="isLinBusSelection && field.label === t('properties.context.baudrate')"
                v-model.number="selectedBaudrate"
                class="field-select"
                @change="applyLinBusBaudrate"
                popper-class="app-baudrate-select-dropdown"
              >
                <el-option v-for="rate in baudrateOptions" :key="rate" :value="rate" :label="formatKbpsLabel(rate)" />
              </el-select>
              <input
                v-else-if="isLinBusSelection && field.label === t('properties.context.name')"
                v-model="selectedLinBusName"
                class="field-input field-input-name"
                type="text"
                @blur="applyLinBusName"
              />
              <textarea
                v-else-if="isLinBusSelection && field.label === t('properties.context.comment')"
                v-model="selectedComment"
                class="field-textarea"
                rows="3"
                @blur="applyLinBusComment"
              />
              <span v-else class="field-value">{{ field.value }}</span>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section v-else-if="selectedEntry" class="panel-section">
      <div class="group-list">
        <section class="group-section">
          <div class="group-title">{{ t('properties.context.common') }}</div>
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
          </div>
        </section>
        <section class="group-section">
          <div class="group-title">
            {{ selectedEntry.type === 'directory' ? t('properties.context.folderProperties') : t('properties.context.fileProperties') }}
          </div>
          <div class="field-list">
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
      </div>
    </section>

    <section v-else class="panel-section">
      <div class="empty-hint">{{ t('properties.selectHint') }}</div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useUiState } from '../../state/uiState';

const { state, upsertTab, setSelectedInspectorEntry } = useUiState();
const { t } = useI18n();
const pathValueRef = ref<HTMLElement | null>(null);
const isPathSelecting = ref(false);
let pointerClientX = 0;
let pointerClientY = 0;
let dragScrollRafId: number | null = null;

const selectedEntry = computed(() => state.selectedExplorerEntry);
const selectedInspectorEntry = computed(() => state.selectedInspectorEntry);
const isLinBusSelection = computed(() => selectedInspectorEntry.value?.kind === 'linbus');
const baudrateOptions = [19200, 10417, 2400, 9600];
const selectedBaudrate = ref(19200);
const selectedLinBusName = ref('');
const selectedComment = ref('');

const formatKbpsLabel = (rate: number) => `${(rate / 1000).toFixed(3)} kbps`;
const parseBaudrateFromSelection = () => {
  const baudrateField = selectedInspectorEntry.value?.groups
    .flatMap((group) => group.fields)
    .find((field) => field.label === t('properties.context.baudrate'));
  const parsed = Number.parseInt(baudrateField?.value ?? '', 10);
  return Number.isNaN(parsed) ? 19200 : parsed;
};

const applyLinBusBaudrate = () => {
  if (!isLinBusSelection.value) return;
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTab);
  if (!activeTab || activeTab.id === 'home') return;
  const source = activeTab.content ?? '';
  const nextLine = `Bitrate = ${selectedBaudrate.value};`;
  const updatedContent = /Bitrate\s*=\s*\d+\s*;/i.test(source)
    ? source.replace(/Bitrate\s*=\s*\d+\s*;/i, nextLine)
    : `${source.trimEnd()}\n${nextLine}\n`;

  upsertTab({
    id: activeTab.id,
    title: activeTab.title,
    content: updatedContent,
    dirty: true,
  });

  const current = selectedInspectorEntry.value;
  if (!current) return;
  const groups = current.groups.map((group) => ({
    ...group,
    fields: group.fields.map((field) =>
      field.label === t('properties.context.baudrate') ? { ...field, value: `${selectedBaudrate.value}` } : field
    ),
  }));
  setSelectedInspectorEntry({
    ...current,
    groups,
  });
};

const applyLinBusName = () => {
  if (!isLinBusSelection.value) return;
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTab);
  if (!activeTab || activeTab.id === 'home') return;
  const source = activeTab.content ?? '';
  const nextName = selectedLinBusName.value.trim() || 'LIN Bus';
  const nextLine = `LIN_bus_name = "${nextName}";`;
  const updatedContent = /LIN_bus_name\s*=\s*"[^"]*";/i.test(source)
    ? source.replace(/LIN_bus_name\s*=\s*"[^"]*";/i, nextLine)
    : `${source.trimEnd()}\n${nextLine}\n`;

  upsertTab({
    id: activeTab.id,
    title: activeTab.title,
    content: updatedContent,
    dirty: true,
  });

  const current = selectedInspectorEntry.value;
  if (!current) return;
  const groups = current.groups.map((group) => ({
    ...group,
    fields: group.fields.map((field) =>
      field.label === t('properties.context.name') ? { ...field, value: nextName } : field
    ),
  }));
  setSelectedInspectorEntry({
    ...current,
    title: nextName,
    groups,
  });
};

const applyLinBusComment = () => {
  if (!isLinBusSelection.value) return;
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTab);
  if (!activeTab || activeTab.id === 'home') return;
  const source = activeTab.content ?? '';
  const comment = selectedComment.value.trim();
  let updatedContent = source;
  if (/\/\*\s*[\s\S]*?\s*\*\//.test(updatedContent)) {
    updatedContent = comment
      ? updatedContent.replace(/\/\*\s*[\s\S]*?\s*\*\//, `/* ${comment} */`)
      : updatedContent.replace(/\/\*\s*[\s\S]*?\s*\*\/\s*\n?/m, '');
  } else if (comment) {
    updatedContent = `/* ${comment} */\n${updatedContent.trimStart()}`;
  }

  upsertTab({
    id: activeTab.id,
    title: activeTab.title,
    content: updatedContent,
    dirty: true,
  });

  const current = selectedInspectorEntry.value;
  if (!current) return;
  const groups = current.groups.map((group) => ({
    ...group,
    fields: group.fields.map((field) =>
      field.label === t('properties.context.comment') ? { ...field, value: selectedComment.value || '-' } : field
    ),
  }));
  setSelectedInspectorEntry({
    ...current,
    groups,
  });
};

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

watch(
  selectedInspectorEntry,
  () => {
    if (!isLinBusSelection.value) return;
    selectedBaudrate.value = parseBaudrateFromSelection();
    const nameField = selectedInspectorEntry.value?.groups
      .flatMap((group) => group.fields)
      .find((field) => field.label === t('properties.context.name'));
    selectedLinBusName.value = nameField?.value ?? '';
    const commentField = selectedInspectorEntry.value?.groups
      .flatMap((group) => group.fields)
      .find((field) => field.label === t('properties.context.comment'));
    selectedComment.value = commentField?.value === '-' ? '' : commentField?.value ?? '';
  },
  { immediate: true, deep: true }
);

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
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-section {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  padding: 10px;
  background: var(--app-bg-elevated);
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 8px;
  line-height: 1.2;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 11px;
  color: var(--app-text-muted);
  line-height: 1.2;
}

.field-value {
  min-height: 28px;
  font-size: 12px;
  line-height: 1.35;
  color: var(--app-text-regular);
  padding: 5px 8px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  word-break: break-all;
  display: flex;
  align-items: center;
}

.field-select,
.field-input,
.field-textarea {
  width: 100%;
  box-sizing: border-box;
  font-size: 12px;
  color: var(--app-text-regular);
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.field-select {
  min-height: 30px;
}

.field-textarea {
  min-height: 72px;
  line-height: 1.4;
  padding: 6px 8px;
  resize: vertical;
  font-family: inherit;
}

.field-input {
  height: 30px;
  line-height: 1.2;
  padding: 0 8px;
}

.field-input-name {
  font-weight: 500;
}

.common-kv-row {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 6px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
}

.common-kv-label {
  font-size: 12px;
  color: var(--app-text-muted);
}

.common-kv-value {
  font-size: 12px;
  color: var(--app-text-primary);
  text-align: right;
  font-weight: 500;
}

.field-select:hover,
.field-input:hover,
.field-textarea:hover {
  border-color: color-mix(in srgb, var(--app-border) 40%, var(--app-text-primary) 60%);
}

.field-select:focus,
.field-input:focus,
.field-textarea:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-accent) 45%, transparent);
}

.field-select :deep(.el-select__wrapper) {
  min-height: 30px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--app-bg);
  box-shadow: inset 0 0 0 1px var(--app-border);
}

.field-select :deep(.el-select__wrapper:hover) {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-border) 40%, var(--app-text-primary) 60%);
}

.field-select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 0 0 1px var(--app-accent),
    0 0 0 1px color-mix(in srgb, var(--app-accent) 45%, transparent);
}

.field-select :deep(.el-select__placeholder),
.field-select :deep(.el-select__selected-item) {
  color: var(--app-text-regular);
  font-size: 12px;
}

:global(.app-baudrate-select-dropdown.el-select__popper) {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background-color: var(--app-bg-elevated);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
}

:global(.app-baudrate-select-dropdown .el-select-dropdown),
:global(.app-baudrate-select-dropdown .el-select-dropdown__wrap),
:global(.app-baudrate-select-dropdown .el-scrollbar__view),
:global(.app-baudrate-select-dropdown .el-select-dropdown__list) {
  background-color: var(--app-bg-elevated);
}

:global(.app-baudrate-select-dropdown .el-popper__arrow::before) {
  border: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
}

:global(.app-baudrate-select-dropdown .el-select-dropdown__item) {
  color: var(--app-text-regular);
  font-size: 12px;
  min-height: 30px;
  line-height: 30px;
  padding: 0 10px;
}

:global(.app-baudrate-select-dropdown .el-select-dropdown__item.hover),
:global(.app-baudrate-select-dropdown .el-select-dropdown__item:hover) {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

:global(.app-baudrate-select-dropdown .el-select-dropdown__item.is-selected) {
  background-color: color-mix(in srgb, var(--app-accent) 22%, var(--app-bg-elevated));
  color: var(--app-text-primary);
  font-weight: 600;
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
