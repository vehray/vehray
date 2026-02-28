<template>
  <el-container class="app-container">
    <!-- 自定义窗口栏 -->
    <el-header class="custom-titlebar" id="custom-titlebar">
      <!-- 左侧：应用标题（可拖拽区域） -->
      <div class="app-title" id="drag-region">
        <el-icon class="app-icon"><DataAnalysis /></el-icon>
        <h1 class="title">LINAnalyzer</h1>
      </div>
      
      <!-- 右侧：窗口控制按钮 -->
      <div class="window-controls">
        <button class="window-btn minimize-btn" @click="minimizeWindow" title="最小化">
          <span class="btn-icon">_</span>
        </button>
        <button class="window-btn maximize-btn" @click="maximizeWindow" :title="windowState.isMaximized ? '还原' : '最大化'">
          <span class="btn-icon">{{ windowState.isMaximized ? '▢' : '□' }}</span>
        </button>
        <button class="window-btn close-btn" @click="closeWindow" title="关闭">
          <span class="btn-icon">×</span>
        </button>
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <div class="main-content-container">
      <!-- 左侧导航菜单 -->
      <div class="navigation-sidebar" 
           :style="{ width: `${sidebarWidth}px` }"
           :class="{ 'collapsed': isMenuCollapsed }">
        <NavigationMenu
          :menu-items="buttonBarItems"
          :active-key="activeTab"
          :is-collapsed="isMenuCollapsed"
          :auto-collapse="true"
          :auto-collapse-threshold="1024"
          @select="handleMenuSelect"
          @toggle-collapse="toggleMenuCollapse"
          @settings-click="openSettingsWindow"
          @resize="handleNavigationResize"
        />
      </div>
      
      <!-- 中间主内容区 -->
      <div class="content" style="height: 100%; display: flex; flex-direction: column;">
        <!-- 上下垂直容器 -->
        <div class="content-vertical-container" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
          <!-- 上部标签页区域 -->
          <div class="content-top" :style="{ height: `${contentHeight}px` }" style="flex-shrink: 0;">
            <!-- 标签页 -->
            <div class="tabs-container overflow-auto">
          <el-tabs v-model="activeTab" type="card" @tab-remove="removeTab" class="main-tabs">
            <el-tab-pane
              v-for="tab in openedTabs"
              :key="tab.key"
              :label="tab.label"
              :name="tab.key"
              :closable="!tab.isFixed"
            >
              <!-- 串口配置 -->
              <div v-if="tab.key === 'serialConfig'" class="tab-pane">
                <ContentContainer>
                  <h2 class="tab-title">硬件连接</h2>
                  <el-card shadow="hover" class="config-card">
                    <div class="hardware-moved-notice">
                      <el-alert
                        title="硬件连接功能已迁移"
                        type="info"
                        :closable="false"
                        show-icon
                      >
                        <template #default>
                          <div class="notice-content">
                            <p>硬件连接功能已迁移至 <strong>设备列表</strong> 中统一管理。</p>
                            <p class="mt-2">请点击左侧导航菜单中的 <strong>设备管理</strong> - <strong>设备列表</strong> 打开设备列表页面。</p>
                            <el-button type="primary" size="small" @click="handleDeviceList" class="mt-3">
                            打开设备列表
                            </el-button>
                          </div>
                        </template>
                      </el-alert>
                    </div>
                  </el-card>
                </ContentContainer>
              </div>
              
              <!-- 主机收发 -->
              <div v-else-if="tab.key === 'dataSend'" class="tab-pane">
                <ContentContainer>
                  <el-card shadow="hover" class="config-card">
                    <el-form :model="sendConfig" label-width="100px" size="large">
                      <!-- 设备选择、波特率、ID、长度、校验类型 -->
                      <el-row :gutter="20">
                        <el-col :span="10">
                          <el-form-item label="设备">
                            <el-select v-model="selectedDeviceForSend" placeholder="选择要使用的设备" size="small">
                              <el-option
                                v-for="device in deviceManager.devices"
                                :key="device.id"
                                :label="`${device.name} (${device.type}) - ${device.serialConfig.port || '未设置串口'} - ${device.status.serialConnected ? '已连接' : '未连接'}`"
                                :value="device.id"
                              >
                              </el-option>
                            </el-select>
                          </el-form-item>
                        </el-col>
                        <el-col :span="4">
                          <el-form-item label="波特率">
                            <el-select v-model="sendConfig.baudRate" placeholder="选择波特率" size="small">
                              <el-option label="4800" :value="4800"></el-option>
                              <el-option label="9600" :value="9600"></el-option>
                              <el-option label="10400" :value="10400"></el-option>
                              <el-option label="19200" :value="19200"></el-option>
                              <el-option label="20000" :value="20000"></el-option>
                            </el-select>
                          </el-form-item>
                        </el-col>
                        <el-col :span="3">
                          <el-form-item label="ID">
                            <el-input v-model="sendConfig.id" placeholder="例如: 00" size="small"></el-input>
                          </el-form-item>
                        </el-col>
                        <el-col :span="3">
                          <el-form-item label="长度">
                            <el-input-number v-model="sendConfig.length" :min="1" :max="8" size="small" controls-position="right"></el-input-number>
                          </el-form-item>
                        </el-col>
                        <el-col :span="4">
                          <el-form-item label="校验类型">
                            <el-select v-model="sendConfig.checkType" placeholder="选择校验类型" size="small">
                              <el-option label="V1" :value="'V1'"></el-option>
                              <el-option label="V2" :value="'V2'"></el-option>
                            </el-select>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-form-item label="数据">
                        <div class="byte-inputs-table">
                          <table class="byte-table">
                            <thead>
                              <tr>
                                <th class="byte-label-col">Byte</th>
                                <th class="high-nibble-col">高四位</th>
                                <th class="low-nibble-col">低四位</th>
                                <th class="binary-bits-col">二进制位</th>
                                <th class="hex-col">十六进制</th>
                                <th class="binary-value-col">二进制值</th>
                                <th class="settings-col">设置</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(byte, index) in sendConfig.bytes" :key="index" class="byte-row" :class="{ 'disabled': index >= sendConfig.length }">
                                <td class="byte-label">{{ index + 1 }}</td>
                                <td class="nibble-inputs">
                                  <el-input-number 
                                    v-model="byte.high" 
                                    :min="0" 
                                    :max="15" 
                                    size="small" 
                                    :disabled="index >= sendConfig.length"
                                    @change="updateByteData(index)"
                                    controls-position="right"
                                    @wheel.native="handleWheel($event, index, 'high')"
                                  ></el-input-number>
                                </td>
                                <td class="nibble-inputs">
                                  <el-input-number 
                                    v-model="byte.low" 
                                    :min="0" 
                                    :max="15" 
                                    size="small" 
                                    :disabled="index >= sendConfig.length"
                                    @change="updateByteData(index)"
                                    controls-position="right"
                                    @wheel.native="handleWheel($event, index, 'low')"
                                  ></el-input-number>
                                </td>
                                <td class="binary-bits">
                                  <div class="bit-buttons">
                                    <el-button 
                                      v-for="bit in 8" 
                                      :key="bit" 
                                      size="mini" 
                                      :type="getBitValue(index, 8 - bit) ? 'primary' : 'default'"
                                      :disabled="index >= sendConfig.length"
                                      @click="toggleBit(index, 8 - bit)"
                                    >
                                      {{ 8 - bit }}
                                    </el-button>
                                  </div>
                                </td>
                                <td class="byte-value">
                                  {{ ((byte.high << 4) | byte.low).toString(16).toUpperCase().padStart(2, '0') }}
                                </td>
                                <td class="binary-display">
                                  {{ getBinaryValue(index) }}
                                </td>
                                <td class="settings-cell">
                                  <el-button 
                                    type="primary" 
                                    size="small" 
                                    @click="openDataGeneratorDrawer(index)"
                                    :disabled="index >= sendConfig.length"
                                  >
                                    设置
                                  </el-button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div class="byte-inputs-controls">
                          <el-button type="warning" size="small" @click="generateRandomId">随机ID</el-button>
                          <el-button type="warning" size="small" @click="generateRandomLength" class="ml-2">随机长度</el-button>
                          <el-button type="warning" size="small" @click="generateRandomBytes" class="ml-2">随机数据</el-button>
                          <el-button type="danger" size="small" @click="clearAllBytes" class="ml-2">清零</el-button>
                        </div>
                      </el-form-item>
                      <el-row :gutter="10">
                        <el-col :span="6">
                          <el-form-item label="循环发送">
                            <el-switch v-model="sendConfig.loopSend" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                          </el-form-item>
                        </el-col>
                        <el-col :span="6">
                          <el-form-item label="发送间隔">
                            <el-input v-model="sendConfig.loopInterval" type="number" size="small" style="width: 100px;"></el-input>
                            <span class="text-xs text-gray-500 ml-1">毫秒</span>
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item label="随机发送">
                            <el-switch v-model="sendConfig.randomOnLoop" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="10">
                        <el-col :span="8">
                          <el-form-item label="随机ID">
                            <el-switch v-model="sendConfig.randomId" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                          </el-form-item>
                        </el-col>
                        <el-col :span="8">
                          <el-form-item label="随机长度">
                            <el-switch v-model="sendConfig.randomLength" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                          </el-form-item>
                        </el-col>
                        <el-col :span="8">
                          <el-form-item label="随机数据">
                            <el-switch v-model="sendConfig.randomData" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="10">
                        <el-col :span="24" style="display: flex; justify-content: flex-end; align-items: center;">
                          <el-button :type="isSending ? 'danger' : (selectedDeviceForSendObj?.status.serialConnected ? 'success' : 'info')" @click="handleSend" :disabled="!selectedDeviceForSendObj?.status.serialConnected" size="small" style="margin-right: 8px;">
                            {{ isSending ? '停止发送' : '发送数据' }}
                          </el-button>
                          <el-button :type="selectedDeviceForSendObj?.status.serialConnected ? 'success' : 'info'" @click="readSlaveData" :disabled="!selectedDeviceForSendObj?.status.serialConnected" size="small">读取从机</el-button>
                        </el-col>
                      </el-row>
                    </el-form>
                  </el-card>
                </ContentContainer>
              </div>
              
              <!-- 数据追踪（已移动到下部区域） -->
              <div v-else-if="tab.key === 'trace'" class="tab-pane">
                <ContentContainer>
                  <el-alert
                    title="数据追踪功能已移动"
                    type="info"
                    :closable="false"
                    show-icon
                  >
                    <template #default>
                      <div class="notice-content">
                        <p>数据追踪功能已移动到下部区域显示。</p>
                        <p class="mt-2">请在下方查看数据追踪表格和记录。</p>
                      </div>
                    </template>
                  </el-alert>
                </ContentContainer>
              </div>
              
              <!-- 操作日志 -->
              <div v-else-if="tab.key === 'logs'" class="tab-pane">
                <ContentContainer>
                  <h2 class="tab-title">操作日志</h2>
                  <div class="log-container">
                    <el-scrollbar height="600px" class="log-scrollbar">
                      <div class="log-content">
                        <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
                          <span class="timestamp">{{ log.timestamp }}:</span>
                          <span class="message">{{ log.message }}</span>
                        </div>
                      </div>
                    </el-scrollbar>
                  </div>
                  <div class="log-actions">
                    <el-button type="info" size="small" @click="clearLogs">清空</el-button>
                  </div>
                </ContentContainer>
              </div>
              
              <!-- 设备列表 -->
              <div v-else-if="tab.key === 'deviceList'" class="tab-pane">
                <ContentContainer>
                  <h2 class="tab-title">设备列表</h2>
                  <div class="device-list-container" style="height: 100%; display: flex; flex-direction: column;">
                    <!-- 设备操作按钮和搜索 -->
                    <div class="device-actions mb-4" style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <el-button type="primary" @click="showAddDeviceDialog">
                          <el-icon><Plus /></el-icon> 添加设备
                        </el-button>
                        <el-button type="info" @click="refreshPorts">
                          <el-icon><Refresh /></el-icon> 刷新串口
                        </el-button>
                      </div>
                      <el-input
                        v-model="deviceSearchQuery"
                        placeholder="搜索设备名称或类型"
                        clearable
                        style="width: 300px"
                        @input="handleDeviceSearch"
                      >
                        <template #prefix>
                          <el-icon><Search /></el-icon>
                        </template>
                      </el-input>
                    </div>
                    

                    
                    <!-- 设备列表表格 -->
                    <el-card shadow="hover" class="device-table-card" style="flex: 1; display: flex; flex-direction: column;">
                      <div style="flex: 1; overflow: auto; scrollbar-width: thin; scrollbar-color: var(--fluent-border) var(--fluent-surface);">
                        <div style="overflow-x: auto; overflow-y: auto; max-height: 100%;">
                          <el-table 
                            :data="filteredDevices" 
                            style="width: 100%" 
                            size="medium"
                            border
                          >
                          <el-table-column type="index" label="序号" width="80" />
                          <el-table-column label="设备ID" width="150">
                            <template #default="scope">
                              <el-tag type="info">{{ scope.row.id }}</el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column label="设备名称" min-width="150">
                            <template #default="scope">
                              {{ scope.row.name }}
                            </template>
                          </el-table-column>
                          <el-table-column label="总线节点" min-width="120">
                            <template #default="scope">
                              {{ scope.row.deviceCategory || 'LIN' }}
                            </template>
                          </el-table-column>
                          <el-table-column label="设备型号" min-width="120">
                            <template #default="scope">
                              {{ scope.row.type }}
                            </template>
                          </el-table-column>
                          <el-table-column label="串口路径" min-width="100">
                            <template #default="scope">
                              {{ scope.row.serialConfig.port || '未设置' }}
                            </template>
                          </el-table-column>
                          <el-table-column label="波特率" width="100">
                            <template #default="scope">
                              {{ scope.row.serialConfig.baudRate }}
                            </template>
                          </el-table-column>
                          <el-table-column label="连接状态" width="120">
                            <template #default="scope">
                              <el-tag :type="scope.row.status.serialConnected ? 'success' : 'warning'">
                                {{ scope.row.status.serialConnected ? '已连接' : '未连接' }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column label="自动重连" width="100">
                            <template #default="scope">
                              <el-switch 
                                v-model="scope.row.status.autoReconnect" 
                                @change="updateDeviceAutoReconnect(scope.row.id, scope.row.status.autoReconnect)"
                                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                              ></el-switch>
                            </template>
                          </el-table-column>
                          <el-table-column label="操作" width="280" fixed="right">
                            <template #default="scope">
                              <div class="device-buttons-container">
                                <el-tooltip content="发送测试" placement="top">
                                  <el-button type="info" size="small" @click="openTestDrawer(scope.row.id, scope.row)" class="device-button">
                                    <el-icon><DataAnalysis /></el-icon>
                                  </el-button>
                                </el-tooltip>
                                <el-tooltip content="编辑" placement="top">
                                  <el-button type="primary" size="small" @click="showEditDeviceDialog(scope.row.id)" class="device-button">
                                    <el-icon><EditPen /></el-icon>
                                  </el-button>
                                </el-tooltip>
                                <el-tooltip content="删除" placement="top">
                                  <el-button type="danger" size="small" @click="deleteDevice(scope.row.id)" class="device-button">
                                    <el-icon><Delete /></el-icon>
                                  </el-button>
                                </el-tooltip>
                                <el-tooltip :content="scope.row.status.serialConnected ? '断开' : '连接'" placement="top">
                                  <el-button 
                                    :type="scope.row.status.serialConnected ? 'warning' : 'success'" 
                                    size="small" 
                                    @click="toggleDeviceConnection(scope.row.id)"
                                    class="device-button"
                                  >
                                    <el-icon v-if="!scope.row.status.serialConnected"><Check /></el-icon>
                                    <el-icon v-else><Close /></el-icon>
                                  </el-button>
                                </el-tooltip>
                              </div>
                            </template>
                          </el-table-column>
                          </el-table>
                        </div>
                      </div>
                      
                      <!-- 分页组件 -->
                      <div class="device-pagination mt-4" style="display: flex; justify-content: flex-end; align-items: center;">
                        <span style="margin-right: 16px;">共 {{ filteredDevices.length }} 条记录</span>
                        <el-pagination
                          v-model:current-page="currentPage"
                          v-model:page-size="pageSize"
                          :page-sizes="[10, 20, 50, 100]"
                          layout="total, sizes, prev, pager, next, jumper"
                          :total="filteredDevices.length"
                          @size-change="handleSizeChange"
                          @current-change="handleCurrentChange"
                        />
                      </div>
                    </el-card>
                  </div>
                </ContentContainer>
              </div>
              
              <!-- 从机扫描 -->
              <div v-else-if="tab.key === 'slaveScan'" class="tab-pane">
                <ContentContainer>
                  
                  <!-- 扫描参数配置 -->
                  <el-card shadow="hover" class="config-card mb-4">
                    <h3 class="section-title">扫描参数</h3>
                    <el-form :model="scanConfig" label-width="100px" size="large">
                      <el-row :gutter="20">
                        <el-col :span="8">
                          <el-form-item label="设备">
                            <el-select v-model="selectedDeviceForScan" placeholder="选择要使用的设备" size="large">
                              <el-option
                                v-for="device in deviceManager.devices"
                                :key="device.id"
                                :label="`${device.name} (${device.type}) - ${device.serialConfig.port || '未设置串口'} - ${device.status.serialConnected ? '已连接' : '未连接'}`"
                                :value="device.id"
                              >
                              </el-option>
                            </el-select>
                            <div class="text-xs text-gray-500 mt-1">选择要用于扫描的设备</div>
                          </el-form-item>
                        </el-col>
                        <el-col :span="6">
                          <el-form-item label="波特率">
                            <el-select 
                              v-model="scanConfig.baudRates" 
                              placeholder="选择波特率" 
                              multiple 
                              size="large"
                            >
                              <el-option label="4800" :value="4800"></el-option>
                              <el-option label="9600" :value="9600"></el-option>
                              <el-option label="10400" :value="10400"></el-option>
                              <el-option label="19200" :value="19200"></el-option>
                              <el-option label="20000" :value="20000"></el-option>
                            </el-select>
                            <div class="text-xs text-gray-500 mt-1">可选择多个波特率</div>
                          </el-form-item>
                        </el-col>
                        <el-col :span="10">
                          <el-form-item label="ID范围">
                            <el-input 
                              v-model="hexIdStart" 
                              size="large"
                              class="mr-2 id-range-input"
                            ></el-input>
                            <span class="text-lg">-</span>
                            <el-input 
                              v-model="hexIdEnd" 
                              size="large"
                              class="ml-2 id-range-input"
                            ></el-input>
                            <div class="text-xs text-gray-500 mt-1">十六进制范围：00-3F</div>
                          </el-form-item>
                        </el-col>

                        <el-col :span="4" class="text-right scan-buttons-container">
                          <el-button 
                            :type="isScanning ? 'danger' : 'primary'" 
                            size="small" 
                            @click="isScanning ? stopScan() : startScan()"
                            :disabled="!isScanning && (!selectedDeviceForScan || !selectedDeviceForScanObj?.status.serialConnected || scanConfig.baudRates.length === 0)"
                          >
                            <el-icon v-if="!isScanning"><Refresh /></el-icon>
                            <el-icon v-else><Close /></el-icon>
                            {{ isScanning ? '停止扫描' : '开始扫描' }}
                          </el-button>
                        </el-col>
                      </el-row>
                    </el-form>
                  </el-card>
                  
                  <!-- 扫描状态 -->
                  <div class="scan-status mb-4">
                    <el-card shadow="hover" class="status-card">
                      <el-row :gutter="20" type="flex" align="middle">
                        <el-col :span="6">
                          <el-badge :value="isScanning ? '扫描中' : '已停止'" :type="isScanning ? 'success' : 'warning'" size="large">
                            扫描状态
                          </el-badge>
                        </el-col>
                        <el-col :span="6">
                          <div class="status-item">
                            <span class="status-label">当前扫描波特率:</span>
                            <el-tag type="success" size="medium" class="ml-2">{{ currentBaudRate || '-' }}</el-tag>
                          </div>
                        </el-col>
                        <el-col :span="6">
                          <div class="status-item">
                            <span class="status-label">当前扫描LIN ID:</span>
                            <el-tag type="info" size="medium" class="ml-2">{{ currentLinId || '-' }}</el-tag>
                          </div>
                        </el-col>
                        <el-col :span="12">
                          <div class="status-item">
                            <span class="status-label">扫描进度:</span>
                            <div class="progress-container ml-2">
                              <el-progress 
                                v-if="scanProgress !== ''" 
                                :percentage="parseInt(scanProgress.replace(/[^0-9]/g, '')) || 0" 
                                :status="isScanning ? 'success' : ''" 
                                :stroke-width="10"
                              ></el-progress>
                              <span v-else class="status-value">0%</span>
                            </div>
                          </div>
                        </el-col>
                      </el-row>
                    </el-card>
                  </div>
                  
                  <!-- 扫描结果表格 -->
                  <div class="scan-results-container">
                    <el-table :data="scanResults" stripe style="width: 100%" size="medium" height="600px">
                      <el-table-column label="序号" width="80">
                        <template #default="scope">
                          {{ scope.$index + 1 }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="baudRate" label="波特率" width="120"></el-table-column>
                      <el-table-column prop="id" label="从机ID" width="100">
                        <template #default="scope">
                          <el-tag type="primary">{{ scope.row.id.toString(16).toUpperCase().padStart(2, '0') }}</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="data" label="数据" min-width="250" show-overflow-tooltip></el-table-column>
                      <el-table-column prop="dataLength" label="长度" width="100"></el-table-column>
                      <el-table-column prop="checksum" label="校验和" width="150"></el-table-column>

                      <el-table-column label="类型" width="120">
                        <template #default="scope">
                          <el-tag :type="scope.row.detectedChecksumType === 'V1' ? 'info' : 'success'">
                            {{ scope.row.detectedChecksumType || scope.row.checkType }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="状态" width="120">
                        <template #default="scope">
                          <el-tag :type="scope.row.secondaryCheck ? (scope.row.checksumError ? 'danger' : 'success') : 'warning'">
                            {{ scope.row.secondaryCheck ? (scope.row.checksumError ? '校验和错误' : '二次校验通过') : '未校验' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                  
                  <!-- 扫描操作按钮 -->
                  <div class="scan-actions mt-4">
                    <el-button type="info" size="small" @click="clearScanResults">
                      <el-icon><Delete /></el-icon> 清空结果
                    </el-button>
                    <el-button type="primary" size="small" @click="exportScanResults" :disabled="scanResults.length === 0" class="ml-3">
                      <el-icon><Upload /></el-icon> 导出结果
                    </el-button>
                  </div>
                </ContentContainer>
              </div>
              
              <!-- 列表收发 -->
              <div v-else-if="tab.key === 'scheduleTables'" class="tab-pane">
                <ContentContainer>
                  <!-- 操作按钮区和列表区 -->
                  <el-card shadow="hover" class="schedule-actions-card">
                    <!-- 操作按钮区 -->
                    <div class="schedule-actions mb-4" style="background-color: #f5f7fa; border-radius: 8px; padding: 12px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                          <!-- 设备选择 -->
                          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                            <span>设备:</span>
                            <el-select v-model="selectedDeviceForSend" placeholder="选择设备" size="small" style="width: 160px;">
                              <el-option
                                v-for="device in deviceManager.devices"
                                :key="device.id"
                                :label="`${device.name} (${device.type}) - ${device.serialConfig.port || '未设置串口'} - ${device.status.serialConnected ? '已连接' : '未连接'}`"
                                :value="device.id"
                              >
                              </el-option>
                            </el-select>
                          </div>
                          
                          <!-- 波特率选择 -->
                          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                            <span>波特率:</span>
                            <el-select v-model="sendConfig.baudRate" placeholder="选择波特率" size="small" style="width: 100px;">
                              <el-option label="4800" :value="4800"></el-option>
                              <el-option label="9600" :value="9600"></el-option>
                              <el-option label="10400" :value="10400"></el-option>
                              <el-option label="19200" :value="19200"></el-option>
                              <el-option label="20000" :value="20000"></el-option>
                            </el-select>
                          </div>
                          
                          <!-- 校验类型选择 -->
                          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                            <span>校验类型:</span>
                            <el-select v-model="sendConfig.checkType" placeholder="选择校验类型" size="small" style="width: 90px;">
                              <el-option label="V1" :value="'V1'"></el-option>
                              <el-option label="V2" :value="'V2'"></el-option>
                            </el-select>
                          </div>
                          

                          
                          <!-- 开始/结束按钮 -->
                          <el-button 
                            :type="isScheduleSending ? 'danger' : 'success'" 
                            size="small" 
                            @click="toggleScheduleSend"
                            :disabled="scheduleFrames.length === 0 || !selectedDeviceForSend"
                            style="flex-shrink: 0;"
                          >
                            <el-icon>
                              <Close v-if="isScheduleSending" />
                              <Check v-else />
                            </el-icon>
                            {{ isScheduleSending ? '结束' : '开始' }}
                          </el-button>
                          

                        </div>
                        
                        <!-- 发送状态 -->
                        <div class="status-info" style="flex-shrink: 0; white-space: nowrap;">
                          <el-badge :value="isScheduleSending ? '发送中' : '已停止'" :type="isScheduleSending ? 'success' : 'warning'" size="large">
                            发送状态
                          </el-badge>
                          <span class="current-frame ml-2" v-if="isScheduleSending && currentScheduleFrame">
                            当前发送: {{ currentScheduleFrame }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 列表操作按钮区 -->
                    <div style="background-color: #f5f7fa; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <!-- 批量修改按钮 -->
                        <el-button type="info" size="small" @click="showBatchOperationDialog">
                          <el-icon><Operation /></el-icon> 批量修改
                        </el-button>
                        
                        <!-- 批量添加按钮 -->
                        <el-button type="success" size="small" @click="showBatchAddDialog">
                          <el-icon><Plus /></el-icon> 批量添加
                        </el-button>
                        
                        <!-- 添加帧按钮 -->
                        <el-button type="primary" size="small" @click="showAddFrameDialog">
                          <el-icon><Plus /></el-icon> 添加帧
                        </el-button>
                        
                        <!-- 清空列表按钮 -->
                        <el-button type="warning" size="small" @click="clearScheduleFrames" :disabled="scheduleFrames.length === 0">
                          <el-icon><Delete /></el-icon> 清空列表
                        </el-button>
                      </div>
                    </div>
                    
                    <!-- 列表区 -->
                    <div class="schedule-table-container" style="width: 100%; overflow: auto;">
                      <el-table 
                        :data="scheduleFrames" 
                        style="width: 100%" 
                        size="medium" 
                        height="500px"
                        fit
                        border
                        @select="handleSelectionChange"
                        @select-all="handleSelectAll"
                      >
                        <el-table-column type="selection" width="60" resizable></el-table-column>
                        <el-table-column type="index" label="序号" width="60" resizable></el-table-column>
                        <el-table-column prop="id" label="ID" width="80" resizable>
                          <template #default="scope">
                            <el-input v-model="scope.row.id" size="small" style="width: 100%"></el-input>
                          </template>
                        </el-table-column>
                        <el-table-column prop="direction" label="方向" width="80" resizable>
                          <template #default="scope">
                            <el-select v-model="scope.row.direction" size="small" style="width: 100%">
                              <el-option label="发送" value="send"></el-option>
                              <el-option label="接收" value="receive"></el-option>
                            </el-select>
                          </template>
                        </el-table-column>
                        <el-table-column prop="length" label="长度" width="80" resizable>
                          <template #default="scope">
                            <el-input-number v-model="scope.row.length" :min="1" :max="8" size="small" controls-position="right" style="width: 100%" @change="handleLengthChange(scope.row, scope.$index)"></el-input-number>
                          </template>
                        </el-table-column>
                        <el-table-column prop="interval" label="间隔(ms)" width="120" resizable>
                          <template #default="scope">
                            <el-input-number v-model="scope.row.interval" :min="1" size="small" controls-position="right" style="width: 100%"></el-input-number>
                          </template>
                        </el-table-column>
                        <el-table-column prop="data" label="数据" min-width="200" resizable>
                          <template #default="scope">
                            <el-input v-model="scope.row.data" size="small" style="width: 100%"></el-input>
                          </template>
                        </el-table-column>
                        <el-table-column prop="description" label="描述" min-width="150" resizable></el-table-column>
                        <el-table-column prop="enabled" label="使能" width="80" resizable>
                          <template #default="scope">
                            <el-switch v-model="scope.row.enabled" size="small"></el-switch>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="220" fixed="right" resizable>
                          <template #default="scope">
                            <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
                              <el-tooltip content="随机设置" placement="top">
                                <el-button 
                                  type="warning" 
                                  size="small" 
                                  @click="randomizeFrame(scope.$index)"
                                  style="flex-shrink: 0;"
                                >
                                  <el-icon><Refresh /></el-icon>
                                </el-button>
                              </el-tooltip>
                              <el-tooltip content="编辑帧" placement="top">
                                <el-button 
                                  type="primary" 
                                  size="small" 
                                  @click="showEditFrameDialog(scope.row, scope.$index)"
                                  style="flex-shrink: 0;"
                                >
                                  <el-icon><EditPen /></el-icon>
                                </el-button>
                              </el-tooltip>
                              <el-tooltip content="删除帧" placement="top">
                                <el-button 
                                  type="danger" 
                                  size="small" 
                                  @click="deleteScheduleFrame(scope.$index)"
                                  style="flex-shrink: 0;"
                                >
                                  <el-icon><Delete /></el-icon>
                                </el-button>
                              </el-tooltip>
                            </div>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </el-card>
                
                  <!-- 批量添加帧对话框 -->
                  <el-dialog
                    v-model="batchAddDialogVisible"
                    title="批量添加帧"
                    width="500px"
                  >
                    <el-form :model="batchAddConfig" label-width="100px">
                      <el-form-item label="ID范围">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <el-input v-model="batchAddConfig.startId" placeholder="起始ID" size="small" style="width: 80px;"></el-input>
                          <span>至</span>
                          <el-input v-model="batchAddConfig.endId" placeholder="结束ID" size="small" style="width: 80px;"></el-input>
                        </div>
                      </el-form-item>
                      <el-form-item label="长度">
                        <el-input-number v-model="batchAddConfig.length" :min="1" :max="8" size="small" controls-position="right"></el-input-number>
                      </el-form-item>
                      <el-form-item label="间隔(ms)">
                        <el-input-number v-model="batchAddConfig.interval" :min="1" size="small" controls-position="right"></el-input-number>
                      </el-form-item>
                      <el-form-item label="数据">
                        <el-input v-model="batchAddConfig.data" placeholder="例如: 00 00 00 00" size="small"></el-input>
                      </el-form-item>
                      <el-form-item label="方向">
                        <el-select v-model="batchAddConfig.direction" size="small">
                          <el-option label="发送" value="send"></el-option>
                          <el-option label="接收" value="receive"></el-option>
                        </el-select>
                      </el-form-item>
                      <el-form-item label="描述">
                        <el-input v-model="batchAddConfig.description" placeholder="描述" size="small"></el-input>
                      </el-form-item>
                    </el-form>
                    <template #footer>
                      <span class="dialog-footer">
                        <el-button size="small" @click="batchAddDialogVisible = false">取消</el-button>
                        <el-button type="primary" size="small" @click="batchAddFrames">确定</el-button>
                      </span>
                    </template>
                  </el-dialog>
                  
                  <!-- 批量修改对话框 -->
                  <el-dialog
                    v-model="batchOperationDialogVisible"
                    title="批量修改"
                    width="500px"
                  >
                    <el-form :model="batchOperationConfig" label-width="100px">
                      <el-form-item label="操作类型">
                        <el-select v-model="batchOperationConfig.operation" size="small">
                          <el-option label="批量启用" value="enable"></el-option>
                          <el-option label="批量禁用" value="disable"></el-option>
                          <el-option label="批量删除" value="delete"></el-option>
                          <el-option label="批量修改长度" value="length"></el-option>
                          <el-option label="批量修改间隔" value="interval"></el-option>
                          <el-option label="批量修改数据" value="data"></el-option>
                        </el-select>
                      </el-form-item>
                      
                      <!-- 长度输入字段 -->
                      <el-form-item label="长度" v-if="batchOperationConfig.operation === 'length'">
                        <el-input-number v-model="batchOperationConfig.length" :min="1" :max="8" size="small" controls-position="right"></el-input-number>
                      </el-form-item>
                      
                      <!-- 间隔输入字段 -->
                      <el-form-item label="间隔(ms)" v-if="batchOperationConfig.operation === 'interval'">
                        <el-input-number v-model="batchOperationConfig.interval" :min="1" size="small" controls-position="right"></el-input-number>
                      </el-form-item>
                      
                      <!-- 数据输入字段 -->
                      <el-form-item label="数据" v-if="batchOperationConfig.operation === 'data'">
                        <el-input v-model="batchOperationConfig.data" placeholder="例如: 00 00 00 00" size="small"></el-input>
                      </el-form-item>
                      
                      <!-- 静态随机填充选项 -->
                      <el-form-item v-if="batchOperationConfig.operation === 'data'">
                        <el-switch v-model="batchOperationConfig.randomData" active-text="是" inactive-text="否" size="small"></el-switch>
                        <span style="margin-left: 8px;">静态随机填充</span>
                      </el-form-item>
                      
                      <el-form-item>
                        <div class="text-info">
                          提示：已选择 {{ multipleSelection.length }} 个帧，将对这些帧执行批量修改。
                        </div>
                      </el-form-item>
                    </el-form>
                    <template #footer>
                      <span class="dialog-footer">
                        <el-button size="small" @click="batchOperationDialogVisible = false">取消</el-button>
                        <el-button type="primary" size="small" @click="executeBatchOperation">确定</el-button>
                      </span>
                    </template>
                  </el-dialog>
                

                

              </ContentContainer>
            </div>
              
              <!-- 爆破发送 -->
              <div v-else-if="tab.key === 'bruteForce'" class="tab-pane">
                <ContentContainer>
                  <h2 class="tab-title">爆破发送</h2>
                  
                  <!-- 爆破发送参数配置 -->
                  <el-card shadow="hover" class="config-card mb-4" :body-style="{ padding: '20px' }">
                    <h3 class="section-title">爆破参数配置</h3>
                    <el-form :model="bruteForceConfig" label-width="120px" size="large">
                      <!-- 第一行：设备选择 -->
                      <el-row :gutter="20" class="mb-4">
                        <el-col :span="24">
                          <el-form-item label="设备">
                            <el-select v-model="selectedDeviceForBruteForce" placeholder="选择要使用的设备" size="small">
                              <el-option
                                v-for="device in deviceManager.devices"
                                :key="device.id"
                                :label="`${device.name} (${device.type}) - ${device.serialConfig.port || '未设置串口'} - ${device.status.serialConnected ? '已连接' : '未连接'}`"
                                :value="device.id"
                              >
                              </el-option>
                            </el-select>
                            <div class="text-xs text-gray-500 mt-1">选择要用于爆破发送的设备</div>
                          </el-form-item>
                        </el-col>
                      </el-row>
                       
                      <!-- 第二行：波特率、ID范围、跳过ID -->
                      <el-row :gutter="20" class="mb-4" type="flex" align="top">
                        <!-- 波特率 -->
                        <el-col :span="8">
                          <el-form-item label="波特率">
                            <el-select 
                              v-model="bruteForceConfig.baudRate" 
                              placeholder="选择波特率" 
                              size="small"
                              style="width: 150px"
                            >
                              <el-option label="4800" :value="4800"></el-option>
                              <el-option label="9600" :value="9600"></el-option>
                              <el-option label="10400" :value="10400"></el-option>
                              <el-option label="19200" :value="19200"></el-option>
                              <el-option label="20000" :value="20000"></el-option>
                            </el-select>
                            <div class="text-xs text-gray-500 mt-1">选择通信波特率</div>
                          </el-form-item>
                        </el-col>
                        
                        <!-- ID范围 -->
                        <el-col :span="8">
                          <el-form-item label="ID范围">
                            <div class="id-range-inputs d-flex align-items-center">
                              <el-input 
                              v-model="bruteForceConfig.idRange[0]" 
                              size="small"
                              class="mr-2"
                              placeholder="起始ID"
                              maxlength="2"
                              style="width: 60px"
                            ></el-input>
                              <span class="text-lg font-bold">-</span>
                              <el-input 
                                v-model="bruteForceConfig.idRange[1]" 
                                size="small"
                                class="ml-2"
                                placeholder="结束ID"
                                maxlength="2"
                                style="width: 60px"
                              ></el-input>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">设置起始ID与结束ID的扫描范围（支持十六进制输入，如00-3F）</div>
                          </el-form-item>
                        </el-col>
                        
                        <!-- 跳过ID -->
                        <el-col :span="8">
                          <el-form-item label="跳过ID">
                            <el-input 
                              v-model="bruteForceConfig.skipIds" 
                              placeholder="例如: 00, 1A, 3F" 
                              size="small"
                              style="width: 200px"
                            ></el-input>
                            <div class="text-xs text-gray-500 mt-1">指定需要跳过扫描的特定ID列表</div>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      
                      <!-- 第二行：校验和、扫描顺序、长度范围、间隔时间 -->
                      <el-row :gutter="20" type="flex" align="top">
                        <!-- 校验和选项 -->
                        <el-col :span="6">
                          <el-form-item label="校验和选项">
                            <el-select 
                              v-model="bruteForceConfig.checksumType" 
                              placeholder="选择校验和类型" 
                              size="small"
                            >
                              <el-option label="V1" :value="'V1'"></el-option>
                              <el-option label="V2" :value="'V2'"></el-option>
                            </el-select>
                            <div class="text-xs text-gray-500 mt-1">选择校验和验证类型</div>
                          </el-form-item>
                        </el-col>
                        
                        <!-- ID扫描顺序 -->
                        <el-col :span="6">
                          <el-form-item label="ID扫描顺序">
                            <el-select 
                              v-model="bruteForceConfig.scanOrder" 
                              placeholder="选择扫描顺序" 
                              size="small"
                            >
                              <el-option label="顺序" :value="'sequential'">按顺序扫描ID</el-option>
                              <el-option label="二分" :value="'binary'">按二分法扫描ID</el-option>
                              <el-option label="随机" :value="'random'">随机扫描ID</el-option>
                            </el-select>
                            <div class="text-xs text-gray-500 mt-1">选择ID的扫描顺序</div>
                          </el-form-item>
                        </el-col>
                        
                        <!-- 长度范围 -->
                        <el-col :span="6">
                          <el-form-item label="长度范围">
                            <div class="d-flex align-items-center">
                              <el-input-number 
                                v-model="bruteForceConfig.lengthRange[0]" 
                                :min="1" 
                                :max="8" 
                                :step="1" 
                                size="small"
                                class="mr-2"
                                controls-position="right"
                                @wheel.native="handleBruteForceWheel($event, 'lengthRange', 0)"
                                style="width: 80px"
                              ></el-input-number>
                              <span class="text-lg font-bold">-</span>
                              <el-input-number 
                                v-model="bruteForceConfig.lengthRange[1]" 
                                :min="1" 
                                :max="8" 
                                :step="1" 
                                size="small"
                                class="ml-2"
                                controls-position="right"
                                @wheel.native="handleBruteForceWheel($event, 'lengthRange', 1)"
                                style="width: 80px"
                              ></el-input-number>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">设置扫描的长度范围（1-8字节）</div>
                          </el-form-item>
                        </el-col>
                        
                        <!-- 间隔时间 -->
                        <el-col :span="6">
                          <el-form-item label="间隔时间">
                            <div class="d-flex align-items-center">
                              <el-input-number 
                                v-model="bruteForceConfig.interval" 
                                :min="10" 
                                :max="10000" 
                                :step="10" 
                                size="small"
                                controls-position="right"
                                @wheel.native="handleBruteForceWheel($event, 'interval', 0)"
                                style="width: 100px"
                              ></el-input-number>
                              <span class="text-xs text-gray-500 ml-2">毫秒</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">设置发送间隔时间</div>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      
                      <!-- 第三行：爆破模式 -->
                      <el-row :gutter="20" type="flex" align="top">
                        <el-col :span="24">
                          <el-form-item label="爆破模式">
                            <el-select 
                              v-model="bruteForceConfig.scanMode" 
                              placeholder="选择爆破模式" 
                              size="small"
                              disabled
                            >
                              <el-option label="常规模式" :value="'normal'">按长度范围循环发送</el-option>
                            </el-select>
                            <div class="text-xs text-gray-500 mt-1">选择爆破字典模式</div>
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </el-form>
                  </el-card>
                  
                  <!-- 爆破状态 -->
                  <div class="brute-force-status mb-4">
                    <el-card shadow="hover" class="status-card" :body-style="{ padding: '16px' }">
                      <el-row :gutter="15" type="flex" align="middle">
                        <!-- 爆破状态标签 -->
                        <el-col :span="4">
                          <el-badge 
                            :value="isBruteForcing ? '爆破中' : '已停止'" 
                            :type="isBruteForcing ? 'success' : 'warning'" 
                            size="large"
                            class="status-badge"
                          >
                            爆破状态
                          </el-badge>
                        </el-col>
                        
                        <!-- 状态信息 -->
                        <el-col :span="2">
                          <div class="status-item">
                            <span class="status-label">波特率:</span>
                            <el-tag type="success" size="medium" class="ml-1">{{ currentBaudRate || '-' }}</el-tag>
                          </div>
                        </el-col>
                        <el-col :span="2">
                          <div class="status-item">
                            <span class="status-label">LIN ID:</span>
                            <el-tag type="info" size="medium" class="ml-1">{{ currentLinId || '-' }}</el-tag>
                          </div>
                        </el-col>
                        <el-col :span="2">
                          <div class="status-item">
                            <span class="status-label">长度:</span>
                            <el-tag type="warning" size="medium" class="ml-1">{{ currentLength || '-' }}</el-tag>
                          </div>
                        </el-col>
                        <el-col :span="3">
                          <div class="status-item">
                            <span class="status-label">数据:</span>
                            <el-tag type="primary" size="medium" class="ml-1" :effect="'dark'">
                              {{ currentData || '-' }}
                            </el-tag>
                          </div>
                        </el-col>
                        
                        <!-- 进度条 -->
                        <el-col :span="6">
                          <div class="status-item">
                            <span class="status-label">进度:</span>
                            <el-progress 
                              :percentage="bruteForceProgress" 
                              :status="isBruteForcing ? 'success' : ''" 
                              size="small"
                              :stroke-width="10"
                              class="ml-2"
                            ></el-progress>
                          </div>
                        </el-col>
                        
                        <!-- 操作按钮 -->
                        <el-col :span="5" class="text-right">
                          <el-button 
                            :type="isBruteForcing ? 'danger' : (selectedDeviceForBruteForceObj?.status.serialConnected ? 'success' : 'info')" 
                            size="small" 
                            @click="isBruteForcing ? stopBruteForce() : startBruteForce()"
                            :disabled="!isBruteForcing && (!selectedDeviceForBruteForce || !selectedDeviceForBruteForceObj?.status.serialConnected)"
                            :icon="isBruteForcing ? VideoPause : VideoPlay"
                            class="mr-2"
                          >
                            {{ isBruteForcing ? '停止爆破' : '开始爆破' }}
                          </el-button>
                          <el-button 
                            type="info" 
                            size="small" 
                            @click="clearBruteForceResults"
                            :icon="Delete"
                          >
                            清除结果
                          </el-button>
                        </el-col>
                      </el-row>
                    </el-card>
                  </div>
                  

                </ContentContainer>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
          </div>
          
          <!-- 垂直 Splitter -->
          <div class="splitter vertical-splitter" 
               @mousedown="startDrag('content', $event)"
               :class="{ 'dragging': isDragging && dragType === 'content' }">
            <div class="splitter-handle vertical-handle"></div>
          </div>
          
          <!-- 下部容器 -->
          <div class="content-bottom" style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
            <div class="tab-pane" style="height: 100%;">
              <ContentContainer style="height: 100%;">
                <!-- 数据追踪面板 -->
                <div class="trace-panel-container" style="height: 100%; display: flex; flex-direction: column;">
                  <!-- 面板标题 -->
                  <div class="panel-header">
                    <h3 class="panel-title">数据追踪</h3>
                  </div>
                  
                  <!-- 数据追踪表格组件 -->
                  <DataTraceTable
                    :frames="receivedFrames"
                    v-model:traceEnabled="traceEnabled"
                    :traceMode="traceMode"
                    :currentBusId="currentBusId"
                    @clear="clearTraceData"
                    @export="exportTraceData"
                    @loadMore="loadMoreData"
                    @update:traceMode="traceMode = $event"
                    @update:currentBusId="currentBusId = $event"
                    style="flex: 1; min-height: 0;"
                  />
                  
                  <!-- 加载中指示器 -->
                  <div v-if="isLoading" class="loading-indicator">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span>加载中...</span>
                  </div>
                </div>
              </ContentContainer>
            </div>
          </div>
        </div>
      </div>
      
      

      


          

          

          

    </div>
    
    <!-- 设置窗口 -->
    <SettingsWindow
      :visible="isSettingsWindowVisible"
      @close="closeSettingsWindow"
      @language-change="handleLanguageChange"
      @theme-change="handleThemeChange"
    />
    
    <!-- 设备管理抽屉 -->
    <el-drawer
      v-model="deviceDialogVisible"
      :title="deviceDialogTitle"
      direction="rtl"
      size="25%"
      class="resizable-drawer"
    >
      <div class="drawer-resize-handle" @mousedown="startResize('deviceDialog', $event)"></div>
      <el-form :model="currentDevice" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="currentDevice.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备描述">
          <el-input 
            v-model="currentDevice.description" 
            placeholder="请输入设备描述（可选）" 
            type="textarea"
            rows="2"
          />
        </el-form-item>
        <el-form-item label="总线节点">
          <el-select v-model="currentDevice.deviceCategory" placeholder="请选择总线节点">
            <el-option label="LIN" value="LIN" />
            <el-option label="CAN" value="CAN" />
            <el-option label="MODBUS" value="MODBUS" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备型号">
          <el-select 
            v-model="currentDevice.type" 
            placeholder="请先选择总线节点" 
            :disabled="!currentDevice.deviceCategory"
          >
            <template v-if="currentDevice.deviceCategory === 'LIN'">
              <el-option label="LINTest-M" value="LINTest-M" />
            </template>
            <template v-else-if="currentDevice.deviceCategory === 'CAN'">
              <el-option label="CANTester" value="CANTester" />
            </template>
            <template v-else-if="currentDevice.deviceCategory === 'MODBUS'">
              <el-option label="USB TO MODBUS通用" value="USB TO MODBUS通用" />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="串口路径">
          <el-select v-model="currentDevice.serialConfig.port" placeholder="请选择串口">
            <el-option
              v-for="port in deviceManager.getAvailableUnusedPorts(currentDevice.id)"
              :key="port.path"
              :label="`${port.path} - ${port.manufacturer || '未知设备'}`"
              :value="port.path"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="自动重连">
          <el-switch 
            v-model="currentDevice.status.autoReconnect" 
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deviceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDevice">保存</el-button>
        </span>
      </template>
    </el-drawer>

    <!-- 设备详情抽屉 -->
    <el-drawer
      v-model="deviceDetailDrawerVisible"
      title="设备详情"
      direction="rtl"
      size="25%"
      class="resizable-drawer"
    >
      <div class="drawer-resize-handle" @mousedown="startResize('deviceDetail', $event)"></div>
      <div v-if="selectedDevice" class="device-detail-container">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="设备ID">{{ selectedDevice.id }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ selectedDevice.name }}</el-descriptions-item>
          <el-descriptions-item label="设备描述">{{ selectedDevice.description || '无' }}</el-descriptions-item>
          <el-descriptions-item label="总线节点">{{ selectedDevice.deviceCategory || 'LIN' }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ selectedDevice.type }}</el-descriptions-item>
          <el-descriptions-item label="串口路径">{{ selectedDevice.serialConfig.port || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="连接状态">
            <el-tag :type="selectedDevice.status.serialConnected ? 'success' : 'warning'">
              {{ selectedDevice.status.serialConnected ? '已连接' : '未连接' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="自动重连">
            <el-switch 
              v-model="selectedDevice.status.autoReconnect" 
              @change="updateDeviceAutoReconnect(selectedDevice.id, selectedDevice.status.autoReconnect)"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              disabled
            ></el-switch>
          </el-descriptions-item>
        </el-descriptions>
        <div class="device-detail-actions mt-4">
          <el-button type="primary" @click="showEditDeviceDialog(selectedDevice.id)">
            <el-icon><EditPen /></el-icon> 编辑设备
          </el-button>
          <el-button 
            :type="selectedDevice.status.serialConnected ? 'warning' : 'success'" 
            @click="toggleDeviceConnection(selectedDevice.id)"
            class="ml-2"
          >
            <el-icon>
              <Check v-if="!selectedDevice.status.serialConnected" />
              <Close v-else />
            </el-icon>
            {{ selectedDevice.status.serialConnected ? '断开连接' : '连接设备' }}
          </el-button>
        </div>
      </div>
    </el-drawer>
    
    <!-- 测试抽屉 -->
    <el-drawer
      v-model="testDrawerVisible"
      :title="testDrawerTitle"
      direction="rtl"
      size="30%"
      class="resizable-drawer"
    >
      <div class="drawer-resize-handle" @mousedown="startResize('testDrawer', $event)"></div>
      <div class="test-drawer-content">
        <el-card shadow="hover" class="test-config-card">
          <h3 class="section-title">测试配置</h3>
          <el-form :model="testConfig" label-width="120px">
            <el-form-item label="设备信息">
              <el-tag type="info">{{ testDeviceName }}</el-tag>
            </el-form-item>
            <el-form-item label="波特率">
              <el-select v-model="testConfig.baudRate" placeholder="选择波特率" multiple>
                <el-option label="9600" :value="9600"></el-option>
                <el-option label="10417" :value="10417"></el-option>
                <el-option label="19200" :value="19200"></el-option>
              </el-select>
              <div class="text-xs text-gray-500 mt-1">可选择多个波特率</div>
            </el-form-item>
            <el-form-item label="校验类型">
              <el-select v-model="testConfig.checkType" placeholder="选择校验类型">
                <el-option label="V1" :value="'V1'"></el-option>
                <el-option label="V2" :value="'V2'"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="ID范围">
              <div class="id-range-inputs">
                              <el-input v-model="testConfig.idStart" placeholder="起始ID" size="small" class="mr-2"></el-input>
                              <span>-</span>
                              <el-input v-model="testConfig.idEnd" placeholder="结束ID" size="small" class="ml-2"></el-input>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">十六进制范围，默认00-3F</div>
            </el-form-item>
            <el-form-item label="数据长度">
              <el-input-number v-model="testConfig.dataLength" :min="1" :max="8" size="small"></el-input-number>
              <div class="text-xs text-gray-500 mt-1">1-8字节</div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="generateRandomTestData">
                <el-icon><Refresh /></el-icon> 生成随机测试数据
              </el-button>
              <div class="random-data-display mt-2" v-if="testConfig.randomData">
                <el-tag type="info" size="small">{{ testConfig.randomData }}</el-tag>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card shadow="hover" class="test-results-card mt-4" v-if="testResults.length > 0">
          <h3 class="section-title">测试结果</h3>
          <div class="test-results-list">
            <div v-for="(result, index) in testResults" :key="index" :class="['test-result-item', result.success ? 'success' : 'error']">
              <span class="result-baud">{{ result.baudRate }}bps</span>
              <span class="result-id">ID: 0x{{ result.id.toString(16).padStart(2, '0').toUpperCase() }}</span>
              <span class="result-check">{{ result.checkType }}</span>
              <span class="result-status">{{ result.success ? '成功' : '失败' }}</span>
              <span v-if="!result.success" class="result-error">{{ result.error }}</span>
            </div>
          </div>
          <div class="test-summary mt-3">
            <el-tag type="success">成功: {{ testSummary.successCount }}</el-tag>
            <el-tag type="danger" class="ml-2">失败: {{ testSummary.errorCount }}</el-tag>
            <el-tag type="info" class="ml-2">总计: {{ testSummary.totalCount }}</el-tag>
          </div>
        </el-card>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="testDrawerVisible = false">取消</el-button>
          <el-button type="primary" @click="executeTest" :disabled="testConfig.baudRate.length === 0 || isExecutingTest">
            {{ isExecutingTest ? '测试中...' : '开始测试' }}
          </el-button>
        </span>
      </template>
    </el-drawer>
    
    <!-- 列表收发抽屉 -->
    <el-drawer
      v-model="frameDialogVisible"
      :title="editingFrameIndex >= 0 ? '编辑帧' : '添加帧'"
      direction="rtl"
      size="30%"
      class="resizable-drawer"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="drawer-resize-handle" @mousedown="startResize('frameDialog', $event)"></div>
      <el-form :model="currentFrame" label-width="100px" size="large">
        <el-form-item label="方向">
          <el-radio-group v-model="currentFrame.direction" size="large">
            <el-radio-button label="send">发送</el-radio-button>
            <el-radio-button label="receive">接收</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="ID">
          <el-input v-model="currentFrame.id" placeholder="例如: 00, 1A, 3F" size="large"></el-input>
          <div class="text-xs text-gray-500 mt-1">请输入十六进制ID，范围：00-3F</div>
        </el-form-item>
        <el-form-item label="长度">
          <el-input-number 
            v-model="currentFrame.length" 
            :min="1" 
            :max="8" 
            size="large"
            @change="updateFrameDataLength"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="间隔时间">
          <el-input-number 
            v-model="currentFrame.interval" 
            :min="1" 
            :max="65535" 
            :step="10" 
            size="large"
          ></el-input-number>
          <span class="text-xs text-gray-500 ml-2">毫秒</span>
        </el-form-item>
        <el-form-item label="数据内容" v-if="currentFrame.direction === 'send'">
          <div class="data-input-mode">
            <el-radio-group v-model="dataInputMode" size="large">
              <el-radio-button label="manual">手动输入</el-radio-button>
              <el-radio-button label="random">随机生成</el-radio-button>
            </el-radio-group>
          </div>
          <div class="mt-2">
            <el-input 
              v-if="dataInputMode === 'manual'"
              v-model="currentFrame.data" 
              placeholder="例如: 00 01 02 03" 
              size="large"
            ></el-input>
            <div v-else class="random-data-section">
              <el-button 
                type="primary" 
                size="small" 
                @click="generateRandomData"
              >
                <el-icon><Refresh /></el-icon> 生成随机数据
              </el-button>
              <span class="random-data-value ml-2">{{ currentFrame.data }}</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="currentFrame.description" 
            placeholder="可选，描述该帧的用途" 
            size="large"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button 
            type="warning" 
            size="small" 
            @click="generateRandomFrame"
          >
            <el-icon><Refresh /></el-icon> 随机设置
          </el-button>
          <div class="text-xs text-gray-500 mt-1">根据选择随机生成参数</div>
          <div class="random-settings-options mt-2">
            <el-checkbox-group v-model="randomSettings" size="small">
              <el-checkbox label="id">随机ID</el-checkbox>
              <el-checkbox label="length">随机长度</el-checkbox>
              <el-checkbox label="data">随机数据</el-checkbox>
            </el-checkbox-group>
          </div>
          <div class="mt-3">
            <el-checkbox v-model="currentFrame.randomEnabled" size="small">
              轮询时随机触发
            </el-checkbox>
            <div class="text-xs text-gray-500 mt-1">每轮询到此帧时，根据随机设置触发随机生成</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button size="small" @click="frameDialogVisible = false">取消</el-button>
          <el-button type="primary" size="small" @click="saveScheduleFrame">确认</el-button>
        </span>
      </template>
    </el-drawer>
    

  </el-container>
    
    <!-- 数据生成器抽屉 -->
    <el-drawer
      v-model="dataGeneratorDrawerVisible"
      title="数据生成器"
      direction="rtl"
      size="30%"
    >
      <div class="data-generator-container">
        <el-form :model="dataGeneratorConfig" label-width="120px" size="small">
          <el-form-item label="字节索引">
            <el-input v-model="dataGeneratorConfig.byteIndex" disabled size="small"></el-input>
          </el-form-item>
          <el-form-item label="配置类型">
            <el-radio-group v-model="dataGeneratorConfig.configType" size="small">
              <el-radio-button label="high">高八位</el-radio-button>
              <el-radio-button label="low">低八位</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="生成范围">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-input-number 
                  v-model="dataGeneratorConfig.range.min" 
                  :min="0" 
                  :max="15" 
                  size="small"
                ></el-input-number>
              </el-col>
              <el-col :span="12">
                <el-input-number 
                  v-model="dataGeneratorConfig.range.max" 
                  :min="0" 
                  :max="15" 
                  size="small"
                ></el-input-number>
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="步进值">
            <el-input-number 
              v-model="dataGeneratorConfig.step" 
              :min="1" 
              :max="15" 
              size="small"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="启用生成器">
            <el-switch v-model="dataGeneratorConfig.enabled" size="small"></el-switch>
          </el-form-item>
          <el-form-item label="生成模式">
            <el-select v-model="dataGeneratorConfig.generateMode" size="small">
              <el-option label="递增循环" value="increment"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="generateData">生成数据</el-button>
            <el-button size="small" @click="dataGeneratorDrawerVisible = false">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { EditPen, Setting, Upload, DataAnalysis, DocumentCopy, Refresh, Delete, List, Plus, Check, Close, VideoPlay, VideoPause, Monitor, View, Loading } from '@element-plus/icons-vue';
import { deviceManagerViewModel } from './viewmodels/DeviceManagerViewModel';
import ContentContainer from './components/ContentContainer.vue';
import NavigationMenu from './components/NavigationMenu.vue';
import SettingsWindow from './components/SettingsWindow.vue';
import DataTraceTable from './components/DataTraceTable.vue';

// 标签页管理
const activeTab = ref('dataSend');
const openedTabs = ref([
  { key: 'dataSend', label: '主机收发', icon: Upload, isFixed: false },
  { key: 'logs', label: '操作日志', icon: DocumentCopy, isFixed: false },
  { key: 'scheduleTables', label: '列表收发', icon: List, isFixed: false },
  { key: 'trace', label: '数据追踪', icon: DataAnalysis, isFixed: false }
]);

// 按钮栏配置
const buttonBarItems = [
  {
    key: 'commonTools',
    label: '常用工具',
    icon: List,
    children: [
      { key: 'slaveScan', label: '从机扫描', icon: Setting },
      { key: 'dataSend', label: '主机收发', icon: Upload },
      { key: 'scheduleTables', label: '列表收发', icon: List },
      { key: 'bruteForce', label: '爆破发送', icon: DataAnalysis },
      { key: 'trace', label: '数据追踪', icon: DataAnalysis }
    ]
  },
  {
    key: 'deviceManagement',
    label: '设备管理',
    icon: Monitor,
    children: [
      { key: 'deviceList', label: '设备列表', icon: List }
    ]
  },
  { key: 'logs', label: '操作日志', icon: DocumentCopy }
];

// 硬件标签页
const hardwareTab = ref('0');

// 主机收发标签页
const dataSendTab = ref('0');

// 导航菜单折叠状态
const isMenuCollapsed = ref(false);

// 设备管理
const deviceManager = deviceManagerViewModel;
const selectedDevice = computed(() => deviceManager.selectedDevice);
const deviceDialogVisible = ref(false);
const deviceDetailDrawerVisible = ref(false);
const currentDevice = ref<any>({});
const deviceDialogTitle = ref('添加设备');
const activeDeviceCollapse = ref<string[]>([]);
const selectedDeviceForSend = ref<string>('');
const selectedDeviceForSendObj = computed(() => {
  return deviceManager.devices.find(device => device.id === selectedDeviceForSend.value);
});

const selectedDeviceForScan = ref<string>('');
const selectedDeviceForScanObj = computed(() => {
  return deviceManager.devices.find(device => device.id === selectedDeviceForScan.value);
});

const selectedDeviceForBruteForce = ref<string>('');
const selectedDeviceForBruteForceObj = computed(() => {
  return deviceManager.devices.find(device => device.id === selectedDeviceForBruteForce.value);
});

// 数据追踪表格引用
const traceTableRef = ref();
const traceTableContainerRef = ref();

// 测试抽屉管理
const testDrawerVisible = ref(false);
const testDrawerTitle = ref('设备测试');

// 处理爆破发送的鼠标滚轮事件
const handleBruteForceWheel = (event: WheelEvent, type: string, index: number) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? 1 : -1;
  
  if (type === 'lengthRange') {
    if (index === 0) {
      bruteForceConfig.lengthRange[0] = Math.max(1, Math.min(8, bruteForceConfig.lengthRange[0] + delta));
    } else if (index === 1) {
      bruteForceConfig.lengthRange[1] = Math.max(1, Math.min(8, bruteForceConfig.lengthRange[1] + delta));
    }
  } else if (type === 'interval') {
    bruteForceConfig.interval = Math.max(10, Math.min(10000, bruteForceConfig.interval + delta * 10));
  }
};
const testDeviceId = ref<string>('');
const testDeviceName = ref<string>('');
const isExecutingTest = ref(false);

// 测试配置
const testConfig = reactive({
  baudRate: [] as number[],
  checkType: 'V1' as string,
  idStart: '00' as string,
  idEnd: 'FF' as string,
  dataLength: 8 as number,
  randomData: '' as string
});

// 测试结果
const testResults = ref<any[]>([]);
const testSummary = reactive({
  successCount: 0,
  errorCount: 0,
  totalCount: 0
});

// 设备搜索
const deviceSearchQuery = ref('');
const filteredDevices = computed(() => {
  if (!deviceSearchQuery.value) {
    return deviceManager.devices;
  }
  const query = deviceSearchQuery.value.toLowerCase();
  return deviceManager.devices.filter(device => 
    device.name.toLowerCase().includes(query) || 
    device.type.toLowerCase().includes(query) ||
    device.serialConfig.port?.toLowerCase().includes(query)
  );
});

// 处理设备搜索
const handleDeviceSearch = () => {
  // 搜索逻辑已在filteredDevices计算属性中实现
};

// Splitter 相关状态
const sidebarWidth = ref(200);
const propertiesWidth = ref(300);
const contentHeight = ref(600);
const isDragging = ref(false);
const dragType = ref('');
const minSidebarWidth = 80;
const minContentWidth = 400;
const minPropertiesWidth = 200;
const minContentHeight = 300;
const minBottomHeight = 200;

// ResizeObserver用于监听content-bottom容器大小变化
let contentBottomResizeObserver: ResizeObserver | null = null;

// 初始化 Splitter 状态
const initSplitterState = () => {
  // 从本地存储加载面板宽度和高度
  const savedSidebarWidth = localStorage.getItem('sidebarWidth');
  const savedPropertiesWidth = localStorage.getItem('propertiesWidth');
  const savedContentHeight = localStorage.getItem('contentHeight');
  
  if (savedSidebarWidth) {
    sidebarWidth.value = parseInt(savedSidebarWidth);
  }
  
  if (savedPropertiesWidth) {
    propertiesWidth.value = parseInt(savedPropertiesWidth);
  }
  
  if (savedContentHeight) {
    contentHeight.value = parseInt(savedContentHeight);
  }
};

// 保存 Splitter 状态
const saveSplitterState = () => {
  localStorage.setItem('sidebarWidth', sidebarWidth.value.toString());
  localStorage.setItem('propertiesWidth', propertiesWidth.value.toString());
  localStorage.setItem('contentHeight', contentHeight.value.toString());
};

// 拖拽相关缓存变量
let dragContainer: HTMLElement | null = null;
let dragContainerRect: DOMRect | null = null;
let dragContentContainer: HTMLElement | null = null;
let dragContentRect: DOMRect | null = null;
let lastDragTime = 0;
const DRAG_THROTTLE = 16; // 约60fps

// 非响应式变量，用于拖拽过程中的临时存储
let tempSidebarWidth = 0;
let tempPropertiesWidth = 0;
let tempContentHeight = 0;

// 开始拖拽
const startDrag = (type: string, event: MouseEvent) => {
  // 防止默认行为
  event.preventDefault();
  event.stopPropagation();
  
  // 缓存DOM元素和边界矩形
  dragContainer = document.querySelector('.main-content-container');
  if (dragContainer) {
    dragContainerRect = dragContainer.getBoundingClientRect();
  }
  
  dragContentContainer = document.querySelector('.content');
  if (dragContentContainer) {
    dragContentRect = dragContentContainer.getBoundingClientRect();
  }
  
  // 初始化临时变量
  tempSidebarWidth = sidebarWidth.value;
  tempPropertiesWidth = propertiesWidth.value;
  tempContentHeight = contentHeight.value;
  
  isDragging.value = true;
  dragType.value = type;
  document.body.style.cursor = type === 'content' ? 'row-resize' : 'col-resize';
  document.body.style.userSelect = 'none';
  document.body.style.pointerEvents = 'none';
  
  // 添加拖拽状态类
  document.body.classList.add('dragging');
  lastDragTime = 0;
  
  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('mouseleave', endDrag);
};

// 拖拽中
const onDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  // 防止默认行为
  event.preventDefault();
  
  // 节流处理，限制拖拽事件处理频率
  const currentTime = performance.now();
  if (currentTime - lastDragTime < DRAG_THROTTLE) {
    return;
  }
  lastDragTime = currentTime;
  
  // 确保容器存在
  if (!dragContainer || !dragContainerRect) return;
  
  // 使用 requestAnimationFrame 优化渲染性能
  requestAnimationFrame(() => {
    if (dragType.value === 'sidebar') {
      const newWidth = event.clientX - dragContainerRect.left;
      // 确保最小宽度为80px，防止盖住导航按钮
      const minWidth = 80;
      if (newWidth >= minWidth) {
        tempSidebarWidth = newWidth;
        // 直接更新DOM样式，避免响应式更新开销
        const sidebar = document.querySelector('.navigation-sidebar');
        if (sidebar) {
          sidebar.style.width = `${newWidth}px`;
        }
      }
    } else if (dragType.value === 'properties') {
      const newWidth = dragContainerRect.right - event.clientX;
      if (newWidth >= minPropertiesWidth) {
        tempPropertiesWidth = newWidth;
        // 直接更新DOM样式，避免响应式更新开销
        const propertiesPanel = document.querySelector('.properties-panel');
        if (propertiesPanel) {
          propertiesPanel.style.width = `${newWidth}px`;
        }
      }
    } else if (dragType.value === 'content' && dragContentContainer && dragContentRect) {
      // 获取content-top元素的当前高度
      const contentTop = document.querySelector('.content-top');
      if (contentTop) {
        // 计算鼠标Y坐标相对于content容器顶部的偏移
        const mouseOffset = event.clientY - dragContentRect.top;
        
        // 计算content容器的总高度
        const contentHeight = dragContentRect.height;
        // 定义content-bottom的最小高度（确保表格至少能显示5行，包括分页控件）
        const minBottomHeight = 300;
        
        // 计算content-top的最大可能高度
        const maxTopHeight = contentHeight - minBottomHeight;
        // 计算新高度（基于鼠标移动的相对位置，同时确保content-bottom有最小高度）
        const newHeight = Math.max(minContentHeight, Math.min(maxTopHeight, mouseOffset));
        
        tempContentHeight = newHeight;
        // 直接更新DOM样式，避免响应式更新开销
        contentTop.style.height = `${newHeight}px`;
        
        // 确保content-bottom容器填充剩余空间
        const contentBottom = document.querySelector('.content-bottom');
        if (contentBottom) {
          contentBottom.style.flexGrow = '1';
          contentBottom.style.minHeight = `${minBottomHeight}px`;
        }
      }
    }
  });
};

// 结束拖拽
const endDrag = () => {
  if (isDragging.value) {
    // 移除全局事件监听
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('mouseleave', endDrag);
    
    // 更新响应式变量
    sidebarWidth.value = tempSidebarWidth;
    propertiesWidth.value = tempPropertiesWidth;
    contentHeight.value = tempContentHeight;
    
    // 同步导航菜单折叠状态
    // 当侧边栏宽度小于100px时，自动折叠导航菜单
    // 当侧边栏宽度大于100px时，自动展开导航菜单
    if (dragType.value === 'sidebar') {
      const collapseThreshold = 100;
      const newCollapsedState = sidebarWidth.value < collapseThreshold;
      if (newCollapsedState !== isMenuCollapsed.value) {
        isMenuCollapsed.value = newCollapsedState;
      }
    }
    
    isDragging.value = false;
    dragType.value = '';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
    
    // 移除拖拽状态类
    document.body.classList.remove('dragging');
    
    // 清理缓存变量
    dragContainer = null;
    dragContainerRect = null;
    dragContentContainer = null;
    dragContentRect = null;
    lastDragTime = 0;
    
    // 保存 Splitter 状态
    saveSplitterState();
  }
};

// 重置布局
const resetLayout = () => {
  sidebarWidth.value = 200;
  propertiesWidth.value = 300;
  contentHeight.value = 600;
  saveSplitterState();
};

// 初始化
initSplitterState();

// 设置窗口状态
const isSettingsWindowVisible = ref(false);

// 自动重连功能
const autoReconnect = ref(false);
let reconnectInterval: number | null = null;

// 窗口状态管理
const windowState = reactive({
  isMaximized: false,
  isMinimized: false,
  bounds: {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
});

// 窗口控制方法
const minimizeWindow = async () => {
  await window.electron.ipcRenderer.invoke('window:minimize');
  updateWindowState();
  // 触发窗口状态变化回调
  onWindowStateChange('minimize');
};

const maximizeWindow = async () => {
  await window.electron.ipcRenderer.invoke('window:maximize');
  updateWindowState();
  // 触发窗口状态变化回调
  onWindowStateChange(windowState.isMaximized ? 'maximize' : 'unmaximize');
};

const closeWindow = () => {
  window.electron.ipcRenderer.invoke('window:close');
  // 触发窗口状态变化回调
  onWindowStateChange('close');
};

// 更新窗口状态
const updateWindowState = async () => {
  const state = await window.electron.ipcRenderer.invoke('window:get-state');
  if (state) {
    windowState.isMaximized = state.isMaximized;
    windowState.isMinimized = state.isMinimized;
    windowState.bounds = state.bounds;
  }
};

// 窗口状态变化回调函数
const onWindowStateChange = (event: string) => {
  console.log('窗口状态变化:', event, windowState);
  
  // 自定义的状态变化处理逻辑
  switch (event) {
    case 'minimize':
      console.log('窗口最小化');
      // 可以添加最小化时的处理逻辑
      break;
    case 'maximize':
      console.log('窗口最大化');
      // 可以添加最大化时的处理逻辑
      break;
    case 'unmaximize':
      console.log('窗口还原');
      // 可以添加还原时的处理逻辑
      break;
    case 'close':
      console.log('窗口关闭');
      // 可以添加关闭时的处理逻辑
      break;
    case 'resize':
      console.log('窗口调整大小:', windowState.bounds.width, 'x', windowState.bounds.height);
      // 可以添加调整大小时的处理逻辑
      break;
    default:
      break;
  }
  
  // 触发自定义事件，允许其他组件监听窗口状态变化
  // 这里可以使用Vue的事件系统或其他状态管理方案
};

// 窗口调整方法
const resizeWindow = async (width: number, height: number) => {
  await window.electron.ipcRenderer.invoke('window:resize', width, height);
  updateWindowState();
  // 触发窗口状态变化回调
  onWindowStateChange('resize');
};

// 标签页操作
const openTab = (button: any) => {
  // 检查标签页是否已打开
  const existingTab = openedTabs.value.find(tab => tab.key === button.key);
  if (!existingTab) {
    // 添加新标签页
    openedTabs.value.push({
      key: button.key,
      label: button.label,
      icon: button.icon,
      isFixed: false
    });
  }
  // 激活标签页
  activeTab.value = button.key;
  
  // 当切换到从机扫描标签页时，默认开启数据追踪
  if (button.key === 'slaveScan') {
    traceEnabled.value = true;
    addLog('Data trace enabled for slave scan', 'info');
  }
};

// 递归查找菜单项（包括子菜单）
const findMenuItem = (items: any[], key: string): any => {
  for (const item of items) {
    if (item.key === key) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findMenuItem(item.children, key);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// 处理导航菜单选择
const handleMenuSelect = (key: string) => {
  // 查找对应的按钮配置（包括子菜单）
  const button = findMenuItem(buttonBarItems, key);
  if (button) {
    openTab(button);
  }
};

// 切换导航菜单折叠状态
const toggleMenuCollapse = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value;
  // 同步更新侧边栏宽度，确保Splitter位置与导航菜单宽度一致
  sidebarWidth.value = isMenuCollapsed.value ? 64 : 200;
  // 保存到本地存储
  localStorage.setItem('sidebarWidth', sidebarWidth.value.toString());
};

// 处理导航菜单大小调整
const handleNavigationResize = (newWidth: number) => {
  sidebarWidth.value = newWidth;
  // 保存到本地存储
  localStorage.setItem('sidebarWidth', sidebarWidth.value.toString());
  // 同步更新导航菜单折叠状态
  const collapseThreshold = 100;
  const newCollapsedState = sidebarWidth.value < collapseThreshold;
  if (newCollapsedState !== isMenuCollapsed.value) {
    isMenuCollapsed.value = newCollapsedState;
  }
};

// 设备管理相关方法

// 显示添加设备对话框
const showAddDeviceDialog = () => {
  currentDevice.value = {
    name: '',
    description: '', // 设备描述
    deviceCategory: '', // 总线节点：LIN、CAN、MODBUS
    type: '', // 设备型号
    serialConfig: {
      port: '',
      baudRate: 460800 // 默认波特率
    },
    linConfig: {
      baudRate: 19200, // LIN标准波特率
      mode: 0 // 待机模式
    },
    status: {
      serialConnected: false,
      linStatus: false,
      autoReconnect: true // 默认开启自动重连
    }
  };
  deviceDialogTitle.value = '添加设备';
  deviceDialogVisible.value = true;
};

// 显示设备详情抽屉
const showDeviceDetail = (device: any) => {
  // 设置选中的设备
  deviceManager.selectDevice(device.id);
  // 打开设备详情抽屉
  deviceDetailDrawerVisible.value = true;
};

// 显示编辑设备对话框
const showEditDeviceDialog = (deviceId) => {
  const device = deviceManager.getDevice(deviceId);
  if (device) {
    // 确保设备对象包含deviceCategory属性
    if (!device.deviceCategory) {
      // 为旧设备添加默认总线节点
      device.deviceCategory = 'LIN';
    }
    currentDevice.value = { ...device };
    deviceDialogTitle.value = '编辑设备';
    deviceDialogVisible.value = true;
  }
};

// 保存设备
const saveDevice = () => {
  if (!currentDevice.value.name) {
    ElMessage.warning('请输入设备名称');
    return;
  }
  
  if (!currentDevice.value.deviceCategory) {
    ElMessage.warning('请选择总线节点');
    return;
  }
  
  if (!currentDevice.value.type) {
    ElMessage.warning('请选择设备型号');
    return;
  }
  
  // 根据总线节点和设备型号设置特定参数
  if (currentDevice.value.deviceCategory === 'LIN' && currentDevice.value.type === 'LINTest-M') {
    currentDevice.value.serialConfig.baudRate = 460800; // 强制设置为LINTest-M标准波特率
    currentDevice.value.status.autoReconnect = true; // 强制开启自动重连
    addLog(`Configuring LINTest-M device with standard settings`, 'info');
  }
  
  try {
    if (deviceDialogTitle.value === '添加设备') {
      // 添加新设备
      deviceManager.addDevice(currentDevice.value);
      addLog(`Device added: ${currentDevice.value.name} (${currentDevice.value.deviceCategory} - ${currentDevice.value.type})`, 'success');
      ElMessage.success('设备添加成功');
      
      // 如果是LINTest-M设备，提示用户如何使用
      if (currentDevice.value.deviceCategory === 'LIN' && currentDevice.value.type === 'LINTest-M') {
        ElMessage.info('LINTest-M设备已添加，默认配置已应用。请在设备列表中连接设备后使用LIN收发功能。');
      }
    } else {
      // 编辑设备
      deviceManager.updateDevice(currentDevice.value.id, currentDevice.value);
      addLog(`Device updated: ${currentDevice.value.name} (${currentDevice.value.deviceCategory} - ${currentDevice.value.type})`, 'success');
      ElMessage.success('设备更新成功');
    }
    
    deviceDialogVisible.value = false;
  } catch (error: any) {
    addLog(`Error saving device: ${error.message}`, 'error');
    ElMessage.error(error.message);
  }
};

// 抽屉大小调整相关变量
let isResizing = false;
let resizeType = '';
let startX = 0;
let startWidth = 0;
let currentDrawerContent: HTMLElement | null = null;
let resizeFrameId: number | null = null;

// 开始调整抽屉大小
const startResize = (type: string, event: MouseEvent) => {
  isResizing = true;
  resizeType = type;
  startX = event.clientX;
  
  // 获取当前点击的抽屉元素
  const handle = event.currentTarget as HTMLElement;
  currentDrawerContent = handle.closest('.el-drawer');
  if (currentDrawerContent) {
    startWidth = currentDrawerContent.getBoundingClientRect().width;
  }
  
  // 添加鼠标移动和鼠标松开事件监听器
  document.addEventListener('mousemove', resizeDrawer);
  document.addEventListener('mouseup', stopResize);
  
  // 防止默认事件和事件冒泡
  event.preventDefault();
  event.stopPropagation();
};

// 调整抽屉大小
const resizeDrawer = (event: MouseEvent) => {
  if (!isResizing || !currentDrawerContent) return;
  
  // 使用 requestAnimationFrame 优化重绘
  if (resizeFrameId) {
    cancelAnimationFrame(resizeFrameId);
  }
  
  resizeFrameId = requestAnimationFrame(() => {
    // 计算新的宽度
    const deltaX = startX - event.clientX;
    const newWidth = startWidth + deltaX;
    
    // 限制最小宽度
    const minWidth = 300;
    if (newWidth < minWidth) return;
    
    // 设置抽屉宽度
    currentDrawerContent!.style.width = `${newWidth}px`;
  });
  
  // 防止默认事件
  event.preventDefault();
};

// 停止调整抽屉大小
const stopResize = (event: MouseEvent) => {
  isResizing = false;
  resizeType = '';
  startX = 0;
  startWidth = 0;
  
  // 取消动画帧
  if (resizeFrameId) {
    cancelAnimationFrame(resizeFrameId);
    resizeFrameId = null;
  }
  
  // 清理抽屉元素引用
  currentDrawerContent = null;
  
  // 移除鼠标事件监听器
  document.removeEventListener('mousemove', resizeDrawer);
  document.removeEventListener('mouseup', stopResize);
};

// 删除设备
const deleteDevice = (deviceId) => {
  ElMessageBox.confirm('确定要删除该设备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deviceManager.deleteDevice(deviceId);
    ElMessage.success('设备删除成功');
  }).catch(() => {
    // 取消删除
  });
};

// 切换设备连接状态
// 设备连接操作防抖
let lastConnectionOperation = '';
let connectionOperationTimestamp = 0;
const connectionOperationDebounceTime = 2000; // 2秒防抖

const toggleDeviceConnection = async (deviceId) => {
  try {
    const device = deviceManager.getDevice(deviceId);
    if (device) {
      const operationKey = `${device.status.serialConnected ? 'disconnect' : 'connect'}-${deviceId}`;
      
      // 防抖处理，避免短时间内多次触发相同的操作
      const now = Date.now();
      if (operationKey === lastConnectionOperation && now - connectionOperationTimestamp < connectionOperationDebounceTime) {
        return; // 忽略重复的连接/断开操作
      }
      
      lastConnectionOperation = operationKey;
      connectionOperationTimestamp = now;
      
      if (!device.status.serialConnected) {
        // 连接设备
        addLog(`Connecting device: ${device.name} (${device.serialConfig.port})`, 'info');
        
        // 调用后端连接方法
        const result = await window.electron.serial.openPort(device.serialConfig.port, { deviceType: device.type }, deviceId);
        
        if (result.success) {
          deviceManager.updateDeviceStatus(deviceId, {
            serialConnected: true,
            linStatus: true
          });
          addLog(`Device connected successfully: ${device.name}`, 'success');
          ElMessage.success(`设备连接成功: ${device.name}`);
          
          // 设备初始化
          await initializeDevice(deviceId, device);
        } else {
          addLog(`Failed to connect device: ${result.message}`, 'error');
          ElMessage.error(`设备连接失败: ${result.message}`);
        }
      } else {
        // 断开设备
        addLog(`Disconnecting device: ${device.name}`, 'info');
        
        // 调用后端断开方法
        const result = await window.electron.serial.closePort(deviceId);
        
        if (result.success) {
          deviceManager.updateDeviceStatus(deviceId, {
            serialConnected: false,
            linStatus: false
          });
          addLog(`Device disconnected successfully: ${device.name}`, 'success');
          ElMessage.success(`设备断开成功: ${device.name}`);
        } else {
          addLog(`Failed to disconnect device: ${result.message}`, 'error');
          ElMessage.error(`设备断开失败: ${result.message}`);
        }
      }
    }
  } catch (error) {
    addLog(`Error toggling device connection: ${error}`, 'error');
    ElMessage.error(`设备连接操作失败: ${error}`);
  }
};

// 设备初始化函数
const initializeDevice = async (deviceId, device) => {
  try {
    addLog(`Initializing device: ${device.name}`, 'info');
    
    // 设置默认LIN模式为主机模式
    await window.electron.lin.setMode(1, deviceId);
    addLog(`Set LIN mode to master for device: ${device.name}`, 'info');
    
    // 设置默认波特率
    await window.electron.lin.setBaudRate(19200, deviceId);
    addLog(`Set default baud rate to 19200 for device: ${device.name}`, 'info');
    
    // 为LINTest-M设备添加专门的初始化
    if (device.type === 'LINTest-M') {
      addLog(`Initializing LINTest-M device: ${device.name}`, 'info');
      // 这里可以添加LINTest-M设备的专门初始化逻辑
      // 例如：发送初始化命令、设置特定参数等
      addLog(`LINTest-M device initialized successfully: ${device.name}`, 'success');
    }
    
    addLog(`Device initialization completed: ${device.name}`, 'success');
  } catch (error) {
    addLog(`Error initializing device: ${error}`, 'error');
    ElMessage.warning(`设备初始化失败: ${error}`);
  }
};



// 打开测试抽屉
const openTestDrawer = (deviceId: string, device: any) => {
  testDeviceId.value = deviceId;
  testDeviceName.value = device.name;
  testDrawerTitle.value = `设备测试 - ${device.name}`;
  
  // 重置测试配置
  testConfig.baudRate = [9600, 10417, 19200];
  testConfig.checkType = 'V1';
  testConfig.idStart = '00';
  testConfig.idEnd = '3F';
  testConfig.dataLength = 8;
  testConfig.randomData = '';
  
  // 清空测试结果
  testResults.value = [];
  testSummary.successCount = 0;
  testSummary.errorCount = 0;
  testSummary.totalCount = 0;
  
  testDrawerVisible.value = true;
  addLog(`Opened test drawer for device: ${device.name}`, 'info');
};

// 生成随机测试数据
const generateRandomTestData = () => {
  const dataLength = testConfig.dataLength;
  const randomData = Array.from({ length: dataLength }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(' ');
  
  testConfig.randomData = randomData;
  addLog(`Generated random test data: ${randomData}`, 'info');
};

// 执行测试
const executeTest = async () => {
  if (!testDeviceId.value) {
    ElMessage.error('测试设备未指定');
    return;
  }
  
  const device = deviceManager.getDevice(testDeviceId.value);
  if (!device || !device.status.serialConnected) {
    ElMessage.warning('设备未连接，请先连接设备');
    return;
  }
  
  if (testConfig.baudRate.length === 0) {
    ElMessage.warning('请至少选择一个波特率');
    return;
  }
  
  // 解析并验证ID范围
  const idStart = parseInt(testConfig.idStart, 16) || 0;
  const idEnd = parseInt(testConfig.idEnd, 16) || 63;
  
  // 验证ID范围是否符合LIN协议要求
  if (idStart < 0 || idStart > 63 || idEnd < 0 || idEnd > 63) {
    ElMessage.warning('ID范围必须在00-3F之间（十六进制）');
    return;
  }
  
  if (idStart > idEnd) {
    ElMessage.warning('起始ID不能大于结束ID');
    return;
  }
  
  isExecutingTest.value = true;
  addLog(`Starting test for device: ${device.name}`, 'info');
  
  try {
    // 清空之前的测试结果
    testResults.value = [];
    testSummary.successCount = 0;
    testSummary.errorCount = 0;
    testSummary.totalCount = 0;
    
    // 执行测试
    for (const baudRate of testConfig.baudRate) {
      addLog(`Testing at baud rate: ${baudRate}`, 'info');
      
      // 设置波特率
      await window.electron.lin.setBaudRate(baudRate, testDeviceId.value);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 测试ID范围
      for (let id = idStart; id <= idEnd; id++) {
        try {
          // 使用随机数据或生成新的随机数据
          let testData = testConfig.randomData;
          if (!testData) {
            testData = Array.from({ length: testConfig.dataLength }, () => 
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
            ).join(' ');
          }
          
          // 发送测试数据
          const result = await window.electron.lin.sendData({
            id: id,
            data: testData,
            length: testConfig.dataLength,
            checkType: testConfig.checkType,
            deviceId: testDeviceId.value
          });
          
          // 记录测试结果
          const testResult = {
            baudRate,
            id,
            checkType: testConfig.checkType,
            success: result.success,
            error: result.success ? '' : result.message
          };
          
          testResults.value.push(testResult);
          
          if (result.success) {
            testSummary.successCount++;
            addLog(`Test passed: Baud=${baudRate}, ID=0x${id.toString(16).padStart(2, '0').toUpperCase()}, Check=${testConfig.checkType}`, 'success');
          } else {
            testSummary.errorCount++;
            addLog(`Test failed: Baud=${baudRate}, ID=0x${id.toString(16).padStart(2, '0').toUpperCase()}, Check=${testConfig.checkType}, Error=${result.message}`, 'error');
          }
          
          testSummary.totalCount++;
          
          // 等待一段时间，避免发送过快
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          const testResult = {
            baudRate,
            id,
            checkType: testConfig.checkType,
            success: false,
            error: String(error)
          };
          
          testResults.value.push(testResult);
          testSummary.errorCount++;
          testSummary.totalCount++;
          addLog(`Test error: Baud=${baudRate}, ID=0x${id.toString(16).padStart(2, '0').toUpperCase()}, Check=${testConfig.checkType}, Error=${error}`, 'error');
        }
      }
    }
    
    // 测试完成
    addLog(`Test completed for device: ${device.name}`, 'info');
    ElMessage.success(`测试完成: ${device.name}\n成功: ${testSummary.successCount}\n失败: ${testSummary.errorCount}`);
    
  } catch (error) {
    addLog(`Error executing test: ${error}`, 'error');
    ElMessage.error(`测试执行失败: ${error}`);
  } finally {
    isExecutingTest.value = false;
  }
};

// 发送测试序列函数（兼容旧代码）
const sendTestSequence = async (deviceId: string, device: any) => {
  openTestDrawer(deviceId, device);
};

// 处理设备行点击
const handleDeviceRowClick = (row) => {
  deviceManager.selectedDeviceId = row.id;
};

// 设备行样式
const deviceRowClassName = ({ row }) => {
  return row.id === deviceManager.selectedDeviceId ? 'device-row-selected' : '';
};

// 获取LIN模式文本
const getLinModeText = (mode) => {
  switch (mode) {
    case 0: return '待机';
    case 1: return '主机';
    case 2: return '从机';
    case 3: return '监听';
    default: return '未知';
  }
};

// 更新设备自动重连设置
const updateDeviceAutoReconnect = (deviceId, value) => {
  deviceManager.updateDeviceStatus(deviceId, {
    autoReconnect: value
  });
};

// 打开设置窗口
const openSettingsWindow = () => {
  isSettingsWindowVisible.value = true;
};

// 关闭设置窗口
const closeSettingsWindow = () => {
  isSettingsWindowVisible.value = false;
};

// 打开设备列表标签页
const handleDeviceList = () => {
  // 检查设备列表标签页是否已打开
  const existingTab = openedTabs.value.find(tab => tab.key === 'deviceList');
  if (!existingTab) {
    // 添加新标签页
    openedTabs.value.push({
      key: 'deviceList',
      label: '设备列表',
      icon: List,
      isFixed: false
    });
  }
  // 激活标签页
  activeTab.value = 'deviceList';
};

// 处理语言变更
const handleLanguageChange = (language: string) => {
  // 这里可以添加语言切换逻辑
  console.log('Language changed to:', language);
  localStorage.setItem('language', language);
};

// 处理主题变更
const handleThemeChange = (theme: string) => {
  // 这里可以添加主题切换逻辑
  console.log('Theme changed to:', theme);
  localStorage.setItem('theme', theme);
  // 应用主题到文档
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
};

const removeTab = (targetName: string) => {
  const tabs = openedTabs.value;
  let activeIndex = tabs.findIndex(tab => tab.key === activeTab.value);
  
  // 如果关闭的是当前活跃标签页，切换到前一个标签页
  if (targetName === activeTab.value) {
    tabs.forEach((tab, index) => {
      if (tab.key === targetName) {
        const nextTab = tabs[index + 1] || tabs[index - 1];
        if (nextTab) {
          activeTab.value = nextTab.key;
        }
      }
    });
  }
  
  // 移除标签页
  openedTabs.value = tabs.filter(tab => tab.key !== targetName);
};

// 应用运行时间计算
const startTime = ref(Date.now());
let uptimeInterval: number | null = null;
const uptime = computed(() => {
  const diff = Date.now() - startTime.value;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// 组件生命周期
onMounted(async () => {
  // 注册拖拽区域
  const dragRegion = document.getElementById('drag-region');
  if (dragRegion) {
    dragRegion.addEventListener('mousedown', (e) => {
      // 仅当左键点击时触发拖拽
      if (e.button === 0) {
        window.electron.ipcRenderer.invoke('window:start-drag');
      }
    });
  }
  
  // 初始化窗口状态
  updateWindowState();
  
  // 更新运行时间
  uptimeInterval = window.setInterval(() => {
    // 强制更新计算属性
    startTime.value = startTime.value;
  }, 1000);
  
  // 加载设置
  await loadSettings();
  
  // 初始化其他功能
  refreshPorts();
  setupEventListeners();
  
  // 自动打开串口
  if (serialConfig.port) {
    setTimeout(async () => {
      try {
        addLog(`Application startup, attempting to automatically open serial port: ${serialConfig.port}...`);
        const result = await window.electron.serial.openPort(serialConfig.port, {});
        if (result.success) {
          serialConnected.value = true;
          linStatus.value = true;
          addLog(`Serial port ${serialConfig.port} automatically opened successfully`, 'success');
          ElMessage.success(`串口 ${serialConfig.port} 自动打开成功`);
        } else {
          addLog(`Failed to automatically open serial port ${serialConfig.port}: ${result.message}`, 'error');
          ElMessage.warning(`串口 ${serialConfig.port} 自动打开失败，设备可能离线`);
        }
      } catch (error) {
        addLog(`Failed to automatically open serial port: ${error}`, 'error');
        ElMessage.warning('设备已离线，请检查连接');
      }
    }, 1000);
  }
  
  // 设置ResizeObserver监听content-bottom容器大小变化
  const setupContentBottomResizeObserver = () => {
    const contentBottom = document.querySelector('.content-bottom');
    if (contentBottom) {
      contentBottomResizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // 当容器大小变化时，重新计算表格布局
          if (traceTableRef.value) {
            traceTableRef.value.doLayout();
          }
          
          // 确保表格容器能够正确填充可用空间
          const tracePanel = document.querySelector('.trace-panel-container');
          if (tracePanel) {
            // 触发重排，确保Flexbox布局正确计算
            tracePanel.style.display = 'none';
            tracePanel.offsetHeight; // 强制重排
            tracePanel.style.display = 'flex';
          }
          
          // 确保表格容器高度正确更新
          const traceTableContainer = document.querySelector('.trace-table-container');
          if (traceTableContainer) {
            // 触发重排，确保Flexbox布局正确计算
            traceTableContainer.style.height = '0px';
            traceTableContainer.offsetHeight; // 强制重排
            traceTableContainer.style.height = 'auto';
          }
        }
      });
      contentBottomResizeObserver.observe(contentBottom);
    }
  };
  setupContentBottomResizeObserver();
  
  // 定时刷新串口列表
  const interval = setInterval(() => {
    if (!serialConnected.value) {
      refreshPorts();
      // 离线提示
      if (serialConfig.port) {
        addLog('Device is offline, attempting to reconnect...', 'warning');
      }
    }
  }, 5000);
  
  // 滚动事件处理函数
  const handleScroll = () => {
    if (isLoading.value) return;
    
    if (traceTableRef.value) {
      const bodyWrapper = traceTableRef.value.$el.querySelector('.el-table__body-wrapper');
      if (bodyWrapper) {
        // 计算滚动阈值（面板高度的五分之一）
        const panelHeight = bodyWrapper.clientHeight;
        const scrollThreshold = Math.max(50, panelHeight / 5); // 确保最小阈值为50px
        
        // 计算滚动位置
        const scrollTop = bodyWrapper.scrollTop;
        const scrollHeight = bodyWrapper.scrollHeight;
        const clientHeight = bodyWrapper.clientHeight;
        
        // 当滚动到离底部小于阈值时，加载更多数据
        if (scrollHeight > clientHeight && scrollHeight - scrollTop - clientHeight < scrollThreshold) {
          loadMoreData();
        }
      }
    }
  };
  
  // 加载更多数据
  const loadMoreData = async () => {
    if (isLoading.value) return;
    
    // 检查是否还有更多数据可以加载
    const totalFiltered = filteredTraceFrames.value.length;
    const currentLoaded = currentPage.value * pageSize.value;
    
    if (currentLoaded >= totalFiltered) return;
    
    isLoading.value = true;
    
    try {
      // 模拟加载延迟
      await new Promise(resolve => setTimeout(resolve, 300)); // 减少延迟，提升用户体验
      
      // 增加页码，加载更多数据
      currentPage.value += 1;
    } catch (error) {
      console.error('加载更多数据失败:', error);
      ElMessage.error('加载更多数据失败，请重试');
    } finally {
      isLoading.value = false;
    }
  };
  
  // 添加滚动事件监听
  const setupScrollListener = () => {
    if (traceTableRef.value) {
      const bodyWrapper = traceTableRef.value.$el.querySelector('.el-table__body-wrapper');
      if (bodyWrapper) {
        bodyWrapper.addEventListener('scroll', handleScroll);
      }
    }
  };
  
  // 移除滚动事件监听
  const removeScrollListener = () => {
    if (traceTableRef.value) {
      const bodyWrapper = traceTableRef.value.$el.querySelector('.el-table__body-wrapper');
      if (bodyWrapper) {
        bodyWrapper.removeEventListener('scroll', handleScroll);
      }
    }
  };
  
  // 设置滚动监听
  setupScrollListener();
  
  // 组件卸载时清除定时器和事件监听
  onUnmounted(() => {
    clearInterval(interval);
    if (sendInterval) {
      clearInterval(sendInterval);
      sendInterval = null;
    }
    if (uptimeInterval) {
      clearInterval(uptimeInterval);
      uptimeInterval = null;
    }
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    // 断开ResizeObserver
    if (contentBottomResizeObserver) {
      contentBottomResizeObserver.disconnect();
      contentBottomResizeObserver = null;
    }
    // 移除滚动事件监听
    removeScrollListener();
  });
});

// 类型定义
interface PortInfo {
  path: string;
  manufacturer: string;
  serialNumber: string;
  pnpId: string;
  locationId: string;
}

interface ParsedLinFrame {
  type: number;
  raw: Buffer;
  id: string;
  direction: string;
  channel: string;
  data: string;
  status: string;
  checksum: string;
  length: number;
}

interface ReceivedFrame {
  id: string;
  pid?: string;
  direction: string;
  channel: string;
  data: string;
  status: string;
  checksum: string;
  checksumType: string;
  checksumValid: boolean;
  timestamp: string;
}

interface LogItem {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

// 扫描结果类型
interface ScanResult {
  id: number;
  baudRate: number;
  dataLength: number;
  checkType: string;
  data: string;
  success: boolean;
  checksum?: string; // 校验和
  hasData?: boolean; // 是否有有效数据
  needsVerification?: boolean; // 是否需要用户验证
}

// 扫描配置类型
interface ScanConfig {
  baudRates: number[];
  idRange: [number, number];
  interval: number; // 扫描间隔时间（毫秒）
}

// 爆破发送配置类型
interface BruteForceConfig {
  baudRate: number;
  idRange: [string, string];
  skipIds: string;
  checksumType: 'V1' | 'V2';
  scanMode: 'normal';
  scanOrder: 'sequential' | 'binary' | 'random';
  lengthRange: [number, number];
  interval: number;
}

// 爆破发送结果类型
interface BruteForceResult {
  id: number;
  data: string;
  checksum: string;
  response: string;
  status: 'success' | 'error';
  timestamp: string;
}

// 响应式数据
const availablePorts = ref<PortInfo[]>([]);
const serialConnected = ref(false);
const linStatus = ref(false);

// 从机扫描相关数据
const isScanning = ref(false);
const scanProgress = ref('');
const scanResults = ref<ScanResult[]>([]);
const currentScanId = ref(''); // 当前扫描任务ID
const currentLinId = ref(''); // 当前扫描的LIN ID
const currentBaudRate = ref(''); // 当前扫描的波特率

// 帧编辑随机设置选项
const randomSettings = ref([]); // 初始化为空数组，在mounted后设置值

const scanConfig = reactive<ScanConfig>({
  baudRates: [9600, 19200, 10400],
  idRange: [0, 63],
  interval: 50 // 默认扫描间隔时间（毫秒）
});

// 十六进制ID范围输入处理
const hexIdStart = computed({
  get: () => scanConfig.idRange[0].toString(16).toUpperCase().padStart(2, '0'),
  set: (value: string) => {
    const num = parseInt(value, 16);
    if (!isNaN(num) && num >= 0 && num <= 63) {
      scanConfig.idRange[0] = num;
    }
  }
});

const hexIdEnd = computed({
  get: () => scanConfig.idRange[1].toString(16).toUpperCase().padStart(2, '0'),
  set: (value: string) => {
    const num = parseInt(value, 16);
    if (!isNaN(num) && num >= 0 && num <= 63) {
      scanConfig.idRange[1] = num;
    }
  }
});

// 列表收发数据
interface ScheduleFrame {
  id: string;
  length: number;
  interval: number;
  data: string;
  direction: 'send' | 'receive';
  description?: string;
  randomEnabled?: boolean;
  enabled?: boolean;
}

const scheduleFrames = ref<ScheduleFrame[]>([]);
const isScheduleSending = ref(false);
const currentFrameIndex = ref(0);
const totalSentFrames = ref(0);
const currentScheduleFrame = ref('');
const frameDialogVisible = ref(false);
const isEditingFrame = ref(false);
const editingFrameIndex = ref(-1);
const dataInputMode = ref('manual');

const currentFrame = reactive<ScheduleFrame>({
  id: '00',
  length: 4,
  interval: 100,
  data: '00 00 00 00',
  direction: 'send',
  description: '',
  randomEnabled: false
});

// 批量添加配置
const batchAddDialogVisible = ref(false);
const batchAddConfig = reactive({
  startId: '00',
  endId: '0F',
  length: 4,
  interval: 100,
  data: '00 00 00 00',
  direction: 'send' as 'send' | 'receive',
  description: ''
});

// 批量操作配置
const batchOperationDialogVisible = ref(false);
const batchOperationConfig = reactive({
  operation: 'enable', // enable, disable, delete, length, interval, data
  ids: [] as string[],
  length: 4,
  interval: 100,
  data: '00 00 00 00',
  randomData: false
});

// 表格选择相关
const multipleSelection = ref<ScheduleFrame[]>([]);
const handleSelectionChange = (val: ScheduleFrame[]) => {
  multipleSelection.value = val;
};
const handleSelectAll = (val: ScheduleFrame[]) => {
  multipleSelection.value = val;
};

let scheduleSendInterval: number | null = null;

// 配置数据
const serialConfig = reactive({
  port: '',
});



const sendConfig = reactive({
  id: '00',
  data: '00 00 00 00',
  bytes: [
    { high: 0, low: 0 },
    { high: 0, low: 0 },
    { high: 0, low: 0 },
    { high: 0, low: 0 },
    { high: 0, low: 0 },
    { high: 0, low: 0 },
    { high: 0, low: 0 },
    { high: 0, low: 0 }
  ],
  length: 4,
  checkType: 'V1',
  baudRate: 19200,
  loopSend: false,
  loopInterval: 20,
  randomOnLoop: false,
  randomId: false,
  randomLength: false,
  randomData: true,
});

// 数据生成器配置
const dataGeneratorDrawerVisible = ref(false);
const dataGeneratorConfig = reactive({
  byteIndex: 0,
  configType: 'high',
  range: {
    min: 0,
    max: 15
  },
  step: 1,
  enabled: false,
  generateMode: 'increment'
});

// 监听波特率变化，自动执行波特率调节命令
watch(
  () => sendConfig.baudRate,
  async (newBaudRate, oldBaudRate) => {
    if (newBaudRate !== oldBaudRate && selectedDeviceForSend) {
      try {
        addLog(`正在设置波特率: ${newBaudRate}`, 'info');
        
        // 发送IPC消息到主进程设置波特率
        const result = await window.electron.lin.setBaudRate(newBaudRate, selectedDeviceForSend.value);
        
        if (result.success) {
          addLog(`波特率设置成功: ${newBaudRate}`, 'success');
          ElMessage.success(`波特率设置成功: ${newBaudRate}`);
        } else {
          addLog(`波特率设置失败: ${result.message}`, 'error');
          ElMessage.error(`波特率设置失败: ${result.message}`);
          // 恢复原来的波特率
          sendConfig.baudRate = oldBaudRate;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLog(`波特率设置出错: ${errorMessage}`, 'error');
        ElMessage.error(`波特率设置出错: ${errorMessage}`);
        // 恢复原来的波特率
        sendConfig.baudRate = oldBaudRate;
      }
    }
  }
);

// 发送状态管理
const isSending = ref(false);
let sendInterval: number | null = null;

// 更新字节数据
const updateByteData = (index: number) => {
  const bytes = sendConfig.bytes.slice(0, sendConfig.length);
  const dataArray = bytes.map(byte => {
    const value = (byte.high << 4) | byte.low;
    return value.toString(16).toUpperCase().padStart(2, '0');
  });
  sendConfig.data = dataArray.join(' ');
};

// 获取二进制值
const getBinaryValue = (index: number) => {
  const byte = sendConfig.bytes[index];
  const value = (byte.high << 4) | byte.low;
  return value.toString(2).padStart(8, '0');
};

// 从二进制更新
const updateFromBinary = (index: number, event: any) => {
  let binaryStr = event.target.value;
  // 只保留0和1
  binaryStr = binaryStr.replace(/[^01]/g, '');
  // 限制长度为8位
  binaryStr = binaryStr.slice(-8).padStart(8, '0');
  
  const value = parseInt(binaryStr, 2);
  const byte = sendConfig.bytes[index];
  byte.high = (value >> 4) & 0x0F;
  byte.low = value & 0x0F;
  updateByteData(index);
};

// 获取指定位的值
const getBitValue = (index: number, bitPosition: number) => {
  const byte = sendConfig.bytes[index];
  const value = (byte.high << 4) | byte.low;
  return (value & (1 << bitPosition)) !== 0;
};

// 切换指定位的值
const toggleBit = (index: number, bitPosition: number) => {
  const byte = sendConfig.bytes[index];
  let value = (byte.high << 4) | byte.low;
  value ^= (1 << bitPosition);
  byte.high = (value >> 4) & 0x0F;
  byte.low = value & 0x0F;
  updateByteData(index);
};

// 处理鼠标滚轮事件
const handleWheel = (event: WheelEvent, index: number, part: 'high' | 'low') => {
  event.preventDefault();
  const byte = sendConfig.bytes[index];
  const delta = event.deltaY > 0 ? -1 : 1;
  
  if (part === 'high') {
    byte.high = Math.max(0, Math.min(15, byte.high + delta));
  } else {
    byte.low = Math.max(0, Math.min(15, byte.low + delta));
  }
  
  updateByteData(index);
};

// 清零所有字节
const clearAllBytes = () => {
  sendConfig.bytes.forEach(byte => {
    byte.high = 0;
    byte.low = 0;
  });
  updateByteData(0);
};

// 打开数据生成器抽屉
const openDataGeneratorDrawer = (index) => {
  dataGeneratorConfig.byteIndex = index;
  dataGeneratorDrawerVisible.value = true;
};

// 生成数据
const generateData = () => {
  const { byteIndex, configType, range, step, enabled, generateMode } = dataGeneratorConfig;
  
  // 检查是否启用了生成器
  if (!enabled) {
    ElMessage.warning('请先启用生成器');
    return;
  }
  
  const byte = sendConfig.bytes[byteIndex];
  
  if (generateMode === 'increment') {
    // 递增循环模式
    if (configType === 'high') {
      byte.high += step;
      if (byte.high > range.max) {
        byte.high = range.min;
      }
    } else {
      byte.low += step;
      if (byte.low > range.max) {
        byte.low = range.min;
      }
    }
  }
  
  updateByteData(byteIndex);
  dataGeneratorDrawerVisible.value = false;
};

// 生成随机ID
const generateRandomId = () => {
  const randomId = Math.floor(Math.random() * 64); // 0-63
  sendConfig.id = randomId.toString(16).toUpperCase().padStart(2, '0');
  addLog(`已生成随机ID: ${sendConfig.id}`, 'info');
};

// 生成随机长度
const generateRandomLength = () => {
  const randomLength = Math.floor(Math.random() * 8) + 1; // 1-8
  sendConfig.length = randomLength;
  addLog(`已生成随机长度: ${sendConfig.length}`, 'info');
};

// 生成随机数据
const generateRandomBytes = () => {
  for (let i = 0; i < sendConfig.length; i++) {
    const byte = sendConfig.bytes[i];
    byte.high = Math.floor(Math.random() * 16);
    byte.low = Math.floor(Math.random() * 16);
  }
  updateByteData(0);
};

// 当长度变化时更新数据
watch(
  () => sendConfig.length,
  () => {
    updateByteData(0);
  }
);

// 初始化bytes数组从data字符串
const initBytesFromData = () => {
  const dataArray = sendConfig.data.split(' ').filter(item => item !== '');
  dataArray.forEach((hex, index) => {
    if (index < sendConfig.bytes.length) {
      const value = parseInt(hex, 16);
      sendConfig.bytes[index].high = (value >> 4) & 0x0F;
      sendConfig.bytes[index].low = value & 0x0F;
    }
  });
};

// 组件挂载时初始化
onMounted(() => {
  initBytesFromData();
});

// 接收数据
const receivedFrames = ref<ReceivedFrame[]>([]);
const logs = ref<LogItem[]>([]);



// 爆破发送相关数据
const isBruteForcing = ref(false);
const bruteForceProgress = ref(0);
const bruteForceResults = ref<BruteForceResult[]>([]);
let bruteForceInterval: number | null = null;
let currentBruteForceId = ref(0);
const currentLength = ref('');
const currentData = ref('');
let bruteForceAbortController: AbortController | null = null;

const bruteForceConfig = reactive<BruteForceConfig>({
  baudRate: 19200,
  idRange: ['00', '3F'],
  skipIds: '',
  checksumType: 'V1',
  scanMode: 'normal',
  scanOrder: 'sequential',
  lengthRange: [1, 8],
  interval: 20
});

// 数据追踪模块数据
const traceEnabled = ref(false); // 数据追踪功能开关，默认关闭
const traceMode = ref('scroll'); // 数据追踪模式：scroll（滚动）或 overlay（覆盖），默认滚动模式
const currentBusId = ref(''); // 当前总线ID，用于覆盖模式
// 加载状态
const isLoading = ref(false);

// 计算属性
const serialStatus = computed(() => {
  return serialConnected.value ? '已连接' : '未连接';
});



// 方法
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.unshift({ message, type, timestamp });
  // 最多保留100条日志
  if (logs.value.length > 100) {
    logs.value.pop();
  }
};

const refreshPorts = async () => {
  try {
    addLog('Starting to refresh serial port list...');
    const ports = await window.electron.serial.getPorts();
    availablePorts.value = ports;
    // 同步到设备管理器
    deviceManager.refreshAvailablePorts(ports);
    addLog(`Found ${ports.length} available serial ports`, 'success');
  } catch (error) {
    addLog(`Failed to refresh serial port list: ${error}`, 'error');
    ElMessage.error('刷新串口列表失败');
  }
};

const openSerialPort = async () => {
  if (!serialConfig.port) {
    ElMessage.warning('请先选择串口');
    return;
  }
  
  try {
    addLog(`Opening serial port: ${serialConfig.port}...`);
    const result = await window.electron.serial.openPort(serialConfig.port, {});
    if (result.success) {
      serialConnected.value = true;
      addLog(`Serial port ${serialConfig.port} opened successfully`, 'success');
      ElMessage.success(result.message);
      // 清除重连定时器
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    } else {
      addLog(`Failed to open serial port: ${result.message}`, 'error');
      ElMessage.error(result.message);
    }
  } catch (error) {
    addLog(`Failed to open serial port: ${error}`, 'error');
    ElMessage.error('打开串口失败');
  }
};

const closeSerialPort = async () => {
  try {
    addLog('Closing serial port...');
    const result = await window.electron.serial.closePort();
    if (result.success) {
      serialConnected.value = false;
      linStatus.value = false;
      addLog('Serial port closed successfully', 'success');
      ElMessage.success(result.message);
    } else {
      addLog(`Failed to close serial port: ${result.message}`, 'error');
      ElMessage.error(result.message);
    }
  } catch (error) {
    addLog(`Failed to close serial port: ${error}`, 'error');
    ElMessage.error('关闭串口失败');
  }
}

// 生成随机数据（爆破发送用）
const generateBruteForceRandomData = (length: number = 4): string => {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
  }
  return data.join(' ');
};

// 生成按指定顺序排列的ID列表
const generateIdList = (startId: number, endId: number, skipIds: number[], scanOrder: 'sequential' | 'binary' | 'random'): number[] => {
  // 生成基础ID列表
  let idList: number[] = [];
  for (let id = startId; id <= endId; id++) {
    if (!skipIds.includes(id)) {
      idList.push(id);
    }
  }
  
  // 根据扫描顺序排序
  switch (scanOrder) {
    case 'sequential':
      // 顺序模式：保持默认顺序
      return idList;
    case 'binary':
      // 二分模式：实现二分查找顺序
      return binarySearchOrder(idList);
    case 'random':
      // 随机模式：随机打乱顺序
      return shuffleArray(idList);
    default:
      return idList;
  }
};

// 生成二分查找顺序的ID列表
const binarySearchOrder = (idList: number[]): number[] => {
  if (idList.length <= 1) {
    return idList;
  }
  
  // 先排序
  idList.sort((a, b) => a - b);
  
  const result: number[] = [];
  const binaryOrder = (start: number, end: number) => {
    if (start > end) {
      return;
    }
    
    const mid = Math.floor((start + end) / 2);
    result.push(idList[mid]);
    
    // 递归处理左半部分
    binaryOrder(start, mid - 1);
    // 递归处理右半部分
    binaryOrder(mid + 1, end);
  };
  
  binaryOrder(0, idList.length - 1);
  return result;
};

// 随机打乱数组
const shuffleArray = (array: any[]): any[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 性能监控指标
const performanceMetrics = reactive({
  renderFrameRate: 0,
  lastFrameTime: performance.now(),
  frameCount: 0,
  totalRenderTime: 0,
  maxResponseTime: 0,
  minResponseTime: Infinity,
  avgResponseTime: 0,
  totalResponseTime: 0,
  responseCount: 0
});

// 性能监控函数
const startPerformanceMonitoring = () => {
  let lastTime = performance.now();
  let frameCount = 0;
  
  const monitorInterval = setInterval(() => {
    const currentTime = performance.now();
    const elapsedTime = currentTime - lastTime;
    
    // 计算帧率
    performanceMetrics.renderFrameRate = Math.round((frameCount / elapsedTime) * 1000);
    performanceMetrics.frameCount = frameCount;
    
    // 重置计数器
    frameCount = 0;
    lastTime = currentTime;
  }, 1000);
  
  return monitorInterval;
};

// 记录响应时间
const recordResponseTime = (time: number) => {
  performanceMetrics.totalResponseTime += time;
  performanceMetrics.responseCount++;
  performanceMetrics.avgResponseTime = Math.round(performanceMetrics.totalResponseTime / performanceMetrics.responseCount);
  performanceMetrics.maxResponseTime = Math.max(performanceMetrics.maxResponseTime, time);
  performanceMetrics.minResponseTime = Math.min(performanceMetrics.minResponseTime, time);
};

// 开始爆破发送
const startBruteForce = async () => {
  if (isBruteForcing.value) {
    return;
  }
  
  try {
    // 检查是否选择了设备
    if (!selectedDeviceForBruteForce.value) {
      throw new Error('请选择要用于爆破发送的设备');
    }
    
    // 检查设备连接状态
    const selectedDevice = selectedDeviceForBruteForceObj.value;
    if (!selectedDevice?.status.serialConnected) {
      throw new Error('选择的设备未连接，请先连接设备');
    }
    
    isBruteForcing.value = true;
    bruteForceProgress.value = 0;
    bruteForceAbortController = new AbortController();
    
    // 重置性能监控指标
    Object.assign(performanceMetrics, {
      renderFrameRate: 0,
      lastFrameTime: performance.now(),
      frameCount: 0,
      totalRenderTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      avgResponseTime: 0,
      totalResponseTime: 0,
      responseCount: 0
    });
    
    // 启动性能监控
    const monitorInterval = startPerformanceMonitoring();
    
    // 将输入框中的字符串转换为数字类型（支持十六进制）
    const startId = parseInt(bruteForceConfig.idRange[0], 16) || 0;
    const endId = parseInt(bruteForceConfig.idRange[1], 16) || 63;
    
    // 解析跳过的ID列表
    const skipIds = bruteForceConfig.skipIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id)
      .map(id => parseInt(id, 16));
    
    // 生成ID列表
    const idList = generateIdList(startId, endId, skipIds, bruteForceConfig.scanOrder);
    
    // 计算总任务数
    const startLength = bruteForceConfig.lengthRange[0];
    const endLength = bruteForceConfig.lengthRange[1];
    const totalLengths = endLength - startLength + 1;
    const totalDataValues = 16; // 00, 11, 22, ..., FF（步长为17）
    const totalTasks = idList.length * totalLengths * totalDataValues;
    let completedTasks = 0;
    
    // 结果缓存
    const resultCache: BruteForceResult[] = [];
    const LOG_CACHE_THRESHOLD = 10; // 日志缓存阈值
    const RESULT_CACHE_THRESHOLD = 50; // 结果缓存阈值
    const PROGRESS_UPDATE_INTERVAL = 10; // 进度更新间隔
    
    addLog(`Starting brute force send, baud rate: ${bruteForceConfig.baudRate}, ID range: ${startId}-${endId}, scan order: ${bruteForceConfig.scanOrder}`, 'info');
    
    // 设置波特率
    const originalBaudRate = selectedDevice.linConfig.baudRate;
    try {
      // 临时修改selectedDevice.linConfig.baudRate为爆破发送的波特率
      selectedDevice.linConfig.baudRate = bruteForceConfig.baudRate;
      // 直接设置波特率，不再使用applyLinConfig函数
      if (selectedDevice) {
        await window.electron.lin.setBaudRate(bruteForceConfig.baudRate, selectedDevice.id);
        await window.electron.lin.setMode(1, selectedDevice.id); // 设置为主机模式
        addLog(`Brute force send baud rate set successfully: ${bruteForceConfig.baudRate}`, 'success');
      }
    } catch (error) {
      addLog(`Failed to set brute force send baud rate: ${error}`, 'error');
      ElMessage.error(`爆破发送波特率设置失败: ${error}`);
      throw error;
    } finally {
      // 恢复原来的波特率设置
      selectedDevice.linConfig.baudRate = originalBaudRate;
    }
    
    // 外层循环：遍历ID
    for (const id of idList) {
      if (bruteForceAbortController.signal.aborted) {
        break;
      }
      
      currentBruteForceId.value = id;
      currentLinId.value = id.toString(16).toUpperCase().padStart(2, '0');
      currentBaudRate.value = bruteForceConfig.baudRate.toString();
      
      // 中层循环：遍历长度（根据配置的长度范围）
      const startLength = bruteForceConfig.lengthRange[0];
      const endLength = bruteForceConfig.lengthRange[1];
      for (let length = startLength; length <= endLength; length++) {
        if (bruteForceAbortController.signal.aborted) {
          break;
        }
        
        currentLength.value = length.toString();
        
        // 内层循环：遍历数据值（00, 11, 22, ..., FF，每个字节相同）
            for (let dataValue = 0; dataValue <= 255; dataValue += 17) {
          if (bruteForceAbortController.signal.aborted) {
            break;
          }
          
          const startTime = performance.now();
          
          // 生成数据：每个字节都是相同的值
          const hexValue = dataValue.toString(16).toUpperCase().padStart(2, '0');
          const data = Array.from({ length }, () => hexValue).join(' ');
          currentData.value = data;
          
          try {
            // 发送数据
            const result = await window.electron.lin.sendData({
              id: id,
              data: data,
              length: length,
              checkType: bruteForceConfig.checksumType,
              deviceId: selectedDeviceForBruteForce.value
            });
            
            // 记录结果
            const bruteForceResult: BruteForceResult = {
              id: id,
              data: data,
              checksum: result.checksum || '',
              response: result.response || '',
              status: result.success ? 'success' : 'error',
              timestamp: new Date().toLocaleTimeString()
            };
            
            // 将结果添加到缓存中
            resultCache.push(bruteForceResult);
            
            // 记录响应时间
            const responseTime = performance.now() - startTime;
            recordResponseTime(responseTime);
            
            // 将数据添加到数据追踪中
            if (traceEnabled.value) {
              const now = new Date();
              const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
              const hexId = id.toString(16).toUpperCase().padStart(2, '0');
              
              const sentFrame: ReceivedFrame = {
                id: hexId,
                direction: '发送',
                channel: '1',
                data: data,
                status: result.success ? '成功' : '失败',
                checksum: result.checksum || '',
                checksumType: bruteForceConfig.checksumType,
                checksumValid: true,
                timestamp: timestamp
              };
              
              // 根据当前模式处理数据
              if (traceMode.value === 'scroll') {
                // 滚动模式：添加到数组开头
                receivedFrames.value.unshift(sentFrame);
              } else if (traceMode.value === 'overlay') {
                // 覆盖模式：保留所有ID的最新1条数据
                // 移除旧的同ID数据
                receivedFrames.value = receivedFrames.value.filter(frame => frame.id !== hexId);
                // 添加新数据
                receivedFrames.value.unshift(sentFrame);
                // 按照ID大小排序（十六进制转十进制后比较）
                receivedFrames.value.sort((a, b) => {
                  const idA = parseInt(a.id, 16);
                  const idB = parseInt(b.id, 16);
                  return idA - idB;
                });
              }
            }
            
            // 当缓存达到阈值时，批量更新结果
            if (resultCache.length >= RESULT_CACHE_THRESHOLD) {
              // 使用setTimeout将更新操作放入事件队列，避免阻塞UI
              setTimeout(() => {
                // 批量添加结果
                bruteForceResults.value.unshift(...resultCache);
                
                // 只保留最近的100个结果
                if (bruteForceResults.value.length > 100) {
                  bruteForceResults.value = bruteForceResults.value.slice(0, 100);
                }
                
                // 清空缓存
                resultCache.length = 0;
              }, 0);
            }
            
            // 减少日志添加频率
            if (completedTasks % LOG_CACHE_THRESHOLD === 0) {
              if (result.success) {
                addLog(`Brute force send successful - ID: ${id.toString(16).toUpperCase().padStart(2, '0')}, length: ${length}, data: ${data}`, 'success');
              } else {
                addLog(`Brute force send failed - ID: ${id.toString(16).toUpperCase().padStart(2, '0')}, length: ${length}, error: ${result.message}`, 'error');
              }
            }
            
          } catch (error) {
            // 记录错误结果
            const bruteForceResult: BruteForceResult = {
              id: id,
              data: data,
              checksum: '',
              response: '',
              status: 'error',
              timestamp: new Date().toLocaleTimeString()
            };
            
            // 将错误结果添加到缓存中
            resultCache.push(bruteForceResult);
            
            // 记录响应时间
            const responseTime = performance.now() - startTime;
            recordResponseTime(responseTime);
            
            // 将错误数据添加到数据追踪中
            if (traceEnabled.value) {
              const now = new Date();
              const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
              const hexId = id.toString(16).toUpperCase().padStart(2, '0');
              
              const sentFrame: ReceivedFrame = {
                id: hexId,
                direction: '发送',
                channel: '1',
                data: data,
                status: '失败',
                checksum: '',
                checksumType: bruteForceConfig.checksumType,
                checksumValid: false,
                timestamp: timestamp
              };
              
              // 根据当前模式处理数据
              if (traceMode.value === 'scroll') {
                // 滚动模式：添加到数组开头
                receivedFrames.value.unshift(sentFrame);
              } else if (traceMode.value === 'overlay') {
                // 覆盖模式：保留所有ID的最新1条数据
                // 移除旧的同ID数据
                receivedFrames.value = receivedFrames.value.filter(frame => frame.id !== hexId);
                // 添加新数据
                receivedFrames.value.unshift(sentFrame);
                // 按照ID大小排序（十六进制转十进制后比较）
                receivedFrames.value.sort((a, b) => {
                  const idA = parseInt(a.id, 16);
                  const idB = parseInt(b.id, 16);
                  return idA - idB;
                });
              }
            }
            
            // 当缓存达到阈值时，批量更新结果
            if (resultCache.length >= RESULT_CACHE_THRESHOLD) {
              // 使用setTimeout将更新操作放入事件队列，避免阻塞UI
              setTimeout(() => {
                // 批量添加结果
                bruteForceResults.value.unshift(...resultCache);
                
                // 只保留最近的100个结果
                if (bruteForceResults.value.length > 100) {
                  bruteForceResults.value = bruteForceResults.value.slice(0, 100);
                }
                
                // 清空缓存
                resultCache.length = 0;
              }, 0);
            }
            
            // 减少日志添加频率
            if (completedTasks % LOG_CACHE_THRESHOLD === 0) {
              addLog(`Brute force send exception - ID: ${id.toString(16).toUpperCase().padStart(2, '0')}, length: ${length}, error: ${error}`, 'error');
            }
          }
          
          completedTasks++;
          
          // 减少进度更新频率
          if (completedTasks % PROGRESS_UPDATE_INTERVAL === 0) {
            bruteForceProgress.value = Math.round((completedTasks / totalTasks) * 100);
          }
          
          // 短暂延迟，避免发送过快
          await new Promise(resolve => setTimeout(resolve, bruteForceConfig.interval));
        }
      }
    }
    
    // 处理剩余的缓存结果
    if (resultCache.length > 0) {
      bruteForceResults.value.unshift(...resultCache);
      
      // 只保留最近的100个结果
      if (bruteForceResults.value.length > 100) {
        bruteForceResults.value = bruteForceResults.value.slice(0, 100);
      }
    }
    
    // 停止性能监控
    clearInterval(monitorInterval);
    
    // 记录最终性能指标
    addLog(`Brute force send completed, processed ${completedTasks} tasks`, 'success');
    addLog(`Performance metrics: frame rate=${performanceMetrics.renderFrameRate}fps, average response time=${performanceMetrics.avgResponseTime}ms, max response time=${performanceMetrics.maxResponseTime}ms, min response time=${performanceMetrics.minResponseTime}ms`, 'info');
    
    // 显示性能指标
    ElMessage.info(`爆破发送完成，性能指标: 帧率=${performanceMetrics.renderFrameRate}fps, 平均响应时间=${performanceMetrics.avgResponseTime}ms`);
  } catch (error) {
    addLog(`Brute force send failed: ${error}`, 'error');
    ElMessage.error(`爆破发送失败: ${error}`);
  } finally {
    isBruteForcing.value = false;
    currentLength.value = '';
    currentData.value = '';
    bruteForceAbortController = null;
  }
};

// 停止爆破发送
const stopBruteForce = () => {
  if (bruteForceAbortController) {
    bruteForceAbortController.abort();
    addLog('Brute force send stopped', 'info');
  }
  isBruteForcing.value = false;
  currentLength.value = '';
  currentData.value = '';
};

// 清空爆破结果
const clearBruteForceResults = () => {
  bruteForceResults.value = [];
  addLog('Brute force results cleared', 'info');
  ElMessage.success('爆破结果已清空');
};

// 打开数据追踪标签页
const openTraceTab = () => {
  // 检查数据追踪标签页是否已打开
  const existingTab = openedTabs.value.find(tab => tab.key === 'trace');
  if (!existingTab) {
    // 添加新标签页
    openedTabs.value.push({
      key: 'trace',
      label: '数据追踪',
      icon: DataAnalysis,
      isFixed: false
    });
  }
  // 激活标签页
  activeTab.value = 'trace';
};

// 导出爆破结果
const exportBruteForceResults = () => {
  if (bruteForceResults.value.length === 0) {
    ElMessage.warning('没有爆破结果可导出');
    return;
  }
  
  try {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Data,Checksum,Response,Status,Timestamp\n" 
      + bruteForceResults.value.map(result => {
        return `${result.id.toString(16).toUpperCase().padStart(2, '0')},${result.data},${result.checksum},${result.response},${result.status},${result.timestamp}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `brute-force-results-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog(`Brute force results exported successfully, ${bruteForceResults.value.length} records`, 'success');
    ElMessage.success('爆破结果导出成功');
  } catch (error) {
    addLog(`Failed to export brute force results: ${error}`, 'error');
    ElMessage.error('导出爆破结果失败');
  }
};

// 保存设置到文件
const saveSettings = async (settings: any) => {
  try {
    addLog('Saving settings...');
    const result = await window.electron.fs.writeSettings(settings);
    if (result.success) {
      addLog('Settings saved successfully', 'success');
      ElMessage.success('设置保存成功');
    } else {
      addLog(`Failed to save settings: ${result.message}`, 'error');
      ElMessage.error('设置保存失败');
    }
  } catch (error) {
    addLog(`Failed to save settings: ${error}`, 'error');
    ElMessage.error('设置保存失败');
  }
};

// 加载设置从文件
const loadSettings = async () => {
  try {
    addLog('Loading settings...');
    const result = await window.electron.fs.readSettings();
    if (result.success && result.data) {
      // 加载串口配置
      if (result.data.serialConfig && result.data.serialConfig.port) {
        serialConfig.port = result.data.serialConfig.port;
      }
      // 加载自动重连设置
      if (result.data.autoReconnect !== undefined) {
        autoReconnect.value = result.data.autoReconnect;
      }
      addLog('Settings loaded successfully', 'success');
    }
  } catch (error) {
    addLog(`Failed to load settings: ${error}`, 'warning');
  }
};

// 自动重连功能
// 重连定时器映射，用于管理每个设备的重连定时器
const reconnectIntervals = new Map<string, number>();

const setupReconnect = (deviceId?: string) => {
  if (deviceId) {
    // 为特定设备重连
    const device = deviceManager.devices.find(d => d.id === deviceId);
    if (!device || !device.status.autoReconnect || device.status.serialConnected) {
      return;
    }
    
    // 清除该设备之前的重连定时器
    if (reconnectIntervals.has(deviceId)) {
      clearInterval(reconnectIntervals.get(deviceId));
      reconnectIntervals.delete(deviceId);
    }
    
    const intervalId = window.setInterval(async () => {
      addLog(`Attempting automatic reconnection for device: ${device.name}`, 'info');
      try {
        const result = await window.electron.serial.openPort(
          device.serialConfig.port,
          { deviceType: device.type },
          deviceId
        );
        if (result.success) {
          deviceManager.updateDeviceStatus(deviceId, {
            serialConnected: true,
            linStatus: true
          });
          addLog(`Device ${device.name} automatically reconnected successfully`, 'success');
          ElMessage.success(`设备 ${device.name} 自动重连成功`);
          // 清除重连定时器
          if (reconnectIntervals.has(deviceId)) {
            clearInterval(reconnectIntervals.get(deviceId));
            reconnectIntervals.delete(deviceId);
          }
        }
      } catch (error) {
        addLog(`Automatic reconnection failed for device ${device.name}: ${error}`, 'warning');
      }
    }, 5000); // 每5秒尝试重连一次
    
    reconnectIntervals.set(deviceId, intervalId);
  } else {
    // 全局重连（向后兼容）
    if (autoReconnect.value && !serialConnected.value && !reconnectInterval) {
      reconnectInterval = window.setInterval(async () => {
        addLog('Attempting automatic reconnection...', 'info');
        try {
          const result = await window.electron.serial.openPort(serialConfig.port, {});
          if (result.success) {
            serialConnected.value = true;
            linStatus.value = true;
            addLog(`Serial port ${serialConfig.port} automatically reconnected successfully`, 'success');
            ElMessage.success('串口自动重连成功');
            // 清除重连定时器
            if (reconnectInterval) {
              clearInterval(reconnectInterval);
              reconnectInterval = null;
            }
          }
        } catch (error) {
          addLog(`Automatic reconnection failed: ${error}`, 'warning');
        }
      }, 5000); // 每5秒尝试重连一次
    }
  }
};



interface SendDataParams {
  id: number;
  data: string;
  length: number;
  checkType: string;
}

const sendData = async (params?: SendDataParams) => {
  // 只有在循环发送模式下，才需要检查发送状态
  if (sendConfig.loopSend && !isSending.value && !params) {
    return;
  }
  
  try {
    let decimalId: number;
    let hexId: string;
    let data: string;
    let length: number;
    let checkType: string;
    
    // 触发数据生成器（如果启用）
    if (dataGeneratorConfig.enabled) {
      const { byteIndex, configType, range, step, generateMode } = dataGeneratorConfig;
      const byte = sendConfig.bytes[byteIndex];
      
      if (generateMode === 'increment') {
        // 递增循环模式
        if (configType === 'high') {
          byte.high += step;
          if (byte.high > range.max) {
            byte.high = range.min;
          }
        } else {
          byte.low += step;
          if (byte.low > range.max) {
            byte.low = range.min;
          }
        }
      }
      
      updateByteData(byteIndex);
    }
    
    if (params) {
      // 从参数获取数据
      decimalId = params.id;
      hexId = decimalId.toString(16).toUpperCase().padStart(2, '0');
      data = params.data;
      length = params.length;
      checkType = params.checkType;
    } else {
      // 检查是否开启了随机发送功能
      if (sendConfig.loopSend && sendConfig.randomOnLoop) {
        // 按照ID、长度、数据的顺序随机更新
        if (sendConfig.randomId) {
          const randomId = Math.floor(Math.random() * 64); // 0-63
          sendConfig.id = randomId.toString(16).toUpperCase().padStart(2, '0');
        }
        if (sendConfig.randomLength) {
          const randomLength = Math.floor(Math.random() * 8) + 1; // 1-8
          sendConfig.length = randomLength;
        }
        if (sendConfig.randomData) {
          for (let i = 0; i < sendConfig.length; i++) {
            const byte = sendConfig.bytes[i];
            byte.high = Math.floor(Math.random() * 16);
            byte.low = Math.floor(Math.random() * 16);
          }
          updateByteData(0);
        }
      }
      
      // 从sendConfig获取数据
      // 验证并转换十六进制ID
      hexId = sendConfig.id.trim().toUpperCase();
      
      // 1. 验证是否为有效的十六进制格式
      const hexRegex = /^[0-9A-F]{1,2}$/;
      if (!hexRegex.test(hexId)) {
        const errorMsg = `无效的十六进制ID格式: ${hexId}，请输入00-3F之间的十六进制值`;
        addLog(errorMsg, 'error');
        ElMessage.error(errorMsg);
        // 如果处于循环发送模式，自动停止发送
        if (sendConfig.loopSend && isSending.value) {
          stopLoopSend();
        }
        return;
      }
      
      // 2. 转换为十进制数值
      decimalId = parseInt(hexId, 16);
      
      // 3. 验证范围是否在0-63（十六进制00-3F）之间
      if (decimalId < 0 || decimalId > 63) {
        const errorMsg = `ID超出范围: ${hexId}，请输入00-3F之间的十六进制值`;
        addLog(errorMsg, 'error');
        ElMessage.error(errorMsg);
        // 如果处于循环发送模式，自动停止发送
        if (sendConfig.loopSend && isSending.value) {
          stopLoopSend();
        }
        return;
      }
      
      data = sendConfig.data;
      length = sendConfig.length;
      checkType = sendConfig.checkType;
    }
    
    // 获取选中设备
    const selectedDevice = selectedDeviceForSendObj.value;
    if (!selectedDevice) {
      addLog('No device selected, cannot send data', 'error');
      ElMessage.error('请先选择要使用的设备');
      return;
    }
    
    addLog(`Sending LIN data using device: ${selectedDevice.name} (${selectedDevice.serialConfig.port})`);
    const result = await window.electron.lin.sendData({
      id: decimalId,
      data: data,
      length: length,
      checkType: checkType,
      deviceId: selectedDevice.id
    });
    if (result.success) {
      addLog(`LIN master send successful: ID=${hexId} (${decimalId}), Data=${data}`, 'success');
      
      // 只在traceEnabled为true时添加数据追踪记录
        if (traceEnabled.value) {
          const now = new Date();
          const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
          
          const sentFrame: ReceivedFrame = {
            id: hexId,
            direction: '发送',
            channel: '1',
            data: data,
            status: '成功',
            checksum: '',
            checksumType: sendConfig.checkType,
            checksumValid: true,
            timestamp: timestamp
          };
          
          // 根据当前模式处理数据
          if (traceMode.value === 'scroll') {
            // 滚动模式：添加到数组开头
            receivedFrames.value.unshift(sentFrame);
          } else if (traceMode.value === 'overlay') {
            // 覆盖模式：保留所有ID的最新1条数据
            // 移除旧的同ID数据
            receivedFrames.value = receivedFrames.value.filter(frame => frame.id !== hexId);
            // 添加新数据
            receivedFrames.value.unshift(sentFrame);
            // 按照ID大小排序（十六进制转十进制后比较）
            receivedFrames.value.sort((a, b) => {
              const idA = parseInt(a.id, 16);
              const idB = parseInt(b.id, 16);
              return idA - idB;
            });
          }
        }
    } else {
      addLog(`Failed to send LIN data: ${result.message}`, 'error');
      // 如果发送失败且处于循环发送模式，自动停止发送
      if (sendConfig.loopSend && isSending.value && !params) {
        stopLoopSend();
      }
    }
  } catch (error) {
    addLog(`Failed to send LIN data: ${error}`, 'error');
    // 如果发送失败且处于循环发送模式，自动停止发送
    if (sendConfig.loopSend && isSending.value && !params) {
      stopLoopSend();
    }
  }
};

// 开始循环发送
const startLoopSend = () => {
  addLog(`startLoopSend called, before setting isSending to true`, 'info');
  // 先设置发送状态为true
  isSending.value = true;
  addLog(`startLoopSend: isSending set to true`, 'info');
  
  // 清除之前的定时器
  if (sendInterval) {
    addLog(`startLoopSend: clearing existing interval`, 'info');
    clearInterval(sendInterval);
    sendInterval = null;
  }
  
  // 创建新的定时器
  addLog(`startLoopSend: creating new interval with ${sendConfig.loopInterval} ms`, 'info');
  sendInterval = window.setInterval(() => {
    // 只有在发送状态为true时才执行发送
    if (isSending.value) {
      addLog(`Timer callback: sending data`, 'info');
      sendData();
    } else {
      addLog(`Timer callback: not sending, isSending is false`, 'info');
      // 如果发送状态为false，清除定时器
      if (sendInterval) {
        addLog(`Timer callback: clearing interval because isSending is false`, 'info');
        clearInterval(sendInterval);
        sendInterval = null;
      }
    }
  }, sendConfig.loopInterval);
  
  addLog(`Starting loop send, interval ${sendConfig.loopInterval} ms`, 'info');
};

// 停止循环发送
const stopLoopSend = () => {
  addLog(`stopLoopSend called, current sendInterval: ${sendInterval}`, 'info');
  
  // 先设置发送状态为false，确保新的发送不会开始
  addLog(`stopLoopSend: setting isSending to false`, 'info');
  isSending.value = false;
  addLog(`stopLoopSend: isSending set to false`, 'info');
  
  // 清除定时器，停止后续发送
  if (sendInterval) {
    addLog(`stopLoopSend: clearing interval ${sendInterval}`, 'info');
    clearInterval(sendInterval);
    sendInterval = null;
    addLog(`stopLoopSend: interval cleared, sendInterval is now null`, 'info');
  } else {
    addLog(`stopLoopSend: no interval to clear`, 'info');
  }
  
  addLog('Stopping loop send', 'info');
};

// 发送按钮处理函数
const handleSend = () => {
  // 检查是否已选择设备
  addLog(`handleSend called, selectedDeviceForSend: ${selectedDeviceForSend.value}, isSending: ${isSending.value}`, 'info');
  if (!selectedDeviceForSend.value) {
    addLog('No device selected, cannot send data', 'warning');
    ElMessage.warning('请先选择要使用的设备');
    return;
  }
  
  if (!selectedDeviceForSendObj.value?.status.serialConnected) {
    addLog('Selected device not connected, cannot send data', 'warning');
    ElMessage.warning('选中的设备未连接，请先连接设备');
    return;
  }
  
  if (isSending.value) {
    // 停止发送
    addLog('Stopping send...', 'info');
    stopLoopSend();
  } else {
    // 开始发送
    addLog('Starting send...', 'info');
    if (sendConfig.loopSend) {
      // 循环发送模式
      startLoopSend();
    } else {
      // 单次发送模式
      sendData();
    }
  }
};

const readSlaveData = async (params?: { id?: string, length?: number }) => {
  try {
    if (!selectedDeviceForSend.value) {
      addLog('No device selected, cannot read slave data', 'warning');
      ElMessage.warning('请先选择要使用的设备');
      return;
    }
    
    if (!selectedDeviceForSendObj.value?.status.serialConnected) {
      addLog('Selected device not connected, cannot read slave data', 'warning');
      ElMessage.warning('选中的设备未连接，请先连接设备');
      return;
    }
    
    // 获取选中设备
    const selectedDevice = selectedDeviceForSendObj.value;
    if (!selectedDevice) {
      addLog('No device selected, cannot read slave data', 'error');
      ElMessage.error('请先选择要使用的设备');
      return;
    }
    
    // 验证并转换十六进制ID
    const hexId = params?.id || sendConfig.id.trim().toUpperCase();
    
    // 1. 验证是否为有效的十六进制格式
    const hexRegex = /^[0-9A-F]{1,2}$/;
    if (!hexRegex.test(hexId)) {
      const errorMsg = `无效的十六进制ID格式: ${hexId}，请输入00-3F之间的十六进制值`;
      addLog(errorMsg, 'error');
      ElMessage.error(errorMsg);
      return;
    }
    
    // 2. 转换为十进制数值
    const decimalId = parseInt(hexId, 16);
    
    // 3. 验证范围是否在0-63（十六进制00-3F）之间
    if (decimalId < 0 || decimalId > 63) {
      const errorMsg = `ID超出范围: ${hexId}，请输入00-3F之间的十六进制值`;
      addLog(errorMsg, 'error');
      ElMessage.error(errorMsg);
      return;
    }
    
    const length = params?.length || sendConfig.length;
    
    addLog('Reading slave data...');
    addLog(`Using device: ${selectedDevice.name} (${selectedDevice.serialConfig.port})`, 'info');
    const result = await window.electron.lin.readSlave({
      id: decimalId,
      length: length,
      checkType: sendConfig.checkType,
      deviceId: selectedDevice.id
    });
    if (result.success) {
      addLog(`Slave data read command sent successfully: ID=${hexId} (${decimalId})`, 'success');
      
      // 从机响应会通过串口事件返回，由数据追踪模块处理
      // 不需要在这里处理返回数据
    } else {
      addLog(`Failed to send slave read command: ${result.message}`, 'error');
      ElMessage.error(`发送读取从机命令失败: ${result.message}`);
    }
  } catch (error) {
    addLog(`Failed to read slave data: ${error}`, 'error');
    ElMessage.error(`读取从机数据失败: ${error}`);
  }
};

const onPortChange = () => {
  serialConnected.value = false;
  linStatus.value = false;
};

const clearTraceData = () => {
  receivedFrames.value = [];
  addLog('Data trace cleared', 'info');
};

const clearLogs = () => {
  logs.value = [];
  addLog('Operation logs cleared', 'info');
};

// 数据追踪模块方法


// 列表收发方法
const showAddFrameDialog = () => {
  isEditingFrame.value = false;
  editingFrameIndex.value = -1;
  currentFrame.id = '00';
  currentFrame.length = 4;
  currentFrame.interval = 100;
  currentFrame.data = '00 00 00 00';
  currentFrame.direction = 'send';
  currentFrame.description = '';
  frameDialogVisible.value = true;
};

const showBatchAddDialog = () => {
  batchAddConfig.startId = '00';
  batchAddConfig.endId = '0F';
  batchAddConfig.length = 4;
  batchAddConfig.interval = 100;
  batchAddConfig.data = '00 00 00 00';
  batchAddConfig.direction = 'send';
  batchAddConfig.description = '';
  batchAddDialogVisible.value = true;
};

const showBatchOperationDialog = () => {
  batchOperationConfig.operation = 'enable';
  batchOperationConfig.ids = [];
  batchOperationDialogVisible.value = true;
};

const batchAddFrames = () => {
  // 验证ID格式
  const hexRegex = /^[0-9A-F]{1,2}$/i;
  if (!hexRegex.test(batchAddConfig.startId.trim())) {
    ElMessage.error('无效的起始ID格式，请输入00-3F之间的十六进制值');
    return;
  }
  if (!hexRegex.test(batchAddConfig.endId.trim())) {
    ElMessage.error('无效的结束ID格式，请输入00-3F之间的十六进制值');
    return;
  }
  
  // 转换为十进制进行比较
  const startId = parseInt(batchAddConfig.startId.trim(), 16);
  const endId = parseInt(batchAddConfig.endId.trim(), 16);
  
  // 验证ID范围
  if (startId < 0 || startId > 63 || endId < 0 || endId > 63) {
    ElMessage.error('ID超出范围，请输入00-3F之间的十六进制值');
    return;
  }
  
  if (startId > endId) {
    ElMessage.error('起始ID不能大于结束ID');
    return;
  }
  
  // 批量添加帧
  const addedFrames = [];
  for (let id = startId; id <= endId; id++) {
    const formattedId = id.toString(16).toUpperCase().padStart(2, '0');
    const frame: ScheduleFrame = {
      id: formattedId,
      length: batchAddConfig.length,
      interval: batchAddConfig.interval,
      data: batchAddConfig.data,
      direction: batchAddConfig.direction,
      description: batchAddConfig.description,
      enabled: true
    };
    scheduleFrames.value.push(frame);
    addedFrames.push(formattedId);
  }
  
  addLog(`批量添加了 ${addedFrames.length} 个帧，ID范围: ${batchAddConfig.startId.toUpperCase()}-${batchAddConfig.endId.toUpperCase()}`, 'success');
  ElMessage.success(`成功添加了 ${addedFrames.length} 个帧`);
  batchAddDialogVisible.value = false;
};

const executeBatchOperation = () => {
  // 检查是否有选中的条目
  if (multipleSelection.value.length === 0) {
    ElMessage.error('请先选择要修改的帧');
    return;
  }
  
  // 执行批量操作
  let affectedCount = 0;
  const affectedIds = [];
  
  if (batchOperationConfig.operation === 'delete') {
    // 批量删除
    const originalLength = scheduleFrames.value.length;
    scheduleFrames.value = scheduleFrames.value.filter(frame => {
      const isSelected = multipleSelection.value.some(selected => selected.id === frame.id);
      if (isSelected) {
        affectedIds.push(frame.id);
        return false;
      }
      return true;
    });
    affectedCount = originalLength - scheduleFrames.value.length;
  } else if (batchOperationConfig.operation === 'length') {
    // 批量修改长度
    scheduleFrames.value.forEach(frame => {
      const isSelected = multipleSelection.value.some(selected => selected.id === frame.id);
      if (isSelected) {
        // 调整数据长度
        const dataBytes = frame.data.split(' ').filter(byte => byte);
        if (batchOperationConfig.length > dataBytes.length) {
          // 长度增加，在末尾添加00
          const addCount = batchOperationConfig.length - dataBytes.length;
          for (let i = 0; i < addCount; i++) {
            dataBytes.push('00');
          }
        } else if (batchOperationConfig.length < dataBytes.length) {
          // 长度减少，截断末尾
          dataBytes.splice(batchOperationConfig.length);
        }
        
        // 更新数据
        frame.data = dataBytes.join(' ');
        frame.length = batchOperationConfig.length;
        affectedIds.push(frame.id);
        affectedCount++;
      }
    });
  } else if (batchOperationConfig.operation === 'interval') {
    // 批量修改间隔
    scheduleFrames.value.forEach(frame => {
      const isSelected = multipleSelection.value.some(selected => selected.id === frame.id);
      if (isSelected) {
        frame.interval = batchOperationConfig.interval;
        affectedIds.push(frame.id);
        affectedCount++;
      }
    });
  } else if (batchOperationConfig.operation === 'data') {
    // 批量修改数据
    scheduleFrames.value.forEach(frame => {
      const isSelected = multipleSelection.value.some(selected => selected.id === frame.id);
      if (isSelected) {
        if (batchOperationConfig.randomData) {
          // 静态随机填充
          const bytes: string[] = [];
          for (let i = 0; i < frame.length; i++) {
            bytes.push(Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0'));
          }
          frame.data = bytes.join(' ');
        } else {
          // 使用指定的数据
          frame.data = batchOperationConfig.data;
        }
        affectedIds.push(frame.id);
        affectedCount++;
      }
    });
  } else {
    // 批量启用或禁用
    scheduleFrames.value.forEach(frame => {
      const isSelected = multipleSelection.value.some(selected => selected.id === frame.id);
      if (isSelected) {
        frame.enabled = batchOperationConfig.operation === 'enable';
        affectedIds.push(frame.id);
        affectedCount++;
      }
    });
  }
  
  // 显示操作结果
  let operationName = '';
  switch (batchOperationConfig.operation) {
    case 'enable':
      operationName = '启用';
      break;
    case 'disable':
      operationName = '禁用';
      break;
    case 'delete':
      operationName = '删除';
      break;
    case 'length':
      operationName = '修改长度';
      break;
    case 'interval':
      operationName = '修改间隔';
      break;
    case 'data':
      operationName = '修改数据';
      break;
  }
  
  addLog(`批量${operationName}了 ${affectedCount} 个帧`, 'success');
  ElMessage.success(`成功${operationName}了 ${affectedCount} 个帧`);
  batchOperationDialogVisible.value = false;
  
  // 保留选择，不清除勾选记录
  // multipleSelection.value = [];
};

const showEditFrameDialog = (frame: ScheduleFrame, index: number) => {
  isEditingFrame.value = true;
  editingFrameIndex.value = index;
  currentFrame.id = frame.id;
  currentFrame.length = frame.length;
  currentFrame.interval = frame.interval;
  currentFrame.data = frame.data;
  currentFrame.direction = frame.direction;
  currentFrame.description = frame.description || '';
  currentFrame.randomEnabled = frame.randomEnabled || false;
  frameDialogVisible.value = true;
};

const deleteScheduleFrame = (index: number) => {
  scheduleFrames.value.splice(index, 1);
  addLog('ScheduleFrame deleted', 'info');
};

const clearScheduleFrames = () => {
  if (scheduleFrames.value.length > 0) {
    scheduleFrames.value = [];
    addLog('Schedule send list cleared', 'info');
  }
};

const saveScheduleFrame = () => {
  // 验证ID格式
  const hexRegex = /^[0-9A-F]{1,2}$/;
  if (!hexRegex.test(currentFrame.id.trim().toUpperCase())) {
    ElMessage.error('无效的ID格式，请输入00-3F之间的十六进制值');
    return;
  }
  
  // 验证ID范围
  const decimalId = parseInt(currentFrame.id.trim(), 16);
  if (decimalId < 0 || decimalId > 63) {
    ElMessage.error('ID超出范围，请输入00-3F之间的十六进制值');
    return;
  }
  
  // 格式化ID
  const formattedId = currentFrame.id.trim().toUpperCase().padStart(2, '0');
  
  if (isEditingFrame.value && editingFrameIndex.value >= 0) {
    // 编辑现有帧
    scheduleFrames.value[editingFrameIndex.value] = {
      ...currentFrame,
      id: formattedId,
      enabled: currentFrame.enabled !== undefined ? currentFrame.enabled : true
    };
    addLog(`ScheduleFrame updated: ${formattedId}`, 'success');
  } else {
    // 添加新帧
    scheduleFrames.value.push({
      ...currentFrame,
      id: formattedId,
      enabled: true
    });
    addLog(`ScheduleFrame added: ${formattedId}`, 'success');
  }
  
  frameDialogVisible.value = false;
};

const toggleScheduleSend = () => {
  addLog(`toggleScheduleSend called, selectedDeviceForSend: ${selectedDeviceForSend.value}, isScheduleSending: ${isScheduleSending.value}`, 'info');
  
  // 检查是否已选择设备
  if (!selectedDeviceForSend.value) {
    addLog('No device selected, cannot send schedule frames', 'warning');
    ElMessage.warning('请先选择要使用的设备');
    return;
  }
  
  // 检查设备是否已连接
  if (!selectedDeviceForSendObj.value?.status.serialConnected) {
    addLog('Selected device not connected, cannot send schedule frames', 'warning');
    ElMessage.warning('选中的设备未连接，请先连接设备');
    return;
  }
  
  if (isScheduleSending.value) {
    // 停止发送
    addLog('Stopping schedule send...', 'info');
    stopScheduleSend();
  } else {
    // 开始发送
    if (scheduleFrames.value.length === 0) {
      addLog('Schedule frames list is empty, cannot start sending', 'warning');
      ElMessage.warning('列表收发列表为空');
      return;
    }
    
    addLog('Starting schedule send...', 'info');
    startScheduleSend();
  }
};

const startScheduleSend = () => {
  addLog(`startScheduleSend called, before setting isScheduleSending to true`, 'info');
  
  // 先设置发送状态为true
  isScheduleSending.value = true;
  addLog(`startScheduleSend: isScheduleSending set to true`, 'info');
  
  // 初始化发送状态
  currentFrameIndex.value = 0;
  totalSentFrames.value = 0;
  currentScheduleFrame.value = '';
  
  // 清除之前的定时器
  if (scheduleSendInterval) {
    addLog(`startScheduleSend: clearing existing interval`, 'info');
    clearInterval(scheduleSendInterval);
    scheduleSendInterval = null;
  }
  
  // 开始发送第一帧
  addLog(`startScheduleSend: sending first frame`, 'info');
  sendNextScheduleFrame();
  
  // 创建新的定时器来实现轮询发送
  addLog(`startScheduleSend: creating new interval for polling`, 'info');
  scheduleSendInterval = setInterval(() => {
    // 只有在发送状态为true时才执行发送
    if (isScheduleSending.value) {
      addLog(`Schedule send timer callback: sending next frame`, 'info');
      sendNextScheduleFrame();
    } else {
      addLog(`Schedule send timer callback: not sending, isScheduleSending is false`, 'info');
      if (scheduleSendInterval) {
        addLog(`Schedule send timer callback: clearing interval because isScheduleSending is false`, 'info');
        clearInterval(scheduleSendInterval);
        scheduleSendInterval = null;
      }
    }
  }, 10); // 使用小间隔来确保及时响应帧的间隔时间
};

const stopScheduleSend = () => {
  addLog(`stopScheduleSend called, current scheduleSendInterval: ${scheduleSendInterval}`, 'info');
  
  // 先设置发送状态为false，确保新的发送不会开始
  addLog(`stopScheduleSend: setting isScheduleSending to false`, 'info');
  isScheduleSending.value = false;
  addLog(`stopScheduleSend: isScheduleSending set to false`, 'info');
  
  // 清除定时器，停止后续发送
  if (scheduleSendInterval) {
    addLog(`stopScheduleSend: clearing interval ${scheduleSendInterval}`, 'info');
    clearInterval(scheduleSendInterval);
    scheduleSendInterval = null;
    addLog(`stopScheduleSend: interval cleared, scheduleSendInterval is now null`, 'info');
  } else {
    addLog(`stopScheduleSend: no interval to clear`, 'info');
  }
  
  // 重置发送状态
  currentScheduleFrame.value = '';
  addLog('Stopping schedule send', 'info');
};

const sendNextScheduleFrame = async () => {
  if (!isScheduleSending.value || scheduleFrames.value.length === 0) {
    return;
  }
  
  // 找到下一个启用的帧
  let nextEnabledFrameIndex = currentFrameIndex.value;
  let foundEnabledFrame = false;
  
  // 最多遍历整个列表一次
  for (let i = 0; i < scheduleFrames.value.length; i++) {
    const frame = scheduleFrames.value[nextEnabledFrameIndex];
    if (frame.enabled !== false) { // 默认为启用
      foundEnabledFrame = true;
      break;
    }
    nextEnabledFrameIndex = (nextEnabledFrameIndex + 1) % scheduleFrames.value.length;
  }
  
  // 如果没有启用的帧，停止发送
  if (!foundEnabledFrame) {
    addLog('No enabled frames found, stopping schedule send', 'warning');
    stopScheduleSend();
    return;
  }
  
  // 更新当前帧索引
  currentFrameIndex.value = nextEnabledFrameIndex;
  const frame = scheduleFrames.value[currentFrameIndex.value];
  
  // 检查是否需要随机触发
  if (frame.randomEnabled) {
    // 创建帧的副本进行随机处理
    const randomizedFrame = { ...frame };
    
    // 生成随机ID
    if (randomSettings.value.includes('id')) {
      const randomId = Math.floor(Math.random() * 64).toString(16).toUpperCase().padStart(2, '0');
      randomizedFrame.id = randomId;
    }
    
    // 生成随机长度
    if (randomSettings.value.includes('length')) {
      const randomLength = Math.floor(Math.random() * 8) + 1;
      randomizedFrame.length = randomLength;
    }
    
    // 生成随机数据
    if (randomSettings.value.includes('data')) {
      const bytes: string[] = [];
      for (let i = 0; i < randomizedFrame.length; i++) {
        bytes.push(Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0'));
      }
      randomizedFrame.data = bytes.join(' ');
    }
    
    // 更新表格中显示的帧数据，使其显示最新的随机值
    scheduleFrames.value[currentFrameIndex.value] = {
      ...frame,
      id: randomizedFrame.id,
      length: randomizedFrame.length,
      data: randomizedFrame.data
    };
    
    currentScheduleFrame.value = randomizedFrame.id;
    
    addLog(`sendNextScheduleFrame: sending randomized frame ${currentFrameIndex.value + 1}/${scheduleFrames.value.length}, ID: ${randomizedFrame.id}, direction: ${randomizedFrame.direction}, interval: ${randomizedFrame.interval}ms`, 'info');
    
    try {
      // 发送随机处理后的帧
      await sendDataFromScheduleFrame(randomizedFrame);
      totalSentFrames.value++;
      addLog(`sendNextScheduleFrame: sent randomized frame ${randomizedFrame.id} successfully, total sent: ${totalSentFrames.value}`, 'success');
      
      // 更新索引
      currentFrameIndex.value = (currentFrameIndex.value + 1) % scheduleFrames.value.length;
      addLog(`sendNextScheduleFrame: updated frame index to ${currentFrameIndex.value}`, 'info');
      
    } catch (error) {
      ElMessage.error(`发送随机ScheduleFrame失败: ${error}`);
      addLog(`Failed to send randomized ScheduleFrame: ${frame.id}, error: ${error}`, 'error');
      isScheduleSending.value = false;
      currentScheduleFrame.value = '';
      if (scheduleSendInterval) {
        clearInterval(scheduleSendInterval);
        scheduleSendInterval = null;
      }
    }
  } else {
    // 正常发送
    currentScheduleFrame.value = frame.id;
    
    addLog(`sendNextScheduleFrame: sending frame ${currentFrameIndex.value + 1}/${scheduleFrames.value.length}, ID: ${frame.id}, direction: ${frame.direction}, interval: ${frame.interval}ms`, 'info');
    
    try {
      // 发送当前帧
      await sendDataFromScheduleFrame(frame);
      totalSentFrames.value++;
      addLog(`sendNextScheduleFrame: sent frame ${frame.id} successfully, total sent: ${totalSentFrames.value}`, 'success');
      
      // 更新索引
      currentFrameIndex.value = (currentFrameIndex.value + 1) % scheduleFrames.value.length;
      addLog(`sendNextScheduleFrame: updated frame index to ${currentFrameIndex.value}`, 'info');
      
    } catch (error) {
      ElMessage.error(`发送ScheduleFrame失败: ${error}`);
      addLog(`Failed to send ScheduleFrame: ${frame.id}, error: ${error}`, 'error');
      isScheduleSending.value = false;
      currentScheduleFrame.value = '';
      if (scheduleSendInterval) {
        clearInterval(scheduleSendInterval);
        scheduleSendInterval = null;
      }
    }
  }
};

const sendDataFromScheduleFrame = async (frame: ScheduleFrame) => {
  addLog(`sendDataFromScheduleFrame: processing frame ID: ${frame.id}, direction: ${frame.direction}`, 'info');
  
  // 转换ID为十进制
  const decimalId = parseInt(frame.id, 16);
  addLog(`sendDataFromScheduleFrame: converted ID ${frame.id} to decimal ${decimalId}`, 'info');
  
  if (frame.direction === 'send') {
    // 发送帧
    addLog(`sendDataFromScheduleFrame: sending data for frame ${frame.id}`, 'info');
    await sendData({
      id: decimalId,
      data: frame.data,
      length: frame.length,
      checkType: sendConfig.checkType
    });
  } else {
    // 接收帧
    addLog(`sendDataFromScheduleFrame: reading slave data for frame ${frame.id}`, 'info');
    await readSlaveData({
      id: frame.id,
      length: frame.length
    });
  }
  
  // 等待帧的间隔时间
  addLog(`sendDataFromScheduleFrame: waiting for ${frame.interval}ms before next frame`, 'info');
  await new Promise(resolve => setTimeout(resolve, frame.interval));
};



const updateFrameDataLength = () => {
  // 根据长度更新数据
  const bytes = currentFrame.data.split(/\s+/).filter(Boolean);
  const newLength = currentFrame.length;
  
  if (bytes.length < newLength) {
    // 不足，补零
    const missing = newLength - bytes.length;
    for (let i = 0; i < missing; i++) {
      bytes.push('00');
    }
  } else if (bytes.length > newLength) {
    // 超出，截断
    bytes.splice(newLength);
  }
  
  currentFrame.data = bytes.join(' ');
};

const generateRandomData = () => {
  const bytes: string[] = [];
  for (let i = 0; i < currentFrame.length; i++) {
    bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
  }
  currentFrame.data = bytes.join(' ');
};

const generateRandomFrame = () => {
  // 生成随机ID (00-3F)
  if (randomSettings.value.includes('id')) {
    const randomId = Math.floor(Math.random() * 64).toString(16).toUpperCase().padStart(2, '0');
    currentFrame.id = randomId;
  }
  
  // 生成随机长度 (1-8)
  if (randomSettings.value.includes('length')) {
    const randomLength = Math.floor(Math.random() * 8) + 1;
    currentFrame.length = randomLength;
  }
  
  // 生成随机数据
  if (randomSettings.value.includes('data')) {
    const bytes: string[] = [];
    for (let i = 0; i < currentFrame.length; i++) {
      bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
    }
    currentFrame.data = bytes.join(' ');
  }
  
  addLog('Generated random frame configuration based on user selection', 'info');
};

const randomizeFrame = (index: number) => {
  const frame = { ...scheduleFrames.value[index] };
  
  // 生成随机ID (00-3F)
  if (randomSettings.value.includes('id')) {
    const randomId = Math.floor(Math.random() * 64).toString(16).toUpperCase().padStart(2, '0');
    frame.id = randomId;
  }
  
  // 生成随机长度 (1-8)
  if (randomSettings.value.includes('length')) {
    const randomLength = Math.floor(Math.random() * 8) + 1;
    frame.length = randomLength;
  }
  
  // 生成随机数据
  if (randomSettings.value.includes('data')) {
    const bytes: string[] = [];
    for (let i = 0; i < frame.length; i++) {
      bytes.push(Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0'));
    }
    frame.data = bytes.join(' ');
  }
  
  // 更新表格中的帧
  scheduleFrames.value[index] = frame;
  
  addLog(`Randomized frame at index ${index} based on settings: ${randomSettings.value.join(', ')}`, 'info');
};

// 处理长度变化，自动调整数据长度
const handleLengthChange = (frame: ScheduleFrame, index: number) => {
  // 分割数据为字节数组
  const dataBytes = frame.data.split(' ').filter(byte => byte);
  
  if (frame.length > dataBytes.length) {
    // 长度增加，在末尾添加00
    const addCount = frame.length - dataBytes.length;
    for (let i = 0; i < addCount; i++) {
      dataBytes.push('00');
    }
  } else if (frame.length < dataBytes.length) {
    // 长度减少，截断末尾
    dataBytes.splice(frame.length);
  }
  
  // 更新数据
  frame.data = dataBytes.join(' ');
  // 确保表格更新
  scheduleFrames.value[index] = { ...frame };
};

const exportTraceData = () => {
  if (receivedFrames.value.length === 0) {
    ElMessage.warning('没有数据可导出');
    return;
  }
  
  // 生成CSV格式数据
  const headers = ['时间戳', '方向', '通道', 'ID', 'PID', '数据', '状态', '校验和', '校验和类型', '校验和状态'];
  const csvContent = [
    headers.join(','),
    ...receivedFrames.value.map(frame => [
      frame.timestamp,
      frame.direction,
      frame.channel,
      frame.id,
      frame.pid || '',
      frame.data,
      frame.status,
      frame.checksum,
      frame.checksumType,
      frame.checksumValid ? '正确' : '错误'
    ].join(','))
  ].join('\n');
  
  // 创建下载链接
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Trace_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  addLog(`Exported ${receivedFrames.value.length} data trace records`, 'success');
};

// 事件监听
const setupEventListeners = () => {
  // 监听LIN帧数据
  const removeLinFrameListener = window.electron.serial.onLinFrame((frame: ParsedLinFrame) => {
    // 只在traceEnabled为true时处理LIN帧数据
    if (traceEnabled.value) {
      // 生成精确到毫秒的时间戳
      const now = new Date();
      const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
      
      // 解析校验和类型和状态
      let checksumType = '';
      let checksumValid = false;
      let status = frame.status;
      
      // 尝试确定校验和类型和验证状态
      if (frame.checksum) {
        const id = parseInt(frame.id, 16);
        const dataBytes = frame.data.split(' ').filter(Boolean).map(b => parseInt(b, 16));
        const receivedChecksumHex = frame.checksum;
        const receivedChecksum = parseInt(receivedChecksumHex, 16);
        
        // 计算V1校验和
        let v1Sum = 0;
        for (const byte of dataBytes) {
          v1Sum += byte;
        }
        const v1Checksum = v1Sum & 0xFF;
        const v1ChecksumHex = v1Checksum.toString(16).toUpperCase().padStart(2, '0');
        
        // 计算V2校验和 - (ID + 数据和) - PID
        let v2DataSum = 0;
        for (const byte of dataBytes) {
          v2DataSum += byte;
        }
        const v2TotalSum = id + v2DataSum;
        const pid = calculatePID(id);
        const v2Checksum = (v2TotalSum - pid) & 0xFF;
        const v2ChecksumHex = v2Checksum.toString(16).toUpperCase().padStart(2, '0');
        
        // 确定校验和类型
        if (receivedChecksumHex === v1ChecksumHex) {
          checksumType = 'V1';
          checksumValid = true;
          status = 'V1';
        } else if (receivedChecksumHex === v2ChecksumHex) {
          checksumType = 'V2';
          checksumValid = true;
          status = 'V2';
        } else {
          checksumType = '未知';
          checksumValid = false;
        }
      } else {
        checksumType = '未知';
        checksumValid = false;
      }
      
      // 计算PID
      const idValue = parseInt(frame.id, 16);
      const pid = calculatePID(idValue);
      const pidHex = pid.toString(16).toUpperCase().padStart(2, '0');
      
      const receivedFrame: ReceivedFrame = {
        id: frame.id,
        pid: pidHex,
        direction: frame.direction,
        channel: frame.channel,
        data: frame.data,
        status: status,
        checksum: frame.checksum,
        checksumType: checksumType,
        checksumValid: checksumValid,
        timestamp: timestamp
      };
      
      // 根据当前模式处理数据
      if (traceMode.value === 'scroll') {
        // 滚动模式：添加到数组开头
        receivedFrames.value.unshift(receivedFrame);
      } else if (traceMode.value === 'overlay') {
        // 覆盖模式：保留所有ID的最新1条数据
        // 移除旧的同ID数据
        receivedFrames.value = receivedFrames.value.filter(f => f.id !== frame.id);
        // 添加新数据
        receivedFrames.value.unshift(receivedFrame);
        // 按照ID大小排序（十六进制转十进制后比较）
        receivedFrames.value.sort((a, b) => {
          const idA = parseInt(a.id, 16);
          const idB = parseInt(b.id, 16);
          return idA - idB;
        });
      }
    }
  });
  
  // 监听串口错误
  const removeErrorListener = window.electron.serial.onError((error: string) => {
    addLog(`Serial port error: ${error}`, 'error');
    ElMessage.error(`串口错误: ${error}`);
  });
  
  // 串口关闭事件防抖
  let lastCloseMessage = '';
  let closeMessageTimestamp = 0;
  const closeMessageDebounceTime = 2000; // 2秒防抖
  
  // 监听串口关闭
  const removeCloseListener = window.electron.serial.onClose((data: any) => {
    // 处理对象类型的参数
    const message = typeof data === 'object' && data.message ? data.message : String(data);
    
    // 防抖处理，避免短时间内多次触发相同的提示
    const now = Date.now();
    if (message === lastCloseMessage && now - closeMessageTimestamp < closeMessageDebounceTime) {
      return; // 忽略重复的关闭事件
    }
    
    lastCloseMessage = message;
    closeMessageTimestamp = now;
    
    serialConnected.value = false;
    linStatus.value = false;
    isScanning.value = false;
    scanProgress.value = '';
    addLog(message, 'warning');
    ElMessage.warning(message);
    // 启动自动重连
    setupReconnect();
  });
  
  // 串口插拔事件防抖
  const portEventMap = new Map<string, number>();
  const portEventDebounceTime = 3000; // 3秒防抖
  
  // 监听串口添加
  const removePortAddedListener = window.electron.serial.onPortAdded((port: any) => {
    const portPath = port.path;
    const eventKey = `added-${portPath}`;
    
    // 防抖处理，避免短时间内多次触发相同的提示
    const now = Date.now();
    const lastEventTime = portEventMap.get(eventKey) || 0;
    if (now - lastEventTime < portEventDebounceTime) {
      console.log('Ignoring duplicate port added event:', eventKey);
      return; // 忽略重复的添加事件
    }
    
    portEventMap.set(eventKey, now);
    
    const portInfo = `串口 ${portPath} (${port.manufacturer})`;
    addLog(`Serial port added: ${portInfo}`, 'info');
    ElMessage.success(`检测到新串口: ${portInfo}`);
  });
  
  // 监听串口移除
  const removePortRemovedListener = window.electron.serial.onPortRemoved((data: any) => {
    const portPath = data.port.path;
    const eventKey = `removed-${portPath}`;
    
    // 防抖处理，避免短时间内多次触发相同的提示
    const now = Date.now();
    const lastEventTime = portEventMap.get(eventKey) || 0;
    if (now - lastEventTime < portEventDebounceTime) {
      console.log('Ignoring duplicate port removed event:', eventKey);
      return; // 忽略重复的移除事件
    }
    
    portEventMap.set(eventKey, now);
    
    const portInfo = `串口 ${portPath} (${data.port.manufacturer})`;
    
    // 查找使用该串口的设备
    const affectedDevices = deviceManager.devices.filter(device => device.serialConfig.port === portPath);
    const affectedDeviceNames = affectedDevices.map(device => device.name);
    const affectedDevicesInfo = affectedDeviceNames.length > 0 
      ? `，影响设备: ${affectedDeviceNames.join(', ')}` 
      : '';
    
    addLog(`Serial port removed: ${portInfo}${affectedDevicesInfo}`, 'warning');
    ElMessage.warning(`串口已拔出: ${portInfo}${affectedDevicesInfo}`);
    
    // 更新受影响设备的状态为未连接
    affectedDevices.forEach(device => {
      deviceManager.updateDeviceStatus(device.id, {
        serialConnected: false,
        linStatus: false
      });
      
      // 如果设备启用了自动重连，启动重连
      if (device.status.autoReconnect) {
        addLog(`Starting automatic reconnection for device: ${device.name}`, 'info');
        setupReconnect(device.id);
      }
    });
  });
  
  // 组件卸载时移除监听器
  return () => {
    removeLinFrameListener();
    removeErrorListener();
    removeCloseListener();
    removePortAddedListener();
    removePortRemovedListener();
  };
};

// 计算校验和（符合LIN协议标准）
const calculateChecksum = (result: ScanResult): string => {
  try {
    if (!result.data) return '';
    
    // 解析数据
    const dataBytes = result.data.split(' ').filter(Boolean).map(b => parseInt(b, 16));
    
    // 计算数据和
    let dataSum = 0;
    for (const byte of dataBytes) {
      dataSum += byte;
    }
    
    // 根据校验类型计算校验和
    let checksum = 0;
    if (result.checkType === 'V1') {
      // V1校验和：经典校验(Classic Checksum) - 仅数据场
      checksum = dataSum;
    } else if (result.checkType === 'V2') {
      // V2校验和：增强校验(Enhance Checksum) - (ID + 数据和) - PID
      const totalSum = result.id + dataSum;
      const pid = calculatePID(result.id);
      checksum = totalSum - pid;
    }
    
    // 取低8位
    checksum &= 0xFF;
    // 转换为十六进制字符串
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  } catch (error) {
    addLog(`Failed to calculate checksum: ${error}`, 'error');
    return '';
  }
};

// 计算PID (Protected ID) - 符合LIN协议标准
const calculatePID = (id: number): number => {
  try {
    if (id < 0 || id > 63) {
      throw new Error('ID must be between 0 and 63');
    }
    
    // PID计算算法：
    // 1. 取ID的6位作为基础
    // 2. 计算奇偶校验位
    const idBits = id & 0x3F; // 确保只使用低6位
    
    // 计算偶校验位 (P0)
    const p0 = ((idBits >> 0) & 1) ^ ((idBits >> 1) & 1) ^ ((idBits >> 2) & 1) ^ ((idBits >> 4) & 1);
    
    // 计算奇校验位 (P1)
    const p1 = ~(((idBits >> 1) & 1) ^ ((idBits >> 3) & 1) ^ ((idBits >> 4) & 1) ^ ((idBits >> 5) & 1)) & 1;
    
    // 组合PID: P0 (bit 6), P1 (bit 7), ID (bits 0-5)
    const pid = (p0 << 6) | (p1 << 7) | idBits;
    
    return pid;
  } catch (error) {
    addLog(`Failed to calculate PID: ${error}`, 'error');
    return id; // 失败时返回原始ID
  }
};

// 检测校验和类型
const detectChecksumType = (id: number, data: string, receivedChecksum: string): string => {
  try {
    if (!data || !receivedChecksum) return 'V1'; // 默认V1
    
    // 解析数据
    const dataBytes = data.split(' ').filter(Boolean).map(b => parseInt(b, 16));
    const receivedChecksumValue = parseInt(receivedChecksum, 16);
    
    // 计算V1校验和（只包含数据字节，简单累加和取低8位）
    let v1Sum = 0;
    for (const byte of dataBytes) {
      v1Sum += byte;
    }
    const v1Checksum = v1Sum & 0xFF;
    
    // 计算V2校验和（包含ID和数据字节，简单累加和取低8位）
    let v2Sum = id;
    for (const byte of dataBytes) {
      v2Sum += byte;
    }
    const v2Checksum = v2Sum & 0xFF;
    
    // 计算V1校验和（只包含数据字节，取反加1）
    const v1SumComplement = (((~v1Sum) & 0x000000FF) + 1) & 0xFF;
    
    // 计算V2校验和（包含ID和数据字节，取反加1）
    const v2SumComplement = (((~v2Sum) & 0x000000FF) + 1) & 0xFF;
    
    // 确定校验和类型
    if (receivedChecksumValue === v1Checksum) {
      return 'V1';
    } else if (receivedChecksumValue === v2Checksum) {
      return 'V2';
    } else if (receivedChecksumValue === v1SumComplement) {
      return 'V1';
    } else if (receivedChecksumValue === v2SumComplement) {
      return 'V2';
    } else {
      return 'V1'; // 默认V1
    }
  } catch (error) {
    addLog(`Failed to detect checksum type: ${error}`, 'error');
    return 'V1'; // 默认V1
  }
};

// 从机扫描相关方法
let scanStatusInterval: number | null = null;

const startScan = async () => {
  let removeScanResultListener: (() => void) | undefined;
  const scanStartTime = Date.now();
  try {
    addLog('Starting slave scan...', 'info');
    isScanning.value = true;
    scanProgress.value = '准备扫描...';
    scanResults.value = [];
    
    // 生成唯一扫描ID
    const scanId = `SCAN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    currentScanId.value = scanId;
    addLog(`Scan task created, ID: ${scanId}`, 'info');
    
    // 检查必要的方法
    if (typeof window.electron?.lin?.scanSlaves !== 'function') {
      throw new Error('scanSlaves 方法不可用，请检查应用是否已重新加载');
    }
    
    // 检查是否选择了设备
    if (!selectedDeviceForScan.value) {
      throw new Error('请选择要用于扫描的设备');
    }
    
    // 检查设备连接状态
    const selectedDevice = selectedDeviceForScanObj.value;
    if (!selectedDevice?.status.serialConnected) {
      throw new Error('选择的设备未连接，请先连接设备');
    }
    
    // 添加扫描结果事件监听器
    removeScanResultListener = window.electron.lin.onScanResult((data: any) => {
      // 只处理当前扫描的结果
      if (data.scanId === scanId) {
        const result = data.result;
        // 将扫描结果添加到结果数组中
        scanResults.value.push(result);
        // 显示扫描结果弹窗
        ElMessageBox.confirm(
          `<div style="padding: 10px;">
            <div style="margin-bottom: 8px;"><strong>当前扫描波特率：</strong>${result.baudRate}</div>
            <div style="margin-bottom: 8px;"><strong>扫描到从机：</strong>ID ${result.id.toString(16).toUpperCase().padStart(2, '0')}</div>
            <div style="margin-bottom: 8px;"><strong>数据：</strong>${result.data}</div>
            <div style="margin-bottom: 8px;"><strong>长度：</strong>${result.dataLength}</div>
            <div style="margin-bottom: 8px;"><strong>类型：</strong>${result.checkType}</div>
            <div style="margin-bottom: 12px;"><strong>校验和：</strong>${result.checksum}</div>
            <div style="font-weight: bold; color: #303133;">是否继续扫描？</div>
          </div>`,
          '扫描结果',
          {
            confirmButtonText: '继续扫描',
            cancelButtonText: '停止扫描',
            type: 'success',
            closeOnClickModal: false,
            closeOnPressEscape: false,
            dangerouslyUseHTMLString: true
          }
        ).then(async () => {
          // 用户选择继续扫描
          addLog('User selected to continue scanning', 'info');
          try {
            const result = await window.electron.lin.scanResultChoice(true);
            addLog(`扫描结果选择处理成功: ${result.message}`, 'info');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`扫描结果选择处理失败: ${errorMessage}`, 'error');
          }
        }).catch(async () => {
          // 用户选择停止扫描
          addLog('User selected to stop scanning', 'info');
          try {
            const result = await window.electron.lin.scanResultChoice(false);
            addLog(`扫描结果选择处理成功: ${result.message}`, 'info');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`扫描结果选择处理失败: ${errorMessage}`, 'error');
          }
          stopScan();
        });
      }
    });
    
    // 启动扫描状态检查
    startScanStatusCheck();
    
    // 调用主进程的扫描方法，将reactive对象转换为普通对象
    const scanParams = {
      ...JSON.parse(JSON.stringify(scanConfig)),
      scanId, // 添加扫描ID
      deviceId: selectedDeviceForScan.value // 添加设备ID
    };
    
    // 为每个波特率设置波特率
    try {
      // 为第一个波特率设置波特率
      if (scanConfig.baudRates.length > 0) {
        if (selectedDevice) {
          await window.electron.lin.setBaudRate(scanConfig.baudRates[0], selectedDevice.id);
          await window.electron.lin.setMode(1, selectedDevice.id); // 设置为主机模式
          addLog(`Slave scan baud rate set successfully: ${scanConfig.baudRates[0]}`, 'success');
        }
      } else {
        throw new Error('请至少选择一个波特率');
      }
    } catch (error) {
      addLog(`Failed to set slave scan baud rate: ${error}`, 'error');
      ElMessage.error(`从机扫描波特率设置失败: ${error}`);
      throw error;
    }
    
    const results = await window.electron.lin.scanSlaves(scanParams);
    
    if (results && results.length > 0) {
        // 过滤结果，仅展示成功读取到有效数据的ID
        const validResults = results.filter(result => {
          // 确保结果成功且有实际数据
          return result.success && 
                 (result.hasData === true || 
                  (result.data && result.data.trim() !== ''));
        });
      
      if (validResults.length > 0) {
        // 处理每个结果，确保有校验和
        const processedResults = validResults.map(result => {
          // 尊重从数据帧中读取的校验类型，只有当为'未知'时才尝试自动检测
          let checkType = result.checkType;
          if (result.checksum && checkType === '未知') {
            checkType = detectChecksumType(result.id, result.data, result.checksum);
          }
          
          return {
            ...result,
            checkType,
            checksum: result.checksum // 只使用实际读取到的校验和，不计算
          };
        });
        
        scanResults.value = processedResults;
        addLog(`Scan completed, found ${processedResults.length} slaves with data`, 'success');
        
        // 将扫描到的数据添加到数据追踪中
        if (traceEnabled.value && processedResults.length > 0) {
          processedResults.forEach(result => {
            const now = new Date();
            const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
            const hexId = result.id.toString(16).toUpperCase().padStart(2, '0');
            
            const traceFrame: ReceivedFrame = {
              id: hexId,
              direction: '接收',
              channel: '1',
              data: result.data,
              status: result.success ? '成功' : '失败',
              checksum: result.checksum || '',
              checksumType: result.checkType || 'V1',
              checksumValid: !result.checksumError,
              timestamp: timestamp
            };
            
            // 根据当前模式处理数据
            if (traceMode.value === 'scroll') {
              // 滚动模式：添加到数组开头
              receivedFrames.value.unshift(traceFrame);
            } else if (traceMode.value === 'overlay') {
              // 覆盖模式：保留所有ID的最新1条数据
              // 移除旧的同ID数据
              receivedFrames.value = receivedFrames.value.filter(frame => frame.id !== hexId);
              // 添加新数据
              receivedFrames.value.unshift(traceFrame);
              // 按照ID大小排序（十六进制转十进制后比较）
              receivedFrames.value.sort((a, b) => {
                const idA = parseInt(a.id, 16);
                const idB = parseInt(b.id, 16);
                return idA - idB;
              });
            }
          });
          addLog(`Added ${processedResults.length} scan results to data trace`, 'info');
        }
        
        // 扫描完成提示
        if (processedResults.length > 0) {
          addLog(`Scan completed, found ${processedResults.length} slaves with data`, 'success');
          const scanEndTime = Date.now();
          const scanDuration = Math.round((scanEndTime - scanStartTime) / 1000);
          
          // 结果汇总
          const summary = `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">扫描完成</div>
              <div style="margin-bottom: 8px;"><strong>扫描用时：</strong>${scanDuration} 秒</div>
              <div style="margin-bottom: 8px;"><strong>发现从机：</strong>${processedResults.length} 个</div>
              <div style="margin-bottom: 12px;"><strong>扫描范围：</strong>
                波特率 ${scanConfig.baudRates.join(', ')}，
                ID范围 0x${scanConfig.idRange[0].toString(16).toUpperCase().padStart(2, '0')} - 0x${scanConfig.idRange[1].toString(16).toUpperCase().padStart(2, '0')}
              </div>
              <div style="font-weight: bold; margin-bottom: 8px;">发现的从机：</div>
              <div style="max-height: 200px; overflow-y: auto;">
                ${processedResults.map((result, index) => `
                  <div style="margin-bottom: 6px; padding: 6px; background-color: #f5f7fa; border-radius: 4px;">
                    <div><strong>从机 ${index + 1}：</strong>ID 0x${result.id.toString(16).toUpperCase().padStart(2, '0')}</div>
                    <div>波特率：${result.baudRate}，长度：${result.dataLength}，类型：${result.checkType}</div>
                    <div>数据：${result.data}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
          
          ElMessageBox.alert(
            summary,
            '扫描完成',
            {
              confirmButtonText: '确定',
              type: 'success',
              dangerouslyUseHTMLString: true,
              customClass: 'scan-complete-dialog'
            }
          );
        } else {
          addLog('Scan completed, no slaves with data found', 'info');
          const scanEndTime = Date.now();
          const scanDuration = Math.round((scanEndTime - scanStartTime) / 1000);
          
          const summary = `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">扫描完成</div>
              <div style="margin-bottom: 8px;"><strong>扫描用时：</strong>${scanDuration} 秒</div>
              <div style="margin-bottom: 8px;"><strong>发现从机：</strong>0 个</div>
              <div style="margin-bottom: 12px;"><strong>扫描范围：</strong>
                波特率 ${scanConfig.baudRates.join(', ')}，
                ID范围 0x${scanConfig.idRange[0].toString(16).toUpperCase().padStart(2, '0')} - 0x${scanConfig.idRange[1].toString(16).toUpperCase().padStart(2, '0')}
              </div>
              <div style="color: #909399;">未发现有数据的从机，请检查设备连接和扫描参数。</div>
            </div>
          `;
          
          ElMessageBox.alert(
            summary,
            '扫描完成',
            {
              confirmButtonText: '确定',
              type: 'info',
              dangerouslyUseHTMLString: true,
              customClass: 'scan-complete-dialog'
            }
          );
        }
        

      } else {
        scanResults.value = [];
        addLog('Scan completed, no slaves with data found', 'info');
        const scanEndTime = Date.now();
        const scanDuration = Math.round((scanEndTime - scanStartTime) / 1000);
        
        const summary = `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">扫描完成</div>
            <div style="margin-bottom: 8px;"><strong>扫描用时：</strong>${scanDuration} 秒</div>
            <div style="margin-bottom: 8px;"><strong>发现从机：</strong>0 个</div>
            <div style="margin-bottom: 12px;"><strong>扫描范围：</strong>
              波特率 ${scanConfig.baudRates.join(', ')}，
              ID范围 0x${scanConfig.idRange[0].toString(16).toUpperCase().padStart(2, '0')} - 0x${scanConfig.idRange[1].toString(16).toUpperCase().padStart(2, '0')}
            </div>
            <div style="color: #909399;">未发现有数据的从机，请检查设备连接和扫描参数。</div>
          </div>
        `;
        
        ElMessageBox.alert(
          summary,
          '扫描完成',
          {
            confirmButtonText: '确定',
            type: 'info',
            dangerouslyUseHTMLString: true,
            customClass: 'scan-complete-dialog'
          }
        );
      }
    } else {
      scanResults.value = [];
      addLog('Scan completed, no slaves found', 'info');
      const scanEndTime = Date.now();
      const scanDuration = Math.round((scanEndTime - scanStartTime) / 1000);
      
      const summary = `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">扫描完成</div>
          <div style="margin-bottom: 8px;"><strong>扫描用时：</strong>${scanDuration} 秒</div>
          <div style="margin-bottom: 8px;"><strong>发现从机：</strong>0 个</div>
          <div style="margin-bottom: 12px;"><strong>扫描范围：</strong>
            波特率 ${scanConfig.baudRates.join(', ')}，
            ID范围 0x${scanConfig.idRange[0].toString(16).toUpperCase().padStart(2, '0')} - 0x${scanConfig.idRange[1].toString(16).toUpperCase().padStart(2, '0')}
          </div>
          <div style="color: #909399;">未发现从机，请检查设备连接和扫描参数。</div>
        </div>
      `;
      
      ElMessageBox.alert(
        summary,
        '扫描完成',
        {
          confirmButtonText: '确定',
          type: 'info',
          dangerouslyUseHTMLString: true,
          customClass: 'scan-complete-dialog'
        }
      );
    }
    
    // 移除扫描结果事件监听器
    if (removeScanResultListener) {
      removeScanResultListener();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog(`Scan failed: ${errorMessage}`, 'error');
    ElMessage.error(`扫描失败: ${errorMessage}`);
  } finally {
    // 移除事件监听器
    if (removeScanResultListener) {
      removeScanResultListener();
    }
    stopScanStatusCheck();
    isScanning.value = false;
    scanProgress.value = '';
    currentScanId.value = '';
  }
};

const stopScan = async () => {
  try {
    // 调用主进程中止扫描
    if (typeof window.electron?.lin?.abortScan === 'function') {
      const result = await window.electron.lin.abortScan();
      if (result.success) {
        addLog('Scan aborted', 'info');
        ElMessage.info('扫描已中止');
      } else {
        addLog(`Failed to abort scan: ${result.message}`, 'warning');
        ElMessage.warning(`中止扫描失败: ${result.message}`);
      }
    }
  } catch (error) {
    addLog(`Failed to abort scan: ${error}`, 'error');
    ElMessage.error('中止扫描失败');
  } finally {
    stopScanStatusCheck();
    isScanning.value = false;
    scanProgress.value = '';
    currentScanId.value = '';
  }
};

// 开始扫描状态检查
const startScanStatusCheck = () => {
  // 清除之前的定时器
  stopScanStatusCheck();
  
  // 记录已处理的结果ID，避免重复添加
  const processedResultIds = new Set();
  
  // 每500ms检查一次扫描状态
  scanStatusInterval = window.setInterval(async () => {
    try {
      if (typeof window.electron?.lin?.getScanStatus === 'function') {
        const status = await window.electron.lin.getScanStatus();
        if (status) {
          if (status.progress !== undefined) {
            scanProgress.value = `扫描进度: ${status.progress}%`;
          }
          if (status.currentLinId !== undefined) {
            currentLinId.value = status.currentLinId;
          }
          if (status.currentBaudRate !== undefined) {
            currentBaudRate.value = status.currentBaudRate;
          }
          
          // 检查是否有新的扫描结果
          if (status.results && Array.isArray(status.results)) {
            // 过滤出未处理的结果
            const newResults = status.results.filter(result => {
              // 生成唯一的结果ID
              const resultId = `${result.id}_${result.baudRate}_${result.checkType}`;
              if (!processedResultIds.has(resultId)) {
                processedResultIds.add(resultId);
                return true;
              }
              return false;
            });
            
            // 如果有新的结果，添加到结果列表中
            if (newResults.length > 0) {
              // 过滤出有效的结果
              const validResults = newResults.filter(result => {
                // 确保结果成功且有实际数据
                return result.success && 
                       (result.hasData === true || 
                        (result.data && result.data.trim() !== ''));
              });
              
              if (validResults.length > 0) {
                // 批量添加结果
                validResults.forEach(result => {
                  // 自动检测校验和类型
                  let checkType = result.checkType;
                  if (result.checksum) {
                    checkType = detectChecksumType(result.id, result.data, result.checksum);
                  }
                  
                  // 确保有校验和
                  const processedResult = {
                    ...result,
                    checkType,
                    checksum: result.checksum // 只使用实际读取到的校验和，不计算
                  };
                  
                  // 检查结果是否已存在
                  const exists = scanResults.value.some(r => 
                    r.id === processedResult.id && r.baudRate === processedResult.baudRate && r.checkType === processedResult.checkType
                  );
                  
                  if (!exists) {
                    scanResults.value.push(processedResult);
                  }
                });
                
                // 限制结果数量，只保留最近的100个
                if (scanResults.value.length > 100) {
                  scanResults.value = scanResults.value.slice(-100);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('获取扫描状态失败:', error);
    }
  }, 500);
};

// 停止扫描状态检查
const stopScanStatusCheck = () => {
  if (scanStatusInterval) {
    clearInterval(scanStatusInterval);
    scanStatusInterval = null;
  }
  currentLinId.value = '';
};

const clearScanResults = () => {
  scanResults.value = [];
  addLog('Scan results cleared', 'info');
};

const exportScanResults = () => {
  if (scanResults.value.length === 0) {
    ElMessage.warning('没有扫描结果可导出');
    return;
  }
  
  // 生成CSV格式数据
  const headers = ['ID', '波特率', '数据长度', '校验类型', '数据', '校验和', '状态'];
  const csvContent = [
    headers.join(','),
    ...scanResults.value.map(result => [
      `0x${result.id.toString(16).toUpperCase().padStart(2, '0')}`,
      result.baudRate,
      result.dataLength,
      result.checkType,
      result.data,
      result.checksum || '',
      result.success ? '成功' : '失败'
    ].join(','))
  ].join('\n');
  
  // 创建下载链接
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `SlaveScan_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  addLog(`Exported ${scanResults.value.length} scan results`, 'success');
};

// 生命周期
onMounted(() => {
  // 刷新串口列表
  refreshPorts();
  
  // 设置事件监听
  setupEventListeners();
  
  // 定时刷新串口列表
  const interval = setInterval(() => {
    if (!serialConnected.value) {
      refreshPorts();
    }
  }, 5000);
  
  // 组件卸载时清除定时器
  return () => {
    clearInterval(interval);
    // 清除循环发送定时器
    if (sendInterval) {
      clearInterval(sendInterval);
      sendInterval = null;
    }
  };
});
</script>

<style>
/* 全局样式重置 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

* {
  box-sizing: border-box;
}
</style>

<style scoped>
/* Fluent Design System 样式变量 */
:root {
  /* 主要颜色 */
  --fluent-primary: #0078d4;
  --fluent-primary-hover: #106ebe;
  --fluent-primary-pressed: #005a9e;
  
  /* 背景颜色 */
  --fluent-background: #ffffff;
  --fluent-surface: #f3f2f1;
  --fluent-surface-hover: #e5e5e5;
  --fluent-surface-pressed: #d9d9d9;
  
  /* 文本颜色 */
  --fluent-text-primary: #111827;
  --fluent-text-secondary: #374151;
  --fluent-text-tertiary: #6b7280;
  --fluent-text-disabled: #9ca3af;
  
  /* 功能颜色 */
  --fluent-success: #107c10;
  --fluent-success-hover: #0d6e0d;
  --fluent-warning: #f7b955;
  --fluent-error: #d13438;
  --fluent-info: #2563eb;
  
  /* 边框和阴影 */
  --fluent-border: #e5e7eb;
  --fluent-border-hover: #d1d5db;
  --fluent-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  --fluent-shadow-hover: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  
  /* 过渡效果 */
  --fluent-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* 标题栏 */
  --fluent-titlebar-bg: #0078d4;
  --fluent-titlebar-text: #ffffff;
  
  /* 按钮栏 */
  --fluent-button-bar-bg: #f3f2f1;
  --fluent-button-bar-border: #e5e7eb;
  --fluent-button-size: 48px;
}

/* 应用容器 */
.app-container {
  width: 100%;
  height: 100vh;
  background-color: var(--fluent-background);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
  /* Fluent Design 字体优化 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  /* 消除默认边距 */
  margin: 0;
  padding: 0;
  /* 性能优化 */
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* 硬件加速 */
.custom-titlebar,
.navigation-sidebar,
.content,
.properties-panel {
  /* 启用硬件加速 */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  /* 减少重绘 */
  will-change: transform, opacity;
}

/* 滚动性能优化 */
.content,
.properties-panel,
.trace-table-container :deep(.el-table__body-wrapper),
.log-scrollbar {
  /* 平滑滚动 */
  scroll-behavior: smooth;
  /* 减少滚动卡顿 */
  overscroll-behavior: contain;
}

/* 避免布局抖动 */
.tabs-container,
.config-card,
.status-card {
  /* 固定尺寸，避免重排 */
  contain: layout style;
  /* 减少布局计算 */
  box-sizing: border-box;
}

/* 上部容器滚动条样式 */
.tabs-container.overflow-auto {
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border) var(--fluent-surface);
}

.tabs-container.overflow-auto::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.tabs-container.overflow-auto::-webkit-scrollbar-track {
  background: var(--fluent-surface);
  border-radius: 5px;
}

.tabs-container.overflow-auto::-webkit-scrollbar-thumb {
  background-color: var(--fluent-border);
  border-radius: 5px;
  border: 2px solid var(--fluent-surface);
  background-clip: content-box;
  transition: background-color 0.2s ease;
}

.tabs-container.overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: var(--fluent-border-hover);
}

/* 底部面板优化 */
.content-bottom {
  flex: 1;
  min-height: 200px;
  background-color: var(--fluent-background);
  border-top: 1px solid var(--fluent-border);
  transition: var(--fluent-transition);
  overflow: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 增强内容底部容器的溢出处理 */
.content-bottom .content-container {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 确保数据追踪面板的溢出处理 */
.trace-panel-container {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 确保分页控件不会超出容器 */
.trace-panel-container .trace-actions-footer {
  overflow: hidden;
  white-space: nowrap;
}

.content-bottom .tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-bottom .content-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-bottom .content-container > :deep(*) {
  min-height: 0;
  flex-shrink: 0;
}

.content-bottom .content-container > :deep(.trace-panel-container) {
  flex: 1;
  flex-shrink: 1;
  min-height: 0;
}

.trace-panel-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
  animation: fadeIn 0.5s ease-in-out;
  flex: 1;
}

/* 确保面板内容区域的合理布局 */
.trace-panel-container > * {
  flex-shrink: 0;
}

/* 确保表格容器可以收缩 */
.trace-panel-container .trace-table-container {
  flex-shrink: 1 !important;
}

/* 确保表格容器能够填充剩余空间 */
.trace-panel-container .trace-table-container {
  flex: 1;
  flex-shrink: 1;
  min-height: 100px;
}

.trace-panel-container .panel-title {
  flex-shrink: 0;
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--fluent-text);
  padding: 4px 8px;
  background-color: var(--fluent-surface);
  border-radius: 4px;
}

.trace-panel-container .trace-control-panel {
  flex-shrink: 0;
  padding: 8px;
  background-color: var(--fluent-surface);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--fluent-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  animation: slideInUp 0.3s ease-in-out;
}

/* 数据追踪控制面板容器 */
.trace-controls-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  flex-wrap: wrap;
  gap: 8px;
}

/* 确保导出按钮在最右边 */
.trace-controls-container .trace-control-item:last-child {
  margin-left: auto;
}

/* 数据追踪控制项 */
.trace-control-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

/* 确保按钮在同一行 */
.trace-controls-container .el-button {
  margin: 0;
}

.trace-panel-container .trace-actions-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: var(--fluent-surface);
  border-radius: 4px;
  margin-bottom: 4px;
}

.trace-panel-container .trace-actions-header .action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trace-panel-container .trace-actions-header .trace-total {
  font-size: 12px;
  color: var(--fluent-text-secondary);
}

.trace-panel-container .trace-table-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--fluent-border);
  display: flex;
  flex-direction: column;
  position: relative;
  max-height: calc(100% - 120px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  min-height: 200px;
}

.trace-panel-container .trace-table-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 确保表格能够填充表格容器 */
.trace-panel-container .trace-table-container :deep(.el-table) {
  flex: 1;
  min-height: 0;
  width: 100%;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
}

/* 确保表格头部固定 */
.trace-panel-container .trace-table-container :deep(.el-table__header-wrapper) {
  flex-shrink: 0;
  border-bottom: 1px solid var(--fluent-border);
  background-color: var(--fluent-surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 表头单元格样式 */
.trace-panel-container .trace-table-container :deep(.table-header-cell) {
  background-color: var(--fluent-surface) !important;
  font-weight: 600;
  color: var(--fluent-text-primary);
  border-bottom: 1px solid var(--fluent-border) !important;
  position: sticky;
}

/* 调整表格复选框样式 */
:deep(.el-table .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
  width: 16px;
  height: 16px;
}

:deep(.el-table .el-checkbox__input .el-checkbox__inner) {
  width: 16px;
  height: 16px;
}

:deep(.el-table .el-checkbox__input.is-checked .el-checkbox__inner::after) {
  width: 7px;
  height: 12px;
  left: 3.5px;
  top: 1px;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scaleY(1);
  transform-origin: center;
}

.trace-panel-container .trace-table-container :deep(.el-table__header-wrapper th) {
  background-color: var(--fluent-surface) !important;
  border-bottom: 1px solid var(--fluent-border) !important;
  font-weight: 600;
  color: var(--fluent-text-primary);
}

/* 确保表格主体区域可滚动 */
.trace-panel-container .trace-table-container :deep(.el-table__body-wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto !important;
  overflow-x: auto;
  max-height: none !important;
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border) var(--fluent-surface);
  height: auto;
  min-height: 100px;
}

/* 确保表格容器的高度计算正确 */
.trace-panel-container .trace-table-container :deep(.el-table__inner-wrapper) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 确保表格行高正常 */
.trace-panel-container .trace-table-container :deep(.el-table__row) {
  height: 36px;
  transition: background-color 0.2s ease;
}

.trace-panel-container .trace-table-container :deep(.el-table__row:hover) {
  background-color: var(--fluent-surface-hover) !important;
}

/* 优化表格滚动条样式 */
.trace-panel-container .trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.trace-panel-container .trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: var(--fluent-surface);
  border-radius: 4px;
}

.trace-panel-container .trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: var(--fluent-border);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.trace-panel-container .trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: var(--fluent-primary-light);
}

/* 动画效果定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.trace-panel-container .trace-actions-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--fluent-surface);
  border: 1px solid var(--fluent-border);
  border-radius: 8px;
  margin-top: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
  min-height: 60px;
  overflow: visible;
  width: 100%;
  box-sizing: border-box;
}

/* 为分页组件添加样式 */
.trace-panel-container .trace-actions-footer :deep(.el-pagination) {
  margin: 0;
}

.trace-panel-container .trace-actions-footer :deep(.el-pagination__sizes),
.trace-panel-container .trace-actions-footer :deep(.el-pagination__total),
.trace-panel-container .trace-actions-footer :deep(.el-pagination__jump) {
  color: var(--fluent-text-primary);
}

.trace-panel-container .trace-actions-footer :deep(.el-pagination__page-btn) {
  background-color: var(--fluent-surface);
  border: 1px solid var(--fluent-border);
  color: var(--fluent-text-primary);
  border-radius: 4px;
  margin: 0 2px;
}

.trace-panel-container .trace-actions-footer :deep(.el-pagination__page-btn:hover) {
  background-color: var(--fluent-primary-light);
  border-color: var(--fluent-primary);
  color: var(--fluent-primary);
}

.trace-panel-container .trace-actions-footer :deep(.el-pagination__page-btn.is-current) {
  background-color: var(--fluent-primary);
  border-color: var(--fluent-primary);
  color: white;
}

.trace-panel-container .trace-actions-footer :deep(.el-pagination__prev),
.trace-panel-container .trace-actions-footer :deep(.el-pagination__next) {
  background-color: var(--fluent-surface);
  border: 1px solid var(--fluent-border);
  color: var(--fluent-text-primary);
  border-radius: 4px;
}

.trace-panel-container .trace-actions-footer :deep(.el-pagination__prev:hover),
.trace-panel-container .trace-actions-footer :deep(.el-pagination__next:hover) {
  background-color: var(--fluent-primary-light);
  border-color: var(--fluent-primary);
  color: var(--fluent-primary);
}

/* 加载中指示器样式 */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: var(--fluent-surface);
  border: 1px solid var(--fluent-border);
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in-out;
}

.loading-indicator .is-loading {
  animation: rotate 1s linear infinite;
  margin-right: 8px;
  color: var(--fluent-primary);
}

.loading-indicator span {
  color: var(--fluent-text-primary);
  font-size: 14px;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式布局优化 */
@media (max-width: 1200px) {
  .trace-panel-container .trace-table-container {
    max-height: calc(100vh - 450px);
  }
  
  .trace-controls-container {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .trace-control-item {
    margin-right: 4px;
  }
  
  /* 调整搜索框大小 */
  .trace-control-item.search-item {
    width: 100%;
    max-width: 300px;
  }
  
  /* 调整操作按钮组 */
  .trace-control-item.action-buttons {
    width: 100%;
    justify-content: flex-end;
    margin-top: 4px;
  }
}

/* 小屏幕设备优化 */
@media (max-width: 768px) {
  .trace-panel-container .trace-table-container {
    max-height: calc(100vh - 400px);
  }
  
  .panel-header {
    padding: 4px 8px;
  }
  
  .panel-title {
    font-size: 14px;
  }
  
  .trace-control-panel {
    padding: 4px;
  }
  
  .trace-controls-container {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .trace-control-item {
    margin-right: 4px;
  }
  
  /* 调整搜索框大小 */
  .trace-control-item.search-item {
    width: 100%;
    max-width: none;
  }
  
  /* 调整操作按钮组 */
  .trace-control-item.action-buttons {
    width: 100%;
    justify-content: flex-end;
    margin-top: 4px;
  }
  
  /* 调整表格列宽 */
  .trace-panel-container .trace-table-container :deep(.el-table-column) {
    min-width: 60px;
  }
  
  /* 调整时间列宽度 */
  .trace-panel-container .trace-table-container :deep(.el-table-column[prop="timestamp"]) {
    width: 120px;
  }
  
  /* 调整表格主体区域高度 */
  .trace-panel-container .trace-table-container :deep(.el-table__body-wrapper) {
    height: calc(100% - 30px);
  }
}

/* 极小屏幕设备优化 */
@media (max-width: 480px) {
  .trace-panel-container .trace-table-container {
    max-height: calc(100vh - 550px);
  }
  
  .trace-controls-container {
    gap: 2px;
  }
  
  .trace-control-item {
    margin-right: 2px;
  }
  
  /* 调整按钮大小 */
  .trace-control-item.action-buttons .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
  
  /* 进一步调整表格列宽 */
  .trace-panel-container .trace-table-container :deep(.el-table-column) {
    min-width: 50px;
  }
  
  /* 调整时间列宽度 */
  .trace-panel-container .trace-table-container :deep(.el-table-column[prop="timestamp"]) {
    width: 100px;
  }
}

@media (max-width: 768px) {
  .trace-panel-container .trace-table-container {
    max-height: calc(100vh - 500px);
  }
  
  .trace-panel-container .panel-title {
    font-size: 12px;
    padding: 2px 6px;
  }
  
  .trace-controls-container {
    flex-wrap: wrap;
    gap: 2px;
  }
  
  .trace-control-item {
    margin-right: 2px;
  }
  
  /* 调整分页控件在小屏幕下的显示 */
  .trace-panel-container .trace-actions-footer {
    padding: 8px 10px;
    min-height: 50px;
  }
  
  .trace-panel-container .trace-actions-footer :deep(.el-pagination) {
    font-size: 12px;
  }
  
  /* 调整分页控件组件大小 */
  .trace-panel-container .trace-actions-footer :deep(.el-pagination__page-btn) {
    font-size: 12px;
    padding: 2px 8px;
    margin: 0 1px;
  }
  
  .trace-panel-container .trace-actions-footer :deep(.el-pagination__prev),
  .trace-panel-container .trace-actions-footer :deep(.el-pagination__next) {
    font-size: 12px;
    padding: 2px 8px;
  }
  
  .trace-panel-container .trace-actions-footer :deep(.el-pagination__sizes) {
    font-size: 12px;
  }
  
  /* 调整表格列宽 */
  .trace-panel-container .trace-table-container :deep(.el-table-column) {
    min-width: 50px;
  }
}

/* 针对极小屏幕的额外优化 */
@media (max-width: 480px) {
  .trace-panel-container .trace-actions-footer {
    padding: 6px 8px;
    min-height: 45px;
  }
  
  .trace-panel-container .trace-actions-footer :deep(.el-pagination) {
    font-size: 11px;
  }
  
  /* 简化分页控件布局 */
  .trace-panel-container .trace-actions-footer :deep(.el-pagination) {
    flex-wrap: wrap;
    gap: 4px;
  }
}

/* 针对大屏幕的优化 */
@media (min-width: 1400px) {
  .trace-panel-container .trace-table-container {
    max-height: calc(100vh - 400px);
  }
}

.bottom-panel-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  box-sizing: border-box;
}

.bottom-panel-content p {
  margin: 0;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}

/* 底部面板统计信息 */
.bottom-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin: 15px 0;
  width: 100%;
  box-sizing: border-box;
}

.stat-card {
  background-color: var(--fluent-surface);
  border: 1px solid var(--fluent-border);
  border-radius: 8px;
  padding: 15px;
  transition: var(--fluent-transition);
}

.stat-card:hover {
  background-color: var(--fluent-surface-hover);
  box-shadow: var(--fluent-shadow-hover);
  transform: translateY(-2px);
}

.stat-title {
  font-size: 14px;
  color: var(--fluent-text-tertiary);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--fluent-text-primary);
  margin-bottom: 5px;
}

.stat-desc {
  font-size: 12px;
  color: var(--fluent-text-tertiary);
}

/* 底部面板操作按钮 */
.bottom-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

/* 表格性能优化 */
:deep(.el-table) {
  /* 避免不必要的重绘 */
  will-change: transform;
}

/* 动画性能优化 */
* {
  /* 避免布局抖动 */
  box-sizing: border-box;
}

/* 为特定元素添加过渡效果，避免影响Splitter */
.el-button,
.el-card,
.el-alert,
.el-tag,
.el-badge {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 减少重排的属性 */
.custom-titlebar,
.navigation-sidebar,
.properties-panel {
  /* 固定宽度，避免重排 */
  flex-shrink: 0;
}

/* 内容区域性能优化 */
.content {
  /* 灵活扩展，避免重排 */
  flex: 1;
  /* 减少布局计算 */
  contain: layout style;
}

/* 响应式性能优化 */
@media (max-width: 768px) {
  /* 减少小屏幕上的渲染开销 */
  .app-container {
    /* 简化布局 */
    flex-direction: column;
  }
  
  /* 减少动画效果以提高性能 */
  * {
    transition: all 0.1s ease;
  }
}

/* 自定义滚动条样式 */
.content::-webkit-scrollbar,
.properties-panel::-webkit-scrollbar,
.trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar,
.log-scrollbar::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.content::-webkit-scrollbar-track,
.properties-panel::-webkit-scrollbar-track,
.trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar-track,
.log-scrollbar::-webkit-scrollbar-track {
  background: var(--fluent-surface);
  border-radius: 5px;
}

.content::-webkit-scrollbar-thumb,
.properties-panel::-webkit-scrollbar-thumb,
.trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb,
.log-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--fluent-border);
  border-radius: 5px;
  border: 2px solid var(--fluent-surface);
  background-clip: content-box;
  transition: background-color 0.2s ease;
}

.content::-webkit-scrollbar-thumb:hover,
.properties-panel::-webkit-scrollbar-thumb:hover,
.trace-table-container :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover,
.log-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--fluent-border-hover);
}

/* 统一设置滚动条样式 */
.content,
.properties-panel,
.trace-table-container :deep(.el-table__body-wrapper),
.log-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border) var(--fluent-surface);
}

/* 自定义标题栏 */
.custom-titlebar {
  background-color: var(--fluent-titlebar-bg);
  color: var(--fluent-titlebar-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--fluent-shadow);
  overflow: hidden;
  -webkit-app-region: no-drag;
  user-select: none;
  height: 36px; /* 更紧凑的标题栏高度 */
  padding: 0; /* 实现边缘到边缘效果 */
  border-bottom: 1px solid var(--fluent-primary-pressed);
}

/* 窗口控制按钮 */
.window-controls {
  display: flex;
  align-items: center;
  gap: 0;
  -webkit-app-region: no-drag;
  margin: 0;
  background: transparent;
  padding: 0;
  border-radius: 0;
  order: 3;
}

.window-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--fluent-titlebar-text);
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  -webkit-app-region: no-drag;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 跨平台样式调整 */
@media (max-width: 768px) {
  .window-btn {
    width: 40px;
    height: 40px;
    font-size: 12px;
  }
}

/* macOS 特定样式 */
@media (max-width: 1024px) and (-webkit-max-device-pixel-ratio: 2) {
  .window-controls {
    /* macOS 样式调整 */
  }
}

/* Linux 特定样式 */
@media (min-width: 1025px) and (hover: hover) {
  .window-btn:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

.window-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: none;
  box-shadow: none;
}

.window-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: none;
  box-shadow: none;
}

.minimize-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.maximize-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
  background-color: #e81123;
  transform: none;
  box-shadow: none;
}

.close-btn:active {
  background-color: #c41423;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 14px;
  font-weight: bold;
  /* 确保图标清晰可见 */
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  /* 更清晰的图标符号 */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 700;
}

/* 拖拽区域 */
#drag-region {
  -webkit-app-region: drag;
  flex: 1;
  display: flex;
  justify-content: flex-start; /* 标题左对齐 */
  align-items: center;
  padding: 0 12px; /* 只在左侧添加内边距 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-title {
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
}

/* 应用图标样式 */
.app-icon {
  font-size: 18px; /* 适应紧凑标题栏的图标大小 */
  margin-right: 8px; /* 适当的水平间距 */
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  color: var(--fluent-titlebar-text);
  /* 确保在高DPI设备上清晰显示 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  /* 调整位置，与左侧第一个按钮图标对齐 */
  position: relative;
  top: 0;
}

/* 调整标题栏高度和内边距，确保与左侧按钮对齐 */
.custom-titlebar {
  height: 36px; /* 更紧凑的标题栏高度 */
  padding: 0 0 0 12px; /* 左侧12px内边距，右侧0内边距，确保窗口控制按钮与边缘贴合 */
  display: flex;
  align-items: center;
}

/* 调整主内容区域高度，适配新的标题栏高度 */
.main-content {
  height: calc(100vh - 36px); /* 统一减去标题栏高度 */
}

.title {
  margin: 0;
  font-size: 14px; /* 适应紧凑标题栏的字体大小 */
  font-weight: 600; /* Fluent Design 标准字重 */
  -webkit-app-region: drag;
  letter-spacing: 0.25px;
  color: var(--fluent-titlebar-text);
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 主内容容器 */
.main-content-container {
  flex: 1;
  overflow: hidden;
  background-color: var(--fluent-background);
  margin: 0;
  padding: 0;
}

/* 左侧导航菜单 */
.navigation-sidebar {
  transition: var(--fluent-transition);
  height: 100%;
  overflow: hidden;
  background-color: var(--fluent-surface);
  border-right: 1px solid var(--fluent-border);
}

.navigation-sidebar.collapsed {
  width: 64px !important;
}

/* 主内容容器 */
.main-content-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--fluent-background);
  margin: 0;
  padding: 0;
  position: relative;
}

/* 左侧导航菜单 */
.navigation-sidebar {
  background-color: var(--fluent-surface);
  border-right: 1px solid var(--fluent-border);
  height: 100%;
  overflow: hidden;
  transition: var(--fluent-transition);
  flex-shrink: 0;
}

/* 中间主内容区 */
.content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  background-color: var(--fluent-background);
  display: flex;
  flex-direction: column;
  min-width: 400px;
}

