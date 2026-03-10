---
id: agentscope-pipeline
type: concept
title: Pipeline 流水线
status: active
aliases:
  - AgentPipeline
  - SequentialPipeline
tags:
  - agentscope-java
  - pipeline
  - agent-composition
refs:
  - agentscope-core/pipeline/
---

# Pipeline 流水线

> agentscope-java Agent 能力层 | Agent 编排

## 一句话

多 Agent 编排机制，支持串行、并行、条件分支等复杂工作流。

---

## 核心概念

### Pipeline 类型

| 类型 | 说明 | 用途 |
|------|------|------|
| `SequentialPipeline` | 串行执行 | 步骤依赖 |
| `FanoutPipeline` | 并行执行 | 任务分发 |
| `ConditionalPipeline` | 条件分支 | 动态路由 |

### SequentialPipeline

```
Agent A → Agent B → Agent C
```

```java
SequentialPipeline pipeline = SequentialPipeline.builder()
    .addAgent(agentA)
    .addAgent(agentB)
    .addAgent(agentC)
    .build();

Msg result = pipeline.call(input).block();
```

### FanoutPipeline

```
            → Agent B →
Agent A →               → Agent D (合并)
            → Agent C →
```

```java
FanoutPipeline pipeline = FanoutPipeline.builder()
    .sourceAgent(agentA)
    .addWorker(agentB)
    .addWorker(agentC)
    .sinkAgent(agentD)
    .build();
```

---

## MsgHub 消息分发

### 订阅机制

```java
// Agent B 订阅 Agent A
agentA.subscribe(agentB);

// Agent A 发送消息，所有订阅者收到
Msg msg = agentA.call(input).block();
// agentB.observe(msg) 自动调用
```

### 多 Agent 协作

```java
// 创建 MsgHub
MsgHub hub = new MsgHub();

// 注册 Agent
hub.register(agentA);
hub.register(agentB);
hub.register(agentC);

// 广播消息
hub.broadcast(msg);

// 定向发送
hub.send(agentA, agentB, msg);
```

---

## 使用示例

### 串行处理

```java
// 研究 → 分析 → 总结
SequentialPipeline pipeline = SequentialPipeline.builder()
    .addAgent(researchAgent)
    .addAgent(analysisAgent)
    .addAgent(summaryAgent)
    .build();

Msg result = pipeline.call(userQuery).block();
```

### 并行处理

```java
// 同时调用多个搜索 Agent
FanoutPipeline pipeline = FanoutPipeline.builder()
    .addWorker(googleSearchAgent)
    .addWorker(bingSearchAgent)
    .addWorker(baiduSearchAgent)
    .mergeStrategy(MergeStrategy.CONCAT)
    .build();

Msg result = pipeline.call(query).block();
```

---

## 源码位置

- `io.agentscope.core.pipeline.Pipeline`
- `io.agentscope.core.pipeline.SequentialPipeline`
- `io.agentscope.core.pipeline.FanoutPipeline`

---

## 关联卡片

- [[knowledge/agentscope-java/04-集成分析/多智能体协作|多智能体协作]] - 详细协作模式
- [[knowledge/agentscope-java/04-集成分析/MsgHub消息总线|MsgHub消息总线]] - 消息分发

---

## 更新记录

- 2026-03-04: 初始创建
