
# WebFlux 线程模型概述

## 核心对比

| 维度 | Servlet (Spring MVC) | WebFlux |
|------|---------------------|---------|
| **模型** | 阻塞式 I/O | 非阻塞式 I/O |
| **线程策略** | 每请求一线程 | 事件循环 (EventLoop) |
| **并发处理** | 线程池大小限制 | 少量线程处理大量请求 |
| **背压支持** | 无 | 原生支持 |

## WebFlux 线程模型核心

### 1. EventLoop 机制

```
请求 → EventLoop 线程池 → 异步处理 → 回调返回
       (少量固定线程)    (非阻塞)   (不阻塞线程)
```

**关键特点**：
- 线程数固定（通常 = CPU 核心数）
- 线程不等待 I/O 操作完成
- 通过回调/Subscription 继续处理

### 2. 响应式流 (Reactive Streams)

- **Publisher**: 数据发布者
- **Subscriber**: 数据订阅者
- **背压 (Backpressure)**: 订阅者控制发布者流速

### 3. 线程切换场景

| 场景 | 线程行为 |
|------|---------|
| 数据库调用 | 切换到弹性调度器 |
| 阻塞操作 | 必须显式指定 publishOn |
| CPU 密集型 | 使用并行调度器 |

## 关键代码模式

```java
// 正确：非阻塞链式调用
Mono.result()
    .map(data -> transform(data))      // 在 EventLoop 线程
    .flatMap(d -> repository.save(d))  // 切换到数据库调度器
    .subscribe();

// 错误：阻塞调用会卡住 EventLoop
Mono.result()
    .map(data -> blockingCall())       // ⚠️ 阻塞 EventLoop!
    .subscribe();
```

## 与 AgentScope-Java 的关联

1. **智能体并发调度**: 多智能体并行执行需要非阻塞模型
2. **工具调用**: MCP 工具调用可能是 I/O 密集型
3. **流式响应**: 智能体输出的流式传输

## 今日待深入

- [ ] EventLoop 的具体实现机制
- [ ] Reactor 调度器类型及使用场景
- [ ] 如何避免 EventLoop 被阻塞

---

**学习日期**: 2026-02-10
**关联周总结**: [[note/2026-w06-java-learning]]
**明日主题**: EventLoop 工作机制
