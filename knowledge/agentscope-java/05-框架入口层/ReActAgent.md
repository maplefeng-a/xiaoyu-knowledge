---
id: 61c51171-0b05-463a-bb1f-1960be62221c
type: concept
title: ReActAgent
status: active
aliases: []
tags:
  - agentscope-java
refs:
  - io.agentscope.core.ReActAgent
---

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

## 源码位置

`io.agentscope.core.ReActAgent`

## 关联

- [[knowledge/agentscope-java/03-Agent能力层/Agent抽象|Agent抽象]]
- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]]
- [[knowledge/agentscope-java/02-核心抽象层/模型抽象|模型抽象]]
- [[knowledge/agentscope-java/02-核心抽象层/工具系统|工具系统]]
- [[knowledge/agentscope-java/02-核心抽象层/记忆管理|记忆管理]]
- [[knowledge/agentscope-java/知识地图|知识地图]]
