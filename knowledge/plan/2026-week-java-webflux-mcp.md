---
title: Java 学习周计划 - WebFlux & MCP
tags:
  - java
  - spring-boot
  - webflux
  - mcp
  - weekly-plan
created: 2026-02-09
status: active
---

# Java 学习周计划 - WebFlux & MCP

> 周结论沉淀 | 可复盘追踪

---

## 📌 本周三大重点

| 重点 | 目标 | 验收标准 |
|------|------|----------|
| **WebFlux 线程模型** | 深入理解响应式编程核心机制 | 能清晰解释 EventLoop、调度器、背压机制 |
| **MCP 最小链路** | 跑通 MCP 协议联调最小可行链路 | 完成一个可运行的 MCP Client-Server Demo |
| **每日 1 张卡片** | 持续沉淀学习成果 | 本周产出 5-7 张知识卡片 |

---

## 🎯 背景与动机

### 为什么是这三个重点？

1. **WebFlux 线程模型** - 响应式编程是 AgentScope-Java 高并发场景的基础
2. **MCP 最小链路** - 模型上下文协议是智能体工具集成的新兴标准
3. **每日卡片** - 知识资产沉淀，支撑核心知识库建设

### 与职业发展的关联

```
入职阿里云 (3.16) → AgentScope-Java 生态建设
       ↑
   当前准备：WebFlux + MCP 技术储备
```

---

## 📋 执行计划

### WebFlux 线程模型

- [ ] 理解 Reactor 核心概念（Mono/Flux）
- [ ] 掌握线程调度器（Schedulers）使用
- [ ] 理解背压（Backpressure）机制
- [ ] 实践：编写响应式 Service 示例

### MCP 最小链路

- [ ] 搭建 MCP Server（暴露一个工具）
- [ ] 搭建 MCP Client（调用工具）
- [ ] 完成端到端联调
- [ ] 记录踩坑点和解决方案

### 每日卡片沉淀

- [ ] 卡片模板标准化
- [ ] 每日学习结束前完成
- [ ] 周末回顾整理

---

## 📊 复盘检查点

### 周末自问

1. WebFlux 线程模型是否真正理解？能否向他人讲解？
2. MCP 最小链路是否可运行？代码是否已归档？
3. 本周卡片数量和质量如何？哪些值得深化？

### 风险预警

| 风险 | 应对 |
|------|------|
| WebFlux 概念抽象难懂 | 结合具体代码示例，避免纯理论 |
| MCP 环境配置复杂 | 优先用官方示例，减少自定义 |
| 卡片流于形式 | 每张卡片必须有可复用价值 |

---

## 🔗 关联资源

- [AgentScope-Java GitHub](https://github.com/modelscope/agentscope-java)
- [Spring WebFlux 官方文档](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html)
- [MCP 协议规范](https://modelcontextprotocol.io/)

---

## 📝 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-02-09 | 初始创建，明确本周三大重点 |

---

**下次复盘**: 2026-02-16（周一）
**关联卡片**: 本周每日学习卡片将引用此计划
