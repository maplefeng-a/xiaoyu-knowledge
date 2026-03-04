---
id: java-static-keyword
type: concept
title: static 关键字
status: active
aliases: []
tags:
  - java
  - static
  - 关键字
refs: []
---

# static 关键字

> static = 静态，属于类而不是对象实例

---

## 核心概念

**static 的本质**：Java 是强面向对象语言，必须先定义 class，但工具方法/常量不需要每次创建对象，所以用 static。

**Python 对比**：Python 没有这个约束，可以直接定义模块函数。

```
【Python】                        【Java】
def add(a, b):                   public class MathUtils {
    return a + b                     public static int add(int a, int b) {
                                       return a + b;
                                   }
                                 }

# 直接调用                       // 通过类调用
add(1, 2)                        MathUtils.add(1, 2)
```

---

## 使用场景

### 场景 1：工具方法（最常见）

```java
// Math 工具类
public class MathUtils {
    
    // 不需要任何对象状态，直接计算
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static boolean isEven(int num) {
        return num % 2 == 0;
    }
}

// 使用
int sum = MathUtils.add(3, 5);  // ✅ 直接调用，不用 new
```

---

### 场景 2：常量定义

```java
public class Constants {
    public static final String APP_NAME = "MyApp";
    public static final int MAX_RETRY = 3;
    public static final double PI = 3.14159;
}

// 使用
String name = Constants.APP_NAME;  // ✅ 直接访问
```

---

### 场景 3：程序入口

```java
public class Main {
    public static void main(String[] args) {
        // 必须 static，因为 JVM 启动时还没有对象
    }
}
```

**为什么必须 static？**
- `main` 是程序入口，JVM 启动时还没有任何对象
- 必须通过类名直接调用，不需要 `new`

---

### 场景 4：静态内部类

```java
public class EvalProperties {
    
    private Agent agent = new Agent();
    
    // 静态内部类 - 不需要外部类实例
    public static class Agent {
        private String defaultUrl = "http://localhost:1107";
        
        public String getDefaultUrl() {
            return defaultUrl;
        }
    }
}
```

---

## 调用规则

```
┌─────────────────────────────────────────┐
│  static 方法可以调用：                  │
│  ✅ 其他 static 方法                     │
│  ✅ static 变量                          │
│  ❌ 非 static 方法（需要先 new 对象）    │
│  ❌ 非 static 变量（需要先 new 对象）    │
└─────────────────────────────────────────┘
```

**示例**：
```java
public class Test {
    private String name = "Tom";  // 实例变量
    
    public void sayHello() {       // 实例方法
        System.out.println("Hello!");
    }
    
    public static void main(String[] args) {
        // System.out.println(name);  // ❌ 错误！
        // sayHello();                // ❌ 错误！
        
        Test t = new Test();        // ✅ 先创建对象
        System.out.println(t.name); // ✅ 通过对象访问
        t.sayHello();               // ✅ 通过对象调用
    }
}
```

---

## 判断标准

**什么时候用 static？**

```
问自己：这个方法/变量需要依赖具体对象吗？
    │
    ├── 不需要 → 用 static ✅
    │   （如：工具方法、常量）
    │
    └── 需要 → 不用 static ✅
        （如：用户的 name、订单的金额）
```

---

## 实际项目示例

### assistant-agent 项目

```java
// ✅ main 方法 - 程序入口
public class AssistantEvalApplication {
    public static void main(String[] args) {
        SpringApplication.run(AssistantEvalApplication.class, args);
    }
}

// ✅ 静态内部类 - 独立配置
public class EvalProperties {
    public static class Agent {
        private String defaultUrl = "http://localhost:1107";
    }
}

// ❌ Controller 方法 - 需要依赖注入
@RestController
public class EvalController {
    private final EvalRunnerService evalRunnerService;
    
    // 不是 static，因为需要注入的服务
    public Mono<ApiResponse> runCase(...) {
        return evalRunnerService.runCase(...);
    }
}
```

---

## 常量命名规范

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 常量 | 全大写 + 下划线 | `DEFAULT_PAGE_SIZE` |
| 变量 | 小驼峰 | `pageSize` |
| 类名 | 大驼峰 | `EvalController` |

**标准写法**：
```java
private static final int DEFAULT_PAGE_SIZE = 20;
       │      │      │
       │      │      └── 值不可变
       │      └── 类级别，所有实例共享
       └── 本类可见
```

---

## 关联

- [[java-compilation-and-jvm|Java 编译原理]]
- [[java-classes-and-objects|类与对象]]
- [[java-spring-bean-management|Spring Bean 对象管理]]
