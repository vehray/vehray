<template>
  <div class="settings-view">
    <aside class="settings-tree">
      <div class="tree-title">应用程序设置</div>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'startup' }" @click="activeNode = 'startup'">启动与恢复</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'workspace' }" @click="activeNode = 'workspace'">工作区与文件</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'appearance' }" @click="activeNode = 'appearance'">界面（UI）</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'interaction' }" @click="activeNode = 'interaction'">交互</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'channel' }" @click="handleEnterChannelNode">通道管理</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'basic' }" @click="activeNode = 'basic'">基础</button>
    </aside>

    <section class="settings-content">
      <template v-if="activeNode === 'startup'">
        <h2>启动与恢复</h2>
        <p class="settings-desc">启动程序后的行为设置。</p>
        <div class="settings-group">
          <label class="setting-row switch-row">
            <span>启动时显示主页</span>
            <el-switch :model-value="state.showHomeOnLaunch" @change="handleToggleShowHomeOnLaunch" />
          </label>
          <label class="setting-row switch-row">
            <span>启动时打开上次项目</span>
            <el-switch :model-value="false" disabled />
          </label>
          <label class="setting-row switch-row">
            <span>启动时恢复上次会话（打开的文件/标签）</span>
            <el-switch :model-value="false" disabled />
          </label>
          <label class="setting-row switch-row">
            <span>无项目时进入开始画面</span>
            <el-switch :model-value="true" disabled />
          </label>
        </div>
      </template>

      <template v-else-if="activeNode === 'workspace'">
        <h2>工作区与文件</h2>
        <p class="settings-desc">工作区与文件行为（当前先做 UI）。</p>
        <div class="settings-group">
          <label class="setting-row">
            <span>默认 Default Location（新建项目默认路径）</span>
            <input type="text" value="D:/projects" disabled />
          </label>
          <label class="setting-row">
            <span>最近项目数量</span>
            <select disabled><option>10</option></select>
          </label>
          <label class="setting-row">
            <span>自动保存（开关/间隔）</span>
            <select disabled><option>关闭</option></select>
          </label>
          <label class="setting-row switch-row">
            <span>打开文件时是否加入最近记录</span>
            <input type="checkbox" checked disabled />
          </label>
        </div>
      </template>

      <template v-else-if="activeNode === 'appearance'">
        <h2>界面（UI）</h2>
        <p class="settings-desc">程序外观设置。</p>
        <div class="settings-group">
          <label class="setting-row">
            <span>主题</span>
            <select :value="state.theme" @change="handleThemeChange">
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </label>
          <label class="setting-row">
            <span>语言</span>
            <select :value="state.locale" @change="handleLocaleChange">
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁体中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
            </select>
          </label>
          <label class="setting-row colors">
            <span>强调色</span>
            <div class="color-options">
              <button
                v-for="item in accentOptions"
                :key="item.value"
                type="button"
                class="color-chip"
                :class="{ active: state.accentColor === item.value }"
                :title="item.label"
                :style="{ backgroundColor: item.color }"
                @click="void uiActions.setAccentColor(item.value)"
              />
            </div>
          </label>
          <label class="setting-row">
            <span>紧凑模式/字号（后续可加）</span>
            <select disabled><option>默认</option></select>
          </label>
          <label class="setting-row">
            <span>界面缩放</span>
            <div class="icon-size-field">
              <div class="slider-field">
                <button type="button" class="size-btn" @click="stepIconSize(-1)">-</button>
                <el-slider
                  :model-value="state.iconSize"
                  :min="1"
                  :max="10"
                  :step="1"
                  :show-tooltip="false"
                  show-stops
                  class="icon-size-slider"
                  @update:model-value="handleIconSizePreview"
                  @change="handleIconSizeCommit"
                />
                <button type="button" class="size-btn" @click="stepIconSize(1)">+</button>
                <span class="slider-value">{{ state.iconSize }} / 10</span>
                <span class="slider-label">{{ currentIconSizeLabel }}</span>
                <button type="button" class="size-reset-btn" @click="resetIconSize">重置</button>
              </div>
            </div>
          </label>
        </div>
      </template>

      <template v-else-if="activeNode === 'interaction'">
        <h2>交互</h2>
        <p class="settings-desc">编辑交互行为。</p>
        <div class="settings-group">
          <label class="setting-row switch-row"><span>关闭标签前确认</span><input type="checkbox" checked disabled /></label>
          <label class="setting-row"><span>拖拽行为（标签/面板）</span><select disabled><option>允许</option></select></label>
          <label class="setting-row switch-row">
            <span>主页面左右侧栏浮动时，点击外部区域立即关闭（含关闭动画）</span>
            <el-switch :model-value="state.autoCloseFloatingOnIdle" @change="handleAutoCloseFloatingOnIdleChange" />
          </label>
          <label class="setting-row">
            <span>关闭动画速度</span>
            <select :value="state.floatingCloseAnimationSpeed" @change="handleFloatingCloseAnimationSpeedChange">
              <option value="fast">快</option>
              <option value="normal">标准</option>
              <option value="slow">慢</option>
            </select>
          </label>
          <label class="setting-row"><span>双击打开/单击预览（如果后续有）</span><select disabled><option>双击打开</option></select></label>
          <label class="setting-row switch-row"><span>快捷键提示显示</span><input type="checkbox" checked disabled /></label>
        </div>
      </template>

      <template v-else-if="activeNode === 'channel'">
        <h2>通道管理</h2>
        <p class="settings-desc">统一管理 LIN/CAN/串口通道，并将通道绑定到具体硬件。当前优先支持 PCAN LIN。</p>
        <div class="settings-group">
          <div class="channel-shortcut-title">默认通道快捷操作</div>
          <div class="channel-shortcut-row">
            <span>默认 LIN（{{ defaultChannels.lin }}）</span>
            <button type="button" class="size-reset-btn" @click="handleQuickOpenDefaultLin">打开</button>
            <button type="button" class="size-reset-btn" @click="handleQuickCloseDefaultLin">关闭</button>
            <button type="button" class="size-reset-btn" @click="handleQuickSendDefaultLinTest">发送测试帧</button>
            <span class="channel-status">
              {{ defaultLinStatus.opened ? '已打开' : '未打开' }} / TX: {{ defaultLinStatus.txCount || 0 }} RX: {{ defaultLinStatus.rxCount || 0 }}
            </span>
          </div>
          <div class="channel-shortcut-row">
            <span>默认 CAN（{{ defaultChannels.can }}）</span>
            <button type="button" class="size-reset-btn" @click="handleQuickOpenDefaultCan">打开</button>
            <button type="button" class="size-reset-btn" @click="handleQuickCloseDefaultCan">关闭</button>
            <span class="channel-status">{{ defaultCanStatus.opened ? '已打开' : '未打开' }}</span>
          </div>
          <div class="channel-shortcut-row">
            <span>默认串口（{{ defaultChannels.serial }}）</span>
            <button type="button" class="size-reset-btn" @click="handleQuickOpenDefaultSerial">打开</button>
            <button type="button" class="size-reset-btn" @click="handleQuickCloseDefaultSerial">关闭</button>
            <span class="channel-status">{{ defaultSerialStatus.opened ? '已打开' : '未打开' }}</span>
          </div>
        </div>
        <div class="settings-group">
          <div class="channel-row" v-for="channel in channels" :key="channel.id">
            <div class="channel-info">
              <div class="channel-name">{{ channel.name }}</div>
              <div class="channel-meta">
                类型：{{ channel.type.toUpperCase() }}｜当前绑定：{{ channel.binding.hardwareName || '未绑定' }}｜默认：{{ defaultChannels[channel.type] === channel.id ? '是' : '否' }}
              </div>
            </div>
            <div class="channel-actions">
              <template v-if="channel.type === 'lin'">
                <select
                  :value="linSelections[channel.id] || ''"
                  @change="handleLinSelectionChange(channel.id, $event)"
                >
                  <option value="">请选择硬件</option>
                  <option v-for="item in linHardwareOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
                <button type="button" class="size-reset-btn" @click="handleBindLinChannel(channel.id)">绑定</button>
                <button type="button" class="size-reset-btn" @click="handleUnbindChannel(channel.id)">解绑</button>
                <button type="button" class="size-reset-btn" @click="handleSetDefaultChannel('lin', channel.id)">设为默认</button>
                <select :value="linBaudRates[channel.id]" @change="handleLinBaudRateChange(channel.id, $event)">
                  <option :value="9600">9600</option>
                  <option :value="10400">10400</option>
                  <option :value="19200">19200</option>
                </select>
                <button type="button" class="size-reset-btn" @click="handleOpenLinChannel(channel.id)">打开</button>
                <button type="button" class="size-reset-btn" @click="handleCloseLinChannel(channel.id)">关闭</button>
                <button type="button" class="size-reset-btn" @click="handleSendLinTestFrame(channel.id)">发送测试帧</button>
                <span class="channel-status">
                  {{ linStatusMap[channel.id]?.opened ? '已打开' : '未打开' }} / TX: {{ linStatusMap[channel.id]?.txCount || 0 }} RX: {{ linStatusMap[channel.id]?.rxCount || 0 }}
                </span>
              </template>
              <template v-else-if="channel.type === 'can'">
                <select :value="canSelections[channel.id] || ''" @change="handleCanSelectionChange(channel.id, $event)">
                  <option value="">请选择硬件</option>
                  <option v-for="item in canHardwareOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
                <button type="button" class="size-reset-btn" @click="handleBindCanChannel(channel.id)">绑定</button>
                <button type="button" class="size-reset-btn" @click="handleSetDefaultChannel('can', channel.id)">设为默认</button>
                <select :value="canBitrates[channel.id]" @change="handleCanBitrateChange(channel.id, $event)">
                  <option :value="125000">125K</option>
                  <option :value="500000">500K</option>
                  <option :value="1000000">1M</option>
                </select>
                <button type="button" class="size-reset-btn" @click="handleOpenCanChannel(channel.id)">打开</button>
                <button type="button" class="size-reset-btn" @click="handleCloseCanChannel(channel.id)">关闭</button>
                <span class="channel-status">{{ canStatusMap[channel.id]?.opened ? '已打开' : '未打开' }}</span>
              </template>
              <template v-else>
                <select :value="serialSelections[channel.id] || ''" @change="handleSerialSelectionChange(channel.id, $event)">
                  <option value="">请选择串口</option>
                  <option v-for="item in serialHardwareOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
                <button type="button" class="size-reset-btn" @click="handleBindSerialChannel(channel.id)">绑定</button>
                <button type="button" class="size-reset-btn" @click="handleSetDefaultChannel('serial', channel.id)">设为默认</button>
                <select :value="serialBaudRates[channel.id]" @change="handleSerialBaudRateChange(channel.id, $event)">
                  <option :value="9600">9600</option>
                  <option :value="115200">115200</option>
                  <option :value="460800">460800</option>
                </select>
                <button type="button" class="size-reset-btn" @click="handleOpenSerialChannel(channel.id)">打开</button>
                <button type="button" class="size-reset-btn" @click="handleCloseSerialChannel(channel.id)">关闭</button>
                <span class="channel-status">{{ serialStatusMap[channel.id]?.opened ? '已打开' : '未打开' }}</span>
              </template>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <h2>基础</h2>
        <p class="settings-desc">基础与通用（当前先做 UI）。</p>
        <div class="settings-group">
          <label class="setting-row"><span>应用版本信息</span><input type="text" value="vehray 1.0.0" disabled /></label>
          <label class="setting-row"><span>更新通道（稳定/测试）</span><select disabled><option>稳定</option></select></label>
          <label class="setting-row switch-row"><span>遥测与诊断（如果有）</span><input type="checkbox" disabled /></label>
          <label class="setting-row"><span>重置设置</span><button type="button" class="size-reset-btn" disabled>重置</button></label>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useUiState } from '../../../state/uiState';
