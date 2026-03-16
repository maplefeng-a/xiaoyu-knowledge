
# RAG 扩展总览

> agentscope-java 检索增强生成扩展集合

## 一句话

提供五种 RAG 实现：Simple（本地）、Dify、RAGFlow、百炼（阿里云）、Haystack，支持知识检索增强 Agent 能力。

## 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       RAG 扩展架构                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Knowledge 接口                        │    │
│  │   - addDocuments(List<Document>): Mono<Void>            │    │
│  │   - retrieve(String, RetrieveConfig): Mono<List<Document>>│   │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                      │
│    ┌──────────┬───────────┼───────────┬──────────┬─────────┐   │
│    ▼          ▼           ▼           ▼          ▼         ▼   │
│ ┌──────┐ ┌──────┐ ┌─────────┐ ┌────────┐ ┌───────┐ ┌────────┐ │
│ │Simple│ │ Dify │ │ RAGFlow │ │ 百炼   │ │Haystack│ │ Others │ │
│ │(本地)│ │(托管)│ │ (自托管)│ │(阿里云)│ │(开源) │ │        │ │
│ └──────┘ └──────┘ └─────────┘ └────────┘ └───────┘ └────────┘ │
│    │         │          │          │         │                │
│    ▼         ▼          ▼          ▼         ▼                │
│ 本地向量   Dify API   RAGFlow    百炼API   Haystack          │
│  存储                服务/本地             Pipeline           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 五种 RAG 扩展对比

| 特性 | Simple | Dify | RAGFlow | 百炼 | Haystack |
|------|--------|------|---------|------|----------|
| **部署方式** | 本地 | 托管 | 自托管/托管 | 云服务 | 自托管 |
| **向量存储** | 内存 | Dify 托管 | 自带 | 阿里云 | 可配置 |
| **文档解析** | 简单 | 丰富 | 丰富 | 丰富 | 丰富 |
| **分块策略** | 固定 | 智能可配置 | 智能可配置 | 智能可配置 | 灵活配置 |
| **多模态** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **外部依赖** | 无 | Dify 服务 | RAGFlow 服务 | 阿里云 | 向量数据库 |
| **适用场景** | 原型开发 | 快速集成 | 私有化 | 国内云原生 | 高度定制 |

---

## Simple RAG

### 核心特点

- **零依赖**：本地内存向量存储
- **简单分块**：固定大小分块
- **快速原型**：适合开发和测试

### 使用案例

```java
// 创建 Simple RAG
SimpleKnowledge knowledge = SimpleKnowledge.builder()
    .embeddingModel(embeddingModel)
    .chunkSize(500)
    .chunkOverlap(50)
    .build();

// 添加文档
Document doc = Document.builder()
    .content("AgentScope 是一个多智能体框架...")
    .metadata(Map.of("source", "readme.md"))
    .build();
knowledge.addDocuments(List.of(doc)).block();

// 与 ReActAgent 集成
ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(model)
    .knowledge(knowledge)
    .ragMode(RAGMode.GENERIC)  // 自动注入
    .build();
```

---

## Dify RAG

### 核心特点

- **托管服务**：Dify Cloud 或自托管
- **丰富解析**：PDF、Word、Markdown 等
- **知识库管理**：可视化知识库管理

### 使用案例

```java
// 创建 Dify RAG
DifyKnowledge knowledge = DifyKnowledge.builder()
    .apiBaseUrl("https://api.dify.ai")
    .apiKey(System.getenv("DIFY_API_KEY"))
    .datasetId("dataset_123")
    .build();

// 文档通过 Dify 界面上传

// 检索
List<Document> docs = knowledge.retrieve("什么是 AgentScope?", config).block();
```

---

## RAGFlow RAG

### 核心特点

- **深度解析**：基于深度学习的文档理解
- **表格支持**：复杂表格解析
- **多模态**：图片、表格、公式

### 使用案例

```java
// 创建 RAGFlow RAG
RAGFlowKnowledge knowledge = RAGFlowKnowledge.builder()
    .apiBaseUrl("http://localhost:9380")
    .apiKey(System.getenv("RAGFLOW_API_KEY"))
    .datasetId("dataset_123")
    .build();
```

---

## 百炼 RAG（阿里云）

### 核心特点

- **阿里云集成**：与阿里云生态深度集成
- **中文优化**：针对中文场景优化
- **企业级**：高可用、高安全

### 使用案例

```java
// 创建百炼 RAG
BailianKnowledge knowledge = BailianKnowledge.builder()
    .apiKey(System.getenv("BAILIAN_API_KEY"))
    .datasetId("dataset_123")
    .build();
```

---

## Haystack RAG

### 核心特点

- **开源生态**：Haystack 开源框架
- **高度可定制**：Pipeline 可自由组合
- **多后端**：支持多种向量数据库

### 使用案例

```java
// 创建 Haystack RAG
HaystackKnowledge knowledge = HaystackKnowledge.builder()
    .documentStore(documentStore)
    .embeddingModel(embeddingModel)
    .retrieverType(RetrieverType.EMBEDDING)
    .build();
```

---

## RAG 模式

| 模式 | 说明 |
|------|------|
| `GENERIC` | 自动注入：框架自动检索并注入知识到 Prompt |
| `AGENTIC` | Agent 控制：Agent 通过工具主动检索知识 |
| `NONE` | 禁用：不启用 RAG |

### Generic 模式（自动注入）

```java
ReActAgent agent = ReActAgent.builder()
    .knowledge(knowledge)
    .ragMode(RAGMode.GENERIC)  // 自动注入
    .retrieveConfig(RetrieveConfig.builder()
        .limit(5)
        .scoreThreshold(0.5)
        .build())
    .build();
// 框架自动在 Reasoning 前检索并注入知识
```

### Agentic 模式（Agent 控制）

```java
ReActAgent agent = ReActAgent.builder()
    .knowledge(knowledge)
    .ragMode(RAGMode.AGENTIC)  // 注册检索工具
    .build();
// Agent 通过 retrieve_knowledge 工具主动检索
```

---

## 选择建议

| 场景 | 推荐扩展 |
|------|---------|
| **原型开发** | Simple（零依赖） |
| **快速集成** | Dify（托管服务） |
| **私有化部署** | RAGFlow 或 Haystack |
| **国内云原生** | 百炼（阿里云） |
| **高度定制** | Haystack（Pipeline 灵活） |
| **中文场景** | 百炼 或 RAGFlow |

---

## 源码位置

- **Simple**: `io.agentscope.core.rag.simple.SimpleKnowledge`
- **Dify**: `io.agentscope.core.rag.dify.DifyKnowledge`
- **RAGFlow**: `io.agentscope.core.rag.ragflow.RAGFlowKnowledge`
- **百炼**: `io.agentscope.core.rag.bailian.BailianKnowledge`
- **Haystack**: `io.agentscope.core.rag.haystack.HaystackKnowledge`

## 关联

- [[knowledge/agentscope-java/03-Agent能力层/RAG系统|RAG系统]]
- [[knowledge/agentscope-java/05-框架入口层/ReActAgent|ReActAgent]]
- [[knowledge/agentscope-java/知识地图|知识地图]]
