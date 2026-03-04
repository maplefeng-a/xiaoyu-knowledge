# 多智能体协同架构设计

> assistant-agent 与外部智能体协作机制

## 1. 背景

### 1.1 协作场景

| 智能体 | 平台 | 场景 | 协作方式 |
|--------|------|------|----------|
| **assistant-agent** | 后端服务 | 主力 Agent，处理用户请求 | 主控节点 |
| **Claude Code** | CLI | 办公场景代码开发 | 异步事件 |
| **Codex** | CLI | 代码补全/生成 | 异步事件 |
| **OpenClaw** | 手机端 | 移动场景 | 异步事件 |

### 1.2 核心挑战

1. **跨进程通信**：各智能体运行在不同进程/机器
2. **状态同步**：需要共享工作进展和上下文
3. **任务协调**：主智能体需要分配和跟踪任务
4. **协议统一**：不同智能体需要统一的通信协议

## 2. 现有机制分析

### 2.1 MsgHub（agentscope-java）

**特点**：实时、内存级消息广播

```
┌─────────────────────────────────────────┐
│              MsgHub (JVM 内)             │
├─────────────────────────────────────────┤
│  Alice ──┐                              │
│  Bob   ──┼── 自动广播消息 ──→ 所有参与者  │
│  Charlie─┘                              │
└─────────────────────────────────────────┘

限制：仅支持同一 JVM 进程内的 Agent
```

**核心代码**：
```java
MsgHub hub = MsgHub.builder()
    .name("Collaboration")
    .participants(alice, bob, charlie)
    .announcement(announcement)
    .enableAutoBroadcast(true)
    .build();

hub.enter().block();
alice.call().block();  // 自动广播给 bob, charlie
```

**适用场景**：
- 同一服务内的多 Agent 协作
- 实时对话、辩论、投票

### 2.2 Event Hub（MD 版本）

**特点**：持久化、跨进程、异步通信

```
┌─────────────────────────────────────────┐
│         messages/ (文件系统)             │
├─────────────────────────────────────────┤
│  agentscope-java/                       │
│    ├─ 2026-02-06-08:38-claude.md       │
│    └─ 2026-02-06-09:10-assistant.md    │
│  assistant-dev/                         │
│    └─ 2026-02-07-10:44-claude.md       │
└─────────────────────────────────────────┘
         ↑              ↑
    Claude Code    assistant-agent
    (不同进程)        (不同进程)
```

**核心协议**：
```markdown
---
event_type: work_update
sender: claude
timestamp: 2026-02-06T22:15:30+08:00
room: agentscope-java
reply_to: 2026-02-05-17:30-maple.md
tags: [spring-boot, integration]
status: completed
---

## Spring Boot 集成完成
...
```

**适用场景**：
- 跨进程/跨机器的 Agent 协作
- 异步任务通知
- 工作进展追踪

## 3. 混合架构设计

### 3.1 架构图

```
┌────────────────────────────────────────────────────────────┐
│                    assistant-agent (主控)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MsgHub (内部协作)                         │  │
│  │    Planner ──┐                                       │  │
│  │    Executor ─┼── 实时消息广播                          │  │
│  │    Reviewer ─┘                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                │
│                    EventBridge                             │
│                    (协议转换)                               │
│                           │                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Event Hub (外部协作)                      │  │
│  │    messages/                                          │  │
│  │      ├─ agentscope-java/                             │  │
│  │      ├─ assistant-dev/                               │  │
│  │      └─ daily-summary/                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                           ↕
    ┌─────────────────────────────────────────────┐
    │            外部智能体 (异步)                  │
    │  Claude Code │ Codex │ OpenClaw │ Clawdbot │
    └─────────────────────────────────────────────┘
```

### 3.2 组件职责

| 组件 | 职责 | 实现 |
|------|------|------|
| **MsgHub** | 内部 Agent 实时协作 | agentscope-java MsgHub |
| **EventBridge** | 协议转换（Msg ↔ Event） | 新增工具类 |
| **Event Hub** | 外部 Agent 异步通信 | MD 文件协议 |

### 3.3 通信模式

| 模式 | 场景 | 协议 |
|------|------|------|
| **实时协作** | 内部 Agent 讨论、投票 | MsgHub |
| **任务委派** | 委派任务给外部 Agent | Event (task) |
| **进展同步** | 各 Agent 汇报工作进展 | Event (work_update) |
| **问答协作** | 请求其他 Agent 协助 | Event (question/answer) |

## 4. 实现方案

### 4.1 EventBridge 设计

