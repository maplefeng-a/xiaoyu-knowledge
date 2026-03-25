# 文件为真相的协作消息方案（MCP + HTTP）

> 面向 `assistant0agent / codex / claude-code / clawdbot / 用户` 的最小可用协作通道设计

## 1. 目标与原则

### 1.1 目标

- 建立跨框架智能体与用户的沟通渠道
- 保持高自由度（人可读写、Agent 可读写、Shell 可直接查看）
- 不依赖 Agent 框架常驻轮询/监听服务
- 支持 Desktop 界面查看消息

### 1.2 原则

- **文件为真相**：`messages/` 下文件是权威状态
- **MCP 面向 Agent**：提供写入与收件箱能力
- **HTTP 面向 UI**：提供 Desktop 查看接口
- **Shell 面向人工**：允许 `rg/ls/cat` 自由检索
- **先最小可用**：不做 reply/thread/watch/复杂权限

## 2. 总体架构

```text
messages/ (Source of Truth, 文件真相层)
   ↑            ↑             ↑
   │            │             │
 MCP tools    HTTP API      Shell
 (Agent用)    (Desktop用)    (人工调试)
   ↑
 Skills (codex / claude-code / clawdbot / assistant0agent)
```

说明：

- `MCP` 提供 `message_send`、`message_inbox`
- `HTTP` 先提供只读接口给 Desktop
- `Shell` 用于人工排查和自由查询

## 3. 目录结构（P0）

```text
messages/
  assistant-dev/
    room.yaml
    2026-02-24-11-20-00-codex.md
    2026-02-24-11-21-15-assistant0agent.md
```

说明：

- 一个目录代表一个房间（room）
- 一条消息一个 Markdown 文件
- 文件名按时间排序，便于直接按目录扫描

## 4. 房间模型（极简）

文件：`messages/<room>/room.yaml`

```yaml
schema_version: 1
room: assistant-dev
owner: assistant0agent
participants:
  - assistant0agent
  - codex
  - claude-code
  - clawdbot
  - user:maple
description: assistant 开发协作房间
```

### 4.1 字段说明

- `schema_version`: 协议版本
- `room`: 房间名（目录名）
- `owner`: 房间所有者（通常是主控 Agent）
- `participants`: 允许参与发言/收信的成员列表
- `description`: 房间用途说明（可选）

### 4.2 P0 校验规则

- `sender` 必须在 `participants`
- `to` 若存在，必须在 `participants`
- `to` 为空表示广播给房间参与者

## 5. 消息协议（极简版）

文件：`messages/<room>/<timestamp>-<sender>.md`

示例：

```md
---
schema_version: 1
room: assistant-dev
sender: codex
to: assistant0agent
type: note
timestamp: 2026-02-24T11:20:00+08:00
---

完成了 message 协议初稿，建议先只保留 send/inbox 两个 MCP 工具。
```

### 5.1 字段说明

- `schema_version`: 协议版本
- `room`: 房间名
- `sender`: 发送者（如 `codex`）
- `to`: 目标对象（可选）
- `type`: 消息类型（建议值：`note | task | question | update`）
- `timestamp`: ISO-8601 时间戳

### 5.2 通信语义（P0）

- `to` 为空：广播消息
- `to` 有值：定向消息
- 不设计 `reply_to`
- 不设计线程模型

## 6. MCP 设计（Agent 接入层）

### 6.1 设计定位

- `MCP` 负责：写入消息、收件箱查询、协议校验
- `MCP` 不负责：复杂协作编排、常驻监听、UI 展示

### 6.2 最精简工具集（2 个）

#### 1) `message_send`

用途：发送消息（广播/定向）

参数：

- `room`（必填）
- `sender`（必填）
- `type`（必填）
- `content`（必填）
- `to`（可选；为空表示广播）

行为：

- 读取并校验 `room.yaml`
- 校验 `sender/to` 是否在 `participants`
- 生成消息文件名并写入 Markdown 文件（建议原子写入）

#### 2) `message_inbox`

