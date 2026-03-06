---
id: agentscope-protocol-mcp
type: concept
title: MCP 协议
status: active
aliases:
  - Model Context Protocol
tags:
  - agentscope-java
  - protocol
  - mcp
  - tool
refs:
  - io.agentscope.core.mcp.*
---

# MCP 协议

> Model Context Protocol - 模型上下文协议

## 一句话

MCP（Model Context Protocol）是 Anthropic 开源的模型上下文协议，用于标准化 LLM 与外部工具/资源的交互方式。

## 协议概述

```
┌─────────────────────────────────────────────────────────────────┐
│                      MCP 协议架构                               │
│                                                                  │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │   MCP Host   │                    │  MCP Server  │           │
│  │   (Agent)    │◄──────────────────►│  (Tool)      │           │
│  │              │    JSON-RPC        │              │           │
│  └──────────────┘                    └──────────────┘           │
│        │                                    │                   │
│        │                                    │                   │
│        ▼                                    ▼                   │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │  Resources   │                    │  Prompts     │           │
│  │  (文件/数据) │                    │  (提示模板)  │           │
│  └──────────────┘                    └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 核心概念

| 概念 | 说明 |
|------|------|
| **Host** | MCP 客户端，通常是 Agent |
| **Server** | MCP 服务端，提供工具/资源 |
| **Resource** | 可访问的资源（文件、数据） |
| **Prompt** | 可复用的提示模板 |
| **Tool** | 可调用的工具 |

## 协议消息

### 请求消息

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "AgentScope"
    }
  }
}
```

### 响应消息

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "AgentScope is a multi-agent framework..."
      }
    ]
  }
}
```

## 使用案例

### 作为 MCP Client

```java
// 创建 MCP Client
McpClient mcpClient = McpClient.builder()
    .serverUrl("http://localhost:3000")
    .build();

// 连接服务器
mcpClient.connect().block();

// 列出可用工具
List<ToolInfo> tools = mcpClient.listTools().block();

// 调用工具
ToolResult result = mcpClient.callTool("search", Map.of("query", "test")).block();

// 与 Agent 集成
Toolkit toolkit = new Toolkit();
toolkit.registerMcpTools(mcpClient);

ReActAgent agent = ReActAgent.builder()
    .toolkit(toolkit)
    .build();
```

### 作为 MCP Server

```java
// 创建 MCP Server
McpServer server = McpServer.builder()
    .name("my-tools")
    .version("1.0.0")
    .port(3000)
    .build();

// 注册工具
server.tool("search", "Search the web", SearchParams.class, (params) -> {
    return new ToolResult(searchWeb(params.query()));
});

// 启动服务器
server.start();
```

## 优势与劣势

### 优势 ✅

| 优势 | 说明 |
|------|------|
| **标准化** | Anthropic 主导，生态广泛 |
| **工具复用** | 同一工具可被多个 Agent 使用 |
| **资源访问** | 支持文件、数据库等资源 |
| **提示模板** | 可复用的提示模板 |

### 劣势 ⚠️

| 劣势 | 说明 |
|------|------|
| **协议复杂** | JSON-RPC + 多种消息类型 |
| **性能开销** | 网络调用有额外开销 |
| **调试困难** | 跨进程调试复杂 |

## 源码位置

`io.agentscope.core.mcp.*`

## 关联

- [[knowledge/agentscope-java/02-核心抽象层/工具系统|工具系统]]
- [[knowledge/agentscope-java/08-集成协议/A2A协议|A2A协议]]
- [[knowledge/agentscope-java/08-集成协议/AGUI协议|AGUI协议]]
