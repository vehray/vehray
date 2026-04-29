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
        <section
          v-if="outlineViewMode === 'frames' && activeFrameName"
          class="ldf-frame-editor-panel ldf-frame-editor-panel-fill"
        >
          <div class="ldf-frame-editor-title">{{ t('tabs.ldfEditor.frameEditor.title') }}</div>
          <div class="ldf-frame-group">
            <div class="ldf-frame-group-title">{{ t('tabs.ldfEditor.frameEditor.frameProperties') }}</div>
            <div class="ldf-frame-editor-grid ldf-frame-properties-grid">
              <label class="ldf-frame-editor-field ldf-frame-name-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.name') }}</span>
                <input v-model="frameEditor.name" type="text" />
              </label>
              <label class="ldf-frame-editor-field ldf-frame-length-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.length') }}</span>
                <input v-model.number="frameEditor.length" type="number" min="1" max="8" />
              </label>
              <label class="ldf-frame-editor-field ldf-frame-id-field">
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
                <el-select
                  v-model="frameEditor.publisher"
                  class="ldf-rel-select"
                  popper-class="ldf-rel-select-popper"
                >
                  <el-option
                    v-for="item in frameRelationRoleOptions"
                    :key="`pub-${item.value}`"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </label>
              <label class="ldf-frame-editor-field">
                <span>{{ t('tabs.ldfEditor.frameEditor.subscriber') }}</span>
                <el-select
                  v-model="frameEditor.subscriber"
                  class="ldf-rel-select"
                  popper-class="ldf-rel-select-popper"
                  :disabled="isFrameRelationRoleLocked"
                >
                  <el-option
                    v-for="item in frameRelationRoleOptions"
                    :key="`sub-${item.value}`"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <span v-if="isFrameRelationRoleLocked" class="ldf-frame-relations-warning">
                  {{ relationRoleLockedWarningText }}
                </span>
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
            <div
              v-if="signalMappingViewMode === 'list'"
              ref="signalTableWrapRef"
              class="ldf-frame-mapping-table-wrap"
              :class="{ 'is-inline-editing': signalEditDialog.visible }"
              @contextmenu.prevent="openSignalBlankContextMenu($event)"
            >
              <table class="ldf-frame-mapping-table">
                <thead>
                  <tr>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.signal') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.startBit') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.updateBit') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.length') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.unit') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.encoding') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.publisher') }}</th>
                    <th>{{ t('tabs.ldfEditor.frameEditor.columns.subscribers') }}</th>
                  </tr>
                </thead>
                <tbody v-if="!signalEditDialog.visible">
                  <tr
                    v-for="(row, index) in frameSignalRows"
                    :key="row.id"
                    :class="{ selected: selectedSignalRowIndex === index }"
                    :style="getSignalRowStyle(row, index)"
                    @click="selectSignalRow(index)"
                    @dblclick="handleSignalRowEdit(index)"
                    @contextmenu.prevent.stop="openSignalContextMenu($event, index)"
                  >
                    <td>{{ row.signal }}</td>
                    <td>{{ row.startBit }}</td>
                    <td>{{ row.initValue }}</td>
                    <td>{{ row.length }}</td>
                    <td>{{ row.unit }}</td>
                    <td>{{ row.encoding }}</td>
                    <td>{{ row.publisher }}</td>
                    <td>{{ row.subscribers }}</td>
                  </tr>
                </tbody>
                <tbody
                  v-else-if="signalEditDialog.index >= 0 && frameSignalRows[signalEditDialog.index]"
                >
                  <tr class="selected">
                    <td>{{ frameSignalRows[signalEditDialog.index]!.signal }}</td>
                    <td>{{ frameSignalRows[signalEditDialog.index]!.startBit }}</td>
                    <td>{{ frameSignalRows[signalEditDialog.index]!.initValue }}</td>
                    <td>{{ frameSignalRows[signalEditDialog.index]!.length }}</td>
                    <td>{{ frameSignalRows[signalEditDialog.index]!.unit }}</td>
                    <td>{{ frameSignalRows[signalEditDialog.index]!.encoding }}</td>
                    <td>{{ frameSignalRows[signalEditDialog.index]!.publisher }}</td>
                    <td>{{ frameSignalRows[signalEditDialog.index]!.subscribers }}</td>
                  </tr>
                </tbody>
              </table>
              <div
                v-if="signalEditDialog.visible && signalEditDialog.index >= 0 && frameSignalRows[signalEditDialog.index]"
                ref="signalEditDialogRootRef"
                class="ldf-inline-signal-edit-full"
              >
                <div class="ldf-inline-signal-edit-wrap">
                  <div class="ldf-signal-properties-card">
                    <div class="ldf-signal-properties-card-title">{{ t('tabs.ldfEditor.frameEditor.signalEditor.signalProperties') }}</div>
                    <div class="ldf-signal-edit-grid">
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.name') }}</span>
                        <input v-model.trim="signalEditDialog.signal" type="text" />
                      </label>
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.initialValue') }}</span>
                        <input v-model.number="signalEditDialog.initValue" type="number" min="0" />
                      </label>
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.signalType') }}</span>
                        <select v-model="signalEditDialog.signalType">
                          <option value="Scalar">Scalar</option>
                          <option value="ByteArray">ByteArray</option>
                        </select>
                      </label>
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.length') }}</span>
                        <input v-model.number="signalEditDialog.length" type="number" min="1" max="64" />
                      </label>
                    </div>
                  </div>
                  <div class="ldf-signal-properties-card ldf-encoding-type-card">
                    <div class="ldf-signal-properties-card-title">{{ t('tabs.ldfEditor.frameEditor.signalEditor.encodingType') }}</div>
                    <div class="ldf-ascii-bcd-profile-row">
                      <input
                        v-if="isAsciiBcdProfileEditing"
                        ref="asciiBcdProfileInputRef"
                        v-model.trim="signalEditDialog.asciiBcdProfile"
                        class="ldf-ascii-bcd-profile-input"
                        type="text"
                        :placeholder="t('tabs.ldfEditor.frameEditor.signalEditor.profilePlaceholder')"
                      />
                      <el-select
                        v-else
                        v-model="signalEditDialog.asciiBcdProfile"
                        class="ldf-ascii-bcd-profile-select"
                        popper-class="ldf-ascii-bcd-profile-popper"
                        clearable
                        :placeholder="t('tabs.ldfEditor.frameEditor.signalEditor.noneOption')"
                        @change="handleAsciiBcdProfileChange"
                      >
                        <el-option
                          v-for="item in asciiBcdProfiles"
                          :key="`ascii-bcd-profile-${item}`"
                          :label="item"
                          :value="item"
                        />
                      </el-select>
                      <div class="ldf-ascii-bcd-profile-actions">
                        <el-tooltip :content="t('tabs.ldfEditor.frameEditor.signalEditor.actions.rename')" placement="top" :show-after="250" popper-class="app-unified-tooltip">
                          <button
                            type="button"
                            class="ldf-profile-icon-btn"
                            :class="{ active: isAsciiBcdProfileEditing, ready: hasAnyAsciiBcdProfiles }"
                            @click="toggleAsciiBcdProfileEditing"
                          >
                            <el-icon><Edit /></el-icon>
                          </button>
                        </el-tooltip>
                        <el-tooltip :content="t('tabs.ldfEditor.frameEditor.signalEditor.actions.create')" placement="top" :show-after="250" popper-class="app-unified-tooltip">
                          <button
                            type="button"
                            class="ldf-profile-icon-btn primary ready"
                            @click="createAsciiBcdProfileFromSelection"
                          >
                            <el-icon><Plus /></el-icon>
                          </button>
                        </el-tooltip>
                        <el-tooltip :content="t('tabs.ldfEditor.frameEditor.signalEditor.actions.delete')" placement="top" :show-after="250" popper-class="app-unified-tooltip">
                          <button
                            type="button"
                            class="ldf-profile-icon-btn"
                            :class="{ ready: hasAnyAsciiBcdProfiles }"
                            @click="handleDeleteProfileClick($event)"
                          >
                            <el-icon><Delete /></el-icon>
                          </button>
                        </el-tooltip>
                      </div>
                    </div>
                    <div class="ldf-encoding-type-body" :class="{ disabled: !hasActiveAsciiBcdProfile }">
                      <div class="ldf-encoding-type-tabs">
                        <button
                          type="button"
                          class="ldf-encoding-type-tab"
                          :class="{ active: signalEditDialog.encodingType === 'Physical' }"
                          @click="signalEditDialog.encodingType = 'Physical'"
                        >
                          {{ t('tabs.ldfEditor.frameEditor.signalEditor.encodingTabs.physical') }}
                        </button>
                        <button
                          type="button"
                          class="ldf-encoding-type-tab"
                          :class="{ active: signalEditDialog.encodingType === 'Logical (Text Table)' }"
                          @click="signalEditDialog.encodingType = 'Logical (Text Table)'"
                        >
                          {{ t('tabs.ldfEditor.frameEditor.signalEditor.encodingTabs.logicalTextTable') }}
                        </button>
                        <button
                          type="button"
                          class="ldf-encoding-type-tab"
                          :class="{ active: signalEditDialog.encodingType === 'Multi-Range' }"
                          @click="signalEditDialog.encodingType = 'Multi-Range'"
                        >
                          {{ t('tabs.ldfEditor.frameEditor.signalEditor.encodingTabs.multiRange') }}
                        </button>
                        <button
                          type="button"
                          class="ldf-encoding-type-tab"
                          :class="{ active: signalEditDialog.encodingType === 'ASCII / BCD' }"
                          @click="signalEditDialog.encodingType = 'ASCII / BCD'"
                        >
                          {{ t('tabs.ldfEditor.frameEditor.signalEditor.encodingTabs.asciiBcd') }}
                        </button>
                      </div>
                      <div v-if="signalEditDialog.encodingType === 'Physical'" class="ldf-physical-fields">
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.minimumRaw') }}</span>
                        <input v-model.number="signalEditDialog.physicalMinRaw" type="number" />
                      </label>
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.maximumRaw') }}</span>
                        <input v-model.number="signalEditDialog.physicalMaxRaw" type="number" />
                      </label>
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.unit') }}</span>
                        <input v-model.trim="signalEditDialog.physicalUnit" type="text" />
                      </label>
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.factor') }}</span>
                        <input v-model.number="signalEditDialog.physicalFactor" type="number" />
                      </label>
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.offset') }}</span>
                        <input v-model.number="signalEditDialog.physicalOffset" type="number" />
                      </label>
                      </div>
                      <div
                        v-else-if="signalEditDialog.encodingType === 'Logical (Text Table)'"
                        class="ldf-logical-table-wrap"
                        @contextmenu.prevent.stop="openLogicalBlankContextMenu($event)"
                      >
                      <table class="ldf-logical-table">
                        <thead>
                          <tr>
                            <th class="ldf-logical-col-value">{{ t('tabs.ldfEditor.frameEditor.signalEditor.valueRaw') }}</th>
                            <th class="ldf-logical-col-desc">{{ t('tabs.ldfEditor.frameEditor.signalEditor.description') }}</th>
                          </tr>
                        </thead>
                        <tbody @contextmenu.prevent.stop="openLogicalBlankContextMenu($event)">
                          <tr
                            v-for="(item, index) in signalEditDialog.logicalTextTable"
                            :key="`logical-${index}`"
                            @contextmenu.prevent.stop="openLogicalRowContextMenu($event, index)"
                          >
                            <td>
                              <input v-model.number="item.valueRaw" type="number" />
                            </td>
                            <td>
                              <input
                                v-model.trim="item.description"
                                type="text"
                                :placeholder="t('tabs.ldfEditor.frameEditor.signalEditor.newValueDescriptionPlaceholder')"
                              />
                            </td>
                          </tr>
                          <tr
                            v-if="signalEditDialog.logicalTextTable.length === 0"
                            class="ldf-logical-empty-row"
                            @contextmenu.prevent.stop="openLogicalBlankContextMenu($event)"
                          >
                            <td colspan="2">{{ t('tabs.ldfEditor.frameEditor.signalEditor.rightClickToCreateValueDescription') }}</td>
                          </tr>
                        </tbody>
                      </table>
                      </div>
                      <div
                        v-else-if="signalEditDialog.encodingType === 'Multi-Range'"
                        class="ldf-multirange-table-wrap"
                        @contextmenu.prevent.stop="openMultiRangeBlankContextMenu($event)"
                      >
                      <table class="ldf-multirange-table">
                        <thead>
                          <tr>
                            <th class="ldf-multirange-col-min">{{ t('tabs.ldfEditor.frameEditor.signalEditor.minimumRaw') }}</th>
                            <th class="ldf-multirange-col-max">{{ t('tabs.ldfEditor.frameEditor.signalEditor.maximumRaw') }}</th>
                            <th class="ldf-multirange-col-factor">{{ t('tabs.ldfEditor.frameEditor.signalEditor.factor') }}</th>
                            <th class="ldf-multirange-col-offset">{{ t('tabs.ldfEditor.frameEditor.signalEditor.offset') }}</th>
                            <th class="ldf-multirange-col-unit">{{ t('tabs.ldfEditor.frameEditor.signalEditor.unit') }}</th>
                          </tr>
                        </thead>
                        <tbody @contextmenu.prevent.stop="openMultiRangeBlankContextMenu($event)">
                          <tr
                            v-for="(item, index) in signalEditDialog.multiRangeTable"
                            :key="`multi-range-${index}`"
                            @contextmenu.prevent.stop="openMultiRangeRowContextMenu($event, index)"
                          >
                            <td><input v-model.number="item.minRaw" type="number" /></td>
                            <td><input v-model.number="item.maxRaw" type="number" /></td>
                            <td><input v-model.number="item.factor" type="number" /></td>
                            <td><input v-model.number="item.offset" type="number" /></td>
                            <td><input v-model.trim="item.unit" type="text" /></td>
                          </tr>
                          <tr
                            v-if="signalEditDialog.multiRangeTable.length === 0"
                            class="ldf-multirange-empty-row"
                            @contextmenu.prevent.stop="openMultiRangeBlankContextMenu($event)"
                          >
                            <td colspan="5">{{ t('tabs.ldfEditor.frameEditor.signalEditor.rightClickToCreateMultiRangeParam') }}</td>
                          </tr>
                        </tbody>
                      </table>
                      </div>
                      <div
                        v-else-if="signalEditDialog.encodingType === 'ASCII / BCD'"
                        class="ldf-ascii-bcd-options"
                      >
                      <label class="ldf-ascii-bcd-option">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.ascii') }}:</span>
                        <input
                          :checked="activeAsciiBcdConfig?.asciiEnabled ?? false"
                          :disabled="!hasActiveAsciiBcdProfile"
                          type="checkbox"
                          @change="onAsciiOptionChange"
                        />
                      </label>
                      <label class="ldf-ascii-bcd-option">
                        <span>{{ t('tabs.ldfEditor.frameEditor.signalEditor.bcd') }}:</span>
                        <input
                          :checked="activeAsciiBcdConfig?.bcdEnabled ?? false"
                          :disabled="!hasActiveAsciiBcdProfile"
                          type="checkbox"
                          @change="onBcdOptionChange"
                        />
                      </label>
                      <div v-if="hasActiveAsciiBcdProfile" class="ldf-ascii-bcd-hint">
                        {{ t('tabs.ldfEditor.frameEditor.signalEditor.hints.uncheckToSwitchEncoding') }}
                      </div>
                      <div v-else class="ldf-ascii-bcd-hint">
                        {{ t('tabs.ldfEditor.frameEditor.signalEditor.hints.createOrSelectEncodingFirst') }}
                      </div>
                      </div>
                    </div>
                  </div>
                  <div class="ldf-signal-properties-card ldf-relations-card">
                    <div class="ldf-signal-properties-card-title">{{ t('tabs.ldfEditor.frameEditor.signalEditor.publisherSubscriberRelations') }}</div>
                    <div class="ldf-relations-header">
                      <label class="ldf-frame-editor-field">
                        <span>{{ t('tabs.ldfEditor.frameEditor.publisher') }}</span>
                        <el-select
                          v-model="signalEditDialog.publisher"
                          class="ldf-rel-select"
                          popper-class="ldf-rel-select-popper"
                        >
                          <el-option
                            v-for="item in relationNodePool"
                            :key="`rel-pub-${item}`"
                            :label="item"
                            :value="item"
                          />
                        </el-select>
                      </label>
                    </div>
                    <div class="ldf-relations-transfer">
                      <div class="ldf-relations-list-col">
                        <div class="ldf-relations-list-title">{{ t('tabs.ldfEditor.frameEditor.signalEditor.ecus') }}</div>
                        <div
                          class="ldf-relations-listbox ldf-relations-dropzone"
                          :class="{ 'is-drag-over': relationDragOverTarget === 'available' }"
                          @dragover.prevent="onRelationDragOver('available')"
                          @dragenter.prevent="onRelationDragOver('available')"
                          @dragleave="onRelationDragLeave('available')"
                          @drop.prevent="onRelationDropToAvailable"
                        >
                          <div
                            v-for="item in relationAvailableNodes"
                            :key="`rel-avail-${item}`"
                            class="ldf-relations-item"
                            draggable="true"
                            @dragstart="onRelationDragStart(item, 'available')"
                            @dragend="onRelationDragEnd"
                          >
                            {{ item }}
                          </div>
                          <div v-if="relationAvailableNodes.length === 0" class="ldf-relations-item-empty">
                            {{ t('tabs.ldfEditor.frameEditor.signalEditor.noAvailableNodes') }}
                          </div>
                        </div>
                      </div>
                      <div class="ldf-relations-list-col">
                        <div class="ldf-relations-list-title">{{ t('tabs.ldfEditor.frameEditor.signalEditor.subscribers') }}</div>
                        <div
                          class="ldf-relations-listbox ldf-relations-dropzone"
                          :class="{ 'is-drag-over': relationDragOverTarget === 'subscribers' }"
                          @dragover.prevent="onRelationDragOver('subscribers')"
                          @dragenter.prevent="onRelationDragOver('subscribers')"
                          @dragleave="onRelationDragLeave('subscribers')"
                          @drop.prevent="onRelationDropToSubscribers"
                        >
                          <div
                            v-for="item in relationSubscriberNodes"
                            :key="`rel-sub-${item}`"
                            class="ldf-relations-item"
                            draggable="true"
                            @dragstart="onRelationDragStart(item, 'subscribers')"
                            @dragend="onRelationDragEnd"
                          >
                            {{ item }}
                          </div>
                          <div v-if="relationSubscriberNodes.length === 0" class="ldf-relations-item-empty">
                            {{ t('tabs.ldfEditor.frameEditor.signalEditor.dragHereToSubscribe') }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-if="signalEditDialog.visible && signalEditDialog.index >= 0 && frameSignalRows[signalEditDialog.index]"
                class="ldf-frame-editor-actions ldf-inline-signal-edit-actions"
              >
                <button type="button" class="ldf-frame-editor-btn primary" @click="confirmSignalEdit">{{ t('layout.header.save') }}</button>
                <button type="button" class="ldf-frame-editor-btn" @click="cancelSignalEdit">{{ t('common.cancel') }}</button>
              </div>
            </div>
            <div
              v-else
              ref="signalMatrixWrapRef"
              class="ldf-signal-matrix-wrap"
              :class="{ 'is-repositioning-range': isRepositioningCreated || isResizingCreated }"
            >
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
                  :title="getMatrixBitTooltip(bit) ?? undefined"
                  :class="{
                    active: isBitCovered(bit),
                    preview: isDraftBitCovered(bit),
                    committed: isCreatedBitCovered(bit),
                    'repositioning-arm': isLongPressArmingBit(bit),
                    'repositioning-lift': isBitInRepositioningRange(bit),
                    'ctrl-drag-hover': isCtrlDragHoverBit(bit),
                    'created-drag-mask': isCreatedBitDragMasked(bit),
                    'selected-created': isSelectedCreatedBitCovered(bit),
                    'selected-created-start': isSelectedCreatedRangeStart(bit),
                    'selected-created-end': isSelectedCreatedRangeEnd(bit),
                    'shift-resize-left-hover': isShiftResizeLeftHoverBit(bit),
                    'shift-resize-right-hover': isShiftResizeRightHoverBit(bit),
                    'shift-resize-left-active': isShiftResizeLeftActiveBit(bit),
                    'shift-resize-right-active': isShiftResizeRightActiveBit(bit),
                    'shift-resize-blocked-hover': isShiftResizeBlockedHoverBit(bit),
                    disabled: isBitDisabled(bit),
                    'byte-end': shouldShowByteBoundary(bit)
                  }"
                  :style="getBitCellStyle(bit)"
                  @mousedown.left.prevent="!isBitDisabled(bit) && startBitDrag(bit, $event)"
                  @mouseenter="updateBitDrag(bit, $event)"
                  @mousemove="handleBitCellMouseMove($event, bit)"
                  @mouseup.left.prevent="endBitDrag(bit, $event)"
                  @contextmenu.prevent="openMatrixSignalContextMenu($event, bit)"
                />
                <div class="ldf-signal-matrix-label-layer" aria-hidden="true">
                  <div
                    v-for="range in createdSignalRanges"
                    :key="`label-${range.id}`"
                    class="ldf-signal-matrix-range-label"
                    :class="{
                      selected: selectedCreatedRangeId === range.id,
                      moving:
                        (isRepositioningCreated && repositionRangeId === range.id) ||
                        (isResizingCreated && resizeRangeId === range.id),
                      'multi-bit': range.end > range.start,
                      'single-bit': range.end <= range.start,
                    }"
                    :style="getMatrixRangeLabelStyle(range)"
                  >
                    <div class="ldf-signal-matrix-range-label-slot">
                      <span class="ldf-signal-matrix-range-label-text">{{ getMatrixRangeLabel(range) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-if="dragIndicatorRange"
                class="ldf-signal-drag-indicator"
                :style="{ left: `${dragIndicatorPosition.x}px`, top: `${dragIndicatorPosition.y}px` }"
              >
                <div class="ldf-signal-drag-indicator-inner">
                  <div class="ldf-signal-drag-line">
                    <span class="ldf-signal-drag-label">{{ t('tabs.ldfEditor.frameEditor.matrixDrag.startBit') }}</span>
                    <span class="ldf-signal-drag-num">{{ dragIndicatorRange.start }}</span>
                  </div>
                  <div class="ldf-signal-drag-line">
                    <span class="ldf-signal-drag-label">{{ t('tabs.ldfEditor.frameEditor.matrixDrag.endBit') }}</span>
                    <span class="ldf-signal-drag-num">{{ dragIndicatorRange.end }}</span>
                  </div>
                </div>
              </div>
              <div
                v-if="draftRange && !isDraggingBits"
                ref="draftPopupRef"
                class="ldf-signal-matrix-actions floating"
                :style="{ left: `${draftPopupPosition.x}px`, top: `${draftPopupPosition.y}px` }"
              >
                <div class="ldf-signal-create-title">{{ t('tabs.ldfEditor.frameEditor.signalEditor.createAndMapSignal') }}</div>
                <div class="ldf-signal-create-row info">
                  <span class="ldf-signal-matrix-hint">{{ t('tabs.ldfEditor.frameEditor.signalEditor.startBit') }}：{{ draftRange.start }}</span>
                  <span class="ldf-signal-matrix-hint">{{ t('tabs.ldfEditor.frameEditor.signalEditor.endBit') }}：{{ draftRange.end }}</span>
                </div>
                <div class="ldf-signal-create-row">
                  <input
                    v-model.trim="draftSignalName"
                    class="ldf-signal-name-input"
                    type="text"
                    :placeholder="t('tabs.ldfEditor.frameEditor.signalEditor.enterNamePlaceholder')"
                    @keydown.enter.prevent="commitDraftRangeToFrame"
                    @keydown.esc.prevent="clearDraftRange"
                  />
                </div>
                <div class="ldf-signal-create-row actions">
                  <button type="button" class="ldf-frame-editor-btn primary" @click="commitDraftRangeToFrame">
                    {{ t('common.confirm') }}
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
                  {{ bit }}
                </span>
              </div>
            </div>
          </div>
        </section>
        <section
          v-else-if="outlineViewMode === 'frames'"
          class="ldf-frame-editor-panel ldf-frame-editor-panel-fill ldf-frame-editor-empty"
        ></section>
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
      <button
        v-if="nodeContextMenu.entryType === 'unconditional-frames-folder'"
        class="ldf-node-context-menu-item"
        @click="createFrameFromNodeMenu"
      >
        {{ t('tabs.ldfEditor.newFrame') }}
      </button>
      <button
        v-else
        class="ldf-node-context-menu-item"
        @click="startEditNode"
      >
        {{ t('layout.header.edit') }}
      </button>
      <button
        v-if="nodeContextMenu.entryType !== 'unconditional-frames-folder'"
        class="ldf-node-context-menu-item danger"
        @click="deleteNode"
      >
        {{ t('layout.explorer.delete') }}
      </button>
    </div>
    <div
      v-if="signalContextMenu.visible"
      class="ldf-node-context-menu"
      :style="{ left: `${signalContextMenu.x}px`, top: `${signalContextMenu.y}px` }"
      @click.stop
    >
      <button class="ldf-node-context-menu-item" @click="revealSignalInOppositeView">
        {{ revealSignalContextMenuLabel }}
      </button>
      <button class="ldf-node-context-menu-item" @click="triggerCreateAndMapSignal">
        {{ t('tabs.ldfEditor.frameEditor.actions.createAndMapSignal') }}
      </button>
      <button v-if="signalContextMenu.rowIndex >= 0" class="ldf-node-context-menu-item" @click="triggerMapExistingSignal">
        {{ t('tabs.ldfEditor.frameEditor.actions.mapExistingSignal') }}
      </button>
      <button v-if="signalContextMenu.rowIndex >= 0" class="ldf-node-context-menu-item" @click="triggerEditSignalRow">
        {{ t('tabs.ldfEditor.frameEditor.actions.editSignal') }}
      </button>
      <button v-if="signalContextMenu.rowIndex >= 0" class="ldf-node-context-menu-item danger" @click="triggerRemoveSignalRow">
        {{ t('tabs.ldfEditor.frameEditor.actions.removeSignal') }}
      </button>
    </div>
    <div
      v-if="logicalContextMenu.visible"
      class="ldf-node-context-menu"
      :style="{ left: `${logicalContextMenu.x}px`, top: `${logicalContextMenu.y}px` }"
      @click.stop
    >
      <button class="ldf-node-context-menu-item" @click="addLogicalTextTableRowFromMenu">
        {{ t('tabs.ldfEditor.frameEditor.signalEditor.contextMenu.newValueDescription') }}
      </button>
      <button
        class="ldf-node-context-menu-item danger"
        :disabled="logicalContextMenu.rowIndex < 0"
        @click="removeLogicalTextTableRowFromMenu"
      >
        {{ t('tabs.ldfEditor.frameEditor.signalEditor.contextMenu.deleteValueDescription') }}
      </button>
    </div>
    <div
      v-if="multiRangeContextMenu.visible"
      class="ldf-node-context-menu"
      :style="{ left: `${multiRangeContextMenu.x}px`, top: `${multiRangeContextMenu.y}px` }"
      @click.stop
    >
      <button class="ldf-node-context-menu-item" @click="addMultiRangeParamRowFromMenu">
        {{ t('tabs.ldfEditor.frameEditor.signalEditor.contextMenu.newMultiRangeParam') }}
      </button>
      <button
        class="ldf-node-context-menu-item danger"
        :disabled="multiRangeContextMenu.rowIndex < 0"
        @click="removeMultiRangeParamRowFromMenu"
      >
        {{ t('tabs.ldfEditor.frameEditor.signalEditor.contextMenu.deleteMultiRangeParam') }}
      </button>
    </div>
    <div
      v-if="deleteActionHint.visible"
      class="ldf-cursor-hint"
      :style="{ left: `${deleteActionHint.x}px`, top: `${deleteActionHint.y}px` }"
    >
      {{ deleteActionHint.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, type Component, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { AlarmClock, Calendar, CircleCheck, Connection, Cpu, Delete, Edit, Plus, Tickets } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useUiState } from '../../../state/uiState';
import { deserializeLdf13, serializeLdf13, type Ldf13ValidationIssue, validateLdf13Document } from '../services/ldf13Codec';
import type { Ldf13Document } from '../models/ldf13';

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
const signalTableWrapRef = ref<HTMLDivElement | null>(null);
const draftPopupRef = ref<HTMLDivElement | null>(null);
const signalEditDialogRootRef = ref<HTMLDivElement | null>(null);
const leftPaneWidth = ref(240);
const outlineViewMode = ref<'nodes' | 'frames' | 'schedules'>('nodes');
const currentOutlineNodeId = ref('nodes-root');
const activeFrameName = ref<string | null>(null);
const frameEditor = reactive({
  name: 'New_Frame',
  idHex: '0x10',
  publisher: 'LIN_Commander',
  subscriber: 'LIN_Responder',
  length: 8,
});
const frameSignalRows = ref<Array<{
  id: string;
  description: string;
  signal: string;
  signalType: 'Scalar' | 'ByteArray';
  startBit: number;
  initValue: number;
  length: number;
  unit: string;
  encoding: string;
  publisher: string;
  subscribers: string;
}>>([]);
const selectedSignalRowIndex = ref(-1);
const signalMappingViewMode = ref<'list' | 'matrix'>('list');
const bitHeader = Array.from({ length: 64 }, (_, i) => i);
const isDraggingBits = ref(false);
const dragAnchorBit = ref<number | null>(null);
const dragHoverBit = ref<number | null>(null);
/** 鼠标当前所在 bit 格（用于遮罩：须指针落在已创建区内，而非仅靠选区边界推断） */
const lastPointerBit = ref<number | null>(null);
/** 长按已创建区后平移该区段 */
const isRepositioningCreated = ref(false);
const repositionRangeId = ref('');
const repositionGrabOffset = ref(0);
/** 按住 Shift 在已创建区上拖拽，调整区段起点或终点 */
const isResizingCreated = ref(false);
const resizeRangeId = ref('');
const resizeMovingEdge = ref<'start' | 'end'>('end');
const isCtrlPressed = ref(false);
const isShiftPressed = ref(false);
const shiftResizeHoverBit = ref<number | null>(null);
const shiftResizeHoverEdge = ref<'start' | 'end' | ''>('');
let createdLongPressTimer: ReturnType<typeof setTimeout> | null = null;
let createdLongPressContext: { rangeId: string; grabBit: number } | null = null;
let repositionSnapshot: { rangeId: string; rowId: string; start: number; end: number } | null = null;
let resizeSnapshot: { rangeId: string; rowId: string; start: number; end: number } | null = null;
/** 长按等待进入平移时，高亮当前帧区段 */
const longPressArmRangeId = ref('');

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
  entryType: '' as 'slave-entry' | 'frame-entry' | 'unconditional-frames-folder' | '',
  frameName: '',
});
const signalContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  rowIndex: -1,
});
const logicalContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  rowIndex: -1,
});
const multiRangeContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  rowIndex: -1,
});
const signalEditDialog = reactive({
  visible: false,
  index: -1,
  rowId: '',
  description: '',
  signal: '',
  signalType: 'Scalar' as 'Scalar' | 'ByteArray',
  encodingType: 'Physical' as 'Physical' | 'Logical (Text Table)' | 'Multi-Range' | 'ASCII / BCD',
  physicalMinRaw: 0,
  physicalMaxRaw: 0,
  physicalUnit: '',
  physicalFactor: 1,
  physicalOffset: 0,
  logicalTextTable: [] as Array<{ valueRaw: number; description: string }>,
  multiRangeTable: [] as Array<{ minRaw: number; maxRaw: number; factor: number; offset: number; unit: string }>,
  asciiBcdProfile: '',
  startBit: 0,
  initValue: 0,
  length: 1,
  unit: '',
  encoding: '',
  publisher: '',
  subscribers: '',
});
const ldfDoc = ref<Ldf13Document | null>(null);
const pendingInternalModelUpdates = ref(0);
const lastInternalModelValue = ref('');
const asciiBcdProfileInputRef = ref<HTMLInputElement | null>(null);
const isAsciiBcdProfileEditing = ref(false);
const asciiBcdProfileConfigs = ref<Record<string, { asciiEnabled: boolean; bcdEnabled: boolean }>>({});
const asciiBcdProfiles = computed(() => Object.keys(asciiBcdProfileConfigs.value));
const hasAnyAsciiBcdProfiles = computed(() => asciiBcdProfiles.value.length > 0);
const activeAsciiBcdConfig = computed(() => {
  const key = (signalEditDialog.asciiBcdProfile || '').trim();
  if (!key) return null;
  return asciiBcdProfileConfigs.value[key] ?? null;
});
const hasActiveAsciiBcdProfile = computed(() => activeAsciiBcdConfig.value !== null);
const relationSubscriberNodes = ref<string[]>([]);
const relationDragNode = ref('');
const relationDragFrom = ref<'available' | 'subscribers' | ''>('');
const relationDragOverTarget = ref<'available' | 'subscribers' | ''>('');
const relationNodePool = computed(() => {
  const source = props.modelValue ?? '';
  const masterName = parseMasterNodeMeta(source).name?.trim() || 'LIN_Commander';
  const slaveNodes = parseSlaveNodesMeta(source).map((x) => x.trim()).filter(Boolean);
  const merged = [masterName, ...slaveNodes, 'LIN_Commander', 'LIN_Responder'];
  return Array.from(new Set(merged.filter(Boolean)));
});
const relationAvailableNodes = computed(() => {
  const publisher = (signalEditDialog.publisher || '').trim();
  const subscribers = new Set(relationSubscriberNodes.value);
  return relationNodePool.value.filter((name) => name !== publisher && !subscribers.has(name));
});
const deleteActionHint = reactive({
  visible: false,
  x: 0,
  y: 0,
  text: '',
});
let deleteActionHintTimer: ReturnType<typeof setTimeout> | null = null;