/* 上部标签页区域 */
.content-top {
  margin-bottom: 8px;
  overflow: hidden;
}

/* 垂直Splitter */
.vertical-splitter {
  margin: 4px 0;
}

/* 下部容器 */
.content-bottom {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 右侧属性面板 */
.properties-panel {
  background-color: var(--fluent-surface);
  border-left: 1px solid var(--fluent-border);
  padding: 12px;
  overflow-y: auto;
  transition: var(--fluent-transition);
  flex-shrink: 0;
}

/* Splitter 样式 */
.splitter {
  width: 6px;
  background-color: #d1d5db;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  height: 100%;
  border-radius: 3px;
  /* 性能优化 */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  /* 减少布局计算 */
  contain: layout style;
  /* 增加与背景的对比度 */
  border-left: 1px solid #9ca3af;
  border-right: 1px solid #9ca3af;
}

/* 垂直Splitter */
.vertical-splitter {
  height: 6px;
  width: 100%;
  background-color: #d1d5db;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  border-radius: 3px;
  /* 性能优化 */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  /* 减少布局计算 */
  contain: layout style;
  /* 增加与背景的对比度 */
  border-top: 1px solid #9ca3af;
  border-bottom: 1px solid #9ca3af;
  border-left: none;
  border-right: none;
  margin: 4px 0;
}

.vertical-splitter .splitter-handle {
  width: 60px;
  height: 2px;
  background-color: var(--fluent-text-tertiary);
  border-radius: 1px;
  opacity: 0.6;
}

.splitter:hover {
  background-color: #9ca3af;
  width: 8px;
}

.vertical-splitter:hover {
  background-color: #9ca3af;
  height: 8px;
  width: 100%;
}

.splitter.dragging {
  background-color: #9ca3af;
  width: 8px;
  opacity: 1;
}

.vertical-splitter.dragging {
  background-color: #9ca3af;
  height: 8px;
  width: 100%;
  opacity: 1;
}

.splitter-handle {
  width: 2px;
  height: 60px;
  background-color: var(--fluent-text-tertiary);
  border-radius: 1px;
  opacity: 0.6;
}

.splitter:hover .splitter-handle {
  background-color: var(--fluent-text-secondary);
  height: 80px;
  opacity: 1;
}

.splitter.dragging .splitter-handle {
  background-color: var(--fluent-text-secondary);
  height: 100px;
  opacity: 1;
}

.vertical-splitter:hover .splitter-handle {
  background-color: var(--fluent-text-secondary);
  width: 80px;
  opacity: 1;
}

.vertical-splitter.dragging .splitter-handle {
  background-color: var(--fluent-text-secondary);
  width: 100px;
  opacity: 1;
}

/* 增强 Splitter 的可见性 */
.properties-splitter {
  /* 与左边分割条保持一致的样式 */
}

/* 拖拽时的全局样式 */
body.dragging {
  cursor: col-resize;
  user-select: none;
  pointer-events: none;
}

/* 响应式设计调整 */
@media (max-width: 1200px) {
  .properties-panel {
    width: 250px !important;
  }
}

@media (max-width: 1024px) {
  .navigation-sidebar {
    width: 64px !important;
  }
  
  .properties-panel {
    width: 200px !important;
  }
}

@media (max-width: 768px) {
  .properties-panel {
    display: none;
  }
  
  .splitter.properties-splitter {
    display: none;
  }
  
  .content {
    padding: 8px;
    min-width: 300px;
  }
}

@media (max-width: 480px) {
  .navigation-sidebar {
    width: 48px !important;
  }
  
  .content {
    min-width: 200px;
  }
}

/* 移动端响应式调整 */
@media (max-width: 480px) {
  .custom-titlebar {
    height: 44px;
  }
  
  .window-btn {
    width: 44px;
    height: 44px;
  }
  
  .app-icon {
    font-size: 20px;
  }
  
  .title {
    font-size: 16px;
  }
}

/* 左侧按钮栏（保留旧样式作为备份） */
.button-bar {
  width: 64px;
  background-color: var(--fluent-button-bar-bg);
  border-right: 1px solid var(--fluent-button-bar-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 0;
  box-shadow: var(--fluent-shadow);
  transition: var(--fluent-transition);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: center;
}

/* 按钮样式 */
:deep(.el-button--circle.el-button--large) {
  width: var(--fluent-button-size);
  height: var(--fluent-button-size);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮内部图标对齐 */
:deep(.el-button--circle.el-button--large .el-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  position: relative;
  top: 0;
  left: 0;
}

:deep(.el-button--primary) {
  background-color: var(--fluent-primary);
  border-color: var(--fluent-primary);
}

:deep(.el-button--primary:hover) {
  background-color: var(--fluent-primary-hover);
  border-color: var(--fluent-primary-hover);
}

:deep(.el-button--primary:active) {
  background-color: var(--fluent-primary-pressed);
  border-color: var(--fluent-primary-pressed);
}

/* 激活按钮样式 */
.active-btn {
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3) !important;
}

/* 中间主内容区 */
.content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  background-color: var(--fluent-background);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 标签页容器 */
.tabs-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--fluent-background);
  border-radius: 8px;
  box-shadow: var(--fluent-shadow);
}

