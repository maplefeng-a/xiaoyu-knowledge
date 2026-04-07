# xiaoyu-knowledge 智能体维护规范

> 本文档定义 xiaoyu-knowledge 知识库的架构、工作流和维护规范。
> xiaoyu-knowledge 智能体（Agent ID: kYWnuT）负责维护此知识库。

---

## 📚 仓库职责

**xiaoyu-knowledge** 是 CoPaw 团队的**编译后知识库**，存储结构化、可检索的知识卡片。

- **GitHub**: https://github.com/maplefeng-a/xiaoyu-knowledge
- **本地路径**: `/Users/yuhuafeng/Documents/learning/xiaoyu-knowledge`
- **维护者**: xiaoyu-knowledge 智能体 (kYWnuT)
- **任务接收**: GitHub Issue

---

## 🏗️ 知识架构

### 双仓库协作模型

```
┌─────────────────────────────────────────────────────────────────┐
│                        知识生产流水线                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  源文档层 (raw)              知识卡片层 (wiki)                   │
│  xiaoyu-workspace/           xiaoyu-knowledge/                   │
│  documents/                                                          │
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────────────────┐    │
│  │ agentscope-java/ │      │ ai/                          │    │
│  │   调研报告       │ ──→  │   agent/                     │    │
│  │   技术分析       │ 编译 │   harness/                   │    │
│  │                  │      │   protocol/                  │    │
│  │ multi-agent/     │      │ engineering/                 │    │
│  │   设计方案       │ ──→  │   java/                      │    │
│  │   架构对比       │      │ projects/                    │    │
│  │                  │      │   xiaoyu/                    │    │
│  │ hiclaw/          │      │ daily-briefing/              │    │
│  │ copaw/           │      │                              │    │
│  │ claude-code/     │      │ 知识索引.md                   │    │
│  └──────────────────┘      │ log.md                        │    │
│                            └──────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 目录结构

```
xiaoyu-knowledge/
├── ai/                          # AI 领域知识
│   ├── infra/                   # 基础设施（算力、存储、MLOps）
│   ├── model/                   # 模型（训练、微调、推理）
│   └── agent/                   # 智能体
│       ├── frameworks/          # 框架研究
│       ├── protocol/            # 协议（MCP, A2A, AGUI）
│       └── harness/             # Harness 架构
├── engineering/                 # 工程技术
│   └── java/                    # Java 生态
├── projects/                    # 项目研发
│   └── xiaoyu/                  # xiaoyu 项目文档
│       ├── agent/
│       ├── mcp/
│       ├── eval/
│       ├── skill/
│       ├── desktop/
│       └── web/
├── daily-briefing/              # 每日早报
├── _meta/                       # 元数据
├── _templates/                  # 模板
├── .obsidian/                   # Obsidian 配置
├── 知识索引.md                   # 全局知识索引
├── log.md                       # 维护日志
└── AGENTS.md                    # 本文档
```

---

## ⚙️ 核心工作流

### 1. Ingest（知识摄入）

**触发条件**:
- 新的 GitHub Issue 创建
- 用户在 xiaoyu-workspace/documents/ 添加新文档

**流程**:
```
1. 检测新文档 → xiaoyu-workspace/documents/{topic}/{doc}.md
2. 创建 GitHub Issue（如不存在）
3. 读取源文档，提取核心知识
4. 创建/更新知识卡片 → xiaoyu-knowledge/{domain}/{card}.md
5. 更新 知识索引.md
6. 记录日志 → log.md
7. 关闭 Issue
```

**示例**:
```bash
# 源文档
xiaoyu-workspace/documents/multi-agent/CoPaw 多智能体集成方案.md