const syncRelationEditorFromDialog = () => {
  const publisher = (signalEditDialog.publisher || '').trim();
  const rawSubscribers = (signalEditDialog.subscribers || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const allowed = new Set(relationNodePool.value);
  relationSubscriberNodes.value = Array.from(
    new Set(rawSubscribers.filter((name) => name !== publisher && allowed.has(name)))
  );
};

const syncDialogSubscribersFromRelationEditor = () => {
  signalEditDialog.subscribers = relationSubscriberNodes.value.join(', ');
};

const onRelationDragStart = (node: string, from: 'available' | 'subscribers') => {
  relationDragNode.value = node;
  relationDragFrom.value = from;
};

const onRelationDragEnd = () => {
  relationDragNode.value = '';
  relationDragFrom.value = '';
  relationDragOverTarget.value = '';
};

const onRelationDragOver = (target: 'available' | 'subscribers') => {
  relationDragOverTarget.value = target;
};

const onRelationDragLeave = (target: 'available' | 'subscribers') => {
  if (relationDragOverTarget.value === target) {
    relationDragOverTarget.value = '';
  }
};

const onRelationDropToSubscribers = () => {
  const node = relationDragNode.value;
  if (!node || relationDragFrom.value !== 'available') {
    onRelationDragEnd();
    return;
  }
  if (!relationSubscriberNodes.value.includes(node) && node !== signalEditDialog.publisher) {
    relationSubscriberNodes.value.push(node);
    syncDialogSubscribersFromRelationEditor();
  }
  onRelationDragEnd();
};

const onRelationDropToAvailable = () => {
  const node = relationDragNode.value;
  if (!node || relationDragFrom.value !== 'subscribers') {
    onRelationDragEnd();
    return;
  }
  relationSubscriberNodes.value = relationSubscriberNodes.value.filter((item) => item !== node);
  syncDialogSubscribersFromRelationEditor();
  onRelationDragEnd();
};

const emitModelValueUpdate = (value: string) => {
  pendingInternalModelUpdates.value += 1;
  lastInternalModelValue.value = value;
  emit('update:modelValue', value);
};

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
    const scheduleChildren = (ldfDoc.value?.scheduleTables ?? []).map((table, index) => ({
      id: `schedule-${index}`,
      label: table.name,
      icon: 'schedule',
      scheduleName: table.name,
    }));
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
            children: scheduleChildren.length > 0
              ? scheduleChildren
              : [
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

  const frameChildren = (ldfDoc.value?.frames ?? []).map((frame, index) => ({
    id: `frame-${index}`,
    label: frame.name,
    icon: frame.id === 0x3c || frame.id === 0x3d ? 'diag-frame' : 'frame',
    entryType: 'frame-entry',
    frameName: frame.name,
  }));
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
          entryType: 'unconditional-frames-folder',
          children: frameChildren,
        },
        {
          id: 'diagnostic-frames',
          label: t('tabs.ldfEditor.tree.diagnosticFrames'),
          icon: 'frame-folder',
          children: [],
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

const frameRelationRoleOptions = computed(() => [
  { value: 'LIN_Commander', label: t('tabs.ldfEditor.frameEditor.relationRoles.commander') },
  { value: 'LIN_Responder', label: t('tabs.ldfEditor.frameEditor.relationRoles.responder') },
]);

/**
 * 发布者/订阅者角色由后续“用户节点定义”类配置驱动；
 * 当前阶段默认锁定，仅展示告警提示。
 */
const isFrameRelationRoleLocked = computed(() => true);

const relationRoleLockedWarningText = computed(() => {
  const key = 'tabs.ldfEditor.frameEditor.relationRoles.lockedWarning';
  const text = t(key);
  return text === key ? t('tabs.ldfEditor.frameEditor.signalEditor.messages.relationRoleLockedWarningFallback') : text;
});

const normalizeFrameRelationRole = (value: string, fallback: 'LIN_Commander' | 'LIN_Responder') => {
  if (value === 'LIN_Commander' || value === 'LIN_Responder') {
    return value;
  }
  return fallback;
};

const toEncodingTypeTab = (value: string): 'Physical' | 'Logical (Text Table)' | 'Multi-Range' | 'ASCII / BCD' => {
  if (value === 'Logical (Text Table)' || value === 'Multi-Range' || value === 'ASCII / BCD') {
    return value;
  }
  if (value.startsWith('ASCII / BCD')) return 'ASCII / BCD';
  return 'Physical';
};

const parseAsciiBcdOptions = (encoding: string): { asciiEnabled: boolean; bcdEnabled: boolean; profile: string } => {
  if (!encoding.startsWith('ASCII / BCD')) {
    return { asciiEnabled: false, bcdEnabled: false, profile: '' };
  }
  const asciiMatch = encoding.match(/ASCII\s*:\s*(1|0|true|false)/i);
  const bcdMatch = encoding.match(/BCD\s*:\s*(1|0|true|false)/i);
  const profileMatch = encoding.match(/PROFILE\s*:\s*([^)]+)/i);
  const toBool = (value?: string) => value === '1' || value?.toLowerCase() === 'true';
  return {
    asciiEnabled: toBool(asciiMatch?.[1]),
    bcdEnabled: toBool(bcdMatch?.[1]),
    profile: (profileMatch?.[1] ?? '').trim(),
  };
};

const normalizeAsciiBcdSelection = (selection: { asciiEnabled: boolean; bcdEnabled: boolean; profile?: string }) => {
  if (selection.asciiEnabled && selection.bcdEnabled) {
    // 单选规则：历史数据若双选，优先 ASCII。
    return { ...selection, asciiEnabled: true, bcdEnabled: false };
  }
  return selection;
};

const onAsciiOptionChange = (event: Event) => {
  const active = activeAsciiBcdConfig.value;
  if (!active) return;
  const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
  active.asciiEnabled = checked;
  if (checked) {
    active.bcdEnabled = false;
  }
};

const onBcdOptionChange = (event: Event) => {
  const active = activeAsciiBcdConfig.value;
  if (!active) return;
  const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
  active.bcdEnabled = checked;
  if (checked) {
    active.asciiEnabled = false;
  }
};

const ensureAsciiBcdProfileExists = (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) return '';
  if (!asciiBcdProfileConfigs.value[value]) {
    asciiBcdProfileConfigs.value[value] = { asciiEnabled: false, bcdEnabled: false };
  }
  return value;
};

