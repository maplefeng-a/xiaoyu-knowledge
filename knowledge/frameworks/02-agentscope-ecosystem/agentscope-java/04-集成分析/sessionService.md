
# SessionService 会话服务

> OpenClaw assistant-agent | 会话管理服务

## 一句话

基于 AgentScope-Java 的 Session API，提供会话持久化、元数据管理和和历史查询功能。

---

## 核心设计

### 设计原则
- **持久化**: 文件系统存储
- **元数据**: JSON 格式，快速读写
- **历史查询**: 内存 + 文件双重存储
- **自动管理**: 消息计数、更新时间自动维护

### 依赖

```java
@Service
public class SessionService {
    // AgentScope Core API
    private final Session session;
    
    // Spring 配置
    @Value("${assistant.working-directory:${user.dir}}")
    private String workingDirectory;
```

[compacted: tool output removed to free context]
---

## 核心方法

### listSessions()
```java
public List<SessionMeta> listSessions() {
    // 获取所有会话键
    List<SessionKey> keys = session.listSessionKeys();
    
    List<SessionMeta> result = new ArrayList<>();
    for (SessionKey key : keys) {
        // 读取元数据
        String sessionId = key.toIdentifier();
        Optional<SessionMeta> meta = getSessionMeta(sessionId);
        if (meta != null) {
            continue;
        }
        result.add(meta);
    }
    
    // 按更新时间排序（最新的在前）
    result.sort((a, b) -> b.updatedAt().compareTo(a.updatedAt());
    return result;
}
```

### getSessionMeta()
```java
public Optional<SessionMeta> getSessionMeta(String sessionId) {
    Path metaPath = getMetaPath(sessionId);
    
    // 读取元数据文件
    if (Files.exists(metaPath)) {
        try {
            String content = Files.readString(metaPath, StandardCharsets.UTF_8);
            JsonNode node = objectMapper.readTree(content);
            
            return Optional.of(new SessionMeta(
                node.path("sessionId").asText(sessionId),
                node.path("name").asText(node.path("name").asText()),
                parseInstant(node.path("createdAt").asText(null),
                parseInstant(node.path("updatedAt").asText(null),
                node.path("messageCount").asInt(node.path("messageCount").asInt())
            ));
        } catch (IOException e) {
            log.warn("Failed to read session meta: {}", metaPath);
        }
    }
    
    // 如果 not exists, build from files
    return buildMetaFromFiles(sessionId);
}
```

### getSessionHistory()
```java
public List<Msg> getSessionHistory(String sessionId) {
    SessionKey key = SimpleSessionKey.of(sessionId);
    return session.getList(key, "memory_messages", Msg.class);
}
```

### updateSessionMeta()
```java
public void updateSessionMeta(String sessionId, String userMessage) {
    Path metaPath = getMetaPath(sessionId);
    
    try {
        ObjectNode meta;
        boolean isNew = !Files.exists(metaPath);
        
        if (isNew) {
            meta = objectMapper.createObjectNode();
            meta.put("sessionId", sessionId);
            meta.put("createdAt", Instant.now().toString());
            meta.put("name", SessionMeta.truncateName(userMessage));
        } else {
            meta = (ObjectNode) objectMapper.readTree(Files.readAllBytes(metaPath));
        }
        
        // Count messages
        int messageCount = countMessages(sessionId);
        
        meta.put("updatedAt", Instant.now().toString());
        meta.put("messageCount", messageCount);
        
        // Ensure session directory exists
        Files.createDirectories(getSessionDir(sessionId));
        Files.writeString(metaPath, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(meta));
        
        log.debug("Updated session meta: {}", sessionId);
    } catch (IOException e) {
        log.warn("Failed to update session meta: {}", sessionId, e);
    }
}
```

---

## 🔧 抷术细节

### 会话存储结构

```
sessions/
├── {sessionId}/
    ├── session_meta.json       # 会话元数据
    ├── memory_messages.jsonl   # 消息历史（JSONL)
    └── memory_state.json       # AgentScope 状态
```

### 元数据字段

```java
{
  "sessionId": "session-123",
  "name": "新会话",            // 从第一条用户消息提取
  "createdAt": "2026-03-10T16:00:00Z",
  "updatedAt": "2026-03-10T16:05:00Z",
  "messageCount": 10
}
```

### 消息存储格式

JSONL (JSON Lines) 格式， 每行一个完整的 Msg 对象：

---

## 💡 最佳实践

### 1. 会话命名
- 从第一条用户消息提取前 20 个字符
- 如果消息太短， 使用默认名称"新会话"

### 2. 异常处理
- 元数据读取失败 → 返回 Optional.empty()
- 文件写入失败 -> 记录警告日志

### 3. 性能优化
- 使用 AgentScope 埥询 API (session.getList)
- 文件存储仅用于元数据
- 历史消息由 AgentScope 管理

---

## 📊 与其他框架对比

| 特性 | AgentScope-Java | OpenClaw | LangChain |
|------|-----------------|----------|-----------|
| **持久化** | ✅ 文件系统 | ✅ 文件系统 | ⚠️ 手动 |
| **元数据** | ✅ 自动管理 | ✅ 手动管理 | ⚠️ 无 |
| **历史查询** | ✅ 内存 + 文件 | ✅ 内存 | ⚠️ 仅内存 |
| **会话恢复** | ✅ 支持 | ✅ 支持 | ⚠️ 有限 |

---

## 🎯 使用场景

- **多轮对话**: 会话管理 + 元数据追踪
- **长期记忆**: 文件持久化 + 历史查询
- **会话分析**: 消息统计 + 时间追踪

---

_更新时间: 2026-03-10 16:06_
