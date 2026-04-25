<template>
  <div class="ldf-editor-view">
    <div class="ldf-toolbar">
      <el-tooltip :content="t('tabs.ldfEditor.newSlaveNode')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
        <button class="ldf-toolbar-btn ldf-toolbar-btn-node" type="button" @click="addSlaveNode">
          <el-icon><Connection /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip :content="t('tabs.ldfEditor.newFrame')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
        <button class="ldf-toolbar-btn" type="button" @click="addFrame">
          <el-icon><Tickets /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip :content="t('tabs.ldfEditor.newScheduleTable')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
        <button class="ldf-toolbar-btn" type="button" @click="addScheduleTable">
          <el-icon><Calendar /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip :content="t('tabs.ldfEditor.check')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
        <button class="ldf-toolbar-btn" type="button" @click="runQuickCheck">
          <el-icon><CircleCheck /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip :content="t('tabs.ldfEditor.toggleHexDec')" placement="bottom" :show-after="250" popper-class="app-unified-tooltip">
        <button class="ldf-toolbar-btn ldf-toolbar-btn-mode" type="button" @click="toggleViewMode">
          {{ viewMode === 'hex' ? 'HEX' : 'DEC' }}
        </button>
      </el-tooltip>
    </div>
    <div ref="editorBodyRef" class="ldf-editor-body">
      <aside class="ldf-outline-pane">
        <div class="ldf-outline-tabs">
          <button
            class="ldf-outline-tab"
            :class="{ active: outlineViewMode === 'nodes' }"
            type="button"
            @click="outlineViewMode = 'nodes'"
          >
            {{ t('tabs.ldfEditor.nodeView') }}
          </button>
          <button
            class="ldf-outline-tab"
            :class="{ active: outlineViewMode === 'frames' }"
            type="button"
            @click="outlineViewMode = 'frames'"
          >
            {{ t('tabs.ldfEditor.frameView') }}
          </button>
          <button
            class="ldf-outline-tab"
            :class="{ active: outlineViewMode === 'schedules' }"
            type="button"
            @click="outlineViewMode = 'schedules'"
          >
            {{ t('tabs.ldfEditor.scheduleView') }}
          </button>
        </div>
        <el-tree
          class="ldf-outline-tree"
          :data="currentOutlineTreeData"
          node-key="id"
          :current-node-key="currentOutlineNodeId"
          :default-expanded-keys="currentExpandedKeys"
          highlight-current
          :expand-on-click-node="false"
          @node-click="handleOutlineNodeClick"
          @node-contextmenu="handleOutlineNodeContextMenu"
        >
          <template #default="{ data }">
            <div class="ldf-tree-node-content">
              <el-icon class="ldf-tree-node-icon">
                <component :is="resolveNodeIcon(data.icon)" />
              </el-icon>
              <input
                v-if="renamingSlaveNodeId === data.id"
                ref="renamingSlaveInputRef"
                v-model="renamingSlaveName"
                class="ldf-tree-rename-input"
                type="text"
                @click.stop
                @keydown.enter.prevent="submitRenameSlaveNode"
                @keydown.esc.prevent="cancelRenameSlaveNode"
                @blur="submitRenameSlaveNode"
              />
              <span v-else class="ldf-tree-node-label">{{ data.label }}</span>
            </div>
          </template>
        </el-tree>
      </aside>
      <div
        class="ldf-outline-resizer"
        role="separator"
        aria-orientation="vertical"
        @mousedown="startResize"
      ></div>
      <div class="ldf-editor-main">
        <section v-if="outlineViewMode === 'frames'" class="ldf-frame-editor-panel ldf-frame-editor-panel-fill">
          <div class="ldf-frame-editor-title">{{ t('tabs.ldfEditor.frameEditor.title') }}</div>
          <div class="ldf-frame-group">
            <div class="ldf-frame-group-title">{{ t('tabs.ldfEditor.frameEditor.frameProperties') }}</div>
            <div class="ldf-frame-editor-grid">
              <label class="ldf-frame-editor-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.name') }}</span>
                <input v-model="frameEditor.name" type="text" />
              </label>
              <label class="ldf-frame-editor-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.length') }}</span>
                <input v-model.number="frameEditor.length" type="number" min="1" max="8" />
              </label>
              <label class="ldf-frame-editor-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.id') }}</span>
                <input v-model="frameEditor.idHex" type="text" />
              </label>
            </div>
          </div>
          <div class="ldf-frame-group">
            <div class="ldf-frame-group-title">{{ t('tabs.ldfEditor.frameEditor.relations') }}</div>
            <div class="ldf-frame-editor-grid ldf-frame-relations-grid">
              <label class="ldf-frame-editor-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.publisher') }}</span>
                <input v-model="frameEditor.publisher" type="text" />
              </label>
              <label class="ldf-frame-editor-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.subscriber') }}</span>
                <input v-model="frameEditor.subscriber" type="text" />
              </label>
            </div>
          </div>
          <div class="ldf-frame-group ldf-frame-group-mapping">
            <div class="ldf-frame-group-title-row">
              <div class="ldf-frame-group-title">{{ t('tabs.ldfEditor.frameEditor.signalMapping') }}</div>
              <div class="ldf-mapping-header-tools">
                <div class="ldf-view-mode-toggle">
                  <button
                    type="button"
                    class="ldf-view-mode-btn"
                    :class="{ active: signalMappingViewMode === 'list' }"
                    @click="signalMappingViewMode = 'list'"
                  >
                    {{ t('tabs.ldfEditor.frameEditor.viewModes.list') }}
                  </button>
                  <button
                    type="button"
                    class="ldf-view-mode-btn"
                    :class="{ active: signalMappingViewMode === 'matrix' }"
                    @click="signalMappingViewMode = 'matrix'"
                  >
                    {{ t('tabs.ldfEditor.frameEditor.viewModes.matrix') }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="signalMappingViewMode === 'list'" class="ldf-frame-mapping-table-wrap">
              <table class="ldf-frame-mapping-table">
                <thead>
                  <tr>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.signal') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.startBit') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.updateBit') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.length') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.publisher') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.subscribers') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in frameSignalRows"
                    :key="row.id"
                    :class="{ selected: selectedSignalRowIndex === index }"
                    @click="selectSignalRow(index)"
                    @dblclick="handleSignalRowEdit(index)"
                    @contextmenu.prevent="openSignalContextMenu($event, index)"
                  >
                    <td>{{ row.signal }}</td>
                    <td>{{ row.startBit }}</td>
                    <td>{{ row.updateBit }}</td>
                    <td>{{ row.length }}</td>
                    <td>{{ row.publisher }}</td>
                    <td>{{ row.subscribers }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else ref="signalMatrixWrapRef" class="ldf-signal-matrix-wrap">
              <div class="ldf-signal-matrix-byte-index-row">
                <span
                  v-for="byteIndex in 8"
                  :key="`byte-${byteIndex}`"
                  class="ldf-signal-matrix-byte-index-cell"
                >
                  {{ byteIndex - 1 }}
                </span>
              </div>
              <div class="ldf-signal-matrix-bit-row">
                <span
                  v-for="bit in bitHeader"
                  :key="`bit-${bit}`"
                  class="ldf-signal-matrix-scale-cell"
                  :class="{ 'byte-end': (bit + 1) % 8 === 0 && bit !== 63 }"
                >
                  {{ bit % 8 }}
                </span>
              </div>
              <div class="ldf-signal-matrix-row">
                <span
                  v-for="bit in bitHeader"
                  :key="`v-${bit}`"
                  class="ldf-signal-matrix-cell"
                  :class="{
                    active: isBitCovered(bit),
                    preview: isDraftBitCovered(bit),
                    committed: isCreatedBitCovered(bit),
                    'selected-created': isSelectedCreatedBitCovered(bit),
                    'selected-created-start': isSelectedCreatedRangeStart(bit),
                    'selected-created-end': isSelectedCreatedRangeEnd(bit),
                    disabled: isBitDisabled(bit),
                    'byte-end': shouldShowByteBoundary(bit)
                  }"
                  :style="getBitCellStyle(bit)"
                  @mousedown.left.prevent="!isBitDisabled(bit) && startBitDrag(bit, $event)"
                  @mouseenter="updateBitDrag(bit)"
                  @mousemove="handleBitCellMouseMove"
                  @mouseup.left.prevent="endBitDrag(bit, $event)"
                  @contextmenu.prevent="openCreatedRangeContextMenu($event, bit)"
                />
              </div>
              <div
                v-if="isDraggingBits && draftRange"
                class="ldf-signal-drag-indicator"
                :style="{ left: `${dragIndicatorPosition.x}px`, top: `${dragIndicatorPosition.y}px` }"
              >
                bit {{ draftRange.start }} - {{ draftRange.end }}
              </div>
              <div
                v-if="draftRange && !isDraggingBits"
                class="ldf-signal-matrix-actions floating"
                :style="{ left: `${draftPopupPosition.x}px`, top: `${draftPopupPosition.y}px` }"
              >
                <div class="ldf-signal-create-row info">
                  <span class="ldf-signal-matrix-hint">开始 bit：{{ draftRange.start }}</span>
                  <span class="ldf-signal-matrix-hint">结束 bit：{{ draftRange.end }}</span>
                </div>
                <div class="ldf-signal-create-row">
                  <input
                    v-model.trim="draftSignalName"
                    class="ldf-signal-name-input"
                    type="text"
                    placeholder="请输入名称"
                    @keydown.enter.prevent="commitDraftRangeToFrame"
                  />
                </div>
                <div class="ldf-signal-create-row actions">
                  <button type="button" class="ldf-frame-editor-btn primary" @click="commitDraftRangeToFrame">
                    确定
                  </button>
                  <button type="button" class="ldf-frame-editor-btn" @click="clearDraftRange">
                    {{ t('common.cancel') }}
                  </button>
                </div>
              </div>
              <div class="ldf-signal-matrix-scale-row bottom">
                <span
                  v-for="bit in bitHeader"
                  :key="`bottom-${bit}`"
                  class="ldf-signal-matrix-scale-cell"
                  :class="{ 'byte-end': (bit + 1) % 8 === 0 && bit !== 63, disabled: isBitDisabled(bit) }"
                >
                  {{ bit === 0 ? '' : bit }}
                </span>
              </div>
            </div>
          </div>
        </section>
        <section v-if="outlineViewMode === 'schedules'" class="ldf-frame-editor-panel">
          <div class="ldf-frame-editor-title">{{ t('tabs.ldfEditor.scheduleEditor.title') }}</div>
          <div class="ldf-frame-editor-grid">
            <label class="ldf-frame-editor-field">
              <span>{{ t('tabs.ldfEditor.scheduleEditor.name') }}</span>
              <input v-model="scheduleEditor.name" type="text" />
            </label>
            <label class="ldf-frame-editor-field ldf-schedule-entry-field">
              <span>{{ t('tabs.ldfEditor.scheduleEditor.entry') }}</span>
              <input v-model="scheduleEditor.entry" type="text" />
            </label>
          </div>
          <div class="ldf-frame-editor-actions">
            <button type="button" class="ldf-frame-editor-btn" @click="applyScheduleEditor">
              {{ t('tabs.ldfEditor.scheduleEditor.apply') }}
            </button>
          </div>
        </section>
      </div>
    </div>
    <div
      v-if="nodeContextMenu.visible"
      class="ldf-node-context-menu"
      :style="{ left: `${nodeContextMenu.x}px`, top: `${nodeContextMenu.y}px` }"
      @click.stop
    >
      <button class="ldf-node-context-menu-item" @click="startEditNode">
        {{ t('layout.header.edit') }}
      </button>
      <button class="ldf-node-context-menu-item danger" @click="deleteNode">
        {{ t('layout.explorer.delete') }}
      </button>
    </div>
    <div
      v-if="signalContextMenu.visible"
      class="ldf-node-context-menu"
      :style="{ left: `${signalContextMenu.x}px`, top: `${signalContextMenu.y}px` }"
      @click.stop
    >
      <button class="ldf-node-context-menu-item" @click="revealSignalInBitmap">
        {{ t('tabs.ldfEditor.frameEditor.contextMenu.revealInBitmap') }}
      </button>
      <button class="ldf-node-context-menu-item" @click="triggerCreateAndMapSignal">
        {{ t('tabs.ldfEditor.frameEditor.actions.createAndMapSignal') }}
      </button>
      <button class="ldf-node-context-menu-item" @click="triggerMapExistingSignal">
        {{ t('tabs.ldfEditor.frameEditor.actions.mapExistingSignal') }}
      </button>
      <button class="ldf-node-context-menu-item" @click="triggerEditSignalRow">
        {{ t('tabs.ldfEditor.frameEditor.actions.editSignal') }}
      </button>
      <button class="ldf-node-context-menu-item danger" @click="triggerRemoveSignalRow">
        {{ t('tabs.ldfEditor.frameEditor.actions.removeSignal') }}
      </button>
    </div>
    <div
      v-if="createdRangeContextMenu.visible"
      class="ldf-node-context-menu"
      :style="{ left: `${createdRangeContextMenu.x}px`, top: `${createdRangeContextMenu.y}px` }"
      @click.stop
    >
      <button class="ldf-node-context-menu-item" @click="openCreatedSignalRow">
        {{ t('tabs.ldfEditor.frameEditor.contextMenu.open') }}
      </button>
      <button class="ldf-node-context-menu-item" @click="revealCreatedSignalInList">
        {{ t('tabs.ldfEditor.frameEditor.contextMenu.revealInList') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, type Component, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { AlarmClock, Calendar, CircleCheck, Connection, Cpu, Tickets } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useUiState } from '../../../state/uiState';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
const { t } = useI18n();
const { setSelectedInspectorEntry } = useUiState();
const editorBodyRef = ref<HTMLDivElement | null>(null);
const signalMatrixWrapRef = ref<HTMLDivElement | null>(null);
const leftPaneWidth = ref(240);
const outlineViewMode = ref<'nodes' | 'frames' | 'schedules'>('nodes');
const currentOutlineNodeId = ref('nodes-root');
const frameEditor = reactive({
  name: 'New_Frame',
  idHex: '0x10',
  publisher: 'Master',
  subscriber: 'Slave1',
  length: 8,
});
const frameSignalRows = ref<Array<{
  id: string;
  signal: string;
  startBit: number;
  updateBit: number;
  length: number;
  publisher: string;
  subscribers: string;
}>>([]);
const selectedSignalRowIndex = ref(-1);
const signalMappingViewMode = ref<'list' | 'matrix'>('list');
const bitHeader = Array.from({ length: 64 }, (_, i) => i);
const isDraggingBits = ref(false);
const dragAnchorBit = ref<number | null>(null);
const dragHoverBit = ref<number | null>(null);
const createdSignalRanges = ref<Array<{ id: string; rowId: string; start: number; end: number; label: string }>>([]);
const selectedCreatedRangeId = ref('');
const draftSignalName = ref('');
const draftPopupPosition = reactive({ x: 12, y: 12 });
const dragIndicatorPosition = reactive({ x: 12, y: 12 });
const scheduleEditor = reactive({
  name: 'New_Schedule',
  entry: 'New_Frame delay 10 ms;',
});
const renamingSlaveNodeId = ref<string | null>(null);
const renamingSlaveName = ref('');
const renamingSlaveInputRef = ref<HTMLInputElement | null>(null);
const nodeContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  nodeId: '',
  nodeLabel: '',
  entryType: '',
  frameName: '',
});
const signalContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  rowIndex: -1,
});
const createdRangeContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  rangeId: '',
});