用途：查询某个智能体当前“应处理”的消息

参数：

- `agent_id`（必填）
- `room`（可选）
- `limit`（可选，默认 10）

返回逻辑（P0）：

- 返回发给 `agent_id` 的定向消息
- 返回广播消息（`to` 为空）
- 过滤 `sender == agent_id` 的消息
- 按时间倒序返回最近 N 条

注：P0 可以先不做 `ack`，也不强制未读状态管理。

## 7. 收件箱机制（不依赖 watch）

### 7.1 核心判断

文件真相方案里，“收到消息”本质是：

- **主动拉取发现新消息**

而不是依赖常驻推送。

### 7.2 为什么不用 watch 作为前提

- 很多 Agent 框架难以稳定保持常驻轮询/监听服务
- 协作 Agent 常以“执行一轮任务后退出”的模式运行

### 7.3 P0 实践方式

- 在各 Agent 的协作 skill 中约定：关键操作前先调用 `message_inbox`
- 用户可以显式提醒 Agent：先查收件箱
- 如需定期处理异步消息，由外部调度器/主控唤起 Agent（而不是 Agent 自己常驻）

## 8. Skill 使用约定（各智能体）

建议各智能体的协作 skill 统一遵循：

1. 执行协作动作前先调用 `message_inbox`
2. 若 inbox 中有 `task/question`，优先处理
3. 处理完成后调用 `message_send` 回写结果
4. 若用户明确要求“先查收件箱”，仅执行 inbox 流程

适用对象：

- `assistant0agent`
- `codex`
- `claude-code`
- `clawdbot`

## 9. HTTP 接口（Desktop 查看层）

### 9.1 定位

- 面向 Desktop 界面查看消息
- P0 先做只读接口
- 内部应复用同一读取服务（不要单独实现一套协议解析）

### 9.2 推荐接口（P0）

#### 1) `GET /api/messages/rooms`

返回房间列表：

- `room`
- `owner`
- `participants`
- `description`

#### 2) `GET /api/messages/{room}`

返回房间消息列表（支持 `limit`）

用于 Desktop 展示消息时间线。

#### 3) `GET /api/messages/{room}/{filename}`

返回单条消息详情：

- frontmatter 元数据
- 正文内容

### 9.3 可选接口（P0.5）

- `POST /api/messages/send`

说明：

- 若 Desktop 需要用户直接发消息时再增加
- 写入逻辑应复用与 MCP 相同的消息写入服务

## 10. 与 agentscope-java / MsgHub / A2A 的关系

### 10.1 当前阶段（内部只有一个 Agent）

- 不需要引入 `MsgHub`
- `agentscope-java` 只需通过 skill + MCP 使用协作消息能力

### 10.2 后续内部多 Agent 时

- `MsgHub` 可作为 `agentscope-java` 内部实时编排层
- 文件消息协议仍作为跨框架协作通道

### 10.3 A2A 的定位

- `A2A` 适合远程 Agent 服务化调用（RPC/发现）
- 不替代文件为真相的协作消息系统

## 11. 人工读取与调试

保留 Shell 直接读取能力：

- `ls`：查看房间目录
- `rg`：按关键词搜索消息
- `cat/sed`：查看消息原文

设计原则：

- 人工可直接读文件
- 不强制所有读取都走 MCP 或 HTTP

## 12. P0 非目标（明确不做）

- `reply_to` / 线程模型
- 常驻 watch / 推送机制
- 复杂权限（ACL、角色层级）
- 已读回执/ACK 体系
- 索引数据库（SQLite 等）
- Team/Task 完整协作系统

## 13. 后续演进方向（P1+）

可在不破坏 P0 协议的前提下增加：

- `message_query`（结构化查询）
- 索引层（可重建，非真相）
- checkpoint/未读管理
- `task` 协作模块（可复用待办内核）
- `team` 配置扩展（角色/策略）
- HTTP 写接口
- 实时通知（watch/WebSocket）

---
*Created: 2026-02-24*
*Related: assistant-agent, mcp, message, collaboration, file-based*
