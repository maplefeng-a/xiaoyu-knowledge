# assistant-agent 异步流程完整拆解

> 从 HTTP 请求到 LLM 调用，整条链路都是 `Flux/Mono` 响应式流，没有线程阻塞，事件到达即处理。

## 整体架构

```
用户请求 → ChatController → ChatService → ReActAgent → OpenAIChatModel
   │            Flux           Flux          Flux          Flux
   │                                          │
   │                                    agentscope-java
   │                                          全异步
   └──────────────────────────────────────────────────────►
```

## 各层返回类型

| 层级 | 组件 | 返回类型 |
|------|------|---------|
| Controller | ChatController | `Flux<StreamEvent>` |
| Service | ChatService | `Flux<StreamEvent>` |
| Agent | ReActAgent | `Flux<Event>` |
| Model | OpenAIChatModel | `Flux<ChatCompletionChunk>` |

## Layer 1: Controller

```java
@PostMapping(path = "/stream", produces = TEXT_EVENT_STREAM_VALUE)
public Flux<StreamEvent> chatStream(@RequestBody ChatRequest request) {
    return chatService.chatStream(request.sessionId(), request.question(), requestId);
}
```

**关键点**：立即返回 Flux，不阻塞线程，Spring 自动处理 SSE。

## Layer 2: Service

```java
public Flux<StreamEvent> chatStream(String sessionId, String question, String requestId) {
    ReActAgent agent = getOrCreateAgent(sessionId);
    Msg userMsg = buildMessage(question);

    return agent.stream(userMsg, STREAM_OPTIONS)
        .flatMap(event -> toStreamEvent(event))
        .concatWith(metricsEvent())
        .onErrorResume(error -> handleError(error));
}
```

**关键点**：链式响应式操作符，整个流程不阻塞。

## Layer 3: agentscope-java Agent

```java
// StreamableAgent 接口
public interface StreamableAgent {
    Flux<Event> stream(List<Msg> msgs, StreamOptions options);
}

// ReActAgent 推理循环
private Flux<Event> runReActLoop(List<Msg> msgs, StreamOptions options) {
    return model.chatStream(msgs)
        .flatMap(chunk -> parseAndEmit(chunk))
        .flatMap(event -> {
            if (event.hasToolCall()) {
                return executeTool(event).concatWith(continueLoop());
            }
            return Mono.just(event);
        })
        .takeUntil(Event::isFinal);
}
```

**关键点**：LLM 调用、工具执行都是异步，推理循环是响应式流。

## Layer 4: LLM Model

```java
public Flux<ChatCompletionChunk> chatStream(List<Msg> msgs) {
    return webClient.post()
        .uri("/chat/completions")
        .bodyValue(buildRequest(msgs))
        .retrieve()
        .bodyToFlux(ChatCompletionChunk.class);
}
```

**关键点**：WebClient 异步 HTTP，每个 token 到达都会发射事件。

## 事件流时序

```
客户端        Controller       ChatService       ReActAgent        LLM
  │              │                 │                 │              │
  │──POST /stream────────────────►│                 │              │
  │              │  Flux<StreamEvent>               │              │
  │              │◄────────────────│                 │              │
  │              │                 │──stream()──────►│              │
  │              │                 │                 │──chatStream─►│
  │              │                 │                 │              │
  │◄──────────REASONING────────────│◄────────────────│◄──token1────│
  │◄──────────REASONING────────────│◄────────────────│◄──token2────│
  │◄──────────TOOL_RESULT──────────│◄────────────────│◄──tool_call─│
  │              │                 │                 │──执行工具───►│
  │◄──────────REASONING────────────│◄────────────────│◄──token3────│
  │◄──────────ANSWER───────────────│◄────────────────│◄──final─────│
  │◄──────────METRICS──────────────│◄────────────────│              │
```

## 线程模型对比

| 模型 | 特点 | 并发能力 |
|------|------|---------|
| WebFlux (Netty) | 事件循环，非阻塞 | 少量线程处理大量连接 |
| 传统 MVC | 每请求一线程，阻塞 | 线程数 = 并发数 |

## 关键异步点

| 层级 | 异步操作 | 返回类型 |
|------|---------|---------|
| Controller | 流式响应 | `Flux<StreamEvent>` |
| Service | 链式调用 | `Flux<StreamEvent>` |
| Agent | 推理循环 | `Flux<Event>` |
| LLM Model | HTTP 调用 | `Flux<Chunk>` |
| Tool | MCP 工具调用 | `Mono<String>` |

## Examples（我做过的）

- [assistant-agent] ChatController 流式对话接口
- [assistant-agent] ChatService 响应式链路
- [agentscope-java] ReActAgent 全异步推理

## 关联

- Spring WebFlux 响应式编程
- agentscope-java 架构设计
- SSE (Server-Sent Events)