import { uiActions } from '../../../services/uiActions';
import { electronBridge } from '../../../services/electronBridge';

type LocaleType = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR';
type AccentColorType = 'default' | 'blue' | 'green' | 'purple' | 'orange';
type IconLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type ChannelType = 'lin' | 'can' | 'serial';
type ChannelPreferences = {
  defaults: Record<ChannelType, string>;
  linBaudRates: Record<string, number>;
  canBitrates: Record<string, number>;
  serialBaudRates: Record<string, number>;
};
const CHANNEL_SETTINGS_KEY = 'channelPreferences';

const activeNode = ref<'startup' | 'workspace' | 'appearance' | 'interaction' | 'channel' | 'basic'>('startup');
const channels = ref<Array<{
  id: string;
  name: string;
  type: 'lin' | 'can' | 'serial';
  enabled: boolean;
  binding: { hardwareId: string | null; hardwareName: string | null };
}>>([]);
const linHardwareOptions = ref<Array<{ id: string; name: string }>>([]);
const canHardwareOptions = ref<Array<{ id: string; name: string }>>([]);
const serialHardwareOptions = ref<Array<{ id: string; name: string }>>([]);
const linSelections = reactive<Record<string, string>>({});
const linBaudRates = reactive<Record<string, number>>({});
const linStatusMap = reactive<Record<string, { opened?: boolean; txCount?: number; rxCount?: number; hardwareName?: string | null }>>({});
const canSelections = reactive<Record<string, string>>({});
const canBitrates = reactive<Record<string, number>>({});
const canStatusMap = reactive<Record<string, { opened?: boolean; bitrate?: number }>>({});
const serialSelections = reactive<Record<string, string>>({});
const serialBaudRates = reactive<Record<string, number>>({});
const serialStatusMap = reactive<Record<string, { opened?: boolean }>>({});
const defaultChannels = reactive<Record<ChannelType, string>>({
  lin: 'lin-primary',
  can: 'can-primary',
  serial: 'serial-primary'
});
const defaultLinStatus = reactive<{ opened?: boolean; txCount?: number; rxCount?: number }>({});
const defaultCanStatus = reactive<{ opened?: boolean; bitrate?: number }>({});
const defaultSerialStatus = reactive<{ opened?: boolean }>({});
const { state } = useUiState();
const accentOptions: Array<{ value: AccentColorType; label: string; color: string }> = [
  { value: 'default', label: '默认', color: '#6b7280' },
  { value: 'blue', label: '蓝色', color: '#3b82f6' },
  { value: 'green', label: '绿色', color: '#22c55e' },
  { value: 'purple', label: '紫色', color: '#a855f7' },
  { value: 'orange', label: '橙色', color: '#f97316' }
];

