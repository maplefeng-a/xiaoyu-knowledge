---
id: agentscope-java-chat-service
type: concept
title: ChatService 聊天服务
status: active
aliases:
  - ChatService
  - assistant-agent ChatService
tags:
  - agentscope-java
  - service
  - chat
  - streaming
refs:
  - assistant-agent/src/main/java/com/assistant/agent/service/ChatService.java
---

# ChatService 聊天服务

> OpenClaw assistant-agent 核心服务 | Spring Boot WebFlux 增强版

## 一句话

基于 AgentScope-Java 的智能体聊天服务，支持同步/异步调用、流式响应、会话恢复、工具确认（HITL）。

---

## 核心设计

### 设计原则
- **响应式**: WebFlux + Reactor 异步非阻塞
- **会话隔离**: 每个会话独立 Agent 实例
- **Agent 缓存**: Caffeine 缓存 + 自动过期
- **流式优先**: 匨生体验，- **HITL 集成**: 工具确认钩子

### 依赖注入

```java
@Service
public class ChatService {
    // 核心服务
    private final Session session;
    private final SessionService sessionService;
    private final ToolRegistry toolRegistry;
    private final PromptBuilder promptBuilder;
    private final SkillLoader skillLoader;
    private final HitlProperties hitlProperties;
    private final SessionRecoveryPipeline sessionRecoveryPipeline;
    
    // Agent 缓存（Caffeine）
    private final Cache<String, ReActAgent> agents;
    
    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.base-url}")
    private String baseUrl;

    @Value("${openai.model-name}")
    private String modelName;

    @Value("${openai.timeout-minutes:10}")
    private int timeoutMinutes;

    @Value("${assistant.cache.agents.max-size:500}")
    private long agentCacheMaxSize;

    @Value("${assistant.cache.agents.expire-after-access-minutes:30}")
    private long agentCacheExpireMinutes;
    
    @Value("${hitl.enabled:false}")
    private ToolConfirmationHook confirmationHook;
}
```

[compacted: tool output removed to free context]
### Agent 创建流程

```java
private ReActAgent createAgent(String sessionId) {
    Toolkit toolkit = toolRegistry.createToolkit();
    String sysPrompt = promptBuilder.build();

    ExecutionConfig executionConfig = ExecutionConfig.builder()
        .timeout(Duration.ofMinutes(timeoutMinutes))
        .maxAttempts(3)
        .initialBackoff(Duration.ofSeconds(2))
        .build();

    GenerateOptions generateOptions = GenerateOptions.builder()
        .executionConfig(executionConfig)
        .build();

    ReActAgent.Builder agentBuilder = ReActAgent.builder()
        .name("Assistant")
        .sysPrompt(sysPrompt)
        .model(OpenAIChatModel.builder()
            .apiKey(apiKey)
            .baseUrl(baseUrl)
            .modelName(modelName)
            .stream(true)
            .generateOptions(generateOptions)
            .build())
        .memory(new InMemoryMemory())
        .toolkit(toolkit);

    if (skillLoader.hasSkills()) {
        SkillBox skillBox = skillLoader.createSkillBox(toolkit);
        if (skillBox != null) {
            agentBuilder.skillBox(skillBox);
        }
    }

    if (confirmationHook != null) {
        agentBuilder.hook(confirmationHook);
    }

    ReActAgent agent = agentBuilder.build();
    
    boolean loaded = agent.loadIfExists(session, sessionId);
    return agent;
}
```
[compacted: tool output removed to free context]
### 同步聊天流程

