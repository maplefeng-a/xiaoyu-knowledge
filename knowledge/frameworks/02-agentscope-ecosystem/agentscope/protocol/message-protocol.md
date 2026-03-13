---
id: frameworks/agentscope/protocol/message-protocol
title: AgentScope 消息协议
tags: [agentscope, protocol, message, msg]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
learningFrom: AgentScope & AgentScope-Java 源码学习
---

# AgentScope 消息协议

## 概述

AgentScope 消息协议是 AgentScope 框架的核心，定义了智能体之间通信的标准消息格式。无论是 Python 版本还是 Java 版本，都遵循相同的消息模型，确保跨语言兼容。

## 核心概念

### 消息模型

```
┌──────────────────────────────────────────────────────────────┐
│                    AgentScope 协议栈                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              消息协议                │ │
│  │  Msg + ContentBlocks - 智能体间通信基础单元               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│         ┌────────────────────┼────────────────────┐          │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐   │
│  │  A2A 协议   │      │  MCP 协议   │      │ 工具协议     │   │
│  │ Agent-to-   │      │ Model-      │      │ Tool Call   │   │
│  │ Agent       │      │ Context     │      │ Protocol    │   │
│  │ 跨智能体通信 │      │ 跨工具集成   │      │ 工具调用     │   │
│  └─────────────┘      └─────────────┘      └─────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 关键要点

### 1. Msg 消息格式

#### Python AgentScope - Msg 类

```python
# src/agentscope/message/_message_base.py

class Msg:
    def __init__(
        self,
        name: str,
        content: str | Sequence[ContentBlock],
        role: Literal["user", "assistant", "system"],
        metadata: dict[str, JSONSerializableObject] | None = None,
        timestamp: str | None = None,
        invocation_id: str | None = None,
    ):
        self.id = shortuuid.uuid()        # 唯一 ID
        self.name = name                  # 发送者名称
        self.role = role                  # 角色
        self.content = content            # 内容（文本或块列表）
        self.metadata = metadata or {}    # 元数据
        self.timestamp = timestamp        # 时间戳
        self.invocation_id = invocation_id # API 调用 ID
```

#### AgentScope-Java - Msg 类

```java
// agentscope-core/src/main/java/io/agentscope/core/message/Msg.java

@JsonIgnoreProperties(ignoreUnknown = true)
public class Msg implements State {
    
    private final String id;                      // 唯一 ID
    private final String name;                    // 发送者名称
    private final MsgRole role;                   // USER/ASSISTANT/SYSTEM/TOOL
    private final List<ContentBlock> content;     // 内容块列表
    private final Map<String, Object> metadata;   // 元数据
    private final String timestamp;               // 时间戳
    
    // 元数据键
    public static final String METADATA_GENERATE_REASON = "agentscope_generate_reason";
}
```

### 2. ContentBlock 类型

#### Python AgentScope - TypedDict

```python
# src/agentscope/message/_message_block.py

TextBlock = TypedDict("TextBlock", {
    "type": "text", 
    "text": str
})

ToolUseBlock = TypedDict("ToolUseBlock", {
    "type": "tool_use", 
    "id": str, 
    "name": str, 
    "input": dict
})

ToolResultBlock = TypedDict("ToolResultBlock", {
    "type": "tool_result", 
    "id": str, 
    "content": str
})

ImageBlock = TypedDict("ImageBlock", {
    "type": "image", 
    "image": str
})  # URL or base64

AudioBlock = TypedDict("AudioBlock", {
    "type": "audio", 
    "audio": str
})

