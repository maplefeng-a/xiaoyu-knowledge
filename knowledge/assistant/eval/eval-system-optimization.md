---
id: eval-system-optimization
type: analysis
title: Assistant Eval 系统综合分析与优化建议
status: active
tags:
  - assistant
  - eval
  - optimization
  - analysis
refs:
  - ./benchmark/gaia-benchmark.md
  - ./benchmark/agent-benchmark-survey.md
  - ./langchain-eval-comparison.md
---

# Assistant Eval 系统综合分析与优化建议

## 1. 现有架构回顾

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     assistant-eval 现有架构                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Controller Layer                            │   │
│  │   POST /api/eval/run  │  GET /api/eval/results  │  Regression    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Service Layer                              │   │
│  │  EvalRunnerService  │  AgentClientService  │  CaseLoaderService │   │
│  │  RuleScorerService(✅)  │  CapabilityScorerService(⚠️骨架)  │     │   │
│  │  ReportService(✅)  │  RegressionService(✅)  │                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 与业界最佳实践对比

### 2.1 评估器对比

| 评估能力 | GAIA | LangChain | τ-bench | assistant-eval | 差距 |
|----------|------|-----------|---------|----------------|------|
| **精确匹配** | ✅ 核心 | ✅ ExactMatch | ✅ DB状态 | ❌ 无 | 需新增 |
| **轨迹评估** | ⚠️ 部分 | ✅ TrajectoryEvaluator | ✅ 交互轨迹 | ⚠️ 基础 | 需增强 |
| **LLM-as-Judge** | ❌ | ✅ CriteriaEvalChain | ❌ | ⚠️ 骨架 | 需接入 |
| **部分评分** | ❌ | ✅ subsequence | ✅ pass^k | ❌ 无 | 需新增 |
| **评分解释** | ❌ | ✅ reasoning | ⚠️ | ❌ 无 | 需新增 |

### 2.2 指标体系对比

| 指标 | CLEAR 框架 | τ-bench | assistant-eval 现有 |
|------|------------|---------|---------------------|
| **pass¹** | - | ✅ | ⚠️ 类似 |
| **pass^k** | - | ✅ | ❌ 无 |
| **Cost** | ✅ | - | ❌ 无 |
| **Latency** | ✅ | ✅ | ✅ 有 |
| **Reliability** | ✅ | ✅ | ⚠️ 部分 |

---

## 3. 核心问题诊断

### 3.1 架构层面

| 问题 | 现状 | 影响 |
|------|------|------|
| 评估器类型单一 | 仅 RuleScorer + CapabilityScorer 骨架 | 无法支持多种评估场景 |
| CapabilityScorer 未落地 | 仅关键词覆盖 | 质量评估不可靠 |
| 缺少结果验证层 | 无精确匹配 | 无法做 GAIA 类评测 |
| 评分不可解释 | 仅返回分数 | 难以定位问题 |

### 3.2 数据模型层面

| 问题 | 现状 | 影响 |
|------|------|------|
| 用例格式不支持精确答案 | 无 `expected.final_answer` | 无法做结果验证 |
| 不支持难度分级 | `level` 含义是场景类型 | 无法做渐进式评测 |
| 不支持附件 | 无 `input.attachments` | 无法做多模态评测 |

---

## 4. 优化方案设计

### 4.1 评估器体系重构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     评估器体系（参考 LangChain）                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Evaluator Interface                           │   │
│  │   score(case, trace) → {score, passed, reasoning, tags}         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│          ┌─────────────────────────┼─────────────────────────┐         │
│  ┌───────▼───────┐  ┌──────────────▼──────────┐  ┌──────────▼───────┐ │
│  │ResultEvaluator│  │  TrajectoryEvaluator   │  │  LLMJudgeEvaluator│ │
│  │ • ExactMatch  │  │ • ToolSequenceMatch    │  │ • CriteriaEval   │ │
│  │ • FuzzyMatch  │  │ • SubsequenceScore     │  │ • CustomCriteria │ │
│  │ • SemanticSim │  │ • OrderValidation      │  │ • Reasoning      │ │
│  └───────────────┘  └────────────────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 新增评估器设计

#### ExactMatchEvaluator（P0）

```java
public class ExactMatchEvaluator implements Evaluator {
    @Override
    public EvalResult score(EvalCase case, AgentExecutionResult trace) {
        String expected = case.getExpected().getFinalAnswer();
        String actual = trace.getAnswer();
        boolean passed = normalize(actual).equals(normalize(expected));
        return EvalResult.builder()
            .score(passed ? 1.0 : 0.0)
            .passed(passed)
            .reasoning(String.format("Expected: %s, Actual: %s", expected, actual))
            .build();
    }
}
```

