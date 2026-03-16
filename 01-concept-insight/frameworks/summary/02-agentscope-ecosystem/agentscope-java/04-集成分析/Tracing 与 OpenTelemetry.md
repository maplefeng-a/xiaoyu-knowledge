
# Tracing 与 OpenTelemetry

## 探索摘要

本次探索对象是 `agentscope-java` 中的 `tracing` 模块，研究重点包括模块在代码结构中的位置、整体设计思路、核心源码机制，以及在 `Studio` 和 `Langfuse` 中的典型接入方式。

初步确认，`tracing` 不是独立业务模块，而是一层横切 Agent 运行时主链路的可观测性基础设施。它在代码结构上采用“`core` 定义抽象，`extension` 提供实现”的分层方式：

- `agentscope-core` 提供 tracing 抽象与运行时注册机制
- `agentscope-extensions-studio` 提供基于 OpenTelemetry 的具体实现
- `studio` 集成层与 `examples` 提供启用入口

框架默认只在 `Agent / Model / Tool / Formatter` 四类关键边界上织入 tracing，目标是用最小关键边界集覆盖一条完整的 agent 执行主链路，避免追踪粒度过细导致噪声过高。

从运行机制看，`tracing` 的关键不只是“创建 span”，而是“在 Reactor 异步链路中持续传播 tracing 上下文”。`TracerRegistry` 通过 Reactor 的全局 hook，在异步信号传递前恢复上下文；`TelemetryTracer` 则在具体边界上读取父上下文、创建新 span、写回新上下文，并在结束时补齐属性。

从接入方式看，当前已确认两条典型路径：

- `Studio` 自动接入：初始化 Studio 时自动注册 `TelemetryTracer`
- `Langfuse` 手动接入：手工指定 OTLP endpoint 和认证 header，注册 `TelemetryTracer`

两者底层复用的是同一套 OTel tracing 机制，差异主要在初始化入口和最终接收后端。

## 学习过程

### 1. 模块定位与代码结构

`tracing` 在 `agentscope-java` 中属于运行时可观测性基础设施，不直接参与业务推理或 Agent 决策。

核心代码位置分为三层：

- 抽象与运行时层：`agentscope-core/src/main/java/io/agentscope/core/tracing`
- 遥测实现层：`agentscope-extensions/agentscope-extensions-studio/.../tracing/telemetry`
- 接入入口层：`studio` 集成与 `agentscope-examples`

这种结构说明框架有意将 tracing 抽象保留在 `core`，而将具体观测后端适配放在扩展层，避免核心运行时直接绑定某一个观测平台。

### 2. 核心抽象：Tracer

`Tracer` 是 tracing 的 SPI，定义了 4 个关键拦截点：

- `callAgent`
- `callModel`
- `callTool`
- `callFormat`

另有 `runWithContext` 用于在异步回调执行前恢复 tracing 上下文。

这 4 个边界并不是“所有可追踪点”，而是“最能重建一次 agent 执行主链路的最小关键边界集”。对应的主干链路可以理解为：

`输入 -> Agent -> Formatter -> Model -> Tool(可选) -> 输出`

其中将 `Formatter` 纳入追踪，说明框架不仅关心模型调用，还关心消息如何被转换为具体模型协议请求。

`NoopTracer` 是默认空实现，表明 tracing 能力默认存在，但默认不启用实际观测行为。

### 3. 运行时中枢：TracerRegistry

`TracerRegistry` 负责：

- 全局注册当前 tracer
- 在启用真实 tracer 时打开 Reactor 全局 hook
- 在停用时关闭该 hook

其设计成全局单例的原因在于 tracing 被定义为运行时全局能力，而不是局部依赖。这样整条跨 `Agent / Model / Tool` 的调用链都可以使用同一套 tracing 策略，避免局部 tracer 造成上下文割裂。

`TracerRegistry` 的关键价值不只是保存 tracer，而是在响应式异步执行模型下，为 tracing 提供统一的上下文恢复机制。它通过 `Hooks.onEachOperator(...)` 拦截 Reactor operator，并在 `onNext / onError / onComplete` 前调用 `runWithContext(...)`，从当前 Reactor `Context` 中恢复 tracing 上下文。

本质上，Reactor pipeline 中传递的是“当前 trace 的上下文句柄”，而不是最终 trace 结果。每个阶段都会从同一条 pipeline 的 `Context` 中取出当前 tracing 上下文，继续创建新的 span，再把更新后的上下文写回链路。

### 4. 具体实现：TelemetryTracer

`TelemetryTracer` 是 tracing 的 OpenTelemetry 实现，负责将 AgentScope 的运行时边界映射为 span，并通过 OTLP exporter 导出。

它在 `callAgent / callModel / callTool / callFormat` 上基本都遵循同一套模板：

- 从当前 Reactor `Context` 读取父 tracing 上下文
- 创建当前阶段 span
- 将当前 span 对应的新上下文写回 pipeline
- 执行原始业务逻辑
- 在成功/失败/结束时补齐属性并结束 span

其中：

- `callAgent` 表示一次 agent 级调用
- `callModel` 表示一次模型调用
- `callTool` 表示一次工具执行
- `callFormat` 表示一次格式化动作

`callFormat` 是同步逻辑，使用当前 OTel scope；其余主要依赖 Reactor Context 维持异步链路连续性。

### 5. 流式模型响应处理

模型调用通常返回 `Flux<ChatResponse>`，因此 `TelemetryTracer` 不会在第一个 chunk 到来时立即写最终结果，而是借助 `StreamChatResponseAggregator` 先聚合流式响应。

