<template>
  <div class="main-content-container" @mousedown.stop>
    <!-- 主内容区 -->
    <div class="content" style="height: 100%; display: flex; flex-direction: column;">
      <!-- 上下垂直容器 -->
      <div class="content-vertical-container" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
        <!-- 上部标签页区域 -->
        <div class="content-top" :style="{ height: `${contentHeight}px` }" style="flex-shrink: 0;">
          <!-- 标签页 -->
          <div class="tabs-container overflow-auto">
            <el-tabs v-model="localActiveTab" type="card" @tab-remove="$emit('tabRemove', localActiveTab)" @tab-click="handleTabClick" class="main-tabs">
              <el-tab-pane
                v-for="tab in openedTabs"
                :key="tab.key"
                :label="tab.label"
                :name="tab.key"
                :closable="!tab.isFixed"
              >
                <!-- 串口配置 -->
                <div v-if="tab.key === 'serialConfig'" class="tab-pane">
                </div>
                
                <!-- 主机收发 -->
                <div v-else-if="tab.key === 'dataSend'" class="tab-pane">
                  <ContentContainer>
                    <el-card shadow="hover" class="config-card">
                      <el-form :model="localSendConfig" label-width="100px" size="large">
                        <!-- 设备选择、波特率、ID、长度、校验类型 -->
                        <el-row :gutter="20">
                          <el-col :span="10">
                            <el-form-item label="设备">
                              <el-select v-model="localSelectedDeviceForSend" placeholder="选择要使用的设备" size="small">
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
                              <el-select v-model="localSendConfig.baudRate" placeholder="选择波特率" size="small">
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
                              <el-input v-model="localSendConfig.id" placeholder="例如: 00" size="small"></el-input>
                            </el-form-item>
                          </el-col>
                          <el-col :span="3">
                            <el-form-item label="长度">
                              <el-input-number v-model="localSendConfig.length" :min="1" :max="8" size="small" controls-position="right"></el-input-number>
                            </el-form-item>
                          </el-col>
                          <el-col :span="4">
                            <el-form-item label="校验类型">
                              <el-select v-model="localSendConfig.checkType" placeholder="选择校验类型" size="small">
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
                                <tr v-for="(byte, index) in localSendConfig.bytes" :key="index" class="byte-row" :class="{ 'disabled': index >= localSendConfig.length }">
                                  <td class="byte-label">{{ index + 1 }}</td>
                                  <td class="nibble-inputs">
                                    <el-input-number 
                                      v-model="byte.high" 
                                      :min="0" 
                                      :max="15" 
                                      size="small" 
                                      :disabled="index >= localSendConfig.length"
                                      @change="$emit('updateByteData', index)"
                                      controls-position="right"
                                      @wheel.native="$emit('handleWheel', $event, index, 'high')"
                                    ></el-input-number>
                                  </td>
                                  <td class="nibble-inputs">
                                    <el-input-number 
                                      v-model="byte.low" 
                                      :min="0" 
                                      :max="15" 
                                      size="small" 
                                      :disabled="index >= localSendConfig.length"
                                      @change="$emit('updateByteData', index)"
                                      controls-position="right"
                                      @wheel.native="$emit('handleWheel', $event, index, 'low')"
                                    ></el-input-number>
                                  </td>
                                  <td class="binary-bits">
                                    <div class="bit-buttons">
                                      <el-button 
                                        v-for="bit in 8" 
                                        :key="bit" 
                                        size="mini" 
                                        :type="getBitValue(index, 8 - bit) ? 'primary' : 'default'"
                                        :disabled="index >= localSendConfig.length"
                                        @click="$emit('toggleBit', index, 8 - bit)"
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
                                      @click="$emit('openDataGeneratorDrawer', index)"
                                      :disabled="index >= localSendConfig.length"
                                    >
                                      设置
                                    </el-button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div class="byte-inputs-controls">
                            <el-button type="warning" size="small" @click="$emit('generateRandomId')">随机ID</el-button>
                            <el-button type="warning" size="small" @click="$emit('generateRandomLength')" class="ml-2">随机长度</el-button>
                            <el-button type="warning" size="small" @click="$emit('generateRandomBytes')" class="ml-2">随机数据</el-button>
                            <el-button type="danger" size="small" @click="$emit('clearAllBytes')" class="ml-2">清零</el-button>
                          </div>
                        </el-form-item>
                        <el-row :gutter="10">
                          <el-col :span="6">
                            <el-form-item label="循环发送">
                              <el-switch v-model="localSendConfig.loopSend" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                            </el-form-item>
                          </el-col>
                          <el-col :span="6">
                            <el-form-item label="发送间隔">
                              <el-input v-model="localSendConfig.loopInterval" type="number" size="small" style="width: 100px;"></el-input>
                              <span class="text-xs text-gray-500 ml-1">毫秒</span>
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item label="随机发送">
                              <el-switch v-model="localSendConfig.randomOnLoop" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="10">
                          <el-col :span="8">
                            <el-form-item label="随机ID">
                              <el-switch v-model="localSendConfig.randomId" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                            </el-form-item>
                          </el-col>
                          <el-col :span="8">
                            <el-form-item label="随机长度">
                              <el-switch v-model="localSendConfig.randomLength" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                            </el-form-item>
                          </el-col>
                          <el-col :span="8">
                            <el-form-item label="随机数据">
                              <el-switch v-model="localSendConfig.randomData" active-text="开启" inactive-text="关闭" size="small"></el-switch>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="10">
                          <el-col :span="24" style="display: flex; justify-content: flex-end; align-items: center;">
                            <el-button :type="isSending ? 'danger' : (selectedDeviceForSendObj?.status.serialConnected ? 'success' : 'info')" @click="$emit('handleSend')" :disabled="!selectedDeviceForSendObj?.status.serialConnected" size="small" style="margin-right: 8px;">
                              {{ isSending ? '停止发送' : '发送数据' }}
                            </el-button>
                            <el-button :type="selectedDeviceForSendObj?.status.serialConnected ? 'success' : 'info'" @click="$emit('readSlaveData')" :disabled="!selectedDeviceForSendObj?.status.serialConnected" size="small">读取从机</el-button>
                          </el-col>
                        </el-row>
                      </el-form>
                    </el-card>
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
                      <el-button type="info" size="small" @click="$emit('clearLogs')">清空</el-button>
                    </div>
                  </ContentContainer>
                </div>
                
                <!-- 设备列表 -->
                <div v-else-if="tab.key === 'deviceList'" class="tab-pane">
                  <ContentContainer>
                    <div class="device-list-container" style="height: 100%; display: flex; flex-direction: column;">
                      <!-- 设备操作按钮和搜索 -->
                      <div class="device-actions mb-4" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <el-button type="primary" @click="$emit('showAddDeviceDialog')">
                            <el-icon><Plus /></el-icon> 添加设备
                          </el-button>
                          <el-button type="info" @click="$emit('refreshPorts')">
                            <el-icon><Refresh /></el-icon> 刷新串口
                          </el-button>
                        </div>
                        <el-input
                          :model-value="deviceSearchQuery"
                          placeholder="搜索设备名称或类型"
                          clearable
                          style="width: 300px"
                          @input="$emit('handleDeviceSearch', $event)"
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
                                    @change="$emit('updateDeviceAutoReconnect', scope.row.id, scope.row.status.autoReconnect)"
                                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                                  ></el-switch>
                                </template>
                              </el-table-column>
                              <el-table-column label="操作" width="280" fixed="right">
                                <template #default="scope">
                                  <div class="device-buttons-container">
                                    <el-tooltip content="发送测试" placement="top">
                                      <el-button type="info" size="small" @click="$emit('openTestDrawer', scope.row.id, scope.row)" class="device-button">
                                        <el-icon><DataAnalysis /></el-icon>
                                      </el-button>
                                    </el-tooltip>
                                    <el-tooltip content="编辑" placement="top">
                                      <el-button type="primary" size="small" @click="$emit('showEditDeviceDialog', scope.row.id)" class="device-button">
                                        <el-icon><EditPen /></el-icon>
                                      </el-button>
                                    </el-tooltip>
                                    <el-tooltip content="删除" placement="top">
                                      <el-button type="danger" size="small" @click="$emit('deleteDevice', scope.row.id)" class="device-button">
                                        <el-icon><Delete /></el-icon>
                                      </el-button>
                                    </el-tooltip>
                                    <el-tooltip :content="scope.row.status.serialConnected ? '断开' : '连接'" placement="top">
                                      <el-button 
                                        :type="scope.row.status.serialConnected ? 'warning' : 'success'" 
                                        size="small" 
                                        @click="$emit('toggleDeviceConnection', scope.row.id)"
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
                            v-model:current-page="localCurrentPage"
                            v-model:page-size="localPageSize"
                            :page-sizes="[10, 20, 50, 100]"
                            layout="total, sizes, prev, pager, next, jumper"
                            :total="filteredDevices.length"
                            @size-change="$emit('handleSizeChange', $event)"
                            @current-change="$emit('handleCurrentChange', $event)"
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
                    <el-form :model="localScanConfig" label-width="100px" size="large">
                        <el-row :gutter="20">
                          <el-col :span="8">
                            <el-form-item label="设备">
                              <el-select v-model="localSelectedDeviceForScan" placeholder="选择要使用的设备" size="large">
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
                                v-model="localScanConfig.baudRates" 
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
                              @click="isScanning ? $emit('stopScan') : $emit('startScan')"
                              :disabled="!isScanning && (!localSelectedDeviceForScan || !localSelectedDeviceForScanObj?.status.serialConnected || localScanConfig.baudRates.length === 0)"
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
                      <el-button type="info" size="small" @click="$emit('clearScanResults')">
                        <el-icon><Delete /></el-icon> 清空结果
                      </el-button>
                      <el-button type="primary" size="small" @click="$emit('exportScanResults')" :disabled="scanResults.length === 0" class="ml-3">
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
                              <el-select v-model="localSelectedDeviceForSend" placeholder="选择设备" size="small" style="width: 160px;">
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
                              <el-select v-model="localSendConfig.baudRate" placeholder="选择波特率" size="small" style="width: 100px;">
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
                              <el-select v-model="localSendConfig.checkType" placeholder="选择校验类型" size="small" style="width: 90px;">
                                <el-option label="V1" :value="'V1'"></el-option>
                                <el-option label="V2" :value="'V2'"></el-option>
                              </el-select>
                            </div>
                            
                            <!-- 开始/结束按钮 -->
                            <el-button 
                              :type="isScheduleSending ? 'danger' : 'success'" 
                              size="small" 
                              @click="$emit('toggleScheduleSend')"
                              :disabled="scheduleFrames.length === 0 || !localSelectedDeviceForSend"
                              style="flex-shrink: 0;"
                            >
                              <el-icon>
                                <Close v-if="isScheduleSending" />
                                <Check v-else />
                              </el-icon>
                              {{ isScheduleSending ? '结束' : '开始' }}
                            </el-button>
                          </div>
                          
                          <!-- 操作按钮 -->
                          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                            <el-button type="success" size="small" @click="$emit('showBatchAddDialog')">
                              <el-icon><Plus /></el-icon> 批量添加
                            </el-button>
                            <el-button type="primary" size="small" @click="$emit('showAddFrameDialog')">
                              <el-icon><Plus /></el-icon> 添加帧
                            </el-button>
                            <el-button type="warning" size="small" @click="$emit('clearScheduleFrames')" :disabled="scheduleFrames.length === 0">
                              <el-icon><Delete /></el-icon> 清空列表
                            </el-button>
                            <el-button type="info" size="small" @click="$emit('showBatchOperationDialog')">
                              <el-icon><Operation /></el-icon> 批量修改
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
                      
                      <!-- 列表区 -->
                      <div class="schedule-table-container" style="width: 100%; overflow: auto;">
                        <el-table 
                          :data="scheduleFrames" 
                          style="width: 100%" 
                          size="medium" 
                          height="500px"
                          fit
                          border
                          @select="$emit('handleSelectionChange', $event)"
                          @select-all="$emit('handleSelectAll', $event)"
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
                              <el-input-number v-model="scope.row.length" :min="1" :max="8" size="small" controls-position="right" style="width: 100%" @change="$emit('handleLengthChange', scope.row, scope.$index)"></el-input-number>
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
                                    @click="$emit('randomizeFrame', scope.$index)"
                                    style="flex-shrink: 0;"
                                  >
                                    <el-icon><Refresh /></el-icon>
                                  </el-button>
                                </el-tooltip>
                                <el-tooltip content="编辑帧" placement="top">
                                  <el-button 
                                    type="primary" 
                                    size="small" 
                                    @click="$emit('showEditFrameDialog', scope.row, scope.$index)"
                                    style="flex-shrink: 0;"
                                  >
                                    <el-icon><EditPen /></el-icon>
                                  </el-button>
                                </el-tooltip>
                                <el-tooltip content="删除帧" placement="top">
                                  <el-button 
                                    type="danger" 
                                    size="small" 
                                    @click="$emit('deleteScheduleFrame', scope.$index)"
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
                    v-model="localBatchAddDialogVisible"
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
                          <el-button type="primary" size="small" @click="$emit('batchAddFrames')">确定</el-button>
                        </span>
                      </template>
                    </el-dialog>
                    
                    <!-- 批量修改对话框 -->
                  <el-dialog
                    v-model="localBatchOperationDialogVisible"
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
                      </el-form>
                      <template #footer>
                        <span class="dialog-footer">
                          <el-button size="small" @click="batchOperationDialogVisible = false">取消</el-button>
                          <el-button type="primary" size="small" @click="batchOperationDialogVisible = false">确定</el-button>
                        </span>
                      </template>
                    </el-dialog>
                  </ContentContainer>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Plus, Refresh, Search, DataAnalysis, EditPen, Delete, Check, Close, Operation, Upload } from '@element-plus/icons-vue';