/* 配置卡片 */
.config-card {
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: var(--fluent-shadow);
  transition: var(--fluent-transition);
  border: 1px solid var(--fluent-border);
  background-color: white;
}

.config-card:hover {
  box-shadow: var(--fluent-shadow-hover);
  transform: translateY(-1px);
}

/* 状态卡片 */
.status-card {
  border-radius: 8px;
  box-shadow: var(--fluent-shadow);
  border: 1px solid var(--fluent-border);
  background-color: white;
}

/* 操作按钮区 */
.schedule-actions,
.scan-actions,
.trace-actions,
.log-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  background-color: var(--fluent-surface);
  border-radius: 8px;
  border: 1px solid var(--fluent-border);
  margin-top: 16px;
}

/* 表单元素间距 */
:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--fluent-text-secondary);
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header-wrapper) {
  background-color: var(--fluent-surface);
}

:deep(.el-table__row:hover) {
  background-color: var(--fluent-surface-hover);
}

/* 按钮样式统一 */
:deep(.el-button) {
  border-radius: 4px;
}

/* 输入框样式统一 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-input-number) {
  border-radius: 4px;
  transition: var(--fluent-transition);
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover),
:deep(.el-input-number:hover) {
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
}

/* 标签样式优化 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 徽章样式优化 */
:deep(.el-badge) {
  font-weight: 500;
}

