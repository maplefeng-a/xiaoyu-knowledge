---
id: plan/agent-application/building-agent-application-checklist
title: 构建智能体应用工作清单
tags: [checklist, architecture, agent, application]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
learningFrom: 基于 AgentScope 构建智能体应用的工作内容总结
---

# 构建智能体应用工作清单

## 概述

基于智能体框架（如 AgentScope、AgentScope-Java）构建智能体应用，需要完成四个层面的工作。本文档提供了完整的工作清单，帮助你系统性地规划和实施智能体应用开发。

## 核心概念

### 工作内容分层

```
┌─────────────────────────────────────────────────────────────────┐
│                    智能体应用构建工作                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ 智能体组件定义（框架层）                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Agent 定义（ReActAgent / 自定义 Agent）                   ││
│  │ • Tool 定义（工具函数、MCP 工具）                           ││
│  │ • Memory 定义（短期记忆、长期记忆、RAG）                    ││
│  │ • Model 配置（OpenAI / Anthropic / 通义千问）              ││
│  │ • Prompt 工程（系统提示词、工具描述）                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  2️⃣ 智能体运行态管理（运行时）                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • 会话管理（创建、恢复、销毁）                               ││
│  │ • 状态持久化（对话历史、用户数据）                           ││
│  │ • 并发控制（限流、队列）                                     ││
│  │ • 错误处理（重试、降级）                                     ││
│  │ • 监控告警（日志、指标、追踪）                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  3️⃣ 应用层协议转换（如果需要）                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • 消息格式转换（Matrix ↔ Msg / 自定义 ↔ Msg）               ││
│  │ • 事件映射（m.room.message → Agent 事件）                   ││
│  │ • 状态同步（群组状态、用户状态）                             ││
│  │ • 权限控制（访问控制、配对审批）                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  4️⃣ 应用层构建（后端 + 前端）                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 后端：                                                      ││
│  │ • Controller（HTTP / SSE / WebSocket）                      ││
│  │ • 路由（API 设计、权限校验）                                 ││
│  │ • 集成（数据库、缓存、消息队列）                             ││
│  │                                                             ││
│  │ 前端：                                                      ││
│  │ • UI 组件（聊天界面、工具卡片）                              ││
│  │ • 状态管理（会话状态、流式渲染）                             ││
│  │ • 传输层客户端（SSE / WebSocket 连接）                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 关键要点

### 1️⃣ 智能体组件定义

#### Agent 定义

**Python AgentScope:**
```python
from agentscope.agents import ReActAgent
from agentscope.models import OpenAIChatModelWrapper

agent = ReActAgent(
    name="CustomerService",
    sys_prompt="你是客服智能体...",
    model=OpenAIChatModelWrapper(
        model_name="gpt-4",
        api_key="...",
    ),
    tools=[search_tool, order_tool, faq_tool],
    memory=long_term_memory
)
```

**AgentScope-Java:**
```java
ReActAgent agent = ReActAgent.builder()
    .name("CustomerService")
    .sysPrompt("你是客服智能体...")
    .model(DashScopeChatModel.builder()
        .modelName("qwen-max")
        .build())
    .tools(searchTool, orderTool, faqTool)
    .memory(longTermMemory)
    .build();
```

#### Tool 定义

**Python AgentScope:**
```python
from agentscope.tools import tool

@tool
def search(query: str, limit: int = 10) -> list:
    """Search for information."""
    return search_engine.query(query, limit)
```

**AgentScope-Java:**
```java
@Tool
public Mono<OrderInfo> queryOrder(@Param("orderId") String orderId) {
    return orderService.findById(orderId);
}
```

#### Memory 定义

**Python AgentScope:**
```python
from agentscope.memory import LongTermMemory

memory = LongTermMemory(
    storage=lancedb_storage,
    embedding=dashscope_embedding
)
```

**AgentScope-Java:**
```java
LongTermMemory memory = LongTermMemory.builder()
    .storage(lancedbStorage)
    .embedding(dashscopeEmbedding)
    .build();
```

---

### 2️⃣ 智能体运行态管理

#### 会话管理

```python
# Python (FastAPI)
from fastapi import FastAPI
from collections import defaultdict

app = FastAPI()
sessions = defaultdict(AgentSession)

@app.post("/session/create")
async def create_session(user_id: str):
    session = AgentSession(agent=agent, user_id=user_id)
    sessions[user_id] = session
    return {"session_id": user_id}

@app.delete("/session/{user_id}")
async def destroy_session(user_id: str):
    if user_id in sessions:
        sessions[user_id].close()
        del sessions[user_id]
    return {"status": "ok"}
```

```java
// Java (Spring Boot)
@Service
public class SessionManager {
    
    private final Map<String, AgentSession> sessions = new ConcurrentHashMap<>();
    
    public AgentSession createSession(String userId) {
        AgentSession session = new AgentSession(agent, userId);
        sessions.put(userId, session);
        return session;
    }
    
    public void destroySession(String userId) {
        AgentSession session = sessions.remove(userId);
        if (session != null) {
            session.close();
        }
    }
}
```

#### 状态持久化

```python
# 对话历史存储
class ConversationStore:
    def save_conversation(self, session_id: str, messages: list):
        # 保存到数据库
        db.conversations.insert_one({
            "session_id": session_id,
            "messages": [msg.to_dict() for msg in messages],
            "timestamp": datetime.now()
        })
    
    def load_conversation(self, session_id: str) -> list:
        # 从数据库加载
        doc = db.conversations.find_one({"session_id": session_id})
        return [Msg.from_dict(m) for m in doc["messages"]] if doc else []
