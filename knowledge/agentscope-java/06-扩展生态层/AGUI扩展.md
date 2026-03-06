---
id: agentscope-extensions-agui
type: concept
title: AGUI 扩展
status: active
aliases:
  - Agent-UI Protocol
  - AG-UI
tags:
  - agentscope-java
  - extensions
  - agui
  - frontend
refs:
  - io.agentscope.core.agui.adapter.AguiAgentAdapter
  - io.agentscope.core.agui.registry.AguiAgentRegistry
---

# AGUI 扩展

> agentscope-java 前端 UI 交互协议扩展

## 一句话

AGUI（Agent-UI）协议扩展，将 AgentScope Agent 适配到前端 UI 协议，实现 Agent 与前端的流式交互，支持文本消息、工具调用、推理过程等事件的标准化传输。

## 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGUI 协议架构                             │
│                                                                  │
│  ┌──────────────────┐                    ┌──────────────────┐   │
│  │   Frontend       │                    │   Backend        │   │
│  │                  │   SSE/WebSocket    │                  │   │
│  │  ┌────────────┐  │◄──────────────────►│  ┌─────────────┐  │   │
│  │  │ AGUI SDK   │  │   AguiEvent        │  │AguiAdapter  │  │   │
│  │  └────────────┘  │                    │  └─────────────┘  │   │
│  │        │         │                    │        │          │   │
│  │        ▼         │                    │        ▼          │   │
│  │  ┌────────────┐  │                    │  ┌─────────────┐  │   │
│  │  │ State      │  │                    │  │AguiRegistry │  │   │
│  │  │ Manager    │  │                    │  └─────────────┘  │   │
│  │  └────────────┘  │                    │        │          │   │
│  └──────────────────┘                    │        ▼          │   │
│                                          │  ┌─────────────┐  │   │
│                                          │  │ReActAgent   │  │   │
│                                          │  └─────────────┘  │   │
│                                          └──────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 模块划分

| 模块 | 说明 |
|------|------|
| **adapter** | AguiAgentAdapter，将 Agent 适配到 AGUI 协议 |
| **registry** | AguiAgentRegistry，管理可访问的 Agent |
| **event** | AguiEvent，AGUI 事件类型定义 |
| **converter** | 消息/工具/状态转换器 |
| **model** | 数据模型（AguiMessage, AguiTool 等） |

## 核心对象定义

### AguiAgentAdapter

```java
public class AguiAgentAdapter {
    private final Agent agent;                    // 被适配的 Agent
    private final AguiAdapterConfig config;       // 适配器配置
    private final AguiMessageConverter messageConverter;  // 消息转换器
}
```

### AguiAdapterConfig

```java
public record AguiAdapterConfig(
    boolean emitToolCallArgs,    // 是否发送工具参数（默认 true）
    boolean enableReasoning      // 是否启用推理事件（默认 false）
) {
    // Builder 模式
}
```

### AguiAgentRegistry

```java
public class AguiAgentRegistry {
    private final Map<String, Agent> singletonAgents;        // 单例 Agent
    private final Map<String, Supplier<Agent>> agentFactories;  // Agent 工厂
}
```

### AguiEvent（密封接口）

```java
public sealed interface AguiEvent permits
    // 运行控制
    AguiEvent.RunStarted,
    AguiEvent.RunFinished,
    
    // 文本消息
    AguiEvent.TextMessageStart,
    AguiEvent.TextMessageContent,
    AguiEvent.TextMessageEnd,
    
    // 工具调用
    AguiEvent.ToolCallStart,
    AguiEvent.ToolCallArgs,
    AguiEvent.ToolCallEnd,
    AguiEvent.ToolCallResult,
    
    // 状态管理
    AguiEvent.StateSnapshot,
    AguiEvent.StateDelta,
    
    // 推理过程（Draft）
    AguiEvent.ReasoningStart,
    AguiEvent.ReasoningMessageStart,
    AguiEvent.ReasoningMessageContent,
    AguiEvent.ReasoningMessageEnd,
    AguiEvent.ReasoningEnd,
    
    // 扩展
    AguiEvent.Raw,
    AguiEvent.Custom {
    
    AguiEventType getType();
    String getThreadId();
    String getRunId();
}
```

## 事件类型详解

### 运行控制事件

| 事件 | 说明 |
|------|------|
| `RUN_STARTED` | Agent 运行开始 |
| `RUN_FINISHED` | Agent 运行结束 |

### 文本消息事件

| 事件 | 说明 |
|------|------|
| `TEXT_MESSAGE_START` | 文本消息开始 |
| `TEXT_MESSAGE_CONTENT` | 文本消息增量内容（delta） |
| `TEXT_MESSAGE_END` | 文本消息结束 |

### 工具调用事件

| 事件 | 说明 |
|------|------|
| `TOOL_CALL_START` | 工具调用开始 |
| `TOOL_CALL_ARGS` | 工具参数增量（流式） |
| `TOOL_CALL_END` | 工具调用参数结束 |
| `TOOL_CALL_RESULT` | 工具调用结果 |

### 推理事件（Draft）

| 事件 | 说明 |
|------|------|
| `REASONING_START` | 推理阶段开始 |
| `REASONING_MESSAGE_START` | 推理消息开始 |
| `REASONING_MESSAGE_CONTENT` | 推理内容增量 |
| `REASONING_MESSAGE_END` | 推理消息结束 |
| `REASONING_END` | 推理阶段结束 |

### 状态事件

| 事件 | 说明 |
|------|------|
| `STATE_SNAPSHOT` | 完整状态快照 |
| `STATE_DELTA` | 状态增量（JSON Patch） |

## 核心方法

### AguiAgentAdapter 方法

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `run(RunAgentInput)` | `Flux<AguiEvent>` | 执行 Agent 并返回 AGUI 事件流 |

