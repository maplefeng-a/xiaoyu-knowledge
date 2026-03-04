---
id: 268d5afe-d313-44aa-b146-36b36f74519e
type: concept
title: Hook系统
status: active
aliases: []
tags:
  - agentscope-java
refs: []
---

# Hook 钩子系统

> agentscope-java Agent 能力层

## 一句话

统一事件模型，在特定执行阶段监控和修改 Agent 行为。

## 核心设计

- **统一事件**: onEvent(HookEvent) 处理所有事件
- **优先级排序**: priority() 控制执行顺序
- **可修改事件**: PreReasoningEvent、PreActingEvent 等

## 事件类型

| 事件 | 时机 | 可修改 |
|------|------|--------|
| PreCallEvent | Agent 调用前 | ❌ |
| PostCallEvent | Agent 调用后 | ✅ |
| PreReasoningEvent | 推理前 | ✅ |
| PostReasoningEvent | 推理后 | ✅ |
| PreActingEvent | 工具执行前 | ✅ |
| PostActingEvent | 工具执行后 | ✅ |
| ErrorEvent | 发生错误 | ❌ |

## 内置 Hook

- StaticLongTermMemoryHook - 长期记忆
- GenericRAGHook - RAG 检索
- TTSHook - 文本转语音

## 详见

`documents/agentscope-java/03-Agent能力层/hook.md`

## 关联
- [[knowledge/agentscope-java/知识地图|知识地图]]
- [[knowledge/agentscope-java/03-Agent能力层/Agent抽象|Agent抽象]]
- [[knowledge/agentscope-java/04-框架入口层/ReActAgent|ReActAgent]]
