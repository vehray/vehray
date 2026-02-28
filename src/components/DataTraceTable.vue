<template>
  <div class="data-trace-table-wrapper">
    <!-- 数据追踪控制面板 -->
    <div class="trace-control-panel">
      <div class="trace-controls-container">
        <!-- 搜索框 -->
        <div class="trace-control-item search-item">
          <el-input
            v-model="localSearch.keyword"
            placeholder="搜索ID或数据"
            clearable
            size="small"
            style="width: 200px"
          >
            <template #append>
              <el-button @click="applyFilters" size="small">搜索</el-button>
            </template>
          </el-input>
        </div>
        
        <!-- 方向选择 -->
        <div class="trace-control-item">
          <el-select
            v-model="localSearch.direction"
            placeholder="方向"
            clearable
            size="small"
            @change="applyFilters"
            style="width: 100px"
          >
            <el-option label="发送" :value="'发送'"></el-option>
            <el-option label="接收" :value="'接收'"></el-option>
          </el-select>
        </div>
        
        <!-- 通道选择 -->
        <div class="trace-control-item">
          <el-select
            v-model="localSearch.channel"
            placeholder="通道"
            clearable
            size="small"
            @change="applyFilters"
            style="width: 80px"
          >
            <el-option label="通道1" :value="'1'"></el-option>
          </el-select>
        </div>
        
        <!-- 追踪开关 -->
        <div class="trace-control-item">
          <el-switch
            :model-value="traceEnabled"
            @update:model-value="handleTraceEnabledChange"
            active-text="追踪开启"
            inactive-text="追踪关闭"
            size="small"
          ></el-switch>
        </div>
        
        <!-- 模式切换 -->
        <div class="trace-control-item">
          <span class="mode-label mr-2">模式:</span>
          <el-radio-group
            :model-value="traceMode"
            @update:model-value="handleTraceModeChange"
            size="small"
          >
            <el-radio-button label="scroll">滚动</el-radio-button>
            <el-radio-button label="overlay">覆盖</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 记录统计 -->
        <div class="trace-control-item">
          <el-badge :value="totalFrames" type="info" class="mr-2">
            总记录
          </el-badge>
        </div>
        
        <!-- 筛选结果 -->
        <div class="trace-control-item">
          <span class="trace-total">共 {{ filteredFrames.length }} 条记录</span>
        </div>
        
        <!-- 操作按钮组 -->
        <div class="trace-control-item action-buttons">
          <el-button type="info" size="small" @click="resetFilters">重置筛选</el-button>
          <el-button type="info" size="small" @click="clearData" class="ml-2">清空</el-button>
          <el-button type="primary" size="small" @click="exportData" class="ml-2">导出</el-button>
        </div>
      </div>
    </div>
    
    <!-- 数据追踪表格 -->
    <div ref="tableContainerRef" class="trace-table-container">
      <el-table 
        ref="tableRef" 
        :data="paginatedFrames" 
        style="width: 100%" 
        size="small" 
        stripe 
        header-cell-class-name="table-header-cell"
        :height="tableHeight"
      >
        <el-table-column type="index" label="序号" width="60" :index="index => index + 1"></el-table-column>
        <el-table-column prop="timestamp" label="时间" width="160"></el-table-column>
        <el-table-column prop="direction" label="方向" width="70">
          <template #default="scope">
            <el-tag :type="scope.row.direction === '发送' ? 'primary' : 'success'" size="small">
              {{ scope.row.direction }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="通道" width="70"></el-table-column>
        <el-table-column prop="id" label="ID" width="70" :filters="idFilters" :filter-method="filterId"></el-table-column>
        <el-table-column prop="pid" label="PID" width="80">
          <template #default="scope">
            <el-tag type="info" size="small">{{ scope.row.pid || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="data" label="数据" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="checksum" label="校验和" width="80"></el-table-column>
        <el-table-column prop="checksumType" label="校验类型" width="90">
          <template #default="scope">
            <el-tag type="info" size="small">{{ scope.row.checksumType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checksumValid" label="校验状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.checksumValid ? 'success' : 'danger'" size="small">
              {{ scope.row.checksumValid ? '正确' : '错误' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 加载中指示器 -->
    <div v-if="isLoading" class="loading-indicator">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    
    <!-- 分页控件容器 -->
    <div class="trace-pagination-container">
      <!-- 分页控件 -->
      <div class="trace-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredFrames.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

// 定义类型
interface ReceivedFrame {
  id: string;
  direction: string;
  channel: string;
  timestamp: string;
  data: string;
  pid?: string;
  checksum: string;
  checksumType: string;
  checksumValid: boolean;
}

interface TraceSearch {
  keyword: string;
  direction: string;
  channel: string;
}

// Props
const props = defineProps<{
  frames: ReceivedFrame[];
  traceEnabled: boolean;
  traceMode: string;
  currentBusId: string;
}>();

// 为了在模板中使用，创建引用
const traceEnabled = computed(() => props.traceEnabled);
const traceMode = computed(() => props.traceMode);
const currentBusId = computed(() => props.currentBusId);

// Emits
const emit = defineEmits<{
  (e: 'update:traceEnabled', value: boolean): void;
  (e: 'update:traceMode', value: string): void;
  (e: 'update:currentBusId', value: string): void;
  (e: 'clear'): void;
  (e: 'export'): void;
  (e: 'loadMore'): void;
}>();

// 响应式数据
const tableContainerRef = ref<HTMLElement | null>(null);
const tableRef = ref<InstanceType<any> | null>(null);
const tableHeight = ref<string>('100%');
const localSearch = ref<TraceSearch>({
  keyword: '',
  direction: '',
  channel: ''
});
const currentPage = ref(1);
const pageSize = ref(20);
const isLoading = ref(false);
const idFilters = ref<Array<{ text: string; value: string }>>([]);

// 计算属性
const totalFrames = computed(() => props.frames.length);

// 过滤后的数据
const filteredFrames = computed(() => {
  return props.frames.filter(frame => {
    // 关键词过滤
    const matchesKeyword = !localSearch.value.keyword || 
      frame.id.includes(localSearch.value.keyword) || 
      frame.data.includes(localSearch.value.keyword);
    
    // 方向过滤
    const matchesDirection = !localSearch.value.direction || 
      frame.direction === localSearch.value.direction;
    
    // 通道过滤
    const matchesChannel = !localSearch.value.channel || 
      frame.channel === localSearch.value.channel;
    
    return matchesKeyword && matchesDirection && matchesChannel;
  });
});

// 分页后的数据
const paginatedFrames = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredFrames.value.slice(startIndex, endIndex);
});

// 方法
const generateIdFilters = () => {
  // 从数据中提取唯一的ID
  const uniqueIds = [...new Set(props.frames.map(frame => frame.id))];
  // 生成筛选选项
  idFilters.value = uniqueIds.map(id => ({
    text: id,
    value: id
  }));
};

const filterId = (value: string, row: ReceivedFrame) => {
  return row.id === value;
};

const applyFilters = () => {
  currentPage.value = 1;
};

const resetFilters = () => {
  localSearch.value = {
    keyword: '',
    direction: '',
    channel: ''
  };
  currentPage.value = 1;
};

const clearData = () => {
  emit('clear');
};

const exportData = () => {
  emit('export');
};

const handleTraceEnabledChange = (value) => {
  emit('update:traceEnabled', value);
};

const handleTraceModeChange = (value) => {
  emit('update:traceMode', value);
};

const handleCurrentBusIdChange = (value) => {
  emit('update:currentBusId', value);
};

const calculateTableHeight = () => {
  if (tableContainerRef.value) {
    const wrapper = tableContainerRef.value.parentElement;
    if (wrapper) {
      // 计算可用高度：容器高度减去控制面板高度和分页控件高度
      const wrapperHeight = wrapper.clientHeight;
      const controlPanel = wrapper.querySelector('.trace-control-panel');
      const controlPanelHeight = controlPanel ? controlPanel.clientHeight : 0;
      const paginationContainer = wrapper.querySelector('.trace-pagination-container');
      const paginationHeight = paginationContainer ? paginationContainer.clientHeight : 0;
      
      // 计算表格容器的可用高度
      const availableHeight = wrapperHeight - controlPanelHeight - paginationHeight - 16; // 减去额外的间距
      
      // 确保最小高度
      const minHeight = 100;
      const finalHeight = Math.max(minHeight, availableHeight);
      
      tableHeight.value = `${finalHeight}px`;
    }
  }
};

// 分页处理函数
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current: number) => {
  currentPage.value = current;
};

// 监听数据变化
watch(() => props.frames, () => {
  generateIdFilters();
}, { deep: true });

// 监听窗口大小变化
const handleResize = () => {
  calculateTableHeight();
};

// 使用ResizeObserver监听容器大小变化
let resizeObserver: ResizeObserver | null = null;

const setupResizeObserver = () => {
  // 监听整个data-trace-table-wrapper的大小变化
  const wrapper = tableContainerRef.value?.parentElement;
  if (wrapper) {
    resizeObserver = new ResizeObserver(() => {
      calculateTableHeight();
    });
    resizeObserver.observe(wrapper);
  }
  // 同时监听表格容器本身的大小变化
  if (tableContainerRef.value) {
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        calculateTableHeight();
      });
    }
    resizeObserver.observe(tableContainerRef.value);
  }
};

const cleanupResizeObserver = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
};