const handleToggleShowHomeOnLaunch = (checked: boolean | string | number) => {
  void uiActions.setShowHomeOnLaunch(Boolean(checked));
};
const handleThemeChange = (event: Event) => {
  const theme = (event.target as HTMLSelectElement).value as 'dark' | 'light';
  void uiActions.setTheme(theme);
};
const handleLocaleChange = (event: Event) => {
  const locale = (event.target as HTMLSelectElement).value as LocaleType;
  void uiActions.setLocale(locale);
};
const handleAutoCloseFloatingOnIdleChange = (checked: boolean | string | number) => {
  void uiActions.setAutoCloseFloatingOnIdle(Boolean(checked));
};
const handleFloatingCloseAnimationSpeedChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'fast' || value === 'normal' || value === 'slow') {
    void uiActions.setFloatingCloseAnimationSpeed(value);
  }
};
const normalizeScaleValue = (value: number) => Math.min(10, Math.max(1, Math.round(value))) as IconLevel;

const handleIconSizePreview = (value: number) => {
  if (!Number.isFinite(value)) return;
  void uiActions.setIconSize(normalizeScaleValue(value), false);
};
const handleIconSizeCommit = (value: number) => {
  if (!Number.isFinite(value)) return;
  void uiActions.setIconSize(normalizeScaleValue(value), true);
};
const stepIconSize = (delta: -1 | 1) => {
  const next = Math.min(10, Math.max(1, state.iconSize + delta)) as IconLevel;
  void uiActions.setIconSize(next);
};
const resetIconSize = () => void uiActions.setIconSize(4);
const currentIconSizeLabel = computed(() => {
  if (state.iconSize <= 2) return '紧凑';
  if (state.iconSize <= 4) return '标准';
  if (state.iconSize <= 7) return '舒适';
  return '宽松';
});

