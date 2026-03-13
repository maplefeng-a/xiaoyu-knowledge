---
id: concept/protocol/agent-system-protocol-layers
title: 智能体系统协议分层架构
tags: [protocol, architecture, websocket, sse, agent]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
learningFrom: OpenClaw Gateway 架构学习 + AgentScope 协议分析 + CoPaw 架构研究
---

# 智能体系统协议分层架构

## 概述

智能体系统的协议分层是理解整个架构的关键。从模型层到应用层，每一层都有明确的职责和协议选择。本文档总结了智能体系统的标准分层架构和协议选择原则。

## 核心概念

### 协议分层模型

```
┌─────────────────────────────────────────────────────────────────┐
│                      应用层协议                                  │
│  • 消息格式定义（Msg / ContentBlock）                           │
│  • 事件类型定义（Matrix / Discord / 自定义）                     │
│  • 协议转换适配                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      传输层协议                                  │
│  • WebSocket（双向实时）                                         │
│  • HTTP + SSE（单向流式）                                        │
│  • HTTP REST（请求-响应）                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    智能体运行时                                  │
│  • Agent 框架（AgentScope / LangChain / OpenClaw）              │
│  • 会话管理、状态持久化                                          │
│  • 工具调用、记忆管理                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    模型层协议                                    │
│  • SSE（单向推送 - 模型输出）                                    │
│  • HTTP Stream（分块传输）                                       │
│  • WebSocket（双向流式 - OpenAI Realtime）                      │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    大模型服务                                    │
│  OpenAI / Anthropic / 通义千问 / 本地模型                        │
└─────────────────────────────────────────────────────────────────┘
```

## 关键要点

### 1. 模型层 → 智能体运行时：SSE

**为什么模型服务用 SSE：**

```
┌─────────┐                                    ┌─────────┐
│ Agent   │                                    │   LLM   │
│Runtime  │                                    │ Service │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /v1/chat/completions                  │
     │  Accept: text/event-stream                  │
     │─────────────────────────────────────────────►│
     │                                              │
     │  data: {"choices":[{"delta":{"content":"H"}}]}│
     │◄─────────────────────────────────────────────│
     │  data: {"choices":[{"delta":{"content":"e"}}]}│
     │◄─────────────────────────────────────────────│
     │  data: [DONE]                               │
     │◄─────────────────────────────────────────────│
```

**特点：**
- ✅ 单向推送 - 模型只输出，不需要客户端实时输入
- ✅ 自动重连 - 浏览器原生支持
- ✅ 简单可靠 - 基于 HTTP，无需额外协议

### 2. 智能体运行时 → 客户端/UI：WebSocket 或 HTTP + SSE

**WebSocket（OpenClaw Gateway 选择）：**

```
┌─────────┐                                    ┌─────────┐
│ Control │                                    │ Gateway │
│   UI    │                                    │         │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  WS Connect (ws://127.0.0.1:18789)          │
     │◄────────────────────────────────────────────►│
     │                                              │
     │  chat.send (Request)                        │
     │─────────────────────────────────────────────►│
     │                                              │
     │  agent event (Stream)                       │
     │◄─────────────────────────────────────────────│
     │                                              │
     │  chat.abort (Request) ← 双向交互             │
     │─────────────────────────────────────────────►│
```

**特点：**
- ✅ 双向通信 - 客户端可以随时发送请求/中断
- ✅ RPC 模式 - 请求-响应关联简单
- ✅ 低延迟 - 适合实时交互
- ✅ 多路复用 - 一个连接处理多种请求

**HTTP + SSE（CoPaw / Spring + AgentScope 选择）：**

```
┌─────────┐                                    ┌─────────┐
│ Console │                                    │ FastAPI │
│   UI    │                                    │         │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /api/chat/stream                      │
     │  Accept: text/event-stream                  │
     │─────────────────────────────────────────────►│
     │                                              │
     │  data: {"content":"H"}                      │
     │◄─────────────────────────────────────────────│
     │  data: {"content":"i"}                      │
     │◄─────────────────────────────────────────────│
     │                                              │
     │  POST /api/chat/abort (HTTP)                │
     │─────────────────────────────────────────────►│
```

**特点：**
- ✅ 简单可靠 - 基于 HTTP，无需维护连接
- ✅ 自动重连 - SSE 原生支持
- ✅ 兼容性好 - 无防火墙问题
- ⚠️ 单向推送 - 控制需额外 HTTP 请求