VideoBlock = TypedDict("VideoBlock", {
    "type": "video", 
    "video": str
})
```

#### AgentScope-Java - sealed class

```java
// agentscope-core/src/main/java/io/agentscope/core/message/ContentBlock.java

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = TextBlock.class, name = "text"),
    @JsonSubTypes.Type(value = ThinkingBlock.class, name = "thinking"),
    @JsonSubTypes.Type(value = ImageBlock.class, name = "image"),
    @JsonSubTypes.Type(value = AudioBlock.class, name = "audio"),
    @JsonSubTypes.Type(value = VideoBlock.class, name = "video"),
    @JsonSubTypes.Type(value = ToolUseBlock.class, name = "tool_use"),
    @JsonSubTypes.Type(value = ToolResultBlock.class, name = "tool_result")
})
public sealed class ContentBlock implements State
        permits TextBlock, ImageBlock, AudioBlock, VideoBlock,
                ThinkingBlock, ToolUseBlock, ToolResultBlock {}
```

### 3. 协议对比

| 特性 | Python AgentScope | AgentScope-Java |
|------|-------------------|-----------------|
| **消息 ID** | `shortuuid.uuid()` | `UUID.randomUUID()` |
| **角色类型** | `user/assistant/system` | `USER/ASSISTANT/SYSTEM/TOOL` |
| **内容类型** | `str \| List[ContentBlock]` | `List<ContentBlock>` |
| **元数据** | `dict[str, JSON]` | `Map<String, Object>` |
| **序列化** | `to_dict() / from_dict()` | Jackson JSON |
| **特殊块** | - | `ThinkingBlock` (推理内容) |
| **状态接口** | `state_dict()` | `implements State` |

### 4. JSON 序列化示例

```json
{
  "id": "abc123",
  "name": "Assistant",
  "role": "assistant",
  "content": [
    { 
      "type": "text", 
      "text": "Hello! Let me search for that." 
    },
    { 
      "type": "tool_use", 
      "id": "tool_1", 
      "name": "search", 
      "input": {
        "query": "AgentScope"
      }
    }
  ],
  "metadata": {
    "agentscope_generate_reason": "user_request"
  },
  "timestamp": "2026-03-13 09:00:00.123"
}
```

---

### 5. 消息使用示例

#### Python AgentScope

```python
from agentscope.message import Msg

# 文本消息
text_msg = Msg(
    name="User",
    content="Hello, how are you?",
    role="user"
)

# 带工具调用的消息
tool_msg = Msg(
    name="Assistant",
    content=[
        {"type": "text", "text": "Let me search for that."},
        {"type": "tool_use", "id": "tool_1", "name": "search", "input": {"query": "test"}}
    ],
    role="assistant"
)

# 序列化
msg_dict = text_msg.to_dict()

# 反序列化
restored_msg = Msg.from_dict(msg_dict)
```

#### AgentScope-Java

```java
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.TextBlock;
import io.agentscope.core.message.ToolUseBlock;

// 文本消息
Msg textMsg = Msg.builder()
    .name("User")
    .role(MsgRole.USER)
    .textContent("Hello, how are you?")
    .build();

// 带工具调用的消息
Msg toolMsg = Msg.builder()
    .name("Assistant")
    .role(MsgRole.ASSISTANT)
    .content(List.of(
        new TextBlock("Let me search for that."),
        new ToolUseBlock("tool_1", "search", Map.of("query", "test"))
    ))
    .build();

// 序列化
String json = objectMapper.writeValueAsString(textMsg);

// 反序列化
Msg restoredMsg = objectMapper.readValue(json, Msg.class);
```

---

### 6. 多模态内容

#### 图片消息

```python
# Python
image_msg = Msg(
    name="User",
    content=[
        {"type": "text", "text": "What's in this image?"},
        {"type": "image", "image": "https://example.com/image.jpg"}
    ],
    role="user"
)
```

```java
// Java
Msg imageMsg = Msg.builder()
    .name("User")
    .role(MsgRole.USER)
    .content(List.of(
        new TextBlock("What's in this image?"),
        new ImageBlock("https://example.com/image.jpg")
    ))
    .build();
```

#### 音频消息

```python
# Python
audio_msg = Msg(
    name="User",
    content=[
        {"type": "audio", "audio": "https://example.com/audio.mp3"}
    ],
    role="user"
)
```

```java
// Java
Msg audioMsg = Msg.builder()
    .name("User")
    .role(MsgRole.USER)
    .content(List.of(
        new AudioBlock("https://example.com/audio.mp3")
    ))
    .build();
