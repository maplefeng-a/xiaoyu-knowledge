
# MsgHub 消息总线

> agentscope-java 核心组件 | 多智能体协作基础设施

## 一句话

内存级消息广播中心，自动管理多智能体之间的消息订阅与分发，无需手动传递消息。

## 核心定位

- **自动化**：消息自动广播，无需手动 `observe()`
- **响应式**：全链路 `Mono/Flux`，非阻塞
- **动态管理**：运行时添加/移除参与者
- **生命周期**：`enter()/exit()` + try-with-resources

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                       MsgHub                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ Alice   │◄─┤ 广播中心 ├─►│ Bob     │                 │
│  │ Agent   │  │ (自动)  │  │ Agent   │                 │
│  └────┬────┘  └────┬────┘  └────┬────┘                 │
│       │            │            │                       │
│       │      ┌─────▼─────┐      │                       │
│       └─────►│ Charlie   │◄─────┘                       │
│              │ Agent     │                              │
│              └───────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## 核心机制

### 1. 自动广播

```java
// 无需 MsgHub（冗长且容易出错）
Msg aliceReply = alice.call().block();
bob.observe(aliceReply).block();
charlie.observe(aliceReply).block();

// 使用 MsgHub（简洁且自动化）
try (MsgHub hub = MsgHub.builder()
        .participants(alice, bob, charlie)
        .build()) {
    hub.enter().block();
    alice.call().block();  // Bob 和 Charlie 自动收到
}
```

### 2. 订阅者管理

```java
// 内部实现：resetSubscribers()
private void resetSubscribers() {
    if (enableAutoBroadcast) {
        for (AgentBase agent : participants) {
            List<AgentBase> others = participants.stream()
                .filter(a -> !a.equals(agent))
                .collect(Collectors.toList());
            agent.resetSubscribers(name, others);  // 每个Agent订阅其他所有Agent
        }
    }
}
```

### 3. 生命周期

| 方法 | 作用 |
|------|------|
| `enter()` | 设置订阅关系，广播公告消息 |
| `exit()` | 清理订阅关系 |
| `close()` | AutoCloseable 实现，自动调用 exit() |

## API 详解

### Builder 方法

| 方法 | 描述 | 默认值 |
|------|------|--------|
| `name(String)` | Hub 名称 | UUID |
| `participants(AgentBase...)` | 参与者（必需） | - |
| `announcement(Msg...)` | 入口公告消息 | 无 |
| `enableAutoBroadcast(boolean)` | 自动广播开关 | `true` |

### 实例方法

| 方法 | 返回类型 | 描述 |
|------|----------|------|
| `enter()` | `Mono<MsgHub>` | 进入上下文 |
| `exit()` | `Mono<Void>` | 退出上下文 |
| `add(AgentBase...)` | `Mono<Void>` | 动态添加参与者 |
| `delete(AgentBase...)` | `Mono<Void>` | 动态移除参与者 |
| `broadcast(Msg)` | `Mono<Void>` | 手动广播消息 |
| `setAutoBroadcast(boolean)` | `void` | 切换自动广播 |

## 使用模式

### 模式1：标准多智能体对话

```java
try (MsgHub hub = MsgHub.builder()
        .name("Discussion")
        .participants(alice, bob, charlie)
        .announcement(announcement)
        .build()) {

    hub.enter().block();

    alice.call().block();   // Bob, Charlie 自动收到
    bob.call().block();     // Alice, Charlie 自动收到
    charlie.call().block(); // Alice, Bob 自动收到
}
```

### 模式2：动态参与者

```java
try (MsgHub hub = MsgHub.builder()
        .participants(alice, bob)
        .build()) {

    hub.enter().block();
    alice.call().block();

    // 中途加入
    hub.add(charlie).block();

    alice.call().block();  // 现在 Charlie 也会收到
}
```

### 模式3：手动广播控制

```java
try (MsgHub hub = MsgHub.builder()
        .participants(alice, bob, charlie)
        .enableAutoBroadcast(false)  // 关闭自动广播
        .build()) {

    hub.enter().block();

    Msg reply = alice.call().block();
    hub.broadcast(reply).block();  // 手动广播
}
```

### 模式4：完全响应式

```java
MsgHub hub = MsgHub.builder()
        .participants(alice, bob, charlie)
        .announcement(announcement)
        .build();

hub.enter()
    .then(alice.call())
    .doOnSuccess(msg -> log.info("Alice: {}", msg.getTextContent()))
    .then(bob.call())
    .doOnSuccess(msg -> log.info("Bob: {}", msg.getTextContent()))
    .then(hub.exit())
    .block();
```

## 重要提示

### 使用 MultiAgentFormatter

```java
// 必须使用 MultiAgentFormatter 而非标准格式化器
DashScopeChatModel model = DashScopeChatModel.builder()
    .formatter(new DashScopeMultiAgentFormatter())  // 关键！
    .build();
```

### 线程安全

- 使用 `CopyOnWriteArrayList` 管理参与者
- 但单个 Agent 实例不应被并发调用

## 源码位置

`io.agentscope.core.pipeline.MsgHub`

## 关联

- [[knowledge/agentscope-java/04-集成分析/多智能体协作|多智能体协作]]
- [[knowledge/agentscope-java/03-Agent能力层/Agent抽象|Agent抽象]]
- [[knowledge/agentscope-java/知识地图|知识地图]]
