
# Knowledge HTTP 接口文档

## 概述

为前端知识 Tab 提供 HTTP 接口，支持：
- 知识树浏览
- 卡片详情查看
- 卡片搜索
- 卡片写入

---

## 接口清单

| 方法 | 路径 | 用途 | 优先级 |
|------|------|------|--------|
| GET | `/cards/tree` | 获取知识树 | MVP |
| GET | `/cards/content` | 获取卡片详情 | MVP |
| GET | `/cards` | 搜索卡片 | 后续 |
| POST | `/cards` | 写入卡片 | 已有 |

---

## 1. 获取知识树结构

**GET** `/cards/tree`

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| dir | string | 否 | - | 子目录路径，如 `agentscope-java` |
| depth | integer | 否 | 2 | 目录深度 |
| includeCards | boolean | 否 | false | 是否包含卡片节点 |

### 响应

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "path": "",
    "truncated": false,
    "children": [
      {
        "type": "dir",
        "name": "agentscope-java",
        "path": "agentscope-java",
        "hasChildren": true
      },
      {
        "type": "dir",
        "name": "assistant",
        "path": "assistant",
        "hasChildren": true
      }
    ]
  }
}
```

### 包含卡片时（includeCards=true）

```json
{
  "children": [
    {
      "type": "dir",
      "name": "agentscope-java",
      "path": "agentscope-java",
      "hasChildren": true
    },
    {
      "type": "card",
      "id": "assistant/task/task-planning-architecture",
      "title": "Task Planning 架构",
      "path": "assistant/task/task-planning-architecture",
      "hasChildren": false,
      "metadata": {
        "status": "active",
        "tags": ["assistant", "task"]
      }
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| truncated | boolean | 是否因 depth 限制被截断 |
| type | string | `dir` 或 `card` |
| name | string | 目录名 |
| path | string | 相对路径 |
| hasChildren | boolean | 是否有子节点 |
| id | string | 卡片 ID（仅 card 类型） |
| title | string | 卡片标题（仅 card 类型） |
| metadata | object | 轻量元数据（status, tags） |

### 加载策略

**MVP 建议**：分层按需加载

```
首次加载：
  GET /cards/tree?depth=1&includeCards=false
  → 只返回根目录

展开一级目录：
  GET /cards/tree?dir=agentscope-java&depth=1&includeCards=true
  → 返回该目录下的子目录和卡片
```

---

## 2. 获取知识卡片详情

**GET** `/cards/content`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 卡片 ID，如 `concept/webflux` |

### 成功响应

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "id": "agentscope-java/01-核心抽象层/工具系统",
    "title": "工具系统",
    "file_path": "/absolute/path/to/knowledge/agentscope-java/01-核心抽象层/工具系统.md",
    "content": "---\nid: ...\n---\n\n# 工具系统\n\n...",
    "frontmatter": {
      "id": "agentscope-java/01-核心抽象层/工具系统",
      "title": "工具系统",
      "tags": ["agentscope", "tool"],
      "status": "active"
    },
    "updatedAt": "2026-02-23T10:00:00Z"
  }
}
```

### 卡片不存在（HTTP 404）

```json
{
  "code": "MCP-KNOWLEDGE-001",
  "message": "知识卡片不存在: concept/not-exist",
  "data": null
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 卡片逻辑 ID |
| title | string | 卡片标题 |
| file_path | string | 绝对文件路径 |
| content | string | 完整 Markdown 内容 |
| frontmatter | object | 解析后的 YAML 头部 |
| updatedAt | string | 最后更新时间（ISO 8601） |

---

## 3. 搜索知识卡片（已有）

**GET** `/cards`

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| query | string | 否 | - | 搜索关键词 |
| tag | string | 否 | - | 标签过滤 |
| limit | integer | 否 | 20 | 返回数量 |

### 响应

```json
{
  "code": "SUCCESS",
  "data": {
    "entries": [
      {
        "id": "concept/webflux",
        "title": "WebFlux 响应式编程",
        "tags": ["spring", "webflux"],
        "file_path": "/.../knowledge/concept/webflux.md"
      }
    ],
    "total": 1
  }
}
```

---

## 4. 写入知识卡片（已有）

**POST** `/cards`

### 请求体

```json
{
  "id": "concept/new-topic",
  "mode": "create",
  "content": "---\nid: concept/new-topic\ntitle: 新主题\n---\n\n# 新主题\n\n内容..."
}
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 卡片 ID |
| mode | string | 是 | `create` 或 `overwrite` |
| content | string | 是 | 完整 Markdown |

### 成功响应

```json
{
  "code": "SUCCESS",
  "data": {
    "success": true,
    "written": true,
    "conflict": false,
    "file_path": "/.../knowledge/concept/new-topic.md"
  }
}
```

### 冲突响应（HTTP 409）

```json
{
  "code": "MCP-KNOWLEDGE-002",
  "message": "Knowledge card already exists: concept/new-topic"
}
```

---

## 错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| SUCCESS | 200 | 成功 |
| MCP-KNOWLEDGE-001 | 404 | 知识卡片不存在 |
| MCP-KNOWLEDGE-002 | 409 | 知识卡片已存在 |
| MCP-KNOWLEDGE-004 | 403 | 路径不合法 |

---

## 前端类型定义

```typescript
type KnowledgeTreeNode =
  | {
      type: 'dir'
      name: string
      path: string
      hasChildren: boolean
      children?: KnowledgeTreeNode[]
      loaded?: boolean
    }
  | {
      type: 'card'
      id: string
      title: string
      path: string
      hasChildren: false
      metadata?: { status?: string; tags?: string[] }
    }

interface KnowledgeCardContent {
  id: string
  title: string
  file_path: string
  content: string
  frontmatter: Record<string, any>
  updatedAt: string
}
```

---

## 前端服务抽象

```typescript
// 知识树
listKnowledgeTree(params: {
  dir?: string
  depth?: number
  includeCards?: boolean
}): Promise<KnowledgeTreeNode[]>

// 卡片详情
getKnowledgeCardContent(id: string): Promise<KnowledgeCardContent>

// 搜索
searchKnowledgeCards(params: {
  query?: string
  tag?: string
  limit?: number
}): Promise<KnowledgeCardIndex[]>

// 写入
writeKnowledgeCard(params: {
  id: string
  mode: 'create' | 'overwrite'
  content: string
}): Promise<WriteResult>
```

---

最后更新：2026-02-23
