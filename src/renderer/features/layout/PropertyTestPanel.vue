<template>
  <div class="property-test-panel">
    <section class="panel-section">
      <div class="section-title">测试组件信息</div>
      <div class="field-list">
        <label class="field-item">
          <span class="field-label">名称</span>
          <input v-model="form.name" class="field-input" type="text" />
        </label>
        <label class="field-item">
          <span class="field-label">类型</span>
          <select v-model="form.type" class="field-input">
            <option value="file">文件</option>
            <option value="directory">文件夹</option>
            <option value="device">设备</option>
          </select>
        </label>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-title">布局测试参数</div>
      <div class="field-list">
        <label class="field-item">
          <span class="field-label">宽度</span>
          <input v-model.number="form.width" class="field-input" type="number" min="120" max="2000" />
        </label>
        <label class="field-item">
          <span class="field-label">高度</span>
          <input v-model.number="form.height" class="field-input" type="number" min="80" max="1200" />
        </label>
        <label class="field-item checkbox-field">
          <input v-model="form.lockRatio" type="checkbox" />
          <span>锁定宽高比</span>
        </label>
      </div>
    </section>

    <section class="panel-section preview-section">
      <div class="section-title">预览数据</div>
      <pre class="preview-json">{{ preview }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';

const form = reactive({
  name: '未命名组件',
  type: 'file',
  width: 320,
  height: 180,
  lockRatio: false
});

const preview = computed(() =>
  JSON.stringify(
    {
      ...form,
      ratio: `${form.width}:${form.height}`
    },
    null,
    2
  )
);
</script>

<style scoped>
.property-test-panel {
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

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 8px;
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

.field-input {
  width: 100%;
  height: 28px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-bg);
  color: var(--app-text-regular);
  padding: 0 8px;
  font-size: 12px;
}

.field-input:focus {
  outline: none;
  border-color: #3a7bd5;
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--app-text-regular);
  font-size: 12px;
}

.preview-section {
  min-height: 150px;
}

.preview-json {
  margin: 0;
  padding: 8px;
  border-radius: 4px;
  background: var(--app-bg);
  border: 1px solid var(--app-border);
  color: var(--app-text-regular);
  font-size: 11px;
  line-height: 1.4;
  overflow: auto;
}
</style>