const handleAsciiBcdProfileChange = (value: string) => {
  signalEditDialog.asciiBcdProfile = (value || '').trim();
};

const toggleAsciiBcdProfileEditing = () => {
  isAsciiBcdProfileEditing.value = !isAsciiBcdProfileEditing.value;
  if (isAsciiBcdProfileEditing.value) {
    void nextTick(() => {
      const input = asciiBcdProfileInputRef.value;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }
};

const createAsciiBcdProfileFromSelection = () => {
  const current = (signalEditDialog.asciiBcdProfile || '').trim();
  if (!current) {
    const signalBase = (signalEditDialog.signal || '').trim() || 'Signal';
    const seed = `${signalBase}_Encoding`;
    let candidate = `${seed}_1`;
    let suffix = 2;
    while (asciiBcdProfileConfigs.value[candidate]) {
      candidate = `${seed}_${suffix++}`;
    }
    signalEditDialog.asciiBcdProfile = ensureAsciiBcdProfileExists(candidate);
    return;
  }
  if (!asciiBcdProfileConfigs.value[current]) {
    signalEditDialog.asciiBcdProfile = ensureAsciiBcdProfileExists(current);
    return;
  }
  const matched = current.match(/^(.*)_(\d+)$/);
  const base = matched?.[1] ?? current;
  let suffix = matched?.[2] ? Number.parseInt(matched[2], 10) + 1 : 1;
  let candidate = `${base}_${suffix}`;
  while (asciiBcdProfileConfigs.value[candidate]) {
    suffix += 1;
    candidate = `${base}_${suffix}`;
  }
  signalEditDialog.asciiBcdProfile = ensureAsciiBcdProfileExists(candidate);
};

const deleteCurrentAsciiBcdProfile = () => {
  const current = (signalEditDialog.asciiBcdProfile || '').trim();
  if (!current) {
    signalEditDialog.asciiBcdProfile = '';
    return false;
  }
  delete asciiBcdProfileConfigs.value[current];
  signalEditDialog.asciiBcdProfile = asciiBcdProfiles.value[0] ?? '';
  return true;
};

const showDeleteActionHint = (event: MouseEvent, text: string) => {
  if (deleteActionHintTimer) {
    clearTimeout(deleteActionHintTimer);
    deleteActionHintTimer = null;
  }
  deleteActionHint.text = text;
  deleteActionHint.x = event.clientX + 12;
  deleteActionHint.y = event.clientY + 12;
  deleteActionHint.visible = true;
  deleteActionHintTimer = setTimeout(() => {
    deleteActionHint.visible = false;
    deleteActionHintTimer = null;
  }, 1200);
};

const handleDeleteProfileClick = (event: MouseEvent) => {
  const removed = deleteCurrentAsciiBcdProfile();
  showDeleteActionHint(
    event,
    removed
      ? t('tabs.ldfEditor.frameEditor.signalEditor.messages.encodingDeleted')
      : t('tabs.ldfEditor.frameEditor.signalEditor.messages.noEncodingToDelete')
  );
};

const buildEncodingValue = (): string => {
  if (signalEditDialog.encodingType !== 'ASCII / BCD') {
    return signalEditDialog.encodingType;
  }
  const profile = (signalEditDialog.asciiBcdProfile || '').trim();
  if (!profile) {
    return 'ASCII / BCD';
  }
  const config = asciiBcdProfileConfigs.value[profile];
  if (!config) {
    return 'ASCII / BCD';
  }
  const normalized = normalizeAsciiBcdSelection({
    asciiEnabled: config.asciiEnabled,
    bcdEnabled: config.bcdEnabled,
  });
  config.asciiEnabled = normalized.asciiEnabled;
  config.bcdEnabled = normalized.bcdEnabled;
  signalEditDialog.asciiBcdProfile = profile;
  return `ASCII / BCD (PROFILE:${profile}, ASCII:${config.asciiEnabled ? 1 : 0}, BCD:${config.bcdEnabled ? 1 : 0})`;
};

const addLogicalTextTableRow = () => {
  const nextValue = signalEditDialog.logicalTextTable.length + 1;
  signalEditDialog.logicalTextTable.push({
    valueRaw: nextValue,
    description: 'New Value Description',
  });
};

const removeLogicalTextTableRow = (index: number) => {
  signalEditDialog.logicalTextTable.splice(index, 1);
};

const addLogicalTextTableRowFromMenu = () => {
  addLogicalTextTableRow();
  closeLogicalContextMenu();
};

const removeLogicalTextTableRowFromMenu = () => {
  if (logicalContextMenu.rowIndex < 0) return;
  removeLogicalTextTableRow(logicalContextMenu.rowIndex);
  closeLogicalContextMenu();
};

const addMultiRangeParamRow = () => {
  const nextBase = signalEditDialog.multiRangeTable.length;
  signalEditDialog.multiRangeTable.push({
    minRaw: nextBase === 0 ? 0 : nextBase * 10,
    maxRaw: nextBase === 0 ? 100 : nextBase * 10 + 10,
    factor: 1,
    offset: 0,
    unit: signalEditDialog.unit || '',
  });
};

const removeMultiRangeParamRow = (index: number) => {
  signalEditDialog.multiRangeTable.splice(index, 1);
};

const addMultiRangeParamRowFromMenu = () => {
  addMultiRangeParamRow();
  closeMultiRangeContextMenu();
};

const removeMultiRangeParamRowFromMenu = () => {
  if (multiRangeContextMenu.rowIndex < 0) return;
  removeMultiRangeParamRow(multiRangeContextMenu.rowIndex);
  closeMultiRangeContextMenu();
};

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

const loadDocFromText = (source: string, options?: { preserveOnFail?: boolean }) => {
  try {
    ldfDoc.value = deserializeLdf13(source);
    return true;
  } catch {
    if (!options?.preserveOnFail) {
      ldfDoc.value = null;
    }
    return false;
  }
};

const commitDocToText = () => {
  if (!ldfDoc.value) return false;
  const issues: Ldf13ValidationIssue[] = validateLdf13Document(ldfDoc.value);
  const errors = issues.filter((item) => item.level === 'error');
  if (errors.length > 0) {
    ElMessage.warning(errors[0]?.message ?? t('tabs.ldfEditor.frameEditor.signalEditor.messages.ldfValidateFailed'));
    return false;
  }
  emitModelValueUpdate(serializeLdf13(ldfDoc.value));
  return true;
};

const syncFrameSignalRowsFromDoc = (frameName: string) => {
  const doc = ldfDoc.value;
  if (!doc) return;
  const frame = doc.frames.find((item) => item.name === frameName);
  if (!frame) return;
  frameSignalRows.value = frame.signals.map((mapping, index) => {
    const sig = doc.signals.find((s) => s.name === mapping.signal);
    return {
      id: `sig-row-${frame.name}-${mapping.signal}-${index}`,
      description: sig?.description ?? '',
      signal: mapping.signal,
      signalType: sig?.signalType === 'ByteArray' ? 'ByteArray' : 'Scalar',
      startBit: mapping.offset,
      initValue: Math.max(0, Number(sig?.initValue) || 0),
      length: Math.max(1, Number(sig?.size) || 1),
      unit: sig?.unit ?? '',
      encoding: sig?.encoding ?? '',
      publisher: sig?.publisher ?? frame.publisher,
      subscribers: sig?.subscribers?.join(', ') ?? frameEditor.subscriber,
    };
  });
  createdSignalRanges.value = frameSignalRows.value.map((row, idx) => ({
    id: `range-${frame.name}-${row.signal}-${idx}`,
    rowId: row.id,
    start: row.startBit,
    end: row.startBit + row.length - 1,
    label: row.signal,
  }));
  if (frameSignalRows.value.length <= 0) {
    selectedSignalRowIndex.value = -1;
    selectedCreatedRangeId.value = '';
  } else {
    selectedSignalRowIndex.value = Math.min(selectedSignalRowIndex.value, frameSignalRows.value.length - 1);
    if (selectedSignalRowIndex.value < 0) selectedSignalRowIndex.value = 0;
    const current = frameSignalRows.value[selectedSignalRowIndex.value];
    const linked = createdSignalRanges.value.find((x) => x.rowId === current?.id);
    selectedCreatedRangeId.value = linked?.id ?? '';
  }
};

const syncDocSignalsFromRows = () => {
  const doc = ldfDoc.value;
  if (!doc) return;
  const frame = doc.frames.find((item) => item.name === frameEditor.name);
  if (!frame) return;
  frame.publisher = frameEditor.publisher;
  frame.length = Math.max(1, Number(frameEditor.length) || frame.length);
  frame.signals = frameSignalRows.value.map((row) => ({ signal: row.signal, offset: row.startBit }));
  for (const row of frameSignalRows.value) {
    const existing = doc.signals.find((s) => s.name === row.signal);
    const subs = (row.subscribers || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (existing) {
      existing.description = row.description || '';
      existing.signalType = row.signalType === 'ByteArray' ? 'ByteArray' : 'Scalar';
      existing.size = Math.max(1, Number(row.length) || 1);
      existing.initValue = Math.max(0, Number(row.initValue) || 0);
      existing.publisher = row.publisher || frameEditor.publisher;
      existing.subscribers = subs;
      existing.unit = row.unit || '';
      existing.encoding = row.encoding || '';
    } else {
      doc.signals.push({
        name: row.signal,
        description: row.description || '',
        signalType: row.signalType === 'ByteArray' ? 'ByteArray' : 'Scalar',
        size: Math.max(1, Number(row.length) || 1),
        initValue: Math.max(0, Number(row.initValue) || 0),
        publisher: row.publisher || frameEditor.publisher,
        subscribers: subs,
        unit: row.unit || '',
        encoding: row.encoding || '',
      });
    }
  }
};

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
  loadDocFromText(props.modelValue ?? '', { preserveOnFail: true });
  const docFrame = ldfDoc.value?.frames.find((item) => item.name === frameName);
  const parsed = parseFrameByName(props.modelValue ?? '', frameName);
  frameEditor.name = frameName;
  frameEditor.idHex = docFrame ? `0x${docFrame.id.toString(16).toUpperCase()}` : (parsed?.idHex ?? '0x10');
  frameEditor.publisher = normalizeFrameRelationRole(docFrame?.publisher ?? parsed?.publisher ?? 'LIN_Commander', 'LIN_Commander');
  frameEditor.subscriber = 'LIN_Responder';
  frameEditor.length = docFrame?.length ?? (parsed?.length ?? 8);
  if (docFrame) {
    syncFrameSignalRowsFromDoc(frameName);
  }
};

const editSignalRow = () => {
  if (selectedSignalRowIndex.value < 0) return;
  const row = frameSignalRows.value[selectedSignalRowIndex.value];
  if (!row) return;
  signalEditDialog.visible = true;
  isAsciiBcdProfileEditing.value = false;
  signalEditDialog.index = selectedSignalRowIndex.value;
  signalEditDialog.rowId = row.id;
  signalEditDialog.description = row.description ?? '';
  signalEditDialog.signal = row.signal;
  signalEditDialog.signalType = row.signalType === 'ByteArray' ? 'ByteArray' : 'Scalar';
  signalEditDialog.encodingType = toEncodingTypeTab(row.encoding);
  signalEditDialog.physicalMinRaw = 0;
  signalEditDialog.physicalMaxRaw = 0;
  signalEditDialog.physicalUnit = row.unit ?? '';
  signalEditDialog.physicalFactor = 1;
  signalEditDialog.physicalOffset = 0;
  signalEditDialog.logicalTextTable = [];
  signalEditDialog.multiRangeTable = [];
  {
    const parsedAsciiBcd = normalizeAsciiBcdSelection(parseAsciiBcdOptions(row.encoding ?? ''));
    asciiBcdProfileConfigs.value = {};
    if (parsedAsciiBcd.profile) {
      asciiBcdProfileConfigs.value[parsedAsciiBcd.profile] = {
        asciiEnabled: parsedAsciiBcd.asciiEnabled,
        bcdEnabled: parsedAsciiBcd.bcdEnabled,
      };
      signalEditDialog.asciiBcdProfile = parsedAsciiBcd.profile;
    } else {
      signalEditDialog.asciiBcdProfile = '';
    }
  }
  signalEditDialog.startBit = Number(row.startBit) || 0;
  signalEditDialog.initValue = Math.max(0, Number(row.initValue) || 0);
  signalEditDialog.length = Math.max(1, Number(row.length) || 1);
  signalEditDialog.unit = row.unit ?? '';
  signalEditDialog.encoding = row.encoding ?? '';
  signalEditDialog.publisher = row.publisher ?? '';
  signalEditDialog.subscribers = row.subscribers ?? '';
  syncRelationEditorFromDialog();
  closeSignalContextMenu();
};

const syncSignalEditDialogFromIndex = (index: number) => {
  if (index < 0) return;
  isAsciiBcdProfileEditing.value = false;
  const row = frameSignalRows.value[index];
  if (!row) return;
  signalEditDialog.index = index;
  signalEditDialog.rowId = row.id;
  signalEditDialog.description = row.description ?? '';
  signalEditDialog.signal = row.signal;
  signalEditDialog.signalType = row.signalType === 'ByteArray' ? 'ByteArray' : 'Scalar';
  signalEditDialog.encodingType = toEncodingTypeTab(row.encoding);
  signalEditDialog.physicalMinRaw = 0;
  signalEditDialog.physicalMaxRaw = 0;
  signalEditDialog.physicalUnit = row.unit ?? '';
  signalEditDialog.physicalFactor = 1;
  signalEditDialog.physicalOffset = 0;
  signalEditDialog.logicalTextTable = [];
  signalEditDialog.multiRangeTable = [];
  {
    const parsedAsciiBcd = normalizeAsciiBcdSelection(parseAsciiBcdOptions(row.encoding ?? ''));
    asciiBcdProfileConfigs.value = {};
    if (parsedAsciiBcd.profile) {
      asciiBcdProfileConfigs.value[parsedAsciiBcd.profile] = {
        asciiEnabled: parsedAsciiBcd.asciiEnabled,
        bcdEnabled: parsedAsciiBcd.bcdEnabled,
      };
      signalEditDialog.asciiBcdProfile = parsedAsciiBcd.profile;
    } else {
      signalEditDialog.asciiBcdProfile = '';
    }
  }
  signalEditDialog.startBit = Number(row.startBit) || 0;
  signalEditDialog.initValue = Math.max(0, Number(row.initValue) || 0);
  signalEditDialog.length = Math.max(1, Number(row.length) || 1);
  signalEditDialog.unit = row.unit ?? '';
  signalEditDialog.encoding = row.encoding ?? '';
  signalEditDialog.publisher = row.publisher ?? '';
  signalEditDialog.subscribers = row.subscribers ?? '';
  syncRelationEditorFromDialog();
};

const cancelSignalEdit = () => {
  signalEditDialog.visible = false;
  signalEditDialog.index = -1;
  signalEditDialog.rowId = '';
};

const confirmSignalEdit = () => {
  if (signalEditDialog.index < 0) return;
  const row = frameSignalRows.value[signalEditDialog.index];
  if (!row || row.id !== signalEditDialog.rowId) {
    cancelSignalEdit();
    return;
  }
  const maxB = maxEditableBit.value;
  const startBit = Math.max(0, Math.min(maxB, Number(signalEditDialog.startBit) || 0));
  const length = Math.max(1, Number(signalEditDialog.length) || 1);
  const endBit = startBit + length - 1;
  if (endBit > maxB) {
    ElMessage.warning(t('tabs.ldfEditor.frameEditor.signalEditor.messages.signalOutOfFrameLength'));
    return;
  }
  const overlap = frameSignalRows.value.some((other) => {
    if (other.id === row.id) return false;
    const s = Math.max(0, Number(other.startBit) || 0);
    const l = Math.max(1, Number(other.length) || 1);
    const e = s + l - 1;
    return !(endBit < s || startBit > e);
  });
  if (overlap) {
    ElMessage.warning(t('tabs.ldfEditor.frameEditor.signalEditor.messages.signalRangeOverlap'));
    return;
  }
  row.description = signalEditDialog.description || '';
  row.signal = signalEditDialog.signal || row.signal;
  row.signalType = signalEditDialog.signalType === 'ByteArray' ? 'ByteArray' : 'Scalar';
  row.startBit = startBit;
  row.initValue = Math.max(0, Number(signalEditDialog.initValue) || 0);
  row.length = length;
  row.unit = signalEditDialog.encodingType === 'Physical'
    ? (signalEditDialog.physicalUnit || '')
    : signalEditDialog.encodingType === 'Multi-Range'
      ? (signalEditDialog.multiRangeTable[0]?.unit || signalEditDialog.unit || '')
      : (signalEditDialog.unit || '');
  row.encoding = buildEncodingValue();
  syncDialogSubscribersFromRelationEditor();
  row.publisher = signalEditDialog.publisher || frameEditor.publisher;
  row.subscribers = signalEditDialog.subscribers || frameEditor.subscriber;
  const linkedRange = createdSignalRanges.value.find((range) => range.rowId === row.id);
  if (linkedRange) {
    linkedRange.start = startBit;
    linkedRange.end = endBit;
    linkedRange.label = row.signal;
  } else {
    createdSignalRanges.value.push({
      id: `edit-range-${Date.now()}-${row.id}`,
      rowId: row.id,
      start: startBit,
      end: endBit,
      label: row.signal,
    });
  }
  const updatedRange = createdSignalRanges.value.find((range) => range.rowId === row.id);
  selectedCreatedRangeId.value = updatedRange?.id ?? '';
  selectedSignalRowIndex.value = signalEditDialog.index;
  syncDocSignalsFromRows();
  commitDocToText();
  cancelSignalEdit();
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
  syncDocSignalsFromRows();
  commitDocToText();
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

/** 位图点击只更新了 selectedCreatedRangeId 时，用其补全列表行索引，便于空格打开编辑等逻辑 */
const syncSignalRowIndexFromMatrixRangeSelection = () => {
  if (selectedSignalRowIndex.value >= 0) return;
  const rangeId = selectedCreatedRangeId.value;
  if (!rangeId) return;
  const r = createdSignalRanges.value.find((x) => x.id === rangeId);
  if (!r) return;
  const idx = frameSignalRows.value.findIndex((row) => row.id === r.rowId);
  if (idx >= 0) selectSignalRow(idx);
};

const ensureSelectedSignalRowVisible = () => {
  if (signalMappingViewMode.value !== 'list') return;
  const wrap = signalTableWrapRef.value;
  if (!wrap || selectedSignalRowIndex.value < 0) return;
  const rows = wrap.querySelectorAll<HTMLTableRowElement>('tbody tr');
  const selected = rows[selectedSignalRowIndex.value] ?? null;
  selected?.scrollIntoView({ block: 'nearest' });
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
};

const isTargetInsideSignalEditDialog = (target: EventTarget | null): boolean => {
  const root = signalEditDialogRootRef.value;
  if (!root || !(target instanceof Node)) return false;
  return root.contains(target);
};

const moveSignalSelectionBy = (delta: number) => {
  const total = frameSignalRows.value.length;
  if (total <= 0) return;
  const current = selectedSignalRowIndex.value;
  const base = current >= 0 ? current : delta > 0 ? -1 : total;
  const next = Math.min(total - 1, Math.max(0, base + delta));
  if (next === current) return;
  selectSignalRow(next);
  nextTick(() => ensureSelectedSignalRowVisible());
};

const moveMatrixSelectionBy = (delta: number) => {
  const total = frameSignalRows.value.length;
  if (total <= 0) return;
  const ordered = frameSignalRows.value
    .map((row, index) => ({
      index,
      start: Math.max(0, Number(row.startBit) || 0),
      len: Math.max(1, Number(row.length) || 1),
    }))
    .sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      if (a.len !== b.len) return a.len - b.len;
      return a.index - b.index;
    });
  if (ordered.length <= 0) return;
  const currentIndex = selectedSignalRowIndex.value;
  const currentPos = ordered.findIndex((item) => item.index === currentIndex);
  const basePos = currentPos >= 0 ? currentPos : delta > 0 ? -1 : ordered.length;
  const nextPos = Math.min(ordered.length - 1, Math.max(0, basePos + delta));
  const nextRowIndex = ordered[nextPos]?.index;
  if (typeof nextRowIndex === 'number') {
    selectSignalRow(nextRowIndex);
  }
};

const handleSignalRowEdit = (index: number) => {
  selectSignalRow(index);
  editSignalRow();
};

const createAndMapSignal = () => {
  const nextIndex = frameSignalRows.value.length + 1;
  frameSignalRows.value.push({
    id: `sig-${Date.now()}-${nextIndex}`,
    description: '',
    signal: buildDefaultSignalName(nextIndex),
    signalType: 'Scalar',
    startBit: 0,
    initValue: 0,
    length: 8,
    unit: '',
    encoding: '',
    publisher: frameEditor.publisher,
    subscribers: frameEditor.subscriber,
  });
  selectedSignalRowIndex.value = frameSignalRows.value.length - 1;
  syncDocSignalsFromRows();
  commitDocToText();
};

const mapExistingSignal = () => {
  ElMessage.info(t('tabs.ldfEditor.frameEditor.hints.mapExistingSignalTodo'));
};

const buildDefaultSignalName = (index: number) => {
  const frameName = (frameEditor.name || '').trim() || 'Frame';
  return `${frameName}_Signal_${index}`;
};

const openSignalContextMenu = (event: MouseEvent, index: number) => {
  selectSignalRow(index);
  closeNodeContextMenu();
  closeLogicalContextMenu();
  signalContextMenu.x = event.clientX;
  signalContextMenu.y = event.clientY;
  signalContextMenu.rowIndex = index;
  signalContextMenu.visible = true;
};

const closeSignalContextMenu = () => {
  signalContextMenu.visible = false;
  signalContextMenu.rowIndex = -1;
};

const closeLogicalContextMenu = () => {
  logicalContextMenu.visible = false;
  logicalContextMenu.rowIndex = -1;
};

const closeMultiRangeContextMenu = () => {
  multiRangeContextMenu.visible = false;
  multiRangeContextMenu.rowIndex = -1;
};

const openSignalBlankContextMenu = (event: MouseEvent) => {
  // 展开信号编辑区时，禁用“新建信号”空白区右键菜单，
  // 避免与 Logical(Text Table) 的 Value Description 右键交互冲突。
  if (signalEditDialog.visible) return;
  if (!(event.target instanceof HTMLElement)) return;
  const inBodyRow = Boolean(event.target.closest('tbody tr'));
  if (inBodyRow) return;
  closeNodeContextMenu();
  closeLogicalContextMenu();
  closeMultiRangeContextMenu();
  signalContextMenu.x = event.clientX;
  signalContextMenu.y = event.clientY;
  signalContextMenu.rowIndex = -1;
  signalContextMenu.visible = true;
};

const openLogicalBlankContextMenu = (event: MouseEvent) => {
  if (!(event.target instanceof HTMLElement)) return;
  const inDataRow = Boolean(event.target.closest('tbody tr:not(.ldf-logical-empty-row)'));
  if (inDataRow) return;
  closeNodeContextMenu();
  closeSignalContextMenu();
  closeMultiRangeContextMenu();
  logicalContextMenu.x = event.clientX;
  logicalContextMenu.y = event.clientY;
  logicalContextMenu.rowIndex = -1;
  logicalContextMenu.visible = true;
};

const openLogicalRowContextMenu = (event: MouseEvent, rowIndex: number) => {
  closeNodeContextMenu();
  closeSignalContextMenu();
  closeMultiRangeContextMenu();
  logicalContextMenu.x = event.clientX;
  logicalContextMenu.y = event.clientY;
  logicalContextMenu.rowIndex = rowIndex;
  logicalContextMenu.visible = true;
};

const openMultiRangeBlankContextMenu = (event: MouseEvent) => {
  if (!(event.target instanceof HTMLElement)) return;
  const inDataRow = Boolean(event.target.closest('tbody tr:not(.ldf-multirange-empty-row)'));
  if (inDataRow) return;
  closeNodeContextMenu();
  closeSignalContextMenu();
  closeLogicalContextMenu();
  multiRangeContextMenu.x = event.clientX;
  multiRangeContextMenu.y = event.clientY;
  multiRangeContextMenu.rowIndex = -1;
  multiRangeContextMenu.visible = true;
};

const openMultiRangeRowContextMenu = (event: MouseEvent, rowIndex: number) => {
  closeNodeContextMenu();
  closeSignalContextMenu();
  closeLogicalContextMenu();
  multiRangeContextMenu.x = event.clientX;
  multiRangeContextMenu.y = event.clientY;
  multiRangeContextMenu.rowIndex = rowIndex;
  multiRangeContextMenu.visible = true;
};

const resolveSignalRowIndexAtBit = (bit: number): number => {
  if (isBitDisabled(bit)) return -1;
  const created = getCreatedRangeAtBit(bit);
  if (created) {
    const idx = frameSignalRows.value.findIndex((row) => row.id === created.rowId);
    if (idx >= 0) return idx;
  }
  for (let i = 0; i < frameSignalRows.value.length; i++) {
    const row = frameSignalRows.value[i]!;
    const start = Math.max(0, Number(row.startBit) || 0);
    const len = Math.max(1, Number(row.length) || 1);
    const end = start + len - 1;
    if (bit >= start && bit <= end) {
      return i;
    }
  }
  return -1;
};

const openMatrixSignalContextMenu = (event: MouseEvent, bit: number) => {
  clearCreatedLongPressTimer();
  if (isResizingCreated.value) {
    cancelResizeFromSnapshot();
    closeSignalContextMenu();
    return;
  }
  if (isRepositioningCreated.value) {
    cancelRepositionFromSnapshot();
    closeSignalContextMenu();
    return;
  }
  if (draftRange.value && !isDraggingBits.value) {
    clearDraftRange();
    closeSignalContextMenu();
    return;
  }
  const rowIndex = resolveSignalRowIndexAtBit(bit);
  if (rowIndex < 0) return;
  openSignalContextMenu(event, rowIndex);
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

const revealSignalContextMenuLabel = computed(() =>
  signalMappingViewMode.value === 'matrix'
    ? t('tabs.ldfEditor.frameEditor.contextMenu.revealInList')
    : t('tabs.ldfEditor.frameEditor.contextMenu.revealInBitmap')
);

const revealSignalInOppositeView = () => {
  if (signalContextMenu.rowIndex >= 0) {
    selectSignalRow(signalContextMenu.rowIndex);
  }
  signalMappingViewMode.value = signalMappingViewMode.value === 'matrix' ? 'list' : 'matrix';
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

const dragIndicatorRange = computed(() => {
  if (isDraggingBits.value && draftRange.value) {
    return { start: draftRange.value.start, end: draftRange.value.end };
  }
  if (isResizingCreated.value && resizeRangeId.value) {
    const r = createdSignalRanges.value.find((x) => x.id === resizeRangeId.value);
    if (r) return { start: r.start, end: r.end };
  }
  if (isRepositioningCreated.value && repositionRangeId.value) {
    const r = createdSignalRanges.value.find((x) => x.id === repositionRangeId.value);
    if (r) return { start: r.start, end: r.end };
  }
  return null;
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

const getCtrlRepositionTarget = (bit: number) => {
  const direct = getCreatedRangeAtBit(bit);
  if (direct) return { range: direct, grabBit: bit };
  // 短区段更易命中：允许在区段左右各 1 bit 热区触发 Ctrl 平移。
  for (const range of createdSignalRanges.value) {
    if (bit === range.start - 1) return { range, grabBit: range.start };
    if (bit === range.end + 1) return { range, grabBit: range.end };
  }
  return null;
};

type MatrixRange = { id: string; rowId: string; start: number; end: number; label: string };
type ShiftResizeTarget = { range: MatrixRange; edge: 'start' | 'end'; grabBit: number };

const clearShiftResizeHover = () => {
  shiftResizeHoverBit.value = null;
  shiftResizeHoverEdge.value = '';
};

const getShiftResizeTarget = (bit: number, event?: MouseEvent): ShiftResizeTarget | null => {
  if (isBitDisabled(bit)) return null;
  const selectedId = selectedCreatedRangeId.value;
  if (!selectedId) return null;
  const selectedRange = createdSignalRanges.value.find((r) => r.id === selectedId);
  if (!selectedRange) return null;
  const cellEl = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (!cellEl || !event) return null;
  const rect = cellEl.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const xInCell = event.clientX - rect.left;
  const edgeHitPx = Math.max(3, Math.min(8, rect.width * 0.28));

  // 仅当前选中信号“边界线附近”触发，不再扩展到相邻整格。
  if (bit === selectedRange.start && xInCell <= edgeHitPx) {
    return { range: selectedRange, edge: 'start', grabBit: selectedRange.start };
  }
  if (bit === selectedRange.end && xInCell >= rect.width - edgeHitPx) {
    return { range: selectedRange, edge: 'end', grabBit: selectedRange.end };
  }
  return null;
};

const updateShiftResizeHover = (bit: number, event?: MouseEvent) => {
  if (!isShiftPressed.value || isDraggingBits.value || isRepositioningCreated.value || isResizingCreated.value) {
    clearShiftResizeHover();
    return;
  }
  const target = getShiftResizeTarget(bit, event);
  if (!target) {
    clearShiftResizeHover();
    return;
  }
  shiftResizeHoverBit.value = bit;
  shiftResizeHoverEdge.value = target.edge;
};

const isShiftResizeLeftHoverBit = (bit: number) => {
  return shiftResizeHoverBit.value === bit && shiftResizeHoverEdge.value === 'start';
};

const isShiftResizeRightHoverBit = (bit: number) => {
  return shiftResizeHoverBit.value === bit && shiftResizeHoverEdge.value === 'end';
};

const isShiftResizeLeftActiveBit = (bit: number) => {
  if (!isResizingCreated.value || resizeMovingEdge.value !== 'start' || !resizeRangeId.value) return false;
  const r = createdSignalRanges.value.find((x) => x.id === resizeRangeId.value);
  return Boolean(r && bit === r.start);
};

const isShiftResizeRightActiveBit = (bit: number) => {
  if (!isResizingCreated.value || resizeMovingEdge.value !== 'end' || !resizeRangeId.value) return false;
  const r = createdSignalRanges.value.find((x) => x.id === resizeRangeId.value);
  return Boolean(r && bit === r.end);
};

const isShiftResizeBlockedHoverBit = (bit: number) => {
  const isHoverBit = shiftResizeHoverBit.value === bit;
  const isActiveBit = isShiftResizeLeftActiveBit(bit) || isShiftResizeRightActiveBit(bit);
  if (!isHoverBit && !isActiveBit) return false;
  const selectedId = selectedCreatedRangeId.value;
  if (!selectedId) return false;
  const r = createdSignalRanges.value.find((x) => x.id === selectedId);
  if (!r) return false;
  const edge: 'start' | 'end' | '' = isHoverBit ? shiftResizeHoverEdge.value : resizeMovingEdge.value;
  if (edge === 'start') {
    if (r.start <= 0) return true;
    return !rangeClearExcept(r.start - 1, r.end, r.id);
  }
  if (edge === 'end') {
    if (r.end >= maxEditableBit.value) return true;
    return !rangeClearExcept(r.start, r.end + 1, r.id);
  }
  return false;
};

const isCtrlDragHoverBit = (bit: number) =>
  isCtrlPressed.value &&
  !isShiftPressed.value &&
  !isBitDisabled(bit) &&
  !isDraggingBits.value &&
  !isRepositioningCreated.value &&
  !isResizingCreated.value &&
  Boolean(getCtrlRepositionTarget(bit));

const isLongPressArmingBit = (bit: number) => {
  if (!longPressArmRangeId.value || isRepositioningCreated.value || isResizingCreated.value) return false;
  if (isBitDisabled(bit)) return false;
  const r = createdSignalRanges.value.find((x) => x.id === longPressArmRangeId.value);
  if (!r) return false;
  return bit >= r.start && bit <= r.end;
};

const isBitInRepositioningRange = (bit: number) => {
  if (isBitDisabled(bit)) return false;
  if (isRepositioningCreated.value && repositionRangeId.value) {
    const r = createdSignalRanges.value.find((x) => x.id === repositionRangeId.value);
    if (r && bit >= r.start && bit <= r.end) return true;
  }
  if (isResizingCreated.value && resizeRangeId.value) {
    const r2 = createdSignalRanges.value.find((x) => x.id === resizeRangeId.value);
    if (r2 && bit >= r2.start && bit <= r2.end) return true;
  }
  return false;
};

const canDraftExtendToBit = (targetBit: number) => {
  if (dragAnchorBit.value === null) return false;
  const start = Math.min(dragAnchorBit.value, targetBit);
  const end = Math.max(dragAnchorBit.value, targetBit);
  return !createdSignalRanges.value.some((range) => !(end < range.start || start > range.end));
};

/** 从锚点朝向 targetBit：最后一个仍不与已创建区重叠的 bit（光标划过已创建格时可继续向远端选） */
const clampDraftHoverBit = (targetBit: number): number | null => {
  if (dragAnchorBit.value === null) return null;
  const anchor = dragAnchorBit.value;
  if (isBitDisabled(targetBit)) return null;
  if (targetBit === anchor) return anchor;
  const step = targetBit > anchor ? 1 : -1;
  let last = anchor;
  for (let b = anchor + step; ; b += step) {
    if (step > 0 && b > targetBit) break;
    if (step < 0 && b < targetBit) break;
    if (!canDraftExtendToBit(b)) break;
    last = b;
  }
  return last;
};

const draftTouchesCreatedRange = (s: number, e: number, r: { start: number; end: number }) =>
  !(e < r.start - 1 || s > r.end + 1);

/**
 * 遮罩须同时满足：指针落在某已创建区 R 内、选区与 R 在 bit 轴上足够近、
 * 多格区段时指针至少进入 R 的第二列（避免仅在 R 首格外沿就整块提示）。
 */
const createdDragMaskRangeId = computed(() => {
  if (!isDraggingBits.value) return '';
  if (dragAnchorBit.value === null || dragHoverBit.value === null) return '';
  if (dragHoverBit.value === dragAnchorBit.value) return '';
  if (!draftRange.value) return '';
  const pb = lastPointerBit.value;
  if (pb === null || isBitDisabled(pb)) return '';
  const r = getCreatedRangeAtBit(pb);
  if (!r) return '';
  const s = draftRange.value.start;
  const e = draftRange.value.end;
  if (!draftTouchesCreatedRange(s, e, r)) return '';
  if (r.end > r.start && pb < r.start + 1) return '';
  return r.id;
});

const isCreatedBitDragMasked = (bit: number) => {
  const id = createdDragMaskRangeId.value;
  if (!id || !isCreatedBitCovered(bit)) return false;
  return createdSignalRanges.value.some((range) => range.id === id && bit >= range.start && bit <= range.end);
};

/** >1 时在色相环上多走几圈，帧短、相邻区段多时色差更明显 */
const HUE_POSITION_STRETCH = 2.9;

/** 区段在 bit 轴上的位置 → 色相（起点略加权，相邻短区段更易区分） */
const getRangeHue = (range: { start: number; end: number }) => {
  const maxB = Math.max(1, maxEditableBit.value);
  const center = (range.start + range.end) / 2;
  const tStart = range.start / maxB;
  const tCenter = center / maxB;
  const t = Math.min(1, Math.max(0, 0.42 * tStart + 0.58 * tCenter));
  return (t * 360 * HUE_POSITION_STRETCH) % 360;
};

/** 列表视图行右侧色条宽度（与矩阵区段色相一致，不占满整行） */
const SIGNAL_LIST_ROW_HUE_STRIP_PX = 48;

const getSignalRowStyle = (row: { startBit: number; length: number }, index: number): Record<string, string> => {
  const start = Math.max(0, Number(row.startBit) || 0);
  const len = Math.max(1, Number(row.length) || 1);
  const end = Math.min(maxEditableBit.value, start + len - 1);
  const hue = getRangeHue({ start, end });
  const hi = (hue + 34) % 360;
  const strip = `calc(100% - ${SIGNAL_LIST_ROW_HUE_STRIP_PX}px)`;
  const base = `linear-gradient(to right, transparent 0, transparent ${strip}, hsla(${hue}, 82%, 91%, 0.88) ${strip}, hsla(${hi}, 72%, 86%, 0.92) 100%)`;
  if (selectedSignalRowIndex.value === index) {
    return {
      background: `linear-gradient(to right, transparent 0, transparent ${strip}, color-mix(in srgb, var(--app-accent) 22%, hsla(${hue}, 82%, 93%, 1)) ${strip}, color-mix(in srgb, var(--app-accent) 16%, hsla(${hi}, 72%, 88%, 1)) 100%)`,
    };
  }
  return { background: base };
};

const signalNameByRowId = computed(() => {
  const map = new Map<string, string>();
  for (const row of frameSignalRows.value) {
    map.set(row.id, row.signal);
  }
  return map;
});

const getMatrixRangeLabel = (range: { rowId: string; label: string }) =>
  signalNameByRowId.value.get(range.rowId) ?? range.label;

const getMatrixRangeBitCount = (range: { start: number; end: number }): number => {
  const start = Math.max(0, Math.min(63, Number(range.start) || 0));
  const endRaw = Number(range.end);
  const end = Math.max(
    start,
    Math.min(63, Number.isFinite(endRaw) ? endRaw : start),
  );
  return end - start + 1;
};

const getMatrixBitTooltip = (bit: number): string | null => {
  if (isBitDisabled(bit)) return null;
  const r = getCreatedRangeAtBit(bit);
  if (!r) return null;
  return signalNameByRowId.value.get(r.rowId) ?? r.label ?? null;
};

const getMatrixRangeLabelStyle = (
  range: { start: number; end: number; rowId: string; label: string },
): Record<string, string> => {
  const start = Math.max(0, Math.min(63, Number(range.start) || 0));
  const bitCount = getMatrixRangeBitCount(range);
  return {
    left: `calc(${start} * (100% / 64))`,
    width: `calc(${bitCount} * (100% / 64))`,
    '--ldf-matrix-range-bit-count': String(bitCount),
  };
};

const getBitCellStyle = (bit: number) => {
  const style: Record<string, string> = {};
  if (isDraftBitCovered(bit)) {
    const dr = draftRange.value;
    if (!dr) return undefined;
    const hue = getRangeHue({ start: dr.start, end: dr.end });
    const hi = (hue + 34) % 360;
    if (isDraggingBits.value) {
      style.background = `linear-gradient(180deg, hsla(${hue}, 84%, 76%, 0.96) 0%, hsla(${hi}, 76%, 70%, 0.96) 100%)`;
    } else {
      style.background = `linear-gradient(180deg, hsla(${hue}, 84%, 78%, 0.52) 0%, hsla(${hi}, 76%, 72%, 0.6) 100%)`;
    }
    // 草稿拖动区段内部隐藏 bit/byte 分割线，仅保留区段末端边界。
    if (bit < dr.end) {
      style.borderRight = 'none';
    }
    return style;
  }
  const range = getCreatedRangeAtBit(bit);
  if (!range) return undefined;
  const hue = getRangeHue(range);
  const hi = (hue + 34) % 360;
  if (
    (isRepositioningCreated.value && repositionRangeId.value === range.id) ||
    (isResizingCreated.value && resizeRangeId.value === range.id)
  ) {
    style.background = `linear-gradient(180deg, hsla(${hue}, 82%, 78%, 0.96) 0%, hsla(${hi}, 74%, 70%, 0.96) 100%)`;
  } else {
    style.background = `linear-gradient(180deg, hsla(${hue}, 82%, 80%, 0.54) 0%, hsla(${hi}, 74%, 72%, 0.64) 100%)`;
  }
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
  const popupRect = draftPopupRef.value?.getBoundingClientRect();
  const popupWidth = popupRect?.width ?? 320;
  const popupHeight = popupRect?.height ?? 110;
  const gap = 10;

  let nextX = event.clientX - hostRect.left + 12;
  let nextY = event.clientY - hostRect.top + 12;

  // 右侧空间不足时，向左侧翻转，避免超出容器。
  if (nextX + popupWidth + gap > hostRect.width) {
    nextX = event.clientX - hostRect.left - popupWidth - gap;
  }
  // 下方空间不足时，改为显示在鼠标上方（左下角相对鼠标位置翻转）。
  if (nextY + popupHeight + gap > hostRect.height) {
    nextY = event.clientY - hostRect.top - popupHeight - gap;
  }

  const minX = 8;
  const minY = 8;
  const maxX = Math.max(minX, hostRect.width - popupWidth - minX);
  const maxY = Math.max(minY, hostRect.height - popupHeight - minY);
  draftPopupPosition.x = Math.min(maxX, Math.max(minX, nextX));
  draftPopupPosition.y = Math.min(maxY, Math.max(minY, nextY));
};

const updateDragIndicatorPosition = (event?: MouseEvent) => {
  if (!event) return;
  const hostRect = signalMatrixWrapRef.value?.getBoundingClientRect();
  if (!hostRect) return;
  const rawX = event.clientX - hostRect.left + 12;
  const rawY = event.clientY - hostRect.top - 30;
  const maxX = Math.max(8, hostRect.width - 200);
  const maxY = Math.max(8, hostRect.height - 50);
  dragIndicatorPosition.x = Math.min(maxX, Math.max(8, rawX));
  dragIndicatorPosition.y = Math.min(maxY, Math.max(8, rawY));
};

const clearCreatedLongPressTimer = () => {
  if (createdLongPressTimer !== null) {
    clearTimeout(createdLongPressTimer);
    createdLongPressTimer = null;
  }
  createdLongPressContext = null;
  longPressArmRangeId.value = '';
};

const rangeClearExcept = (start: number, end: number, excludeRangeId: string) =>
  !createdSignalRanges.value.some(
    (other) => other.id !== excludeRangeId && !(end < other.start || start > other.end)
  );

const scheduleCreatedLongPress = (grabBit: number, rangeId: string) => {
  clearCreatedLongPressTimer();
  createdLongPressContext = { rangeId, grabBit };
  longPressArmRangeId.value = rangeId;
  createdLongPressTimer = window.setTimeout(() => {
    createdLongPressTimer = null;
    const ctx = createdLongPressContext;
    createdLongPressContext = null;
    if (ctx) {
      beginRepositionCreatedRange(ctx.rangeId, ctx.grabBit);
    }
  }, 280);
};

const cancelRepositionFromSnapshot = () => {
  if (repositionSnapshot && isRepositioningCreated.value) {
    const snap = repositionSnapshot;
    const r = createdSignalRanges.value.find((x) => x.id === snap.rangeId);
    if (r) {
      r.start = snap.start;
      r.end = snap.end;
    }
    const row = frameSignalRows.value.find((x) => x.id === snap.rowId);
    if (row) {
      row.startBit = snap.start;
      row.length = snap.end - snap.start + 1;
    }
  }
  repositionSnapshot = null;
  isRepositioningCreated.value = false;
  repositionRangeId.value = '';
  repositionGrabOffset.value = 0;
  clearCreatedLongPressTimer();
};

const finishRepositionCreatedRange = () => {
  repositionSnapshot = null;
  isRepositioningCreated.value = false;
  repositionRangeId.value = '';
  repositionGrabOffset.value = 0;
  longPressArmRangeId.value = '';
};

const updateRepositionPreview = (hoverBit: number) => {
  const moveRange = createdSignalRanges.value.find((x) => x.id === repositionRangeId.value);
  if (!moveRange || !isRepositioningCreated.value) return;
  const len = moveRange.end - moveRange.start + 1;
  const maxB = maxEditableBit.value;
  let newStart = hoverBit - repositionGrabOffset.value;
  let newEnd = newStart + len - 1;
  if (newEnd > maxB) {
    newStart = maxB - len + 1;
    newEnd = maxB;
  }
  if (newStart < 0) {
    newStart = 0;
    newEnd = len - 1;
  }
  if (!rangeClearExcept(newStart, newEnd, moveRange.id)) {
    let bestStart = newStart;
    let bestDist = Number.POSITIVE_INFINITY;
    let found = false;
    for (let s = 0; s <= maxB - len + 1; s++) {
      const e = s + len - 1;
      if (!rangeClearExcept(s, e, moveRange.id)) continue;
      found = true;
      const d = Math.abs(s - (hoverBit - repositionGrabOffset.value));
      if (d < bestDist) {
        bestDist = d;
        bestStart = s;
      }
    }
    if (!found) {
      return;
    }
    newStart = bestStart;
    newEnd = newStart + len - 1;
  }
  moveRange.start = newStart;
  moveRange.end = newEnd;
  const row = frameSignalRows.value.find((x) => x.id === moveRange.rowId);
  if (row) {
    row.startBit = newStart;
    row.length = len;
  }
};

const beginRepositionCreatedRange = (rangeId: string, grabBit: number) => {
  const r = createdSignalRanges.value.find((x) => x.id === rangeId);
  if (!r || grabBit < r.start || grabBit > r.end) return;
  longPressArmRangeId.value = '';
  clearDraftRange();
  closeSignalContextMenu();
  repositionSnapshot = { rangeId: r.id, rowId: r.rowId, start: r.start, end: r.end };
  repositionGrabOffset.value = grabBit - r.start;
  repositionRangeId.value = rangeId;
  isRepositioningCreated.value = true;
  selectedCreatedRangeId.value = rangeId;
  updateRepositionPreview(grabBit);
};

const pickResizeMovingEdge = (bit: number, range: { start: number; end: number }): 'start' | 'end' => {
  const distStart = bit - range.start;
  const distEnd = range.end - bit;
  if (distStart < distEnd) return 'start';
  if (distEnd < distStart) return 'end';
  return 'end';
};

const beginResizeCreatedRange = (rangeId: string, bit: number, forcedEdge?: 'start' | 'end') => {
  const r = createdSignalRanges.value.find((x) => x.id === rangeId);
  if (!r) return;
  const hotLeft = bit === r.start || bit === r.start - 1;
  const hotRight = bit === r.end || bit === r.end + 1;
  if (!hotLeft && !hotRight && !forcedEdge) return;
  longPressArmRangeId.value = '';
  clearCreatedLongPressTimer();
  clearDraftRange();
  closeSignalContextMenu();
  resizeSnapshot = { rangeId: r.id, rowId: r.rowId, start: r.start, end: r.end };
  if (forcedEdge) {
    resizeMovingEdge.value = forcedEdge;
  } else if (hotLeft && !hotRight) {
    resizeMovingEdge.value = 'start';
  } else if (hotRight && !hotLeft) {
    resizeMovingEdge.value = 'end';
  } else {
    resizeMovingEdge.value = pickResizeMovingEdge(bit, r);
  }
  resizeRangeId.value = rangeId;
  isResizingCreated.value = true;
  selectedCreatedRangeId.value = rangeId;
  updateResizePreview(resizeMovingEdge.value === 'start' ? r.start : r.end);
};

const updateResizePreview = (hoverBit: number) => {
  const snap = resizeSnapshot;
  const r = createdSignalRanges.value.find((x) => x.id === resizeRangeId.value);
  if (!snap || !isResizingCreated.value || !r || r.id !== snap.rangeId) return;
  if (isBitDisabled(hoverBit)) return;
  const maxB = maxEditableBit.value;
  const hb = Math.max(0, Math.min(maxB, hoverBit));

  const syncRow = () => {
    const row = frameSignalRows.value.find((x) => x.id === r.rowId);
    if (row) {
      row.startBit = r.start;
      row.length = r.end - r.start + 1;
    }
  };

  if (resizeMovingEdge.value === 'end') {
    const newStart = snap.start;
    let newEnd = Math.max(newStart, hb);
    newEnd = Math.min(newEnd, maxB);
    let chosen = newStart;
    for (let e = newEnd; e >= newStart; e--) {
      if (rangeClearExcept(newStart, e, r.id)) {
        chosen = e;
        break;
      }
    }
    r.start = newStart;
    r.end = chosen;
  } else {
    const newEnd = snap.end;
    let newStart = Math.min(newEnd, hb);
    newStart = Math.max(0, newStart);
    let chosen = newEnd;
    for (let s = newStart; s <= newEnd; s++) {
      if (rangeClearExcept(s, newEnd, r.id)) {
        chosen = s;
        break;
      }
    }
    r.start = chosen;
    r.end = newEnd;
  }
  syncRow();
};

const finishResizeCreatedRange = () => {
  resizeSnapshot = null;
  isResizingCreated.value = false;
  resizeRangeId.value = '';
  longPressArmRangeId.value = '';
};

const cancelResizeFromSnapshot = () => {
  if (resizeSnapshot && isResizingCreated.value) {
    const snap = resizeSnapshot;
    const r = createdSignalRanges.value.find((x) => x.id === snap.rangeId);
    if (r) {
      r.start = snap.start;
      r.end = snap.end;
    }
    const row = frameSignalRows.value.find((x) => x.id === snap.rowId);
    if (row) {
      row.startBit = snap.start;
      row.length = snap.end - snap.start + 1;
    }
  }
  resizeSnapshot = null;
  isResizingCreated.value = false;
  resizeRangeId.value = '';
  longPressArmRangeId.value = '';
  clearCreatedLongPressTimer();
};

const startBitDrag = (bit: number, event?: MouseEvent) => {
  if (isBitDisabled(bit)) return;
  if (isResizingCreated.value) {
    finishResizeCreatedRange();
    clearCreatedLongPressTimer();
  }
  if (isRepositioningCreated.value) {
    finishRepositionCreatedRange();
    clearCreatedLongPressTimer();
  }
  if (event?.shiftKey) {
    const shiftTarget = getShiftResizeTarget(bit, event);
    if (shiftTarget) {
      selectedCreatedRangeId.value = shiftTarget.range.id;
      clearDraftRange();
      clearCreatedLongPressTimer();
      beginResizeCreatedRange(shiftTarget.range.id, shiftTarget.grabBit, shiftTarget.edge);
      if (event) updateDragIndicatorPosition(event);
      return;
    }
  }
  if (event?.ctrlKey) {
    const target = getCtrlRepositionTarget(bit);
    if (target) {
      selectedCreatedRangeId.value = target.range.id;
      clearDraftRange();
      clearCreatedLongPressTimer();
      beginRepositionCreatedRange(target.range.id, target.grabBit);
      updateDragIndicatorPosition(event);
      return;
    }
  }
  const createdRange = getCreatedRangeAtBit(bit);
  if (createdRange) {
    selectedCreatedRangeId.value = createdRange.id;
    clearDraftRange();
    scheduleCreatedLongPress(bit, createdRange.id);
    return;
  }
  clearCreatedLongPressTimer();
  selectedCreatedRangeId.value = '';
  closeSignalContextMenu();
  isDraggingBits.value = true;
  dragAnchorBit.value = bit;
  dragHoverBit.value = bit;
  lastPointerBit.value = bit;
  updateDraftPopupPosition(event);
  updateDragIndicatorPosition(event);
};

const updateBitDrag = (bit: number, event?: MouseEvent) => {
  updateShiftResizeHover(bit, event);
  if (isResizingCreated.value) {
    if (!isBitDisabled(bit)) {
      updateResizePreview(bit);
    }
    if (event) {
      updateDragIndicatorPosition(event);
    }
    return;
  }
  if (isRepositioningCreated.value) {
    if (isBitDisabled(bit)) return;
    updateRepositionPreview(bit);
    if (event) {
      updateDragIndicatorPosition(event);
    }
    return;
  }
  if (createdLongPressTimer && createdLongPressContext) {
    const r = createdSignalRanges.value.find((x) => x.id === createdLongPressContext.rangeId);
    if (!r || bit < r.start || bit > r.end) {
      clearCreatedLongPressTimer();
    }
  }
  if (!isDraggingBits.value) return;
  if (isBitDisabled(bit)) return;
  const clamped = clampDraftHoverBit(bit);
  if (clamped === null) return;
  dragHoverBit.value = clamped;
  lastPointerBit.value = bit;
};

const handleBitCellMouseMove = (event: MouseEvent, bit: number) => {
  updateShiftResizeHover(bit, event);
  if (isResizingCreated.value) {
    lastPointerBit.value = bit;
    updateDragIndicatorPosition(event);
    return;
  }
  if (isRepositioningCreated.value) {
    lastPointerBit.value = bit;
    updateDragIndicatorPosition(event);
    return;
  }
  if (!isDraggingBits.value) return;
  if (isBitDisabled(bit)) return;
  lastPointerBit.value = bit;
  const clamped = clampDraftHoverBit(bit);
  if (clamped !== null) {
    dragHoverBit.value = clamped;
  }
  updateDragIndicatorPosition(event);
};

const endBitDrag = (bit?: number, event?: MouseEvent) => {
  if (isResizingCreated.value) {
    if (typeof bit === 'number' && !isBitDisabled(bit)) {
      updateResizePreview(bit);
    }
    finishResizeCreatedRange();
    clearCreatedLongPressTimer();
    updateDraftPopupPosition(event);
    return;
  }
  if (isRepositioningCreated.value) {
    if (typeof bit === 'number' && !isBitDisabled(bit)) {
      updateRepositionPreview(bit);
    }
    finishRepositionCreatedRange();
    clearCreatedLongPressTimer();
    updateDraftPopupPosition(event);
    return;
  }
  clearCreatedLongPressTimer();
  if (!isDraggingBits.value) return;
  if (typeof bit === 'number' && !isBitDisabled(bit)) {
    const clamped = clampDraftHoverBit(bit);
    if (clamped !== null) {
      dragHoverBit.value = clamped;
      lastPointerBit.value = bit;
    }
  }
  isDraggingBits.value = false;
  lastPointerBit.value = null;
  updateDraftPopupPosition(event);
  if (draftRange.value) {
    const nextIndex = createdSignalRanges.value.length + 1;
    draftSignalName.value = buildDefaultSignalName(nextIndex);
    nextTick(() => updateDraftPopupPosition(event));
  }
};

const clearDraftRange = () => {
  dragAnchorBit.value = null;
  dragHoverBit.value = null;
  isDraggingBits.value = false;
  lastPointerBit.value = null;
  draftSignalName.value = '';
};

const commitDraftRangeToFrame = () => {
  if (!draftRange.value) return;
  const nextIndex = createdSignalRanges.value.length + 1;
  const nextLabel = draftSignalName.value || buildDefaultSignalName(nextIndex);
  const rangeLength = draftRange.value.end - draftRange.value.start + 1;
  const nextRowId = `sig-${Date.now()}-${nextIndex}`;
  frameSignalRows.value.push({
    id: nextRowId,
    description: '',
    signal: nextLabel,
    signalType: 'Scalar',
    startBit: draftRange.value.start,
    initValue: 0,
    length: rangeLength,
    unit: '',
    encoding: '',
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
  syncDocSignalsFromRows();
  commitDocToText();
  clearDraftRange();
};

const handleGlobalBitMouseUp = (event: MouseEvent) => {
  endBitDrag(undefined, event);
};

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Shift') {
    isShiftPressed.value = true;
  }
  if (event.key === 'Control') {
    isCtrlPressed.value = true;
    return;
  }
  if (signalEditDialog.visible && (event.key === 'Enter' || event.key === 'Escape')) {
    if (!isEditableTarget(event.target) || isTargetInsideSignalEditDialog(event.target)) {
      if (event.key === 'Enter') {
        confirmSignalEdit();
      } else {
        cancelSignalEdit();
      }
      event.preventDefault();
      return;
    }
  }
  if (draftRange.value && !isDraggingBits.value) {
    if (event.key === 'Escape') {
      clearDraftRange();
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter' && !isEditableTarget(event.target)) {
      commitDraftRangeToFrame();
      event.preventDefault();
      return;
    }
  }
  if (isEditableTarget(event.target)) {
    return;
  }
  if (event.key === 'ArrowDown') {
    if (signalMappingViewMode.value === 'matrix') {
      signalMappingViewMode.value = 'list';
      event.preventDefault();
      return;
    }
    moveSignalSelectionBy(1);
    event.preventDefault();
    return;
  }
  if (event.key === 'ArrowUp') {
    if (signalMappingViewMode.value === 'matrix') {
      signalMappingViewMode.value = 'list';
      event.preventDefault();
      return;
    }
    moveSignalSelectionBy(-1);
    event.preventDefault();
    return;
  }
  if (event.key === 'ArrowLeft') {
    if (signalMappingViewMode.value === 'matrix') {
      moveMatrixSelectionBy(-1);
      event.preventDefault();
      return;
    }
    signalMappingViewMode.value = 'matrix';
    event.preventDefault();
    return;
  }
  if (event.key === 'ArrowRight') {
    if (signalMappingViewMode.value === 'matrix') {
      moveMatrixSelectionBy(1);
      event.preventDefault();
      return;
    }
    signalMappingViewMode.value = 'matrix';
    event.preventDefault();
    return;
  }
  if (
    event.key === ' ' &&
    outlineViewMode.value === 'frames' &&
    (signalMappingViewMode.value === 'list' || signalMappingViewMode.value === 'matrix')
  ) {
    if (signalMappingViewMode.value === 'matrix') {
      syncSignalRowIndexFromMatrixRangeSelection();
    }
    if (selectedSignalRowIndex.value < 0) {
      return;
    }
    if (signalEditDialog.visible) {
      cancelSignalEdit();
    } else {
      editSignalRow();
    }
    event.preventDefault();
    return;
  }
  if (event.key === 'Escape') {
    if (isResizingCreated.value) {
      cancelResizeFromSnapshot();
      event.preventDefault();
      return;
    }
    if (isRepositioningCreated.value) {
      cancelRepositionFromSnapshot();
      event.preventDefault();
    }
  }
};

const handleGlobalKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Shift') {
    isShiftPressed.value = false;
    clearShiftResizeHover();
  }
  if (event.key === 'Control') {
    isCtrlPressed.value = false;
  }
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
  loadDocFromText(props.modelValue ?? '', { preserveOnFail: true });
  const table = ldfDoc.value?.scheduleTables.find((item) => item.name === scheduleName);
  if (table) {
    const first = table.entries[0];
    scheduleEditor.name = scheduleName;
    scheduleEditor.entry = first ? `${first.frame} delay ${first.delayMs} ms;` : 'New_Frame delay 10 ms;';
    return;
  }
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
  emitModelValueUpdate(updated);
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
  if (outlineViewMode.value === 'schedules' && data.scheduleName) {
    loadScheduleEditor(data.scheduleName);
  }
  syncInspectorSelection(data);
};

const resolveFrameNameFromTreeNodeId = (nodeId: string): string | null => {
  if (!nodeId.startsWith('frame-')) return null;
  const idx = Number.parseInt(nodeId.slice('frame-'.length), 10);
  if (!Number.isFinite(idx) || idx < 0) return null;
  return ldfDoc.value?.frames?.[idx]?.name ?? null;
};

const handleOutlineNodeContextMenu = (
  event: MouseEvent,
  data: { id?: string; label?: string; entryType?: 'slave-entry' | 'frame-entry' | 'unconditional-frames-folder'; frameName?: string }
) => {
  if (
    (data.entryType !== 'slave-entry' &&
      data.entryType !== 'frame-entry' &&
      data.entryType !== 'unconditional-frames-folder') ||
    !data.id ||
    !data.label
  ) {
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

const createFrameFromNodeMenu = () => {
  outlineViewMode.value = 'frames';
  addFrame();
  closeNodeContextMenu();
};

const startEditNode = () => {
  if (nodeContextMenu.entryType === 'frame-entry') {
    if (!nodeContextMenu.frameName) return;
    outlineViewMode.value = 'frames';
    activeFrameName.value = nodeContextMenu.frameName;
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
    emitModelValueUpdate(updated.replace(/\n{3,}/g, '\n\n'));
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
  loadDocFromText(props.modelValue ?? '');
  const doc = ldfDoc.value;
  if (!doc) {
    ElMessage.warning(t('tabs.ldfEditor.frameEditor.signalEditor.messages.ldfParseFailedApplyFrame'));
    return;
  }
  const safeName = (frameEditor.name || 'New_Frame').trim() || 'New_Frame';
  const safePublisher = normalizeFrameRelationRole((frameEditor.publisher || 'LIN_Commander').trim(), 'LIN_Commander');
  const safeLength = Math.min(8, Math.max(1, Number(frameEditor.length) || 8));
  const rawId = (frameEditor.idHex || '0x10').trim();
  const idNumber = rawId.startsWith('0x') || rawId.startsWith('0X') ? Number.parseInt(rawId, 16) : Number.parseInt(rawId, 10);
  const safeIdNum = Number.isNaN(idNumber) ? 0x10 : idNumber;
  const existing = doc.frames.find((item) => item.name === safeName);
  if (existing) {
    existing.id = safeIdNum;
    existing.publisher = safePublisher;
    existing.length = safeLength;
  } else {
    doc.frames.push({
      name: safeName,
      id: safeIdNum,
      publisher: safePublisher,
      length: safeLength,
      signals: [],
    });
  }
  syncDocSignalsFromRows();
  if (commitDocToText()) {
    ElMessage.success(existing ? t('tabs.ldfEditor.frameEditor.updated') : t('tabs.ldfEditor.frameEditor.inserted'));
  }
};

const applyScheduleEditor = () => {
  if (outlineViewMode.value !== 'schedules') {
    return;
  }
  loadDocFromText(props.modelValue ?? '');
  const doc = ldfDoc.value;
  if (!doc) {
    ElMessage.warning(t('tabs.ldfEditor.frameEditor.signalEditor.messages.ldfParseFailedApplySchedule'));
    return;
  }
  const safeName = (scheduleEditor.name || 'New_Schedule').trim() || 'New_Schedule';
  const rawEntry = (scheduleEditor.entry || 'New_Frame delay 10 ms;').trim() || 'New_Frame delay 10 ms;';
  const entryMatch = rawEntry.match(/^([A-Za-z_]\w*)\s+delay\s+([\d.]+)\s*ms;?$/i);
  if (!entryMatch) {
    ElMessage.warning(t('tabs.ldfEditor.frameEditor.signalEditor.messages.scheduleEntryFormat'));
    return;
  }
  const nextEntry = {
    frame: entryMatch[1],
    delayMs: Math.max(1, Number(entryMatch[2]) || 10),
  };
  const existing = doc.scheduleTables.find((item) => item.name === safeName);
  if (existing) {
    existing.entries = [nextEntry];
  } else {
    doc.scheduleTables.push({
      name: safeName,
      entries: [nextEntry],
    });
  }
  if (commitDocToText()) {
    ElMessage.success(existing ? t('tabs.ldfEditor.scheduleEditor.updated') : t('tabs.ldfEditor.scheduleEditor.inserted'));
  }
};


watch(
  outlineViewMode,
  (mode) => {
    if (mode === 'frames') {
      activeFrameName.value = null;
      currentOutlineNodeId.value = 'unconditional-frames';
      syncInspectorSelection({ id: 'unconditional-frames' });
      return;
    }
    if (mode === 'schedules') {
      const firstSchedule = ldfDoc.value?.scheduleTables?.[0];
      if (firstSchedule) {
        currentOutlineNodeId.value = 'schedule-0';
        loadScheduleEditor(firstSchedule.name);
        syncInspectorSelection({ id: 'schedule-0', scheduleName: firstSchedule.name });
      } else {
        currentOutlineNodeId.value = 'schedule-tables-root';
        loadScheduleEditor('New_Schedule');
        syncInspectorSelection({ id: 'schedule-tables-root' });
      }
      return;
    }
    activeFrameName.value = null;
    currentOutlineNodeId.value = 'nodes-root';
    syncInspectorSelection({ id: 'nodes-root' });
  },
  { immediate: true }
);

watch(
  () => [outlineViewMode.value, currentOutlineNodeId.value] as const,
  ([mode, nodeId]) => {
    if (mode !== 'frames') return;
    const frameName = resolveFrameNameFromTreeNodeId(nodeId);
    if (!frameName) {
      activeFrameName.value = null;
      return;
    }
    if (activeFrameName.value === frameName) return;
    activeFrameName.value = frameName;
    loadFrameEditor(frameName);
    syncInspectorSelection({ id: nodeId, frameName });
  }
);

watch(signalMappingViewMode, (mode) => {
  if (mode !== 'list') return;
  nextTick(() => ensureSelectedSignalRowVisible());
});

watch(
  () => props.modelValue,
  (value) => {
    const isInternal =
      pendingInternalModelUpdates.value > 0 ||
      (typeof value === 'string' && value.length > 0 && value === lastInternalModelValue.value);
    if (isInternal && pendingInternalModelUpdates.value > 0) {
      pendingInternalModelUpdates.value -= 1;
    }
    // 外部切换文件标签：强制切到新文件上下文，避免沿用上一个标签的内存模型。
    if (!isInternal) {
      activeFrameName.value = null;
      selectedSignalRowIndex.value = -1;
      selectedCreatedRangeId.value = '';
      frameSignalRows.value = [];
      createdSignalRanges.value = [];
      if (outlineViewMode.value === 'frames') {
        currentOutlineNodeId.value = 'unconditional-frames';
      }
      loadDocFromText(value ?? '');
      return;
    }
    // 内部更新（保存/应用）：保持 UI 连续性；解析失败时保留当前内存模型。
    loadDocFromText(value ?? '', { preserveOnFail: true });
  },
  { immediate: true }
);

watch(
  () => selectedSignalRowIndex.value,
  (index) => {
    if (!signalEditDialog.visible) return;
    syncSignalEditDialogFromIndex(index);
  }
);

watch(
  () => signalEditDialog.publisher,
  (publisher) => {
    const pub = (publisher || '').trim();
    if (!pub) return;
    if (relationSubscriberNodes.value.includes(pub)) {
      relationSubscriberNodes.value = relationSubscriberNodes.value.filter((item) => item !== pub);
      syncDialogSubscribersFromRelationEditor();
    }
  }
);

watch(
  () => signalEditDialog.visible,
  (visible) => {
    if (!visible) return;
    closeNodeContextMenu();
    closeSignalContextMenu();
    closeLogicalContextMenu();
    closeMultiRangeContextMenu();
    clearCreatedLongPressTimer();
  }
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
  clearCreatedLongPressTimer();
  if (deleteActionHintTimer) {
    clearTimeout(deleteActionHintTimer);
    deleteActionHintTimer = null;
  }
  if (isResizingCreated.value) {
    cancelResizeFromSnapshot();
  }
  if (isRepositioningCreated.value) {
    cancelRepositionFromSnapshot();
  }
  closeNodeContextMenu();
  closeSignalContextMenu();
  closeLogicalContextMenu();
  closeMultiRangeContextMenu();
});

onMounted(() => {
  document.addEventListener('click', closeNodeContextMenu);
  document.addEventListener('click', closeSignalContextMenu);
  document.addEventListener('click', closeLogicalContextMenu);
  document.addEventListener('click', closeMultiRangeContextMenu);
  window.addEventListener('mouseup', handleGlobalBitMouseUp);
  window.addEventListener('keydown', handleGlobalKeyDown);
  window.addEventListener('keyup', handleGlobalKeyUp);
});

onUnmounted(() => {
  document.removeEventListener('click', closeNodeContextMenu);
  document.removeEventListener('click', closeSignalContextMenu);
  document.removeEventListener('click', closeLogicalContextMenu);
  document.removeEventListener('click', closeMultiRangeContextMenu);
  window.removeEventListener('mouseup', handleGlobalBitMouseUp);
  window.removeEventListener('keydown', handleGlobalKeyDown);
  window.removeEventListener('keyup', handleGlobalKeyUp);
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
    emitModelValueUpdate(appended);
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
    emitModelValueUpdate(updated);
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
  emitModelValueUpdate(updated);
};

const addFrame = () => {
  const previousDoc = ldfDoc.value;
  loadDocFromText(props.modelValue ?? '');
  const parsedFromText = Boolean(ldfDoc.value);
  if (!ldfDoc.value) {
    // UI 优先阶段：文本暂不可解析时，优先沿用现有内存模型（支持连续创建多个帧）。
    if (previousDoc) {
      ldfDoc.value = previousDoc;
    } else {
      ldfDoc.value = {
        protocolVersion: '1.3',
        languageVersion: '2.1',
        bitrate: 19200,
        nodes: {
          master: 'LIN_Commander',
          timeBaseMs: 5,
          jitterMs: 1,
          slaves: ['LIN_Responder'],
        },
        nodeAttributes: [],
        signals: [],
        frames: [],
        scheduleTables: [],
        unknownSectionsRaw: '',
      };
    }
  }
  const doc = ldfDoc.value;

  const existingNames = new Set(doc.frames.map((f) => f.name));
  const baseName = 'New_Frame';
  let nextFrameName = baseName;
  let suffix = 1;
  while (existingNames.has(nextFrameName)) {
    nextFrameName = `${baseName}_${suffix}`;
    suffix += 1;
  }

  const usedIds = new Set(doc.frames.map((f) => Number(f.id) & 0x3f));
  let nextId = 0x10;
  while (usedIds.has(nextId & 0x3f) && nextId <= 0x3f) {
    nextId += 1;
  }
  if (nextId > 0x3f) {
    nextId = 0x10;
  }

  doc.frames.push({
    name: nextFrameName,
    id: nextId,
    publisher: 'LIN_Commander',
    length: 8,
    signals: [],
  });

  if (parsedFromText) {
    if (!commitDocToText()) {
      return;
    }
  }

  const newFrameIndex = doc.frames.length - 1;
  outlineViewMode.value = 'frames';
  currentOutlineNodeId.value = `frame-${newFrameIndex}`;
  activeFrameName.value = nextFrameName;
  frameEditor.name = nextFrameName;
  frameEditor.idHex = `0x${nextId.toString(16).toUpperCase()}`;
  frameEditor.publisher = 'LIN_Commander';
  frameEditor.subscriber = 'LIN_Responder';
  frameEditor.length = 8;
  syncFrameSignalRowsFromDoc(nextFrameName);
  syncInspectorSelection({ id: currentOutlineNodeId.value, frameName: nextFrameName });
  if (parsedFromText) {
    ElMessage.success(t('tabs.ldfEditor.frameEditor.inserted'));
  } else {
    ElMessage.success(t('tabs.ldfEditor.frameEditor.signalEditor.messages.frameCreatedUiOnly'));
  }
};

const addScheduleTable = () => {
  const source = props.modelValue ?? '';
  const tableName = 'New_Schedule';
  const tableBlock = `\n  ${tableName} {\n    // FrameName delay 10 ms;\n  }\n`;
  const schedulePattern = /Schedule_tables\s*\{([\s\S]*?)\}/m;
  const scheduleMatch = source.match(schedulePattern);

  if (!scheduleMatch) {
    const appended = `${source.trimEnd()}\n\nSchedule_tables {${tableBlock}}\n`;
    emitModelValueUpdate(appended);
    return;
  }

  const updatedSchedules = `${scheduleMatch[1].trimEnd()}${tableBlock}`;
  const updated = source.replace(schedulePattern, `Schedule_tables {${updatedSchedules}}`);
  emitModelValueUpdate(updated);
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
  position: relative;
  isolation: isolate;
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
  gap: 4px;
  height: 30px;
  padding: 0 6px;
  background-color: var(--app-bg);
  border-bottom: 1px solid var(--app-border);
}

.ldf-toolbar-btn {
  width: 22px;
  height: 22px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  color: var(--app-text-regular);
  border-radius: 4px;
  font-size: 9px;
  padding: 0;
  cursor: pointer;
}

.ldf-toolbar-btn:hover {
  background-color: color-mix(in srgb, var(--app-bg-hover) 82%, var(--app-bg));
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
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 82%, transparent);
  background-color: var(--app-bg);
  padding: 6px 8px;
}

.ldf-frame-editor-panel-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ldf-frame-editor-empty {
  background: var(--app-bg-elevated);
}

.ldf-frame-editor-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 6px;
}

.ldf-frame-editor-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 8px;
}

.ldf-frame-properties-grid {
  grid-template-columns: minmax(220px, 1.8fr) minmax(120px, 1fr) minmax(160px, 1.2fr);
}

.ldf-frame-name-field input {
  min-width: 0;
}

.ldf-frame-id-field {
  justify-self: end;
  width: 100%;
  max-width: 240px;
}

.ldf-frame-group {
  border: 1px solid var(--app-border);
  border-radius: 5px;
  padding: 6px;
  margin-bottom: 6px;
  background-color: var(--app-bg);
}

.ldf-frame-group-mapping {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ldf-frame-group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 4px;
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

.ldf-frame-relations-warning {
  margin-top: 6px;
  font-size: 12px;
  color: color-mix(in srgb, var(--app-accent) 75%, #ff4d4f);
}

.ldf-frame-editor-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: var(--app-text-secondary);
}

.ldf-frame-editor-field input,
.ldf-frame-editor-field select {
  height: 22px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg);
  color: var(--app-text-primary);
  border-radius: 3px;
  padding: 0 6px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.ldf-frame-editor-field input:hover,
.ldf-frame-editor-field select:hover {
  border-color: color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
}

.ldf-frame-editor-field input:focus,
.ldf-frame-editor-field select:focus {
  border-color: color-mix(in srgb, var(--app-accent) 60%, var(--app-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-accent) 22%, transparent);
}

.ldf-frame-editor-field select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 30px;
  background-image:
    linear-gradient(
      to right,
      transparent calc(100% - 24px),
      color-mix(in srgb, var(--app-border) 72%, transparent) calc(100% - 24px),
      color-mix(in srgb, var(--app-border) 72%, transparent) calc(100% - 23px),
      transparent calc(100% - 23px)
    ),
    linear-gradient(45deg, transparent 50%, var(--app-text-secondary) 50%),
    linear-gradient(135deg, var(--app-text-secondary) 50%, transparent 50%);
  background-position:
    0 0,
    calc(100% - 14px) calc(50% - 1px),
    calc(100% - 9px) calc(50% - 1px);
  background-size: 100% 100%, 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  cursor: pointer;
}

.ldf-frame-editor-field select option {
  background: var(--app-bg-elevated);
  color: var(--app-text-primary);
}

.ldf-frame-editor-field select:focus option:checked {
  background: color-mix(in srgb, var(--app-accent) 24%, var(--app-bg-elevated));
}

.ldf-frame-editor-field select:disabled,
.ldf-frame-editor-field input:disabled {
  color: var(--app-text-secondary);
  background-color: color-mix(in srgb, var(--app-bg-hover) 78%, var(--app-bg));
  border-color: color-mix(in srgb, var(--app-border) 85%, transparent);
  cursor: not-allowed;
  opacity: 0.95;
}

.ldf-rel-select {
  width: 100%;
}

.ldf-rel-select :deep(.el-select__wrapper) {
  min-height: 30px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--app-bg);
  box-shadow: inset 0 0 0 1px var(--app-border);
  transition: box-shadow 0.16s ease, background-color 0.16s ease;
}

.ldf-rel-select :deep(.el-select__wrapper.is-hovering) {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-border) 40%, var(--app-text-primary) 60%);
}