const currentOutlineTreeData = computed(() => {
  const linBusName = resolveLinBusName(props.modelValue);
  if (outlineViewMode.value === 'nodes') {
    const source = props.modelValue ?? '';
    const masterMeta = parseMasterNodeMeta(source);
    const slaveNodes = parseSlaveNodesMeta(source);
    return [
      {
        id: 'nodes-root',
        label: linBusName,
        icon: 'group',
        children: [
          {
            id: 'master-node',
            label: masterMeta.name || t('tabs.ldfEditor.tree.masterNode'),
            icon: 'master',
            children: [
              {
                id: 'master-pulished-signaals',
                label: t('tabs.ldfEditor.tree.pulishedSignaals'),
                icon: 'frame',
              },
              {
                id: 'master-subscribed-signals',
                label: t('tabs.ldfEditor.tree.subscribedSignals'),
                icon: 'frame',
              },
              {
                id: 'master-pulished-frames',
                label: t('tabs.ldfEditor.tree.pulishedFrames'),
                icon: 'frame',
              },
              {
                id: 'master-subscribed-signals-2',
                label: t('tabs.ldfEditor.tree.subscribedSignals'),
                icon: 'frame',
              },
            ],
          },
          ...slaveNodes.map((slaveName, index) => ({
            id: index === 0 ? 'slave-node' : `slave-node-${index}`,
            label: slaveName,
            icon: 'slave',
            entryType: 'slave-entry',
            children: [
              {
                id: `slave-pulished-signaals-${index}`,
                label: t('tabs.ldfEditor.tree.pulishedSignaals'),
                icon: 'frame',
              },
              {
                id: `slave-subscribed-signals-${index}`,
                label: t('tabs.ldfEditor.tree.subscribedSignals'),
                icon: 'frame',
              },
              {
                id: `slave-pulished-frames-${index}`,
                label: t('tabs.ldfEditor.tree.pulishedFrames'),
                icon: 'frame',
              },
              {
                id: `slave-subscribed-signals-2-${index}`,
                label: t('tabs.ldfEditor.tree.subscribedSignals'),
                icon: 'frame',
              },
            ],
          })),
        ],
      },
    ];
  }

  if (outlineViewMode.value === 'schedules') {
    return [
      {
        id: 'schedules-root',
        label: linBusName,
        icon: 'schedule-group',
        children: [
          {
            id: 'schedule-tables-root',
            label: t('tabs.ldfEditor.tree.scheduleTables'),
            icon: 'schedule-folder',
            children: [
              {
                id: 'new-schedule-0',
                label: t('tabs.ldfEditor.tree.newSchedule0'),
                icon: 'schedule',
                scheduleName: 'New_Schedule',
              },
            ],
          },
        ],
      },
    ];
  }

  return [
    {
      id: 'frames-root',
      label: linBusName,
      icon: 'frame-group',
      children: [
        {
          id: 'unconditional-frames',
          label: t('tabs.ldfEditor.tree.unconditionalFrames'),
          icon: 'frame-folder',
          children: [
            {
              id: 'new-frame-0',
              label: t('tabs.ldfEditor.tree.newFrame0'),
              icon: 'frame',
              entryType: 'frame-entry',
              frameName: 'New_Frame',
            },
            {
              id: 'new-frame-1',
              label: t('tabs.ldfEditor.tree.newFrame1'),
              icon: 'frame',
              entryType: 'frame-entry',
              frameName: 'New_Frame_1',
            },
          ],
        },
        {
          id: 'diagnostic-frames',
          label: t('tabs.ldfEditor.tree.diagnosticFrames'),
          icon: 'frame-folder',
          children: [
            {
              id: 'master-req-60',
              label: t('tabs.ldfEditor.tree.masterReq60'),
              icon: 'diag-frame',
              entryType: 'frame-entry',
              frameName: 'MasterReq',
            },
            {
              id: 'slave-resp-61',
              label: t('tabs.ldfEditor.tree.slaveResp61'),
              icon: 'diag-frame',
              entryType: 'frame-entry',
              frameName: 'SlaveResp',
            },
          ],
        },
        {
          id: 'event-triggered-frames',
          label: t('tabs.ldfEditor.tree.eventTriggeredFrames'),
          icon: 'frame-folder',
        },
      ],
    },
  ];
});

