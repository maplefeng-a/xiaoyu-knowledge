---
id: frameworks/openclaw/channel/channel-architecture
title: OpenClaw Channel 接入总览
tags: [openclaw, channel, provider, architecture]
status: published
createdAt: 2026-03-13
updatedAt: 2026-03-13
learningFrom: OpenClaw Channel Provider 源码学习 + 官方文档
---

# OpenClaw Channel 接入总览

## 概述

OpenClaw Channel 是连接智能体和外部消息平台（WhatsApp、Telegram、Discord 等）的桥梁。通过统一的 Provider 抽象层，OpenClaw 实现了"一次开发，多渠道接入"的能力。

## 核心概念

### Channel 架构

```
┌──────────────────────────────────────────────────────────────┐
│                     Gateway Core                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              统一消息模型         │ │
│  │  • ChatType: direct | group | channel                   │ │
│  │  • InboundMessage: 标准化的入站消息结构                   │ │
│  │  • OutboundMessage: 标准化的出站消息结构                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↑↓                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Channel Provider 抽象层                     │ │
│  │  • send(message) → 投递消息                              │ │
│  │  • onMessage(callback) → 接收消息                        │ │
│  │  • health() → 健康检查                                   │ │
│  │  • login/logout() → 认证管理                             │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
        ↓                    ↓                    ↓
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │WhatsApp │          │Telegram │          │ Discord │
   │Provider │          │Provider │          │Provider │
   │(Baileys)│          │(grammY) │          │(Gateway)│
   └─────────┘          └─────────┘          └─────────┘
```

## 关键要点

### 1. 统一消息模型

#### ChatType 定义

```typescript
type ChatType = "direct" | "group" | "channel";

function normalizeChatType(raw?: string): ChatType | undefined {
  const value = raw?.trim().toLowerCase();
  if (value === "direct" || value === "dm") return "direct";
  if (value === "group") return "group";
  if (value === "channel") return "channel";
  return undefined;
}
```

#### 统一入站消息结构

```typescript
interface InboundMessage {
  // 基础字段
  id: string;                    // 消息唯一 ID
  channel: string;               // "whatsapp" | "telegram" | "discord" ...
  accountId?: string;            // 多账号场景
  
  // 发送者信息
  from: {
    id: string;                  // 发送者 ID
    name?: string;               // 显示名称
    kind: "user" | "bot";        // 类型
  };
  
  // 会话信息
  chat: {
    id: string;                  // 聊天 ID
    type: ChatType;              // direct | group | channel
    name?: string;               // 群组/频道名称
  };
  
  // 消息内容
  body: string;                  // 文本内容
  replyTo?: {                    // 引用消息
    id: string;
    body?: string;
    sender?: string;
  };
  
  // 元数据
  timestamp: number;
  mentions?: string[];           // @提及列表
  
  // 附件
  attachments?: Attachment[];
}
```

#### 统一出站消息结构

```typescript
interface OutboundMessage {
  to: {
    id: string;                  // 目标 ID
    type: ChatType;
  };
  
  body?: string;                 // 文本内容
  replyTo?: string;              // 回复的消息 ID
  
  // Channel 特定选项
  options?: {
    parseMode?: "markdown" | "html";
    silent?: boolean;
    reactions?: string[];
  };
  
  // 附件
  attachments?: Attachment[];
}
```

---

### 2. Channel Provider 抽象

#### Provider 接口定义

```typescript
interface ChannelProvider {
  // 唯一标识
  readonly name: string;         // "whatsapp" | "telegram" | ...
  
  // 生命周期
  initialize(config: ChannelConfig): Promise<void>;
  shutdown(): Promise<void>;
  
  // 认证
  login(): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
  
  // 消息
  send(message: OutboundMessage): Promise<SendResult>;
  onMessage(handler: MessageHandler): void;
  
  // 健康检查
  health(): Promise<HealthStatus>;
  
  // 能力声明
  capabilities: {
    reactions: boolean;
    edit: boolean;
    delete: boolean;
    threads: boolean;
    typing: boolean;
    media: MediaCapability[];
  };
}
```