```java
/**
 * 协议转换桥接器
 * Msg (内存) ↔ Event (文件)
 */
public class EventBridge {

    private final String messagesDir;
    private final String agentName;

    /**
     * Msg 转 Event 文件
     */
    public Path msgToEvent(Msg msg, String room) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("event_type", mapEventType(msg));
        metadata.put("sender", agentName);
        metadata.put("timestamp", Instant.now().toString());
        metadata.put("room", room);

        String content = extractTextContent(msg);
        return writeEventFile(room, metadata, content);
    }

    /**
     * Event 文件转 Msg
     */
    public Msg eventToMsg(Path eventFile) {
        Event event = parseEventFile(eventFile);
        return Msg.builder()
            .name(event.getSender())
            .role(MsgRole.USER)
            .content(TextBlock.of(event.getContent()))
            .metadata(event.getMetadata())
            .build();
    }

    /**
     * 查询房间最新事件
     */
    public List<Msg> queryRoomEvents(String room, int limit) {
        return listEventFiles(room).stream()
            .sorted(Comparator.reverseOrder())
            .limit(limit)
            .map(this::eventToMsg)
            .collect(Collectors.toList());
    }

    /**
     * 查询回复线程
     */
    public List<Msg> queryReplyThread(String eventFile) {
        // 递归查找 reply_to 链
    }
}
```

### 4.2 Agent 工具注册

```java
/**
 * 多智能体协作工具
 */
public class CollaborationTools {

    @Tool(description = "发送事件到指定房间，通知其他智能体")
    public String sendEvent(
        @Param(description = "房间名") String room,
        @Param(description = "事件类型") String eventType,
        @Param(description = "内容") String content
    ) {
        return eventBridge.sendEvent(room, eventType, content);
    }

    @Tool(description = "查询房间最新事件")
    public String queryEvents(
        @Param(description = "房间名") String room,
        @Param(description = "数量限制") int limit
    ) {
        List<Msg> events = eventBridge.queryRoomEvents(room, limit);
        return formatEvents(events);
    }

    @Tool(description = "分配任务给指定智能体")
    public String assignTask(
        @Param(description = "目标智能体") String agent,
        @Param(description = "任务描述") String task
    ) {
        return eventBridge.sendEvent(
            "tasks",
            "task",
            String.format("To: %s\n%s", agent, task)
        );
    }
}
```

### 4.3 协作流程示例

**场景：assistant-agent 请求 Claude Code 协助代码审查**

```
1. 用户请求 → assistant-agent
2. assistant-agent 决定需要 Claude Code 协助
3. 调用 sendEvent("assistant-dev", "task", "审查 ChatService.java")
4. Claude Code 轮询 messages/assistant-dev/
5. Claude Code 读取任务，执行代码审查
6. Claude Code 写入回复 event
7. assistant-agent 读取回复，整合到最终答案
```

## 5. 配置设计

### 5.1 application.yml

```yaml
assistant:
  collaboration:
    # 内部协作（MsgHub）
    internal:
      enabled: true
      agents:
        - name: planner
          sys-prompt: "负责分析和规划..."
        - name: executor
          sys-prompt: "负责执行任务..."
        - name: reviewer
          sys-prompt: "负责审查结果..."

    # 外部协作（Event Hub）
    external:
      enabled: true
      messages-dir: ${user.home}/xiaoyu/messages
      agent-name: assistant
      poll-interval: 30s

    # 协作房间
    rooms:
      - name: agentscope-java
        description: "agentscope 框架研究"
      - name: assistant-dev
        description: "assistant 系统开发"
      - name: tasks
        description: "跨智能体任务分配"
```

### 5.2 环境变量

```bash
# 协作配置
ASSISTANT_COLLABORATION_ENABLED=true
ASSISTANT_COLLABORATION_MESSAGES_DIR=/path/to/xiaoyu/messages
ASSISTANT_COLLABORATION_AGENT_NAME=assistant
```

## 6. 实现优先级

| 优先级 | 功能 | 工作量 |
|--------|------|--------|
| P0 | EventBridge 基础实现 | 2h |
| P0 | sendEvent/queryEvents 工具 | 1h |
| P1 | MsgHub 内部协作集成 | 2h |
| P1 | 定时轮询外部事件 | 1h |
| P2 | 任务状态跟踪 | 2h |
| P2 | 回复线程支持 | 1h |

## 7. 使用示例

### 7.1 发送工作进展

```java
// Agent 自动发送工作进展
collaborationTools.sendEvent(
    "assistant-dev",
    "work_update",
    "完成 EventType 到 ContentBlock 映射优化"
);
```

### 7.2 查询其他智能体进展

```java
// 查询 Claude Code 的工作进展
String events = collaborationTools.queryEvents("agentscope-java", 5);
// 返回最近 5 条事件
```

### 7.3 请求协助

```java
// 请求 Claude Code 协助
collaborationTools.assignTask(
    "claude",
    "审查 ChatService.java 中的异步实现是否正确"
);
```

## 8. 注意事项

1. **异步特性**：Event Hub 是异步的，不能期待即时响应
2. **轮询开销**：需要平衡轮询频率和系统开销
3. **冲突处理**：多智能体同时写入需要文件锁机制
4. **事件清理**：需要定期清理过期事件文件

## 9. 扩展方向

1. **WebSocket 实时通知**：替代轮询，实现实时推送
2. **事件索引**：使用 SQLite 索引事件，提高查询效率
3. **权限控制**：不同智能体的访问权限管理
4. **事件压缩**：定期归档和压缩历史事件

---
*Created: 2026-02-23*
*Related: assistant-agent, MsgHub, event-hub, multi-agent*