```java
public Flux<StreamEvent> chatStream(String sessionId, String question, String requestId) {
    // 1. 准备
    String effectiveSessionId = resolveSessionId(sessionId);
    String safeRequestId = 
        (requestId == null || requestId.isBlank()) 
        ? UUID.randomUUID().toString() : requestId;
    Msg userMsg = Msg.builder()
        .role(MsgRole.USER)
        .content(TextBlock.builder().text(question).build())
        .build();

    // 2. 获取/创建 Agent
    return getOrCreateAgentAsync(effectiveSessionId)
        .flatMapMany(agent -> {
            // 3. 会话恢复
            sessionRecoveryPipeline.recover(agent);
            
            // 4. 执行调用
            Flux<StreamEvent> coreStream = agent.stream(userMsg, STREAM_OPTIONS)
                .flatMap(event -> convertEventToStreamEvents(event, agent, effectiveSessionId));
            
            return Flux.concat(
                Flux.just(StreamEvent.session(effectiveSessionId)),
                coreStream,
                Mono.fromSupplier(() -> {
                    long latencyMs = (System.nanoTime() - startNanos) / 1_000_000;
                    saveSession(effectiveSessionId, agent, question);
                    return StreamEvent.metrics(effectiveSessionId, safeRequestId, true, null, latencyMs);
                }),
                Flux.just(StreamEvent.done(effectiveSessionId))
            );
        })
        .onErrorResume(error -> {
            long latencyMs = (System.nanoTime() - startNanos) / 1_000_000;
            return Mono.just(Flux.just(
                StreamEvent.session(effectiveSessionId),
                StreamEvent.error(effectiveSessionId, error.getMessage())
            );
        });
}
```
[compacted: tool output removed to free context]
### 流式事件转换

```java
private Flux<StreamEvent> convertEventToStreamEvents(
    Event event, 
    ReActAgent agent,
    String sessionId
) {
    List<StreamEvent> events = new ArrayList<>();
    
    // 处理 REASONING 事件
    if (event.eventType == EventType.REASONING) {
        String thinking = extractThinkingContent(event.getContent());
        if (thinking != null && !thinking.isEmpty()) {
            events.add(StreamEvent.thinking(sessionId, thinking));
        }
    }
    
    // 处理 TOOL_RESULT 事件
    else if (event.eventType == EventType.TOOL_RESULT) {
        List<ContentBlock> blocks = event.getContent();
        for (ContentBlock block : blocks) {
            if (block instanceof ToolResultBlock toolResultBlock) {
                String toolName = toolResultBlock.name();
                String toolOutput = toolResultBlock.output();
                
                // 格式化工具输出
                String formattedOutput = formatToolOutput(toolOutput, toolName);
                
                events.add(StreamEvent.toolResult(sessionId, toolName, formattedOutput));
            }
        }
    }
    
    return Flux.fromIterable(events);
}
```
[compacted: tool output removed to free context]
### 会话持久化

```java
private void saveSession(String sessionId, ReActAgent agent, String userMessage) {
    try {
        sessionService.updateSessionMeta(sessionId, userMessage);
        agent.save(session, sessionId);
        log.debug("Saved session: {}", sessionId);
    } catch (Exception e) {
        log.warn("Failed to save session {}: {}", sessionId, e.getMessage());
    }
}
```
[compacted: tool output removed to free context]
### 辅助方法

```java
private String resolveSessionId(String sessionId) {
    return (sessionId == null || sessionId.isBlank()) 
        ? UUID.randomUUID().toString() 
        : sessionId;
    }

    private void logModelRequestPreview(ReActAgent agent, String sessionId, String operation) {
    List<Msg> history = agent.getMemory().getHistory();
    if (!history.isEmpty()) {
        log.debug("[{}] {} - no history", operation, sessionId);
        return;
    }
    
    int msgCount = history.size();
    int userMsgCount = 0;
    for (Msg msg : history) {
        if (msg.getRole() == MsgRole.USER) {
            userMsgCount++;
        }
    }
    
    log.debug("[{}] {} - {} msgs, {} user", operation, sessionId, userMsgCount);
}

```
[compacted: tool output removed to free context]
### 内容提取

```java
private String extractTextFromBlocks(List<ContentBlock> blocks) {
    for (ContentBlock block : blocks) {
        if (block instanceof TextBlock textBlock) {
            return textBlock.getText();
        }
    }
    return blocks.stream()
        .filter(TextBlock.class::isPresent)
        .map(TextBlock::getText)
        .orElse(null)
        .collect(Collectors::toList();
    return sb.toString();
}

```
[compacted: tool output removed to free context]
### 思考内容提取

