---
title: Java 学习周计划 - WebFlux & MCP
tags:
  - java
  - spring-boot
  - webflux
  - mcp
  - 周计划
week: 2026-W06
created: 2026-02-10
---

# Java 学习周计划 - WebFlux & MCP

> 本周核心：WebFlux 线程模型深入 + MCP 最小链路跑通

---

## 📌 本周结论（Week Conclusion）

| 优先级 | 目标 | 关键动作 |
|--------|------|----------|
| **P0** | WebFlux 线程模型 | 重点理解事件循环、线程池配置、阻塞检测 |
| **P1** | MCP 联调 | 先跑通最小链路，再扩展功能 |
| **P2** | 知识沉淀 | 每天 1 张卡片，形成可复用的知识库 |

---

## 🎯 每日卡片计划

| 日期 | 主题 | 状态 | 卡片 ID |
|------|------|------|---------|
| Day 1 (2/10) | WebFlux 线程模型 | ⬜ | `concept/webflux-thread-model` |
| Day 2 (2/11) | TBD | ⬜ | - |
| Day 3 (2/12) | TBD | ⬜ | - |
| Day 4 (2/13) | TBD | ⬜ | - |
| Day 5 (2/14) | 周复盘 | ⬜ | `note/2026-W06-review` |

---

## 📚 核心学习资源

### WebFlux 线程模型
- Reactor 事件循环机制
- `boundedElastic` vs `parallel` vs `single` 线程池
- 阻塞调用检测 (`blockHound`)
- 调试技巧 (`hookOperator`)

### MCP 集成
- MCP Server 最小实现
- 与 Spring Boot 集成
- 工具调用链路验证

---

## ✅ DoD (Definition of Done)

- [ ] WebFlux 线程模型卡片完成，包含实践代码示例
- [ ] MCP 最小链路可运行，有 Demo 代码
- [ ] 完成 5 张知识卡片（含周复盘）
- [ ] 周复盘卡片总结收获和下周计划

---

## 📝 复盘区（周末填写）

### 收获
<!-- 本周最大的 3 个收获 -->

### 踩坑
<!-- 遇到的问题和解决方案 -->

### 下周调整
<!-- 基于本周经验的学习计划调整 -->

---

**关联卡片**:
- `agentscope-java/01-基础设施层/WebFlux/spring-webflux-响应式编程` - WebFlux 基础
- 待创建：`concept/webflux-thread-model` - 线程模型深入

---

**建立日期**: 2026-02-10  
**更新日期**: 每日跟进