#### TrajectoryEvaluator 增强（P0）

```java
public class TrajectoryEvaluator implements Evaluator {
    private boolean allowPartialCredit;

    @Override
    public EvalResult score(EvalCase case, AgentExecutionResult trace) {
        List<String> expected = case.getExpected().getTrajectory();
        List<String> actual = extractToolNames(trace.getToolCalls());

        // 精确匹配
        if (actual.equals(expected)) {
            return EvalResult.builder().score(1.0).passed(true).build();
        }

        // 部分评分（子序列匹配）
        if (allowPartialCredit) {
            double score = subsequenceScore(expected, actual);
            return EvalResult.builder()
                .score(score)
                .passed(score >= 0.8)
                .reasoning("Partial match: " + score)
                .build();
        }
        return EvalResult.builder().score(0.0).passed(false).build();
    }
}
```

#### LLMJudgeEvaluator（P1）

```java
public class LLMJudgeEvaluator implements Evaluator {
    private LLMClient llmClient;
    private List<Criterion> criteria;

    @Override
    public EvalResult score(EvalCase case, AgentExecutionResult trace) {
        String prompt = buildEvaluationPrompt(case, trace, criteria);
        LLMJudgeResponse response = llmClient.evaluate(prompt);

        return EvalResult.builder()
            .score(response.getAverageScore())
            .passed(response.getAverageScore() >= 0.8)
            .reasoning(response.getReasoning())
            .dimensionScores(response.getDimensionScores())
            .build();
    }
}
```

### 4.3 数据模型扩展

```yaml
# 扩展后的 EvalCase 格式
id: eval-001
level: 1                    # GAIA 风格难度分级
category: task-planning     # 场景分类

input:
  user_prompt: "今天做什么"
  attachments:              # 新增：支持附件
    - type: image
      path: "/path/to/image.png"

expected:
  final_answer: "计划已保存"  # 新增：精确匹配答案
  answer_match_type: exact   # 新增：匹配类型
  trajectory:                # 新增：期望的工具调用序列
    - "task-context"
    - "task-write"
  trajectory_match: subsequence  # 新增：匹配模式

scoring:
  evaluators:                # 新增：评估器配置
    - type: exact_match
      weight: 0.4
    - type: trajectory
      weight: 0.3
      config:
        partial_credit: true
    - type: llm_judge
      weight: 0.3
      criteria:
        - name: helpfulness
          description: "Is the response helpful?"

pass_criteria:
  min_score: 0.8
  pass_k: 3                  # 新增：pass^k 指标
```

---

## 5. 实施路线图

### Phase 1：基础能力补齐（P0）

| 任务 | 参考 | 产出 |
|------|------|------|
| ExactMatchEvaluator | GAIA | 精确匹配评估器 |
| TrajectoryEvaluator 增强 | LangChain | 支持部分评分 |
| 数据模型扩展 | GAIA | `final_answer`, `trajectory` |

### Phase 2：LLM-as-Judge 接入（P1）

| 任务 | 参考 | 产出 |
|------|------|------|
| LLMJudgeEvaluator | LangChain CriteriaEvalChain | LLM 评估器 |
| 自定义准则支持 | LangChain | YAML 中定义 criteria |
| reasoning 输出 | LangChain | 评分解释 |

### Phase 3：企业级指标（P2）

| 任务 | 参考 | 产出 |
|------|------|------|
| pass^k 指标 | τ-bench | 多次尝试可靠性 |
| Cost 指标 | CLEAR | Token 消耗统计 |
| 评测集扩展 | GAIA | 难度分级用例 |

---

## 6. 现有框架评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构设计 | ⭐⭐⭐⭐ | 分层清晰，扩展性好 |
| 评估器完整性 | ⭐⭐ | 缺少精确匹配和 LLM Judge |
| 数据模型 | ⭐⭐⭐ | 基础完备，需扩展 |
| 指标体系 | ⭐⭐⭐ | 有基础，缺 pass^k 和 Cost |
| 可解释性 | ⭐⭐ | 缺少 reasoning |

---

## 7. 核心建议

1. **评估器插件化**：参考 LangChain，支持多种评估器组合
2. **结果验证优先**：先实现 ExactMatchEvaluator，支持 GAIA 类评测
3. **LLM Judge 接入**：接入 LLM 做质量评估，返回 reasoning
4. **难度分级**：用例按复杂度分级，渐进式评测

---

## 8. 相关知识卡片

- [GAIA Benchmark](./benchmark/gaia-benchmark.md)
- [评测集全景调研](./benchmark/agent-benchmark-survey.md)
- [LangChain 对比分析](./langchain-eval-comparison.md)

---

最后更新：2026-02-26
