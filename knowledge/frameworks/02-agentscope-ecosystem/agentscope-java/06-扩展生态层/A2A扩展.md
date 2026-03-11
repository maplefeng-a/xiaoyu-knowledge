
# A2A 扩展

> agentscope-java 多智能体协作协议扩展

## 一句话

A2A（Agent-to-Agent）协议扩展，实现跨服务的多智能体协作，支持 Agent 作为客户端调用远程 Agent，也支持作为服务端暴露 Agent 能力。

## 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        A2A 协议架构                              │
│                                                                  │
│  ┌──────────────────┐                    ┌──────────────────┐   │
│  │   Client 端      │                    │   Server 端       │   │
│  │                  │                    │                   │   │
│  │  ┌────────────┐  │   JSON-RPC/SSE    │  ┌─────────────┐  │   │
│  │  │ A2aAgent   │◄─┼──────────────────►├─►│ A2aServer   │  │   │
│  │  └────────────┘  │                    │  └─────────────┘  │   │
│  │        │         │                    │        │          │   │
│  │        ▼         │                    │        ▼          │   │
│  │  ┌────────────┐  │                    │  ┌─────────────┐  │   │
│  │  │AgentCard   │  │                    │  │ReActAgent   │  │   │
│  │  │Resolver    │  │                    │  │Runner       │  │   │
│  │  └────────────┘  │                    │  └─────────────┘  │   │
│  │        │         │                    │        │          │   │
│  │        ▼         │                    │        ▼          │   │
│  │  ┌────────────┐  │                    │  ┌─────────────┐  │   │
│  │  │Transport   │  │                    │  │AgentCard    │  │   │
│  │  │(JSON-RPC)  │  │                    │  │Converter    │  │   │
│  │  └────────────┘  │                    │  └─────────────┘  │   │
│  └──────────────────┘                    └──────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 模块划分

| 模块 | 说明 |
|------|------|
| **a2a-client** | 客户端实现，作为调用方连接远程 Agent |
| **a2a-server** | 服务端实现，暴露本地 Agent 能力供远程调用 |

## 核心对象定义

### Client 端核心类

#### A2aAgent

```java
public class A2aAgent extends AgentBase {
    // 核心属性
    private final AgentCardResolver agentCardResolver;  // AgentCard 解析器
    private final A2aAgentConfig a2aAgentConfig;         // A2A 配置
    private final Memory memory;                         // 会话记忆
    private final ClientEventHandlerRouter clientEventHandlerRouter;  // 事件路由
    private Client a2aClient;                            // A2A 客户端
    private String currentRequestId;                     // 当前请求 ID
    private ClientEventContext clientEventContext;       // 事件上下文
}
```

#### AgentCardResolver

```java
public interface AgentCardResolver {
    /**
     * 根据 Agent 名称获取 AgentCard
     */
    AgentCard getAgentCard(String agentName);
}
```

**实现类：**

| 实现类 | 说明 |
|--------|------|
| `FixedAgentCardResolver` | 固定 AgentCard，直接传入 |
| `WellKnownAgentCardResolver` | 从 `/.well-known/agent-card.json` 获取 |

#### A2aAgentConfig

```java
public record A2aAgentConfig(
    Map<Class<? extends ClientTransport>, ClientTransportConfig> clientTransports,
    ClientConfig clientConfig
) {
    // 默认使用 JSON-RPC Transport
}
```

### Server 端核心类

#### ConfigurableAgentCard

```java
public class ConfigurableAgentCard {
    private final String name;                    // Agent 名称
    private final String description;             // Agent 描述
    private final String url;                     // Agent URL
    private final AgentProvider provider;         // 提供者信息
    private final String version;                 // 版本号
    private final String documentationUrl;        // 文档 URL
    private final List<String> defaultInputModes; // 默认输入模式
    private final List<String> defaultOutputModes;// 默认输出模式
    private final List<AgentSkill> skills;        // Agent 技能列表
    private final Map<String, SecurityScheme> securitySchemes; // 安全方案
    private final List<Map<String, List<String>>> security;    // 安全配置
    private final String iconUrl;                 // 图标 URL
    private final List<AgentInterface> additionalInterfaces;   // 额外接口
    private final String preferredTransport;     // 首选传输协议
}
```

#### AgentRunner

```java
public interface AgentRunner {
    /**
     * 执行 Agent 并返回结果
     */
    Mono<Msg> run(List<Msg> messages, AgentRequestOptions options);
}
```

**实现类：**

| 实现类 | 说明 |
|--------|------|
| `ReActAgentWithBuilderRunner` | 基于 ReActAgent 的执行器 |
| `BaseReActAgentRunner` | ReActAgent 执行器基类 |

## 核心方法

### A2aAgent 方法

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `call(Msg... msgs)` | `Mono<Msg>` | 调用远程 Agent |
| `observe(Msg msg)` | `Mono<Void>` | 观察模式，只添加消息 |
| `interrupt()` | `void` | 中断当前任务 |
| `getMemory()` | `Memory` | 获取记忆实例 |
| `builder()` | `Builder` | 获取 Builder |

### A2aAgent.Builder 方法

| 方法 | 说明 |
|------|------|
| `name(String)` | 设置 Agent 名称 |
| `agentCard(AgentCard)` | 设置 AgentCard（自动包装为 FixedAgentCardResolver） |
| `agentCardResolver(AgentCardResolver)` | 设置 AgentCard 解析器 |
| `a2aAgentConfig(A2aAgentConfig)` | 设置 A2A 配置 |
| `memory(Memory)` | 设置记忆实现 |
| `hook(Hook)` | 添加 Hook |
| `build()` | 构建 A2aAgent 实例 |