const resolveLinBusName = (source: string) => {
  const explicitNameMatch =
    source.match(/LIN_bus_name\s*=\s*"([^"]+)";/i) ??
    source.match(/Channel_name\s*=\s*"([^"]+)";/i) ??
    source.match(/Cluster_name\s*=\s*"([^"]+)";/i);
  if (explicitNameMatch?.[1]) {
    return explicitNameMatch[1].trim();
  }

  const headerNameMatch = source.match(/LIN_description_file\s+([A-Za-z_]\w*)\s*;/i);
  if (headerNameMatch?.[1]) {
    return headerNameMatch[1];
  }

  return t('tabs.ldfEditor.tree.linBusDefault');
};

const currentExpandedKeys = computed(() => {
  if (outlineViewMode.value === 'nodes') {
    return ['nodes-root'];
  }
  if (outlineViewMode.value === 'frames') {
    return ['frames-root'];
  }
  return ['schedules-root', 'schedule-tables-root'];
});

const parseFrameByName = (source: string, frameName: string) => {
  const frameRegex = new RegExp(`${frameName}\\s*:\\s*(0x[0-9A-Fa-f]+|\\d+)\\s*,\\s*([A-Za-z_]\\w*)\\s*,\\s*(\\d+)\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const matched = source.match(frameRegex);
  if (!matched) {
    return null;
  }
  return {
    idHex: matched[1].startsWith('0x') || matched[1].startsWith('0X') ? matched[1] : `0x${Number.parseInt(matched[1], 10).toString(16).toUpperCase()}`,
    publisher: matched[2],
    length: Number.parseInt(matched[3], 10),
  };
};

const loadFrameEditor = (frameName: string) => {
  const parsed = parseFrameByName(props.modelValue ?? '', frameName);
  frameEditor.name = frameName;
  frameEditor.idHex = parsed?.idHex ?? '0x10';
  frameEditor.publisher = parsed?.publisher ?? 'Master';
  frameEditor.subscriber = 'Slave1';
  frameEditor.length = parsed?.length ?? 8;
};

const editSignalRow = () => {
  if (selectedSignalRowIndex.value < 0) return;
  ElMessage.info(t('tabs.ldfEditor.frameEditor.hints.editSignalTodo'));
};

const removeSignalRow = () => {
  if (selectedSignalRowIndex.value < 0) return;
  const removed = frameSignalRows.value[selectedSignalRowIndex.value];
  frameSignalRows.value.splice(selectedSignalRowIndex.value, 1);
  if (removed?.id) {
    const removedRangeIds = createdSignalRanges.value.filter((range) => range.rowId === removed.id).map((range) => range.id);
    createdSignalRanges.value = createdSignalRanges.value.filter((range) => range.rowId !== removed.id);
    if (removedRangeIds.includes(selectedCreatedRangeId.value)) {
      selectedCreatedRangeId.value = '';
    }
  }
  selectedSignalRowIndex.value = -1;
};

const selectSignalRow = (index: number) => {
  selectedSignalRowIndex.value = index;
  const row = frameSignalRows.value[index];
  if (!row?.id) {
    selectedCreatedRangeId.value = '';
    return;
  }
  const linkedRange = createdSignalRanges.value.find((range) => range.rowId === row.id);
  selectedCreatedRangeId.value = linkedRange?.id ?? '';
};

const handleSignalRowEdit = (index: number) => {
  selectSignalRow(index);
  editSignalRow();
};

const createAndMapSignal = () => {
  const nextIndex = frameSignalRows.value.length + 1;
  frameSignalRows.value.push({
    id: `sig-${Date.now()}-${nextIndex}`,
    signal: `Signal_${nextIndex}`,
    startBit: 0,
    updateBit: 0,
    length: 8,
    publisher: frameEditor.publisher,
    subscribers: frameEditor.subscriber,
  });
  selectedSignalRowIndex.value = frameSignalRows.value.length - 1;
};

const mapExistingSignal = () => {
  ElMessage.info(t('tabs.ldfEditor.frameEditor.hints.mapExistingSignalTodo'));
};

const openSignalContextMenu = (event: MouseEvent, index: number) => {
  selectSignalRow(index);
  closeNodeContextMenu();
  closeCreatedRangeContextMenu();
  signalContextMenu.x = event.clientX;
  signalContextMenu.y = event.clientY;
  signalContextMenu.rowIndex = index;
  signalContextMenu.visible = true;
};

const closeSignalContextMenu = () => {
  signalContextMenu.visible = false;
  signalContextMenu.rowIndex = -1;
};

const closeCreatedRangeContextMenu = () => {
  createdRangeContextMenu.visible = false;
  createdRangeContextMenu.rangeId = '';
};

const triggerCreateAndMapSignal = () => {
  createAndMapSignal();
  closeSignalContextMenu();
};

const triggerMapExistingSignal = () => {
  mapExistingSignal();
  closeSignalContextMenu();
};

const triggerEditSignalRow = () => {
  editSignalRow();
  closeSignalContextMenu();
};

const triggerRemoveSignalRow = () => {
  removeSignalRow();
  closeSignalContextMenu();
};

const revealSignalInBitmap = () => {
  if (signalContextMenu.rowIndex >= 0) {
    selectSignalRow(signalContextMenu.rowIndex);
  }
  signalMappingViewMode.value = 'matrix';
  closeSignalContextMenu();
};

const currentSignalRow = computed(() => {
  if (selectedSignalRowIndex.value < 0) return null;
  return frameSignalRows.value[selectedSignalRowIndex.value] ?? null;
});

const selectedSignalLabel = computed(() => currentSignalRow.value?.signal ?? '');
const maxEditableBit = computed(() => Math.max(0, Math.min(64, Number(frameEditor.length || 0) * 8)) - 1);

const draftRange = computed(() => {
  if (dragAnchorBit.value === null || dragHoverBit.value === null) return null;
  const start = Math.min(dragAnchorBit.value, dragHoverBit.value);
  const end = Math.max(dragAnchorBit.value, dragHoverBit.value);
  return { start, end };
});


const isBitCovered = (bit: number) => {
  const row = currentSignalRow.value;
  if (!row) return false;
  if (isBitDisabled(bit)) return false;
  const start = Math.max(0, Number(row.startBit) || 0);
  const len = Math.max(1, Number(row.length) || 1);
  const end = start + len - 1;
  return bit >= start && bit <= end;
};

const isBitDisabled = (bit: number) => bit > maxEditableBit.value;

const isDraftBitCovered = (bit: number) => {
  if (!draftRange.value) return false;
  if (isBitDisabled(bit)) return false;
  return bit >= draftRange.value.start && bit <= draftRange.value.end;
};

const isCreatedBitCovered = (bit: number) =>
  !isBitDisabled(bit) && createdSignalRanges.value.some((range) => bit >= range.start && bit <= range.end);

const shouldShowByteBoundary = (bit: number) => {
  if (isBitDisabled(bit)) return (bit + 1) % 8 === 0 && bit !== 63;
  if ((bit + 1) % 8 !== 0 || bit === 63) return false;
  const range = getCreatedRangeAtBit(bit);
  // 已创建区内部隐藏 byte 分割线，仅在区段末端保留边界。
  if (range && bit < range.end) return false;
  return true;
};

const isSelectedCreatedBitCovered = (bit: number) =>
  !isBitDisabled(bit) &&
  createdSignalRanges.value.some((range) => range.id === selectedCreatedRangeId.value && bit >= range.start && bit <= range.end);

const isSelectedCreatedRangeStart = (bit: number) =>
  createdSignalRanges.value.some((range) => range.id === selectedCreatedRangeId.value && range.start === bit);

const isSelectedCreatedRangeEnd = (bit: number) =>
  createdSignalRanges.value.some((range) => range.id === selectedCreatedRangeId.value && range.end === bit);

const getCreatedRangeAtBit = (bit: number) =>
  createdSignalRanges.value.find((range) => bit >= range.start && bit <= range.end) ?? null;

const getRangeHue = (range: { id: string; start: number; end: number; label: string }) => {
  const index = createdSignalRanges.value.findIndex((item) => item.id === range.id);
  if (index < 0) return 210;
  return (index * 53) % 360;
};

const getBitCellStyle = (bit: number) => {
  const style: Record<string, string> = {};
  if (isDraftBitCovered(bit)) {
    const draftHue = 28;
    style.background = `linear-gradient(180deg, hsla(${draftHue}, 86%, 82%, 0.48) 0%, hsla(${draftHue + 12}, 78%, 76%, 0.56) 100%)`;
    return style;
  }
  const range = getCreatedRangeAtBit(bit);
  if (!range) return undefined;
  const hue = getRangeHue(range);
  style.background = `linear-gradient(180deg, hsla(${hue}, 78%, 82%, 0.52) 0%, hsla(${(hue + 26) % 360}, 72%, 74%, 0.62) 100%)`;
  // 让创建区段内部成为整片填充色，隐藏内部 bit 分割线，仅保留区段末端边界。
  if (bit < range.end) {
    style.borderRight = 'none';
  }
  return style;
};

const updateDraftPopupPosition = (event?: MouseEvent) => {
  if (!event) return;
  const hostRect = signalMatrixWrapRef.value?.getBoundingClientRect();
  if (!hostRect) return;
  const rawX = event.clientX - hostRect.left + 12;
  const rawY = event.clientY - hostRect.top + 12;
  const maxX = Math.max(8, hostRect.width - 320);
  const maxY = Math.max(8, hostRect.height - 42);
  draftPopupPosition.x = Math.min(maxX, Math.max(8, rawX));
  draftPopupPosition.y = Math.min(maxY, Math.max(8, rawY));
};

const updateDragIndicatorPosition = (event?: MouseEvent) => {
  if (!event) return;
  const hostRect = signalMatrixWrapRef.value?.getBoundingClientRect();
  if (!hostRect) return;
  const rawX = event.clientX - hostRect.left + 12;
  const rawY = event.clientY - hostRect.top - 30;
  const maxX = Math.max(8, hostRect.width - 180);
  const maxY = Math.max(8, hostRect.height - 28);
  dragIndicatorPosition.x = Math.min(maxX, Math.max(8, rawX));
  dragIndicatorPosition.y = Math.min(maxY, Math.max(8, rawY));
};

const startBitDrag = (bit: number, event?: MouseEvent) => {
  if (isBitDisabled(bit)) return;
  const createdRange = getCreatedRangeAtBit(bit);
  if (createdRange) {
    selectedCreatedRangeId.value = createdRange.id;
    clearDraftRange();
    return;
  }
  selectedCreatedRangeId.value = '';
  closeCreatedRangeContextMenu();
  isDraggingBits.value = true;
  dragAnchorBit.value = bit;
  dragHoverBit.value = bit;
  updateDraftPopupPosition(event);
  updateDragIndicatorPosition(event);
};

const updateBitDrag = (bit: number) => {
  if (!isDraggingBits.value) return;
  if (isBitDisabled(bit)) return;
  dragHoverBit.value = bit;
};

const handleBitCellMouseMove = (event: MouseEvent) => {
  if (!isDraggingBits.value) return;
  updateDragIndicatorPosition(event);
};

const endBitDrag = (bit?: number, event?: MouseEvent) => {
  if (!isDraggingBits.value) return;
  if (typeof bit === 'number' && !isBitDisabled(bit)) {
    dragHoverBit.value = bit;
  }
  isDraggingBits.value = false;
  updateDraftPopupPosition(event);
  if (draftRange.value) {
    const nextIndex = createdSignalRanges.value.length + 1;
    draftSignalName.value = `Frame_${nextIndex}`;
  }
};

const clearDraftRange = () => {
  dragAnchorBit.value = null;
  dragHoverBit.value = null;
  isDraggingBits.value = false;
  draftSignalName.value = '';
};

const commitDraftRangeToFrame = () => {
  if (!draftRange.value) return;
  const nextIndex = createdSignalRanges.value.length + 1;
  const nextLabel = draftSignalName.value || `Frame_${nextIndex}`;
  const rangeLength = draftRange.value.end - draftRange.value.start + 1;
  const nextRowId = `sig-${Date.now()}-${nextIndex}`;
  frameSignalRows.value.push({
    id: nextRowId,
    signal: nextLabel,
    startBit: draftRange.value.start,
    updateBit: 0,
    length: rangeLength,
    publisher: frameEditor.publisher,
    subscribers: frameEditor.subscriber,
  });
  selectedSignalRowIndex.value = frameSignalRows.value.length - 1;
  createdSignalRanges.value.push({
    id: `draft-frame-${Date.now()}-${nextIndex}`,
    rowId: nextRowId,
    start: draftRange.value.start,
    end: draftRange.value.end,
    label: nextLabel,
  });
  selectedCreatedRangeId.value = createdSignalRanges.value[createdSignalRanges.value.length - 1]?.id ?? '';
  clearDraftRange();
};

const openCreatedRangeContextMenu = (event: MouseEvent, bit: number) => {
  const range = getCreatedRangeAtBit(bit);
  if (!range) return;
  closeNodeContextMenu();
  closeSignalContextMenu();
  createdRangeContextMenu.x = event.clientX;
  createdRangeContextMenu.y = event.clientY;
  createdRangeContextMenu.rangeId = range.id;
  createdRangeContextMenu.visible = true;
};

const openCreatedSignalRow = () => {
  const range = createdSignalRanges.value.find((item) => item.id === createdRangeContextMenu.rangeId);
  if (!range) return;
  selectedCreatedRangeId.value = range.id;
  const index = frameSignalRows.value.findIndex((row) => row.id === range.rowId);
  if (index >= 0) {
    selectSignalRow(index);
  }
  closeCreatedRangeContextMenu();
};

const revealCreatedSignalInList = () => {
  openCreatedSignalRow();
  signalMappingViewMode.value = 'list';
};

const handleGlobalBitMouseUp = (event: MouseEvent) => {
  endBitDrag(undefined, event);
};

const parseScheduleByName = (source: string, scheduleName: string) => {
  const scheduleRegex = new RegExp(`${scheduleName}\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const matched = source.match(scheduleRegex);
  if (!matched) {
    return null;
  }
  const firstEntry = matched[1]
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('//'));
  return {
    entry: firstEntry ?? 'New_Frame delay 10 ms;',
  };
};

