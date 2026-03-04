# AutoContextMemory 上下文管理

> 基于 agentscope-java 的智能上下文压缩方案

## 1. 问题背景

### 1.1 核心挑战

| 问题 | 说明 |
|------|------|
| **上下文窗口限制** | LLM 有固定 token 限制（如 128K），超限无法处理 |
| **成本问题** | 对话历史增长导致 API 成本线性增长 |
| **信息冗余** | 早期内容可能不再相关，但仍占用资源 |
| **信息丢失风险** | 简单截断会丢失重要信息 |

### 1.2 解决方案

**AutoContextMemory** - 智能压缩和上下文管理：
- 自动压缩：超阈值时自动触发
- 智能摘要：LLM 生成摘要，保留关键信息
- 内容卸载：大内容卸载到外部存储
- 渐进策略：6 级压缩策略
- 完整追溯：原始内容保存，支持完整历史追踪

## 2. 架构设计

### 2.1 存储架构

```
┌─────────────────────────────────────────────────────────┐
│                   AutoContextMemory                      │
├─────────────────────────────────────────────────────────┤
│  Working Memory Storage    → 压缩后的消息（实际对话用）   │
│  Original Memory Storage   → 完整历史（append-only）     │
│  Offload Context Storage   → 卸载内容 Map<UUID, List<Msg>>│
│  Compression Events        → 压缩操作记录               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 6 级渐进压缩策略

| 策略 | 说明 | 保护机制 |
|------|------|---------|
| **1. 压缩历史工具调用** | LLM 压缩连续工具调用 | lastKeep 保护 |
| **2. 卸载大消息(有保护)** | 卸载超阈值消息 | lastKeep 保护 |
| **3. 卸载大消息(无保护)** | 卸载超阈值消息 | 仅保护最新响应 |
| **4. 摘要历史对话轮次** | LLM 生成摘要 | - |
| **5. 摘要当前轮大消息** | LLM 摘要 + 卸载 | - |
| **6. 压缩当前轮消息** | 合并工具结果 | 可配置压缩比 |

### 2.3 压缩原则

- **当前轮优先**：当前轮消息比历史消息重要
- **用户交互优先**：用户输入和 Agent 响应比工具中间结果重要
- **可追溯性**：所有压缩内容可通过 UUID 追溯

## 3. 配置参数

### 3.1 AutoContextConfig

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `msgThreshold` | int | 100 | 触发压缩的消息数阈值 |
| `maxToken` | long | 128*1024 | 最大 token 限制 |
| `tokenRatio` | double | 0.75 | 触发压缩的 token 比例 |
| `lastKeep` | int | 50 | 保护最近 N 条消息不压缩 |
| `largePayloadThreshold` | long | 5*1024 | 大消息阈值（字符数） |
| `offloadSinglePreview` | int | 200 | 卸载消息预览长度 |
| `minConsecutiveToolMessages` | int | 6 | 压缩工具调用的最小连续数 |
| `currentRoundCompressionRatio` | double | 0.3 | 当前轮压缩比 |

### 3.2 配置示例

```java
AutoContextConfig config = AutoContextConfig.builder()
    .msgThreshold(50)              // 50 条消息触发
    .maxToken(64 * 1024)           // 64K token 限制
    .tokenRatio(0.7)               // 70% 时触发
    .lastKeep(20)                  // 保护最近 20 条
    .largePayloadThreshold(10 * 1024)  // 10K 字符为大消息
    .offloadSinglePreview(300)     // 预览 300 字符
    .minConsecutiveToolMessages(4) // 4 条连续工具调用才压缩
    .currentRoundCompressionRatio(0.3)  // 压缩到 30%
    .build();
```

## 4. 使用方式

### 4.1 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-autocontext-memory</artifactId>
    <version>1.0.8</version>
</dependency>
```

### 4.2 基本使用

```java
import io.agentscope.core.ReActAgent;
import io.agentscope.core.memory.autocontext.AutoContextConfig;
import io.agentscope.core.memory.autocontext.AutoContextMemory;
import io.agentscope.core.memory.autocontext.AutoContextHook;

// 1. 创建配置
AutoContextConfig config = AutoContextConfig.builder()
    .msgThreshold(30)
    .lastKeep(10)
    .tokenRatio(0.3)
    .build();

// 2. 创建 AutoContextMemory
AutoContextMemory memory = new AutoContextMemory(config, model);

// 3. 创建 Agent（使用 AutoContextHook 自动集成）
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(model)
    .memory(memory)              // 替换 InMemoryMemory
    .toolkit(toolkit)
    .hook(new AutoContextHook()) // 必需：自动注册钩子
    .build();
```

### 4.3 AutoContextHook 自动完成

- 注册 `ContextOffloadTool` 到 toolkit
- 附加 `PlanNotebook` 支持计划感知压缩
- 在 LLM 推理前触发压缩 (`PreReasoningEvent`)

## 5. 压缩触发条件

压缩在 `PreReasoningEvent`（LLM 推理前）自动触发，条件：

1. **消息数阈值**：`currentMessages.size() >= msgThreshold`
2. **Token 数阈值**：`calculateToken(currentMessages) >= maxToken * tokenRatio`

任一条件满足即触发。

## 6. 消息保护机制

| 保护机制 | 说明 |
|---------|------|
| `lastKeep` 保护 | 最近 N 条消息不压缩 |
| 最新响应保护 | 最新 Agent 响应及之后消息不压缩 |
| 当前轮保护 | 当前轮消息优先使用轻量压缩 |

## 7. 压缩事件追踪

### 7.1 CompressionEvent 结构

```java
public class CompressionEvent {
    String eventType;           // 压缩策略类型
    long timestamp;             // 时间戳
    int compressedMessageCount; // 压缩的消息数
    String previousMessageId;   // 压缩范围前一条消息 ID
    String nextMessageId;       // 压缩范围后一条消息 ID
    String compressedMessageId; // 压缩后的消息 ID
    Map<String, Object> metadata; // 元数据
}
```

### 7.2 使用示例

```java
List<CompressionEvent> events = memory.getCompressionEvents();
for (CompressionEvent event : events) {
    System.out.println("策略: " + event.getEventType());
    System.out.println("压缩消息数: " + event.getCompressedMessageCount());
    System.out.println("Token 节省: " + event.getTokenReduction());
}
```

## 8. assistant-agent 集成方案

### 8.1 改动点

| 文件 | 改动 |
|------|------|
| `pom.xml` | 添加 autocontext-memory 依赖 |
| `ChatService.java` | 替换 InMemoryMemory 为 AutoContextMemory |
| `application.yml` | 添加上下文管理配置 |

### 8.2 配置示例 (application.yml)

```yaml
assistant:
  context:
    enabled: true
    msg-threshold: 50
    max-token: 65536
    token-ratio: 0.7
    last-keep: 20
    large-payload-threshold: 10240
```

### 8.3 注意事项

1. **LLM 调用成本**：压缩过程需要 LLM 调用，产生额外成本
2. **同步处理**：压缩是同步阻塞的，可能影响响应时间
3. **信息丢失**：压缩可能丢失部分详细信息（原始内容可通过 UUID 追溯）
4. **内存占用**：原始存储和卸载上下文占用额外内存

## 9. 代码位置

- 扩展模块：`agentscope-extensions-autocontext-memory`
- 主类：`io.agentscope.core.memory.autocontext.AutoContextMemory`
- 配置：`io.agentscope.core.memory.autocontext.AutoContextConfig`
- 钩子：`io.agentscope.core.memory.autocontext.AutoContextHook`

---
*Created: 2026-02-23*
*Related: assistant-agent, agentscope-java, context-management*
