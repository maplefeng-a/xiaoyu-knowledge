---
id: 4b5f7503-d0e7-4db0-9f0a-f1f2f250c1d3
type: concept
title: MsgHub消息总线
status: active
aliases:
  - MsgHub
  - 多智能体消息总线
tags:
  - agentscope-java
refs: []
---

# MsgHub 消息总线

> agentscope-java 集成分析

## 一句话

基于文件系统的事件总线，通过“目录即房间、文件即事件”实现多智能体可追溯协作。

## 核心定位

- 轻量：基于 Markdown 文件，无需额外中间件
- 解耦：发布-订阅通信，发送者与接收者分离
- 可追溯：消息天然持久化，可审计与回放
- 易扩展：支持 event_type 与元数据扩展

## 结构抽象

- Room（房间）：`messages/{room}/`
- Event（事件）：单个 `.md` 消息文件（含 frontmatter）
- Hub（总线）：管理订阅、广播、查询
- 工具层：`send_event/query_events` 提供生产与消费入口

## 协议要点

- 必填：`event_type/sender/timestamp/room/title/content`
- 可选：`tags/reply_to/related_task/status/priority`
- 常见类型：`work_update/milestone/question/answer/decision/summary`

## 在 assistant-agent 中的接入建议

- Runtime 协作面：将 MsgHub 作为子智能体协作通道
- Session 边界：会话内上下文放 session memory，跨会话协作事实落 MsgHub
- 回溯策略：优先按 room + 时间窗口拉取，再按 event_type 过滤

## 详见

`documents/agentscope-java/msgshub-research-report.md`

## 关联

- [[knowledge/agentscope-java/知识地图|知识地图]]
- [[knowledge/agentscope-java/04-集成分析/多智能体协作|多智能体协作]]
- [[knowledge/agentscope-java/04-集成分析/MCP协议|MCP协议]]
- [[knowledge/agentscope-java/03-Agent能力层/Agent抽象|Agent抽象]]