/* 进度条样式优化 */
:deep(.el-progress__bar) {
  border-radius: 4px;
}

/* 单选按钮和复选框样式 */
:deep(.el-radio__input.is-checked .el-radio__inner),
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--fluent-primary);
  border-color: var(--fluent-primary);
}

/* 开关样式优化 */
:deep(.el-switch__core) {
  border-radius: 10px;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--fluent-primary);
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background-color: var(--fluent-surface);
  border-bottom: 1px solid var(--fluent-border);
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: var(--fluent-text-primary);
}

:deep(.el-dialog__footer) {
  background-color: var(--fluent-surface);
  border-top: 1px solid var(--fluent-border);
  padding: 16px;
}

/* 主标签页 */
.main-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  border-radius: 0;
  overflow: hidden;
}

/* 标签页内容 */
:deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  padding: 0;
  background-color: transparent;
  display: block;
  gap: 0;
}

/* 标签页头部 */
:deep(.el-tabs__header) {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color);
  background-color: transparent;
  padding: 0;
  box-shadow: none;
}

/* 标签页导航 */
:deep(.el-tabs__nav) {
  margin: 0 4px;
  padding: 0;
}

/* 标签页项 */
:deep(.el-tabs__item) {
  padding: 0 20px;
  margin-right: 4px;
  border-radius: 0;
  font-size: 14px;
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  color: var(--el-text-color-primary);
  border: none;
}

