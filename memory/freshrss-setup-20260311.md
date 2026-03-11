# FreshRSS 配置记录

## 📅 配置日期
2026-03-11

## ✅ 配置状态
已完成基础配置

---

## 🔧 配置详情

### Docker 容器
- **容器名称**: freshrss
- **镜像**: freshrss/freshrss:latest
- **端口**: 28080 (外部) → 80 (内部)
- **数据卷**: freshrss_data → /var/www/FreshRSS/data

### 用户配置
- **用户名**: yhf
- **密码**: 19931107
- **语言**: 中文 (zh-cn)
- **认证方式**: 表单登录

### 订阅源
| # | 名称 | RSS 地址 | 状态 | 文章数 |
|---|------|---------|------|--------|
| 1 | OpenAI Blog | https://openai.com/news/rss.xml | ✅ 正常 | 大量 |
| 2 | LangChain Blog | https://blog.langchain.com/rss/ | ✅ 正常 | 大量 |
| 3 | Karpathy Blog | https://karpathy.github.io/feed.xml | ❌ 连接失败 | 0 |

### 自动刷新
- **方式**: crontab
- **频率**: 每小时整点
- **命令**: `docker exec freshrss php /var/www/FreshRSS/cli/actualize-user.php --user yhf`
- **日志**: /tmp/freshrss-refresh.log

---

## 🌐 访问地址

### Web 界面
```
http://localhost:28080
```

### 登录信息
- **用户名**: yhf
- **密码**: 19931107

---

## ⚠️ 已知问题

### 1. Karpathy 博客无法访问
- **问题**: Connection reset by peer
- **可能原因**:
  - 网络限制
  - 网站防护机制
  - GitHub Pages 访问限制
- **解决方案**:
  - 尝试通过代理访问
  - 或手动定期访问博客

### 2. GitHub 相关资源加载缓慢
- **问题**: 部分资源（如 FreshRSS releases）加载超时
- **影响**: 不影响主要功能
- **解决方案**: 忽略即可

---

## 📋 后续待办

- [ ] 添加时事类 RSS 源（30%）
- [ ] 添加技术类 RSS 源（20%）
- [ ] 配置 Anthropic 博客（可能需要 RSSHub）
- [ ] 配置 DeepMind 博客（可能需要 RSSHub）
- [ ] 设置每日早报生成任务

---

## 📊 订阅分布目标

- 🤖 AI：50%（当前 2/3 个源正常）
- 🌍 时事：30%（待添加）
- 💻 技术：20%（待添加）

---

_最后更新：2026-03-11 11:06_