### AguiAgentRegistry 方法

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `register(String, Agent)` | `void` | 注册单例 Agent |
| `registerFactory(String, Supplier<Agent>)` | `void` | 注册 Agent 工厂 |
| `getAgent(String)` | `Optional<Agent>` | 获取 Agent |
| `hasAgent(String)` | `boolean` | 检查 Agent 是否存在 |
| `unregister(String)` | `boolean` | 注销 Agent |
| `clear()` | `void` | 清空所有 Agent |

## 使用案例

### 基础用法

```java
// 1. 创建 Agent
ReActAgent agent = ReActAgent.builder()
    .name("assistant")
    .model(model)
    .toolkit(toolkit)
    .build();

// 2. 创建适配器
AguiAgentAdapter adapter = new AguiAgentAdapter(
    agent,
    AguiAdapterConfig.builder()
        .emitToolCallArgs(true)
        .enableReasoning(true)
        .build()
);

// 3. 创建输入
RunAgentInput input = new RunAgentInput(
    "thread-123",
    "run-456",
    List.of(new AguiMessage("user", "Hello!"))
);

// 4. 执行并获取事件流
Flux<AguiEvent> events = adapter.run(input);

// 5. 订阅事件
events.subscribe(event -> {
    switch (event.getType()) {
        case TEXT_MESSAGE_CONTENT -> {
            AguiEvent.TextMessageContent content = (AguiEvent.TextMessageContent) event;
            System.out.print(content.delta());
        }
        case TOOL_CALL_START -> {
            AguiEvent.ToolCallStart tool = (AguiEvent.ToolCallStart) event;
            System.out.println("Tool: " + tool.toolCallName());
        }
        case RUN_FINISHED -> System.out.println("\nDone!");
    }
});
```

### 使用 Registry 管理 Agent

```java
// 1. 创建 Registry
AguiAgentRegistry registry = new AguiAgentRegistry();

// 2. 注册单例 Agent
registry.register("assistant", sharedAgent);

// 3. 注册 Agent 工厂（每次请求创建新实例）
registry.registerFactory("chat", () -> ReActAgent.builder()
    .name("chat-" + UUID.randomUUID())
    .model(model)
    .build());

// 4. 获取 Agent
Optional<Agent> agent = registry.getAgent("assistant");

// 5. 创建适配器并执行
agent.ifPresent(a -> {
    AguiAgentAdapter adapter = new AguiAgentAdapter(a, config);
    adapter.run(input).subscribe(this::handleEvent);
});
```

### Spring Boot 集成

```java
@RestController
public class AguiController {
    
    private final AguiAgentRegistry registry;
    
    @PostMapping("/agui/run")
    public Flux<ServerSentEvent<AguiEvent>> runAgent(@RequestBody RunAgentInput input) {
        return registry.getAgent(input.getAgentId())
            .map(agent -> {
                AguiAgentAdapter adapter = new AguiAgentAdapter(agent, config);
                return adapter.run(input)
                    .map(event -> ServerSentEvent.<AguiEvent>builder()
                        .event(event.getType().name())
                        .data(event)
                        .build());
            })
            .orElse(Flux.empty());
    }
}
```

## 设计思路

### 核心设计理念

1. **协议标准化**
   - 基于 AG-UI 协议规范
   - 统一的事件模型，支持多种前端框架
   - 流式传输，实时响应

2. **事件驱动**
   - Agent 事件 → AGUI 事件转换
   - 增量传输（delta），减少数据量
   - 支持中断和恢复

3. **状态管理**
   - StateSnapshot：全量状态
   - StateDelta：增量状态（JSON Patch）
   - 前端可按需选择

4. **扩展性**
   - Custom 事件支持自定义扩展
   - Raw 事件透传原始数据
   - Reasoning 事件支持推理可视化

### 事件转换映射

| AgentScope 事件 | AGUI 事件 |
|-----------------|-----------|
| REASONING (TextBlock) | TEXT_MESSAGE_START/CONTENT/END |
| REASONING (ThinkingBlock) | REASONING_MESSAGE_START/CONTENT/END |
| REASONING (ToolUseBlock) | TOOL_CALL_START/ARGS |
| TOOL_RESULT | TOOL_CALL_END/RESULT |

## 优势与劣势

### 优势 ✅

| 优势 | 说明 |
|------|------|
| **标准化协议** | 前端框架无关，支持 React/Vue/Svelte 等 |
| **流式传输** | SSE 实时推送，用户体验好 |
| **增量更新** | delta 模式减少数据传输量 |
| **推理可视化** | 支持 ThinkingBlock 可视化 |
| **状态同步** | JSON Patch 增量状态更新 |
| **扩展性强** | Custom/Raw 事件支持自定义 |

### 劣势 ⚠️

| 劣势 | 说明 |
|------|------|
| **协议复杂** | 事件类型多，学习成本高 |
| **状态追踪** | 需要维护消息/工具调用的开始/结束状态 |
| **Reasoning 是 Draft** | 推理事件仍在草案阶段，可能变化 |
| **前端依赖** | 需要配套的前端 SDK |

## 源码位置

- **Adapter**: `io.agentscope.core.agui.adapter.AguiAgentAdapter`
- **Registry**: `io.agentscope.core.agui.registry.AguiAgentRegistry`
- **Event**: `io.agentscope.core.agui.event.AguiEvent`

## 关联

- [[knowledge/agentscope-java/06-扩展生态层/A2A扩展|A2A扩展]]
- [[knowledge/agentscope-java/08-集成协议/AGUI协议|AGUI协议]]
- [[knowledge/agentscope-java/05-框架入口层/ReActAgent|ReActAgent]]
- [[knowledge/agentscope-java/知识地图|知识地图]]
