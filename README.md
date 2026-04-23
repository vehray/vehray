# LIN Analyzer (Electron + Vue)

这是一个基于 Electron 与 Vue 3 的桌面应用，用于 LIN 相关调试与交互。

## 开发命令

- 安装依赖：`npm install`
- 开发模式：`npm run dev`
- 构建：`npm run build`
- 预览：`npm run start`

## 当前目录结构（简化后）

- `src/main/`：Electron 主进程
- `src/preload/` + `preload.ts`：预加载桥接
- `src/renderer/`：渲染进程（app/features/services/state/shared）
- `__tests__/`：前端与状态相关测试

## 约定

- UI 组件不直接访问 `window.electron`，统一走 `src/renderer/services/`
- 跨组件状态统一放在 `src/renderer/state/`
- 新增业务模块优先放在 `src/renderer/features/`
