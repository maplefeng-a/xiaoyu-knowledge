
# Tracing 可观测性基础

> agentscope-java 扩展能力 | 创建：2026-03-XX | 状态：待学习

## 一句话

基于 OpenTelemetry 的链路追踪系统，记录 Agent 执行的完整调用链与性能指标。

## 核心概念

### 为什么需要 Tracing

| 问题 | 无 Tracing | 有 Tracing |
|------|----------|----------|
| 请求链路 | 日志分散，难以串联 | 完整链路可视化 |
| 性能瓶颈 | 手动计算，不精确 | 自动 Span 耗时统计 |
| 错误定位 | 逐层排查 | 快速定位失败 Span |
| 上下文分析 | 无结构化数据 | Token/上下文效率可量化 |

### 核心组件

```
【Span】最小追踪单元（一次方法调用/一次模型请求/一次工具执行）
【Trace】完整请求链路（多个 Span 的树形结构）
【Context】跨线程/跨服务的上下文传递
【Exporter】数据导出（Jaeger/Zipkin/OTLP 等）
```

### agentscope-java Tracing 模块

| 功能 | 说明 |
|------|------|
| 自动埋点 | Agent.call/stream 自动创建 Span |
| 模型调用追踪 | 记录 Model 请求/响应/耗时 |
| 工具调用追踪 | 记录 Tool 执行状态/耗时/结果 |
| 层级关系 | 自动构建父子 Span（Agent → Model/Tool） |
| OpenTelemetry | 标准协议，兼容主流后端 |

## 典型使用场景

### 1. 性能分析

```
Trace: chat-request-xxx
├── Span: ReActAgent.call (总耗时 2.3s)
│   ├── Span: OpenAIChatModel.generate (1.8s)
│   ├── Span: BashTool.execute (300ms)
│   └── Span: EditTool.execute (150ms)
```

### 2. 错误定位

```
Trace: chat-request-yyy (状态：ERROR)
├── Span: ReActAgent.call ❌
│   ├── Span: OpenAIChatModel.generate ✅
│   └── Span: ToolRegistry.execute ❌ ← 失败点
```

### 3. 上下文工程

- 统计每次请求的 Token 消耗
- 分析上下文长度与响应质量关系
- 识别冗余上下文（可压缩部分）

## 与 assistant-agent 集成方案

### 当前状态（2026-03-XX）

- ❌ 无 Tracing 依赖
- ❌ 无链路追踪代码
- ⚠️ 仅有基础日志（SLF4J）
- ⚠️ 手动延迟计算（System.nanoTime）

### 集成步骤

1. **引入依赖**
   ```xml
   <dependency>
       <groupId>io.agentscope</groupId>
       <artifactId>agentscope-tracing</artifactId>
       <version>1.0.8</version>
   </dependency>
   ```

2. **配置 OpenTelemetry**
   ```java
   @Bean
   public OpenTelemetry openTelemetry() {
       // 配置 OTLP exporter / Jaeger / Zipkin
   }
   ```

3. **启用自动埋点**
   ```java
   // agentscope-core 已内置埋点，无需额外代码
   ```

4. **可视化后端**
   - 开发环境：Jaeger All-in-One（Docker）
   - 生产环境：OTLP → 阿里云链路追踪

## 上下文工程工具（关联能力）

Tracing 为上下文工程提供数据基础：

| 工具 | 功能 | 依赖 Tracing |
|------|------|-------------|
| Token 统计 | 每次请求的输入/输出 Token | ✅ Span 属性 |
| 上下文效率 | 上下文长度 vs 响应质量 | ✅ Trace 分析 |
| 冗余检测 | 识别可压缩的上下文 | ✅ Span 内容 |
| 成本分析 | Token 消耗 → 成本换算 | ✅ 指标聚合 |

## 学习资源

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/)
- [agentscope-java Tracing 模块](https://java.agentscope.io/)
- [Jaeger 快速入门](https://www.jaegertracing.io/docs/latest/getting-started/)

## 关联卡片

- [[knowledge/agentscope-java/知识地图|知识地图]]
- [[knowledge/agentscope-java/03-Agent 能力层/Agent 抽象|Agent 抽象]]
- [待创建] 上下文工程基础

## 下一步

1. 研读 agentscope-java Tracing 模块源码
2. 创建 Tracing 集成方案文档
3. 在 assistant-agent 中实现 PoC
4. 建设上下文工程工具链

---

**创建日期**: 2026-03-XX
**优先级**: P0（可观测性基础建设）
