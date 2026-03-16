
# MCP 协议支持

> agentscope-java 集成分析

## 一句话

通过 stdio 与外部 Agent/MCP Server 通信，实现跨语言、跨框架协作。

## 核心设计

- **stdio 通信**: 标准输入输出 JSON-RPC
- **Tool 暴露**: MCP Server 工具自动注册到 Toolkit
- **Agent 即工具**: 外部 Agent 作为工具调用

## 支持模式

1. **Agent 作为 MCP Server** - Python Agent 被 Java 调用
2. **调用 MCP Server** - 使用外部 MCP 工具

## 详见

`documents/agentscope-java/04-集成分析/mcp-support-analysis.md`

## 关联
- [[knowledge/agentscope-java/知识地图|知识地图]]
- [[knowledge/agentscope-java/02-核心抽象层/工具系统|工具系统]]
- [[knowledge/agentscope-java/04-集成分析/多智能体协作|多智能体协作]]