// 生命周期
onMounted(() => {
  generateIdFilters();
  calculateTableHeight();
  window.addEventListener('resize', handleResize);
  setupResizeObserver();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  cleanupResizeObserver();
});
</script>

<style scoped>
.data-trace-table-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

/* 确保表格容器和分页控件的布局正确 */
.data-trace-table-wrapper > * {
  box-sizing: border-box;
}

/* 控制面板 */
.trace-control-panel {
  flex-shrink: 0;
  margin-bottom: 8px;
}

/* 表格容器 */
.trace-table-container {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 分页控件容器 */
  .trace-pagination-container {
    flex-shrink: 0;
    margin-top: 8px;
  }

  .trace-pagination-container .trace-pagination {
    max-width: 100%;
    margin: 0 auto;
  }

.trace-control-panel {
  flex-shrink: 0;
  padding: 8px;
  background-color: var(--fluent-surface);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--fluent-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.trace-controls-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  flex-wrap: wrap;
  gap: 8px;
}

.trace-control-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.trace-controls-container .el-button {
  margin: 0;
}

.trace-control-item.action-buttons {
  margin-left: auto;
}

.trace-total {
  font-size: 12px;
  color: var(--fluent-text-secondary);
}

.trace-table-container {
    flex: 1;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
    background-color: white;
    border-radius: 8px;
    border: 1px solid var(--fluent-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    position: relative;
  }

/* 表格样式 */
:deep(.el-table) {
  width: 100%;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
}

/* 表头样式 */
:deep(.table-header-cell) {
  background-color: var(--fluent-surface) !important;
  font-weight: 600;
  color: var(--fluent-text-primary);
  border-bottom: 1px solid var(--fluent-border) !important;
}

/* 表格主体区域 */
:deep(.el-table__body-wrapper) {
  max-height: calc(100% - 40px) !important;
  overflow-y: auto !important;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border) var(--fluent-surface);
  box-sizing: border-box;
}

/* 滚动条样式 */
:deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: var(--fluent-surface);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: var(--fluent-border);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: var(--fluent-border-hover);
}

/* 加载指示器 */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.loading-indicator .is-loading {
  font-size: 16px;
  color: var(--el-color-primary);
}

/* 分页控件样式 */
  .trace-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    box-sizing: border-box;
  }

.trace-pagination :deep(.el-pagination) {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .trace-controls-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .trace-control-item {
    margin-bottom: 8px;
  }
  
  .trace-control-item.action-buttons {
    margin-left: 0;
    justify-content: center;
  }
  
  .trace-pagination {
    padding: 8px;
  }
  
  .trace-pagination :deep(.el-pagination) {
    font-size: 12px;
  }
  
  .trace-pagination :deep(.el-pagination__page-btn) {
    margin: 0 1px;
    padding: 0 6px;
    height: 20px;
    line-height: 20px;
  }
}
</style>