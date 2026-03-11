
# RAG系统

> 03-Agent能力层 | 检索增强生成

## 一句话

RAG（Retrieval-Augmented Generation）通过检索外部知识增强 Agent 的生成能力。

## 三种模式

| 模式 | 说明 | 实现方式 |
|------|------|----------|
| GENERIC | 自动检索，每个 reasoning 前注入 | Hook |
| AGENTIC | Agent 主动决定何时检索 | Tool |
| NONE | 禁用 RAG | - |

## 核心接口

### Knowledge

```java
public interface Knowledge {
    // 添加文档
    Mono<Void> addDocuments(List<Document> documents);

    // 检索相关文档
    Mono<List<Document>> retrieve(String query, RetrieveConfig config);
}
```

### RetrieveConfig

| 参数 | 说明 | 默认值 |
|------|------|--------|
| limit | 返回文档数量 | 5 |
| scoreThreshold | 相似度阈值 | 0.5 |

## GenericRAGHook

自动检索模式，在每个 reasoning 前注入知识：

```java
Knowledge knowledge = new SimpleKnowledge(embeddingModel, vectorStore);
GenericRAGHook ragHook = new GenericRAGHook(knowledge);

ReActAgent agent = ReActAgent.builder()
    .name("Assistant")
    .model(chatModel)
    .hook(ragHook)
    .build();
```

### 工作流程

1. 从消息中提取用户查询
2. 调用 `knowledge.retrieve()` 检索相关文档
3. 构建 `<retrieved_knowledge>` 系统消息
4. 注入到消息列表中

## 在 ReActAgent 中使用

```java
// 方式1：GENERIC 模式（自动）
ReActAgent agent = ReActAgent.builder()
    .knowledge(knowledgeBase)
    .ragMode(RAGMode.GENERIC)
    .retrieveConfig(RetrieveConfig.builder()
        .limit(5)
        .scoreThreshold(0.5)
        .build())
    .build();

// 方式2：AGENTIC 模式（主动）
ReActAgent agent = ReActAgent.builder()
    .knowledge(knowledgeBase)
    .ragMode(RAGMode.AGENTIC)  // Agent 通过工具主动检索
    .build();
```

## 扩展实现

| 扩展 | 说明 |
|------|------|
| rag-simple | 简单内存实现 |
| rag-dify | Dify 平台集成 |
| rag-ragflow | RAGFlow 集成 |
| rag-haystack | Haystack 集成 |
| rag-bailian | 阿里百炼集成 |

## 源码位置

- `io.agentscope.core.rag.Knowledge`
- `io.agentscope.core.rag.RAGMode`
- `io.agentscope.core.rag.GenericRAGHook`
- `io.agentscope.core.rag.KnowledgeRetrievalTools`

## 关联

- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]]
- [[knowledge/agentscope-java/05-框架入口层/ReActAgent|ReActAgent]]
- [[knowledge/agentscope-java/06-扩展生态层/README|RAG扩展]]
