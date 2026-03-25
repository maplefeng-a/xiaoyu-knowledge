
# LangChain-Eval 与 assistant-eval 模块对比

## 1. 架构层级对比

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          LangChain-Eval                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     LangSmith Platform                           │   │
│  │   Dataset Management │ Batch Evaluation │ Visualization │ Trace  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Evaluators                                 │   │
│  │   String │ Trajectory │ Criteria (LLM-as-Judge) │ Custom        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          assistant-eval                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Controller Layer                             │   │
│  │                    EvalController (REST API)                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Service Layer                               │   │
│  │  Runner │ Scorer │ AgentClient │ Report │ Regression │ Query    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Model Layer                                │   │
│  │          EvalCase │ EvalSuite │ EvalRunResult │ ToolCallRecord   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 模块功能对比表

| 功能模块 | LangChain-Eval | assistant-eval | 对比说明 |
|----------|----------------|----------------|----------|
| **数据模型** | `Example` (inputs/outputs) | `EvalCase` (input/expected/scoring) | assistant-eval 更结构化，支持评分维度 |
| **用例加载** | LangSmith Dataset API | `CaseLoaderService` (YAML 文件) | 本质相同，存储方式不同 |
| **执行编排** | `evaluate()` 函数 | `EvalRunnerService` | 本质相同 |
| **批量执行** | `run_on_dataset()` | `EvalSuiteRunnerService` | 本质相同 |
| **Agent 调用** | 用户自定义函数 | `AgentClientService` (HTTP 流式) | assistant-eval 封装更完整 |

---

## 3. 评估器对比（核心差距）

| 评估类型 | LangChain-Eval | assistant-eval | 状态 |
|----------|----------------|----------------|------|
| **精确匹配** | `ExactMatchStringEvaluator` | ❌ 无 | 需新增 |
| **语义相似度** | `EmbeddingDistanceEvaluator` | ❌ 无 | 需新增 |
| **QA 评估** | `QAEvalChain`, `ContextQAEvalChain` | ❌ 无 | 需新增 |
| **轨迹评估** | `TrajectoryEvaluator` | `RuleScorerService` (部分) | 需增强 |
| **LLM-as-Judge** | `CriteriaEvalChain` | `CapabilityScorerService` (骨架) | 需接入 |
| **自定义准则** | 支持自定义 criteria | 硬编码维度 | 需扩展 |
| **部分评分** | `trajectory_subsequence` | ❌ 无 | 需新增 |

---

## 4. 评估能力对比

| 能力维度 | LangChain-Eval | assistant-eval | 说明 |
|----------|----------------|----------------|------|
| **结果验证** | ✅ QA / ExactMatch | ⚠️ 仅关键词覆盖 | 需增强精确匹配 |
| **过程验证** | ✅ TrajectoryEvaluator | ✅ RuleScorerService | 能力相近 |
| **质量评估** | ✅ LLM-as-Judge | ⚠️ 骨架存在 | 需接入 LLM |
| **准则自定义** | ✅ 支持任意 criteria | ❌ 硬编码 | 需扩展 |
| **评分解释** | ✅ 返回 reasoning | ❌ 仅分数 | 需增强 |

---

## 5. 平台能力对比

| 平台功能 | LangSmith | assistant-eval | 状态 |
|----------|-----------|----------------|------|
| **数据集管理** | ✅ UI + API | ⚠️ YAML 文件 | 无 UI |
| **批量评估** | ✅ UI + API | ✅ API | OK |
| **结果可视化** | ✅ UI Dashboard | ⚠️ JSON/Markdown 报告 | 无 UI |
| **实验追踪** | ✅ 版本对比 | ✅ `RegressionService` | OK |
| **Trace 查看** | ✅ 完整 Trace | ⚠️ 仅 tool_calls | 需增强 |

---

## 6. 代码实现对比

### 6.1 轨迹评估

**LangChain**:
```python
@run_evaluator
def trajectory_evaluator(run, example):
    steps = run.outputs.get("intermediate_steps", [])
    actual = [action.tool for action, _ in steps]
    expected = example.outputs.get("expected_steps", [])
    return {"key": "trajectory_correctness", "score": int(actual == expected)}

# 部分评分
def trajectory_subsequence(outputs, reference):
    i = j = 0
    while i < len(reference) and j < len(outputs):
        if reference[i] == outputs[j]:
            i += 1
        j += 1
    return i / len(reference)
```

**assistant-eval (RuleScorerService)**:
```java
private void validateToolCallOrder(List<EvalToolExpectation> expectations,
                                    List<ToolCallRecord> toolCalls,
                                    List<String> failures) {
    // 检查 call_order 顺序
    // 但不支持部分评分
}
```

**差距**: LangChain 支持子序列部分评分，assistant-eval 仅支持严格顺序检查

### 6.2 LLM-as-Judge

**LangChain**:
```python
eval_chain = CriteriaEvalChain.from_llm(
    llm=ChatOpenAI(model="gpt-4"),
    criteria={"helpfulness": "Is the response helpful?"}
)
result = eval_chain.evaluate_strings(prediction=..., input=...)
# 返回: {score, value, reasoning}
```

**assistant-eval (CapabilityScorerService)**:
```java
private double scoreDimension(String name, String answer, List<ToolCallRecord> calls) {
    // 仅基于关键词覆盖
    if (name.contains("structure")) {
        return coverage(answer, List.of("标题", "标签", "背景"));
    }
    return 0.7;  // 默认值
}
```

**差距**: assistant-eval 未接入 LLM，仅用关键词匹配

---

## 7. 需要补齐的能力

| 优先级 | 能力 | 说明 |
|--------|------|------|
| **P0** | `ExactMatchEvaluator` | GAIA 精确匹配评估必需 |
| **P0** | `TrajectoryEvaluator` 增强 | 支持子序列部分评分 |
| **P1** | `LLMJudgeEvaluator` | 接入 LLM 做质量评估 |
| **P1** | 自定义准则 | 支持在 YAML 中定义 criteria |
| **P2** | 评估结果 reasoning | 返回评分解释 |
| **P2** | 语义相似度评估 | Embedding 距离计算 |

---

## 8. LangChain 评估器速查

### 8.1 String Evaluators

| 评估器 | 用途 | 示例 |
|--------|------|------|
| `ExactMatch` | 精确匹配 | answer == expected |
| `EmbeddingDistance` | 语义相似度 | cosine similarity |
| `QA` | 问答正确性 | 基于参考答案评分 |
| `ContextQA` | 带上下文的问答 | 使用上下文验证 |

### 8.2 内置评估准则

| 准则 | 说明 |
|------|------|
| `correctness` | 事实准确性 |
| `helpfulness` | 有用性 |
| `clarity` | 清晰度 |
| `conciseness` | 简洁性 |
| `relevance` | 相关性 |
| `safety` | 安全性 |
| `coherence` | 逻辑一致性 |

---

## 9. 参考资料

- [LangChain 评估框架指南](https://blog.csdn.net/gitblog_00243/article/details/152339149)
- [LangSmith Agent 调试与评估](https://www.digitalocean.com/community/tutorials/langsmith-debudding-evaluating-llm-agents)
- [从零构建 AI Agent 评估体系](https://blog.csdn.net/deephub/article/details/149863739)
- [LLM-as-Judge 评估方法](https://blog.csdn.net/rengang66/article/details/155716375)

---

最后更新：2026-02-26
