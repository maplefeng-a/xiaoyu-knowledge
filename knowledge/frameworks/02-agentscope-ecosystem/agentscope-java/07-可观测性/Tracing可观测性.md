
# Tracing 可观测性

> agentscope-java 分布式链路追踪

## 一句话

基于 OpenTelemetry 的分布式链路追踪，实现 Agent 执行全链路可观测性。

## 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tracing 架构                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Agent 执行链路                         │    │
│  │                                                          │    │
│  │   call() → reasoning() → acting() → summarizing()       │    │
│  │      │         │            │            │               │    │
│  │      ▼         ▼            ▼            ▼               │    │
│  │   Span      Span         Span        Span               │    │
│  │      │         │            │            │               │    │
│  │      └─────────┴────────────┴────────────┘               │    │
│  │                     │                                    │    │
│  └─────────────────────┼────────────────────────────────────┘    │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              OpenTelemetry SDK                           │    │
│  │   - SpanProcessor                                        │    │
│  │   - SpanExporter                                         │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 后端存储                                  │    │
│  │   Jaeger / Zipkin / Prometheus / 云服务                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 核心对象

### Span 类型

| Span 名称 | 说明 | 属性 |
|-----------|------|------|
| `agent.call` | Agent 调用 | agent.name, agent.id |
| `agent.reasoning` | 推理阶段 | model.name, tokens |
| `agent.acting` | 行动阶段 | tool.name, tool.id |
| `agent.summarizing` | 总结阶段 | iterations |
| `tool.execute` | 工具执行 | tool.name, duration |

### 关键属性

```java
// Agent 属性
attributes.put("agent.name", agent.getName());
attributes.put("agent.id", agent.getAgentId());

// Model 属性
attributes.put("model.name", model.getModelName());
attributes.put("model.tokens.input", inputTokens);
attributes.put("model.tokens.output", outputTokens);

// Tool 属性
attributes.put("tool.name", toolUse.getName());
attributes.put("tool.id", toolUse.getId());
attributes.put("tool.status", "success" / "error");
```

## 使用案例

### 基础配置

```java
// 配置 OpenTelemetry
OpenTelemetry openTelemetry = OpenTelemetrySdk.builder()
    .setTracerProvider(TracerProviderSdk.builder()
        .addSpanProcessor(BatchSpanProcessor.builder(
            OtlpGrpcSpanExporter.builder()
                .setEndpoint("http://localhost:4317")
                .build())
            .build())
        .build())
    .build();

// 注册到 AgentScope
TracingProvider.setOpenTelemetry(openTelemetry);
```

### 与 Agent 集成

```java
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(model)
    .toolkit(toolkit)
    .build();

// 调用会自动产生 Trace
Msg response = agent.call(userMsg).block();

// 在 Jaeger/Zipkin 中查看链路
```

### 自定义 Span

```java
// 在 Hook 中添加自定义 Span
public class CustomTracingHook implements Hook {
    
    @Override
    public <T extends HookEvent> Mono<T> onEvent(T event) {
        if (event instanceof PreReasoningEvent) {
            Span span = tracer.spanBuilder("custom.operation")
                .setAttribute("custom.key", "value")
                .startSpan();
            // ... 业务逻辑
            span.end();
        }
        return Mono.just(event);
    }
}
```

## 优势与劣势

### 优势 ✅

| 优势 | 说明 |
|------|------|
| **全链路追踪** | 从 call 到 tool 执行完整链路 |
| **标准化** | 基于 OpenTelemetry，生态兼容 |
| **性能分析** | 定位性能瓶颈 |
| **错误追踪** | 快速定位错误原因 |

### 劣势 ⚠️

| 劣势 | 说明 |
|------|------|
| **性能开销** | 有少量性能开销 |
| **存储成本** | 需要存储 Trace 数据 |
| **配置复杂** | 需要部署后端服务 |

## 源码位置

`io.agentscope.core.tracing.*`

## 关联

- [[knowledge/agentscope-java/07-可观测性/Studio可视化|Studio可视化]]
- [[knowledge/tracing-basics|Tracing 可观测性基础]]
