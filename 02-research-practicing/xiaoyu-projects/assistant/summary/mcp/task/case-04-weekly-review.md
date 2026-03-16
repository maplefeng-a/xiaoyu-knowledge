# Case 4：周末主动总结与下周计划（Weekly Review, 23:00）

## 1. 目标
- 本 case 要解决的问题：
  - 周维度自动沉淀成果、识别问题，并形成下周可执行重点计划。
- 成功标准（可验证）：
  - 到达触发条件后，Agent 主动生成周总结与下周计划草案。
  - 用户确认后，周总结文档成功落盘。
  - 下周重点任务清单与本周问题有明确映射关系。

## 2. 触发条件
- 时间触发：
  - 每周日 23:00（晚上11点，可配置）。
- 事件触发：
  - 用户自然语言输入“做周总结”“规划下周”。
- 前置条件：
  - 本周存在至少 3 份 daily 任务文档（可配置阈值）。
  - 若本周总结已存在，则进入“更新模式”。

## 3. 输入上下文
- 必读数据源：
  - 本周 `tasks/YYYY-MM-DD.md`（工作日范围）
  - `tasks/backlog.md`
  - 最近一份 `weekly-summary-*.md`（可选，用于对比连续性）
- 关键字段：
  - 本周完成率
  - 关键产出与未完成事项
  - 反复出现的问题/阻塞
  - 时间敏感待办

## 4. Agent 主动消息
- 首条消息模板：
  - “已到本周复盘时间（23:00），我已生成周总结和下周重点草案。请确认或调整后我再写入。”
- 必须包含：
  - 本周完成概览（完成/未完成）
  - 关键成果 Top3
  - 问题与改进建议
  - 下周 Top3 重点（含优先级）
  - 待确认动作（确认发布）

## 5. 用户交互分支
- 分支A（直接确认）：
  - 用户：“确认发布” -> 写入周总结并输出下周计划摘要。
- 分支B（调整重点）：
  - 用户：“把下周第2项改成X，优先级提到P0” -> 重生成草案 -> 再确认 -> 写入。
- 分支C（仅发布总结，不发布下周计划）：
  - 用户：“先发总结，计划明天定” -> 仅写周总结，计划草案保留会话态。
- 分支D（延后）：
  - 用户：“本周先不总结” -> 记录 defer，次日早上提醒一次。

## 6. MCP 工具调用流程
1. `task_board_view(range=this_week)`（统计完成率、状态分布）
2. `task_weekly_summarize(week=this_week, source=daily_files)`
3. `task_weekly_next_plan(week=next_week, inputs=summary+backlog)`
4. （等待用户确认）
5. `task_weekly_publish(week=this_week, summary=confirmed_summary, next_plan=confirmed_next_plan)`

## 7. 写入与变更规则
- 写入文件：
  - `tasks/weekly-summary-YYYY-wN.md`
  - （可选）下周计划草案写入下周一 `tasks/YYYY-MM-DD.md`
- 允许修改范围：
  - 周总结正文区块
  - 下周重点任务区块
- 幂等/覆盖策略：
  - 同周文档默认 patch 更新；首次不存在则创建
- 审计字段：
  - `requestId`
  - `change_reason = weekly_review_publish`
  - `week_id`

## 8. 异常与回退
- 常见错误：
  - 本周 daily 文件不足
  - 周文件解析冲突
- 降级策略：
  - 输出“轻量周总结草案”（不落盘）
- 用户提示：
  - “本周数据不足以生成完整周报，我先给你简版草案，是否仍要发布？”

## 9. 验收标准
- 功能验收：
  - 能在周触发时主动发起并完成确认后发布。
- 数据验收：
  - 周总结结构完整，包含完成概览/问题/下周重点。
- 交互验收：
  - 用户可调整重点优先级后再发布。
  - 发布后可通过 `/plan week` 查看周度结果。
- 连续性验收：
  - 下周重点与本周问题存在可读映射。

## 10. CLI 交互约束（更新）
- 主入口：周日 23:00 Agent 主动发起，或用户自然语言触发。
- `/plan week`：仅用于查看周计划/周总结视图，不承担发布动作。

## 11. 对应开发 Feature 映射
- assistant-mcp：
  - `task_board_view(range=this_week)`
  - `task_weekly_summarize`
  - `task_weekly_next_plan`
  - `task_weekly_publish`
- assistant-agent：
  - `weekly-planning-skill`
  - 周总结+下周计划双草案编排与确认状态机
- assistant-cli：
  - 周末主动提醒展示
  - 草案编辑与确认
  - `/plan week` 只读查看
- assistant-eval：
  - 用例：周触发 -> 双草案生成 -> 用户调整 -> 发布 -> `/plan week` 查看一致性校验