const loadChannels = async () => {
  channels.value = await electronBridge.listChannels();
  channels.value.forEach((channel) => {
    linSelections[channel.id] = channel.binding.hardwareId || '';
    if (!linBaudRates[channel.id]) {
      linBaudRates[channel.id] = 19200;
    }
    canSelections[channel.id] = channel.binding.hardwareId || '';
    if (!canBitrates[channel.id]) {
      canBitrates[channel.id] = 500000;
    }
    serialSelections[channel.id] = channel.binding.hardwareId || '';
    if (!serialBaudRates[channel.id]) {
      serialBaudRates[channel.id] = 115200;
    }
  });
};

const persistChannelPreferences = async () => {
  const settings = (await electronBridge.readSettings<Record<string, unknown>>()) ?? {};
  const payload: ChannelPreferences = {
    defaults: { ...defaultChannels },
    linBaudRates: { ...linBaudRates },
    canBitrates: { ...canBitrates },
    serialBaudRates: { ...serialBaudRates }
  };
  await electronBridge.writeSettings({
    ...settings,
    [CHANNEL_SETTINGS_KEY]: payload
  });
};

const loadChannelPreferences = async () => {
  const settings = (await electronBridge.readSettings<Record<string, unknown>>()) ?? {};
  const saved = (settings[CHANNEL_SETTINGS_KEY] as Partial<ChannelPreferences> | undefined) ?? {};
  if (saved.defaults?.lin) defaultChannels.lin = saved.defaults.lin;
  if (saved.defaults?.can) defaultChannels.can = saved.defaults.can;
  if (saved.defaults?.serial) defaultChannels.serial = saved.defaults.serial;
  if (saved.linBaudRates) Object.assign(linBaudRates, saved.linBaudRates);
  if (saved.canBitrates) Object.assign(canBitrates, saved.canBitrates);
  if (saved.serialBaudRates) Object.assign(serialBaudRates, saved.serialBaudRates);
};

