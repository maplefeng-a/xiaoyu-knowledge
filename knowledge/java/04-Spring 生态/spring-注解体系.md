
# Spring 注解体系

> Spring 通过注解实现 POJO 的声明式配置，@Component 是基础注解，@Service/@Repository/@Controller 是其语义化派生。

## 核心概念

### @Component 注解继承关系

```
@Component (基础注解)
    │
    ├── @Repository  (数据层，自动异常转换)
    │
    ├── @Service     (业务层，纯语义化)
    │
    └── @Controller  (表现层)
            │
            └── @RestController (= @Controller + @ResponseBody)
```

### @Component vs @Bean

| 特性 | @Component | @Bean |
|------|------------|-------|
| 作用位置 | 类上 | 方法上 |
| 注册方式 | 自动扫描 | 手动配置 |
| 适用场景 | 自己写的类 | 第三方库的类 |

### @Component 与 Bean 的关系

```
@Component (注解)
     │
     ▼ Spring 扫描
   [类] ──────► [Bean] (容器中的实例)
```

**@Component 是门票，Bean 是入场后得到的身份。**

## POJO

POJO = Plain Old Java Object，不依赖任何框架的普通 Java 类。

Spring 的核心理念：**让 POJO 变得强大**，通过注解赋予能力，而不是强制继承。

```java
// 这个类本身是 POJO，通过注解获得 Spring 能力
@Service
public class RuleScorerService {
    public RuleScoreResult score(EvalCase evalCase, String answer) {
        // 纯业务逻辑
    }
}
```

## 选择原则

| 场景 | 选择 |
|------|------|
| 自己写的业务类 | @Service / @Repository |
| Controller 层 | @RestController |
| 第三方库的类 | @Bean |
| 需要复杂初始化 | @Bean |

## Examples（我做过的）

- [assistant-eval] 使用 @Service 标记业务服务类
- [assistant-eval] 使用 @RestController 标记 API 控制器
- [assistant-eval] 使用 @Configuration + @Bean 注册 WebClient.Builder

## 关键源码

```java
// @Service 源码 - 继承 @Component
@Component
public @interface Service {
    String value() default "";
}
```

## 关联

- [[java-spring-bean-management|Spring Bean 对象管理]]
- [[java-spring-family-overview|Spring 全家桶概览]]
- Spring IoC 容器
- 依赖注入
- AOP
