<template>
  <div class="settings-view">
    <aside class="settings-tree">
      <div class="tree-title">应用程序设置</div>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'startup' }" @click="activeNode = 'startup'">启动与恢复</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'workspace' }" @click="activeNode = 'workspace'">工作区与文件</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'appearance' }" @click="activeNode = 'appearance'">界面（UI）</button>
      <button type="button" class="tree-node" :class="{ active: activeNode === 'interaction' }" @click="activeNode = 'interaction'">交互</button>
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
            <span>主页面“浮动覆盖主区域”自动关闭（立即）</span>
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
import { computed, ref } from 'vue';
import { useUiState } from '../../../state/uiState';
import { uiActions } from '../../../services/uiActions';

type LocaleType = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR';
type AccentColorType = 'default' | 'blue' | 'green' | 'purple' | 'orange';
type IconLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const activeNode = ref<'startup' | 'workspace' | 'appearance' | 'interaction' | 'basic'>('startup');
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
</style>
