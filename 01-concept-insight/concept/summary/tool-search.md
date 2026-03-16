---
id: tool-search
title: Tool Search - AI Agent 工具动态发现机制
date: 2026-03-14
tags:
  - ai-agent
  - tool-use
  - context-engineering
  - anthropic
status: active
---

# Tool Search - AI Agent 工具动态发现机制

> Anthropic 于 2025年11月24日 发布的 beta 功能，用于解决大规模工具管理的上下文膨胀和准确率下降问题。

## 核心问题

### 1. 上下文膨胀

**传统方式：** 所有工具定义一次性加载到上下文

```
┌─────────────────────────────────────────┐
│           Context Window                │
├─────────────────────────────────────────┤
│ System Prompt: 5K tokens                │
│ User Message: 1K tokens                 │
│ Tool Definitions: 72K tokens ← 问题！   │
│   - GitHub MCP: 15K tokens              │
│   - Slack MCP: 12K tokens               │
│   - Sentry MCP: 10K tokens              │
│   - Grafana MCP: 15K tokens             │
│   - Splunk MCP: 20K tokens              │
├─────────────────────────────────────────┤
│ 可用空间：~12K tokens                    │
└─────────────────────────────────────────┘
```

**Tool Search 方式：** 按需加载

```
┌─────────────────────────────────────────┐
│           Context Window                │
├─────────────────────────────────────────┤
│ System Prompt: 5K tokens                │
│ User Message: 1K tokens                 │
│ Tool Search Tool: 500 tokens            │
│ 搜索到的工具: 3K tokens                  │
├─────────────────────────────────────────┤
│ 可用空间：~80K tokens                    │
└─────────────────────────────────────────┘

节省 95% tokens！
```

### 2. 工具选择准确率下降

| 工具数量 | 准确率（无 Tool Search） |
|----------|------------------------|
| 1-10 | 95%+ |
| 10-30 | 85% |
| 30-50 | 70% |
| 50-100 | 50% |
| 100+ | <40% |

**原因：**
- 工具描述相互干扰
- 相似工具难以区分
- 上下文中工具太多导致注意力分散

---

## 工作原理

### 完整流程

```
┌──────────────────────────────────────────────────────────────┐
│                      用户请求                                 │
│          "帮我搜索 GitHub 上的 openclaw 仓库"                │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Claude 分析请求                            │
│                                                              │
│  可用工具: [tool_search, read]                               │
│  判断: 需要 GitHub 相关工具                                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  调用 Tool Search Tool                        │
│                                                              │
│  tool_search(query: "GitHub repository search")              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  API 搜索工具注册表                           │
│                                                              │
│  搜索范围:                                                   │
│  - 工具名称                                                  │
│  - 工具描述                                                  │
│  - 参数名称                                                  │
│  - 参数描述                                                  │
│                                                              │
│  返回 Top-K (3-5个) 最相关工具                                │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  返回 tool_reference                          │
│                                                              │
│  [                                                           │
│    github_search_repos,                                      │
│    github_list_repos,                                        │
│    github_get_repo                                           │
│  ]                                                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              自动展开为完整工具定义                            │
│                                                              │
│  上下文中新增:                                               │
│  - github_search_repos (完整 schema)                         │
│  - github_list_repos (完整 schema)                           │
│  - github_get_repo (完整 schema)                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  Claude 选择并调用工具                        │
│                                                              │
│  github_search_repos(query: "openclaw", limit: 10)           │
└──────────────────────────────────────────────────────────────┘
```

### 初始化阶段

```javascript
// API 请求
{
  model: "claude-opus-4-5-20251119",
  tools: [
    // 1. Tool Search Tool（始终加载）
    {
      type: "tool_search_tool_bm25_20251119",
      name: "tool_search"
    },
    
    // 2. 核心工具（始终加载）
    {
      name: "read",
      description: "Read file contents",
      input_schema: {...},
      defer_loading: false  // 默认值
    },
    
    // 3. 延迟加载工具
    {
      name: "github_search_repos",
      description: "Search GitHub repositories",
      input_schema: {...},
      defer_loading: true  // 关键！
    }
  ]
}
```

---

