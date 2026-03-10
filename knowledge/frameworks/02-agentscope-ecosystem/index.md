# 🏢 AgentScope 生态

> 国内/阿里主流智能体框架 - **主战场**

## 🎯 核心组件

- **AgentScope (Python)** - 原生 Python 版本
- **AgentScope-Java** - Java 版本（重点研究方向）
- **HiClaw** - 异构智能体协作系统
- **CoPaw** - 协作增强工具

---

## 📂 内容导航

<div class="card-grid">
  <a href="/frameworks/02-agentscope-ecosystem/agentscope/" class="card">
    <div class="card-icon">🐍</div>
    <h3>AgentScope Python</h3>
    <p>Python 版本核心架构与知识地图</p>
  </a>
  
  <a href="/frameworks/02-agentscope-ecosystem/agentscope-java/" class="card highlight">
    <div class="card-icon">☕</div>
    <h3>AgentScope-Java</h3>
    <p>Java 版本 - 入职阿里云后的主战场</p>
    <span class="card-badge">⭐ 重点</span>
  </a>
  
  <a href="/frameworks/02-agentscope-ecosystem/hiclaw/" class="card">
    <div class="card-icon">🤝</div>
    <h3>HiClaw</h3>
    <p>异构智能体协作验证与对比分析</p>
  </a>
</div>

---

## 🔍 AgentScope-Java 知识体系

### 核心抽象层
- 消息模型
- 模型抽象
- 工具系统
- 记忆管理
- 会话管理
- 状态管理

### Agent 能力层
- Agent 抽象
- 规划系统
- 技能系统
- RAG 系统
- HITL 人机协作
- Pipeline 流水线
- Hook 系统
- 中断机制

### 扩展生态层
- MCP 协议
- A2A 协议
- AGUI 协议
- 框架集成

### 可观测性
- Tracing
- Studio 可视化

<style>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.card {
  display: block;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--vp-c-brand);
}

.card.highlight {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.card h3 {
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-1);
}

.card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.75rem;
}
</style>