.ldf-rel-select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 0 0 1px var(--app-accent),
    0 0 0 1px color-mix(in srgb, var(--app-accent) 45%, transparent);
}

.ldf-rel-select :deep(.el-select__selected-item),
.ldf-rel-select :deep(.el-select__placeholder) {
  font-size: 12px;
  color: var(--app-text-regular);
}

.ldf-rel-select :deep(.el-select__caret) {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.ldf-rel-select :deep(.el-select__wrapper.is-disabled) {
  background-color: color-mix(in srgb, var(--app-bg-hover) 78%, var(--app-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-border) 85%, transparent);
}

.ldf-rel-select :deep(.el-select__wrapper.is-disabled .el-select__selected-item) {
  color: var(--app-text-secondary);
}

:global(.ldf-rel-select-popper.el-select__popper) {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg-elevated);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
}

:global(.ldf-rel-select-popper .el-select-dropdown),
:global(.ldf-rel-select-popper .el-select-dropdown__wrap),
:global(.ldf-rel-select-popper .el-scrollbar__view),
:global(.ldf-rel-select-popper .el-select-dropdown__list) {
  background-color: var(--app-bg-elevated);
}

:global(.ldf-rel-select-popper .el-popper__arrow::before) {
  border-color: var(--app-border);
  background: var(--app-bg-elevated);
}

