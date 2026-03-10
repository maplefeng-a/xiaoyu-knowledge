# 🤖 xiaoyu 项目

> AI Native 个人助理系统

## 🏗️ 核心组件

<div class="card-grid">
  <a href="/assistant/agent/" class="card">
    <div class="card-icon">🧠</div>
    <h3>assistant-agent</h3>
    <p>主智能体运行时 - 规划、执行、记忆</p>
    <span class="card-tag highlight">核心</span>
  </a>
  
  <a href="/assistant/mcp/" class="card">
    <div class="card-icon">🔌</div>
    <h3>assistant-mcp</h3>
    <p>MCP 能力网关 - 工具调用、协议适配</p>
  </a>
  
  <a href="/assistant/eval/" class="card">
    <div class="card-icon">📊</div>
    <h3>assistant-eval</h3>
    <p>评估框架 - 基准测试、性能评估</p>
  </a>
  
  <a href="/assistant/desktop/" class="card">
    <div class="card-icon">🖥️</div>
    <h3>assistant-desktop</h3>
    <p>桌面端交互界面 - 用户体验设计</p>
  </a>
</div>

---

## 🔗 项目链接

- [xiaoyu 主仓库](https://github.com/maplefeng-a/xiaoyu)
- [xiaoyu-skills](https://github.com/maplefeng-a/xiaoyu-skills)
- [xiaoyu-knowledge](https://github.com/maplefeng-a/xiaoyu-knowledge)

<style>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

.card-tag {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 12px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.card-tag.highlight {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  font-weight: 600;
}
</style>
