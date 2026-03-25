# ⚡ OpenClaw

> 新趋势智能体框架 - 端侧运行、多渠道集成、插件生态

## 🎯 特点

- **端侧智能** - 本地运行，隐私优先
- **多渠道集成** - Matrix、Telegram、Discord 等
- **插件生态** - Skills 扩展机制
- **企业级** - 生产环境就绪

---

## 📂 内容导航

<div class="card-grid">
  <a href="/frameworks/03-openclaw/知识地图" class="card">
    <div class="card-icon">🗺️</div>
    <h3>知识地图</h3>
    <p>OpenClaw 完整知识体系与学习路径</p>
  </a>
  
  <a href="/frameworks/03-openclaw/02-核心抽象层/嵌入式运行器" class="card">
    <div class="card-icon">⚙️</div>
    <h3>嵌入式运行器</h3>
    <p>Agent 运行时核心机制</p>
  </a>
</div>

---

## 🏗️ 架构分层

1. **基础设施层** - 配置、日志、存储
2. **核心抽象层** - Agent、Tool、Memory
3. **Agent 能力层** - 规划、执行、协作
4. **渠道集成层** - 多渠道适配
5. **插件生态层** - Skills 扩展
6. **网关服务层** - Gateway API
7. **系统集成层** - 部署运维
8. **用户交互层** - UI/UX

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
</style>
