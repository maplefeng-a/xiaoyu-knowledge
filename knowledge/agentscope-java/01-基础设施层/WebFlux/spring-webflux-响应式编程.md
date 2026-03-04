# Spring WebFlux 响应式编程

> WebFlux 是 Spring 的响应式 Web 框架，核心是**数据驱动、声明式流水线**，异步只是实现手段。

## 核心概念

### 传统 vs 响应式

| 传统命令式 | 响应式 |
|-----------|--------|
| Pull（拉）：我请求数据 | Push（推）：数据通知我 |
| 我控制流程 | 数据流控制流程 |
| 描述"怎么做" | 描述"数据怎么流动" |

### Mono 和 Flux

| 类型 | 含义 | Python 对应 |
|------|------|-------------|
| `Mono<T>` | 0 或 1 个元素 | `await T` |
| `Flux<T>` | 0 到 N 个元素流 | `AsyncGenerator[T]` |

```java
// Mono - 单个结果
Mono.just("Tom")
    .map(s -> s.toUpperCase())
    .subscribe(System.out::println);

// Flux - 流式结果
Flux.just("A", "B", "C")
    .filter(s -> s.length() > 0)
    .subscribe(System.out::println);
```

## 常用操作符

### 创建
- `just()`, `empty()`, `error()`
- `fromIterable()`, `range()`, `interval()`

### 转换
- `map()` - 同步转换
- `flatMap()` - 异步转换并展平
- `filter()` - 过滤

### 组合
- `zipWith()` - 合并两个流
- `concat()` - 连接流
- `then()` - 等待完成后执行

### 错误处理
- `onErrorReturn()` - 出错返回默认值
- `onErrorResume()` - 出错切换备选流
- `retry()` - 重试

### 消费
- `subscribe()` - 订阅
- `block()` - 阻塞获取

## 与传统 Spring MVC 对比

| 维度 | Spring MVC | WebFlux |
|------|-----------|---------|
| 返回类型 | 直接对象 | Mono/Flux |
| 代码风格 | 命令式 | 声明式链式 |
| 线程模型 | 每请求一线程 | 事件循环 |
| 容器 | Tomcat | Netty |

## 何时选择 WebFlux

| 场景 | 推荐 |
|------|------|
| 高并发、I/O 密集 | ✅ WebFlux |
| 流式响应 (SSE) | ✅ WebFlux |
| 传统 CRUD | ❌ MVC 足够 |

## Java 异步方式对比

| 方式 | 改动程度 |
|------|---------|
| CompletableFuture | 中 |
| WebFlux | 大（范式转变） |
| 虚拟线程 (Java 21) | 小 |

**虚拟线程是 Java 21 的新方案，写法和同步代码一样，底层自动异步。**

## assistant-agent 中的实践

```java
// ChatService.java - 全链路响应式
public Mono<ChatResult> chat(String sessionId, String question) {
    return agent.call(userMsg)          // agentscope 返回 Mono
        .map(response -> ...)            // 链式处理
        .onErrorResume(...);
}

public Flux<StreamEvent> chatStream(...) {
    return agent.stream(userMsg)         // agentscope 返回 Flux
        .flatMap(event -> ...);
}
```

## agentscope-java 异步支持

```java
// CallableAgent 接口
Mono<Msg> call(List<Msg> msgs);

// StreamableAgent 接口
Flux<Event> stream(List<Msg> msgs, StreamOptions options);
```

**agentscope-java 从设计上就是全响应式的。**

## 关键理解

> **响应式 = 数据驱动，异步 = 实现手段**
> 
> WebFlux 的本质是**声明式数据流**的思维方式，不是简单的语法变化。

## 关联

- Spring 全家桶
- Reactor 操作符
- 虚拟线程 (Java 21)