const loadScheduleEditor = (scheduleName: string) => {
  const parsed = parseScheduleByName(props.modelValue ?? '', scheduleName);
  scheduleEditor.name = scheduleName;
  scheduleEditor.entry = parsed?.entry ?? 'New_Frame delay 10 ms;';
};

const parseLinBusMeta = (source: string) => {
  const protocolVersion = source.match(/LIN_protocol_version\s*=\s*"([^"]+)";/i)?.[1] ?? '1.3';
  const languageVersion = source.match(/LIN_language_version\s*=\s*"([^"]+)";/i)?.[1] ?? '2.1';
  const baudrate = source.match(/Bitrate\s*=\s*(\d+)\s*;/i)?.[1] ?? '19200';
  const comment = source.match(/\/\*\s*([\s\S]*?)\s*\*\//)?.[1]?.trim() ?? '';
  const name = resolveLinBusName(source);
  return { protocolVersion, languageVersion, baudrate, comment, name };
};

const parseMasterNodeMeta = (source: string) => {
  const matched = source.match(/Master\s*:\s*([A-Za-z_]\w*)\s*,\s*([\d.]+)\s*ms\s*,\s*([\d.]+)\s*ms\s*;/);
  return {
    name: matched?.[1] ?? 'Master',
    timeBase: matched?.[2] ?? '5',
    jitter: matched?.[3] ?? '1',
  };
};