/* 标签页项悬停 */
:deep(.el-tabs__item:hover) {
  color: var(--el-color-primary);
  background-color: transparent;
  transform: none;
  box-shadow: none;
  border: none;
}

/* 激活的标签页项 */
:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  background-color: transparent;
  font-weight: 500;
  box-shadow: none;
  transform: none;
  border: none;
  border-radius: 0;
}

/* 激活标签页的下划线 */
:deep(.el-tabs__active-bar) {
  background-color: var(--el-color-primary);
  height: 2px;
  border-radius: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: block;
}

/* 标签页内容 */
.tab-pane {
  background-color: var(--fluent-background);
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  border: none;
  height: 100%;
}

/* 标题样式已移至ContentContainer组件中 */

/* 配置卡片 */
.config-card {
  border-radius: 4px;
  margin-bottom: 12px;
  box-shadow: var(--fluent-shadow-hover); /* 增强阴影效果 */
  transition: var(--fluent-transition);
  border: 1px solid var(--fluent-border);
  background-color: white;
}

.config-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); /* 增强悬停阴影 */
  transform: translateY(-1px); /* 轻微上浮效果 */
}

/* 数据追踪模块样式 */
.trace-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.trace-control-panel {
  background-color: var(--fluent-surface);
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px var(--fluent-border);
}

