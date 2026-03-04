---
id: 61c51171-0b05-463a-bb1f-1960be62221c
type: concept
title: ReActAgent
status: active
aliases: []
tags:
  - agentscope-java
refs: []
---

# ReActAgent

> agentscope-java 框架入口层

## 一句话

主 Agent 实现，组合推理(Reasoning)、行动(Acting)、总结(Summary)等所有能力。

## ReAct 循环

```
用户输入
   │
   ├─→ 检索长期记忆 (StaticLongTermMemoryHook)
   │
   ├─→ Reasoning (LLM 推理)
   │      │
   │      └─→ 需要工具?
   │             │
   │             ├─ YES → Acting (执行工具)
   │             │           │
   │             │           └─→ 回到 Reasoning
   │             │
   │             └─ NO → Summary (生成最终响应)
   │
   └─→ 记录到长期记忆 (StaticLongTermMemoryHook)
```

## 核心能力

- 推理 (Reasoning)
- 工具调用 (Acting)
- 总结 (Summary)
- 记忆 (Memory)
- 技能 (Skill)
- 规划 (Plan)
- RAG

## 详见

`documents/agentscope-java/03-Agent能力层/agent.md`

## 关联
- [[knowledge/agentscope-java/知识地图|知识地图]]
- [[knowledge/agentscope-java/02-核心抽象层/模型抽象|模型抽象]]
- [[knowledge/agentscope-java/02-核心抽象层/工具系统|工具系统]]
- [[knowledge/agentscope-java/02-核心抽象层/记忆管理|记忆管理]]