const parseSlaveNodeMeta = (source: string) => {
  const matched = source.match(/Slaves\s*:\s*([^;]+);/);
  const firstSlave = matched?.[1]?.split(',').map((item) => item.trim()).filter(Boolean)?.[0] ?? 'Slave';
  return { name: firstSlave };
};

const parseSlaveNodesMeta = (source: string) => {
  const matched = source.match(/Slaves\s*:\s*([^;]+);/);
  const parsed = matched?.[1]
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (parsed && parsed.length > 0) {
    return parsed;
  }
  return [t('tabs.ldfEditor.tree.slaveNode')];
};

const closeNodeContextMenu = () => {
  nodeContextMenu.visible = false;
  nodeContextMenu.frameName = '';
};

const updateSlaveNodes = (updater: (nodes: string[]) => string[]) => {
  const source = props.modelValue ?? '';
  const nodesBlockPattern = /Nodes\s*\{([\s\S]*?)\}/m;
  const nodesMatch = source.match(nodesBlockPattern);
  if (!nodesMatch) return;
  const nodesBlock = nodesMatch[1];
  const slavesPattern = /Slaves\s*:\s*([^;]*);/m;
  const slavesMatch = nodesBlock.match(slavesPattern);
  const existing = slavesMatch?.[1]
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
  const next = updater(existing);
  const nextSlavesLine = `Slaves: ${next.join(', ')};`;
  const updatedNodes = slavesPattern.test(nodesBlock)
    ? nodesBlock.replace(slavesPattern, nextSlavesLine)
    : `${nodesBlock.trimEnd()}\n  ${nextSlavesLine}\n`;
  const updated = source.replace(nodesBlockPattern, `Nodes {${updatedNodes}}`);
  emit('update:modelValue', updated);
};

const syncInspectorSelection = (data: { id?: string; frameName?: string; scheduleName?: string }) => {
  const source = props.modelValue ?? '';
  const busMeta = parseLinBusMeta(source);

  if (data.id === 'nodes-root' || data.id === 'frames-root' || data.id === 'schedules-root') {
    setSelectedInspectorEntry({
      kind: 'linbus',
      title: busMeta.name,
      groups: [
        {
          title: t('properties.context.common'),
          fields: [
            { label: t('properties.context.linProtocolVersion'), value: busMeta.protocolVersion },
            { label: t('properties.context.linLanguageVersion'), value: busMeta.languageVersion },
          ],
        },
        {
          title: t('properties.context.linbusProperties'),
          fields: [
            { label: t('properties.context.name'), value: busMeta.name },
            { label: t('properties.context.baudrate'), value: busMeta.baudrate },
            { label: t('properties.context.comment'), value: busMeta.comment || '-' },
          ],
        },
      ],
    });
    return;
  }

  if (data.id === 'master-node') {
    const master = parseMasterNodeMeta(source);
    setSelectedInspectorEntry({
      kind: 'linbus',
      title: master.name,
      groups: [
        {
          title: t('properties.context.generalCommanderProperties'),
          fields: [
            { label: t('properties.context.name'), value: master.name },
          ],
        },
        {
          title: t('properties.context.commanderProperties'),
          fields: [
            { label: t('properties.context.timebaseMs'), value: master.timeBase },
            { label: t('properties.context.jitterMs'), value: master.jitter },
          ],
        },
      ],
    });
    return;
  }

  if (data.id?.startsWith('slave-node')) {
    const slaveNameFromTree = data.label?.trim();
    const slave = { name: slaveNameFromTree || parseSlaveNodeMeta(source).name };
    setSelectedInspectorEntry({
      kind: 'linbus',
      title: slave.name,
      groups: [
        {
          title: t('properties.context.nodeProperties'),
          fields: [
            { label: t('properties.context.role'), value: t('properties.context.slave') },
            { label: t('properties.context.name'), value: slave.name },
          ],
        },
      ],
    });
    return;
  }

  if (data.frameName) {
    const frame = parseFrameByName(source, data.frameName);
    setSelectedInspectorEntry({
      kind: 'linbus',
      title: data.frameName,
      groups: [
        {
          title: t('properties.context.frameProperties'),
          fields: [
            { label: t('properties.context.name'), value: data.frameName },
            { label: t('properties.context.id'), value: frame?.idHex ?? '-' },
            { label: t('properties.context.publisher'), value: frame?.publisher ?? '-' },
            { label: t('properties.context.length'), value: `${frame?.length ?? '-'}` },
          ],
        },
      ],
    });
    return;
  }

  if (data.scheduleName) {
    const schedule = parseScheduleByName(source, data.scheduleName);
    setSelectedInspectorEntry({
      kind: 'linbus',
      title: data.scheduleName,
      groups: [
        {
          title: t('properties.context.scheduleProperties'),
          fields: [
            { label: t('properties.context.name'), value: data.scheduleName },
            { label: t('properties.context.entry'), value: schedule?.entry ?? '-' },
          ],
        },
      ],
    });
    return;
  }

  setSelectedInspectorEntry(null);
};

const handleOutlineNodeClick = (data: { id?: string; label?: string; frameName?: string; scheduleName?: string }) => {
  closeNodeContextMenu();
  if (data.id) {
    currentOutlineNodeId.value = data.id;
  }
  if (outlineViewMode.value === 'frames' && data.frameName) {
    loadFrameEditor(data.frameName);
  }
  if (outlineViewMode.value === 'schedules' && data.scheduleName) {
    loadScheduleEditor(data.scheduleName);
  }
  syncInspectorSelection(data);
};

