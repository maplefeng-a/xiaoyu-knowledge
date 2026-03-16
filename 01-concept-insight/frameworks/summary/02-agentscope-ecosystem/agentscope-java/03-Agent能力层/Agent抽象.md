
# Agent 抽象

> agentscope-java Agent 能力层 | 智能体核心接口

## 一句话

Agent 基类体系，定义智能体的三种核心能力：同步调用、流式响应、消息观察。

---

## 接口层次

```
Agent (完整接口)
├── CallableAgent      // call() - 同步调用
├── StreamableAgent    // stream() - 流式调用
└── ObservableAgent    // observe() - 观察消息

AgentBase (抽象基类)
├── 实现 Agent 所有接口
├── Hook 管理
├── 中断机制
├── 状态管理 (StateModule)
└── Tracing 集成
```

---

## 三种调用方式

| 方法 | 返回类型 | 用途 |
|------|----------|------|
| `call(List<Msg>)` | `Mono<Msg>` | 同步调用，等待完整响应 |
| `stream(List<Msg>)` | `Flux<Event>` | 流式调用，实时获取事件 |
| `observe(List<Msg>)` | `Mono<Void>` | 观察消息，不生成回复 |

---

## CallableAgent 接口

```java
public interface CallableAgent {
    // 基础调用
    Mono<Msg> call(List<Msg> msgs);
    Mono<Msg> call(Msg msg);
    Mono<Msg> call(Msg... msgs);
    Mono<Msg> call();  // 继续生成，不添加新输入
    
    // 结构化输出
    Mono<Msg> call(List<Msg> msgs, Class<?> structuredModel);
    Mono<Msg> call(List<Msg> msgs, JsonNode schema);
}
```

### 使用示例

```java
// 单消息调用
Msg response = agent.call(userMsg).block();

// 多消息调用
Msg response = agent.call(msg1, msg2, msg3).block();

// 继续生成
Msg continuation = agent.call().block();

// 结构化输出
TaskPlan plan = agent.call(userMsg, TaskPlan.class)
    .block()
    .getStructuredData(TaskPlan.class);
```

---

## StreamableAgent 接口

```java
public interface StreamableAgent {
    // 流式调用
    Flux<Event> stream(List<Msg> msgs, StreamOptions options);
    Flux<Event> stream(Msg msg);
    Flux<Event> stream(Msg msg, StreamOptions options);
    
    // 结构化输出
    Flux<Event> stream(List<Msg> msgs, StreamOptions options, Class<?> structuredModel);
}
```

### Event 类型

```java
public class Event {
    public enum Type {
        REASONING,      // 推理过程
        TOOL_CALL,      // 工具调用
        TOOL_RESULT,    // 工具结果
        RESPONSE,       // 最终响应
        ERROR           // 错误
    }
    
    Type type;
    Msg message;
    String content;
}
```

### 使用示例

```java
agent.stream(userMsg)
    .filter(e -> e.type == Event.Type.RESPONSE)
    .subscribe(e -> {
        System.out.println(e.message.getTextContent());
    });

// 处理所有事件
agent.stream(userMsg)
    .subscribe(event -> {
        switch (event.type) {
            case REASONING -> System.out.println("Thinking: " + event.content);
            case TOOL_CALL -> System.out.println("Calling: " + event.content);
            case RESPONSE -> System.out.println("Response: " + event.message.getTextContent());
        }
    });
```

---

## ObservableAgent 接口

```java
public interface ObservableAgent {
    Mono<Void> observe(Msg msg);
    Mono<Void> observe(List<Msg> msgs);
}
```

### 用途

**多智能体协作场景：** Agent 可以监听其他 Agent 的消息，不生成回复

```java
// Agent A 发送消息
Msg msgA = agentA.call(userMsg).block();

// Agent B 观察消息（学习/记录）
agentB.observe(msgA).subscribe();

// Agent C 也观察
agentC.observe(msgA).subscribe();
```

---

## AgentBase 核心能力

### 1. Hook 管理

```java
// 添加 Hook
agent.addHook(new MyHook());

// 系统级 Hook（所有 Agent 共享）
AgentBase.addSystemHook(new LoggingHook());
```

### 2. 中断机制

```java
// 外部调用中断
agent.interrupt();
agent.interrupt(userMessage);

// Agent 内部检查点
protected Mono<Void> checkInterruptedAsync() {
    if (interruptFlag.get()) {
        return Mono.error(new InterruptedException());
    }
    return Mono.empty();
}
```

### 3. 状态管理

```java
// StateModule 实现
Map<String, Object> state = agent.getState();
agent.setState(state);
```

### 4. Tracing 集成

```java
// 自动追踪调用链
TracerRegistry.get().startSpan("agent_call");
```

---

## 线程安全

**重要：** Agent 实例不支持并发执行

```java
// ❌ 错误：同一 Agent 并发调用
agent.call(msg1).subscribe();
agent.call(msg2).subscribe();  // 不安全！

// ✅ 正确：串行调用
agent.call(msg1)
    .then(agent.call(msg2))
    .subscribe();
```

---

## 完整示例

### 同步调用

```java
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(model)
    .toolkit(toolkit)
    .build();

// 简单调用
Msg response = agent.call(Msg.builder()
    .role(MsgRole.USER)
    .textContent("Hello!")
    .build()).block();

System.out.println(response.getTextContent());
```

### 流式调用

```java
agent.stream(userMsg)
    .doOnNext(event -> {
        if (event.type == Event.Type.TOOL_CALL) {
            System.out.println("🔧 " + event.content);
        } else if (event.type == Event.Type.RESPONSE) {
            System.out.println("💬 " + event.message.getTextContent());
        }
    })
    .blockLast();
```

### 结构化输出

```java
public class TaskPlan {
    public String goal;
    public List<String> steps;
}

Msg response = agent.call(userMsg, TaskPlan.class).block();
TaskPlan plan = response.getStructuredData(TaskPlan.class);
System.out.println("Goal: " + plan.goal);
```

---

## 源码位置

- `io.agentscope.core.agent.Agent`
- `io.agentscope.core.agent.AgentBase`
- `io.agentscope.core.agent.CallableAgent`
- `io.agentscope.core.agent.StreamableAgent`
- `io.agentscope.core.agent.ObservableAgent`
- `io.agentscope.core.agent.Event`

---

## 关联卡片

- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]] - Agent 的可观测性
- [[knowledge/agentscope-java/03-Agent能力层/HITL人机协作|HITL人机协作]] - 中断机制
- [[knowledge/agentscope-java/05-框架入口层/ReActAgent|ReActAgent]] - 具体实现

---

## 更新记录

- 2026-03-04: 基于源码深度更新
