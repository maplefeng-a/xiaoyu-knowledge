---
id: task-planning-architecture
type: concept
title: Task Planning 架构
status: active
tags:
  - assistant
  - task
  - architecture
---

# Task Planning Architecture (Assistant)

## 1. 目标

构建一套以 `Skill + MCP` 为核心的任务计划能力，使 Agent 能以"管家模式"协助用户完成：

- 每日计划制定
- 日内计划更新
- 每日复盘总结
- 周总结与下周规划

数据事实源保持为现有 Markdown 文件：

- `tasks/YYYY-MM-DD.md` - 日计划
- `tasks/backlog.md` - 待办池

不引入数据库。

---

## 2. 核心设计原则

### 2.1 文档优先

- Markdown 是 Source of Truth
- 索引层（YAML frontmatter）只是摘要，不是真相
- Agent 直接理解 Markdown，不依赖 JSON 中间层

### 2.2 框架 vs 内容

| 框架（MCP 管理） | 内容（Agent 自由） |
|------------------|-------------------|
| 文件路径规则 | 读取什么文件 |
| 命名规范 | 理解文件内容 |
| 冲突保护 | 生成计划内容 |
| 审计日志 | 修改决策 |

### 2.3 渐进披露

```
索引层（轻量）→ task-context 获取
    ↓
详细内容 → Read 工具读取
    ↓
编辑写入 → task-write 标准化
```

---

## 3. 分层架构

### 3.1 assistant-mcp（底座工具层）

**职责**：
- 任务索引获取（task-context）
- 标准化写入（task-write）
- 冲突保护与审计日志

**不负责**：
- ❌ 内容解析成 JSON
- ❌ 内容生成
- ❌ 智能决策

### 3.2 assistant-agent（智能编排层）

**职责**：
- 读取并理解 Markdown 内容
- 分析任务优先级
- 生成计划内容
- 用户交互与确认

### 3.3 assistant-cli（交互展示层）

**职责**：
- 自然语言交互
- 计划展示
- 定时触发

---

## 4. Task 文件结构

### 4.1 日计划文件

路径：`tasks/YYYY-MM-DD.md`

```markdown
---
date: 2026-02-22
tasks:
  - 完成 Task MCP 重构
  - 编写测试报告
  - 代码评审
---

# 今日计划

日期：2026-02-22

## 重点

- Task MCP 简化重构

## 任务

- [x] 完成 Task MCP 重构
- [ ] 编写测试报告
- [ ] 代码评审
```

### 4.2 索引层设计

YAML frontmatter 只包含 2 个字段：

| 字段 | 说明 | 用途 |
|------|------|------|
| date | 日期 | 唯一标识 + 排序 |
| tasks | 任务清单 | 快速预览 |

**原则**：索引只管"有没有、做什么"，详细内容读正文。

---

## 5. MCP Task 工具设计

### 5.1 工具清单（2 个）

| 工具 | 用途 | 对标 Knowledge |
|------|------|----------------|
| task-context | 获取近期任务索引 | knowledge-search-card |
| task-write | 写入任务文件 | knowledge-create/replace-card |

### 5.2 task-context

**用途**：会话开始时获取近期任务索引

**参数**：
- `days`: 回看天数（默认 7）
- `include_done`: 是否包含已完成（默认 true）

**返回**：
```
📅 近期任务索引

2026-02-22 (今天):
  - 完成 Task MCP 重构
  - 编写测试报告

2026-02-21 (昨天) ✅:
  - MCP 工具设计
```

**实现**：实时读取文件头 YAML，无缓存。

### 5.3 task-write

**用途**：写入任务文件

**参数**：
- `date`: 日期（YYYY-MM-DD）
- `mode`: `create` | `overwrite`
- `content`: Markdown 内容（Agent 生成）

**功能**：
- 写入文件
- 自动提取 tasks 写入 YAML
- 冲突保护（mode=create 时）

---

## 6. Agent 工作流

### 6.1 晨间计划

```
1. 会话开始 → task-context → 获取近期任务索引
2. Agent 分析 → Read 读取详情 → 理解上下文
3. Agent 生成 → 创建计划内容
4. 用户确认 → task-write → 落盘
```

### 6.2 任务更新

```
1. 用户请求 → Read 读取当前计划
2. Agent 理解 → 生成更新内容
3. 用户确认 → task-write(mode=overwrite) → 落盘
```

---

## 7. 与 Knowledge 对比

| 维度 | Knowledge | Task |
|------|-----------|------|
| **读详情** | knowledge-get-card | Read 工具 |
| **搜索** | 按关键词 | 按时间范围 |
| **写入** | create + replace | task-write 统一 |
| **索引** | SQLite 缓存 | 实时读 YAML |
| **工具数** | 4 | 2 |

---

## 8. 实施阶段

### Phase 1（MVP）

- task-context + task-write 2 个工具
- Daily 场景闭环

### Phase 2（增强）

- Weekly 场景
- Backlog 管理

---

最后更新：2026-02-22
