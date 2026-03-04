# EventType 与 ContentBlock 映射关系

> 基于 agentscope-java 框架的消息类型映射说明

## 1. EventType 事件类型

| 事件类型 | 说明 | 角色 | 流式支持 |
|---------|------|------|---------|
| `REASONING` | Agent 思考/推理过程 | ASSISTANT | ✅ 增量 |
| `TOOL_RESULT` | 工具执行结果 | TOOL | ✅ |
| `HINT` | RAG/记忆/规划提示 | USER/SYSTEM | ❌ |
| `AGENT_RESULT` | 最终响应 | ASSISTANT | ❌ |
| `SUMMARY` | 达到最大迭代时摘要 | ASSISTANT | 可能 |
| `ALL` | 特殊值：所有事件(除AGENT_RESULT) | - | - |

## 2. ContentBlock 内容块类型

| 内容块 | JSON type | 说明 |
|--------|-----------|------|
| `TextBlock` | `text` | 纯文本内容 |
| `ThinkingBlock` | `thinking` | 推理/思考内容 |
| `ImageBlock` | `image` | 图片 (URL/Base64) |
| `AudioBlock` | `audio` | 音频 (URL/Base64) |
| `VideoBlock` | `video` | 视频 (URL/Base64) |
| `ToolUseBlock` | `tool_use` | 工具调用请求 |
| `ToolResultBlock` | `tool_result` | 工具执行结果 |

## 3. 映射关系

```
┌─────────────────┬────────────────────────────────────────────────────┐
│    EventType    │                  ContentBlock                      │
├─────────────────┼────────────────────────────────────────────────────┤
│ REASONING       │ ThinkingBlock (推理过程) ← 主要                    │
│                 │ TextBlock (推理文本)                                │
│                 │ ToolUseBlock (工具调用请求)                         │
├─────────────────┼────────────────────────────────────────────────────┤
│ TOOL_RESULT     │ ToolResultBlock (工具执行结果) ← 唯一              │
├─────────────────┼────────────────────────────────────────────────────┤
│ HINT            │ TextBlock (RAG/记忆/规划提示)                       │
├─────────────────┼────────────────────────────────────────────────────┤
│ AGENT_RESULT    │ TextBlock (最终回答) ← 主要                        │
│                 │ ThinkingBlock (可能包含)                           │
├─────────────────┼────────────────────────────────────────────────────┤
│ SUMMARY         │ TextBlock (摘要文本)                               │
└─────────────────┴────────────────────────────────────────────────────┘
```

## 4. 处理策略

### 4.1 流式响应 (chatStream)

```java
StreamOptions options = StreamOptions.builder()
    .eventTypes(EventType.REASONING, EventType.TOOL_RESULT, EventType.AGENT_RESULT)
    .incremental(true)
    .includeReasoningResult(false)
    .build();

// 事件处理
switch (type) {
    case TOOL_RESULT -> extract ToolResultBlock
    case REASONING   -> extract ThinkingBlock (优先)
    case AGENT_RESULT -> extract TextBlock
}
```

### 4.2 非流式响应 (chat)

```java
// 同时提取两种 block，优先返回 TextBlock
String thinking = extractThinkingContent(response.getContent());
String text = extractTextFromBlocks(response.getContent());
String answer = (text != null && !text.isEmpty()) ? text : thinking;
```

## 5. 事件流示例

```
用户消息 → Agent 处理
    │
    ├─→ REASONING (incremental, isLast=false)
    │     "用户只是简单地打招呼..."
    │
    ├─→ REASONING (incremental, isLast=false)
    │     "我应该友好地回应..."
    │
    └─→ AGENT_RESULT (isLast=true)
          "你好！有什么我可以帮你的吗？"

最终 → METRICS (性能指标)
```

## 6. 代码位置

- EventType 定义: `agentscope-core/.../agent/EventType.java`
- ContentBlock 定义: `agentscope-core/.../message/ContentBlock.java`
- 处理实现: `assistant-agent/.../service/ChatService.java`

## 7. 待补充

- [ ] HINT 事件处理
- [ ] SUMMARY 事件处理
- [ ] ToolUseBlock 处理

---
*Created: 2026-02-23*
*Related: assistant-agent, agentscope-java*
