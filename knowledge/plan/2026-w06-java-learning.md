---
title: 2026-W06 Java 学习计划 - WebFlux + MCP
tags:
  - plan
  - java
  - webflux
  - mcp
  - 2026-02
week: 2026-W06
created: 2026-02-10
status: in-progress
---

## 📌 本周核心结论

> **三个重点**：WebFlux 线程模型要重点理解；MCP 联调先跑通最小链路；每天沉淀 1 张卡片

---

## 🎯 学习背景

| 项目 | 内容 |
|------|------|
| **技术栈** | Spring Boot + WebFlux + MCP |
| **职业关联** | AgentScope-Java 开源框架生态建设 |
| **入职时间** | 2026 年 3 月 16 日（阿里云） |
| **学习阶段** | 入职前准备期 |

---

## 📚 三大学习重点

### 1️⃣ WebFlux 线程模型（重点理解）

**为什么重要**：
- 响应式编程的核心，理解 EventLoop 和线程调度
- AgentScope-Java 框架高并发场景的基础
- 与 Servlet 模型差异大，需要深入理解

**卡片规划**：
- `concept/webflux-thread-model` - 核心线程模型
- `concept/webflux-vs-mvc` - 与 Servlet 模型对比
- `skill/webflux-debug` - 线程问题调试技巧

### 2️⃣ MCP 联调（最小链路优先）

**为什么重要**：
- Model Context Protocol 是大模型应用的关键协议
- 智能体工具调用的核心标准
- 快速验证避免过早陷入复杂场景

**卡片规划**：
- `skill/mcp-minimal-setup` - 最小环境搭建
- `note/mcp-debug-log` - 联调日志与问题记录
- `concept/mcp-protocol` - 协议核心概念

### 3️⃣ 每日卡片沉淀（知识复利）

**执行方式**：
- 每天至少 1 张学习卡片
- 使用知识卡片系统统一管理
- 形成可检索、可复盘的知识库

**卡片模板**：
```markdown
---
title: [日期] 学习记录
tags: [daily, webflux/mcp, 2026-02]
date: 2026-02-xx
---

## 今日重点
- 

## 关键收获
- 

## 待解决问题
- 

## 明日计划
- 
```

---

## 📋 本周行动计划

| 日期 | 重点 | 产出卡片 |
|------|------|----------|
| 周一 | WebFlux 线程模型入门 | concept/webflux-thread-model |
| 周二 | WebFlux vs MVC 对比 | concept/webflux-vs-mvc |
| 周三 | MCP 环境搭建 | skill/mcp-minimal-setup |
| 周四 | MCP 最小链路联调 | note/mcp-debug-log |
| 周五 | 本周复盘 + 问题整理 | note/2026-w06-review |
| 周末 | 补充/深化薄弱环节 | 按需创建 |

---

## ✅ 验收标准

- [ ] WebFlux 线程模型能清晰讲解
- [ ] MCP 最小链路成功跑通（Client ↔ Server）
- [ ] 本周至少 5 张学习卡片入库
- [ ] 形成可复用的调试方法论

---

## 🔗 关联卡片

- [[anchors]] - 核心方向锚点
- [[career-plan]] - 职业发展规划
- [[profile]] - 用户档案

---

## 📝 复盘记录

| 日期 | 内容 |
|------|------|
| 2026-02-10 | 创建计划卡片，明确本周三大重点 |

---

**建立日期**: 2026-02-10  
**更新频率**: 每日更新进展，周末复盘
