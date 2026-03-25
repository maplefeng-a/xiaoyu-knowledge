---
id: frameworks/agentscope/protocol/index
title: AgentScope 协议体系
tags: [agentscope, protocol, index]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
---

# AgentScope 协议体系

> AgentScope 定义了完整的智能体通信协议栈

## 核心概念

AgentScope 的协议体系包括消息协议、A2A 协议、MCP 协议和工具协议，每一层都有明确的职责和实现方式。

## 知识卡片

### 消息协议

<div class="card-grid">
  <a href="./message-protocol.md" class="card">
    <div class="card-icon">📨</div>
    <h3>消息协议</h3>
    <p>Msg + ContentBlock 统一消息格式</p>
    <span class="card-tag highlight">核心</span>
  </a>
  
  <a href="./a2a-protocol.md" class="card">
    <div class="card-icon">🤝</div>
    <h3>A2A 协议</h3>
    <p>跨智能体通信标准</p>
    <span class="card-tag">高级</span>
  </a>
  
  <a href="./mcp-protocol.md" class="card">
    <div class="card-icon">🔌</div>
    <h3>MCP 协议</h3>
    <p>工具调用标准化（Model Context Protocol）</p>
    <span class="card-tag">高级</span>
  </a>
  
  <a href="./tool-protocol.md" class="card">
    <div class="card-icon">🔧</div>
    <h3>工具协议</h3>
    <p>工具定义和调用协议</p>
    <span class="card-tag">基础</span>
  </a>
</div>

## 协议层次

```
┌─────────────────────────────────────────┐
│          应用层（Agent 交互）            │
│  A2A 协议 - 跨智能体通信                 │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          工具层（能力扩展）              │
│  MCP 协议 - 工具集成                     │
│  工具协议 - 工具调用                     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          消息层（基础单元）              │
│  Msg + ContentBlock - 消息格式          │
└─────────────────────────────────────────┘
```

## 协议对比

| 协议 | 职责 | Python | Java |
|------|------|--------|------|
| **消息协议** | 智能体间通信基础单元 | Msg + TypedDict | Msg + sealed class |
| **A2A 协议** | 跨智能体通信 | A2AAgent | 支持（服务发现） |
| **MCP 协议** | 工具集成 | - | McpClientManager |
| **工具协议** | 工具调用 | @tool 装饰器 | @Tool 注解 |

## 关键特性

1. **跨语言兼容** - Python 和 Java 使用相同的 JSON 格式
2. **可扩展** - 支持自定义 ContentBlock 和工具
3. **类型安全** - Java 使用 sealed class，Python 使用 TypedDict
4. **标准化** - A2A 和 MCP 提供标准协议支持

## 相关链接

- [智能体系统协议分层架构](../../../concept/protocol/agent-system-protocol-layers.md)
- [构建智能体应用工作清单](../../../plan/agent-application/building-agent-application-checklist.md)
- [OpenClaw Channel 接入总览](../../03-openclaw/04-渠道集成层/channel-architecture.md)
