
# AGUI 协议

> Agent-UI Protocol - Agent 前端交互协议

## 一句话

AGUI（Agent-UI）是 Agent 与前端 UI 交互的标准化协议，支持流式消息、工具调用、状态同步等。

## 协议概述

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGUI 协议架构                              │
│                                                                  │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │   Frontend   │                    │   Backend    │           │
│  │   (React)    │◄──────────────────►│   (Agent)    │           │
│  │              │    SSE/WS          │              │           │
│  └──────────────┘                    └──────────────┘           │
│        │                                    │                   │
│        │  RUN_STARTED                       │                   │
│        │◄───────────────────────────────────│                   │
│        │  TEXT_MESSAGE_START                │                   │
│        │◄───────────────────────────────────│                   │
│        │  TEXT_MESSAGE_CONTENT              │                   │
│        │◄───────────────────────────────────│                   │
│        │  TOOL_CALL_START                   │                   │
│        │◄───────────────────────────────────│                   │
│        │  TOOL_CALL_RESULT                  │                   │
│        │◄───────────────────────────────────│                   │
│        │  RUN_FINISHED                      │                   │
│        │◄───────────────────────────────────│                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 事件类型

### 运行控制

| 事件 | 说明 |
|------|------|
| `RUN_STARTED` | Agent 运行开始 |
| `RUN_FINISHED` | Agent 运行结束 |

### 文本消息

| 事件 | 说明 |
|------|------|
| `TEXT_MESSAGE_START` | 文本消息开始 |
| `TEXT_MESSAGE_CONTENT` | 文本增量内容（delta） |
| `TEXT_MESSAGE_END` | 文本消息结束 |

### 工具调用

| 事件 | 说明 |
|------|------|
| `TOOL_CALL_START` | 工具调用开始 |
| `TOOL_CALL_ARGS` | 工具参数增量 |
| `TOOL_CALL_END` | 工具调用参数结束 |
| `TOOL_CALL_RESULT` | 工具调用结果 |

### 状态同步

| 事件 | 说明 |
|------|------|
| `STATE_SNAPSHOT` | 完整状态快照 |
| `STATE_DELTA` | 状态增量（JSON Patch） |

### 推理过程（Draft）

| 事件 | 说明 |
|------|------|
| `REASONING_START` | 推理阶段开始 |
| `REASONING_MESSAGE_CONTENT` | 推理内容增量 |
| `REASONING_END` | 推理阶段结束 |

## 使用案例

### 前端调用

```typescript
// 前端使用 AGUI SDK
import { useAgent } from '@ag-ui/react';

function ChatComponent() {
  const { messages, sendMessage, isRunning } = useAgent({
    agentId: 'assistant',
    baseUrl: 'http://localhost:8080'
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          {msg.role}: {msg.content}
        </div>
      ))}
      <button onClick={() => sendMessage('Hello!')} disabled={isRunning}>
        Send
      </button>
    </div>
  );
}
```

### 后端实现

```java
// 使用 AguiAgentAdapter
AguiAgentAdapter adapter = new AguiAgentAdapter(agent, config);

Flux<AguiEvent> events = adapter.run(new RunAgentInput(
    "thread-123",
    "run-456",
    List.of(new AguiMessage("user", "Hello!"))
));

// 返回 SSE 流
return events.map(event -> ServerSentEvent.<AguiEvent>builder()
    .event(event.getType().name())
    .data(event)
    .build());
```

## 事件示例

```json
// TEXT_MESSAGE_CONTENT
{
  "type": "TEXT_MESSAGE_CONTENT",
  "threadId": "thread-123",
  "runId": "run-456",
  "messageId": "msg-789",
  "delta": "Hello"
}

// TOOL_CALL_START
{
  "type": "TOOL_CALL_START",
  "threadId": "thread-123",
  "runId": "run-456",
  "toolCallId": "call-001",
  "toolCallName": "search"
}

// STATE_DELTA
{
  "type": "STATE_DELTA",
  "threadId": "thread-123",
  "runId": "run-456",
  "delta": [
    {"op": "replace", "path": "/status", "value": "completed"}
  ]
}
```

## 优势与劣势

### 优势 ✅

| 优势 | 说明 |
|------|------|
| **标准化** | 前端框架无关 |
| **流式传输** | SSE 实时推送 |
| **增量更新** | delta 模式减少数据量 |
| **状态同步** | JSON Patch 增量更新 |
| **推理可视化** | 支持 ThinkingBlock |

### 劣势 ⚠️

| 劣势 | 说明 |
|------|------|
| **协议复杂** | 事件类型多 |
| **Reasoning 是 Draft** | 推理事件仍在草案 |
| **前端依赖** | 需要配套前端 SDK |

## 源码位置

`io.agentscope.core.agui.*`

## 关联

- [[knowledge/agentscope-java/06-扩展生态层/AGUI扩展|AGUI扩展]]
- [[knowledge/agentscope-java/08-集成协议/MCP协议|MCP协议]]
- [[knowledge/agentscope-java/08-集成协议/A2A协议|A2A协议]]