```java
private String extractThinkingContent(List<ContentBlock> blocks) {
    for (ContentBlock block : blocks) {
        if (block instanceof ThinkingBlock thinkingBlock) {
            return thinkingBlock.getThinking();
        }
    }
    return blocks.stream()
        .filter(ThinkingBlock.class::isPresent)
        .map(ThinkingBlock::getThinking)
        .orElse(null);
}
```
[compacted: tool output removed to free context]
### 工具输出格式化

```java
private String formatToolOutput(Object output, String toolName) {
    try {
        String json = OBJECT_MAPPER.writerWithDefaultPrettyPrinter()
            .writeValueAsString(output);
        return json;
    } catch (Exception e) {
        log.warn("Failed to format tool output for tool: {}", toolName, e.getMessage());
        return output.toString();
    }
}
```
[compacted: tool output removed to free context]
---

## 关键特性

### 1. 响应式流式响应
- **WebFlux**: Reactor 异步非阻塞
- **流式优先**: 增强用户体验
- **背压**: WebFlux 背压处理

### 2. Agent 缓存
- **Caffeine 缓存**: 最大 500 个 Agent
- **自动过期**: 30 分钟未访问后过期
- **会话隔离**: 每个 Agent 独立实例
### 3. HITL 集成
- **工具确认**: 危险工具需确认
- **钩子注入**: ToolConfirmationHook
- **可配置**: 通过 `hitlProperties` 配置
### 4. 会话恢复
- **恢复管道**: SessionRecoveryPipeline
- **恢复规则**: 
  - CloseDanglingPendingToolCallRule
  - RemoveMalformedPendingToolCallRule
### 5. 技能系统
- **SkillBox**: 动态加载技能
- **技能发现**: SkillLoader 自动发现
- **技能注入**: 注入到 Agent
### 6. 流式事件
- **EventType**: REASONING, TOOL_RESULT
- **事件转换**: 转换为 StreamEvent
- **事件流**: Flux<StreamEvent>
### 7. 持久化
- **Session 持久化**: 通过 SessionService
- **元数据**: 用户消息、时间戳
- **加载机制**: agent.loadIfExists(session, sessionId)

- **保存机制**: agent.save(session, sessionId)

---

## 使用示例

### 同步调用
```java
// 创建 Agent
ReActAgent agent = chatService.getOrCreateAgentAsync("session-123").block();

// 同步调用
String answer = agent.call(userMsg).block();

// 流式调用
Flux<StreamEvent> events = chatService.chatStream("session-123", "Hello", null)
    .subscribe(event -> {
        if (event.type == StreamEvent.Type.THINKING) {
            System.out.println("Thinking: " + event.getContent());
        } else if (event.type == StreamEvent.Type.TOOL_RESULT) {
            System.out.println("Tool result: " + event.getContent());
        }
    });
```

[compacted: tool output removed to free context]
---

## 技术亮点
1. **响应式编程**: 完整的 WebFlux 支持
2. **Agent 生命周期管理**: 创建、缓存、保存、加载
3. **流式响应**: 详细的流式事件处理
4. **HITL 集成**: 工具确认机制
5. **会话恢复**: 多层恢复策略

6. **技能系统**: 动态技能加载和注入

---

## 最佳实践
- **Agent 缓存**: 使用 Caffeine 缓存提升性能
- **异常处理**: 完善的错误处理和日志记录
- **会话管理**: 独立的 SessionService 管理会
- **流式事件**: 详细的事件转换和流式处理

- **可配置化**: 灵活的配置管理（@Value 注入)

---

## 与 AgentScope-Java 原生对比
- **Spring Boot 集成**: 更容易集成到 Spring 生态
- **WebFlux 支持**: 响应式编程
- **会话恢复**: 增强的会话管理
- **HITL**: 人机交互循环增强

---

_更新时间：2026-03-10 16:05_
