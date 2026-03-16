---
id: concept/protocol/index
title: 协议分层概念
tags: [protocol, concept, index]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
---

# 协议分层概念

> 智能体系统的协议分层是理解整个架构的关键

## 核心概念

智能体系统从模型层到应用层，每一层都有明确的职责和协议选择。理解这些层次和协议选择，是设计和实现智能体应用的基础。

## 知识卡片

### 协议分层架构

<div class="card-grid">
  <a href="./agent-system-protocol-layers.md" class="card">
    <div class="card-icon">🏗️</div>
    <h3>智能体系统协议分层架构</h3>
    <p>从模型层到应用层的完整协议栈</p>
    <span class="card-tag highlight">核心</span>
  </a>
  
  <a href="./websocket-vs-sse.md" class="card">
    <div class="card-icon">⚡</div>
    <h3>WebSocket vs SSE 对比</h3>
    <p>两种传输协议的选择和场景</p>
    <span class="card-tag">对比</span>
  </a>
  
  <a href="./spring-websocket.md" class="card">
    <div class="card-icon">🍃</div>
    <h3>Spring WebSocket 支持</h3>
    <p>Spring 框架的 WebSocket 集成</p>
    <span class="card-tag">实践</span>
  </a>
</div>

## 协议选择决策

```
需要什么通信模式？
        │
        ├─── 单向推送（服务端 → 客户端）
        │           │
        │           └─── SSE ✅
        │
        ├─── 双向实时交互
        │           │
        │           └─── WebSocket ✅
        │
        └─── 请求-响应（无状态）
                    │
                    └─── HTTP API ✅
```

## 关键原则

1. **模型层用 SSE** - 单向推送，简单可靠
2. **控制平面用 WebSocket** - 双向交互，RPC 模式
3. **应用层协议转换** - 消息格式适配，事件映射
4. **传输层通用** - HTTP/WebSocket 框架提供，无需重复实现

## 相关链接

- [构建智能体应用工作清单](../../plan/agent-application/building-agent-application-checklist.md)
- [AgentScope 消息协议](../../frameworks/02-agentscope-ecosystem/agentscope/protocol/message-protocol.md)
- [OpenClaw Gateway 架构](../../frameworks/03-openclaw/02-核心抽象层/gateway/gateway-architecture.md)