import ContentContainer from './ContentContainer.vue';

const props = defineProps<{
  activeTab: string;
  openedTabs: Array<{ key: string; label: string; isFixed: boolean }>;
  contentHeight: number;
  deviceManager: any;
  logs: any[];
  filteredDevices: any[];
  currentPage: number;
  pageSize: number;
  deviceSearchQuery: string;
  scanConfig: any;
  isScanning: boolean;
  scanResults: any[];
  currentBaudRate: number | null;
  currentLinId: string | null;
  scanProgress: string;
  selectedDeviceForScan: string;
  selectedDeviceForSend: string;
  sendConfig: any;
  isSending: boolean;
  selectedDeviceForSendObj: any;
  scheduleFrames: any[];
  isScheduleSending: boolean;
  currentScheduleFrame: string | null;
  batchAddConfig: any;
  batchOperationConfig: any;
}>();

// 本地响应式变量
const localBatchAddDialogVisible = ref(false);
const localBatchOperationDialogVisible = ref(false);

const emit = defineEmits<{
  (e: 'tabChange', tab: string): void;
  (e: 'tabRemove', tab: string): void;
  (e: 'addTab', key: string, label: string, isFixed: boolean): void;
  (e: 'clearLogs'): void;
  (e: 'showAddDeviceDialog'): void;
  (e: 'refreshPorts'): void;
  (e: 'handleDeviceSearch', query: string): void;
  (e: 'updateDeviceAutoReconnect', deviceId: string, autoReconnect: boolean): void;
  (e: 'openTestDrawer', deviceId: string, device: any): void;
  (e: 'showEditDeviceDialog', deviceId: string): void;
  (e: 'deleteDevice', deviceId: string): void;
  (e: 'toggleDeviceConnection', deviceId: string): void;
  (e: 'handleSizeChange', size: number): void;
  (e: 'handleCurrentChange', page: number): void;
  (e: 'startScan'): void;
  (e: 'stopScan'): void;
  (e: 'clearScanResults'): void;
  (e: 'exportScanResults'): void;
  (e: 'generateRandomId'): void;
  (e: 'generateRandomLength'): void;
  (e: 'generateRandomBytes'): void;
  (e: 'clearAllBytes'): void;
  (e: 'openDataGeneratorDrawer', index: number): void;
  (e: 'updateByteData', index: number): void;
  (e: 'toggleBit', byteIndex: number, bitIndex: number): void;
  (e: 'handleWheel', event: WheelEvent, index: number, type: string): void;
  (e: 'handleSend'): void;
  (e: 'readSlaveData'): void;
  (e: 'toggleScheduleSend'): void;
  (e: 'showBatchAddDialog'): void;
  (e: 'showAddFrameDialog'): void;
  (e: 'clearScheduleFrames'): void;
  (e: 'showBatchOperationDialog'): void;
  (e: 'randomizeFrame', index: number): void;
  (e: 'showEditFrameDialog', frame: any, index: number): void;
  (e: 'deleteScheduleFrame', index: number): void;
  (e: 'batchAddFrames'): void;
  (e: 'handleLengthChange', row: any, index: number): void;
  (e: 'handleSelectionChange', selection: any[]): void;
  (e: 'handleSelectAll', selection: any[]): void;
}>();

