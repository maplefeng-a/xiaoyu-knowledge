
# ReActAgent

> agentscope-java 框架入口层 | 核心 Agent 实现

## 一句话

ReAct (Reasoning + Acting) 模式的主 Agent 实现，组合推理、行动、记忆、规划、RAG 等所有能力。

## ReAct 循环

```
用户输入
   │
   ▼
┌─────────────────────────────────────────────────────┐
│                    ReAct Loop                        │
│                                                      │
│  ┌──────────────┐    有工具调用    ┌──────────────┐  │
│  │  Reasoning   │────────────────►│   Acting     │  │
│  │  (LLM 推理)  │                  │  (执行工具)  │  │
│  └──────┬───────┘                  └──────┬───────┘  │
│         │                                │          │
│         │ 无工具调用                      │          │
│         │ 或 maxIters                    │          │
│         ▼                                │          │
│  ┌──────────────┐◄───────────────────────┘          │
│  │  Summarizing │                                    │
│  │  (生成总结)  │                                    │
│  └──────────────┘                                    │
│                                                      │
└─────────────────────────────────────────────────────┘
   │
   ▼
返回结果
```

## 核心实现

### 主循环入口

```java
@Override
protected Mono<Msg> doCall(List<Msg> msgs) {
    Set<String> pendingIds = getPendingToolUseIds();

    // 无待处理工具 → 正常处理
    if (pendingIds.isEmpty()) {
        addToMemory(msgs);
        return executeIteration(0);
    }

    // 有待处理工具 → 验证并添加工具结果
    validateAndAddToolResults(msgs, pendingIds);
    return hasPendingToolUse() ? acting(0) : executeIteration(0);
}
```

### Reasoning 阶段

```java
private Mono<Msg> reasoning(int iter, boolean ignoreMaxIters) {
    // 检查 maxIters
    if (!ignoreMaxIters && iter >= maxIters) {
        return summarizing();
    }

    return checkInterruptedAsync()
        .then(notifyPreReasoningEvent(prepareMessages()))
        .flatMapMany(event -> model.stream(
            event.getInputMessages(),
            toolkit.getToolSchemas(),
            options))
        .doOnNext(chunk -> {
            // 累积 chunks，通知流式 hooks
        })
        .then(Mono.defer(() -> Mono.justOrEmpty(context.buildFinalMessage())))
        .flatMap(this::notifyPostReasoning)
        .flatMap(event -> {
            // HITL stop
            if (event.isStopRequested()) {
                return Mono.just(msg);
            }
            // gotoReasoning (结构化输出重试)
            if (event.isGotoReasoningRequested()) {
                return reasoning(iter + 1, true);
            }
            // 检查是否完成
            if (isFinished(msg)) {
                return Mono.just(msg);
            }
            // 继续到 acting
            return acting(iter);
        });
}
```

### Acting 阶段

```java
private Mono<Msg> acting(int iter) {
    // 提取待处理的工具调用
    List<ToolUseBlock> pendingToolCalls = extractPendingToolCalls();

    if (pendingToolCalls.isEmpty()) {
        return executeIteration(iter + 1);
    }

    return notifyPreActingHooks(pendingToolCalls)
        .flatMap(this::executeToolCalls)
        .flatMap(results -> {
            // 分离成功和挂起的结果
            // 成功 → 加入 memory，继续循环
            // 挂起 → 返回 TOOL_SUSPENDED
        });
}
```

### Summarizing 阶段

```java
protected Mono<Msg> summarizing() {
    log.debug("Maximum iterations reached. Generating summary...");

    List<Msg> messageList = prepareSummaryMessages();
    // 添加提示消息
    messageList.add(Msg.builder()
        .name("user")
        .role(MsgRole.USER)
        .content(TextBlock.builder()
            .text("You have failed to generate response within the maximum iterations...")
            .build())
        .build());

    return notifyPreSummaryHook(messageList, generateOptions)
        .flatMap(event -> streamAndAccumulateSummary(...))
        .flatMap(msg -> notifyPostSummaryHook(msg, ...));
}
```

## Hook 事件

| 阶段 | Pre Hook | Post Hook | Chunk Hook |
|------|----------|-----------|------------|
| Reasoning | PreReasoningEvent | PostReasoningEvent | ReasoningChunkEvent |
| Acting | PreActingEvent | PostActingEvent | ActingChunkEvent |
| Summary | PreSummaryEvent | PostSummaryEvent | SummaryChunkEvent |

## Builder 配置

### 核心配置

```java
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .sysPrompt("You are a helpful assistant.")
    .model(model)
    .toolkit(toolkit)
    .memory(new InMemoryMemory())
    .maxIters(10)
    .build();
```

### 长期记忆

```java
ReActAgent agent = ReActAgent.builder()
    .longTermMemory(longTermMemory)
    .longTermMemoryMode(LongTermMemoryMode.BOTH)  // AGENT_CONTROL / STATIC_CONTROL / BOTH
    .build();
```