## 使用案例

### Client 端 - 直接使用 AgentCard

```java
// 1. 创建 AgentCard
AgentCard agentCard = AgentCard.builder()
    .name("remote-agent")
    .description("A remote agent")
    .url("http://remote-agent:8080")
    .version("1.0.0")
    .build();

// 2. 构建 A2aAgent
A2aAgent a2aAgent = A2aAgent.builder()
    .name("remote-agent-client")
    .agentCard(agentCard)
    .build();

// 3. 调用远程 Agent
Msg response = a2aAgent.call(Msg.builder()
    .name("user")
    .role(MsgRole.USER)
    .content(TextBlock.builder().text("Hello!").build())
    .build()).block();
```

### Client 端 - 自动获取 AgentCard

```java
// 1. 创建 AgentCardResolver（从 .well-known 获取）
AgentCardResolver resolver = new WellKnownAgentCardResolver(
    "http://remote-agent:8080",
    "/.well-known/agent-card.json",
    Map.of()
);

// 2. 构建 A2aAgent
A2aAgent a2aAgent = A2aAgent.builder()
    .name("remote-agent-client")
    .agentCardResolver(resolver)
    .a2aAgentConfig(A2aAgentConfig.builder()
        .clientConfig(ClientConfig.builder()
            .timeout(Duration.ofSeconds(30))
            .build())
        .build())
    .memory(new InMemoryMemory())
    .hook(new MyHook())
    .build();

// 3. 调用
Msg response = a2aAgent.call(userMsg).block();
```

### Server 端 - 配置 AgentCard

```java
// 1. 创建 AgentSkill
AgentSkill skill = AgentSkill.builder()
    .id("weather-query")
    .name("Weather Query")
    .description("Query weather information")
    .tags(List.of("weather", "query"))
    .build();

// 2. 创建 ConfigurableAgentCard
ConfigurableAgentCard agentCard = ConfigurableAgentCard.builder()
    .name("weather-agent")
    .description("Weather information agent")
    .url("http://localhost:8080")
    .version("1.0.0")
    .skills(List.of(skill))
    .preferredTransport("jsonrpc")
    .build();

// 3. 注册到 Spring Bean（配合 Spring Boot Starter）
```

### 中断任务

```java
// 用户中断
a2aAgent.interrupt();

// 或带消息中断
a2aAgent.interrupt(Msg.builder()
    .content(TextBlock.builder().text("Stop!").build())
    .build());
```

## 设计思路

### 核心设计理念

1. **协议标准化**
   - 基于 A2A 规范（Google 开源的多智能体协作协议）
   - 使用 JSON-RPC 2.0 作为传输协议
   - 支持 SSE（Server-Sent Events）流式响应

2. **AgentCard 机制**
   - AgentCard 描述 Agent 的能力、技能、安全方案
   - 支持静态配置和动态获取（.well-known）
   - 实现服务发现和能力发现

3. **客户端抽象**
   - A2aAgent 继承 AgentBase，与本地 Agent 使用方式一致
   - 内部通过 Transport 层与远程通信
   - 支持中断、Hook、Memory 等本地 Agent 能力

4. **服务端暴露**
   - 将本地 ReActAgent 暴露为 A2A 服务
   - AgentRunner 负责执行本地 Agent
   - AgentCardConverter 负责生成本地 Agent 的能力描述

### 架构分层

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│   (A2aAgent / ReActAgent)               │
├─────────────────────────────────────────┤
│           Protocol Layer                │
│   (A2A Spec / AgentCard)                │
├─────────────────────────────────────────┤
│           Transport Layer               │
│   (JSON-RPC / SSE)                      │
├─────────────────────────────────────────┤
│           Network Layer                 │
│   (HTTP / WebSocket)                    │
└─────────────────────────────────────────┘
```

## 优势与劣势

### 优势 ✅

| 优势 | 说明 |
|------|------|
| **标准化协议** | 基于 A2A 规范，与生态兼容 |
| **透明调用** | A2aAgent 与本地 Agent 使用方式一致 |
| **服务发现** | 通过 AgentCard 描述能力，支持动态发现 |
| **支持中断** | 支持任务中断和取消 |
| **可扩展** | Transport 可插拔，支持多种传输协议 |
| **流式响应** | 支持 SSE 流式返回结果 |

### 劣势 ⚠️

| 劣势 | 说明 |
|------|------|
| **网络依赖** | 依赖网络稳定性，远程调用可能超时 |
| **协议复杂** | JSON-RPC + SSE 学习成本较高 |
| **状态同步** | 跨服务状态管理复杂，需要额外设计 |
| **调试困难** | 分布式调用链路长，调试复杂 |
| **性能开销** | 网络传输和序列化有额外开销 |

## 源码位置

- **Client**: `io.agentscope.core.a2a.agent.A2aAgent`
- **Server**: `io.agentscope.core.a2a.server.*`

## 关联

- [[knowledge/agentscope-java/05-框架入口层/ReActAgent|ReActAgent]]
- [[knowledge/agentscope-java/06-扩展生态层/AGUI扩展|AGUI扩展]]
- [[knowledge/agentscope-java/08-集成协议/A2A协议|A2A协议]]
- [[knowledge/agentscope-java/知识地图|知识地图]]
