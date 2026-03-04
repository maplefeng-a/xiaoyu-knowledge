---
id: case-01-interface-contract
type: spec
title: Case 1 接口冻结与开发需求
status: active
tags:
  - assistant
  - task
  - mcp
---

# Case 1 接口冻结与开发需求（Daily Kickoff）

## 1. 适用场景

对应 `case-01-daily-kickoff.md`：晨间主动开工。

目标：
- Agent 获取近期任务索引
- Agent 读取并理解任务详情
- Agent 生成计划内容
- 用户确认后写入 `tasks/YYYY-MM-DD.md`

---

## 2. 设计原则

### 2.1 文档优先

- Markdown 是 Source of Truth
- YAML frontmatter 只是索引摘要
- Agent 直接理解 Markdown

### 2.2 职责分离

| MCP 负责 | Agent 负责 |
|----------|-----------|
| 索引获取 | 读取详情 |
| 标准化写入 | 理解内容 |
| 冲突保护 | 生成内容 |
| 审计日志 | 决策 |

---

## 3. MCP Task 工具接口冻结（2 个工具）

### 3.1 `task-context`

**用途**：获取近期任务索引

**Schema**：
```json
{
  "type": "object",
  "properties": {
    "days": {
      "type": "integer",
      "description": "回看天数，默认 7"
    },
    "include_done": {
      "type": "boolean",
      "description": "是否包含已完成任务，默认 true"
    }
  },
  "required": []
}
```

**返回格式**：
```
📅 近期任务索引

2026-02-22 (今天):
  - 完成 Task MCP 重构
  - 编写测试报告

2026-02-21 (昨天) ✅:
  - MCP 工具设计

---JSON---
{
  "entries": [
    {
      "date": "2026-02-22",
      "is_today": true,
      "tasks": ["完成 Task MCP 重构", "编写测试报告"]
    },
    {
      "date": "2026-02-21",
      "is_today": false,
      "tasks": ["MCP 工具设计"]
    }
  ]
}
---END-JSON---
```

**实现说明**：
- 实时读取 `tasks/YYYY-MM-DD.md` 的 YAML 头部
- 无缓存，无状态
- 文件不存在时跳过

### 3.2 `task-write`

**用途**：写入任务文件

**Schema**：
```json
{
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "description": "日期，格式 YYYY-MM-DD"
    },
    "mode": {
      "type": "string",
      "enum": ["create", "overwrite"],
      "description": "create: 不覆盖已有; overwrite: 强制覆盖"
    },
    "content": {
      "type": "string",
      "description": "Markdown 内容（Agent 生成）"
    },
    "request_id": {
      "type": "string",
      "description": "请求ID，用于审计（可选）"
    }
  },
  "required": ["date", "mode", "content"]
}
```

**返回格式（成功）**：
```
✅ 计划已保存

文件：tasks/2026-02-22.md

---JSON---
{
  "success": true,
  "written": true,
  "conflict": false,
  "file_path": "tasks/2026-02-22.md"
}
---END-JSON---
```

**返回格式（冲突）**：
```
⚠️ 冲突：当日计划已存在

---JSON---
{
  "success": false,
  "written": false,
  "conflict": true,
  "reason": "Plan already exists for 2026-02-22"
}
---END-JSON---
```

**实现说明**：
- 写入前自动提取 `- [ ]` 任务列表写入 YAML
- `mode=create` 时检查文件是否存在且非空
- 路径强制为 `tasks/{date}.md`

---

## 4. Task 文件格式

### 4.1 文件结构

```markdown
---
date: 2026-02-22
tasks:
  - 完成 Task MCP 重构
  - 编写测试报告
---

# 今日计划

日期：2026-02-22

## 重点

- Task MCP 简化重构

## 任务

- [x] 完成 Task MCP 重构
- [ ] 编写测试报告
```

### 4.2 YAML 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 日期 YYYY-MM-DD |
| tasks | string[] | 任务清单（从正文提取） |

---

## 5. assistant-mcp 开发需求

### 5.1 新增/修改文件

| 文件 | 操作 | 说明 |
|------|------|------|
| TaskToolDefinitions.java | 修改 | 2 个工具定义 |
| TaskToolHandlers.java | 修改 | 2 个 handler |
| TaskService.java | 修改 | 简化逻辑 |
| TaskServiceTest.java | 修改 | 更新测试 |

### 5.2 约束

1. 删除 4 个旧工具，替换为 2 个新工具
2. task-context 只读 YAML 头部，不解析正文
3. task-write 写入时自动更新 YAML
4. 保持 JSON block 输出格式

---

## 6. 接口冻结清单

| 项目 | 值 | 状态 |
|------|-----|------|
| 工具名 | task-context, task-write | 冻结 |
| 返回格式 | `---JSON---` / `---END-JSON---` | 冻结 |
| 冲突语义 | mode=create 不覆盖 | 冻结 |
| YAML 字段 | date, tasks | 冻结 |

---

## 7. 迁移说明

### 7.1 废弃工具

| 旧工具 | 替代方案 |
|--------|----------|
| task-scan-context | task-context |
| task-propose-daily-plan | Agent 自己生成 |
| task-get-daily-plan | Read 工具 |
| task-upsert-daily-plan | task-write |

### 7.2 Agent 侧调整

```
旧流程：
  task-scan-context → task-propose-daily-plan → task-upsert-daily-plan

新流程：
  task-context → Read(详情) → Agent生成 → task-write
```

---

最后更新：2026-02-22
