# Assistant Web 前端设计方案

## 概述

为 xiaoyu 项目的 assistant-agent 开发 Web 前端界面，提供图形化的智能体交互体验。

## 技术选型

| 层面 | 选择 | 说明 |
|------|------|------|
| 框架 | React 18 + TypeScript | 现代化、生态丰富 |
| UI | shadcn/ui | 高度可定制 |
| 样式 | Tailwind CSS | 原子化 CSS |
| 图标 | lucide-react | 图标库 |
| 状态 | Zustand | 轻量级状态管理 |
| 构建 | Vite | 快速构建 |
| 请求 | fetch + ReadableStream | 兼容 `POST /api/chat/stream` 的流式读取 |

## 设计风格

参考 `/实践工程/assistant/frontend` (Vue 3) 的 OpenAI 深色主题风格。

### 色彩方案

```
侧边栏背景: #202123
卡片背景: #2A2B32 / #343541
强调色: amber-400 / orange-500
主文字: white
次文字: gray-300 / gray-400
边框: white/10, white/5
```

### 布局结构（三栏）

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              主内容区                                              │
├──────────────┬────────────────────────────────┬─────────────────────────────────┤
│              │                                │  📌 待办 | 知识                  │
│  本地助理     │                                │  ─────────────────────────────  │
│  ──────────  │                                │                                 │
│              │   ┌──────────────────────┐    │  ┌─────────────────────────────┐│
│  + 快速开始   │   │ 🤖 消息内容          │    │  │ 当前 Tab 面板内容           ││
│              │   │ Markdown 渲染        │    │  │                             ││
│  ▼ 会话管理   │   └──────────────────────┘    │  │                             ││
│  ├─ 日常对话  │                                │  │                             ││
│  ├─ 会话1    │   ┌──────────────────────┐    │  │                             ││
│  └─ 会话2    │   │ 👤 用户消息          │    │  │                             ││
│              │   └──────────────────────┘    │  │                             ││
│  ▼ 其他导航   │                                │  │                             ││
│              │                                │  └─────────────────────────────┘│
│              │   ┌──────────────────────┐    │                                 │
│              │   │ 输入消息...     发送 │    │  🔄 刷新  ⚙️ 配置               │
│              │   └──────────────────────┘    │                                 │
├──────────────┴────────────────────────────────┴─────────────────────────────────┤
└──────────────────────────────────────────────────────────────────────────────────┘
     320px              flex-1                        320px
```

### 核心组件

| 区域 | 组件 | 说明 |
|------|------|------|
| 左侧栏 | `Sidebar` | 会话列表、新建按钮、搜索 |
| 消息区 | `MessageList` | 滚动容器，承载消息 |
| 单条消息 | `MessageItem` | 头像 + 内容 + 工具调用折叠 |
| 工具调用 | `ToolCallBadge` | 可折叠的工具调用详情 |
| 底部输入 | `InputBar` | 输入框 + 发送按钮 |
| 右侧栏 | `WorkspacePanel` | 右侧工作区容器 |
| Tab 栏 | `WorkspaceTabs` | 待办/知识 Tab 切换 |
| 待办面板 | `TodosPanel` | 任务列表 |
| 知识面板 | `KnowledgePanel` | 知识树/知识卡片 |

## 项目结构

```
assistant-web/
├── src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── collapsible.tsx
│   │   │   └── ...
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx       # 聊天主窗口
│   │   │   ├── MessageList.tsx      # 消息列表
│   │   │   ├── MessageItem.tsx      # 单条消息
│   │   │   └── InputBar.tsx         # 输入栏
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx          # 左侧边栏
│   │   │   └── SessionList.tsx      # 会话列表
│   │   └── workspace/               # 右侧工作区
│   │       ├── WorkspacePanel.tsx   # 右侧面板容器
│   │       ├── WorkspaceTabs.tsx    # Tab 标签栏
│   │       ├── TodosPanel.tsx       # 待办面板
│   │       └── KnowledgePanel.tsx   # 知识面板
│   ├── lib/
│   │   └── utils.ts                 # cn() 等工具函数
│   ├── stores/
│   │   ├── chat.ts                  # 聊天状态
│   │   └── workspace.ts             # 工作区状态
│   ├── services/
│   │   └── api.ts                   # API 封装 + SSE
│   ├── types/
│   │   └── index.ts                 # TypeScript 类型
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── components.json                  # shadcn/ui 配置
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## 右侧工作区 Tab 设计

### Tab 配置

