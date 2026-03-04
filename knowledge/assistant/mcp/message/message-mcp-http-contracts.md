# Message MCP 与 HTTP 接口协议（P0）

> 基于文件为真相的消息协作方案最小契约定义

## 1. 范围

本协议覆盖：

- MCP 工具：`message_send`、`message_inbox`
- HTTP 只读接口：
  - `GET /api/messages/rooms`
  - `GET /api/messages/{room}`
  - `GET /api/messages/{room}/{filename}`

不覆盖：

- reply/thread
- ack/未读状态
- 实时推送
- HTTP 写接口（`POST /api/messages/send`，P0.5 可选）

## 2. 通用约定

### 2.1 时间格式

- 使用 ISO-8601（带时区）
- 示例：`2026-02-24T16:30:00+08:00`

### 2.2 消息类型（建议值）

- `note`
- `task`
- `question`
- `update`

### 2.3 广播与定向

- `to` 为空：广播
- `to` 非空：定向给指定参与者

### 2.4 错误处理（通用建议）

MCP 与 HTTP 的错误语义保持一致：

- `ROOM_NOT_FOUND`
- `ROOM_CONFIG_INVALID`
- `SENDER_NOT_PARTICIPANT`
- `TARGET_NOT_PARTICIPANT`
- `INVALID_ARGUMENT`
- `MESSAGE_FILE_NOT_FOUND`
- `INTERNAL_ERROR`

## 3. MCP 工具协议

## 3.1 `message_send`

### 3.1.1 用途

发送消息（广播或定向）。

### 3.1.2 请求参数

```json
{
  "room": "assistant-dev",
  "sender": "codex",
  "type": "note",
  "content": "完成了 message 协议初稿，建议先只保留 send/inbox 两个 MCP 工具。",
  "to": "assistant0agent"
}
```

字段说明：

- `room`：房间名（必填）
- `sender`：发送者（必填）
- `type`：消息类型（必填）
- `content`：消息正文（必填）
- `to`：目标对象（可选；为空表示广播）

### 3.1.3 成功响应（建议）

```json
{
  "ok": true,
  "room": "assistant-dev",
  "filename": "2026-02-24-16-30-00-codex.md",
  "timestamp": "2026-02-24T16:30:00+08:00",
  "sender": "codex",
  "to": "assistant0agent",
  "type": "note"
}
```

### 3.1.4 失败响应（建议）

```json
{
  "ok": false,
  "error": {
    "code": "SENDER_NOT_PARTICIPANT",
    "message": "sender 'codex' is not in room participants"
  }
}
```

## 3.2 `message_inbox`

### 3.2.1 用途

查询某个智能体当前可处理的消息（广播 + 定向给自己）。

### 3.2.2 请求参数

```json
{
  "agent_id": "assistant0agent",
  "room": "assistant-dev",
  "limit": 10
}
```

字段说明：

- `agent_id`：智能体 ID（必填）
- `room`：房间名（可选；为空表示查询所有房间）
- `limit`：返回数量（可选，默认 10）

### 3.2.3 返回过滤规则（P0）

- 包含 `to` 为空的广播消息
- 包含 `to == agent_id` 的定向消息
- 排除 `sender == agent_id` 的消息
- 按时间倒序返回最近 N 条

### 3.2.4 成功响应（建议）

```json
{
  "ok": true,
  "agent_id": "assistant0agent",
  "items": [
    {
      "room": "assistant-dev",
      "filename": "2026-02-24-16-29-10-codex.md",
      "sender": "codex",
      "to": "assistant0agent",
      "type": "note",
      "timestamp": "2026-02-24T16:29:10+08:00",
      "content_preview": "完成了 message 协议初稿..."
    },
    {
      "room": "assistant-dev",
      "filename": "2026-02-24-16-27-00-claude-code.md",
      "sender": "claude-code",
      "to": null,
      "type": "update",
      "timestamp": "2026-02-24T16:27:00+08:00",
      "content_preview": "建议房间 owner + participants 即可..."
    }
  ]
}
```