const loadLinHardwareOptions = async () => {
  const options = await electronBridge.listChannelHardwareOptions('lin');
  linHardwareOptions.value = options.map((item) => ({ id: item.id, name: item.name }));
};

const loadCanHardwareOptions = async () => {
  const options = await electronBridge.listChannelHardwareOptions('can');
  canHardwareOptions.value = options.map((item) => ({ id: item.id, name: item.name }));
};

const loadSerialHardwareOptions = async () => {
  const options = await electronBridge.listChannelHardwareOptions('serial');
  serialHardwareOptions.value = options.map((item) => ({ id: item.id, name: item.name }));
};

const handleEnterChannelNode = async () => {
  activeNode.value = 'channel';
  await Promise.all([loadChannels(), loadLinHardwareOptions(), loadCanHardwareOptions(), loadSerialHardwareOptions()]);
};

const handleLinSelectionChange = (channelId: string, event: Event) => {
  linSelections[channelId] = (event.target as HTMLSelectElement).value;
};
const handleCanSelectionChange = (channelId: string, event: Event) => {
  canSelections[channelId] = (event.target as HTMLSelectElement).value;
};
const handleSerialSelectionChange = (channelId: string, event: Event) => {
  serialSelections[channelId] = (event.target as HTMLSelectElement).value;
};