### RAG

```java
ReActAgent agent = ReActAgent.builder()
    .knowledge(knowledgeBase)
    .ragMode(RAGMode.GENERIC)  // GENERIC / AGENTIC / NONE
    .retrieveConfig(RetrieveConfig.builder()
        .limit(5)
        .scoreThreshold(0.5)
        .build())
    .build();
```

### Plan

```java
ReActAgent agent = ReActAgent.builder()
    .planNotebook(PlanNotebook.builder().build())
    // 或简化
    .enablePlan()
    .build();
```

### Skill

```java
ReActAgent agent = ReActAgent.builder()
    .skillBox(skillBox)
    .build();
```

## 状态管理

### saveTo / loadFrom

```java
@Override
public void saveTo(Session session, SessionKey sessionKey) {
    // 保存 Agent 元数据
    session.save(sessionKey, "agent_meta", new AgentMetaState(...));

    // 保存 Memory（如果托管）
    if (statePersistence.memoryManaged()) {
        memory.saveTo(session, sessionKey);
    }

    // 保存 Toolkit 状态（如果托管）
    if (statePersistence.toolkitManaged()) {
        session.save(sessionKey, "toolkit_activeGroups", new ToolkitState(...));
    }

    // 保存 PlanNotebook（如果托管）
    if (statePersistence.planNotebookManaged()) {
        planNotebook.saveTo(session, sessionKey);
    }
}
```

## HITL（人机协作）

### 中断机制

```java
// 用户中断
agent.stopAgent();

// Agent 内部处理
@Override
protected Mono<Msg> handleInterrupt(InterruptContext context, Msg... originalArgs) {
    Msg recoveryMsg = Msg.builder()
        .name(getName())
        .role(MsgRole.ASSISTANT)
        .content(TextBlock.builder()
            .text("I noticed that you have interrupted me...")
            .build())
        .build();

    memory.addMessage(recoveryMsg);
    return Mono.just(recoveryMsg);
}
```

### 工具挂起

```java
// 工具抛出 ToolSuspendException
throw new ToolSuspendException("Waiting for user confirmation");

// Agent 返回 TOOL_SUSPENDED
private Msg buildSuspendedMsg(List<Map.Entry<ToolUseBlock, ToolResultBlock>> pendingPairs) {
    return Msg.builder()
        .name(getName())
        .role(MsgRole.ASSISTANT)
        .content(content)
        .generateReason(GenerateReason.TOOL_SUSPENDED)
        .build();
}
```

## 核心对象属性

### 类成员变量

| 属性 | 类型 | 说明 |
|------|------|------|
| `memory` | `Memory` | 会话记忆，存储对话历史 |
| `sysPrompt` | `String` | 系统提示词 |
| `model` | `Model` | 语言模型实例 |
| `maxIters` | `int` | 最大迭代次数，默认 10 |
| `modelExecutionConfig` | `ExecutionConfig` | 模型调用配置（超时、重试） |
| `toolExecutionConfig` | `ExecutionConfig` | 工具执行配置（超时、重试） |
| `planNotebook` | `PlanNotebook` | 规划笔记本（可选） |
| `toolExecutionContext` | `ToolExecutionContext` | 工具执行上下文（用户身份、权限等） |
| `statePersistence` | `StatePersistence` | 状态持久化配置 |

### 继承自父类

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `String` | Agent 名称 |
| `description` | `String` | Agent 描述 |
| `toolkit` | `Toolkit` | 工具集 |
| `hooks` | `List<Hook>` | Hook 列表 |
| `structuredOutputReminder` | `StructuredOutputReminder` | 结构化输出模式 |

## 核心方法

### 公开 API

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `call(Msg... msgs)` | `Mono<Msg>` | 同步调用入口，返回最终响应 |
| `observe(Msg msg)` | `Mono<Void>` | 观察模式，只添加消息不触发推理 |
| `saveTo(Session, SessionKey)` | `void` | 保存状态到会话 |
| `loadFrom(Session, SessionKey)` | `void` | 从会话加载状态 |
| `getMemory()` | `Memory` | 获取记忆实例 |
| `getModel()` | `Model` | 获取模型实例 |
| `getMaxIters()` | `int` | 获取最大迭代次数 |
| `getPlanNotebook()` | `PlanNotebook` | 获取规划笔记本 |
| `builder()` | `Builder` | 获取 Builder 实例 |

### 核心内部方法

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `doCall(List<Msg>)` | `Mono<Msg>` | 实际执行入口 |
| `reasoning(int, boolean)` | `Mono<Msg>` | 推理阶段 |
| `acting(int)` | `Mono<Msg>` | 行动阶段 |
| `summarizing()` | `Mono<Msg>` | 总结阶段（maxIters 达成时） |
| `executeIteration(int)` | `Mono<Msg>` | 执行一次迭代 |
| `executeToolCalls(List<ToolUseBlock>)` | `Mono<List<Entry>>` | 执行工具调用 |
| `handleInterrupt(InterruptContext, Msg...)` | `Mono<Msg>` | 处理用户中断 |