### 3.2.5 失败响应（建议）

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "limit must be greater than 0"
  }
}
```

## 4. HTTP 接口协议（Desktop 查看）

## 4.1 `GET /api/messages/rooms`

### 4.1.1 用途

获取房间列表（用于 Desktop 左侧/顶部房间切换）。

### 4.1.2 成功响应（示例）

```json
{
  "items": [
    {
      "room": "assistant-dev",
      "owner": "assistant0agent",
      "participants": [
        "assistant0agent",
        "codex",
        "claude-code",
        "clawdbot",
        "user:maple"
      ],
      "description": "assistant 开发协作房间"
    }
  ]
}
```

### 4.1.3 失败响应（示例）

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "failed to read rooms"
  }
}
```

## 4.2 `GET /api/messages/{room}`

### 4.2.1 用途

获取指定房间消息列表（用于 Desktop 消息时间线）。

### 4.2.2 Query 参数（建议）

- `limit`（可选，默认 50）

示例：

`GET /api/messages/assistant-dev?limit=50`

### 4.2.3 成功响应（示例）

```json
{
  "room": "assistant-dev",
  "items": [
    {
      "filename": "2026-02-24-16-30-00-codex.md",
      "sender": "codex",
      "to": "assistant0agent",
      "type": "note",
      "timestamp": "2026-02-24T16:30:00+08:00",
      "content_preview": "完成了 message 协议初稿..."
    },
    {
      "filename": "2026-02-24-16-28-00-assistant0agent.md",
      "sender": "assistant0agent",
      "to": null,
      "type": "task",
      "timestamp": "2026-02-24T16:28:00+08:00",
      "content_preview": "请 codex 输出 MCP 与 HTTP 协议草案。"
    }
  ]
}
```

### 4.2.4 失败响应（示例）

```json
{
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "room 'assistant-dev' not found"
  }
}
```

## 4.3 `GET /api/messages/{room}/{filename}`

### 4.3.1 用途

获取单条消息详情（用于 Desktop 详情面板）。

### 4.3.2 成功响应（示例）

```json
{
  "room": "assistant-dev",
  "filename": "2026-02-24-16-30-00-codex.md",
  "metadata": {
    "schema_version": 1,
    "room": "assistant-dev",
    "sender": "codex",
    "to": "assistant0agent",
    "type": "note",
    "timestamp": "2026-02-24T16:30:00+08:00"
  },
  "content": "完成了 message 协议初稿，建议先只保留 send/inbox 两个 MCP 工具。"
}
```

### 4.3.3 失败响应（示例）

```json
{
  "error": {
    "code": "MESSAGE_FILE_NOT_FOUND",
    "message": "message file not found"
  }
}
```

## 5. MessageService 对外返回结构建议（供实现统一）

为避免 MCP/HTTP 两套结构漂移，建议内部统一定义：

### 5.1 `MessageSummary`

```json
{
  "room": "assistant-dev",
  "filename": "2026-02-24-16-30-00-codex.md",
  "sender": "codex",
  "to": "assistant0agent",
  "type": "note",
  "timestamp": "2026-02-24T16:30:00+08:00",
  "content_preview": "完成了 message 协议初稿..."
}
```

### 5.2 `MessageDetail`

```json
{
  "room": "assistant-dev",
  "filename": "2026-02-24-16-30-00-codex.md",
  "metadata": {
    "schema_version": 1,
    "room": "assistant-dev",
    "sender": "codex",
    "to": "assistant0agent",
    "type": "note",
    "timestamp": "2026-02-24T16:30:00+08:00"
  },
  "content": "..."
}
```

## 6. P0 实现约束（建议）

- 文件真相优先：HTTP/MCP 不维护独立数据库真相
- 读取允许扫描目录（P0 不强制索引）
- 写入建议原子写入（临时文件 + rename）
- 所有接口返回字段命名保持一致（`room/sender/to/type/timestamp`）

---
*Created: 2026-02-24*
*Related: mcp, http, message, assistant-mcp, desktop*