.trace-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trace-table-container {
  margin-bottom: 12px;
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--fluent-shadow-hover); /* 增强阴影效果 */
  border: 1px solid var(--fluent-border);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trace-table-container :deep(.el-table) {
  flex: 1;
  height: auto;
}

.trace-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 日志样式 */
.log-container {
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--fluent-shadow-hover); /* 增强阴影效果 */
  margin-bottom: 12px;
  border: 1px solid var(--fluent-border);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.log-scrollbar {
  flex: 1;
  height: auto;
}

.log-content {
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.log-item {
  margin-bottom: 6px;
  display: flex;
  padding: 3px 0;
  border-bottom: 1px solid var(--fluent-border);
}

.log-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.log-item .timestamp {
  color: var(--fluent-text-tertiary);
  margin-right: 12px;
  min-width: 110px;
  font-family: monospace;
  font-size: 12px;
}

.log-item.info .message {
  color: var(--fluent-primary);
}

.log-item.success .message {
  color: var(--fluent-success);
}

.log-item.warning .message {
  color: var(--fluent-warning);
}

.log-item.error .message {
  color: var(--fluent-error);
}

.log-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px;
  background-color: var(--fluent-surface);
  border-top: 1px solid var(--fluent-border);
}

/* 右侧属性面板 */
.properties-panel {
  width: 280px;
  background-color: var(--fluent-surface);
  border-left: 1px solid var(--fluent-border);
  border-radius: 8px 0 0 8px;
  overflow-y: auto;
  transition: var(--fluent-transition);
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border) transparent;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

