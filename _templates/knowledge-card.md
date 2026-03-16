# Knowledge Card Template

知识卡片的标准结构模板。

---

## Frontmatter (YAML)

```yaml
---
id: category/subcategory/topic
title: 卡片标题
tags: [tag1, tag2, tag3]
status: draft | published | archived
createdAt: 2026-03-04
updatedAt: 2026-03-04
learningFrom: 学习来源（Issue # 或主题描述）
---
```

---

## 正文结构

```markdown
# 卡片标题

## 概述
<!-- 一句话说明这个知识点是什么，解决什么问题 -->

## 核心概念
<!-- 关键概念的定义和解释 -->

## 关键要点
<!-- 3-5 个最重要的要点 -->

### 要点 1
说明...

### 要点 2
说明...

## 实践应用
<!-- 如何在实际中使用这个知识 -->

## 常见问题
<!-- FAQ 或常见坑 -->

## 相关卡片
<!-- 链接到相关知识点 -->

## 参考资料
<!-- 外部链接、文档等 -->
```

---

## 命名规范

### ID 命名
- 使用小写字母和连字符
- 层级结构：`category/subcategory/topic`
- 示例：`java/spring/webflux-basics`

### 文件命名
- 与 ID 对应
- 示例：`knowledge/java/spring/webflux-basics.md`

### 标签规范
- 技术：`java`, `spring`, `webflux`
- 类型：`concept`, `practice`, `reference`
- 难度：`beginner`, `intermediate`, `advanced`

---

## 状态说明

| 状态 | 说明 |
|------|------|
| `draft` | 草稿，学习中 |
| `published` | 已完成，可使用 |
| `archived` | 已过时或不再维护 |