const handleOutlineNodeContextMenu = (event: MouseEvent, data: { id?: string; label?: string; entryType?: string; frameName?: string }) => {
  if ((data.entryType !== 'slave-entry' && data.entryType !== 'frame-entry') || !data.id || !data.label) {
    return;
  }
  event.preventDefault();
  nodeContextMenu.x = event.clientX;
  nodeContextMenu.y = event.clientY;
  nodeContextMenu.nodeId = data.id;
  nodeContextMenu.nodeLabel = data.label;
  nodeContextMenu.entryType = data.entryType;
  nodeContextMenu.frameName = data.frameName ?? '';
  nodeContextMenu.visible = true;
};

const startEditNode = () => {
  if (nodeContextMenu.entryType === 'frame-entry') {
    if (!nodeContextMenu.frameName) return;
    outlineViewMode.value = 'frames';
    currentOutlineNodeId.value = nodeContextMenu.nodeId;
    loadFrameEditor(nodeContextMenu.frameName);
    syncInspectorSelection({
      id: nodeContextMenu.nodeId,
      frameName: nodeContextMenu.frameName,
    });
    closeNodeContextMenu();
    return;
  }
  if (!nodeContextMenu.nodeId || !nodeContextMenu.nodeLabel) return;
  renamingSlaveNodeId.value = nodeContextMenu.nodeId;
  renamingSlaveName.value = nodeContextMenu.nodeLabel;
  closeNodeContextMenu();
  void nextTick(() => {
    if (!renamingSlaveInputRef.value) return;
    renamingSlaveInputRef.value.focus();
    renamingSlaveInputRef.value.select();
  });
};

const cancelRenameSlaveNode = () => {
  renamingSlaveNodeId.value = null;
  renamingSlaveName.value = '';
};

const submitRenameSlaveNode = () => {
  if (!renamingSlaveNodeId.value) return;
  const oldName = nodeContextMenu.nodeLabel;
  const nextName = renamingSlaveName.value.trim();
  if (!oldName || !nextName || nextName === oldName) {
    cancelRenameSlaveNode();
    return;
  }
  updateSlaveNodes((nodes) => {
    if (nodes.includes(nextName)) return nodes;
    return nodes.map((name) => (name === oldName ? nextName : name));
  });
  cancelRenameSlaveNode();
};

const deleteNode = () => {
  if (nodeContextMenu.entryType === 'frame-entry') {
    const targetFrame = nodeContextMenu.frameName;
    if (!targetFrame) return;
    const source = props.modelValue ?? '';
    const framePattern = new RegExp(`\\n\\s*${targetFrame}\\s*:\\s*(0x[0-9A-Fa-f]+|\\d+)\\s*,\\s*([A-Za-z_]\\w*)\\s*,\\s*(\\d+)\\s*\\{([\\s\\S]*?)\\}\\n?`, 'm');
    if (!framePattern.test(source)) {
      closeNodeContextMenu();
      return;
    }
    const updated = source.replace(framePattern, '\n');
    emit('update:modelValue', updated.replace(/\n{3,}/g, '\n\n'));
    closeNodeContextMenu();
    return;
  }
  const targetName = nodeContextMenu.nodeLabel;
  if (!targetName) return;
  updateSlaveNodes((nodes) => nodes.filter((name) => name !== targetName));
  closeNodeContextMenu();
};

const applyFrameEditor = () => {
  if (outlineViewMode.value !== 'frames') {
    return;
  }
  const source = props.modelValue ?? '';
  const safeName = (frameEditor.name || 'New_Frame').trim() || 'New_Frame';
  const safePublisher = (frameEditor.publisher || 'Master').trim() || 'Master';
  const safeLength = Math.min(8, Math.max(1, Number(frameEditor.length) || 8));
  const rawId = (frameEditor.idHex || '0x10').trim();
  const idNumber = rawId.startsWith('0x') || rawId.startsWith('0X') ? Number.parseInt(rawId, 16) : Number.parseInt(rawId, 10);
  const safeId = Number.isNaN(idNumber) ? '0x10' : `0x${idNumber.toString(16).toUpperCase()}`;
  const frameBlock = `\n  ${safeName}: ${safeId}, ${safePublisher}, ${safeLength} {\n  }\n`;
  const framePattern = new RegExp(`\\n\\s*${safeName}\\s*:\\s*(0x[0-9A-Fa-f]+|\\d+)\\s*,\\s*([A-Za-z_]\\w*)\\s*,\\s*(\\d+)\\s*\\{([\\s\\S]*?)\\}\\n?`, 'm');

  if (framePattern.test(source)) {
    const updated = source.replace(framePattern, frameBlock);
    emit('update:modelValue', updated);
    ElMessage.success(t('tabs.ldfEditor.frameEditor.updated'));
    return;
  }

  const framesPattern = /Frames\s*\{([\s\S]*?)\}/m;
  const framesMatch = source.match(framesPattern);
  if (!framesMatch) {
    const appended = `${source.trimEnd()}\n\nFrames {${frameBlock}}\n`;
    emit('update:modelValue', appended);
  } else {
    const updatedFrames = `${framesMatch[1].trimEnd()}${frameBlock}`;
    const updated = source.replace(framesPattern, `Frames {${updatedFrames}}`);
    emit('update:modelValue', updated);
  }
  ElMessage.success(t('tabs.ldfEditor.frameEditor.inserted'));
};

const applyScheduleEditor = () => {
  if (outlineViewMode.value !== 'schedules') {
    return;
  }
  const source = props.modelValue ?? '';
  const safeName = (scheduleEditor.name || 'New_Schedule').trim() || 'New_Schedule';
  const rawEntry = (scheduleEditor.entry || 'New_Frame delay 10 ms;').trim() || 'New_Frame delay 10 ms;';
  const safeEntry = rawEntry.endsWith(';') ? rawEntry : `${rawEntry};`;
  const scheduleBlock = `\n  ${safeName} {\n    ${safeEntry}\n  }\n`;
  const schedulePattern = new RegExp(`\\n\\s*${safeName}\\s*\\{([\\s\\S]*?)\\}\\n?`, 'm');

  if (schedulePattern.test(source)) {
    const updated = source.replace(schedulePattern, scheduleBlock);
    emit('update:modelValue', updated);
    ElMessage.success(t('tabs.ldfEditor.scheduleEditor.updated'));
    return;
  }

  const scheduleTablesPattern = /Schedule_tables\s*\{([\s\S]*?)\}/m;
  const scheduleTablesMatch = source.match(scheduleTablesPattern);
  if (!scheduleTablesMatch) {
    const appended = `${source.trimEnd()}\n\nSchedule_tables {${scheduleBlock}}\n`;
    emit('update:modelValue', appended);
  } else {
    const updatedTables = `${scheduleTablesMatch[1].trimEnd()}${scheduleBlock}`;
    const updated = source.replace(scheduleTablesPattern, `Schedule_tables {${updatedTables}}`);
    emit('update:modelValue', updated);
  }
  ElMessage.success(t('tabs.ldfEditor.scheduleEditor.inserted'));
};


watch(
  outlineViewMode,
  (mode) => {
    currentOutlineNodeId.value = mode === 'frames' ? 'new-frame-0' : mode === 'schedules' ? 'new-schedule-0' : 'nodes-root';
    if (mode === 'frames') {
      loadFrameEditor('New_Frame');
      syncInspectorSelection({ id: 'new-frame-0', frameName: 'New_Frame' });
    }
    if (mode === 'schedules') {
      loadScheduleEditor('New_Schedule');
      syncInspectorSelection({ id: 'new-schedule-0', scheduleName: 'New_Schedule' });
      return;
    }
    syncInspectorSelection({ id: 'nodes-root' });
  },
  { immediate: true }
);

const resolveNodeIcon = (iconType: string): Component => {
  if (iconType === 'schedule-group') {
    return Calendar;
  }
  if (iconType === 'schedule-folder') {
    return Tickets;
  }
  if (iconType === 'schedule') {
    return AlarmClock;
  }
  if (iconType === 'frame-group') {
    return Calendar;
  }
  if (iconType === 'frame-folder') {
    return Tickets;
  }
  if (iconType === 'diag-frame') {
    return CircleCheck;
  }
  if (iconType === 'frame') {
    return Tickets;
  }
  if (iconType === 'group') {
    return Tickets;
  }
  return iconType === 'master' ? Cpu : Connection;
};