:global(.ldf-rel-select-popper .el-select-dropdown__item) {
  min-height: 30px;
  line-height: 30px;
  font-size: 12px;
  color: var(--app-text-regular);
  padding: 0 10px;
}

:global(.ldf-rel-select-popper .el-select-dropdown__item.hover),
:global(.ldf-rel-select-popper .el-select-dropdown__item:hover) {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

:global(.ldf-rel-select-popper .el-select-dropdown__item.is-selected) {
  background-color: #eef1f5;
  color: var(--app-text-primary);
  font-weight: 600;
}

.ldf-schedule-entry-field {
  grid-column: span 3;
}


.ldf-frame-editor-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.ldf-dialog-mask {
  position: absolute;
  inset: 0;
  z-index: 5200;
  background: color-mix(in srgb, #000 28%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ldf-signal-edit-dialog {
  width: min(720px, calc(100% - 48px));
  max-height: calc(100% - 48px);
  overflow: auto;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-bg-elevated);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.28);
  padding: 14px;
}

.ldf-signal-edit-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 10px;
}

.ldf-signal-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.ldf-signal-properties-card {
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-bg);
  padding: 10px;
}

.ldf-signal-properties-card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 8px;
}

.ldf-encoding-type-card {
  margin-top: 8px;
}

.ldf-encoding-type-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 6px;
  padding: 0 0 2px;
}

