---
id: agentscope-rag-capability
type: concept
title: RAG 能力
status: active
aliases:
  - RAG
  - Retrieval-Augmented Generation
tags:
  - agentscope-java
  - rag
  - knowledge-retrieval
refs:
  - agentscope-core/rag/
  - agentscope-extensions/agentscope-extensions-rag-*
---

# RAG 能力

> agentscope-java Agent 能力层 | 检索增强生成

## 一句话

检索增强生成能力，从知识库中检索相关信息辅助 Agent 生成更准确的回答。

---

## 核心概念

### RAG 流程

```
用户查询 → Embedding → 向量检索 → 上下文构建 → LLM 生成 → 回答
```

### Document

```java
Document {
  id: String                      // 文档 ID
  content: String                 // 文档内容
  metadata: DocumentMetadata      // 元数据
  embedding: float[]              // 向量嵌入
}
```

### RetrieveConfig

```java
RetrieveConfig {
  topK: int                       // 返回 Top K 结果
  threshold: double               // 相似度阈值
  rerank: boolean                 // 是否重排序
}
```

---

## RAG 扩展

| 扩展 | 说明 |
|------|------|
| `agentscope-extensions-rag-simple` | 简单内存 RAG |
| `agentscope-extensions-rag-dify` | Dify 集成 |
| `agentscope-extensions-rag-ragflow` | RAGFlow 集成 |
| `agentscope-extensions-rag-bailian` | 阿里云百炼 |
| `agentscope-extensions-rag-haystack` | Haystack 集成 |

---

## 使用示例

### GenericRAGHook

```java
RAGService ragService = new SimpleRAGService()
    .indexDocuments(documents);

GenericRAGHook ragHook = GenericRAGHook.builder()
    .ragService(ragService)
    .topK(3)
    .build();

agent.addHook(ragHook);
```

### 自定义 RAG

```java
public class MyRAGService implements RAGService {
    @Override
    public Mono<List<Document>> retrieve(String query, RetrieveConfig config) {
        // 1. 生成 query embedding
        // 2. 向量检索
        // 3. 返回相关文档
    }
    
    @Override
    public Mono<Void> index(List<Document> documents) {
        // 索引文档
    }
}
```

---

## 源码位置

- `io.agentscope.core.rag.RAGService`
- `io.agentscope.core.rag.model.Document`
- `io.agentscope.core.hook.GenericRAGHook`

---

## 关联卡片

- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]] - GenericRAGHook
- [[knowledge/agentscope-java/06-扩展生态层/README|扩展生态]] - RAG 扩展

---

## 更新记录

- 2026-03-04: 初始创建
