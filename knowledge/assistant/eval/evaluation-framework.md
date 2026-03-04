# Agent 评测框架设计

## 1. 评测理念

**从工程化视角转向能力视角**

- 旧思路：关注工具调用顺序、参数匹配、JSON标记
- 新思路：关注 Agent 核心能力表现

---

## 2. 双维度评测框架

### 2.1 核心能力维度 (Capabilities)

| 能力 | 定义 | 评测点 |
|------|------|--------|
| **Task Success** | 任务完成能力 | 完成率、端到端成功率、产出质量 |
| **Planning** | 规划能力 | 计划合理性、优先级、可执行性 |
| **Tool Use** | 工具调用能力 | 选择正确性、参数准确性、结果处理 |
| **Memory** | 记忆能力 | 上下文利用、信息提取、跨轮次保持 |
| **Robustness** | 鲁棒性 | 异常处理、边界场景、错误恢复 |

### 2.2 企业级保障维度 (Enterprise - CLEAR)

| 指标 | 定义 | 评测点 |
|------|------|--------|
| **Cost** | 成本 | Token消耗、资源占用 |
| **Latency** | 延迟 | 响应时间、端到端耗时 |
| **Efficiency** | 效率 | 步数精简度、资源利用率 |
| **Assurance** | 保障 | 置信度、可解释性 |
| **Reliability** | 可靠性 | 成功率、稳定性 |

---

## 3. 评分权重建议

```yaml
scoring:
  capabilities: 70%
    task_success: 20%
    planning: 20%
    tool_use: 15%
    memory: 15%
    robustness: 10%

  enterprise: 30%
    reliability: 15%
    efficiency: 10%
    latency: 5%
```

---

## 4. 业界参考框架

| 框架 | 关注点 | 适用场景 |
|------|--------|----------|
| **AgentBench** | 综合能力、跨环境泛化 | 通用评测 |
| **τ-bench** | 生产环境可靠性 | 企业级应用 |
| **BFCL** | Function Calling 能力 | 工具调用场景 |
| **TIDE** | 轨迹诊断评估 | 调试优化 |
| **MMBench-GUI** | GUI Agent 多平台 | UI自动化 |

---

## 5. daily-kickoff 场景示例

### 能力映射

| 能力 | 具体表现 |
|------|----------|
| **Task Success** | 计划成功写入 `tasks/YYYY-MM-DD.md` |
| **Planning** | 生成包含 Top3、锚点、checklist 的计划 |
| **Tool Use** | 正确调用 `task-context`、`task-write` |
| **Memory** | 读取并理解昨日任务、backlog、anchors |
| **Robustness** | 冲突检测、已有计划时的处理 |

### 评分细则

| 维度 | 0.0 | 0.5 | 1.0 |
|------|-----|-----|-----|
| Task Success | 写入失败 | 部分成功 | 稳定完成 |
| Planning | 结构混乱 | 基本合理 | 结构清晰、优先级合理 |
| Tool Use | 工具选择错误 | 工具正确但效率低 | 选择精准、参数正确 |
| Memory | 未利用上下文 | 部分利用 | 充分整合历史信息 |
| Robustness | 异常崩溃 | 部分处理 | 完善的异常处理 |

---

## 6. 参考资料

- [2025 AI Agent标准化之争](https://www.explinks.com/blog/yt-2025-ai-agent-standards-metrics-benchmark-interop/)
- [AgentBench - LLM智能体评估](https://m.blog.csdn.net/gitblog_01062/article/details/155805858)
- [TIDE: Trajectory-based Diagnostic Evaluation](https://arxiv.org/html/2602.02196v1)
- [企业级Agent质量评估](https://aws.amazon.com/cn/blogs/china/agent-quality-evaluation/)
- [Multi-Dimensional Enterprise Evaluation](https://arxiv.org/html/2511.14136v1)

---

最后更新：2026-02-23