.panel-content {
  padding: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fluent-text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--fluent-primary);
}

.property-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--fluent-text-tertiary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--fluent-border);
}

.property-item:last-child {
  border-bottom: none;
}

.property-label {
  color: var(--fluent-text-tertiary);
}

.property-value {
  color: var(--fluent-text-primary);
  font-weight: 500;
  text-align: right;
  min-width: 80px;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-actions .el-button {
  border-radius: 4px;
}

/* 列表收发样式 */
.schedule-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.schedule-table-container {
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--fluent-shadow-hover);
  border: 1px solid var(--fluent-border);
  margin-bottom: 16px;
}

.schedule-status {
  background-color: var(--fluent-surface);
  padding: 12px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px var(--fluent-border);
  display: flex;
  gap: 24px;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-detail {
  font-size: 14px;
  font-weight: 500;
  color: var(--fluent-text-primary);
}

.data-input-mode {
  margin-bottom: 20px;
}

.byte-inputs-header {
  display: grid;
  grid-template-columns: 60px 100px 80px 1fr 120px 100px;
  align-items: center;
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #ecf5ff;
  width: 100%;
  min-height: 28px;
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 5px;
  gap: 0;
}

.byte-inputs-controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
  margin-top: 5px;
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
  width: 100%;
  min-height: 28px;
}

