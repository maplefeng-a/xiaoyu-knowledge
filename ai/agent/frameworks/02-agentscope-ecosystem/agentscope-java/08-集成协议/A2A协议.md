
# A2A 协议

> Agent-to-Agent Protocol - 多智能体协作协议

## 一句话

A2A（Agent-to-Agent）是 Google 开源的多智能体协作协议，用于实现跨服务的 Agent 间通信与协作。

## 协议概述

```
┌─────────────────────────────────────────────────────────────────┐
│                      A2A 协议架构                               │
│                                                                  │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │  Agent A     │                    │  Agent B     │           │
│  │  (Client)    │◄──────────────────►│  (Server)    │           │
│  │              │    JSON-RPC/SSE    │              │           │
│  └──────────────┘                    └──────────────┘           │
│        │                                    │                   │
│        │  1. Get AgentCard                  │                   │
│        │───────────────────────────────────►│                   │
│        │  2. Create Task                    │                   │
│        │───────────────────────────────────►│                   │
│        │  3. Send Message                   │                   │
│        │───────────────────────────────────►│                   │
│        │  4. Stream Events                  │                   │
│        │◄───────────────────────────────────│                   │
│        │  5. Get Result                     │                   │
│        │◄───────────────────────────────────│                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 核心概念

| 概念 | 说明 |
|------|------|
| **AgentCard** | Agent 能力描述卡片 |
| **Task** | 任务实例，包含状态和消息 |
| **Message** | Agent 间通信的消息 |
| **Artifact** | 任务产生的输出结果 |
| **Event** | 流式事件（SSE） |

## AgentCard 结构

```json
{
  "name": "weather-agent",
  "description": "Weather information agent",
  "url": "http://localhost:8080",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "weather-query",
      "name": "Weather Query",
      "description": "Query weather information",
      "tags": ["weather", "query"]
    }
  ],
  "securitySchemes": {},
  "preferredTransport": "jsonrpc"
}
```

## 使用案例

### 发现 Agent

```bash
# 通过 .well-known 发现
GET http://agent.example.com/.well-known/agent-card.json
```

### 调用 Agent

```java
// 创建 A2A Client
A2aAgent remoteAgent = A2aAgent.builder()
    .name("weather-agent")
    .agentCardResolver(new WellKnownAgentCardResolver(
        "http://localhost:8080",
        "/.well-known/agent-card.json",
        Map.of()
    ))
    .build();

// 调用远程 Agent
Msg response = remoteAgent.call(Msg.userText("What's the weather in Beijing?")).block();
```

## 协议流程

1. **发现**：通过 AgentCard 发现 Agent 能力
2. **创建任务**：发起 Task 请求
3. **发送消息**：发送用户消息
4. **流式响应**：通过 SSE 接收流式事件
5. **获取结果**：接收最终结果

## 优势与劣势

### 优势 ✅

| 优势 | 说明 |
|------|------|
| **标准化** | Google 主导，生态广泛 |
| **能力发现** | AgentCard 描述能力 |
| **流式响应** | SSE 实时推送 |
| **跨语言** | 协议无关语言 |

### 劣势 ⚠️

| 劣势 | 说明 |
|------|------|
| **协议复杂** | JSON-RPC + SSE + AgentCard |
| **网络依赖** | 依赖网络稳定性 |
| **调试困难** | 分布式调用复杂 |

## 源码位置

`io.agentscope.core.a2a.*`

## 关联

- [[knowledge/agentscope-java/06-扩展生态层/A2A扩展|A2A扩展]]
- [[knowledge/agentscope-java/08-集成协议/MCP协议|MCP协议]]
- [[knowledge/agentscope-java/08-集成协议/AGUI协议|AGUI协议]]