// 本地状态
const localActiveTab = ref(props.activeTab);
const localCurrentPage = ref(props.currentPage);
const localPageSize = ref(props.pageSize);
const localSelectedDeviceForScan = ref(props.selectedDeviceForScan);
const localSelectedDeviceForSend = ref(props.selectedDeviceForSend);
const localSendConfig = ref({ ...props.sendConfig });
const localScanConfig = ref({ ...props.scanConfig });
const hexIdStart = ref('00');
const hexIdEnd = ref('3F');

// 监听props变化
watch(() => props.activeTab, (newVal) => {
  localActiveTab.value = newVal;
});

watch(() => props.currentPage, (newVal) => {
  localCurrentPage.value = newVal;
});

watch(() => props.pageSize, (newVal) => {
  localPageSize.value = newVal;
});

watch(() => props.selectedDeviceForScan, (newVal) => {
  localSelectedDeviceForScan.value = newVal;
});

watch(() => props.selectedDeviceForSend, (newVal) => {
  localSelectedDeviceForSend.value = newVal;
});

watch(() => props.sendConfig, (newVal) => {
  localSendConfig.value = { ...newVal };
}, { deep: true });

watch(() => props.scanConfig, (newVal) => {
  localScanConfig.value = { ...newVal };
}, { deep: true });

