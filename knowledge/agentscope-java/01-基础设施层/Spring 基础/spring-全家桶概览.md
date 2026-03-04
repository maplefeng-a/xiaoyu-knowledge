# Spring 全家桶概览

> Spring 全家桶 = Spring 生态圈的各种框架和工具集合，覆盖 Web、数据、安全、云原生等场景。

## 核心框架

| 框架 | 作用 | 典型使用 |
|------|------|---------|
| Spring Framework | 核心 IoC/AOP | @Service, @Autowired |
| Spring Boot | 自动配置、快速开发 | @SpringBootApplication |

## Web 层

| 框架 | 作用 | 典型使用 |
|------|------|---------|
| Spring MVC | 传统 Web 开发 | @Controller, @GetMapping |
| Spring WebFlux | 响应式 Web | Mono, Flux, WebClient |

## 数据层

| 框架 | 作用 |
|------|------|
| Spring Data JPA | ORM 框架，JpaRepository |
| Spring Data MongoDB | NoSQL 支持 |
| Spring Data Redis | 缓存，RedisTemplate |

## 安全

| 框架 | 作用 |
|------|------|
| Spring Security | 认证授权、权限控制、JWT |

## 云原生

| 框架 | 作用 |
|------|------|
| Spring Cloud | 微服务全家桶 |
| Spring Cloud Gateway | API 网关 |
| Spring Cloud Netflix | Eureka、Ribbon、Hystrix |

## 其他常用

| 框架 | 作用 |
|------|------|
| Spring Test | 测试支持 |
| Spring Batch | 批处理 |
| Spring WebSocket | 实时通信 |

## 我的项目使用

```
assistant-agent / assistant-eval
├── Spring Boot 3.4/3.5      # 自动配置
├── Spring WebFlux            # 响应式 Web
├── Spring Test               # 单元测试
└── Spring Context            # IoC 容器
```

## 学习路线

```
基础
  ├── 1. Spring Framework (IoC/AOP)
  ├── 2. Spring Boot (自动配置)
  ├── 3. Spring MVC / WebFlux (Web 开发)
  └── 4. Spring Data (数据访问)

进阶
  ├── 5. Spring Security (安全)
  └── 6. Spring Cloud (微服务)
```

## 为什么好用

| 特点 | 说明 |
|------|------|
| 开箱即用 | starter 依赖，自动配置 |
| 生态完整 | 各场景都有解决方案 |
| 社区活跃 | 文档丰富，问题好搜 |
| 企业认可 | 大厂都在用 |

## 关联

- Spring 注解体系
- Spring Bean 对象管理
- Spring Boot 自动配置原理
