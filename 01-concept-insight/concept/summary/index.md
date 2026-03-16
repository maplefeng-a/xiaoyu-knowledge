---
id: concept/index
title: 核心概念
tags: [concept, index]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
---

# 核心概念

> 智能体系统的核心概念和理论基础

## 知识领域

<div class="card-grid">
  <a href="./protocol/" class="card">
    <div class="card-icon">🏗️</div>
    <h3>协议分层</h3>
    <p>智能体系统的协议分层架构</p>
    <span class="card-tag highlight">核心</span>
  </a>
  
  <a href="../tracing-basics.md" class="card">
    <div class="card-icon">📊</div>
    <h3>Tracing 基础</h3>
    <p>智能体追踪和可观测性</p>
    <span class="card-tag">可观测性</span>
  </a>
  
  <a href="../context-engineering-basics.md" class="card">
    <div class="card-icon">🎯</div>
    <h3>上下文工程</h3>
    <p>Prompt 工程和上下文管理</p>
    <span class="card-tag">工程实践</span>
  </a>
</div>

## 核心主题

### 1. 协议分层架构

智能体系统从模型层到应用层的完整协议栈：

- **模型层**：SSE / HTTP Stream（LLM API）
- **智能体运行时**：Agent 框架（AgentScope / OpenClaw）
- **传输层**：WebSocket / HTTP + SSE
- **应用层**：消息格式转换（Matrix / Discord / 自定义）

[深入了解协议分层 →](./protocol/)

### 2. Tracing 和可观测性

智能体的追踪和监控是生产环境的关键能力。

[了解 Tracing 基础 →](../tracing-basics.md)

### 3. 上下文工程

Prompt 工程和上下文管理是智能体设计的核心技能。

[了解上下文工程 →](../context-engineering-basics.md)

## 相关链接

- [框架研究](../frameworks/)
- [构建智能体应用工作清单](../plan/agent-application/building-agent-application-checklist.md)
- [AgentScope 协议体系](../frameworks/02-agentscope-ecosystem/agentscope/protocol/)
