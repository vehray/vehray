# LIN通信盒上位机软件

一个基于Electron和Vue 3开发的LIN通信盒上位机软件，用于与LIN通信盒进行交互，实现LIN总线通信功能。

## 项目概述

该软件采用Electron + Vue 3 + TypeScript技术栈开发，支持跨平台运行（Windows、macOS、Linux）。主要功能包括串口管理、LIN协议处理、LIN控制器管理等，提供了直观的图形界面，方便用户进行LIN总线通信测试和调试。

## 功能特性

### 1. 串口管理
- 自动扫描和显示可用串口列表
- 支持串口的打开、关闭操作
- 实时显示串口连接状态

### 2. LIN协议支持
- 支持LIN协议的命令构建和帧解析
- 支持LIN主机模式、从机模式和监听模式
- 支持LIN波特率设置（2400、4800、9600、19200）
- 支持LIN数据发送和接收
- 支持LIN校验和类型（V1、V2）

### 3. 数据发送与接收
- 支持手动发送LIN数据帧
- 支持读取LIN从机数据
- 实时显示接收的LIN数据帧
- 显示原始数据和解析后的数据

### 4. 状态显示与日志
- 实时显示串口连接状态
- 实时显示LIN运行模式和波特率
- 详细的操作日志记录
- 支持日志清空功能

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 40.0.0 | 跨平台桌面应用框架 |
| Vue | 3.5.27 | 前端UI框架 |
| TypeScript | 5.9.3 | 类型安全的JavaScript超集 |
| Element Plus | 2.13.1 | Vue 3 UI组件库 |
| SerialPort | 13.0.0 | 串口通信库 |
| Vite | 7.3.1 | 构建工具 |
| Vitest | 4.0.18 | 单元测试框架 |

## 项目结构

```
├── src/                    # 源码目录
│   ├── main/               # 主进程代码
│   │   ├── index.ts        # 主进程入口
│   │   └── modules/        # 主进程功能模块
│   │       ├── app-window.ts        # 窗口管理
│   │       ├── lin-controller.ts    # LIN控制器管理
│   │       ├── lin-protocol.ts      # LIN协议处理
│   │       ├── logger.ts            # 日志管理
│   │       └── serial-manager.ts    # 串口管理
│   ├── renderer/           # 渲染进程代码
│   │   ├── App.vue         # 主组件
│   │   ├── main.ts         # 渲染进程入口
│   │   └── global.d.ts     # 全局类型定义
│   └── preload.ts          # 预加载脚本
├── __tests__/              # 单元测试目录
│   └── lin-protocol/       # LIN协议测试
├── dist/                   # 构建输出目录
├── electron.vite.config.js # Electron Vite配置
├── package.json            # 项目依赖配置
├── tsconfig.json           # TypeScript配置
├── vitest.config.ts        # Vitest配置
└── README.md               # 项目说明文档
```

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式运行

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run start
```

## 使用指南

### 1. 串口连接
1. 启动应用后，系统会自动扫描可用串口
2. 在左侧串口配置面板中选择要连接的串口
3. 点击"打开串口"按钮连接串口

### 2. LIN配置
1. 在左侧LIN配置面板中设置LIN波特率
2. 选择LIN运行模式（主机、从机或监听）
3. 点击"应用配置"按钮保存配置

### 3. 数据发送
1. 在左侧数据发送面板中设置要发送的数据
2. 设置数据ID、数据内容、长度和校验类型
3. 点击"发送数据"按钮发送LIN数据帧

### 4. 数据接收
1. 接收的数据会实时显示在右侧的LIN数据接收表格中
2. 原始数据会显示在原始数据面板中
3. 操作日志会显示在操作日志面板中

### 5. 读取从机数据
1. 设置要读取的从机ID、数据长度和校验类型
2. 点击"读取从机"按钮发送读取命令
3. 读取的从机数据会显示在LIN数据接收表格中

## 开发说明

### 主进程模块

#### 1. `app-window.ts`
负责窗口创建和管理，包括窗口的初始化、事件监听和加载方式选择。

#### 2. `serial-manager.ts`
负责串口通信管理，包括串口列表获取、串口打开/关闭、串口数据接收等功能。

#### 3. `lin-protocol.ts`
负责LIN协议处理，包括LIN命令构建和帧解析。

#### 4. `lin-controller.ts`
负责LIN控制器管理，包括波特率设置、模式切换、数据发送/读取等功能。

#### 5. `logger.ts`
负责日志管理，支持不同级别的日志输出和日志开关控制。

### 预加载脚本

`preload.ts`负责在主进程和渲染进程之间建立安全的通信桥梁，暴露必要的API接口。

### 渲染进程

`App.vue`是应用的主组件，包含了所有的UI界面和交互逻辑，使用Element Plus组件库构建。

## 测试

### 运行单元测试

```bash
npx vitest run
```

### 运行特定测试文件

```bash
npx vitest run __tests__/lin-protocol/lin-protocol.test.ts
```

### 运行测试并生成覆盖率报告

```bash
npx vitest run --coverage
```

## 构建与打包

### 开发环境构建

```bash
npm run build
```

### 生产环境打包

根据目标平台，使用electron-builder进行打包，需要在package.json中配置相关打包选项。

## 配置文件

### electron.vite.config.js
Electron Vite构建配置文件，定义了主进程、预加载脚本和渲染进程的构建选项。

### tsconfig.json
TypeScript配置文件，定义了编译选项和类型检查规则。

### vitest.config.ts
Vitest测试配置文件，定义了测试环境和选项。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request，共同改进这个项目。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址：[GitHub Repository]
- 作者：[Your Name]
- 邮箱：[your-email@example.com]