#### 能力声明示例

| Channel | reactions | edit | delete | threads | typing | media |
|---------|-----------|------|--------|---------|--------|-------|
| WhatsApp | ✅ | ❌ | ✅ | ❌ | ✅ | image/video/audio/document |
| Telegram | ✅ | ✅ | ✅ | ✅ (topics) | ✅ | 全部 |
| Discord | ✅ | ✅ | ✅ | ✅ | ✅ | 全部 |
| Slack | ✅ | ✅ | ✅ | ✅ | ✅ | 全部 |
| Signal | ✅ | ❌ | ✅ | ❌ | ✅ | image/video/audio |

---

### 3. 消息路由机制

#### 路由流程

```
入站消息
    │
    ↓
┌─────────────────┐
│ Channel Provider│  接收原始消息
│ (WhatsApp/...)  │
└────────┬────────┘
         │
         ↓  转换为统一格式
┌─────────────────┐
│  Allowlist 检查  │  dmPolicy / groupPolicy
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Agent 路由      │  根据绑定规则选择 Agent
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Session 路由     │  确定 Session Key
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Agent 执行     │  调用 LLM + Tools
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  回复路由        │  发送回原 Channel
└─────────────────┘
```

#### Agent 路由规则（优先级）

```json5
// 绑定配置
{
  bindings: [
    // 1. 精确匹配
    { match: { peer: { kind: "group", id: "-100123" } }, agentId: "support" },
    
    // 2. Guild + Roles 匹配
    { match: { guildId: "T123", roles: ["admin"] }, agentId: "admin" },
    
    // 3. Team 匹配
    { match: { channel: "slack", teamId: "T456" }, agentId: "work" },
    
    // 4. Account 匹配
    { match: { channel: "telegram", accountId: "work" }, agentId: "work" },
    
    // 5. Channel 匹配
    { match: { channel: "whatsapp" }, agentId: "personal" },
  ]
}
```

#### Session Key 结构

```typescript
// DM 会话
`agent:${agentId}:${channel}:${peerId}`

// 群组会话
`agent:${agentId}:${channel}:group:${groupId}`

// 频道会话
`agent:${agentId}:${channel}:channel:${channelId}`

// 帖子/主题
`agent:${agentId}:${channel}:group:${groupId}:topic:${topicId}`
`agent:${agentId}:${channel}:channel:${channelId}:thread:${threadId}`
```

---

### 4. Channel 配置系统

#### 统一配置结构

```json5
{
  channels: {
    whatsapp: {
      // 认证
      enabled: true,
      accounts: {
        default: { /* 账号配置 */ },
        work: { /* 多账号 */ }
      },
      
      // 访问控制
      dmPolicy: "pairing",        // pairing | allowlist | open | disabled
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      
      // 群组配置
      groups: {
        "*": { requireMention: true },
        "120363403215116621@g.us": { requireMention: false }
      },
      
      // 默认账号
      defaultAccount: "default"
    },
    
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456"]
    },
    
    discord: {
      enabled: true,
      botToken: "...",
      dmPolicy: "pairing",
      allowFrom: ["discord:123456"]
    }
  }
}
```

#### 多账号支持

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        personal: {
          credsPath: "~/.openclaw/credentials/whatsapp/personal"
        },
        work: {
          credsPath: "~/.openclaw/credentials/whatsapp/work"
        }
      },
      defaultAccount: "personal"
    }
  },
  
  bindings: [
    { match: { channel: "whatsapp", accountId: "work" }, agentId: "work" },
    { match: { channel: "whatsapp", accountId: "personal" }, agentId: "personal" }
  ]
}
```

---

### 5. 健康监控机制

#### Channel 健康检查

```typescript
interface ChannelHealth {
  channel: string;
  accountId?: string;
  
  status: "connected" | "disconnected" | "degraded" | "error";
  
  // 连接信息
  connected: boolean;
  lastSeen?: number;
  
  // 认证信息
  authenticated: boolean;
  authAge?: number;
  
