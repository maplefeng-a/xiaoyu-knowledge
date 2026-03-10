# ☕ Java 学习

> 核心基础、Spring 生态、工程实践

## 📚 学习路径

<div class="card-grid">
  <a href="/java/01-核心基础/" class="card">
    <div class="card-icon">📗</div>
    <h3>核心基础</h3>
    <p>类与对象、泛型、Stream API、Lambda 表达式</p>
  </a>
  
  <a href="/java/04-Spring 生态/" class="card">
    <div class="card-icon">🌿</div>
    <h3>Spring 生态</h3>
    <p>Spring 全家桶、WebFlux 响应式编程</p>
  </a>
  
  <a href="/java/05-工程实践/" class="card">
    <div class="card-icon">🛠️</div>
    <h3>工程实践</h3>
    <p>实战技巧、踩坑记录</p>
  </a>
</div>

---

## 🎯 学习目标

为 AgentScope-Java 开发打下坚实的 Java 基础，重点掌握：

- 泛型与类型系统
- 函数式编程（Lambda、Stream）
- 响应式编程（WebFlux、Reactor）
- Spring Boot 核心原理

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
