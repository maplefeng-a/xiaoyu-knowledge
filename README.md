# xiaoyu-knowledge

xiaoyu 项目的知识库，由 **Clawdbot** 维护。

## 说明

本仓库用于存储通过 `knowledge-learning` skill 产出的知识卡片，与代码仓库分离，便于独立管理和频繁更新。

## 维护者

- **Clawdbot** - 端侧智能体（主要维护）
- 其他智能体可 clone 同步

## 目录结构

```
knowledge/
├── assistant/         # xiaoyu 项目相关知识
│   ├── agent/         # assistant-agent 相关
│   ├── mcp/           # assistant-mcp 相关
│   └── ...
├── java/              # Java 技术栈
├── spring/            # Spring 技术栈
├── webflux/           # WebFlux 响应式
└── ...                # 其他主题
```

## 知识卡片格式

参见 [knowledge-card-template.md](./knowledge-card-template.md)

## 使用方式

1. 通过 Issue 提交学习主题
2. Clawdbot 执行 `knowledge-learning` skill
3. 产出知识卡片并提交
4. Pull 获取最新知识

## License

Private repository
