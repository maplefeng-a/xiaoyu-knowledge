---
id: context-engineering-basics
type: concept
title: 上下文工程基础
status: active
aliases:
  - Context Engineering
  - 上下文优化
tags:
  - agentscope-java
  - 可观测性
  - 上下文
refs: []
---

# 上下文工程基础

> agentscope-java 扩展能力 | 创建：2026-03-XX | 状态：待学习

## 一句话

通过量化分析、优化策略和工具支持，提升 LLM 上下文使用效率与响应质量的工程实践。

## 为什么需要上下文工程

### 当前问题（assistant-agent 现状）

| 问题 | 表现 | 影响 |
|------|------|------|
| 上下文黑盒 | 不知道每次请求用了多少 Token | 无法优化成本 |
| 冗余累积 | 历史消息无差别全量发送 | 浪费 Token/降低质量 |
| 效率未知 | 上下文长度 vs 响应质量无数据 | 无法科学调优 |
| 成本模糊 | Token 消耗 → 成本换算不直观 | 预算不可控 |

### 上下文工程的价值

```
【可观测】→ 【可量化】→ 【可优化】→ 【可预测】
    ↓           ↓           ↓           ↓
 看见行为    建立指标    实施策略    预估成本
```

## 核心概念

### 上下文组成（assistant-agent）

```
【System Prompt】系统提示词（固定）
├── 角色定义
├── 能力说明
└── 约束规则

【Conversation History】对话历史（动态增长）
├── 用户消息（User Msg）
├── 助手回复（Assistant Msg）
└── 工具调用记录（Tool Calls）

【Session State】会话状态（持久化）
├── 当前任务上下文
└── 长期记忆引用
```

### 关键指标

| 指标 | 计算方式 | 用途 |
|------|----------|------|
| Input Tokens | System Prompt + History + Current Request | 成本计算 |
| Output Tokens | Model Response | 成本计算 |
| Context Efficiency | (有用 Token) / (总 Input Tokens) | 效率评估 |
| Redundancy Ratio | (可压缩 Token) / (总 Input Tokens) | 优化空间 |
| Cost per Request | (Input + Output) × 单价 | 成本核算 |

## 上下文优化策略

### 1. 分层记忆策略

```
【L1 - 短期记忆】当前会话完整历史（InMemoryMemory）
【L2 - 中期记忆】关键对话摘要（文件存储）
【L3 - 长期记忆】核心事实/偏好（文件存储）
```

### 2. 上下文压缩

| 方法 | 说明 | 适用场景 |
|------|------|----------|
| 滑动窗口 | 保留最近 N 轮对话 | 一般对话 |
| 摘要压缩 | 用 LLM 生成历史摘要 | 长对话 |
| 关键信息提取 | 提取事实/决策/待办 | 任务型对话 |
| 语义去重 | 移除重复/冗余信息 | 高冗余场景 |

### 3. 动态上下文选择

```
用户请求 → 意图识别 → 选择上下文子集
    ↓
【闲聊模式】仅最近 3 轮 + System Prompt
【任务模式】最近 10 轮 + 任务相关历史
【查询模式】最近 5 轮 + 知识库检索结果
```

## 与 Tracing 的集成

Tracing 为上下文工程提供数据基础：

```
【Span: Agent.call】
├── 属性：input_tokens=1200, output_tokens=350
├── 属性：context_length=1500, redundancy_ratio=0.3
├── 属性：cost_usd=0.0015
└── 事件：context_pruned=true, pruned_tokens=450
```

### 可观测性仪表板

```
【实时指标】
- 平均 Input/Output Tokens
- 平均响应延迟
- 错误率

【趋势分析】
- Token 消耗趋势（日/周/月）
- 成本趋势
- 上下文效率趋势

【优化建议】
- 高冗余会话识别
- 可压缩上下文提示
- 异常消耗告警
```

## assistant-agent 集成方案

### 当前状态（2026-03-XX）

- ❌ 无 Token 统计
- ❌ 无上下文效率分析
- ❌ 无冗余检测
- ⚠️ 仅有基础 Session 持久化

### 建设步骤

1. **Token 统计埋点**
   ```java
   // 在 ChatService 中记录 Token 使用
   int inputTokens = countTokens(userMsg + history);
   int outputTokens = countTokens(response);
   ```

2. **上下文效率分析**
   ```java
   // 分析历史消息的贡献度
   double efficiency = calculateContextEfficiency(history, response);
   ```

3. **压缩策略实现**
   ```java
   // 滑动窗口
   List<Msg> compressed = slidingWindow(history, maxRounds);
   // 摘要压缩
   String summary = llm.summarize(history);
   ```

4. **可视化仪表板**
   - 集成 Tracing 后端（Jaeger）
   - 自定义上下文指标面板

## 学习资源

- [Anthropic Context Engineering](https://www.anthropic.com/research/context-engineering)
- [LangChain Context Management](https://python.langchain.com/docs/modules/memory/)
- [LLM Token 计费标准](https://openai.com/api/pricing/)

## 关联卡片

- [[knowledge/agentscope-java/知识地图|知识地图]]
- [[knowledge/agentscope-java/02-核心抽象层/记忆管理|记忆管理]]
- [[knowledge/agentscope-java/02-核心抽象层/会话管理|会话管理]]
- [[knowledge/tracing-basics|Tracing 可观测性基础]]

## 下一步

1. 学习上下文工程最佳实践
2. 实现 Token 统计基础功能
3. 设计上下文效率分析算法
4. 与 Tracing 系统集成

---

**创建日期**: 2026-03-XX
**优先级**: P0（可观测性基础建设）
