# AgentScope vs Assistant-Agent 对比分析报告

> 分析日期：2025-03-15
> AgentScope 版本：1.0.8
> Assistant-Agent 版本：1.0.0

---

## 目录

1. [概述](#1-概述)
2. [Agent 封装模式](#2-agent-封装模式)
3. [Toolkit 管理 + MCP 集成](#3-toolkit-管理--mcp-集成)
4. [Tool Group 分组配置](#4-tool-group-分组配置)
5. [Hook 机制](#5-hook-机制)
6. [SkillBox 与 Tool 绑定](#6-skillbox-与-tool-绑定)
7. [Memory 管理](#7-memory-管理)
8. [Session 管理](#8-session-管理)
9. [流式输出与 SSE](#9-流式输出与-sse)
10. [POM 治理建议](#10-pom-治理建议)
11. [总结与建议](#11-总结与建议)

---

## 1. 概述

### 1.1 项目定位

| 项目 | 定位 | 特点 |
|------|------|------|
| **AgentScope** | 通用 AI Agent 框架 | 官方维护、功能完整、Spring Boot Starter 支持 |
| **Assistant-Agent** | 个人助理应用 | 基于 AgentScope 构建、业务定制、小语专属 |

### 1.2 依赖关系

```
Assistant-Agent
      │
      └──▶ AgentScope (io.agentscope:agentscope:1.0.8)
                │
                ├── agentscope-core
                ├── agentscope-extensions-studio
                ├── agentscope-extensions-autocontext-memory
                └── agentscope-extensions-agui
```

---

## 2. Agent 封装模式

### 2.1 AgentScope 官方

**核心类**：`ReActAgent`（推理-行动循环 Agent）

```java
// 构建方式
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .sysPrompt("你是一个助手")
    .model(model)
    .toolkit(toolkit)
    .memory(memory)
    .maxIters(50)
    .hook(hook)
    .build();

// 执行方式
Msg response = agent.call(userMsg);           // 同步
Flux<Event> events = agent.stream(userMsg);   // 流式
```

**特点**：
- Builder 模式构建
- 原生支持流式输出
- Hook 机制扩展
- 支持长期记忆

### 2.2 Assistant-Agent 实现

**封装类**：`ReActAgentBuilder`（工厂模式）

```java
@Component
public class ReActAgentBuilder {
    public ReActAgent build(String sessionId) {
        // 通过工厂创建组件
        OpenAIChatModel model = modelFactory.create();
        Toolkit toolkit = toolkitFactory.create();
        Memory memory = memoryFactory.create(model);

        // 构建 Agent
        return ReActAgent.builder()
            .name("Assistant")
            .sysPrompt(promptBuilder.build())
            .model(model)
            .toolkit(toolkit)
            .memory(memory)
            .maxIters(50)
            .hook(hookFactory.create(longTermMemory))
            .build();
    }
}
```

### 2.3 对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| 构建方式 | 直接 Builder | 工厂模式封装 |
| 组件创建 | 手动创建 | 工厂自动装配 |
| 配置来源 | 硬编码/手动 | Spring Boot 配置文件 |
| 依赖注入 | 无 | Spring 管理 |

**结论**：Assistant-Agent 通过工厂模式实现了配置化构建，符合 Spring Boot 最佳实践。

---

## 3. Toolkit 管理 + MCP 集成

### 3.1 AgentScope 官方

**Toolkit 结构**：

```java
Toolkit toolkit = new Toolkit();

// 注册本地工具
toolkit.registerTool(new ReadTool());
toolkit.registerTool(new WriteTool());

// 注册 MCP 工具
McpClientWrapper mcpClient = McpClientFactory.createHttpClient(config);
toolkit.registerMcpTools(mcpClient, List.of("tool1", "tool2"));
```

**MCP 配置**（YAML）：

```yaml
mcp:
  servers:
    knowledge-base:
      transport: http
      url: http://localhost:1107/mcp
      timeout: 30
```

### 3.2 Assistant-Agent 实现

**ToolkitFactory**：

```java
@Component
public class ToolkitFactory {
    public Toolkit create() {
        Toolkit toolkit = new Toolkit();

        // 注册本地工具（从配置读取）
        for (String toolName : properties.getLocalTools()) {
            AgentTool tool = createLocalTool(toolName);
            toolkit.registerTool(tool);
        }

        // 注册 MCP 工具
        for (McpServerConfig server : properties.getMcpServers().values()) {
            if (server.isEnabled()) {
                McpClientWrapper client = mcpClientFactory.create(server);
                toolkit.registerMcpTools(client, server.getTools());
            }
        }

        return toolkit;
    }
}
```

### 3.3 对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| 工具注册 | 手动代码 | 配置驱动 |
| MCP 集成 | 直接使用 | 工厂封装 |
| 工具过滤 | 无 | 支持白名单 |

---

## 4. Tool Group 分组配置

### 4.1 AgentScope 官方

**分组机制**：

```java
// 创建工具组
toolkit.createGroup("safe_tools")
    .addTool("read")
    .addTool("write")
    .build();

// 激活/禁用组
toolkit.activateGroup("safe_tools");
toolkit.deactivateGroup("dangerous_tools");
```

### 4.2 Assistant-Agent 实现

**SkillBox 与 ToolGroup 结合**：

```java
// SkillBoxFactory.java
public SkillBox create(Toolkit toolkit) {
    SkillBox box = new SkillBox(toolkit);

    // 注册 Skill 时自动创建 ToolGroup
    box.registration()
        .skill(skill)
        .toolkit(toolkit)
        .mcpClient(client)
        .enableTools(List.of("knowledge_search"))
        .apply();  // 框架自动创建 {skillId}_skill_tools 组

    return box;
}
```

### 4.3 对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| 分组创建 | 手动 API | Skill 注册时自动 |
| 分组命名 | 自定义 | 框架约定 `{skillId}_skill_tools` |
| 激活控制 | 手动调用 | Skill 加载时自动激活 |

---

## 5. Hook 机制

### 5.1 AgentScope 官方

**Hook 类型**：

| Hook | 触发时机 | 用途 |
|------|----------|------|
| `PreReasoningHook` | 推理前 | 修改输入、添加上下文 |
| `PostReasoningHook` | 推理后 | 处理推理结果 |
| `PreActingHook` | 工具执行前 | 参数校验、HITL 确认 |
| `PostActingHook` | 工具执行后 | 结果处理 |
| `PreSummaryHook` | 总结前 | 准备总结 |
| `PostSummaryHook` | 总结后 | 处理总结结果 |

**使用方式**：

```java
public class HitlHook extends PreActingHook {
    @Override
    public Mono<PreActingEvent> onEvent(PreActingEvent event) {
        if (isDangerousTool(event.getToolUse().getName())) {
            return waitForUserConfirmation(event);
        }
        return Mono.just(event);
    }
}
```

### 5.2 Assistant-Agent 实现

**HookFactory**：

```java
@Component
public class HookFactory {
    public List<Hook> create(LongTermMemory longTermMemory) {
        List<Hook> hooks = new ArrayList<>();

        // HITL 确认 Hook
        if (properties.getHitl().isEnabled()) {
            hooks.add(new HitlConfirmationHook(properties.getHitl()));
        }

        // Memory 压缩 Hook
        hooks.add(new AutoContextCompressionHook(memoryFactory));

        // 长期记忆 Flush Hook
        if (longTermMemory != null) {
            hooks.add(new LongTermMemoryFlushHook(longTermMemory));
        }

        return hooks;
    }
}
```

### 5.3 对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| Hook 注册 | 手动添加 | 工厂自动装配 |
| 配置化 | 无 | 基于 properties |
| 组合使用 | 手动管理 | 工厂统一创建 |

---

## 6. SkillBox 与 Tool 绑定

### 6.1 AgentScope 官方

**SkillBox 机制**：

```java
SkillBox box = new SkillBox(toolkit);

// 注册 Skill 加载工具
box.registerSkillLoadTool();

// 注册 Skill 及其工具
box.registration()
    .skill(skill)
    .toolkit(toolkit)
    .tool(localTool)
    .apply();

box.registration()
    .skill(skill)
    .toolkit(toolkit)
    .mcpClient(mcpClient)
    .enableTools(List.of("search"))
    .apply();
```

### 6.2 Assistant-Agent 实现

**SkillBoxFactory**（从 SKILL.md 解析工具配置）：

```java
@PostConstruct
public void init() {
    // 从 SKILL.md frontmatter 解析工具配置
    // tools: "knowledge_search@knowledge-base, read"
    for (AgentSkill skill : loadedSkills) {
        List<ToolSpec> toolSpecs = loadToolSpecs(skillDir, skill.getName());
        skillToolSpecs.put(skill.getName(), toolSpecs);
    }
}

public SkillBox create(Toolkit toolkit) {
    SkillBox box = new SkillBox(toolkit);
    box.registerSkillLoadTool();

    for (AgentSkill skill : loadedSkills) {
        registerSkillWithTools(box, toolkit, skill, skillToolSpecs.get(skill.getName()));
    }

    return box;
}
```

### 6.3 对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| 工具配置来源 | 代码硬编码 | SKILL.md frontmatter |
| MCP 工具指定 | 代码指定 | `tool@server` 语法 |
| 重复声明检测 | 无 | 启动时校验 |

---

## 7. Memory 管理

### 7.1 AgentScope 官方

**Memory 接口**：

```java
public interface Memory {
    void add(Msg message);
    List<Msg> getMessages();
    void clear();
}
```

**自动压缩**：

```java
AutoContextMemory memory = AutoContextMemory.builder()
    .model(model)
    .msgThreshold(100)
    .maxToken(131072)
    .tokenRatio(0.75)
    .lastKeep(50)
    .build();
```

### 7.2 Assistant-Agent 实现

**MemoryFactory**：

```java
@Component
public class MemoryFactory {
    public Memory create(OpenAIChatModel model) {
        MemoryProperties.AutoCompression config = properties.getAutoCompression();

        if (config.isEnabled()) {
            return AutoContextMemory.builder()
                .model(model)
                .msgThreshold(config.getMsgThreshold())
                .maxToken(config.getMaxToken())
                .tokenRatio(config.getTokenRatio())
                .lastKeep(config.getLastKeep())
                .build();
        }

        return new Memory();
    }
}
```

**长期记忆**：

```java
public class FileSystemLongTermMemory implements LongTermMemory {
    // 按日期存储记忆
    // 支持 record() 记录、retrieve() 检索
}
```

### 7.3 对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| 短期记忆 | Memory | Memory（配置化） |
| 自动压缩 | AutoContextMemory | AutoContextMemory（配置化） |
| 长期记忆 | LongTermMemory 接口 | FileSystemLongTermMemory 实现 |

---

## 8. Session 管理

### 8.1 AgentScope 官方

**无内置 Session 管理**，需要应用层自行实现。

### 8.2 Assistant-Agent 实现

**AgentRuntimeManager**：

```java
@Component
public class AgentRuntimeManager {
    private final Cache<String, ReActAgent> agentCache;

    public Mono<ReActAgent> getOrCreateAgentAsync(String sessionId) {
        return Mono.fromCallable(() -> agentCache.get(sessionId, () -> {
            ReActAgent agent = agentBuilder.build(sessionId);
            sessionRecoveryPipeline.recover(agent);
            return agent;
        })).subscribeOn(Schedulers.boundedElastic());
    }

    public void saveSession(ReActAgent agent, String sessionId) {
        // 持久化 Memory 到文件系统
    }
}
```

**Session 恢复**：

```java
@Component
public class SessionRecoveryPipeline {
    public void recover(ReActAgent agent) {
        // 从文件系统加载历史消息
        // 恢复到 Agent 的 Memory
    }
}
```

### 8.3 对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| Session 缓存 | 无 | Caffeine Cache |
| 持久化 | 无 | 文件系统 |
| 恢复机制 | 无 | SessionRecoveryPipeline |

---

## 9. 流式输出与 SSE

### 9.1 AgentScope 官方

**Event 类型**：

| EventType | 说明 |
|-----------|------|
| `REASONING` | 推理过程（含 ThinkingBlock、TextBlock、ToolUseBlock） |
| `TOOL_RESULT` | 工具执行结果 |
| `SUMMARY` | 最终总结 |
| `HINT` | 提示信息 |

**StreamOptions**：

```java
StreamOptions options = StreamOptions.builder()
    .eventTypes(EventType.REASONING, EventType.TOOL_RESULT, EventType.SUMMARY)
    .incremental(true)
    .includeReasoningChunk(true)
    .includeReasoningResult(true)
    .includeActingChunk(true)
    .build();

Flux<Event> events = agent.stream(message, options);
```

### 9.2 Assistant-Agent 实现

**EventStreamMapper**（当前）：

```java
public Flux<AgentStreamEvent> map(Event event, String sessionId, String requestId) {
    // 直接包装，未做内容拆分
    return Flux.just(AgentStreamEvent.of(sessionId, requestId, event));
}
```

### 9.3 优化建议：使用官方 AG-UI

**引入依赖**：

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-agui</artifactId>
</dependency>
```

**改造 AgentService**：

```java
private static final AguiAdapterConfig AGUI_CONFIG = AguiAdapterConfig.builder()
    .enableReasoning(true)      // 启用思考内容
    .emitToolCallArgs(true)     // 启用工具参数流式
    .build();

public Flux<AguiEvent> stream(String sessionId, Msg message) {
    return getOrCreateAgent(sessionId)
        .flatMapMany(agent -> {
            AguiAgentAdapter adapter = new AguiAgentAdapter(agent, AGUI_CONFIG);

            RunAgentInput input = RunAgentInput.builder()
                .threadId(sessionId)
                .runId(UUID.randomUUID().toString())
                .messages(List.of(toAguiMessage(message)))
                .build();

            return adapter.run(input);
        });
}
```

**AG-UI 事件流示例**：

```
RUN_STARTED
├── REASONING_MESSAGE_START
├── REASONING_MESSAGE_CONTENT (思考内容，增量)
├── REASONING_MESSAGE_END
├── TEXT_MESSAGE_START
├── TEXT_MESSAGE_CONTENT (正文内容，增量)
├── TOOL_CALL_START
├── TOOL_CALL_ARGS (工具参数，增量)
├── TOOL_CALL_END
├── TOOL_CALL_RESULT
├── TEXT_MESSAGE_END
RUN_FINISHED
```

---

## 10. POM 治理建议

### 10.1 当前 pom.xml

```xml
<dependencies>
    <!-- 所有依赖平铺，无分组 -->
</dependencies>
```

### 10.2 优化建议

```xml
<properties>
    <agentscope.version>1.0.8</agentscope.version>
</properties>

<dependencies>
    <!-- ==================== Spring Boot ==================== -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-configuration-processor</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- ==================== AgentScope ==================== -->
    <dependency>
        <groupId>io.agentscope</groupId>
        <artifactId>agentscope</artifactId>
        <version>${agentscope.version}</version>
    </dependency>
    <dependency>
        <groupId>io.agentscope</groupId>
        <artifactId>agentscope-extensions-studio</artifactId>
        <version>${agentscope.version}</version>
    </dependency>
    <dependency>
        <groupId>io.agentscope</groupId>
        <artifactId>agentscope-extensions-autocontext-memory</artifactId>
        <version>${agentscope.version}</version>
    </dependency>
    <dependency>
        <groupId>io.agentscope</groupId>
        <artifactId>agentscope-extensions-agui</artifactId>
        <version>${agentscope.version}</version>
    </dependency>

    <!-- ==================== 工具库 ==================== -->
    <dependency>
        <groupId>com.github.ben-manes.caffeine</groupId>
        <artifactId>caffeine</artifactId>
    </dependency>
    <dependency>
        <groupId>org.commonmark</groupId>
        <artifactId>commonmark</artifactId>
        <version>0.24.0</version>
    </dependency>

    <!-- ==================== 测试 ==================== -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## 11. 总结与建议

### 11.1 架构对比

| 维度 | AgentScope | Assistant-Agent |
|------|------------|-----------------|
| 定位 | 通用框架 | 业务应用 |
| 配置化 | 代码为主 | Spring Boot 配置 |
| 工厂模式 | 无 | 广泛使用 |
| Session 管理 | 无 | 完整实现 |
| SSE 格式 | 原生 Event | 建议迁移到 AG-UI |

### 11.2 优化建议

| 优先级 | 建议 | 收益 |
|--------|------|------|
| **高** | SSE 迁移到 AG-UI | 思考/正文分离、工具流式完整 |
| **中** | POM 分组优化 | 依赖清晰、易维护 |
| **低** | 多模块拆分 | 仅在需要对外发布时考虑 |

### 11.3 最佳实践

1. **保持同步**：AgentScope 版本升级时关注 Breaking Changes
2. **配置驱动**：尽量通过 YAML 配置而非代码硬编码
3. **使用官方扩展**：AG-UI、Studio 等扩展可直接使用
4. **Hook 扩展**：通过 Hook 机制扩展能力，避免修改框架代码

---

## 附录：关键文件路径

### AgentScope 官方

| 文件 | 路径 |
|------|------|
| ReActAgent | `agentscope-core/src/main/java/io/agentscope/core/ReActAgent.java` |
| Event | `agentscope-core/src/main/java/io/agentscope/core/agent/Event.java` |
| StreamOptions | `agentscope-core/src/main/java/io/agentscope/core/agent/StreamOptions.java` |
| AguiAgentAdapter | `agentscope-extensions-agui/.../adapter/AguiAgentAdapter.java` |

### Assistant-Agent

| 文件 | 路径 |
|------|------|
| ReActAgentBuilder | `agent/ReActAgentBuilder.java` |
| ToolkitFactory | `component/toolkit/ToolkitFactory.java` |
| SkillBoxFactory | `component/skillbox/SkillBoxFactory.java` |
| AgentRuntimeManager | `service/runtime/AgentRuntimeManager.java` |
