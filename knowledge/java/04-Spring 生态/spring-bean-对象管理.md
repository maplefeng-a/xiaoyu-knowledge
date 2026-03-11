
# Spring Bean 对象管理

> Bean = Spring 容器管理的 Java 对象实例，Spring 负责创建、注入依赖、管理生命周期。

## 核心概念

### Bean 的本质

Bean 不是封装了 Java 类，而是 **Spring 帮你管理了 Java 对象的创建和依赖**。

```
@Component (注解)
     │
     ▼ Spring 扫描
   [类] ──────► [Bean] (容器中的实例)
```

### Spring 管理了什么？

| 方面 | 自己管理 | Spring 管理 |
|------|---------|-------------|
| 创建 | `new Object()` | 自动创建 |
| 依赖 | 手动传入 | 自动注入 |
| 生命周期 | 手动销毁 | 自动管理 |
| 单例/多例 | 手动控制 | 配置决定 |

## 判断标准

```
需要成为 Bean 吗？
       │
       ▼
┌─────────────────┐
│ 有依赖需要注入？ │──是──► 是 Bean
└────────┬────────┘
         │否
         ▼
┌─────────────────┐
│ 需要单例共享？   │──是──► 是 Bean
└────────┬────────┘
         │否
         ▼
┌─────────────────┐
│ 需要生命周期管理？│──是──► 是 Bean
└────────┬────────┘
         │否
         ▼
      不需要 Bean
      直接 new
```

## 哪些成为 Bean

| 要 Bean | 不要 Bean |
|---------|----------|
| Controller/Service/Repository | 纯 POJO 数据类 |
| 需要注入其他对象 | 只被别人注入 |
| 需要 Spring 管理生命周期 | 用完即弃 |

## assistant-eval 示例

### Bean（Spring 管理）

```
EvalController
EvalRunnerService
CaseLoaderService
AgentClientService
RuleScorerService
CapabilityScorerService
ReportService
EvalProperties
ObjectMapper (yamlMapper)
WebClient.Builder
```

### 非 Bean（自己管理）

```
EvalCase          # 纯数据模型
EvalRunResult     # 纯数据模型
EvalInput         # 纯数据模型
EvalExpected      # 纯数据模型
ToolCallRecord    # 纯数据模型
```

## 作用域

| 作用域 | 说明 | 使用场景 |
|--------|------|---------|
| singleton | 单例（默认） | 无状态服务 |
| prototype | 每次获取新建 | 有状态对象 |
| request | 每个 HTTP 请求一个 | Web 应用 |
| session | 每个会话一个 | 用户会话 |

## 简单记忆

> **@Component 是门票，Bean 是入场后得到的身份。**

- 有依赖、需共享、有生命周期 → Bean
- 纯数据 → 不用 Bean，直接 new

## 关联

- [[java-spring-annotation-system|Spring 注解体系]]
- [[java-spring-family-overview|Spring 全家桶概览]]
- IoC 容器
- 依赖注入
- Bean 生命周期
