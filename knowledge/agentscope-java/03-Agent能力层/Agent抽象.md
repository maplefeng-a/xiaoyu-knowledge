---
id: 02209ec9-f5f4-472b-bf24-cb483bb80b09
type: concept
title: Agent抽象
status: active
aliases: []
tags:
  - agentscope-java
refs: []
---

# Agent 抽象

> agentscope-java Agent 能力层

## 一句话

Agent 基类体系，定义智能体的核心能力和生命周期。

## 核心设计

- **接口分层**: Agent → CallableAgent → StreamableAgent → ObservableAgent
- **能力组合**: StructuredOutputCapableAgent (结构化输出)
- **状态管理**: StateModule 支持持久化

## Agent 类型

| 接口 | 能力 |
|------|------|
| `Agent` | 基础智能体 |
| `CallableAgent` | 可调用 (call()) |
| `StreamableAgent` | 流式响应 |
| `ObservableAgent` | 可观测 (Hook) |

## 详见

`documents/agentscope-java/03-Agent能力层/agent.md`

## 关联
- [[knowledge/agentscope-java/知识地图|知识地图]]
- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]]
- [[knowledge/agentscope-java/04-框架入口层/ReActAgent|ReActAgent]]