// 计算属性
const localSelectedDeviceForScanObj = computed(() => {
  return props.deviceManager.devices.find((device: any) => device.id === localSelectedDeviceForScan.value);
});

// 方法
const handleTabClick = (tab: any) => {
  emit('tabChange', tab.props.name);
};

const getBitValue = (byteIndex: number, bitIndex: number) => {
  const byte = localSendConfig.value.bytes[byteIndex];
  if (!byte) return false;
  const value = (byte.high << 4) | byte.low;
  return (value & (1 << bitIndex)) !== 0;
};

const getBinaryValue = (byteIndex: number) => {
  const byte = localSendConfig.value.bytes[byteIndex];
  if (!byte) return '00000000';
  const value = (byte.high << 4) | byte.low;
  return value.toString(2).padStart(8, '0');
};
</script>

<style scoped>
.main-content-container {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  background-color: var(--el-bg-color);
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-vertical-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.content-top {
  flex-shrink: 0;
  overflow: hidden;
}

.tabs-container {
  overflow: auto;
}

.main-tabs {
  width: 100%;
}

.tab-pane {
  padding: 20px;
  height: calc(100% - 40px);
  overflow: auto;
}

.tab-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.log-container {
  margin-bottom: 20px;
}

.log-scrollbar {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.log-content {
  padding: 10px;
}

.log-item {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.log-item.info {
  background-color: #f0f9eb;
  border-left: 4px solid #67c23a;
}

.log-item.warning {
  background-color: #fdf6ec;
  border-left: 4px solid #e6a23c;
}

.log-item.error {
  background-color: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.timestamp {
  font-weight: bold;
  margin-right: 10px;
  color: #666;
}

.message {
  color: #333;
}

.log-actions {
  display: flex;
  justify-content: flex-end;
}

.device-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.device-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.device-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.device-buttons-container {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.device-button {
  flex-shrink: 0;
}

.config-card {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.scan-status {
  margin-bottom: 20px;
}

.status-card {
  padding: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.status-label {
  font-weight: bold;
  margin-right: 10px;
  color: #666;
}

.status-value {
  color: #333;
}

.progress-container {
  flex: 1;
  margin-left: 10px;
}

.scan-results-container {
  margin-bottom: 20px;
}

.scan-actions {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
}

.byte-inputs-table {
  margin-bottom: 20px;
}

.byte-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--el-border-color);
}

.byte-table th,
.byte-table td {
  border: 1px solid var(--el-border-color);
  padding: 8px;
  text-align: center;
}

.byte-table th {
  background-color: var(--el-fill-color-light);
  font-weight: bold;
}

.byte-row.disabled {
  opacity: 0.5;
}

.nibble-inputs {
  display: flex;
  justify-content: center;
}

.bit-buttons {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.byte-inputs-controls {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.schedule-actions-card {
  margin-bottom: 20px;
}

.schedule-actions {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.schedule-table-container {
  width: 100%;
  overflow: auto;
}

.status-info {
  flex-shrink: 0;
  white-space: nowrap;
}

.current-frame {
  margin-left: 10px;
  font-weight: bold;
  color: #0078d4;
}

.id-range-input {
  width: 80px;
}

.scan-buttons-container {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}
</style>