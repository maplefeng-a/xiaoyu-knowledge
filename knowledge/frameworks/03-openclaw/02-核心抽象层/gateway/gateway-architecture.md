---
id: frameworks/openclaw/core/gateway-architecture
title: OpenClaw Gateway 总体架构
tags: [openclaw, gateway, architecture, websocket]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
learningFrom: OpenClaw Gateway 源码学习 + 官方文档
---

# OpenClaw Gateway 总体架构

## 概述

OpenClaw Gateway 是 OpenClaw 的核心组件，是一个长期运行的后台进程，负责消息路由、Channel 管理、WebSocket 控制平面和 HTTP API 服务。理解 Gateway 架构是理解 OpenClaw 的关键。

## 核心概念

### 架构总览

```
┌────────────────────────────────────────────────────────────────┐
│                    Gateway (单进程守护)                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 WebSocket Server                          │  │
│  │   ws://127.0.0.1:18789 (默认)                             │  │
│  │                                                          │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │   │  Control    │  │    Node     │  │   Canvas    │      │  │
│  │   │   Plane     │  │  Transport  │  │    Host     │      │  │
│  │   │ (operator)  │  │   (node)    │  │  (HTTP)     │      │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  HTTP API Server                          │  │
│  │                                                          │  │
│  │   • /v1/chat/completions (OpenAI 兼容)                    │  │
│  │   • /v1/responses (Anthropic Responses API)               │  │
│  │   • /__openclaw__/invoke (工具调用)                        │  │
│  │   • /__openclaw__/canvas/ (Canvas 托管)                   │  │
│  │   • /__openclaw__/a2ui/ (A2UI 接口)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Channel Connections                       │  │
│  │                                                          │  │
│  │   WhatsApp │ Telegram │ Discord │ Signal │ Matrix ...    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 State & Config Manager                    │  │
│  │                                                          │  │
│  │   ~/.openclaw/                                           │  │
│  │   ├── openclaw.json (配置)                                │  │
│  │   ├── auth-profiles.json (凭证)                           │  │
│  │   ├── nodes/ (节点配对状态)                                │  │
│  │   └── sessions/ (会话状态)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## 关键要点

### 1. 核心定位

**单一控制平面：**
- 一台主机建议只运行一个 Gateway
- 默认绑定 `loopback`，需要认证
- 所有客户端通过 WebSocket 连接，声明 `role` + `scope`

**核心职责：**
```yaml
✅ 路由和消息分发
✅ 管理所有 Channel 连接（WhatsApp、Telegram、Discord 等）
✅ WebSocket 控制平面
✅ HTTP API 服务（OpenAI 兼容、Responses、工具调用）
```

### 2. 网络模型

```
┌─────────────────────────────────────────────┐
│           Gateway (单进程)                   │
│   ws://127.0.0.1:18789 (默认 loopback)       │
│                                             │
│   ┌──────────┬──────────┬──────────────┐    │
│   │ WebSocket │ HTTP API │ Canvas Host  │    │
│   │ Control   │ OpenAI   │ /__openclaw__│    │
│   │ Plane     │ Compatible│ /canvas/    │    │
│   └──────────┴──────────┴──────────────┘    │
└─────────────────────────────────────────────┘
         ↓                ↓
    ┌─────────┐      ┌─────────┐
    │ Nodes   │      │ Channels│
    │(手机/桌面)│      │(WA/TG等)│
    └─────────┘      └─────────┘
```

**绑定模式：**
- `loopback`（默认）- 仅本机访问
- `tailnet` - Tailscale VPN 网络
- `all` - 所有接口（需要认证）

### 3. 协议设计

**传输层：** WebSocket over TCP
**帧格式：** 文本帧，JSON 编码

**帧类型：**

```json
// Request（请求）
{
  "type": "req",
  "id": "req_abc123",
  "method": "chat.send",
  "params": {
    "message": "Hello",
    "channel": "telegram"
  }
}

// Response（响应）
{
  "type": "res",
  "id": "req_abc123",
  "ok": true,
  "payload": {
    "messageId": "msg_xyz789"
  }
}

// Error（错误）
{
  "type": "res",
  "id": "req_abc123",
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}

// Event（事件）
{
  "type": "event",
  "event": "agent",
  "payload": {
    "sessionId": "sess_123",
    "status": "running",
    "output": "Processing..."
  },
  "seq": 42
}
```

### 4. 角色与权限系统

| 角色 | 用途 | 典型客户端 |
|------|------|-----------|
| `operator` | 控制平面操作 | CLI、Web UI、macOS App |
| `node` | 能力宿主 | iOS/Android、桌面节点 |

**Operator Scopes（权限范围）：**

```json
{
  "scopes": [
    "operator.read",      // 读取状态、配置、历史
    "operator.write",     // 发送消息、执行命令
    "operator.admin",     // 修改配置、管理系统
    "operator.approvals", // 审批请求（exec、pairing）
    "operator.pairing"    // 设备配对管理
  ]
}
```

**权限检查流程：**
```
请求 → Method Scope 检查 → Command Level 检查（如 /config set）
                              ↓
                        需要 operator.admin
```

### 5. 设备认证与配对

**设备身份模型：**
```
设备密钥对
    │
    ├─► 公钥指纹 → device.id
    │
    └─► 私钥签名 → device.signature
