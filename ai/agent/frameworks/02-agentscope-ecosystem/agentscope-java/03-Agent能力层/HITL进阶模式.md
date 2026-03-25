
# HITL 进阶模式

> 基于 AgentScope-Java HITL 机制的扩展思路

## 一句话

HITL 不只是简单的 Yes/No 确认，可以扩展为选择式、智能式交互。

## 两种 HITL 模式

### 1. 确认式（现有）

```
用户确认?
  ├── YES → agent.stream()
  └── NO  → agent.stream(cancelResult)
```

**暂停点**：
- `PostReasoningEvent.stopAgent()` - 工具执行前
- `PostActingEvent.stopAgent()` - 工具执行后

### 2. 选择式（扩展）

```
用户选择?
  ├── 确认执行     → agent.stream()
  ├── 取消执行     → agent.stream(cancelResult)
  ├── 选择方案A    → gotoReasoning(choiceA)
  ├── 选择方案B    → gotoReasoning(choiceB)
  └── 自定义输入   → gotoReasoning(userInput)
```

## 选择式 HITL 实现

### 提示词引导

```
你需要提供多个可选方案时，请按以下格式输出：

## 方案1
[方案描述]

## 方案2
[方案描述]

## 方案3
[方案描述]
```

### 前端解析

```javascript
// 解析固定格式的多选项
const options = response.match(/## 方案(\d+)([\s\S]*?)(?=## 方案|$)/g);
// 渲染选择界面
```

### 后端处理

```java
// 用户选择后注入消息
Msg choiceMsg = Msg.builder()
    .role(MsgRole.USER)
    .content(TextBlock.of("我选择方案2，但请先用更保守的参数"))
    .build();
postReasoning.gotoReasoning(choiceMsg);
```

## 两个暂停点的差异

| 暂停点 | 时机 | 用途 |
|--------|------|------|
| `PostReasoningEvent` | 工具执行**前** | 确认是否执行 / 选择方案 |
| `PostActingEvent` | 工具执行**后** | 审查结果 / 决定下一步 |

**核心知识库现状**：只实现了 `PostReasoningEvent` 暂停。

## 智能确认思路

### 传统 HITL

```java
// 检测到危险工具 → 暂停
if (dangerousTools.contains(toolName)) {
    postReasoning.stopAgent();
}
```

### 智能 HITL

```java
// 检测到危险工具 → LLM 分析风险 + 提供替代方案
if (dangerousTools.contains(toolName)) {
    Msg advice = advisorModel.call(buildAnalysisPrompt(toolCall));
    // advice 包含：风险等级、影响分析、替代方案
    postReasoning.setReasoningMessage(appendAdvice(msg, advice));
    postReasoning.stopAgent();
}
```

**用户看到**：

```
⚠️ 检测到危险操作: delete_file("/data/important.csv")

🤖 AI 分析:
- 风险等级: 高
- 替代方案:
  1. 先查看文件内容
  2. 移动到回收站
  3. 创建备份后删除

您的选择: [确认] [取消] [方案1] [方案2] [方案3] [自定义]
```

## HITL 优化建议

### 1. 配置化增强（已实现）

```yaml
assistant:
  hitl:
    enabled: true
    dangerous-tools:
      - delete_file
      - send_email
```

### 2. 多选项支持（建议）

- 提示词模板支持多选项格式
- 前端解析并渲染选择界面
- 支持用户自定义输入消息

### 3. 智能分析（建议）

- 危险操作前调用 LLM 分析风险
- 自动生成替代方案
- 提供决策建议

### 4. 执行后暂停（建议）

- 关键操作后审查结果
- 敏感数据输出前过滤
- 异常结果人工介入

## 关键 API

| 方法 | 作用 | 场景 |
|------|------|------|
| `stopAgent()` | 暂停等待用户 | 确认/选择 |
| `gotoReasoning(msg)` | 注入消息后重新推理 | 选择方案/自定义输入 |
| `setReasoningMessage(msg)` | 修改推理结果 | 附加分析建议 |

## Examples

- [官方 hitl-chat](https://github.com/modelscope/agentscope-java/tree/main/agentscope-examples/hitl-chat)
- 核心知识库实现: `assistant-agent/hook/ToolConfirmationHook.java`

## 关联

- [[knowledge/agentscope-java/03-Agent能力层/HITL人机协作|HITL人机协作]]
- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]]
- [[knowledge/agentscope-java/03-Agent能力层/Agent抽象|Agent抽象]]
