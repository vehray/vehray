# Renderer 目录约定

本目录用于承载渲染进程代码，按职责分层，避免组件和 Electron 能力耦合。

## 目录结构

- `app/`：渲染进程入口与根组件
- `features/`：按业务域组织的页面/组件/组合逻辑
- `services/`：与 Electron 桥接和 UI action 服务
- `state/`：跨 feature 的共享状态
- `shared/`：通用类型与常量

## 约定

- 组件层不直接访问 `window.electron`，统一通过 `services/` 调用。
- 跨组件共享状态统一放入 `state/`。
- `features/` 内按模块拆分：
  - `layout/`
  - `explorer/`
  - `tabs/`

## 导入建议

- 优先从 `renderer` 内同层目录导入，避免回退到旧目录。
- 新增功能优先落在对应 `features/*` 下，不再新增 `src/components` 或 `src/viewmodels` 文件。
