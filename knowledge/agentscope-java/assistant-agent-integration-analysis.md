# assistant-agent 对 agentscope-java 集成分析

**分析日期**：2026-02-25
**agentscope-java 版本**：1.0.8
**分析目的**：评估 assistant-agent 引用了 agentscope-java 多少功能

---

## 一、agentscope-java 功能模块清单

### 1.1 核心模块（agentscope-core）

| 模块 | 功能 | 文件数 |
|------|------|--------|
| **agent** | ReActAgent 智能体、流式输出、状态管理 | ~25 |
| **formatter** | 多模型适配（Anthropic/DashScope/Gemini/Ollama/OpenAI） | ~40 |
| **hook** | 钩子系统（人机协同、干预机制） | ~10 |
| **interruption** | 安全中断、优雅取消 | ~10 |
| **memory** | 记忆管理（短期/长期/语义搜索） | ~20 |
| **message** | 消息结构（Msg/ContentBlock/TextBlock等） | ~15 |
| **model** | 模型集成（OpenAI/DashScope/Ollama等） | ~30 |
| **pipeline** | 多智能体流水线（Sequential/Fanout） | ~20 |
| **plan** | PlanNotebook 任务规划系统 | ~25 |
| **rag** | 检索增强生成 | ~15 |
| **session** | 会话管理（JSON序列化） | ~10 |
| **skill** | 技能系统（加载/注册/执行） | ~30 |
| **state** | 状态管理（SessionKey） | ~5 |
| **tool** | 工具系统（内置工具/MCP/沙箱） | ~50 |
| **tracing** | OpenTelemetry 链路追踪 | ~10 |
| **util** | 工具类（JSON/Schema） | ~10 |

**核心模块文件总数**：325 个 Java 文件

### 1.2 扩展模块（agentscope-extensions）

| 模块 | 功能 |
|------|------|
| **a2a** | Agent-to-Agent 分布式协作 |
| **agui** | AG-UI 协议 |
| **autocontext-memory** | 自动上下文记忆 |
| **chat-completions-web** | Web 聊天补全 |
| **higress** | Higress 网关集成 |
| **mem0** | Mem0 记忆服务 |
| **nacos** | Nacos 服务注册 |
| **rag-bailian** | 阿里云百炼 RAG |
| **rag-dify** | Dify RAG |
| **rag-haystack** | Haystack RAG |
| **rag-ragflow** | RAGFlow RAG |
| **rag-simple** | 简易 RAG |
| **reme** | ReMe 记忆 |
| **scheduler** | 任务调度 |
| **session-mysql** | MySQL 会话持久化 |
| **session-redis** | Redis 会话持久化 |
| **skill-git-repository** | Git 仓库技能 |
| **studio** | AgentScope Studio 可视化 |
| **kotlin** | Kotlin 扩展 |
| **micronaut/quarkus** | 其他框架支持 |

---

## 二、assistant-agent 已引用功能

### 2.1 Maven 依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope</artifactId>
    <version>1.0.8</version>