let isResizing = false;

const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing) {
    return;
  }
  const bodyRect = editorBodyRef.value?.getBoundingClientRect();
  if (!bodyRect) {
    return;
  }
  const minWidth = 140;
  const maxWidth = 420;
  const pointerXInBody = event.clientX - bodyRect.left;
  const nextWidth = Math.min(maxWidth, Math.max(minWidth, pointerXInBody));
  leftPaneWidth.value = nextWidth;
};

const stopResize = () => {
  if (!isResizing) {
    return;
  }
  isResizing = false;
  window.removeEventListener('mousemove', handleResizeMove);
  window.removeEventListener('mouseup', stopResize);
};

const startResize = () => {
  isResizing = true;
  window.addEventListener('mousemove', handleResizeMove);
  window.addEventListener('mouseup', stopResize);
};

onUnmounted(() => {
  stopResize();
  closeNodeContextMenu();
  closeSignalContextMenu();
  closeCreatedRangeContextMenu();
});

onMounted(() => {
  document.addEventListener('click', closeNodeContextMenu);
  document.addEventListener('click', closeSignalContextMenu);
  document.addEventListener('click', closeCreatedRangeContextMenu);
  window.addEventListener('mouseup', handleGlobalBitMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('click', closeNodeContextMenu);
  document.removeEventListener('click', closeSignalContextMenu);
  document.removeEventListener('click', closeCreatedRangeContextMenu);
  window.removeEventListener('mouseup', handleGlobalBitMouseUp);
});

const viewMode = ref<'hex' | 'dec'>('hex');

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'hex' ? 'dec' : 'hex';
};

const addSlaveNode = () => {
  const source = props.modelValue ?? '';
  const slaveBaseName = 'NewSlave';

  const nodesBlockPattern = /Nodes\s*\{([\s\S]*?)\}/m;
  const nodesMatch = source.match(nodesBlockPattern);
  if (!nodesMatch) {
    const appended = `${source.trimEnd()}\n\nNodes {\n  Master: Master, 5 ms, 1 ms;\n  Slaves: ${slaveName};\n}\n`;
    emit('update:modelValue', appended);
    return;
  }

  const nodesBlock = nodesMatch[1];
  const slavesPattern = /Slaves\s*:\s*([^;]*);/m;
  const slavesMatch = nodesBlock.match(slavesPattern);
  const nextSlaveNameFromList = (existing: string[]) => {
    let index = 1;
    while (existing.includes(`${slaveBaseName}${index}`)) {
      index += 1;
    }
    return `${slaveBaseName}${index}`;
  };
  if (!slavesMatch) {
    const updatedNodes = `${nodesBlock.trimEnd()}\n  Slaves: ${slaveBaseName}1;\n`;
    const updated = source.replace(nodesBlockPattern, `Nodes {${updatedNodes}}`);
    emit('update:modelValue', updated);
    return;
  }

  const currentSlaves = slavesMatch[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const nextSlaveName = nextSlaveNameFromList(currentSlaves);
  currentSlaves.push(nextSlaveName);
  const replacedSlaves = `Slaves: ${currentSlaves.join(', ')};`;
  const updatedNodes = nodesBlock.replace(slavesPattern, replacedSlaves);
  const updated = source.replace(nodesBlockPattern, `Nodes {${updatedNodes}}`);
  emit('update:modelValue', updated);
};

const addFrame = () => {
  const source = props.modelValue ?? '';
  const frameName = 'New_Frame';
  const frameBlock = `\n  ${frameName}: 0x10, Master, 8 {\n  }\n`;
  const framesPattern = /Frames\s*\{([\s\S]*?)\}/m;
  const framesMatch = source.match(framesPattern);

  if (!framesMatch) {
    const appended = `${source.trimEnd()}\n\nFrames {${frameBlock}}\n`;
    emit('update:modelValue', appended);
    return;
  }

  const updatedFrames = `${framesMatch[1].trimEnd()}${frameBlock}`;
  const updated = source.replace(framesPattern, `Frames {${updatedFrames}}`);
  emit('update:modelValue', updated);
};

const addScheduleTable = () => {
  const source = props.modelValue ?? '';
  const tableName = 'New_Schedule';
  const tableBlock = `\n  ${tableName} {\n    // FrameName delay 10 ms;\n  }\n`;
  const schedulePattern = /Schedule_tables\s*\{([\s\S]*?)\}/m;
  const scheduleMatch = source.match(schedulePattern);

  if (!scheduleMatch) {
    const appended = `${source.trimEnd()}\n\nSchedule_tables {${tableBlock}}\n`;
    emit('update:modelValue', appended);
    return;
  }

  const updatedSchedules = `${scheduleMatch[1].trimEnd()}${tableBlock}`;
  const updated = source.replace(schedulePattern, `Schedule_tables {${updatedSchedules}}`);
  emit('update:modelValue', updated);
};

const runQuickCheck = () => {
  const source = props.modelValue ?? '';
  const requiredBlocks = ['Nodes', 'Frames', 'Schedule_tables'];
  const missing = requiredBlocks.filter((blockName) => !new RegExp(`\\b${blockName}\\s*\\{`, 'm').test(source));

  if (missing.length > 0) {
    ElMessage.warning(`${t('tabs.ldfEditor.checkFailed')}: ${missing.join(', ')}`);
    return;
  }

  ElMessage.success(t('tabs.ldfEditor.checkPassed'));
};
</script>

<style scoped>
.ldf-editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
}

.ldf-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
  background-color: var(--app-bg-elevated);
  border-bottom: 1px solid var(--app-border);
}

.ldf-toolbar-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg-hover);
  color: var(--app-text-regular);
  border-radius: 5px;
  font-size: 9px;
  padding: 0;
  cursor: pointer;
}

.ldf-toolbar-btn:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.ldf-toolbar-btn-node {
  width: 24px;
  height: 24px;
  padding: 0;
}

.ldf-toolbar-btn-node :deep(.el-icon) {
  font-size: 11px;
}

.ldf-toolbar-btn-mode {
  margin-left: auto;
}

.ldf-editor-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ldf-frame-editor-panel {
  border-bottom: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  padding: 8px 10px;
}

.ldf-frame-editor-panel-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ldf-frame-editor-title {
  font-size: 12px;
  color: var(--app-text-primary);
  margin-bottom: 8px;
}

.ldf-frame-editor-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 8px;
}

.ldf-frame-group {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  background-color: var(--app-bg);
}

.ldf-frame-group-mapping {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ldf-frame-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 6px;
}

.ldf-frame-group-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.ldf-mapping-header-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.ldf-view-mode-toggle {
  display: inline-flex;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  overflow: hidden;
}

.ldf-view-mode-btn {
  height: 22px;
  border: none;
  border-right: 1px solid var(--app-border);
  background: var(--app-bg);
  color: var(--app-text-secondary);
  font-size: 11px;
  padding: 0 8px;
  cursor: pointer;
}

.ldf-view-mode-btn:last-child {
  border-right: none;
}

.ldf-view-mode-btn.active {
  background: color-mix(in srgb, var(--app-accent) 18%, var(--app-bg));
  color: var(--app-text-primary);
}

.ldf-frame-relations-grid {
  grid-template-columns: repeat(2, minmax(120px, 1fr));
}

.ldf-frame-editor-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.ldf-frame-editor-field input {
  height: 24px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg);
  color: var(--app-text-primary);
  border-radius: 4px;
  padding: 0 6px;
  outline: none;
}

.ldf-schedule-entry-field {
  grid-column: span 3;
}


.ldf-frame-editor-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.ldf-frame-mapping-table-wrap {
  border: 1px solid var(--app-border);
  border-radius: 4px;
  overflow: auto;
  flex: 1;
  min-height: 180px;
  max-height: none;
}

.ldf-frame-mapping-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ldf-frame-mapping-table th,
.ldf-frame-mapping-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--app-border);
  text-align: left;
  white-space: nowrap;
}

