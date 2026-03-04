---
id: eval-system-impl-plan
type: plan
title: Assistant Eval 评估系统实现计划
status: active
tags:
  - assistant
  - eval
  - plan
  - implementation
created_at: "2026-02-27"
refs:
  - ./eval-system-design.md
---

# Assistant Eval 评估系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现评估器插件化架构，支持 TrajectoryEvaluator 和 LLMJudgeEvaluator，生成 YAML+MD 格式评测报告。

**Architecture:** 在现有 assistant-eval 模块基础上，新增 evaluator 包，定义 Evaluator 接口，实现两个评估器。通过 EvaluatorRegistry 管理评估器，EvalRunnerService 调用评估器进行评分。ReportService 重构为生成 YAML frontmatter + Markdown 正文格式。

**Tech Stack:** Java 17, Spring Boot, Jackson YAML, WebClient

---

## Task 1: Evaluator 接口与数据模型

**Files:**
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/Evaluator.java`
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/EvalMetricResult.java`
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/EvalEvidenceItem.java`
- Test: `assistant-eval/src/test/java/com/assistant/eval/evaluator/EvalMetricResultTest.java`

**Step 1: Write the failing test**

```java
// assistant-eval/src/test/java/com/assistant/eval/evaluator/EvalMetricResultTest.java
package com.assistant.eval.evaluator;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EvalMetricResultTest {

    @Test
    void shouldBuildResultWithEvidences() {
        EvalMetricResult result = EvalMetricResult.builder()
            .evaluatorName("test")
            .score(0.85)
            .passed(true)
            .reasoning("Test reasoning")
            .build();

        assertEquals("test", result.getEvaluatorName());
        assertEquals(0.85, result.getScore(), 0.001);
        assertTrue(result.isPassed());
        assertEquals("Test reasoning", result.getReasoning());
    }

    @Test
    void shouldAddEvidence() {
        EvalMetricResult result = EvalMetricResult.builder()
            .evaluatorName("test")
            .score(1.0)
            .passed(true)
            .build();

        result.addEvidence("expected_sequence", "tool-a → tool-b");

        assertEquals(1, result.getEvidences().size());
        assertEquals("expected_sequence", result.getEvidences().get(0).getType());
        assertEquals("tool-a → tool-b", result.getEvidences().get(0).getSummary());
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cd assistant-eval && ./gradlew test --tests EvalMetricResultTest -v`
Expected: FAIL with "cannot find symbol: class EvalMetricResult"

**Step 3: Write minimal implementation**

```java
// assistant-eval/src/main/java/com/assistant/eval/evaluator/EvalEvidenceItem.java
package com.assistant.eval.evaluator;

public class EvalEvidenceItem {
    private String type;
    private String summary;
    private String detail;

    public EvalEvidenceItem() {}

    public EvalEvidenceItem(String type, String summary) {
        this.type = type;
        this.summary = summary;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
```

```java
// assistant-eval/src/main/java/com/assistant/eval/evaluator/EvalMetricResult.java
package com.assistant.eval.evaluator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EvalMetricResult {
    private String evaluatorName;
    private double score;
    private boolean passed;
    private String reasoning;
    private List<String> failureTags = new ArrayList<>();
    private Map<String, Double> dimensionScores = new HashMap<>();
    private List<EvalEvidenceItem> evidences = new ArrayList<>();

    public static Builder builder() {
        return new Builder();
    }

    public void addEvidence(String type, String summary) {
        evidences.add(new EvalEvidenceItem(type, summary));
    }

    public void addEvidence(String type, String summary, String detail) {
        EvalEvidenceItem item = new EvalEvidenceItem(type, summary);
        item.setDetail(detail);
        evidences.add(item);
    }

    // Getters and setters
    public String getEvaluatorName() { return evaluatorName; }
    public void setEvaluatorName(String evaluatorName) { this.evaluatorName = evaluatorName; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }
    public List<String> getFailureTags() { return failureTags; }
    public void setFailureTags(List<String> failureTags) { this.failureTags = failureTags; }
    public Map<String, Double> getDimensionScores() { return dimensionScores; }
    public void setDimensionScores(Map<String, Double> dimensionScores) { this.dimensionScores = dimensionScores; }
    public List<EvalEvidenceItem> getEvidences() { return evidences; }
    public void setEvidences(List<EvalEvidenceItem> evidences) { this.evidences = evidences; }

    public static class Builder {
        private final EvalMetricResult result = new EvalMetricResult();

        public Builder evaluatorName(String name) {
            result.setEvaluatorName(name);
            return this;
        }
        public Builder score(double score) { result.setScore(score); return this; }
        public Builder passed(boolean passed) { result.setPassed(passed); return this; }
        public Builder reasoning(String reasoning) { result.setReasoning(reasoning); return this; }
        public Builder failureTags(List<String> tags) { result.setFailureTags(tags); return this; }
        public Builder dimensionScores(Map<String, Double> scores) { result.setDimensionScores(scores); return this; }
        public EvalMetricResult build() { return result; }
    }
}
```

```java
// assistant-eval/src/main/java/com/assistant/eval/evaluator/Evaluator.java
package com.assistant.eval.evaluator;

import com.assistant.eval.model.AgentExecutionResult;
import com.assistant.eval.model.EvalCase;

public interface Evaluator {
    String name();
    EvalMetricResult evaluate(EvalCase evalCase, AgentExecutionResult trace);
}
```

**Step 4: Run test to verify it passes**

Run: `cd assistant-eval && ./gradlew test --tests EvalMetricResultTest -v`
Expected: PASS

**Step 5: Commit**

```bash
git add assistant-eval/src/main/java/com/assistant/eval/evaluator/
git add assistant-eval/src/test/java/com/assistant/eval/evaluator/
git commit -m "feat(eval): add Evaluator interface and EvalMetricResult model"
```

---

## Task 2: TrajectoryEvaluator 实现

**Files:**
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/TrajectoryEvaluator.java`
- Modify: `assistant-eval/src/main/java/com/assistant/eval/model/EvalToolExpectation.java` (add key field)
- Test: `assistant-eval/src/test/java/com/assistant/eval/evaluator/TrajectoryEvaluatorTest.java`

**Step 1: Write the failing test**

```java
// assistant-eval/src/test/java/com/assistant/eval/evaluator/TrajectoryEvaluatorTest.java
package com.assistant.eval.evaluator;

import com.assistant.eval.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class TrajectoryEvaluatorTest {

    private TrajectoryEvaluator evaluator;

    @BeforeEach
    void setUp() {
        evaluator = new TrajectoryEvaluator();
    }

    @Test
    void shouldPassWhenKeyToolsInCorrectOrder() {
        EvalCase evalCase = createCaseWithKeyTools(
            List.of(
                createToolExpectation("task-context", true, 1),
                createToolExpectation("task-write", true, 2)
            )
        );

        AgentExecutionResult trace = createTraceWithTools(
            List.of("task-context", "knowledge-search", "task-write")
        );

        EvalMetricResult result = evaluator.evaluate(evalCase, trace);

        assertEquals("trajectory", result.getEvaluatorName());
        assertTrue(result.isPassed());
        assertEquals(1.0, result.getScore(), 0.001);
    }

    @Test
    void shouldFailWhenKeyToolsInWrongOrder() {
        EvalCase evalCase = createCaseWithKeyTools(
            List.of(
                createToolExpectation("task-context", true, 1),
                createToolExpectation("task-write", true, 2)
            )
        );

        AgentExecutionResult trace = createTraceWithTools(
            List.of("task-write", "task-context")
        );

        EvalMetricResult result = evaluator.evaluate(evalCase, trace);

        assertFalse(result.isPassed());
        assertTrue(result.getScore() < 1.0);
    }

    @Test
    void shouldFailWhenKeyToolMissing() {
        EvalCase evalCase = createCaseWithKeyTools(
            List.of(
                createToolExpectation("task-context", true, 1),
                createToolExpectation("task-write", true, 2)
            )
        );

        AgentExecutionResult trace = createTraceWithTools(List.of("task-write"));

        EvalMetricResult result = evaluator.evaluate(evalCase, trace);

        assertFalse(result.isPassed());
    }

    // Helper methods
    private EvalCase createCaseWithKeyTools(List<EvalToolExpectation> tools) {
        EvalCase evalCase = new EvalCase();
        EvalExpected expected = new EvalExpected();
        expected.setTools(tools);
        evalCase.setExpected(expected);
        return evalCase;
    }

    private EvalToolExpectation createToolExpectation(String name, boolean key, int callOrder) {
        EvalToolExpectation exp = new EvalToolExpectation();
        exp.setName(name);
        exp.setKey(key);
        exp.setCallOrder(callOrder);
        return exp;
    }

    private AgentExecutionResult createTraceWithTools(List<String> toolNames) {
        AgentExecutionResult result = new AgentExecutionResult();
        List<ToolCallRecord> calls = toolNames.stream().map(name -> {
            ToolCallRecord record = new ToolCallRecord();
            record.setToolName(name);
            return record;
        }).toList();
        result.setToolCalls(calls);
        return result;
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cd assistant-eval && ./gradlew test --tests TrajectoryEvaluatorTest -v`
Expected: FAIL

**Step 3: Add key field to EvalToolExpectation and implement TrajectoryEvaluator**

Add to EvalToolExpectation.java:
```java
private Boolean key;
public Boolean getKey() { return key; }
public void setKey(Boolean key) { this.key = key; }
```

Create TrajectoryEvaluator.java:
```java
package com.assistant.eval.evaluator;

import com.assistant.eval.model.*;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class TrajectoryEvaluator implements Evaluator {

    @Override
    public String name() {
        return "trajectory";
    }

    @Override
    public EvalMetricResult evaluate(EvalCase evalCase, AgentExecutionResult trace) {
        List<EvalToolExpectation> keyTools = extractKeyTools(evalCase);
        List<String> actualSequence = extractActualSequence(trace);

        if (keyTools.isEmpty()) {
            return EvalMetricResult.builder()
                .evaluatorName(name())
                .score(1.0)
                .passed(true)
                .reasoning("No key tools defined, auto pass")
                .build();
        }

        List<String> expectedSequence = keyTools.stream()
            .sorted(Comparator.comparing(EvalToolExpectation::getCallOrder))
            .map(EvalToolExpectation::getName)
            .collect(Collectors.toList());

        EvalMetricResult result = EvalMetricResult.builder()
            .evaluatorName(name())
            .build();

        result.addEvidence("expected_sequence", String.join(" → ", expectedSequence));
        result.addEvidence("actual_sequence", String.join(" → ", actualSequence));

        List<String> actualKeySequence = filterToKeyTools(actualSequence, keyTools);
        boolean isSubsequence = isSubsequence(expectedSequence, actualKeySequence);

        if (isSubsequence) {
            result.setScore(1.0);
            result.setPassed(true);
            result.setReasoning("Key tools in correct order: " + String.join(" → ", expectedSequence));
            addKeyToolResults(result, keyTools, trace);
        } else {
            result.setScore(0.0);
            result.setPassed(false);
            result.setReasoning("Key tools sequence mismatch");
            identifyFailures(result, expectedSequence, actualKeySequence);
        }

        return result;
    }

    private List<EvalToolExpectation> extractKeyTools(EvalCase evalCase) {
        if (evalCase == null || evalCase.getExpected() == null
            || evalCase.getExpected().getTools() == null) {
            return List.of();
        }
        return evalCase.getExpected().getTools().stream()
            .filter(t -> t != null && Boolean.TRUE.equals(t.getKey()))
            .collect(Collectors.toList());
    }

    private List<String> extractActualSequence(AgentExecutionResult trace) {
        if (trace == null || trace.getToolCalls() == null) return List.of();
        return trace.getToolCalls().stream()
            .filter(Objects::nonNull)
            .map(ToolCallRecord::getToolName)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    private List<String> filterToKeyTools(List<String> actual, List<EvalToolExpectation> keyTools) {
        Set<String> keyToolNames = keyTools.stream()
            .map(EvalToolExpectation::getName)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        return actual.stream().filter(keyToolNames::contains).collect(Collectors.toList());
    }

    private boolean isSubsequence(List<String> expected, List<String> actual) {
        int expectedIdx = 0;
        for (String actualTool : actual) {
            if (expectedIdx < expected.size()
                && expected.get(expectedIdx).equalsIgnoreCase(actualTool)) {
                expectedIdx++;
            }
        }
        return expectedIdx == expected.size();
    }

    private void addKeyToolResults(EvalMetricResult result, List<EvalToolExpectation> keyTools,
                                   AgentExecutionResult trace) {
        Map<String, ToolCallRecord> toolCallsByName = new HashMap<>();
        if (trace.getToolCalls() != null) {
            for (ToolCallRecord call : trace.getToolCalls()) {
                if (call != null && call.getToolName() != null) {
                    toolCallsByName.putIfAbsent(call.getToolName().toLowerCase(), call);
                }
            }
        }
        for (EvalToolExpectation exp : keyTools) {
            ToolCallRecord call = toolCallsByName.get(exp.getName().toLowerCase());
            if (call != null && call.getToolResult() != null) {
                result.addEvidence("key_tool_result", exp.getName() + ": " +
                    truncate(call.getToolResult(), 50));
            }
        }
    }

    private void identifyFailures(EvalMetricResult result, List<String> expected,
                                  List<String> actualKeySequence) {
        List<String> failures = new ArrayList<>();
        Set<String> actualSet = new HashSet<>(actualKeySequence);
        for (String exp : expected) {
            if (!actualSet.contains(exp)) {
                failures.add("missing_key_tool:" + exp);
            }
        }
        result.setFailureTags(failures);
        if (!failures.isEmpty()) {
            result.addEvidence("order_violation", String.join("; ", failures));
        }
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "...";
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd assistant-eval && ./gradlew test --tests TrajectoryEvaluatorTest -v`
Expected: PASS

**Step 5: Commit**

```bash
git add assistant-eval/src/main/java/com/assistant/eval/evaluator/TrajectoryEvaluator.java
git add assistant-eval/src/main/java/com/assistant/eval/model/EvalToolExpectation.java
git commit -m "feat(eval): implement TrajectoryEvaluator for key tool sequence matching"
```

---

## Task 3: EvaluatorRegistry 实现

**Files:**
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/EvaluatorRegistry.java`
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/EvaluatorConfig.java`
- Modify: `assistant-eval/src/main/java/com/assistant/eval/model/EvalScoring.java`
- Test: `assistant-eval/src/test/java/com/assistant/eval/evaluator/EvaluatorRegistryTest.java`

**Step 1: Write the failing test**

```java
package com.assistant.eval.evaluator;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EvaluatorRegistryTest {

    @Test
    void shouldRegisterAndGetEvaluator() {
        EvaluatorRegistry registry = new EvaluatorRegistry();
        Evaluator mockEvaluator = mock(Evaluator.class);
        when(mockEvaluator.name()).thenReturn("test_eval");

        registry.register(mockEvaluator);
        Evaluator found = registry.get("test_eval");

        assertNotNull(found);
        assertEquals("test_eval", found.name());
    }

    @Test
    void shouldGetEvaluatorsByConfig() {
        EvaluatorRegistry registry = new EvaluatorRegistry();
        Evaluator mockEvaluator = mock(Evaluator.class);
        when(mockEvaluator.name()).thenReturn("test_eval");
        registry.register(mockEvaluator);

        List<EvaluatorConfig> configs = List.of(new EvaluatorConfig("test_eval", 0.5));
        List<EvaluatorRegistry.WeightedEvaluator> result = registry.getWeightedEvaluators(configs);

        assertEquals(1, result.size());
        assertEquals(0.5, result.get(0).weight(), 0.001);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cd assistant-eval && ./gradlew test --tests EvaluatorRegistryTest -v`
Expected: FAIL

**Step 3: Write minimal implementation**

```java
// EvaluatorConfig.java
package com.assistant.eval.evaluator;

public class EvaluatorConfig {
    private String type;
    private double weight;

    public EvaluatorConfig() {}
    public EvaluatorConfig(String type, double weight) {
        this.type = type;
        this.weight = weight;
    }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }
}
```

```java
// EvaluatorRegistry.java
package com.assistant.eval.evaluator;

import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class EvaluatorRegistry {
    private final Map<String, Evaluator> evaluators = new HashMap<>();

    public void register(Evaluator evaluator) {
        evaluators.put(evaluator.name(), evaluator);
    }

    public Evaluator get(String name) {
        return evaluators.get(name);
    }

    public List<WeightedEvaluator> getWeightedEvaluators(List<EvaluatorConfig> configs) {
        if (configs == null || configs.isEmpty()) return List.of();
        List<WeightedEvaluator> result = new ArrayList<>();
        for (EvaluatorConfig config : configs) {
            Evaluator evaluator = evaluators.get(config.getType());
            if (evaluator != null) {
                result.add(new WeightedEvaluator(evaluator, config.getWeight()));
            }
        }
        return result;
    }

    public record WeightedEvaluator(Evaluator evaluator, double weight) {}
}
```

Add to EvalScoring.java:
```java
private List<EvaluatorConfig> evaluators;
public List<EvaluatorConfig> getEvaluators() { return evaluators; }
public void setEvaluators(List<EvaluatorConfig> evaluators) { this.evaluators = evaluators; }
```

**Step 4: Run test to verify it passes**

Run: `cd assistant-eval && ./gradlew test --tests EvaluatorRegistryTest -v`
Expected: PASS

**Step 5: Commit**

```bash
git add assistant-eval/src/main/java/com/assistant/eval/evaluator/
git add assistant-eval/src/main/java/com/assistant/eval/model/EvalScoring.java
git commit -m "feat(eval): add EvaluatorRegistry for evaluator management"
```

---

## Task 4: 集成 TrajectoryEvaluator 到 EvalRunnerService

**Files:**
- Modify: `assistant-eval/src/main/java/com/assistant/eval/service/EvalRunnerService.java`
- Modify: `assistant-eval/src/main/java/com/assistant/eval/model/EvalRunResult.java`
- Test: `assistant-eval/src/test/java/com/assistant/eval/service/EvalRunnerServiceTest.java`

**Step 1: Add trajectoryScore field to EvalRunResult**

```java
private Double trajectoryScore;
private Double llmJudgeScore;
// getters and setters
```

**Step 2: Modify EvalRunnerService to use EvaluatorRegistry**

Add to constructor:
```java
private final EvaluatorRegistry evaluatorRegistry;

public EvalRunnerService(
    CaseLoaderService caseLoaderService,
    AgentClientService agentClientService,
    RuleScorerService ruleScorerService,
    CapabilityScorerService capabilityScorerService,
    EvaluatorRegistry evaluatorRegistry
) {
    // ... existing assignments
    this.evaluatorRegistry = evaluatorRegistry;
}
```

Add evaluation logic after getting executionResult:
```java
// Check if new evaluator system is configured
List<EvaluatorConfig> evaluatorConfigs = getEvaluatorConfigs(evalCase);
if (!evaluatorConfigs.isEmpty()) {
    double totalWeight = 0;
    double weightedScore = 0;

    for (EvaluatorRegistry.WeightedEvaluator we :
         evaluatorRegistry.getWeightedEvaluators(evaluatorConfigs)) {
        EvalMetricResult evalResult = we.evaluator().evaluate(evalCase, executionResult);

        if ("trajectory".equals(we.evaluator().name())) {
            runResult.setTrajectoryScore(evalResult.getScore());
        } else if ("llm_judge".equals(we.evaluator().name())) {
            runResult.setLlmJudgeScore(evalResult.getScore());
        }

        weightedScore += evalResult.getScore() * we.weight();
        totalWeight += we.weight();
    }

    double finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    runResult.setFinalScore(finalScore);
} else {
    // Legacy scoring path
    CapabilityScoreResult capabilityScore = capabilityScorerService.score(evalCase, executionResult);
    double finalScore = 0.4 * ruleScore.getScore() + 0.6 * capabilityScore.getScore();
    runResult.setCapabilityScore(capabilityScore.getScore());
    runResult.setFinalScore(finalScore);
}

private List<EvaluatorConfig> getEvaluatorConfigs(EvalCase evalCase) {
    if (evalCase.getScoring() != null
        && evalCase.getScoring().getEvaluators() != null
        && !evalCase.getScoring().getEvaluators().isEmpty()) {
        return evalCase.getScoring().getEvaluators();
    }
    return List.of();
}
```

**Step 3: Run tests**

Run: `cd assistant-eval && ./gradlew test --tests EvalRunnerServiceTest -v`
Expected: PASS

**Step 4: Commit**

```bash
git add assistant-eval/src/main/java/com/assistant/eval/service/EvalRunnerService.java
git add assistant-eval/src/main/java/com/assistant/eval/model/EvalRunResult.java
git commit -m "feat(eval): integrate TrajectoryEvaluator into EvalRunnerService"
```

---

## Task 5: MarkdownReportFormatter 实现

**Files:**
- Create: `assistant-eval/src/main/java/com/assistant/eval/service/report/MarkdownReportFormatter.java`
- Test: `assistant-eval/src/test/java/com/assistant/eval/service/report/MarkdownReportFormatterTest.java`

**Step 1: Write the failing test**

```java
package com.assistant.eval.service.report;

import com.assistant.eval.model.EvalRunResult;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;

class MarkdownReportFormatterTest {

    @Test
    void shouldFormatReportWithYamlFrontmatter() {
        EvalRunResult result = createSampleResult();
        String report = MarkdownReportFormatter.format(result);

        assertTrue(report.startsWith("---\n"));
        assertTrue(report.contains("schema_version: 1"));
        assertTrue(report.contains("report_type: eval_run"));
        assertTrue(report.contains("---\n\n#"));
    }

    @Test
    void shouldIncludeOverviewSection() {
        EvalRunResult result = createSampleResult();
        String report = MarkdownReportFormatter.format(result);

        assertTrue(report.contains("## 一、概览"));
    }

    private EvalRunResult createSampleResult() {
        EvalRunResult result = new EvalRunResult();
        result.setRunId("run-001");
        result.setCaseId("daily-kickoff-001");
        result.setPassed(true);
        result.setFinalScore(0.85);
        result.setTrajectoryScore(0.9);
        result.setStartedAt(Instant.now());
        result.setEndedAt(Instant.now());
        return result;
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cd assistant-eval && ./gradlew test --tests MarkdownReportFormatterTest -v`
Expected: FAIL

**Step 3: Write implementation**

```java
package com.assistant.eval.service.report;

import com.assistant.eval.model.EvalRunResult;
import com.assistant.eval.model.ToolCallRecord;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

public class MarkdownReportFormatter {

    private static final DateTimeFormatter ISO_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX")
            .withZone(ZoneId.systemDefault());

    public static String format(EvalRunResult result) {
        StringBuilder sb = new StringBuilder();

        // YAML Frontmatter
        sb.append("---\n");
        sb.append("schema_version: 1\n");
        sb.append("report_type: eval_run\n");
        sb.append("run_id: ").append(result.getRunId()).append("\n");
        sb.append("case_id: ").append(result.getCaseId()).append("\n");
        sb.append("executed_at: \"").append(ISO_FORMATTER.format(result.getStartedAt())).append("\"\n");
        sb.append("passed: ").append(result.isPassed()).append("\n");
        sb.append("final_score: ").append(result.getFinalScore()).append("\n");
        if (result.getTrajectoryScore() != null) {
            sb.append("trajectory_score: ").append(result.getTrajectoryScore()).append("\n");
        }
        if (result.getLlmJudgeScore() != null) {
            sb.append("llm_judge_score: ").append(result.getLlmJudgeScore()).append("\n");
        }
        sb.append("---\n\n");

        // Title
        sb.append("# 评测报告: ").append(result.getCaseId()).append("\n\n");

        // Section 1: Overview
        sb.append("## 一、概览\n\n");
        sb.append("| 指标 | 值 |\n|------|-----|\n");
        sb.append("| 通过 | ").append(result.isPassed() ? "✅" : "❌").append(" |\n");
        sb.append("| 最终得分 | ").append(String.format("%.2f", result.getFinalScore())).append(" |\n");
        if (result.getTrajectoryScore() != null) {
            sb.append("| 轨迹匹配分 | ").append(String.format("%.2f", result.getTrajectoryScore())).append(" |\n");
        }
        sb.append("\n");

        // Section 2: TrajectoryEvaluator
        if (result.getTrajectoryScore() != null) {
            sb.append("## 二、TrajectoryEvaluator 结果\n\n");
            sb.append("| 项目 | 内容 |\n|------|------|\n");
            sb.append("| 得分 | ").append(String.format("%.2f", result.getTrajectoryScore())).append(" |\n");
            if (result.getToolCalls() != null && !result.getToolCalls().isEmpty()) {
                sb.append("\n**工具调用序列**: ");
                sb.append(result.getToolCalls().stream()
                    .map(ToolCallRecord::getToolName)
                    .collect(Collectors.joining(" → ")));
                sb.append("\n");
            }
            sb.append("\n");
        }

        return sb.toString();
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd assistant-eval && ./gradlew test --tests MarkdownReportFormatterTest -v`
Expected: PASS

**Step 5: Commit**

```bash
git add assistant-eval/src/main/java/com/assistant/eval/service/report/MarkdownReportFormatter.java
git commit -m "feat(eval): add MarkdownReportFormatter for YAML+MD report format"
```

---

## Task 6: LLMJudgeEvaluator 骨架

**Files:**
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/LLMJudgeEvaluator.java`
- Create: `assistant-eval/src/main/java/com/assistant/eval/evaluator/LLMJudgeClient.java`
- Test: `assistant-eval/src/test/java/com/assistant/eval/evaluator/LLMJudgeEvaluatorTest.java`

**Step 1: Write the failing test**

```java
package com.assistant.eval.evaluator;

import com.assistant.eval.model.*;
import org.junit.jupiter.api.*;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LLMJudgeEvaluatorTest {

    private LLMJudgeEvaluator evaluator;
    private LLMJudgeClient mockClient;

    @BeforeEach
    void setUp() {
        mockClient = mock(LLMJudgeClient.class);
        evaluator = new LLMJudgeEvaluator(mockClient);
    }

    @Test
    void shouldReturnEvaluatorName() {
        assertEquals("llm_judge", evaluator.name());
    }

    @Test
    void shouldEvaluateWithFiveCriteria() {
        EvalCase evalCase = new EvalCase();
        EvalInput input = new EvalInput();
        input.setUserPrompt("test");
        evalCase.setInput(input);

        AgentExecutionResult trace = new AgentExecutionResult();
        trace.setAnswer("answer");

        when(mockClient.evaluate(anyString(), anyString(), anyString()))
            .thenReturn(Map.of(
                "correctness", Map.of("score", 1.0, "reason", "ok"),
                "helpfulness", Map.of("score", 0.9, "reason", "ok"),
                "safety", Map.of("score", 1.0, "reason", "ok"),
                "completeness", Map.of("score", 0.8, "reason", "ok"),
                "interaction_quality", Map.of("score", 0.9, "reason", "ok")
            ));

        EvalMetricResult result = evaluator.evaluate(evalCase, trace);

        assertEquals("llm_judge", result.getEvaluatorName());
        assertTrue(result.getDimensionScores().containsKey("correctness"));
        assertTrue(result.getDimensionScores().containsKey("helpfulness"));
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cd assistant-eval && ./gradlew test --tests LLMJudgeEvaluatorTest -v`
Expected: FAIL

**Step 3: Write implementation**

```java
// LLMJudgeClient.java
package com.assistant.eval.evaluator;
import java.util.Map;

public interface LLMJudgeClient {
    Map<String, Object> evaluate(String userPrompt, String answer, String toolCalls);
}
```

```java
// LLMJudgeEvaluator.java
package com.assistant.eval.evaluator;

import com.assistant.eval.model.AgentExecutionResult;
import com.assistant.eval.model.EvalCase;
import com.assistant.eval.model.ToolCallRecord;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class LLMJudgeEvaluator implements Evaluator {

    private static final List<String> CRITERIA = List.of(
        "correctness", "helpfulness", "safety", "completeness", "interaction_quality"
    );

    private final LLMJudgeClient llmClient;

    public LLMJudgeEvaluator(LLMJudgeClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public String name() { return "llm_judge"; }

    @Override
    public EvalMetricResult evaluate(EvalCase evalCase, AgentExecutionResult trace) {
        String userPrompt = evalCase.getInput() != null ? evalCase.getInput().getUserPrompt() : "";
        String answer = trace != null ? trace.getAnswer() : "";
        String toolCalls = formatToolCalls(trace);

        Map<String, Object> llmResponse = llmClient.evaluate(userPrompt, answer, toolCalls);
        return buildResult(llmResponse);
    }

    private String formatToolCalls(AgentExecutionResult trace) {
        if (trace == null || trace.getToolCalls() == null) return "无";
        return trace.getToolCalls().stream()
            .map(c -> c.getToolName() + ": " + truncate(c.getToolResult(), 100))
            .collect(Collectors.joining("\n"));
    }

    @SuppressWarnings("unchecked")
    private EvalMetricResult buildResult(Map<String, Object> llmResponse) {
        Map<String, Double> dimensionScores = new HashMap<>();
        double totalScore = 0;
        int count = 0;

        for (String criterion : CRITERIA) {
            Object data = llmResponse.get(criterion);
            double score = extractScore(data);
            dimensionScores.put(criterion, score);
            totalScore += score;
            count++;
        }

        double avgScore = count > 0 ? totalScore / count : 0;

        return EvalMetricResult.builder()
            .evaluatorName(name())
            .score(avgScore)
            .passed(avgScore >= 0.8)
            .reasoning(avgScore >= 0.9 ? "优秀" : avgScore >= 0.8 ? "良好" : "需改进")
            .dimensionScores(dimensionScores)
            .build();
    }

    @SuppressWarnings("unchecked")
    private double extractScore(Object data) {
        if (data instanceof Map) {
            Object score = ((Map<String, Object>) data).get("score");
            if (score instanceof Number) return ((Number) score).doubleValue();
        }
        return 0.7;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd assistant-eval && ./gradlew test --tests LLMJudgeEvaluatorTest -v`
Expected: PASS

**Step 5: Commit**

```bash
git add assistant-eval/src/main/java/com/assistant/eval/evaluator/LLMJudgeEvaluator.java
git add assistant-eval/src/main/java/com/assistant/eval/evaluator/LLMJudgeClient.java
git commit -m "feat(eval): add LLMJudgeEvaluator skeleton with 5 criteria"
```

---

## Task 7: 集成测试

**Files:**
- Test: `assistant-eval/src/test/java/com/assistant/eval/integration/EvaluatorIntegrationTest.java`

**Step 1: Write integration test**

```java
package com.assistant.eval.integration;

import com.assistant.eval.evaluator.*;
import com.assistant.eval.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EvaluatorIntegrationTest {

    @Autowired
    private EvaluatorRegistry registry;

    @Autowired
    private TrajectoryEvaluator trajectoryEvaluator;

    @Test
    void shouldHaveTrajectoryEvaluatorRegistered() {
        Evaluator found = registry.get("trajectory");
        assertNotNull(found);
    }

    @Test
    void shouldEvaluateEndToEnd() {
        EvalCase evalCase = new EvalCase();
        EvalInput input = new EvalInput();
        input.setUserPrompt("test");
        evalCase.setInput(input);

        EvalExpected expected = new EvalExpected();
        EvalToolExpectation tool = new EvalToolExpectation();
        tool.setName("task-context");
        tool.setKey(true);
        tool.setCallOrder(1);
        expected.setTools(List.of(tool));
        evalCase.setExpected(expected);

        AgentExecutionResult trace = new AgentExecutionResult();
        ToolCallRecord call = new ToolCallRecord();
        call.setToolName("task-context");
        trace.setToolCalls(List.of(call));

        EvalMetricResult result = trajectoryEvaluator.evaluate(evalCase, trace);

        assertTrue(result.isPassed());
    }
}
```

**Step 2: Run integration test**

Run: `cd assistant-eval && ./gradlew test --tests EvaluatorIntegrationTest -v`
Expected: PASS

**Step 3: Commit**

```bash
git add assistant-eval/src/test/java/com/assistant/eval/integration/
git commit -m "test(eval): add integration tests for evaluator system"
```

---

## Task 8: 运行全部测试

**Step 1: Run all tests**

Run: `cd assistant-eval && ./gradlew test`
Expected: All tests PASS

**Step 2: Run build**

Run: `cd assistant-eval && ./gradlew build`
Expected: BUILD SUCCESSFUL

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Evaluator 接口与数据模型 |
| 2 | TrajectoryEvaluator 实现 |
| 3 | EvaluatorRegistry 实现 |
| 4 | 集成到 EvalRunnerService |
| 5 | MarkdownReportFormatter 实现 |
| 6 | LLMJudgeEvaluator 骨架 |
| 7 | 集成测试 |
| 8 | 运行全部测试 |

---

最后更新：2026-02-27