.ldf-encoding-type-body {
  margin-top: 6px;
  padding: 10px 10px 8px;
  border: 1px solid color-mix(in srgb, var(--app-border) 85%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--app-bg-elevated) 28%, var(--app-bg));
}

.ldf-encoding-type-body.disabled {
  opacity: 0.5;
  pointer-events: none;
  filter: grayscale(0.15);
}

.ldf-relations-card {
  margin-top: 8px;
}

.ldf-relations-header {
  margin-bottom: 8px;
}

.ldf-relations-header .ldf-frame-editor-field {
  max-width: 340px;
}

.ldf-relations-transfer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.ldf-relations-list-title {
  font-size: 11px;
  color: var(--app-text-secondary);
  margin-bottom: 4px;
}

.ldf-relations-listbox {
  width: 100%;
  min-height: 86px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-primary);
  font-size: 12px;
  padding: 4px;
  box-sizing: border-box;
}

.ldf-relations-dropzone {
  padding: 4px;
  overflow: auto;
}

.ldf-relations-dropzone.is-drag-over {
  border-color: color-mix(in srgb, var(--app-accent) 60%, var(--app-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-accent) 45%, transparent);
  background: color-mix(in srgb, var(--app-accent) 10%, var(--app-bg));
}

.ldf-relations-item {
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 3px;
  cursor: grab;
  user-select: none;
}