.ldf-frame-mapping-table thead th {
  background-color: var(--app-bg-elevated);
  color: var(--app-text-primary);
  font-weight: 500;
}

.ldf-frame-mapping-table tbody tr.selected {
  background-color: color-mix(in srgb, var(--app-accent) 20%, transparent);
}

.ldf-frame-mapping-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.ldf-frame-mapping-actions .ldf-frame-editor-btn {
  min-width: 96px;
}

.ldf-signal-matrix-wrap {
  flex: 1;
  min-height: 180px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  position: relative;
}

.ldf-signal-matrix-row,
.ldf-signal-matrix-scale-row {
  display: grid;
  grid-template-columns: repeat(64, minmax(12px, 1fr));
  min-width: 768px;
}

.ldf-signal-matrix-byte-index-row {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  min-width: 768px;
  border-bottom: 1px solid var(--app-border);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--app-bg-elevated) 92%, #f8fafc) 0%,
    color-mix(in srgb, var(--app-bg-elevated) 84%, #e5e7eb) 100%
  );
}

.ldf-signal-matrix-byte-index-cell {
  min-height: 24px;
  border-right: 2px solid color-mix(in srgb, var(--app-border) 65%, #000);
  font-size: 11px;
  color: var(--app-text-regular);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ldf-signal-matrix-byte-index-cell:last-child {
  border-right: none;
}

.ldf-signal-matrix-bit-row {
  display: grid;
  grid-template-columns: repeat(64, minmax(12px, 1fr));
  min-width: 768px;
  border-bottom: 1px solid var(--app-border);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--app-bg) 90%, #f3f4f6) 0%,
    color-mix(in srgb, var(--app-bg) 82%, #e5e7eb) 100%
  );
}

.ldf-signal-matrix-row {
  flex: 1;
  border-bottom: 1px solid var(--app-border);
}

.ldf-signal-matrix-scale-cell {
  border-right: 1px solid var(--app-border);
  font-size: 11px;
  color: var(--app-text-regular);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
}

.ldf-signal-matrix-bit-row .ldf-signal-matrix-scale-cell {
  color: color-mix(in srgb, var(--app-text-secondary) 90%, #111827);
}

.ldf-signal-matrix-cell {
  border-right: 1px solid var(--app-border);
  font-size: 11px;
  color: var(--app-text-regular);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
}

.ldf-signal-matrix-scale-row .ldf-signal-matrix-scale-cell:last-child,
.ldf-signal-matrix-row .ldf-signal-matrix-cell:last-child {
  border-right: none;
}

.ldf-signal-matrix-scale-cell.byte-end {
  border-right: 2px solid color-mix(in srgb, var(--app-border) 65%, #000);
}

.ldf-signal-matrix-scale-cell.disabled {
  color: color-mix(in srgb, var(--app-text-secondary) 55%, #888);
  background: color-mix(in srgb, #9ca3af 18%, var(--app-bg));
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell {
  min-height: 120px;
  writing-mode: horizontal-tb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: crosshair;
  user-select: none;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.disabled {
  background: color-mix(in srgb, #9ca3af 28%, var(--app-bg));
  cursor: not-allowed;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #6b7280 28%, var(--app-border));
}

.ldf-signal-matrix-scale-row.bottom {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--app-bg-elevated) 88%, #eef2f7) 0%,
    color-mix(in srgb, var(--app-bg) 82%, #dfe5ee) 100%
  );
}

.ldf-signal-matrix-scale-row.bottom .ldf-signal-matrix-scale-cell {
  color: color-mix(in srgb, var(--app-text-secondary) 88%, #111827);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.byte-end {
  border-right: 2px solid color-mix(in srgb, var(--app-border) 65%, #000);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.active {
  background: color-mix(in srgb, var(--app-accent) 22%, var(--app-bg));
  color: var(--app-text-primary);
  font-weight: 600;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.preview {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #f97316 45%, var(--app-border));
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.committed {
  box-shadow: none;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.selected-created {
  box-shadow:
    inset 0 2px 0 0 color-mix(in srgb, var(--app-accent) 68%, #0f172a),
    inset 0 -2px 0 0 color-mix(in srgb, var(--app-accent) 68%, #0f172a);
  filter: saturate(1.05) brightness(1.03);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.selected-created-start {
  box-shadow:
    inset 2px 0 0 0 color-mix(in srgb, var(--app-accent) 72%, #0f172a),
    inset 0 2px 0 0 color-mix(in srgb, var(--app-accent) 68%, #0f172a),
    inset 0 -2px 0 0 color-mix(in srgb, var(--app-accent) 68%, #0f172a);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.selected-created-end {
  box-shadow:
    inset -2px 0 0 0 color-mix(in srgb, var(--app-accent) 72%, #0f172a),
    inset 0 2px 0 0 color-mix(in srgb, var(--app-accent) 68%, #0f172a),
    inset 0 -2px 0 0 color-mix(in srgb, var(--app-accent) 68%, #0f172a);
}

.ldf-signal-matrix-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg-hover) 55%, var(--app-bg));
}

.ldf-signal-matrix-actions.floating {
  position: absolute;
  z-index: 12;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  background: color-mix(in srgb, var(--app-bg) 90%, #0b1220);
  min-width: 280px;
  max-width: 340px;
}

.ldf-signal-drag-indicator {
  position: absolute;
  z-index: 13;
  pointer-events: none;
  height: 22px;
  line-height: 22px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
  border-radius: 4px;
  background: color-mix(in srgb, var(--app-bg) 88%, #111827);
  color: var(--app-text-primary);
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.24);
}

.ldf-signal-matrix-hint {
  font-size: 11px;
  color: var(--app-text-secondary);
}

.ldf-signal-create-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ldf-signal-create-row.info {
  justify-content: space-between;
  padding-bottom: 2px;
  border-bottom: 1px dashed color-mix(in srgb, var(--app-border) 65%, transparent);
}

.ldf-signal-create-row.actions {
  justify-content: flex-end;
  padding-top: 2px;
}

.ldf-signal-name-input {
  width: 100%;
  height: 28px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-primary);
  font-size: 12px;
  padding: 0 8px;
}

.ldf-signal-name-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--app-accent) 55%, var(--app-border));
}

.ldf-frame-editor-btn {
  height: 24px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
  border-radius: 4px;
  padding: 0 10px;
  cursor: pointer;
}

.ldf-frame-editor-btn.primary {
  border-color: color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
}

.ldf-editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.ldf-outline-pane {
  width: v-bind('`${leftPaneWidth}px`');
  min-width: 140px;
  background-color: var(--app-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ldf-outline-tabs {
  display: flex;
  justify-content: stretch;
  gap: 4px;
  padding: 4px;
  border-bottom: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
}

.ldf-outline-tab {
  flex: 1 1 0;
  min-width: 0;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-secondary);
  font-size: 12px;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ldf-outline-tab:hover {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.ldf-outline-tab.active {
  background-color: color-mix(in srgb, var(--app-accent) 14%, var(--app-bg));
  color: var(--app-text-primary);
  border-color: color-mix(in srgb, var(--app-accent) 48%, var(--app-border));
  font-weight: 600;
}

.ldf-outline-tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 4px;
  background-color: transparent;
  color: var(--app-text-regular);
  font-size: 12px;
}

.ldf-tree-node-content {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ldf-tree-node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ldf-tree-rename-input {
  flex: 1;
  min-width: 0;
  height: 22px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background-color: var(--app-bg-elevated);
  color: var(--app-text-regular);
  font-size: 12px;
  padding: 0 6px;
  outline: none;
}

.ldf-tree-node-icon {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.ldf-outline-resizer {
  width: 6px;
  cursor: col-resize;
  background-color: transparent;
  border-right: 1px solid var(--app-border);
}

.ldf-outline-resizer:hover {
  background-color: var(--app-bg-hover);
}

.ldf-node-context-menu {
  position: fixed;
  z-index: 3200;
  min-width: 120px;
  padding: 4px;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.ldf-node-context-menu-item {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--app-text-regular);
  text-align: left;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.ldf-node-context-menu-item:hover {
  background-color: var(--app-bg-hover);
}

.ldf-node-context-menu-item.danger:hover {
  background-color: rgba(220, 53, 69, 0.15);
  color: #ff7b86;
}
</style>
