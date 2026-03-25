
# HITL 人机协作

> agentscope-java Agent 能力层

## 一句话

在智能体执行敏感操作前暂停，等待人工确认后再继续。

## 核心场景

- 敏感操作确认（删除文件、发送邮件、系统重载）
- 合规审核（数据处理、外部调用）
- 风险控制（资金操作、配置变更）

## 两个暂停时机

| 时机 | 事件 | 说明 |
|------|------|------|
| 推理后 | `PostReasoningEvent` | 工具执行前，可看到工具名和参数 |
| 行动后 | `PostActingEvent` | 工具执行后，可看到执行结果 |

## 实现方式

### 1. 创建确认 Hook

```java
public class ToolConfirmationHook implements Hook {
    private final Set<String> dangerousTools = new HashSet<>();

    @Override
    public <T extends HookEvent> Mono<T> onEvent(T event) {
        if (event instanceof PostReasoningEvent postReasoning) {
            Msg reasoningMsg = postReasoning.getReasoningMessage();
            List<ToolUseBlock> toolCalls = reasoningMsg.getContentBlocks(ToolUseBlock.class);

            boolean hasDangerous = toolCalls.stream()
                .anyMatch(t -> dangerousTools.contains(t.getName()));

            if (hasDangerous) {
                postReasoning.stopAgent();  // 暂停 agent
            }
        }
        return Mono.just(event);
    }

    public void addDangerousTool(String toolName) {
        dangerousTools.add(toolName);
    }
}
```

### 2. 注册到 Agent

```java
ToolConfirmationHook confirmationHook = new ToolConfirmationHook();
confirmationHook.addDangerousTool("delete_file");
confirmationHook.addDangerousTool("send_email");
confirmationHook.addDangerousTool("skill_reload");  // 热重载

ReActAgent agent = ReActAgent.builder()
    .hook(confirmationHook)
    .build();
```

### 3. 处理暂停和恢复

```java
Msg response = agent.stream(userMsg).blockLast();

// 检查是否有待确认的工具
if (response.hasContentBlocks(ToolUseBlock.class)) {
    List<ToolUseBlock> pending = response.getContentBlocks(ToolUseBlock.class);

    // 展示给用户确认
    if (userConfirms()) {
        agent.stream().blockLast();  // 继续执行
    } else {
        // 返回取消结果
        Msg cancelResult = Msg.builder()
            .role(MsgRole.TOOL)
            .content(ToolResultBlock.of(id, name, "操作已取消"))
            .build();
        agent.stream(cancelResult).blockLast();
    }
}
```

## 关键 API

| 方法 | 作用 |
|------|------|
| `PostReasoningEvent.stopAgent()` | 推理后暂停 |
| `PostActingEvent.stopAgent()` | 行动后暂停 |
| `agent.stream()` | 继续执行待处理工具 |
| `agent.stream(toolResultMsg)` | 提供自定义结果后继续 |

## 判断暂停原因

```java
response.getGenerateReason()
// 返回: REASONING_STOP_REQUESTED 或 ACTING_STOP_REQUESTED
```

## 示例项目

`agentscope-examples/hitl-chat` - 完整的 HITL 聊天示例

## 关联

- [[knowledge/agentscope-java/03-Agent能力层/Hook系统|Hook系统]]
- [[knowledge/agentscope-java/03-Agent能力层/Agent抽象|Agent抽象]]
- [[knowledge/agentscope-java/知识地图|知识地图]]