.header-item {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.byte-label {
  width: 60px;
  text-align: left;
}

.nibble-inputs {
  display: flex;
  align-items: center;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  border-color: #dcdfe6;
}

:deep(.el-input-number__decrease:hover),
:deep(.el-input-number__increase:hover) {
  border-color: #409EFF;
  color: #409EFF;
}

:deep(.el-input__inner) {
  font-size: 14px;
  font-family: monospace;
  text-align: center;
}

.nibble-inputs .el-input-number {
  width: 80px;
}

.nibble-separator {
  font-size: 16px;
  font-weight: bold;
  color: #909399;
  margin: 0 8px;
}

.byte-value {
  width: 60px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  color: #409EFF;
  font-family: monospace;
  letter-spacing: 1px;
}

.binary-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: flex-start;
}

.binary-label {
  width: 40px;
}

.bit-buttons {
  display: flex;
  gap: 2px;
}

.bit-buttons .el-button {
  width: 20px;
  height: 20px;
  font-size: 10px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.binary-display {
  width: 90px;
  text-align: center;
}

.byte-inputs-table {
  margin-top: 8px;
  margin-bottom: 8px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}

.byte-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.byte-table th {
  padding: 4px 12px;
  text-align: center;
  background-color: #ecf5ff;
  border-bottom: 1px solid #dcdfe6;
  font-weight: bold;
  font-size: 12px;
  min-height: 28px;
  display: table-cell;
  vertical-align: middle;
}

.byte-table td {
  padding: 4px 12px;
  text-align: center;
  border-bottom: 1px solid #dcdfe6;
  min-height: 28px;
  display: table-cell;
  vertical-align: middle;
  background-color: #f5f7fa;
}

.byte-table tr:last-child td {
  border-bottom: none;
}

.byte-table tr:hover td {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.byte-table tr.disabled td {
  opacity: 0.6;
  background-color: #f0f0f0;
}

.byte-label-col {
  width: 60px;
  text-align: left;
}

.high-nibble-col {
  width: 100px;
}

.low-nibble-col {
  width: 80px;
}

.hex-col {
  width: 120px;
}

.binary-bits-col {
  width: 240px;
  min-width: 240px;
}

.binary-value-col {
  width: 100px;
}

.settings-col {
  width: 80px;
}

.byte-label {
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}

.nibble-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
}

.binary-bits {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  text-align: center;
}

.bit-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

.binary-display {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
  text-align: center;
  padding: 0 8px;
  font-family: monospace;
}

.byte-label {
  font-size: 14px;
  font-weight: 500;
  min-width: 60px;
}

.nibble-inputs {
  display: flex;
  align-items: center;
  gap: 5px;
}

.nibble-separator {
  font-size: 16px;
  font-weight: bold;
  color: #909399;
}

.byte-value {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  min-width: 40px;
  text-align: center;
  text-transform: uppercase;
}

.binary-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: space-between;
}

.binary-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  min-width: 60px;
  text-align: right;
}

.bit-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

.bit-buttons .el-button {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.bit-buttons .el-button--primary {
  background-color: #409EFF;
  border-color: #409EFF;
  color: white;
}

.bit-buttons .el-button--primary:hover {
  background-color: #66B1FF;
  border-color: #66B1FF;
}

.binary-display {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
  width: 100%;
  text-align: center;
  padding: 0 8px;
  font-family: monospace;
}

.random-data-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.random-data-value {
  font-family: monospace;
  background-color: var(--fluent-surface);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--fluent-border);
  min-width: 200px;
  font-size: 14px;
}

/* 间距工具类 */
.ml-2 {
  margin-left: 8px;
}

.ml-3 {
  margin-left: 12px;
}

/* 扫描按钮容器样式 */
.scan-buttons-container {
  min-width: 350px;
  white-space: nowrap;
}

.mr-2 {
  margin-right: 8px;
}

.mr-4 {
  margin-right: 16px;
}

/* 进度条容器样式 */
.progress-container {
  flex: 1;
  min-width: 150px;
}

/* ID范围输入框样式 */
.id-range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.id-range-input {
  width: 80px !important;
}

.id-range-inputs .text-lg {
  margin: 0 4px;
}

/* 文本样式 */
.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: var(--text-light);
}

/* Element Plus 组件样式覆盖 */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-select),
:deep(.el-input),
:deep(.el-input-number) {
  width: 100%;
  transition: var(--fluent-transition);
  /* 移除默认边框，使用Element Plus内置样式 */
  border: none;
  box-shadow: none;
}

:deep(.el-select:hover),
:deep(.el-input:hover),
:deep(.el-input-number:hover) {
  /* 使用Element Plus内置的悬停样式 */
  border-color: var(--fluent-primary);
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
}

:deep(.el-input__inner) {
  /* 提高输入框文本清晰度 */
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  -webkit-font-smoothing: antialiased;
}

:deep(.el-button) {
  border-radius: 4px;
  transition: var(--fluent-transition);
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

/* 增强主按钮样式 */
:deep(.el-button--primary) {
  background-color: #409EFF;
  border-color: #409EFF;
  color: white;
}

/* 增强危险按钮样式 */
:deep(.el-button--danger) {
  background-color: #F56C6C;
  border-color: #F56C6C;
  color: white;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
  color: white;
}

:deep(.el-button--danger:hover) {
  background-color: #f78989;
  border-color: #f78989;
  color: white;
}

:deep(.el-card) {
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: var(--transition);
  background-color: white;
  box-shadow: var(--shadow);
}

:deep(.el-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow);
  background-color: white;
}

:deep(.el-table__header-wrapper) {
  background-color: #fafafa;
}

:deep(.el-table__header-cell) {
  font-weight: 600;
  color: #2c3e50;
  background-color: #fafafa;
  border-bottom: 2px solid var(--primary-color);
  font-size: 14px;
}

:deep(.el-table__row) {
  transition: var(--transition);
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

:deep(.el-table__cell) {
  /* 提高表格单元格文本清晰度 */
  font-size: 13px;
  font-weight: 500;
  color: #2c3e50;
  -webkit-font-smoothing: antialiased;
}

/* 提高下拉菜单清晰度 */
:deep(.el-select-dropdown) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

/* 提高标签清晰度 */
:deep(.el-tag) {
  font-weight: 500;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 提高开关清晰度 */
:deep(.el-switch) {
  font-size: 14px;
}

/* 提高徽章清晰度 */
:deep(.el-badge__content) {
  font-weight: 600;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .properties-panel {
    display: none;
  }
  
  .button-bar {
    width: 56px;
  }
  
  :deep(.el-button--circle.el-button--large) {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 992px) {
  .button-bar {
    position: fixed;
    left: -64px;
    top: 48px;
    bottom: 0;
    z-index: 1000;
    transition: var(--fluent-transition);
  }
  
  .button-bar.open {
    left: 0;
  }
  
  .content {
    padding: 16px;
  }
  
  .tab-pane {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 12px;
  }
  
  .tab-title {
    font-size: 18px;
  }
  
  .custom-titlebar {
    padding: 0 12px;
  }
  
  .title {
    font-size: 14px;
  }
  
  .window-controls {
    margin-right: 8px;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 8px;
  }
  
  .tab-pane {
    padding: 12px;
  }
  
  .tab-title {
    font-size: 16px;
  }
  
  .custom-titlebar {
    height: 44px;
  }
  
  .window-btn {
    width: 40px;
    height: 40px;
  }
  
  .title {
    font-size: 12px;
  }
}

/* 清除默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 硬件连接通知样式 */
.hardware-moved-notice {
  padding: 20px;
}

.notice-content {
  line-height: 1.6;
}

.notice-content p {
  margin: 0 0 8px 0;
}

.notice-content strong {
  color: var(--fluent-primary);
}

.notice-content .mt-2 {
  margin-top: 8px;
}

.notice-content .mt-3 {
  margin-top: 12px;
}

/* 设备列表折叠面板样式 */
.device-table-card {
  margin-bottom: 20px;
}

.device-info {
  padding: 10px 0;
}

.param-note {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.device-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 16px;
}

/* 深色主题样式 */
.dark-theme {
  --fluent-background: #1e1e1e;
  --fluent-surface: #252526;
  --fluent-text-primary: #f3f2f1;
  --fluent-text-secondary: #e5e5e5;
  --fluent-text-tertiary: #9ca3af;
  --fluent-border: #3e3e42;
  --fluent-border-hover: #4e4e52;
}

/* 设备按钮容器 */
.device-buttons-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: visible;
}

/* 设备按钮 */
.device-button {
  margin: 0 !important;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 可调整大小的抽屉 */
.resizable-drawer {
  position: relative;
}

.drawer-resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background-color: transparent;
  cursor: ew-resize;
  z-index: 1000;
}

.drawer-resize-handle:hover {
  background-color: var(--fluent-primary);
  opacity: 0.3;
}

.drawer-resize-handle.resizing {
  background-color: var(--fluent-primary);
  opacity: 0.5;
}

/* 自动重连开关样式 */
:deep(.el-switch__core) {
  border-color: #dcdfe6 !important;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
}

:deep(.el-switch__core::after) {
  background-color: #fff !important;
}

:deep(.el-switch.is-checked .el-switch__core::after) {
  background-color: #fff !important;
}
</style>