| Tab ID | 标签 | 图标 | 面板组件 | 说明 |
|--------|------|------|----------|------|
| `todos` | 待办 | `CheckSquare` | `TodosPanel` | 任务列表管理 |
| `knowledge` | 知识 | `BookOpen` | `KnowledgePanel` | 知识树/知识卡片 |

### TodosPanel 功能

- 显示当前会话关联的待办事项
- 待办状态切换（完成/未完成）
- 新建待办（可选）

### KnowledgePanel 功能

- 显示知识树结构（可折叠）
- 知识卡片预览
- 点击跳转到详情（可选）

> 注：工具和技能面板暂不实现，预留 Tab 位置。

## API 对接

### 契约对齐说明（基于当前 `assistant-agent` 实现）

- 流式接口为 `POST /api/chat/stream`，前端不能直接使用原生 `EventSource`（仅支持 GET）
- 会话历史接口实际为 `GET /api/sessions/{id}/history`
- SSE 事件 `type` 由后端透传 Agent 事件名，文本事件不保证固定为 `CONTENT`
- 后端当前稳定输出：文本增量事件、`REASONING`、`TOOL_RESULT`、`METRICS`

### 后端接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/chat` | POST | 同步聊天 |
| `/api/chat/stream` | POST | SSE 流式聊天 |
| `/api/sessions` | GET | 获取会话列表 |
| `/api/sessions/{id}/history` | GET | 获取会话历史 |
| `/api/sessions/{id}` | DELETE | 删除会话 |
| `/api/todos` | GET | 获取待办列表（待定） |
| `/api/knowledge` | GET | 获取知识树（待定） |

### SSE 事件类型

```
REASONING    - 思考过程（可折叠）
TEXT/*       - 内容片段（流式，事件名由后端透传）
TOOL_RESULT  - 工具结果
METRICS      - 性能指标/结束信号（成功或失败）
```

### 前端事件归一化（建议）

前端不要直接依赖后端 `type` 常量，建议在 `services/api.ts` 中统一映射：

```typescript
type NormalizedStreamEvent =
  | { kind: 'assistant_delta'; text: string }
  | { kind: 'reasoning_delta'; text: string }
  | { kind: 'tool_result'; toolName: string; toolResult: string }
  | { kind: 'metrics'; success: boolean; error?: string; latencyMs?: number }
```

映射规则：

- `type === 'REASONING'` -> `reasoning_delta`
- `type === 'TOOL_RESULT'` -> `tool_result`
- `type === 'METRICS'` -> `metrics`
- 其余且 `content` 非空 -> `assistant_delta`

### 消息类型定义

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  reasoning?: string
  timestamp: number
}

interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  duration?: number
}

interface Session {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

interface Todo {
  id: string
  content: string
  completed: boolean
  createdAt: number
}

interface KnowledgeNode {
  id: string
  title: string
  type: 'folder' | 'card'
  children?: KnowledgeNode[]
}
```

## 开发阶段

### Phase 1: MVP

- [ ] 项目初始化（Vite + React + TypeScript）
- [ ] 安装配置 shadcn/ui + Tailwind CSS
- [ ] 三栏基础布局（Sidebar + ChatWindow + WorkspacePanel）
- [ ] API 适配层（真实后端契约 + 前端模型映射）
- [ ] 消息展示（MessageList + MessageItem）
- [ ] 输入框 + 发送功能
- [ ] `POST` 流式接收（`fetch` + `ReadableStream`）
- [ ] 流式状态机（预插入 assistant 消息 + 增量拼接 + `METRICS` 收尾）
- [ ] 会话管理基础（列表 + 切换 + 历史加载 + 删除）
- [ ] 右侧 Tab 栏框架（待办/知识 Tab 切换）

### Phase 2: 基础完善

- [ ] Markdown 渲染
- [ ] 代码高亮
- [ ] 工具调用折叠展示
- [ ] 待办面板功能
- [ ] 知识面板功能
- [ ] 错误处理

### Phase 3: 体验优化

- [ ] 响应式布局
- [ ] 加载状态
- [ ] 滚动优化
- [ ] 快捷键支持
- [ ] 主题切换（可选）

## 参考资源

- 设计参考: `/实践工程/assistant/frontend`
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- lucide-react: https://lucide.dev

## 实施建议（先稳主链路）

1. 先完成聊天主链路（会话列表 + 历史 + 流式发送）
2. 在 `stores/chat.ts` 实现会话级状态机，避免将流式拼接逻辑散落在组件中
3. 右侧工作区先完成容器和空状态，`todos/knowledge` 可使用 mock 数据渐进接入
4. 所有组件只消费前端统一模型，后端 DTO 变化收敛在 `services/api.ts`