```

**签名载荷（v3 格式）：**
```json
{
  "platform": "macos",
  "deviceFamily": "desktop",
  "clientId": "cli",
  "clientVersion": "1.2.3",
  "role": "operator",
  "scopes": ["operator.read", "operator.write"],
  "token": "gateway_token",
  "nonce": "server_nonce",
  "ts": 1737264000000
}
```

**配对流程：**
```
┌──────────┐                    ┌──────────┐              ┌──────────┐
│   Node   │                    │ Gateway  │              │ Operator │
└────┬─────┘                    └────┬─────┘              └────┬─────┘
     │                               │                         │
     │  1. connect (请求配对)         │                         │
     │──────────────────────────────►│                         │
     │                               │                         │
     │                               │  2. node.pair.requested │
     │                               │────────────────────────►│
     │                               │   (广播待审批请求)        │
     │                               │                         │
     │                               │  3. node.pair.approve   │
     │                               │◄────────────────────────│
     │                               │   (审批通过)             │
     │                               │                         │
     │  4. 下发 deviceToken          │                         │
     │◄──────────────────────────────│                         │
     │                               │                         │
     │  5. 使用 token 重连            │                         │
     │──────────────────────────────►│                         │
```

### 6. 沙箱隔离机制

**沙箱架构：**
```
┌─────────────────────────────────────────────────────┐
│                   Gateway (Host)                    │
│                                                     │
│  ┌───────────────┐        ┌───────────────┐        │
│  │ Session A     │        │ Session B     │        │
│  │               │        │               │        │
│  │ ┌───────────┐ │        │ ┌───────────┐ │        │
│  │ │ Container │ │        │ │ Container │ │        │
│  │ │  (Sandbox)│ │        │  (Sandbox)│ │        │
│  │ │           │ │        │ │           │ │        │
│  │ │ exec      │ │        │ │ exec      │ │        │
│  │ │ read      │ │        │ │ read      │ │        │
│  │ │ write     │ │        │ │ write     │ │        │
│  │ └───────────┘ │        │ └───────────┘ │        │
│  └───────────────┘        └───────────────┘        │
│                                                     │
│  Elevated Tools (直接在 Host 执行)                   │
└─────────────────────────────────────────────────────┘
```

**沙箱模式：**

| 模式 | 行为 | 使用场景 |
|------|------|---------|
| `off` | 不使用沙箱 | 完全信任环境 |
| `non-main` | 仅非主会话沙箱 | 主聊天在主机，其他隔离 |
| `all` | 所有会话沙箱 | 最高安全级别 |

### 7. 配置热重载

| `gateway.reload.mode` | 行为 |
|----------------------|------|
| `off` | 不重载 |
| `hot` | 只应用热安全变更 |
| `restart` | 重启以应用变更 |
| `hybrid` (默认) | 安全时热更新，需要时重启 |

**热安全变更：**
- 模型参数（temperature、max_tokens）
- 提示词模板
- 工具策略
- 心跳间隔

**需要重启的变更：**
- 端口修改
- 认证配置
- Channel 配置
- 沙箱设置

### 8. 生命周期管理

```bash
# 日常操作
openclaw gateway status
openclaw gateway restart
openclaw gateway stop

# 服务化
openclaw gateway install  # macOS launchd / Linux systemd
```

### 9. 远程访问

**推荐方式：** Tailscale / VPN
**备用方式：** SSH 隧道

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

## 实践应用

### 单机部署

```bash
# 安装
npm install -g openclaw

# 初始化
openclaw init --defaults

# 启动
openclaw gateway

# 访问 Control UI
http://127.0.0.1:18789/
```

### 多 Gateway 部署

**隔离清单：**
```bash
# 必须唯一
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json
OPENCLAW_STATE_DIR=~/.openclaw-main
agents.defaults.workspace=~/.openclaw/workspace-main
gateway.port=18789

# 派生端口（自动计算）
browser.controlPort = 18789 + 2 = 18791
canvas.port = 18789 (HTTP 同端口)
CDP ports = 18791 + 9 .. + 108
```

### 监控与运维

```bash
# 快速检查
openclaw gateway status

# 深度检查
openclaw gateway status --deep

# JSON 输出
openclaw gateway status --json

# Channel 探测
openclaw channels status --probe

# 全面诊断
openclaw doctor
```

## 常见问题

### Q1: 为什么 Gateway 用 WebSocket，不用 HTTP + SSE？

**A:** Gateway 是控制平面，需要双向交互（发送请求、接收响应、中断对话、推送状态）。WebSocket 天然支持 RPC 模式。

### Q2: 一台主机可以运行多个 Gateway 吗？

**A:** 可以，但不推荐。需要隔离配置、状态目录、端口。

### Q3: 如何远程访问 Gateway？

**A:** 推荐使用 Tailscale VPN，或 SSH 隧道。不建议直接暴露到公网。

### Q4: Gateway 会自动重连 Channel 吗？

**A:** 会。Gateway 有自动重连机制，使用指数退避策略。

## 相关卡片

- [智能体系统协议分层架构](../../../concept/protocol/agent-system-protocol-layers.md)
- [构建智能体应用工作清单](../../../plan/agent-application/building-agent-application-checklist.md)
- [Channel 接入总览](../../04-渠道集成层/channel-architecture.md)
- [WebSocket vs SSE 对比](../../../concept/protocol/websocket-vs-sse.md)

## 参考资料

- [OpenClaw Gateway Documentation](https://docs.openclaw.ai/gateway)
- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
