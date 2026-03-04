# Msg 消息结构说明

> 基于 agentscope-java 框架的完整消息结构

## 1. Msg 基础结构

```java
public class Msg {
    private final String id;                    // 消息唯一标识
    private final String name;                  // 发送者名称（可选）
    private final MsgRole role;                 // 角色：USER / ASSISTANT / SYSTEM / TOOL
    private final List<ContentBlock> content;   // 内容块列表
    private final Map<String, Object> metadata; // 元数据
    private final String timestamp;             // 时间戳 "yyyy-MM-dd HH:mm:ss.SSS"
}
```

## 2. MsgRole 角色

| 角色 | 说明 |
|------|------|
| `USER` | 用户消息 |
| `ASSISTANT` | Agent 响应消息 |
| `SYSTEM` | 系统消息 |
| `TOOL` | 工具执行结果消息 |

## 3. ContentBlock 内容块类型

### 3.1 TextBlock
```json
{
  "type": "text",
  "text": "普通文本内容"
}
```

### 3.2 ThinkingBlock
```json
{
  "type": "thinking",
  "thinking": "Agent 的推理/思考过程",
  "metadata": null
}
```

### 3.3 ToolUseBlock
```json
{
  "type": "tool_use",
  "id": "call_a1e7e0476b8c437295074d0e",
  "name": "ls",
  "input": { "path": "/home" },
  "content": "{\"path\":\"/home\"}",
  "metadata": {}
}
```

### 3.4 ToolResultBlock
```json
{
  "type": "tool_result",
  "id": "call_a1e7e0476b8c437295074d0e",
  "name": "ls",
  "output": [
    { "type": "text", "text": "[DIR] docs/\n[FILE] readme.md" }
  ],
  "metadata": {}
}
```

### 3.5 ImageBlock
```json
{
  "type": "image",
  "source": {
    "type": "url",
    "url": "https://example.com/image.png"
  }
}
```

### 3.6 AudioBlock / VideoBlock
```json
{
  "type": "audio",
  "source": {
    "type": "base64",
    "media_type": "audio/mp3",
    "data": "base64编码数据"
  }
}
```

## 4. 消息示例

### 4.1 USER 消息
```json
{
  "id": "8ad0493e-1b02-4e9f-a4f6-1e6e43690a77",
  "name": null,
  "role": "USER",
  "content": [
    { "type": "text", "text": "你有多少工具" }
  ],
  "metadata": {},
  "timestamp": "2026-02-23 16:45:37.833"
}
```

### 4.2 ASSISTANT 消息（含 thinking）
```json
{
  "id": "chatcmpl-c198939a-0c69-93ba-8123-38f7931dc352",
  "name": "Assistant",
  "role": "ASSISTANT",
  "content": [
    {
      "type": "thinking",
      "thinking": "用户问的是我有多少工具...",
      "metadata": null
    },
    {
      "type": "text",
      "text": "我有 **9 个内置工具**..."
    }
  ],
  "metadata": {
    "_chat_usage": {
      "inputTokens": 4192,
      "outputTokens": 356,
      "time": 6.959,
      "totalTokens": 4548
    }
  },
  "timestamp": "2026-02-23 16:45:44.867"
}
```

### 4.3 ASSISTANT 消息（含 tool_use）
```json
{
  "id": "chatcmpl-8fb43521-edb8-9e0c-9c53-3d5575f3a295",
  "name": "Assistant",
  "role": "ASSISTANT",
  "content": [
    {
      "type": "thinking",
      "thinking": "用户想要查看当前目录的内容...",
      "metadata": null
    },
    {
      "type": "tool_use",
      "id": "call_a1e7e0476b8c437295074d0e",
      "name": "ls",
      "input": {},
      "content": "{}",
      "metadata": {}
    }
  ],
  "metadata": {
    "_chat_usage": {
      "inputTokens": 4370,
      "outputTokens": 35,
      "time": 1.06,
      "totalTokens": 4405
    }
  },
  "timestamp": "2026-02-23 16:42:18.951"
}
```

### 4.4 TOOL 消息（工具执行结果）
```json
{
  "id": "20c3b8f7-b1bf-4ae9-9036-e35482ad20bc",
  "name": "Assistant",
  "role": "TOOL",
  "content": [
    {
      "type": "tool_result",
      "id": "call_a1e7e0476b8c437295074d0e",
      "name": "ls",
      "output": [
        {
          "type": "text",
          "text": "[DIR] docs/\n[DIR] logs/\n[FILE] pom.xml"
        }
      ],
      "metadata": {}
    }
  ],
  "metadata": {},
  "timestamp": "2026-02-23 16:42:19.109"
}
```

## 5. Metadata 元数据

### 5.1 ChatUsage (token 统计)
```json
{
  "_chat_usage": {
    "inputTokens": 4192,
    "outputTokens": 356,
    "time": 6.959,
    "totalTokens": 4548
  }
}
```

### 5.2 GenerateReason (生成原因)
```json
{
  "agentscope_generate_reason": "MODEL_STOP"
}
```

可选值：
- `MODEL_STOP` - 正常完成
- `TOOL_SUSPENDED` - 外部工具需要用户执行
- `REASONING_STOP_REQUESTED` - HITL 在推理阶段停止
- `ACTING_STOP_REQUESTED` - HITL 在执行阶段停止
- `INTERRUPTED` - Agent 被中断
- `MAX_ITERATIONS` - 达到最大迭代次数

## 6. API 返回格式

### GET /api/sessions/{sessionId}/history
```json
{
  "sessionId": "web-1771836331616",
  "count": 4,
  "messages": [
    { "id": "...", "role": "USER", "content": [...], ... },
    { "id": "...", "role": "ASSISTANT", "content": [...], ... },
    { "id": "...", "role": "ASSISTANT", "content": [...], ... },
    { "id": "...", "role": "TOOL", "content": [...], ... }
  ]
}
```

## 7. 前端使用建议

### 7.1 按类型渲染内容块
```javascript
function renderContent(content) {
  return content.map(block => {
    switch (block.type) {
      case 'thinking':
        return <ThinkingBlock text={block.thinking} />;
      case 'text':
        return <TextBlock text={block.text} />;
      case 'tool_use':
        return <ToolUseBlock name={block.name} input={block.input} />;
      case 'tool_result':
        return <ToolResultBlock name={block.name} output={block.output} />;
    }
  });
}
```

### 7.2 按角色区分消息样式
```javascript
function getMessageStyle(role) {
  switch (role) {
    case 'USER': return 'user-message';
    case 'ASSISTANT': return 'assistant-message';
    case 'TOOL': return 'tool-message';
    case 'SYSTEM': return 'system-message';
  }
}
```

## 8. 代码位置

- Msg 定义: `agentscope-core/.../message/Msg.java`
- ContentBlock 定义: `agentscope-core/.../message/ContentBlock.java`
- 历史消息 API: `assistant-agent/.../service/SessionService.java`

---
*Created: 2026-02-23*
*Related: assistant-agent, agentscope-java, event-content-mapping*