const handleLinBaudRateChange = (channelId: string, event: Event) => {
  linBaudRates[channelId] = Number((event.target as HTMLSelectElement).value);
  void persistChannelPreferences();
};
const handleCanBitrateChange = (channelId: string, event: Event) => {
  canBitrates[channelId] = Number((event.target as HTMLSelectElement).value);
  void persistChannelPreferences();
};
const handleSerialBaudRateChange = (channelId: string, event: Event) => {
  serialBaudRates[channelId] = Number((event.target as HTMLSelectElement).value);
  void persistChannelPreferences();
};

const handleBindLinChannel = async (channelId: string) => {
  const hardwareId = linSelections[channelId];
  if (!hardwareId) return;
  await electronBridge.bindChannelHardware({ channelId, hardwareId });
  await loadChannels();
  await refreshLinStatus(channelId);
  await persistChannelPreferences();
};

const handleUnbindChannel = async (channelId: string) => {
  await electronBridge.unbindChannelHardware(channelId);
  linSelections[channelId] = '';
  linStatusMap[channelId] = { opened: false };
  await loadChannels();
  await persistChannelPreferences();
};

const handleSetDefaultChannel = async (channelType: ChannelType, channelId: string) => {
  const success = await electronBridge.setDefaultChannel({ channelType, channelId });
  if (!success) return;
  defaultChannels[channelType] = channelId;
  await refreshDefaultStatuses();
  await persistChannelPreferences();
};

const refreshLinStatus = async (channelId: string) => {
  const status = defaultChannels.lin === channelId
    ? await electronBridge.getDefaultLinChannelStatus()
    : await electronBridge.getLinChannelStatus(channelId);
  if (!status) return;
  linStatusMap[channelId] = {
    opened: status.opened,
    txCount: status.txCount,
    rxCount: status.rxCount,
    hardwareName: status.hardwareName
  };
};

const handleOpenLinChannel = async (channelId: string) => {
  const baudRate = linBaudRates[channelId] || 19200;
  if (defaultChannels.lin === channelId) {
    await electronBridge.openDefaultLinChannel({ baudRate });
  } else {
    await electronBridge.openLinChannel({ channelId, baudRate });
  }
  await refreshLinStatus(channelId);
};

const handleCloseLinChannel = async (channelId: string) => {
  if (defaultChannels.lin === channelId) {
    await electronBridge.closeDefaultLinChannel();
  } else {
    await electronBridge.closeLinChannel(channelId);
  }
  await refreshLinStatus(channelId);
};

const handleSendLinTestFrame = async (channelId: string) => {
  if (defaultChannels.lin === channelId) {
    await electronBridge.sendLinFrameByDefaultChannel({
      id: 0x12,
      data: [0x01, 0x02, 0x03, 0x04],
      checksumType: 'enhanced'
    });
  } else {
    await electronBridge.sendLinFrameByChannel({
      channelId,
      id: 0x12,
      data: [0x01, 0x02, 0x03, 0x04],
      checksumType: 'enhanced'
    });
  }
  await refreshLinStatus(channelId);
};

const refreshCanStatus = async (channelId: string) => {
  const status = defaultChannels.can === channelId
    ? await electronBridge.getDefaultCanChannelStatus()
    : await electronBridge.getCanChannelStatus(channelId);
  if (!status) return;
  canStatusMap[channelId] = {
    opened: status.opened,
    bitrate: status.bitrate
  };
};

const refreshSerialStatus = async (channelId: string) => {
  const status = defaultChannels.serial === channelId
    ? await electronBridge.getDefaultSerialChannelStatus()
    : await electronBridge.getSerialChannelStatus(channelId);
  if (!status) return;
  serialStatusMap[channelId] = {
    opened: status.opened
  };
};

const handleBindCanChannel = async (channelId: string) => {
  const hardwareId = canSelections[channelId];
  if (!hardwareId) return;
  await electronBridge.bindChannelHardware({ channelId, hardwareId });
  await loadChannels();
  await refreshCanStatus(channelId);
  await persistChannelPreferences();
};