```

---

### 3️⃣ 应用层协议转换

#### Matrix ↔ Msg 转换

```python
# Python
class MatrixProtocolAdapter:
    
    # Matrix → Msg
    def to_agent_msg(self, matrix_event) -> Msg:
        return Msg(
            role=MsgRole.USER,
            name=matrix_event.sender,
            content=matrix_event.content.body,
            metadata={
                "matrix_room_id": matrix_event.room_id,
                "matrix_event_id": matrix_event.event_id
            }
        )
    
    # Msg → Matrix
    def to_matrix_msg(self, msg: Msg):
        return MatrixMessage(
            msgtype="m.text",
            body=msg.content
        )
```

```java
// Java
@Service
public class MatrixProtocolAdapter {
    
    // Matrix → Msg
    public Msg toAgentMsg(MatrixEvent event) {
        return Msg.builder()
            .role(MsgRole.USER)
            .name(event.getSender())
            .textContent(event.getContent().getBody())
            .metadata(Map.of(
                "matrix_room_id", event.getRoomId(),
                "matrix_event_id", event.getEventId()
            ))
            .build();
    }
    
    // Msg → Matrix
    public MatrixMessage toMatrixMsg(Msg msg) {
        return MatrixMessage.builder()
            .msgtype("m.text")
            .body(msg.getTextContent())
            .build();
    }
}
```

---

### 4️⃣ 应用层构建

#### 后端 Controller（SSE 流式）

**Python (FastAPI):**
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    async def generate():
        async for msg in agent.stream(request.to_msg()):
            yield f"data: {msg.json()}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

**Java (Spring Boot):**
```java
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<ChatChunk>> stream(@RequestBody ChatRequest request) {
        return agent.stream(request.toMsg())
            .map(msg -> ServerSentEvent.<ChatChunk>builder()
                .id(UUID.randomUUID().toString())
                .event("message")
                .data(ChatChunk.from(msg))
                .build())
            .concatWith(Flux.just(
                ServerSentEvent.<ChatChunk>builder()
                    .event("done")
                    .build()
            ));
    }
}
```

#### 前端（SSE 客户端）

```javascript
// JavaScript/TypeScript
async function streamChat(message: string, onChunk: (chunk: Msg) => void) {
    const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ message })
    });
    
    const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 解析 SSE
        const lines = value.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data !== '[DONE]') {
                    const msg = JSON.parse(data);
                    onChunk(msg);
                }
            }
        }
    }
}
```

## 实践应用

### 方案对比：OpenClaw vs Spring + AgentScope

| 工作内容 | OpenClaw | Spring + AgentScope |
|---------|----------|---------------------|
| **1️⃣ 组件定义** | ✅ 自己做 | ✅ 自己做 |
| **2️⃣ 运行态管理** | ✅ 内置（Gateway） | ❌ 自己实现 |
| **3️⃣ 协议转换** | ✅ 内置（Channel Provider） | ❌ 自己实现 |
| **4️⃣ 应用层** | ✅ 内置（Control UI + Gateway） | ❌ 自己实现 |
| **5️⃣ Channel 集成** | ✅ 内置（10+ Channel） | ❌ 自己实现 |

**工作量分布：**
- **OpenClaw**: 20%（只做组件定义）
- **Spring + AgentScope**: 80%（全栈开发）

### 选择建议

| 场景 | 推荐方案 |
|------|---------|
| **快速原型** | OpenClaw |
| **个人助理应用** | OpenClaw |
| **企业定制化** | Spring + AgentScope |
| **需要深度定制** | Spring + AgentScope |
| **多渠道接入** | OpenClaw（内置 Channel） |

## 常见问题

### Q1: 框架层需要做什么？

**A:** 定义 Agent、Tool、Memory、Prompt，这是所有方案都需要自己做的核心工作。

### Q2: 运行态管理包括哪些内容？

**A:** 会话管理、状态持久化、并发控制、错误处理、监控告警。

### Q3: 协议转换什么时候需要？

**A:** 当需要接入外部 Channel（Matrix、Discord、钉钉等）时，需要实现消息格式转换。

### Q4: 传输层需要自己实现吗？

**A:** 不需要。传输层（HTTP/WebSocket）由框架或库提供，只需要选择用哪个。

### Q5: OpenClaw 和 Spring + AgentScope 怎么选？

**A:** 
- **快速上手、开箱即用** → OpenClaw
- **深度定制、企业集成** → Spring + AgentScope

## 相关卡片

- [智能体系统协议分层架构](../../concept/protocol/agent-system-protocol-layers.md)
- [WebSocket vs SSE 对比](../../concept/protocol/websocket-vs-sse.md)
- [Spring WebSocket 支持](../../concept/protocol/spring-websocket.md)
- [AgentScope 消息协议](../../frameworks/02-agentscope-ecosystem/agentscope/protocol/message-protocol.md)
- [OpenClaw Gateway 架构](../../frameworks/03-openclaw/02-核心抽象层/gateway/gateway-architecture.md)
- [CoPaw 架构分析](../../frameworks/02-agentscope-ecosystem/hiclaw/copaw-architecture-analysis.md)

## 参考资料

- [AgentScope Documentation](https://github.com/agentscope-ai/agentscope)
- [AgentScope-Java Documentation](https://github.com/agentscope-ai/agentscope-java)
- [OpenClaw Documentation](https://docs.openclaw.ai)
- [CoPaw Repository](https://github.com/agentscope-ai/CoPaw)
- [Spring Boot WebFlux](https://docs.spring.io/spring-framework/reference/web/webflux.html)
