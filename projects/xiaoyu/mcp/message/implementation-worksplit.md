# Message 协作方案任务分工（assistant-agent / assistant-mcp / desktop）

> 基于“文件为真相 + MCP + HTTP + Desktop”的最小可用方案

## 1. 总体分工

### 1.1 assistant-agent

负责开发协作 `skill`，作为消息能力的使用方（通过 MCP 调用）。

### 1.2 assistant-mcp

负责消息能力的实现与对外接口，包括：

- MCP 工具（`message_send`、`message_inbox`）
- HTTP 接口（Desktop 查看）
- 底层统一 `MessageService`（MCP 与 HTTP 共用）

### 1.3 desktop

负责开发消息模块（用户查看层），通过 HTTP 接口读取房间与消息。

## 2. assistant-agent 功能清单（Skill）

### 2.1 P0 必做

- 新增协作消息 skill（供 `assistant0agent` 使用）
- 在关键操作前调用 `message_inbox`
- 根据收件箱消息执行协作处理逻辑
- 使用 `message_send` 回写消息（广播或定向）

### 2.2 Skill 行为约定（建议固化到 skill 文档）

1. 每次进入协作流程前先查收件箱
2. 若有 `task/question` 类型消息，优先处理
3. 处理完成后发送 `update/note` 消息
4. 用户明确要求“先查收件箱”时，只执行 inbox 流程

### 2.3 P0 非目标

- 常驻监听/watch
- 线程回复关系（`reply_to`）
- 内部多 Agent 编排（MsgHub）

## 3. assistant-mcp 功能清单（核心实现方）

## 3.1 MessageService（底层统一服务）

职责：

- 房间配置读取（`room.yaml`）
- 房间与参与者校验（`owner/participants`）
- 消息 frontmatter 解析与序列化
- 消息文件写入（建议原子写入）
- 消息列表读取与过滤（收件箱过滤）

说明：

- `MCP` 工具与 `HTTP` 接口必须复用 `MessageService`
- 避免两套协议解析/校验逻辑

## 3.2 MCP 工具（Agent 接入层）

### P0 必做

- `message_send`
- `message_inbox`

### `message_send` 核心能力

- 校验 room 存在
- 校验 `sender` 在 `participants`
- 校验 `to`（若有）在 `participants`
- 写入消息 Markdown 文件
- 返回写入结果（房间、文件名、时间戳等）

### `message_inbox` 核心能力

- 按 `agent_id` 查询指定房间或所有房间消息
- 返回广播消息（`to` 为空）
- 返回定向给 `agent_id` 的消息
- 过滤自己发送的消息
- 支持 `limit`

## 3.3 HTTP 接口（Desktop 查看层）

### P0 必做（只读）

- `GET /api/messages/rooms`
- `GET /api/messages/{room}`
- `GET /api/messages/{room}/{filename}`

### HTTP 能力目标

- 提供房间列表
- 提供房间消息时间线
- 提供单条消息详情（元数据 + 正文）

### P0.5 可选

- `POST /api/messages/send`（Desktop 用户发消息）

前提：

- 内部复用 `MessageService` 写入逻辑，不新增独立写入实现

## 4. desktop 功能清单（消息模块）

### 4.1 P0 必做

- 房间列表页面/面板
- 房间消息时间线页面/面板
- 消息详情查看
- 手动刷新消息

### 4.2 展示字段（建议）

- `sender`
- `to`（为空显示“广播”）
- `type`
- `timestamp`
- `content`（预览）

### 4.3 P0 非目标

- 用户直接发消息（若无 `POST /api/messages/send`）
- 实时推送/WebSocket
- 已读状态同步

## 5. 推荐实现顺序

1. assistant-mcp：先定 MCP/HTTP 协议
2. assistant-mcp：实现 `MessageService`
3. assistant-mcp：实现 `message_send` / `message_inbox`
4. assistant-mcp：实现 HTTP 只读接口
5. assistant-agent：实现协作 skill
6. desktop：实现消息模块 UI

## 6. 验收要点（P0）

### 6.1 assistant-mcp

- 能成功读取 `room.yaml`
- 非参与者发送消息会被拒绝
- 广播消息与定向消息写入格式正确
- `message_inbox` 返回结果符合过滤规则
- HTTP 三个只读接口返回稳定 JSON

### 6.2 assistant-agent

- Skill 能在协作动作前先查 inbox
- 能按 inbox 结果调用 `message_send` 回写消息

### 6.3 desktop

- 能看到房间列表
- 能查看房间消息时间线
- 能查看单条消息详情

---
*Created: 2026-02-24*
*Related: message, mcp, desktop, assistant-agent, collaboration*