.ldf-relations-item:hover {
  background: var(--app-bg-hover);
}

.ldf-relations-item:active {
  cursor: grabbing;
  background: color-mix(in srgb, var(--app-accent) 12%, var(--app-bg));
}

.ldf-relations-item + .ldf-relations-item {
  margin-top: 3px;
}

.ldf-relations-item-empty {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-secondary);
  font-size: 11px;
}

.ldf-relations-listbox:focus {
  outline: none;
}

.ldf-rel-transfer-btn {
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-primary);
  cursor: pointer;
}

.ldf-rel-transfer-btn:hover {
  border-color: color-mix(in srgb, var(--app-accent) 40%, var(--app-border));
  background: var(--app-bg-hover);
}

.ldf-encoding-type-tab {
  height: 24px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  padding: 0 10px;
  background: var(--app-bg);
  color: var(--app-text-regular);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
  white-space: nowrap;
}

.ldf-encoding-type-tab:hover {
  background: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.ldf-encoding-type-tab.active {
  background: color-mix(in srgb, var(--app-accent) 14%, var(--app-bg));
  color: var(--app-text-primary);
  border-color: color-mix(in srgb, var(--app-accent) 55%, var(--app-border));
}

.ldf-physical-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px 10px;
  align-items: end;
}

.ldf-physical-fields .ldf-frame-editor-field {
  gap: 4px;
  min-width: 0;
}

.ldf-physical-fields .ldf-frame-editor-field span {
  display: inline-flex;
  align-items: center;
  line-height: 1.2;
}

.ldf-physical-fields .ldf-frame-editor-field input {
  height: 24px;
}

.ldf-logical-table-wrap {
  margin-top: 8px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg);
  overflow: hidden;
}

.ldf-logical-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 11px;
  table-layout: fixed;
}

.ldf-logical-table th,
.ldf-logical-table td {
  border-right: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
  padding: 4px 6px;
  text-align: left;
}

.ldf-logical-table th {
  background: var(--app-bg-elevated);
  color: var(--app-text-primary);
  font-weight: 500;
  box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--app-border) 72%, transparent);
}

.ldf-logical-table th:last-child,
.ldf-logical-table td:last-child {
  border-right: none;
}

.ldf-logical-table tbody tr:last-child td {
  border-bottom: none;
}

.ldf-logical-table tbody tr {
  transition: background-color 140ms ease;
}

.ldf-logical-table tbody tr:hover td {
  background: color-mix(in srgb, var(--app-bg-hover) 70%, var(--app-bg));
}

.ldf-logical-col-value {
  width: 132px;
}

.ldf-logical-col-desc {
  width: auto;
}

.ldf-logical-table td input {
  width: 100%;
  box-sizing: border-box;
  height: 22px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg);
  color: var(--app-text-primary);
  border-radius: 3px;
  padding: 0 6px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.ldf-logical-table td input:hover {
  border-color: color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
}

.ldf-logical-table td input:focus {
  border-color: color-mix(in srgb, var(--app-accent) 60%, var(--app-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-accent) 22%, transparent);
}

.ldf-logical-empty-row td {
  height: 38px;
  text-align: center;
  color: var(--app-text-secondary);
  background: color-mix(in srgb, var(--app-bg-hover) 40%, var(--app-bg));
  letter-spacing: 0.1px;
  user-select: none;
  cursor: context-menu;
}

.ldf-multirange-table-wrap {
  margin-top: 8px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg);
  overflow: hidden;
}

.ldf-multirange-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 11px;
  table-layout: fixed;
}

.ldf-multirange-table th,
.ldf-multirange-table td {
  border-right: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
  padding: 4px 6px;
  text-align: left;
}

.ldf-multirange-table th {
  background: var(--app-bg-elevated);
  color: var(--app-text-primary);
  font-weight: 500;
}

.ldf-multirange-table th:last-child,
.ldf-multirange-table td:last-child {
  border-right: none;
}

.ldf-multirange-table tbody tr:last-child td {
  border-bottom: none;
}

.ldf-multirange-col-min,
.ldf-multirange-col-max,
.ldf-multirange-col-factor,
.ldf-multirange-col-offset {
  width: 116px;
}

.ldf-multirange-col-unit {
  width: auto;
}

.ldf-multirange-col-actions {
  width: 72px;
  text-align: center;
}

.ldf-multirange-table td input {
  width: 100%;
  box-sizing: border-box;
  height: 22px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg);
  color: var(--app-text-primary);
  border-radius: 3px;
  padding: 0 6px;
  outline: none;
}

.ldf-multirange-table td input:focus {
  border-color: color-mix(in srgb, var(--app-accent) 60%, var(--app-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-accent) 22%, transparent);
}

.ldf-multirange-delete-btn {
  min-width: 54px;
  padding: 0 8px;
}

.ldf-multirange-empty-row td {
  height: 36px;
  text-align: center;
  color: var(--app-text-secondary);
  background: color-mix(in srgb, var(--app-bg-hover) 40%, var(--app-bg));
}

.ldf-ascii-bcd-options {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 180px));
  gap: 8px 12px;
}