### 3. 应用层：协议转换适配

**职责：**
- 消息格式转换（Matrix ↔ Msg / Discord ↔ Msg）
- 事件映射（m.room.message → Agent 事件）
- 状态同步（群组状态、用户状态）
- 权限控制（访问控制、配对审批）

**实现方式：**
```python
# Channel Provider（OpenClaw）
class MatrixChannelProvider:
    def to_unified_message(self, matrix_event) -> UnifiedMessage:
        return UnifiedMessage(
            id=matrix_event.event_id,
            channel="matrix",
            from_user=matrix_event.sender,
            body=matrix_event.content.body,
            metadata={"room_id": matrix_event.room_id}
        )
    
    def from_unified_message(self, msg: UnifiedMessage):
        return MatrixMessage(
            msgtype="m.text",
            body=msg.body
        )

# Channel Adapter（CoPaw）
class MatrixChannel(ChannelBase):
    def convert_to_msg(self, matrix_event) -> Msg:
        return Msg(
            role=MsgRole.USER,
            name=matrix_event.sender,
            content=matrix_event.content.body,
            metadata={"matrix_room_id": matrix_event.room_id}
        )
    
    def convert_from_msg(self, msg: Msg):
        return MatrixMessage(
            msgtype="m.text",
            body=msg.content
        )
```

### 4. 传输层选择决策树

```
需要什么通信模式？
        │
        ├─── 单向推送（服务端 → 客户端）
        │           │
        │           └─── SSE ✅
        │                - 简单可靠
        │                - 自动重连
        │                - 浏览器原生支持
        │
        ├─── 双向实时交互
        │           │
        │           └─── WebSocket ✅
        │                - RPC 模式
        │                - 低延迟
        │                - 多路复用
        │
        └─── 请求-响应（无状态）
                    │
                    └─── HTTP API ✅
                         - 兼容性好
                         - 无需长连接
                         - 易于缓存
```

## 实践应用

### 场景 1：纯聊天（推荐 SSE）

```
前端 SSE ────→ Spring SSE ────→ Agent ────→ 模型 SSE

特点：
✅ 单向推送（模型→前端）
✅ 简单可靠
✅ 自动重连
✅ 代码少
```

### 场景 2：实时交互（推荐 WebSocket）

```
前端 WS ←───→ Spring WS ←───→ Agent ←───→ 模型 SSE

特点：
✅ 双向通信
✅ 可中断对话
✅ 可实时注入指令
✅ 多用户协作
```

### 场景 3：混合模式（推荐）

```
前端聊天 → SSE（简单可靠）
中断/控制 → HTTP POST（无需 WebSocket）
```

## 常见问题

### Q1: 为什么模型层用 SSE，不用 WebSocket？

**A:** 模型推理是单向推送场景，客户端只需要接收输出，不需要实时发送数据。SSE 更简单可靠。

### Q2: 为什么 OpenClaw Gateway 用 WebSocket，不用 SSE？

**A:** Gateway 是控制平面，需要双向交互（发送请求、接收响应、中断对话、推送状态）。WebSocket 天然支持 RPC 模式。

### Q3: Spring + AgentScope 应该用 WebSocket 还是 SSE？

**A:** 
- **简单聊天**：SSE 足够
- **需要中断/控制**：SSE + HTTP 或 WebSocket
- **企业应用**：SSE + HTTP（简单可靠）

### Q4: 传输层需要修改吗？

**A:** 不需要。传输层（HTTP/WebSocket）是通用的，应用层协议（消息格式）才是需要对接的重点。

## 相关卡片

- [WebSocket vs SSE 对比](../websocket-vs-sse.md)
- [Spring WebSocket 支持](../spring-websocket.md)
- [构建智能体应用工作清单](../../plan/agent-application/building-agent-application-checklist.md)
- [AgentScope 消息协议](../../frameworks/02-agentscope-ecosystem/agentscope/protocol/message-protocol.md)
- [OpenClaw Gateway 架构](../../frameworks/03-openclaw/02-核心抽象层/gateway/gateway-architecture.md)

## 参考资料

- [OpenClaw Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)
- [AgentScope Message Protocol](https://github.com/agentscope-ai/agentscope)
- [CoPaw Architecture](https://github.com/agentscope-ai/CoPaw)
- [Matrix Protocol](https://spec.matrix.org/)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
