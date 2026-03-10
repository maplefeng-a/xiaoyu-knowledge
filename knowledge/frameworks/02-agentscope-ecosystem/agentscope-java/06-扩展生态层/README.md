---
id: agentscope-extensions-ecosystem
type: overview
title: AgentScope 扩展生态
status: active
tags:
  - agentscope-java
  - extensions
  - ecosystem
---

# AgentScope 扩展生态

> agentscope-java 的扩展模块生态

## 概述

AgentScope 提供丰富的扩展生态，通过 `agentscope-extensions` 模块提供各种能力扩展。

## 扩展分类

### 协议集成
| 扩展 | 说明 |
|------|------|
| `agentscope-extensions-a2a` | A2A 协议（多智能体协作） |
| `agentscope-extensions-mcp` | MCP 协议（工具调用） |

### 记忆扩展
| 扩展 | 说明 |
|------|------|
| `agentscope-extensions-mem0` | Mem0 长期记忆 |
| `agentscope-extensions-reme` | ReMe 记忆系统 |
| `agentscope-extensions-autocontext-memory` | 自动上下文记忆 |

### RAG 扩展
| 扩展 | 说明 |
|------|------|
| `agentscope-extensions-rag-simple` | 简单 RAG 实现 |
| `agentscope-extensions-rag-dify` | Dify 集成 |
| `agentscope-extensions-rag-ragflow` | RAGFlow 集成 |
| `agentscope-extensions-rag-bailian` | 阿里云百炼集成 |
| `agentscope-extensions-rag-haystack` | Haystack 集成 |

### 框架集成
| 扩展 | 说明 |
|------|------|
| `agentscope-spring-boot-starters` | Spring Boot 集成 |
| `agentscope-quarkus-extensions` | Quarkus 集成 |
| `agentscope-micronaut-extensions` | Micronaut 集成 |

### 基础设施
| 扩展 | 说明 |
|------|------|
| `agentscope-extensions-session-redis` | Redis 会话存储 |
| `agentscope-extensions-session-mysql` | MySQL 会话存储 |
| `agentscope-extensions-scheduler` | 任务调度 |
| `agentscope-extensions-studio` | AgentScope Studio |

### 其他
| 扩展 | 说明 |
|------|------|
| `agentscope-extensions-training` | 模型训练 |
| `agentscope-extensions-kotlin` | Kotlin DSL |
| `agentscope-extensions-agui` | AGUI 协议 |

---

## 使用方式

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-mem0</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

---

## 相关卡片

- [[knowledge/agentscope-java/03-Agent能力层/记忆管理|记忆管理]]
- [[knowledge/agentscope-java/07-可观测性/Studio 可视化|Studio 可视化]]
- [[knowledge/agentscope-java/08-集成协议/A2A 协议|A2A 协议]]