const handleOpenCanChannel = async (channelId: string) => {
  const bitrate = canBitrates[channelId] || 500000;
  if (defaultChannels.can === channelId) {
    await electronBridge.openDefaultCanChannel({ bitrate });
  } else {
    await electronBridge.openCanChannel({ channelId, bitrate });
  }
  await refreshCanStatus(channelId);
};

const handleCloseCanChannel = async (channelId: string) => {
  if (defaultChannels.can === channelId) {
    await electronBridge.closeDefaultCanChannel();
  } else {
    await electronBridge.closeCanChannel(channelId);
  }
  await refreshCanStatus(channelId);
};

const handleBindSerialChannel = async (channelId: string) => {
  const hardwareId = serialSelections[channelId];
  if (!hardwareId) return;
  await electronBridge.bindChannelHardware({ channelId, hardwareId });
  await loadChannels();
  await refreshSerialStatus(channelId);
  await persistChannelPreferences();
};

const handleOpenSerialChannel = async (channelId: string) => {
  const baudRate = serialBaudRates[channelId] || 115200;
  if (defaultChannels.serial === channelId) {
    await electronBridge.openDefaultSerialChannel({ baudRate });
  } else {
    await electronBridge.openSerialChannel({ channelId, baudRate });
  }
  await refreshSerialStatus(channelId);
};

const handleCloseSerialChannel = async (channelId: string) => {
  if (defaultChannels.serial === channelId) {
    await electronBridge.closeDefaultSerialChannel();
  } else {
    await electronBridge.closeSerialChannel(channelId);
  }
  await refreshSerialStatus(channelId);
};

const refreshDefaultStatuses = async () => {
  const [lin, can, serial] = await Promise.all([
    electronBridge.getDefaultLinChannelStatus(),
    electronBridge.getDefaultCanChannelStatus(),
    electronBridge.getDefaultSerialChannelStatus()
  ]);
  if (lin) {
    defaultLinStatus.opened = lin.opened;
    defaultLinStatus.txCount = lin.txCount;
    defaultLinStatus.rxCount = lin.rxCount;
  }
  if (can) {
    defaultCanStatus.opened = can.opened;
    defaultCanStatus.bitrate = can.bitrate;
  }
  if (serial) {
    defaultSerialStatus.opened = serial.opened;
  }
};

const handleQuickOpenDefaultLin = async () => {
  const baudRate = linBaudRates[defaultChannels.lin] || 19200;
  await electronBridge.openDefaultLinChannel({ baudRate });
  await refreshDefaultStatuses();
  await refreshLinStatus(defaultChannels.lin);
};

const handleQuickCloseDefaultLin = async () => {
  await electronBridge.closeDefaultLinChannel();
  await refreshDefaultStatuses();
  await refreshLinStatus(defaultChannels.lin);
};

const handleQuickSendDefaultLinTest = async () => {
  await electronBridge.sendLinFrameByDefaultChannel({
    id: 0x22,
    data: [0x10, 0x20, 0x30, 0x40],
    checksumType: 'enhanced'
  });
  await refreshDefaultStatuses();
  await refreshLinStatus(defaultChannels.lin);
};

const handleQuickOpenDefaultCan = async () => {
  const bitrate = canBitrates[defaultChannels.can] || 500000;
  await electronBridge.openDefaultCanChannel({ bitrate });
  await refreshDefaultStatuses();
  await refreshCanStatus(defaultChannels.can);
};

const handleQuickCloseDefaultCan = async () => {
  await electronBridge.closeDefaultCanChannel();
  await refreshDefaultStatuses();
  await refreshCanStatus(defaultChannels.can);
};

const handleQuickOpenDefaultSerial = async () => {
  const baudRate = serialBaudRates[defaultChannels.serial] || 115200;
  await electronBridge.openDefaultSerialChannel({ baudRate });
  await refreshDefaultStatuses();
  await refreshSerialStatus(defaultChannels.serial);
};