  // 错误信息
  error?: {
    code: string;
    message: string;
  };
  
  // 探测结果
  probe?: {
    latency: number;
    timestamp: number;
  };
}
```

#### 健康检查命令

```bash
# 快速检查
openclaw status

# 深度检查（含 Gateway 探测）
openclaw status --deep

# JSON 格式健康快照
openclaw health --json

# Channel 状态
openclaw channels status --probe
```

#### 自动重连机制

```
Channel 断开
    │
    ↓
┌─────────────┐
│ 检测断开     │  监听 WebSocket/连接事件
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 指数退避     │  1s → 2s → 4s → 8s ...
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 尝试重连     │  重新初始化 Provider
└──────┬──────┘
       │
       ├─── 成功 → 恢复正常
       │
       └─── 失败 → 继续退避
              │
              ↓
         ┌─────────┐
         │ 通知用户 │  广播 disconnect 事件
         └─────────┘
```

---

## 实践应用

### WhatsApp Provider 示例

```typescript
class WhatsAppProvider implements ChannelProvider {
  name = "whatsapp";
  
  private socket: WASocket;
  
  async initialize(config) {
    // 加载凭证
    const creds = await loadCreds(config.credsPath);
    
    // 创建连接
    this.socket = makeWASocket({
      auth: creds,
      printQRInTerminal: true
    });
    
    // 监听消息
    this.socket.ev.on("messages.upsert", (update) => {
      for (const msg of update.messages) {
        const unified = this.toUnifiedMessage(msg);
        this.messageHandler(unified);
      }
    });
    
    // 监听连接状态
    this.socket.ev.on("connection.update", (update) => {
      this.handleConnectionUpdate(update);
    });
  }
  
  async send(message: OutboundMessage) {
    await this.socket.sendMessage(message.to.id, {
      text: message.body,
      quoted: message.replyTo
    });
  }
  
  private toUnifiedMessage(raw: WAMessage): InboundMessage {
    return {
      id: raw.key.id,
      channel: "whatsapp",
      from: {
        id: raw.key.remoteJid,
        name: raw.pushName
      },
      chat: {
        id: raw.key.remoteJid,
        type: this.inferChatType(raw.key.remoteJid)
      },
      body: raw.message?.conversation || "",
      timestamp: raw.messageTimestamp
    };
  }
}
```

### Telegram Provider 示例

```typescript
class TelegramProvider implements ChannelProvider {
  name = "telegram";
  
  private bot: Bot;
  
  async initialize(config) {
    this.bot = new Bot(config.botToken);
    
    // 消息处理
    this.bot.on("message", (ctx) => {
      const unified = this.toUnifiedMessage(ctx.message);
      this.messageHandler(unified);
    });
    
    // 启动
    await this.bot.start();
  }
  
  async send(message: OutboundMessage) {
    await this.bot.api.sendMessage(message.to.id, message.body, {
      parse_mode: message.options?.parseMode,
      reply_to_message_id: message.replyTo
    });
  }
}
```

---

## 常见问题

### Q1: 如何新增一个 Channel？

**A:** 实现 `ChannelProvider` 接口，注册到 Gateway 即可。

### Q2: 多账号如何管理？

**A:** 在 `channels.{channel}.accounts` 中配置多个账号，通过 `accountId` 路由。

### Q3: Channel 断线后会自动重连吗？

**A:** 会。Gateway 使用指数退避策略自动重连。

### Q4: 如何查看 Channel 健康状态？

**A:** 使用 `openclaw channels status --probe` 命令。

## 相关卡片

- [智能体系统协议分层架构](../../../concept/protocol/agent-system-protocol-layers.md)
- [构建智能体应用工作清单](../../../plan/agent-application/building-agent-application-checklist.md)
- [OpenClaw Gateway 架构](../../02-核心抽象层/gateway/gateway-architecture.md)
- [AgentScope 消息协议](../../02-agentscope-ecosystem/agentscope/protocol/message-protocol.md)

## 参考资料

- [OpenClaw Channel Documentation](https://docs.openclaw.ai/channels)
- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
