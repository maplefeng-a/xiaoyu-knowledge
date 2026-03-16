# 🌍 框架研究

> 智能体框架的四大研究方向

## 研究脉络

<div class="card-grid">
  <a href="/frameworks/01-langchain-ecosystem/" class="card">
    <div class="card-icon">🌍</div>
    <h3>LangChain 生态</h3>
    <p>国际主流 - DeepAgent、LangChain、LangGraph</p>
    <span class="card-tag">理论</span>
  </a>
  
  <a href="/frameworks/02-agentscope-ecosystem/" class="card">
    <div class="card-icon">🏢</div>
    <h3>AgentScope 生态</h3>
    <p>国内/阿里主流 - AgentScope、HiClaw、CoPaw</p>
    <span class="card-tag highlight">主战场</span>
  </a>
  
  <a href="/frameworks/03-openclaw/" class="card">
    <div class="card-icon">⚡</div>
    <h3>OpenClaw</h3>
    <p>新趋势 - 端侧运行、多渠道集成、插件生态</p>
    <span class="card-tag">实践</span>
  </a>
  
  <a href="/frameworks/04-clawdcode-sdk/" class="card">
    <div class="card-icon">🏗️</div>
    <h3>ClawdCode SDK</h3>
    <p>企业级 - 生产环境最佳实践</p>
    <span class="card-tag">商业化</span>
  </a>
</div>

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
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--vp-c-brand);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: var(--vp-c-text-1);
}

.card p {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.card-tag {
  display: inline-block;
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