</dependency>
```

### 2.2 引用的类清单

| 模块 | 引用的类 | 用途 |
|------|----------|------|
| **agent** | `ReActAgent`, `EventType`, `StreamOptions` | 智能体核心、流式事件 |
| **memory** | `InMemoryMemory` | 短期记忆（仅内存） |
| **message** | `Msg`, `MsgRole`, `ContentBlock`, `TextBlock`, `ThinkingBlock`, `ToolResultBlock` | 消息结构 |
| **model** | `OpenAIChatModel` | OpenAI 兼容模型 |
| **session** | `Session`, `JsonSession` | 会话管理 |
| **skill** | `SkillBox`, `AgentSkill`, `FileSystemSkillRepository` | 技能加载 |
| **state** | `SessionKey`, `SimpleSessionKey` | 会话状态 |
| **tool** | `Toolkit`, `Tool`, `ToolParam` | 工具定义 |
| **tool.mcp** | `McpClientBuilder`, `McpClientWrapper` | MCP 协议集成 |

### 2.3 引用分布

```
com.assistant.agent
├── config/
│   └── SessionConfig.java → Session, JsonSession
├── controller/
│   └── SessionController.java → Msg
├── mcp/
│   └── McpClientFactory.java → McpClientBuilder, McpClientWrapper
├── service/
│   ├── ChatService.java → ReActAgent, EventType, StreamOptions, InMemoryMemory,
│   │                     Msg, MsgRole, ContentBlock, TextBlock, ThinkingBlock,
│   │                     ToolResultBlock, OpenAIChatModel, Session, SkillBox, Toolkit
│   └── SessionService.java → Msg, Session, SessionKey, SimpleSessionKey
├── skill/
│   └── SkillLoader.java → AgentSkill, SkillBox, FileSystemSkillRepository,
│                         Toolkit, McpClientWrapper
└── tool/
    ├── ToolRegistry.java → Toolkit, McpClientWrapper
    ├── BashTool.java → Tool, ToolParam
    ├── EditTool.java → Tool, ToolParam
    ├── GlobTool.java → Tool, ToolParam
    ├── GrepTool.java → Tool, ToolParam
    ├── ReadTool.java → Tool, ToolParam
    └── WriteTool.java → Tool, ToolParam
```

---

## 三、未引用功能

### 3.1 核心模块未使用

| 模块 | 功能 | 潜在价值 |
|------|------|----------|
| **formatter** | 多模型格式化 | 支持更多模型提供商 |
| **hook** | 钩子系统 | 人机协同、运行时干预 |
| **interruption** | 安全中断 | 长任务中断恢复 |
| **pipeline** | 多智能体流水线 | 复杂协作场景 |
| **plan** | PlanNotebook | 结构化任务规划 |
| **rag** | 检索增强生成 | 知识库问答 |
| **tracing** | 链路追踪 | 可观测性 |
| **tool/coding** | 代码执行沙箱 | 安全代码执行 |
| **tool/file** | 文件操作工具 | （已自定义实现） |
| **tool/multimodal** | 多模态工具 | 图像/音频处理 |
| **tool/subagent** | 子智能体 | 嵌套智能体调用 |

### 3.2 扩展模块未使用

所有 20+ 扩展模块均未引用，包括：
- a2a（分布式协作）
- studio（可视化调试）
- session-mysql/redis（会话持久化）
- rag-*（各种 RAG 集成）
- 等

---

## 四、占比统计

| 维度 | 数量 | 占比 |
|------|------|------|
| **agentscope-core 文件数** | 325 | 100% |
| **assistant-agent 引用的独立类** | ~30 | **~9%** |
| **已使用的核心模块** | 8/17 | **~47%** |
| **已使用的扩展模块** | 0/20+ | **0%** |

---

## 五、总结

### 5.1 当前集成特点

1. **轻量集成**：仅依赖核心包，未使用任何扩展
2. **使用深度浅**：类级别引用约 9%，模块覆盖约 47%
3. **自定义较多**：工具（Bash/Edit/Read等）自行实现，未用内置

### 5.2 主要用途

- **ReActAgent**：作为智能体运行时引擎
- **MCP 协议**：通过 McpClientWrapper 集成外部工具
- **Skill 系统**：加载和执行 markdown 格式的技能
- **会话管理**：Session + JsonSession 实现会话持久化

### 5.3 潜在增强方向

| 方向 | 对应模块 | 收益 |
|------|----------|------|
| 长期记忆 | memory + extensions/mem0 | 跨会话上下文保持 |
| 知识库问答 | rag + extensions/rag-* | 企业知识集成 |
| 任务规划 | plan | 复杂任务分解 |
| 可观测性 | tracing + studio | 调试与监控 |
| 分布式协作 | a2a + nacos | 多智能体服务化 |

---

## 相关文档

- [agentscope-java 官方文档](https://java.agentscope.io/zh/intro.html)
- [agentscope-java GitHub](https://github.com/agentscope-ai/agentscope-java)