```

---

### 7. 元数据使用

#### 常见元数据字段

```python
# Python
msg = Msg(
    name="Assistant",
    content="Hello!",
    role="assistant",
    metadata={
        "agentscope_generate_reason": "user_request",
        "model": "gpt-4",
        "tokens_used": 150,
        "response_time_ms": 1200
    }
)
```

```java
// Java
Msg msg = Msg.builder()
    .name("Assistant")
    .role(MsgRole.ASSISTANT)
    .textContent("Hello!")
    .metadata(Map.of(
        "agentscope_generate_reason", "user_request",
        "model", "gpt-4",
        "tokens_used", 150,
        "response_time_ms", 1200
    ))
    .build();
```

---

## 实践应用

### 场景 1：对话历史管理

```python
# Python
class ConversationManager:
    def __init__(self):
        self.history = []
    
    def add_message(self, msg: Msg):
        self.history.append(msg)
    
    def get_history(self) -> list[Msg]:
        return self.history
    
    def to_openai_format(self) -> list[dict]:
        """转换为 OpenAI 格式"""
        messages = []
        for msg in self.history:
            messages.append({
                "role": msg.role,
                "content": msg.content if isinstance(msg.content, str) 
                          else self._convert_content_blocks(msg.content)
            })
        return messages
```

### 场景 2：工具调用流程

```python
# 1. Agent 决定调用工具
tool_use_msg = Msg(
    name="Assistant",
    content=[
        {"type": "text", "text": "Let me search for that."},
        {"type": "tool_use", "id": "call_1", "name": "search", "input": {"query": "test"}}
    ],
    role="assistant"
)

# 2. 执行工具
result = search_tool(**tool_use_msg.content[1]["input"])

# 3. 返回工具结果
tool_result_msg = Msg(
    name="Tool",
    content=[
        {"type": "tool_result", "id": "call_1", "content": json.dumps(result)}
    ],
    role="tool"
)

# 4. Agent 继续处理
final_msg = agent.call([tool_use_msg, tool_result_msg])
```

### 场景 3：跨智能体通信（A2A）

```python
# Agent A 发送消息
msg_a = Msg(
    name="AgentA",
    content="Please help me analyze this data.",
    role="user",
    metadata={"target_agent": "AgentB"}
)

# Agent B 接收并处理
msg_b = agent_b.call(msg_a)
```

---

## 常见问题

### Q1: Python 和 Java 的消息格式兼容吗？

**A:** 是的。两者使用相同的 JSON 序列化格式，可以互相解析。

### Q2: 什么时候用 TextBlock，什么时候用字符串？

**A:** 
- **Python**: `content` 可以是字符串或 ContentBlock 列表
- **Java**: `content` 只能是 ContentBlock 列表
- **建议**: 统一使用 ContentBlock 列表，更灵活

### Q3: 如何添加自定义 ContentBlock？

**A:** 
- **Python**: 定义新的 TypedDict
- **Java**: 继承 ContentBlock sealed class

### Q4: 元数据有什么用？

**A:** 存储 Trace ID、模型信息、响应时间等调试和监控信息。

## 相关卡片

- [智能体系统协议分层架构](../../../concept/protocol/agent-system-protocol-layers.md)
- [构建智能体应用工作清单](../../../plan/agent-application/building-agent-application-checklist.md)
- [OpenClaw Channel 接入总览](../../03-openclaw/04-渠道集成层/channel-architecture.md)
- [A2A 协议](./a2a-protocol.md)
- [MCP 协议](./mcp-protocol.md)
- [工具协议](./tool-protocol.md)

## 参考资料

- [AgentScope GitHub Repository](https://github.com/agentscope-ai/agentscope)
- [AgentScope-Java GitHub Repository](https://github.com/agentscope-ai/agentscope-java)
- [AgentScope Documentation](https://github.com/agentscope-ai/agentscope/tree/main/docs)