# 编译后
xiaoyu-knowledge/projects/xiaoyu/agent/copaw-integration.md
```

### 2. Query（知识查询）

**触发条件**:
- 用户或智能体提问
- 需要检索相关知识

**流程**:
```
1. 解析问题，提取关键词
2. 搜索 知识索引.md 定位相关卡片
3. 读取相关卡片内容
4. 综合回答，引用来源
5. （可选）优质答案可存为新卡片
```

**主动触发关键词**:
| 类别 | 触发词 |
|------|--------|
| Java 核心 | Lambda, Stream, 泛型，接口，抽象类，继承，多态，static |
| Spring | Bean, IOC, AOP, 注解，WebFlux, 响应式，Starter |
| 并发 | 线程，线程池，锁，synchronized, ExecutorService |
| JVM | 内存模型，GC, 堆，栈，类加载 |
| Agent | Harness, MCP, Tool, Memory, Sandbox, A2A, AGUI, Tool Search |

### 3. Lint（健康检查）

**触发条件**:
- 每周定期执行
- 知识卡片数量变化超过阈值

**检查项**:
```
1. 孤立页面检测（无双向链接）
2. 矛盾检测（同一概念不同描述）
3. 缺失检测（索引提到但文件不存在）
4. 过期检测（超过 90 天未更新）
5. 格式检测（frontmatter 完整性）
```

**输出**:
- GitHub Issue 列出待修复问题
- 自动修复建议

---

## 📝 知识卡片规范

### Frontmatter 格式

```yaml
---
id: card-unique-id
title: 卡片标题
tags: [tag1, tag2, tag3]
created: 2026-01-01
updated: 2026-01-01
source: xiaoyu-workspace/documents/{topic}/{doc}.md  # 可选
status: active | draft | archived
---
```

### 正文结构

```markdown
# 卡片标题

> 一句话说明：这个知识点是什么，解决什么问题。

---

## 核心概念

正文内容...

## 相关卡片

- [[相关主题 1]]
- [[相关主题 2]]

## 参考资料

- [源文档](../xiaoyu-workspace/documents/...)
- [外部链接](url)
```

### 链接规范

- **内部链接**: `[[卡片 ID]]` 或 `[[卡片 ID|显示文本]]`
- **相对链接**: `./subdir/file.md`
- **源文档链接**: `../xiaoyu-workspace/documents/topic/doc.md`

---

## 📋 维护日志

**位置**: `log.md`

**格式**:
```markdown
# 知识库维护日志

## YYYY-MM-DD
- [INGEST] 源文档名称 → 目标卡片路径
- [UPDATE] 更新卡片名称
- [DELETE] 删除卡片名称
- [LINT] 健康检查报告

## YYYY-MM-DD
...
```

**示例**:
```markdown
# 知识库维护日志

## 2026-04-07
- [INGEST] CoPaw 多智能体集成方案 → projects/xiaoyu/agent/copaw-integration.md
- [UPDATE] 更新知识索引.md

## 2026-04-06
- [LINT] 周检查：发现 3 个孤立页面，已创建 Issue #15
```

---

## 🤖 智能体协作

### 与 xiaoyu-copaw 的关系

| 智能体 | 职责 | 协作方式 |
|--------|------|----------|
| xiaoyu-copaw | CoPaw 团队管理员 | 分配任务、同步进展 |
| xiaoyu-knowledge | 知识库维护 | 接收 Issue、维护卡片 |

### 任务分配流程

```
xiaoyu-copaw              xiaoyu-knowledge
    │                          │
    │  1. 创建 GitHub Issue     │
    ├─────────────────────────→│
    │                          │
    │  2. 读取源文档            │
    │  3. 编译知识卡片          │
    │  4. 更新索引和日志        │
    │                          │
    │  5. 关闭 Issue + 评论     │
    ←──────────────────────────┤
    │                          │
    │  6. leaders-room 同步     │
    │                          │
```

### 与 xiaoyu-skills 的协作

- **知识卡片** → 技能开发需求 → xiaoyu-skills
- **技能文档** → 知识卡片 ← xiaoyu-skills

---

## 📊 知识统计

### 当前状态

| 领域 | 卡片数 | 最近更新 |
|------|--------|----------|
| Java | 17 | 2026-02-25 |
| Harness | 10 | 2026-03-14 |
| Assistant | 27 | 2026-04-07 |
| Frameworks | 64 | 2026-03-14 |
| Concept | 5 | 2026-03-14 |
| **总计** | **132** | - |

### 待补充主题

详见 `知识索引.md` 的"待补充主题"章节。

---

## 🔗 相关资源

- **源文档仓库**: https://github.com/maplefeng-a/xiaoyu-workspace
- **技能仓库**: https://github.com/maplefeng-a/xiaoyu-skills
- **主项目**: https://github.com/maplefeng-a/xiaoyu
- **Obsidian**: 使用 `.obsidian/` 配置进行本地浏览

---

_最后更新：2026-04-07_
_维护者：xiaoyu-knowledge (kYWnuT)_
_最新卡片：CoPaw 多智能体集成方案 (Issue #3)_
