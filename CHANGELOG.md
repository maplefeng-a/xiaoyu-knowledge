# 知识库更新日志

## 2026-03-14

### 新增知识卡片

**Tool Search - AI Agent 工具动态发现机制**
- 位置：`concept/summary/tool-search.md`
- 内容：Anthropic 2025年11月发布的 beta 功能
- 核心概念：
  - 上下文膨胀问题
  - 工具选择准确率下降
  - 延迟加载机制
  - Regex vs BM25 两种搜索模式
  - 自定义实现方案
  - OpenClaw 支持情况

**更新统计：**
- 新增卡片：1 张
- 总卡片数：130 → 131

### 知识库完整迁移

**迁移统计：**

| 目录 | 卡片数 | 状态 |
|------|--------|------|
| java | 17 | ✅ |
| harness | 10 | ✅ |
| assistant | 26 | ✅ |
| concept | 4 | ✅ |
| plan | 5 | ✅ |
| note | 1 | ✅ |
| frameworks | 64 | ✅ |
| review | 1 | ✅ |
| 根目录 | 2 | ✅ |
| **总计** | **130** | ✅ |

**目录结构升级：**
```
knowledge/
├── java/
│   ├── 01-核心基础/{raw,summary}/
│   ├── 02-并发编程/{raw,summary}/
│   ├── 03-JVM深入/{raw,summary}/
│   ├── 04-Spring生态/{raw,summary}/
│   └── 05-工程实践/{raw,summary}/
├── harness/{raw,summary}/
├── assistant/{raw,summary}/
│   ├── agent/
│   ├── skill/
│   ├── eval/benchmark/
│   ├── mcp/{message,knowledge,task}/
│   ├── desktop/
│   └── web/
├── concept/{raw,summary}/
│   └── protocol/
├── plan/{raw,summary}/
│   ├── weekly/
│   └── agent-application/
├── note/{raw,summary}/
├── frameworks/{raw,summary}/
│   ├── 01-langchain-ecosystem/
│   ├── 02-agentscope-ecosystem/
│   ├── 03-openclaw/
│   └── 04-clawdcode-sdk/
├── review/{raw,summary}/
└── summary/  (根目录卡片)
```

### 技能升级 (knowledge-learning-loop v2.1)

**P0 优化：**
- ✅ raw/summary 双层存储
- ✅ 知识索引机制
- ✅ 主动召回机制

**P1 优化：**
- ✅ 主动触发关键词表（6 大类）
- ✅ 意图分类（6 种：事实/方法/原理/对比/实践/学习）
- ✅ 检索路由规则

**借鉴来源：**
- Knowledge Brain：raw/summary 双层存储
- Knowledge Graph：主动召回机制
- Knowledge Router：意图分类路由

---

## 2026-02-25

### 初始化
- 创建 Java 知识树结构
- 构建知识卡片