const handleQuickCloseDefaultSerial = async () => {
  await electronBridge.closeDefaultSerialChannel();
  await refreshDefaultStatuses();
  await refreshSerialStatus(defaultChannels.serial);
};

onMounted(async () => {
  await loadChannelPreferences();
  const defaults = await electronBridge.getDefaultChannels();
  if (defaults) {
    defaultChannels.lin = defaults.lin;
    defaultChannels.can = defaults.can;
    defaultChannels.serial = defaults.serial;
  }
  await loadChannels();
  await refreshDefaultStatuses();
});
</script>

<style scoped>
.settings-view { height: 100%; display: grid; grid-template-columns: 220px 1fr; background: var(--app-bg); }
.settings-tree { border-right: 1px solid var(--app-border); padding: 16px 12px; background: var(--app-bg-elevated); }
.tree-title { font-size: 13px; color: var(--app-text-primary); margin-bottom: 10px; font-weight: 600; }
.tree-node { width: 100%; border: 1px solid transparent; background: transparent; color: var(--app-text-regular); text-align: left; padding: 8px 10px; border-radius: 6px; cursor: pointer; margin-bottom: 6px; }
.tree-node:hover { background: var(--app-bg-hover); }
.tree-node.active { border-color: var(--app-border); background: color-mix(in srgb, var(--app-accent) 50%, transparent); color: var(--app-text-primary); }
.settings-content { padding: 20px 24px; overflow: auto; }
.settings-desc { color: var(--app-text-muted); font-size: 12px; margin-bottom: 12px; }
.settings-group { border: 1px solid var(--app-border); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; background: var(--app-bg-elevated); }
.setting-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; color: var(--app-text-regular); }
.setting-row + .setting-row { border-top: 1px solid var(--app-border); }
.setting-row select,.setting-row input[type='text'] { min-width: 220px; height: 30px; border: 1px solid var(--app-border); border-radius: 6px; background: var(--app-bg); color: var(--app-text-primary); padding: 0 8px; }
.setting-row.colors { flex-direction: column; align-items: flex-start; }
.color-options { display: flex; gap: 10px; }
.color-chip { width: 20px; height: 20px; border-radius: 999px; border: 2px solid transparent; cursor: pointer; }
.color-chip.active { border-color: var(--app-text-primary); }
.icon-size-field { min-width: 460px; }
.slider-field { display: inline-flex; align-items: center; gap: 10px; min-width: 460px; }
.icon-size-slider { width: 180px; }
.slider-value { min-width: 48px; text-align: right; color: var(--app-text-muted); font-size: 12px; }
.slider-label { min-width: 36px; color: var(--app-text-regular); font-size: 12px; }
.size-btn,.size-reset-btn { border: 1px solid var(--app-border); background: var(--app-bg-elevated); color: var(--app-text-regular); border-radius: 6px; height: 24px; line-height: 22px; padding: 0 8px; cursor: pointer; }
.size-btn { width: 24px; padding: 0; }
.setting-row :disabled,.size-reset-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.channel-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; }
.channel-row + .channel-row { border-top: 1px solid var(--app-border); }
.channel-info { display: flex; flex-direction: column; gap: 4px; }
.channel-name { color: var(--app-text-primary); font-size: 13px; font-weight: 600; }
.channel-meta { color: var(--app-text-muted); font-size: 12px; }
.channel-actions { display: flex; align-items: center; gap: 8px; }
.channel-actions select { min-width: 260px; height: 30px; border: 1px solid var(--app-border); border-radius: 6px; background: var(--app-bg); color: var(--app-text-primary); padding: 0 8px; }
.channel-status { color: var(--app-text-muted); font-size: 12px; min-width: 180px; text-align: right; }
.channel-todo { margin-right: 12px; }
.channel-shortcut-title { color: var(--app-text-primary); font-size: 13px; font-weight: 600; margin-bottom: 10px; }
.channel-shortcut-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
.channel-shortcut-row + .channel-shortcut-row { border-top: 1px solid var(--app-border); }
</style>