聚合内容包括：

- 文本片段
- thinking 片段
- tool call 片段
- token usage
- finish reason

待整个流完成后，再生成一个完整的 `ChatResponse` 视图并统一写入 span。这样观测后端看到的是“一次完整模型调用”，而不是一组零散的 chunk 事件。

### 6. 语义建模：AttributesExtractors

`AttributesExtractors` 负责将 AgentScope 的内部对象转换为 OTel `Attributes`，是整套设计中的“语义翻译层”。

它覆盖的主要信息包括：

- Agent：id、name、description、输入消息、输出消息
- Model：provider、model、generate options、输入消息、tool definitions、finish reason、token usage、输出消息
- Tool：tool call id、tool name、arguments、description、result
- Formatter：格式化目标、输入、输出

属性体系采用“双层设计”：

- OpenTelemetry GenAI 标准字段
- AgentScope 自定义字段，如 `agentscope.function.name`、`agentscope.function.input`、`agentscope.function.output`

这种设计的意义在于：

- 用标准字段保持对外部观测平台的兼容性
- 用自定义字段保留框架特有的运行时语义

因此 tracing 不只是性能层面的调用记录，而是可读、可解释的 AI 运行时观测数据。

### 7. 典型应用：Studio 与 Langfuse

当前已确认两种典型接入模式。

第一种是 `Studio` 自动接入。  
在 `StudioManager` 初始化成功后，会根据 `StudioConfig` 推导 trace endpoint，并自动注册 `TelemetryTracer`。这属于框架内置生态的默认观测入口。

第二种是 `Langfuse` 手动接入。  
在 `LangfuseExample` 中，通过手工设置 Langfuse 的 OTLP endpoint，并附加 Basic Auth header，构造并注册 `TelemetryTracer`。这属于外部观测平台接入方式。

两者并不是两套不同 tracing 架构，而是同一套 OTel tracing 数据的不同消费端：

- `agentscope-java` 负责采集并导出 trace
- `Studio` / `Langfuse` 负责接收、解析与展示

### 8. 关键设计取舍

优势：

- 统一覆盖 agent 执行主链路
- 对调用方侵入较低
- 支持跨 Reactor 异步链路持续追踪
- 能同时兼容 OTel 标准与框架自身语义

代价：

- `TracerRegistry` 为全局单例，配置粒度较粗
- Reactor global hook 会影响后续所有 operator，存在全局副作用
- 开启 hook 会增加上下文捕获与恢复开销
- 更适合在启动时确定 tracing 策略，不适合高频切换多套策略

## 参考材料

### 已有知识库

- `knowledge/agentscope-java/知识地图.md`
- `knowledge/agentscope-java/03-Agent能力层/Hook系统.md`

### 本地源码仓库

- `agentscope-core/src/main/java/io/agentscope/core/tracing/Tracer.java`
- `agentscope-core/src/main/java/io/agentscope/core/tracing/TracerRegistry.java`
- `agentscope-core/src/main/java/io/agentscope/core/tracing/NoopTracer.java`
- `agentscope-extensions/agentscope-extensions-studio/src/main/java/io/agentscope/core/tracing/telemetry/TelemetryTracer.java`
- `agentscope-extensions/agentscope-extensions-studio/src/main/java/io/agentscope/core/tracing/telemetry/AttributesExtractors.java`
- `agentscope-extensions/agentscope-extensions-studio/src/main/java/io/agentscope/core/tracing/telemetry/StreamChatResponseAggregator.java`
- `agentscope-extensions/agentscope-extensions-studio/src/main/java/io/agentscope/core/tracing/telemetry/AgentScopeIncubatingAttributes.java`
- `agentscope-extensions/agentscope-extensions-studio/src/main/java/io/agentscope/core/tracing/telemetry/GenAiIncubatingAttributes.java`
- `agentscope-extensions/agentscope-extensions-studio/src/main/java/io/agentscope/core/studio/StudioManager.java`
- `agentscope-extensions/agentscope-extensions-studio/src/main/java/io/agentscope/core/studio/StudioConfig.java`
- `agentscope-examples/advanced/src/main/java/io/agentscope/examples/advanced/LangfuseExample.java`
- `agentscope-core/src/test/java/io/agentscope/core/tracing/TracerContextPropagationTest.java`
- `agentscope-extensions/agentscope-extensions-studio/src/test/java/io/agentscope/core/tracing/telemetry/TelemetryTracerTest.java`

### 外部概念

- OpenTelemetry：用于表达 trace / span / context / attributes / exporter 的通用可观测性标准
- Langfuse：支持接收 OTel/OTLP tracing 数据的外部观测后端

## 实践补充

- 当前卡片基于源码级学习和示例分析，尚未在 `assistant-agent` 中完成一次真实 tracing 接入验证。
- 后续实践可优先验证两条路径：
  - 在本地启用 Studio，观察 trace 是否可从 agent 调用一路串联到 model / tool
  - 参照 `LangfuseExample` 对接 Langfuse，验证 OTel attributes 在外部平台中的展示效果
- 接入时需重点关注：
  - Reactor global hook 的性能影响
  - 全局 tracer 注册对多运行场景的影响
  - 输入输出内容写入 attributes 后的数据体积与敏感信息暴露风险
- 若后续在真实项目中完成接入，建议补充：
  - 实际 trace 层级截图或链路观察结果
  - 常见断链场景
  - attributes 过重时的裁剪策略