.ldf-ascii-bcd-profile-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ldf-ascii-bcd-profile-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ldf-profile-icon-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-regular);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.ldf-profile-icon-btn:hover {
  border-color: color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
  background: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.ldf-profile-icon-btn.primary {
  color: var(--app-accent);
  border-color: color-mix(in srgb, var(--app-accent) 55%, var(--app-border));
  background: color-mix(in srgb, var(--app-accent) 12%, var(--app-bg));
}

.ldf-profile-icon-btn.primary:hover {
  border-color: color-mix(in srgb, var(--app-accent) 72%, var(--app-border));
  background: color-mix(in srgb, var(--app-accent) 20%, var(--app-bg));
  color: color-mix(in srgb, var(--app-accent) 86%, var(--app-text-primary));
}

.ldf-profile-icon-btn.active {
  border-color: color-mix(in srgb, var(--app-accent) 60%, var(--app-border));
  background: color-mix(in srgb, var(--app-accent) 12%, var(--app-bg));
  color: var(--app-accent);
}

.ldf-profile-icon-btn.ready {
  opacity: 1;
  color: var(--app-text-primary);
}

.ldf-profile-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ldf-profile-icon-btn:disabled:hover {
  border-color: var(--app-border);
  background: var(--app-bg);
  color: var(--app-text-regular);
}

.ldf-cursor-hint {
  position: fixed;
  z-index: 4600;
  pointer-events: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--app-text-primary);
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
}

.ldf-ascii-bcd-profile-select {
  width: min(340px, 100%);
  min-width: 220px;
}

.ldf-ascii-bcd-profile-input {
  width: min(340px, 100%);
  min-width: 220px;
  height: 24px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-regular);
  box-sizing: border-box;
  padding: 0 8px;
  outline: none;
}

.ldf-ascii-bcd-profile-input:focus {
  border-color: color-mix(in srgb, var(--app-accent) 60%, var(--app-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-accent) 45%, transparent);
}

.ldf-ascii-bcd-profile-select :deep(.el-select__wrapper) {
  min-height: 24px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--app-bg);
  box-shadow: inset 0 0 0 1px var(--app-border);
}

.ldf-ascii-bcd-profile-select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 0 0 1px var(--app-accent),
    0 0 0 1px color-mix(in srgb, var(--app-accent) 45%, transparent);
}

.ldf-ascii-bcd-profile-select :deep(.el-select__selected-item),
.ldf-ascii-bcd-profile-select :deep(.el-select__placeholder),
.ldf-ascii-bcd-profile-select :deep(.el-input__inner) {
  font-size: 11px;
  color: var(--app-text-regular);
}

.ldf-ascii-bcd-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
  padding: 3px 8px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-primary);
  font-size: 11px;
}

.ldf-ascii-bcd-option input[type='checkbox'] {
  width: 14px;
  height: 14px;
}

.ldf-ascii-bcd-hint {
  grid-column: 1 / -1;
  margin-top: 0;
  font-size: 11px;
  color: var(--app-text-secondary);
  line-height: 1.4;
  white-space: normal;
}

@media (max-width: 980px) {
  .ldf-ascii-bcd-options {
    grid-template-columns: 1fr;
  }
}

:global(.ldf-ascii-bcd-profile-popper.el-select__popper) {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg-elevated);
}

:global(.ldf-ascii-bcd-profile-popper .el-popper__arrow) {
  display: none !important;
}

:global(.ldf-ascii-bcd-profile-popper .el-select-dropdown__item.hover),
:global(.ldf-ascii-bcd-profile-popper .el-select-dropdown__item:hover) {
  background-color: var(--app-bg-hover);
  color: var(--app-text-primary);
}

:global(.ldf-ascii-bcd-profile-popper .el-select-dropdown__item.is-selected) {
  background-color: color-mix(in srgb, var(--app-bg-hover) 70%, var(--app-bg));
  color: var(--app-text-primary);
  font-weight: 600;
}

.ldf-multirange-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid color-mix(in srgb, var(--app-border) 72%, transparent);
  background: color-mix(in srgb, var(--app-bg-elevated) 82%, var(--app-bg));
}

.ldf-frame-mapping-table-wrap {
  border: 1px solid var(--app-border);
  border-radius: 3px;
  overflow: auto;
  flex: 1;
  min-height: 180px;
  max-height: none;
}

.ldf-frame-mapping-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.ldf-frame-mapping-table th,
.ldf-frame-mapping-table td {
  padding: 4px 6px;
  border-bottom: 1px solid var(--app-border);
  text-align: left;
  white-space: nowrap;
}

.ldf-frame-mapping-table tbody td {
  background-color: transparent;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.ldf-frame-mapping-table tbody tr {
  transition:
    transform 160ms ease,
    box-shadow 180ms ease,
    outline-color 160ms ease;
}

.ldf-frame-mapping-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: var(--app-bg-elevated);
  color: var(--app-text-primary);
  font-weight: 500;
  box-shadow: 0 1px 0 var(--app-border);
}

.ldf-frame-mapping-table tbody tr.selected {
  outline: 2px solid color-mix(in srgb, var(--app-accent) 74%, transparent);
  outline-offset: -2px;
  position: relative;
  z-index: 2;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
}

.ldf-frame-mapping-table tbody tr.selected td {
  background-color: color-mix(in srgb, var(--app-accent) 14%, transparent);
  color: var(--app-text-primary);
}

.ldf-inline-signal-edit-wrap {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border-top: 1px solid color-mix(in srgb, var(--app-border) 65%, transparent);
  background: var(--app-bg-elevated);
}

.ldf-frame-mapping-table-wrap.is-inline-editing {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ldf-frame-mapping-table-wrap.is-inline-editing .ldf-frame-mapping-table {
  flex: 0 0 auto;
}

.ldf-inline-signal-edit-full {
  flex: 1;
  min-height: 160px;
  overflow: auto;
  background: var(--app-bg-elevated);
  display: block;
}

.ldf-inline-signal-edit-wrap .ldf-frame-editor-actions {
  justify-content: flex-end;
}

.ldf-inline-signal-edit-actions {
  margin-top: 0;
  padding: 8px 10px;
  border-top: 1px solid color-mix(in srgb, var(--app-border) 65%, transparent);
  background: var(--app-bg-elevated);
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

.ldf-signal-matrix-wrap.is-repositioning-range {
  cursor: grabbing;
}

.ldf-signal-matrix-wrap.is-repositioning-range .ldf-signal-matrix-cell {
  cursor: grabbing;
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

.ldf-signal-matrix-row .ldf-signal-matrix-cell.ctrl-drag-hover {
  cursor: grab;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-left-hover,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-right-hover,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-left-active,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-right-active {
  position: relative;
  cursor: ew-resize;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-left-hover::before,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-left-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 2px;
  z-index: 12;
  pointer-events: none;
  background: color-mix(in srgb, #22c55e 90%, #15803d);
  box-shadow:
    0 0 0 1px color-mix(in srgb, #ffffff 78%, transparent),
    0 0 8px color-mix(in srgb, #22c55e 45%, transparent);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-right-hover::after,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-right-active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 2px;
  bottom: 2px;
  width: 2px;
  z-index: 12;
  pointer-events: none;
  background: color-mix(in srgb, #22c55e 90%, #15803d);
  box-shadow:
    0 0 0 1px color-mix(in srgb, #ffffff 78%, transparent),
    0 0 8px color-mix(in srgb, #22c55e 45%, transparent);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-blocked-hover.shift-resize-left-hover::before,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-blocked-hover.shift-resize-right-hover::after,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-blocked-hover.shift-resize-left-active::before,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.shift-resize-blocked-hover.shift-resize-right-active::after {
  background: color-mix(in srgb, #ef4444 92%, #b91c1c);
  box-shadow:
    0 0 0 1px color-mix(in srgb, #ffffff 78%, transparent),
    0 0 8px color-mix(in srgb, #ef4444 52%, transparent);
}

.ldf-signal-matrix-row {
  position: relative;
}

.ldf-signal-matrix-label-layer {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
}

.ldf-signal-matrix-range-label {
  position: absolute;
  top: 0;
  height: 100%;
  box-sizing: border-box;
  padding: 0;
  font-weight: 600;
  line-height: 1.15;
  color: color-mix(in srgb, var(--app-text-primary) 94%, #0f172a);
  text-shadow: none;
  overflow: hidden;
  transition:
    transform 160ms ease,
    box-shadow 180ms ease,
    background-color 160ms ease;
}

/* 文字只画在区段最右一格；显隐与字号由该格等效宽度决定（容器查询在 slot 上） */
.ldf-signal-matrix-range-label-slot {
  position: absolute;
  top: 3px;
  right: 1px;
  bottom: 0;
  width: calc(100% / max(var(--ldf-matrix-range-bit-count, 1), 1));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  container-type: size;
  container-name: ldf-matrix-range;
}

/* 单 bit：整区即一格，slot 仍铺满；仅色块 + 描边 */
.ldf-signal-matrix-range-label.single-bit {
  overflow: hidden;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 14%, transparent);
  background: color-mix(in srgb, var(--app-bg-elevated) 22%, transparent);
}

.ldf-signal-matrix-range-label.single-bit .ldf-signal-matrix-range-label-slot {
  top: 0;
  right: 0;
}

.ldf-signal-matrix-range-label.multi-bit {
  border-right: 1px solid color-mix(in srgb, var(--app-border) 78%, #334155);
  box-shadow:
    inset -1px 0 0 color-mix(in srgb, #ffffff 28%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 16%, transparent);
  background: color-mix(in srgb, var(--app-bg-elevated) 34%, transparent);
}

/* 固定字号；竖向占满可用高度并省略；横向宽度随字形（约 1em）由 flex 父级居中 */
.ldf-signal-matrix-range-label-text {
  display: block;
  box-sizing: border-box;
  block-size: max-content;
  max-block-size: 100%;
  inline-size: calc(100% - 8px);
  max-inline-size: calc(100% - 8px);
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
  word-break: keep-all;
  overflow: hidden;
  text-overflow: ellipsis;
}

/*
 * 仅看「最右一格」物理宽度。矩阵 min 为 12px/列（768÷64），原先 max-width:11px 时 12px 不匹配，
 * 多 bit 最右格仍会出字，与 1bit 不一致。这里用 13px 覆盖单列及亚像素取整。
 */
@container ldf-matrix-range (max-width: 13px) {
  .ldf-signal-matrix-range-label-text {
    display: none;
  }
}

.ldf-signal-matrix-range-label.selected {
  color: color-mix(in srgb, var(--app-text-primary) 94%, #0f172a);
  font-weight: 600;
  z-index: 10;
  transform: translateY(-1px);
  box-shadow:
    0 8px 18px rgba(37, 99, 235, 0.18),
    inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 36%, transparent);
}

.ldf-signal-matrix-range-label.moving {
  color: color-mix(in srgb, var(--app-accent) 78%, #111827);
  text-shadow: none;
  z-index: 10;
  background: color-mix(in srgb, var(--app-bg-elevated) 72%, transparent);
  border-radius: 3px;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.16),
    inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 24%, transparent);
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

.ldf-signal-matrix-row .ldf-signal-matrix-cell.created-drag-mask {
  position: relative;
  cursor: not-allowed;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.created-drag-mask::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: 2px;
  background:
    repeating-linear-gradient(
      -45deg,
      color-mix(in srgb, #0f172a 18%, transparent) 0 5px,
      color-mix(in srgb, #0f172a 6%, transparent) 5px 10px
    ),
    color-mix(in srgb, #0f172a 22%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #f97316 35%, transparent);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.selected-created {
  box-shadow:
    inset 0 2px 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a),
    inset 0 -2px 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a);
  filter: none;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.selected-created-start {
  box-shadow:
    inset 2px 0 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a),
    inset 0 2px 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a),
    inset 0 -2px 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.selected-created-end {
  box-shadow:
    inset -2px 0 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a),
    inset 0 2px 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a),
    inset 0 -2px 0 0 color-mix(in srgb, var(--app-accent) 86%, #0f172a);
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.repositioning-arm {
  position: relative;
  z-index: 3;
  filter: saturate(1.06) brightness(1.02);
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, var(--app-accent) 52%, #38bdf8),
    0 0 0 3px color-mix(in srgb, var(--app-accent) 14%, transparent),
    0 6px 14px rgba(15, 23, 42, 0.12);
  transition:
    box-shadow 0.28s ease,
    filter 0.28s ease;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.repositioning-lift {
  position: relative;
  z-index: 6;
  filter: saturate(1.08) brightness(1.04);
  box-shadow:
    0 16px 36px rgba(15, 23, 42, 0.24),
    0 6px 14px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 0 color-mix(in srgb, #ffffff 38%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 42%, rgba(15, 23, 42, 0.35));
  transition:
    box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.22s ease;
}

.ldf-signal-matrix-row .ldf-signal-matrix-cell.repositioning-lift.selected-created,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.repositioning-lift.selected-created-start,
.ldf-signal-matrix-row .ldf-signal-matrix-cell.repositioning-lift.selected-created-end {
  box-shadow:
    0 16px 36px rgba(15, 23, 42, 0.24),
    0 6px 14px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 0 color-mix(in srgb, #ffffff 38%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 48%, rgba(15, 23, 42, 0.32));
}

.ldf-signal-matrix-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg-hover) 55%, var(--app-bg));
}

.ldf-signal-matrix-actions.floating {
  position: absolute;
  z-index: 12;
  border: 1px solid color-mix(in srgb, var(--app-border) 82%, #9ca3af);
  border-radius: 10px;
  box-shadow:
    0 14px 30px rgba(15, 23, 42, 0.2),
    0 2px 10px rgba(15, 23, 42, 0.12);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--app-bg-elevated) 94%, #ffffff) 0%,
    color-mix(in srgb, var(--app-bg) 92%, #eef2ff) 100%
  );
  min-width: 292px;
  max-width: 360px;
  backdrop-filter: blur(4px);
}

.ldf-signal-create-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--app-text-primary) 90%, #111827);
}

.ldf-signal-drag-indicator {
  position: absolute;
  z-index: 13;
  pointer-events: none;
  display: inline-flex;
  align-items: stretch;
  justify-content: center;
  width: fit-content;
  min-width: 0;
  padding: 6px 9px 7px;
  border: 1px solid color-mix(in srgb, var(--app-border) 88%, #94a3b8);
  border-radius: 8px;
  background: color-mix(in srgb, var(--app-bg-elevated) 98%, #ffffff);
  box-shadow:
    0 10px 20px rgba(15, 23, 42, 0.2),
    0 2px 6px rgba(15, 23, 42, 0.12);
}

.ldf-signal-drag-indicator-inner {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: stretch;
}

.ldf-signal-drag-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  white-space: nowrap;
}

.ldf-signal-drag-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--app-text-secondary) 88%, #475569);
}

.ldf-signal-drag-num {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--app-text-primary) 92%, #0f172a);
}

.ldf-signal-matrix-hint {
  font-size: 11px;
  font-weight: 500;
  color: color-mix(in srgb, var(--app-text-secondary) 92%, #475569);
}

.ldf-signal-create-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ldf-signal-create-row.info {
  justify-content: space-between;
  padding: 2px 2px 7px;
  border-bottom: 1px dashed color-mix(in srgb, var(--app-border) 72%, transparent);
}

.ldf-signal-create-row.actions {
  justify-content: flex-end;
  padding-top: 4px;
}

.ldf-signal-name-input {
  width: 100%;
  height: 30px;
  border: 1px solid color-mix(in srgb, var(--app-border) 80%, #94a3b8);
  border-radius: 6px;
  background: color-mix(in srgb, var(--app-bg) 92%, #ffffff);
  color: var(--app-text-primary);
  font-size: 12px;
  padding: 0 10px;
  transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}

.ldf-signal-name-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--app-accent) 62%, #3b82f6);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 16%, transparent);
  background: color-mix(in srgb, var(--app-bg-elevated) 94%, #ffffff);
}

.ldf-frame-editor-btn {
  height: 22px;
  border: 1px solid var(--app-border);
  background-color: var(--app-bg-elevated);
  color: var(--app-text-primary);
  border-radius: 3px;
  padding: 0 8px;
  cursor: pointer;
  font-size: 11px;
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
  padding: 4px 0;
  background-color: transparent;
  color: var(--app-text-regular);
  font-size: 12px;
}

.ldf-outline-tree :deep(.el-tree) {
  --el-tree-node-hover-bg-color: var(--app-bg-soft-hover);
  --el-tree-text-color: var(--app-text-regular);
  --el-tree-expand-icon-color: var(--app-text-subtle);
  background: transparent;
  color: var(--app-text-regular);
}

.ldf-outline-tree :deep(.el-tree-node__content) {
  min-height: 26px;
  height: 26px;
  padding-right: 8px;
  border-radius: 0;
}

.ldf-outline-tree :deep(.el-tree-node__content:hover) {
  background: var(--app-bg-soft-hover);
}

.ldf-outline-tree :deep(.el-tree-node:focus > .el-tree-node__content) {
  background: var(--app-bg-soft-hover);
}

.ldf-outline-tree :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: var(--app-bg-hover);
  color: var(--app-text-primary);
}

.ldf-outline-tree :deep(.el-tree-node__expand-icon) {
  font-size: 12px;
  color: var(--app-text-subtle);
}

.ldf-outline-tree :deep(.el-tree-node__expand-icon.expanded) {
  color: var(--app-text-regular);
}

.ldf-outline-tree :deep(.el-tree-node__label) {
  color: inherit;
}

.ldf-tree-node-content {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ldf-tree-node-label {
  flex: 1;
  min-width: 0;
  line-height: 1;
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
  z-index: 4200;
  min-width: 92px;
  width: max-content;
  max-width: min(320px, calc(100vw - 24px));
  padding: 3px;
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 4px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
}

.ldf-node-context-menu-item {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--app-text-regular);
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  padding: 4px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
}

.ldf-node-context-menu-item::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
  background: color-mix(in srgb, var(--app-accent) 14%, var(--app-bg));
  flex: 0 0 10px;
}

.ldf-node-context-menu-item:hover {
  background-color: var(--app-bg-hover);
}

.ldf-node-context-menu-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ldf-node-context-menu-item:disabled:hover {
  background: transparent;
  color: var(--app-text-regular);
}

.ldf-node-context-menu-item.danger::before {
  border-color: color-mix(in srgb, #ff7b86 55%, var(--app-border));
  background: color-mix(in srgb, #ff7b86 18%, var(--app-bg));
}

.ldf-node-context-menu-item.danger:hover {
  background-color: rgba(220, 53, 69, 0.15);
  color: #ff7b86;
}
</style>