## 两种搜索模式

### Regex 模式

```javascript
{
  type: "tool_search_tool_regex_20251119",
  name: "tool_search"
}
```

**特点：**
- Claude 构造正则表达式搜索
- 适合精确匹配
- 示例：搜索 "github.*repo"

**适用场景：**
- 知道工具名的大致模式
- 需要精确匹配

### BM25 模式（推荐）

```javascript
{
  type: "tool_search_tool_bm25_20251119",
  name: "tool_search"
}
```

**特点：**
- Claude 使用自然语言查询
- 基于词频和文档频率排序
- 语义理解更好

**适用场景：**
- 用自然语言描述需求
- 不确定工具名

---

## 搜索范围

Tool Search 搜索以下内容：

```
┌─────────────────────────────────────────┐
│            工具注册表                    │
├─────────────────────────────────────────┤
│ Tool Name: "github_search_repos"        │ ← 搜索
│ Description: "Search GitHub repos"      │ ← 搜索
│ Input Schema:                           │
│   - query: string                       │ ← 搜索参数名
│     "Search query text"                 │ ← 搜索参数描述
│   - limit: number                       │
│     "Max results to return"             │
└─────────────────────────────────────────┘
```

**搜索权重（推测）：**
1. 工具名称匹配（最高）
2. 工具描述匹配
3. 参数名匹配
4. 参数描述匹配

---

## 使用时机

### 推荐使用

| 条件 | 说明 |
|------|------|
| 工具定义 > 10K tokens | 上下文压力明显 |
| 工具数量 > 30 | 准确率开始下降 |
| 多 MCP 服务器 | 5+ 个服务器 |
| 工具使用不频繁 | 大部分工具很少用到 |

### 不推荐使用

| 条件 | 说明 |
|------|------|
| 工具 < 10 个 | 开销大于收益 |
| 每次都用所有工具 | 延迟加载无意义 |
| 工具定义很紧凑 | token 节省不明显 |

---

## 效果数据

### Token 节省

| 场景 | 传统方式 | Tool Search | 节省 |
|------|----------|-------------|------|
| 5 MCP (55K) | 55K | 8.7K | 84% |
| 10 MCP (110K) | 110K | 15K | 86% |
| 20 MCP (220K) | 超出上下文 | 25K | 89% |

### 准确率提升

| 模型 | 无 Tool Search | 有 Tool Search | 提升 |
|------|---------------|---------------|------|
| Claude Opus 4 | 49% | 74% | +25% |
| Claude Opus 4.5 | 79.5% | 88.1% | +8.6% |

---

## 自定义实现

Anthropic 允许自定义 Tool Search：

```javascript
// 自定义 Tool Search 工具
{
  name: "custom_tool_search",
  description: "Search tools using custom logic",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string" }
    }
  }
}

// 返回 tool_reference
{
  type: "tool_reference",
  tool_name: "my_custom_tool",
  server_name: "my_server"
}
```

**自定义实现选项：**
- 使用向量搜索
- 使用自定义排序逻辑
- 集成外部工具注册表

---

## OpenClaw 支持情况

**GitHub Issue #16076**: "Support Anthropic Tool Search Tool (defer_loading) for reduced context"

- ✅ Anthropic SDK 支持 `defer_loading` 参数
- ✅ SDK 支持 `tool_search_tool_regex_20251119` 和 `tool_search_tool_bm25_20251119`
- ⚠️ OpenClaw 核心正在考虑集成

**当前状态：**
- 22 个 MCP 工具暂不需要 Tool Search
- 建议工具 > 30-50 个时启用

---

## 参考资料

- [Anthropic: Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)
- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude API Docs: Tool Search Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)

---

## 总结

**Tool Search 本质：**

1. **延迟加载** - 工具不立即加载到上下文
2. **按需发现** - 根据用户需求动态搜索
3. **精确匹配** - 只加载 3-5 个最相关工具
4. **自动展开** - tool_reference 自动转为完整定义

**核心价值：**
- 节省 85%+ tokens
- 提升工具选择准确率
- 支持无限工具扩展

**适用场景：**
- 大规模 MCP 部署
- 工具使用频率低
- 上下文压力大