## 完整使用案例

### 基础用法

```java
// 1. 创建模型
DashScopeChatModel model = DashScopeChatModel.builder()
    .apiKey(System.getenv("DASHSCOPE_API_KEY"))
    .modelName("qwen-plus")
    .build();

// 2. 创建工具集
Toolkit toolkit = new Toolkit();
toolkit.registerObject(new MyToolClass());

// 3. 构建 Agent
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .sysPrompt("You are a helpful assistant.")
    .model(model)
    .toolkit(toolkit)
    .memory(new InMemoryMemory())
    .maxIters(10)
    .build();

// 4. 调用
Msg response = agent.call(Msg.builder()
    .name("user")
    .role(MsgRole.USER)
    .content(TextBlock.builder().text("What's the weather?").build())
    .build()).block();
```

### 带长期记忆

```java
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(model)
    .toolkit(toolkit)
    .longTermMemory(new MyLongTermMemory())
    .longTermMemoryMode(LongTermMemoryMode.BOTH)  // 工具 + 自动
    .build();
```

### 带 RAG

```java
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(model)
    .toolkit(toolkit)
    .knowledge(myKnowledgeBase)
    .ragMode(RAGMode.GENERIC)  // 自动注入知识
    .retrieveConfig(RetrieveConfig.builder()
        .limit(5)
        .scoreThreshold(0.5)
        .build())
    .build();
```

### 带规划

```java
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(model)
    .toolkit(toolkit)
    .enablePlan()  // 或 .planNotebook(myPlanNotebook)
    .build();
```

### 带状态持久化

```java
// 保存状态
agent.saveTo(session, sessionKey);

// 恢复状态
agent.loadFrom(session, sessionKey);
```

### 响应式流式调用

```java
agent.call(userMsg)
    .subscribe(response -> {
        System.out.println(response.getTextContent());
    });
```

## 设计思路

### 核心设计理念

1. **ReAct 模式**
   - Reasoning（推理）：LLM 思考并决定下一步
   - Acting（行动）：执行工具调用
   - 循环迭代直到任务完成或达到 maxIters

2. **响应式架构**
   - 基于 Project Reactor（Mono/Flux）
   - 非阻塞执行，支持流式输出
   - 支持异步中断（HITL）

3. **Hook 扩展机制**
   - 每个阶段都有 Pre/Post/Chunk Hook
   - 支持第三方扩展（RAG、记忆、规划等）
   - 优先级排序执行

4. **状态可持久化**
   - 支持会话级状态保存/恢复
   - 可配置哪些组件需要持久化

### 架构分层

```
ReActAgent
    ├── Model（推理）
    ├── Toolkit（行动）
    ├── Memory（记忆）
    ├── Hooks（扩展）
    │   ├── RAG Hook
    │   ├── LongTermMemory Hook
    │   ├── Plan Hook
    │   └── Skill Hook
    └── StatePersistence（持久化）
```

## 优势与劣势

### 优势 ✅

| 优势 | 说明 |
|------|------|
| **响应式** | 非阻塞执行，支持流式输出，适合高并发场景 |
| **可扩展** | Hook 机制支持灵活扩展（RAG、记忆、规划） |
| **HITL 支持** | 原生支持人机协作，可中断、挂起工具 |
| **状态管理** | 支持会话级持久化，可实现多轮对话恢复 |
| **组合能力** | 通过 Builder 模式组合多种能力（记忆+RAG+规划） |
| **结构化输出** | 支持 JSON Schema 约束的输出格式 |

### 劣势 ⚠️

| 劣势 | 说明 |
|------|------|
| **复杂度高** | 涉及响应式编程，学习曲线较陡 |
| **调试困难** | 异步流式执行，调试链路复杂 |
| **maxIters 依赖** | 达到 maxIters 才触发 summarizing，可能中断任务 |
| **工具调用验证严格** | 工具结果必须匹配 pending IDs，部分结果限制多 |
| **Memory 不可替换** | 构建后无法替换 Memory，需重建 Agent |

## 源码位置

`io.agentscope.core.ReActAgent`

## 关联

- [[knowledge/agentscope-java/03-Agent能力层/Agent抽象|Agent抽象]]
- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]]
- [[knowledge/agentscope-java/02-核心抽象层/模型抽象|模型抽象]]
- [[knowledge/agentscope-java/02-核心抽象层/工具系统|工具系统]]
- [[knowledge/agentscope-java/02-核心抽象层/记忆管理|记忆管理]]
- [[knowledge/agentscope-java/知识地图|知识地图]]
