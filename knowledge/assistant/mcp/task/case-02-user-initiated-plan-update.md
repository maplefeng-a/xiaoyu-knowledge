---
id: case-02-user-initiated-plan-update
type: spec
title: Case 2 用户主动计划更新
status: active
tags:
  - assistant
  - task
  - case
mcp_tools:
  - task-context
  - task-write
---

# Case 2：用户主动计划更新（User-Initiated Plan Update）

## 1. 目标
- 本 case 要解决的问题：
  - 用户在日中主动发起计划更新，Agent 快速完成“标记完成 + 调整计划 + 记录原因”。
- 成功标准（可验证）：
  - 用户发起后，Agent 能识别更新意图并给出结构化变更提案。
  - 用户确认后，任务状态与计划内容正确写回。
  - 写入行为可追溯（requestId + 变更原因）。

## 2. 触发条件
- 时间触发：
  - 无（用户随时可发起）。
- 事件触发：
  - 用户自然语言输入如：“更新计划”“标记X完成”“今天改一下安排”。
- 前置条件：
  - 当日计划文件存在；若不存在，先引导创建今日计划。

## 3. 输入上下文
- 必读数据源：
  - 当日 `tasks/YYYY-MM-DD.md`
  - `tasks/backlog.md`（可选，用于补充任务来源）
- 关键字段：
  - checklist 任务项
  - 当前勾选状态
  - 今日剩余任务与完成情况

## 4. Agent 主动消息（响应用户发起）
- 首条消息模板：
  - “收到，我先给你本次更新草案：①标记完成 ②调整优先级 ③新增任务。请确认后我再写入。”
- 必须包含：
  - 拟变更项列表
  - 每项变更原因（用户输入或Agent推断）
  - 对今日目标的影响
  - 待确认动作

## 5. 用户交互分支
- 分支A（仅标记完成）：
  - 用户：“把任务A标记完成” -> Agent 提案 -> 确认 -> 勾选写入。
- 分支B（计划调整）：
  - 用户：“把任务B移到第一优先级，任务C顺延” -> Agent 提案 -> 确认 -> 顺序更新。
- 分支C（混合更新）：
  - 用户：“A完成，新增D，删除E” -> Agent 提案 -> 确认 -> 批量 patch。
- 分支D（取消）：
  - 用户：“先不改了” -> Agent 不写入，仅保留会话上下文。

## 6. MCP 工具调用流程 (v2.0.0)

**新流程**（2 个 MCP 工具）：

```
1. task-context(days=1, include_done=true)
   ↓ 获取今日任务索引
2. Read 工具读取 tasks/YYYY-MM-DD.md
   ↓ Agent 理解当前计划
3. Agent 生成更新内容
   ↓ 根据 user_input 生成新的 Markdown
4. （等待用户确认）
5. task-write(date=today, mode=overwrite, content=...)
   ↓ 覆盖写入
```

- 每步关键输出：
  - `task-context`：今日任务列表
  - `Read`：完整计划内容
  - `task-write`：success, written, file_path

## 7. 写入与变更规则
- 写入文件：
  - `tasks/YYYY-MM-DD.md`
- 允许修改范围：
  - 今日任务区块（任务项、勾选状态、完成情况）
- 幂等/覆盖策略：
  - patch 模式，避免重写整文件
- 审计字段：
  - `requestId`
  - `change_reason = user_initiated_update`
  - `change_summary`

## 8. 异常与回退
- 常见错误：
  - 指令歧义（任务名不唯一）
  - 文件解析失败
  - 并发修改冲突
- 降级策略：
  - 先要求 disambiguation
  - 冲突时输出 diff，等待再次确认
- 用户提示：
  - “我识别到两个同名任务，请指定具体任务后再更新。”

## 9. 验收标准
- 功能验收：
  - 支持“标记完成”“任务重排”“新增/删除任务”三类更新。
- 数据验收：
  - checklist 与任务顺序更新正确，文档结构不破坏。
- 交互验收：
  - 所有写入前必须有确认步骤。
  - 更新后用户可通过 `/plan` 查看结果。

## 10. CLI 交互约束（更新）
- 主入口：用户自然语言发起更新（不是 `/plan update`）。
- `/plan`：仅用于核对更新后的今日计划。

## 11. 对应开发 Feature 映射

| 组件 | 职责 |
|------|------|
| **assistant-mcp** | `task-context`（索引获取）、`task-write`（标准化写入） |
| **assistant-agent** | 读取计划（Read 工具）、生成更新内容、确认状态机 |
| **assistant-cli** | 自然语言输入通道中的 planning 意图路由 |
| **assistant-eval** | 用例：用户主动更新 -> 提案 -> 确认 -> 文件变更 -> `/plan` 查看一致性校验 |

---

**最后更新**：2026-02-22
**版本**：v2.0.0
