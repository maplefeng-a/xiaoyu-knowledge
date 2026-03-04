---
id: java-stream-api
type: concept
title: Java Stream API
status: active
aliases: []
tags:
  - java
  - stream
  - 集合处理
refs: []
---

# Java Stream API

> Stream = **数据流**，可以链式处理集合数据。本质是**for 循环的另一种写法**。

---

## 核心概念

### Stream 是什么？

**简单说**：Stream 是**集合循环处理的简洁写法**。

**类比**：工厂流水线

```
原材料 → [过滤] → [加工] → [包装] → 成品
   │        │         │         │       │
   │        ▼         ▼         ▼       ▼
 List   filter     map     collect   List
```

### 基本流程

```java
List<String> names = List.of("Tom", "Jerry", "Bob");

// 1. 创建 Stream
Stream<String> stream = names.stream();

// 2. 链式处理
List<String> upper = names.stream()        // 创建流
    .map(s -> s.toUpperCase())            // 转大写
    .collect(Collectors.toList());        // 收集到 List

// 结果：["TOM", "JERRY", "BOB"]
```

---

## 操作分类

```
Stream 操作
├── 中间操作（返回 Stream，可链式）
│   ├── filter(Predicate)     - 过滤
│   ├── map(Function)         - 转换
│   ├── flatMap(Function)     - 扁平化
│   ├── sorted()              - 排序
│   ├── distinct()            - 去重
│   ├── limit(n)              - 限制数量
│   └── skip(n)               - 跳过
│
└── 终端操作（返回结果，结束 Stream）
    ├── collect(Collector)    - 收集
    ├── forEach(Consumer)     - 遍历
    ├── count()               - 计数
    ├── anyMatch(Predicate)   - 任意匹配
    ├── allMatch(Predicate)   - 全部匹配
    ├── reduce()              - 归约
    └── findFirst()           - 查找第一个
```

---

## 常用操作详解

### 1. filter - 过滤

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 找出所有偶数
List<Integer> even = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
// [2, 4, 6, 8, 10]

// 项目中的例子
runs.stream()
    .filter(EvalRunResult::isPassed)  // 只保留通过的
    .count();
```

### 2. map - 转换

```java
// 平方
List<Integer> squares = numbers.stream()
    .map(n -> n * n)
    .collect(Collectors.toList());
// [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

// 转大写
List<String> names = List.of("Tom", "Jerry", "Bob");
List<String> upper = names.stream()
    .map(String::toUpperCase)  // 方法引用
    .collect(Collectors.toList());
// ["TOM", "JERRY", "BOB"]
```

### 3. forEach - 遍历

```java
// 打印所有元素
numbers.stream()
    .forEach(n -> System.out.println(n));

// 方法引用
names.stream()
    .forEach(System.out::println);
```

### 4. sorted - 排序

```java
// 自然排序
names.stream()
    .sorted()
    .forEach(System.out::println);  // Alice, Bob, Jerry, Tom

// 自定义排序
expectations.stream()
    .sorted((a, b) -> Integer.compare(a.getCallOrder(), b.getCallOrder()))
    .collect(Collectors.toList());
```

### 5. count - 计数

```java
long count = names.stream()
    .filter(s -> s.startsWith("T"))
    .count();
```

### 6. anyMatch / allMatch - 匹配

```java
// 是否有任意一个以"A"开头
boolean hasA = names.stream()
    .anyMatch(s -> s.startsWith("A"));  // true

// 是否全部以"A"开头
boolean allStartA = names.stream()
    .allMatch(s -> s.startsWith("A"));  // false
```

### 7. reduce - 归约

```java
// 求和
int sum = numbers.stream()
    .reduce(0, Integer::sum);

// 拼接字符串
String allNames = names.stream()
    .reduce("", (a, b) -> a + ", " + b);

// 更简洁的 join
String joined = names.stream()
    .collect(Collectors.joining(", "));
// "Tom, Jerry, Bob, Alice"
```

### 8. flatMap - 扁平化

```java
List<List<Integer>> nested = List.of(
    List.of(1, 2),
    List.of(3, 4),
    List.of(5, 6)
);

// flatMap - 扁平化
List<Integer> flatResult = nested.stream()
    .flatMap(List::stream)
    .collect(Collectors.toList());
// [1, 2, 3, 4, 5, 6]
```

### 9. mapToDouble + average - 统计

```java
// 求平均值
double avg = runs.stream()
    .mapToDouble(EvalRunResult::getFinalScore)
    .average()
    .orElse(0.0);  // 如果为空，返回 0.0
```

---

## 项目中的实际案例

### assistant-eval 项目

```java
// 1. anyMatch - 判断是否有写操作
boolean hasWriteTool = toolCalls.stream()
    .anyMatch(tc -> isWriteTool(tc.getToolName()));

// 2. filter + count - 统计通过的数量
result.setPassedCases((int) runs.stream()
    .filter(EvalRunResult::isPassed)
    .count());

// 3. filter + sorted + collect - 过滤排序
List<EvalToolExpectation> orderedExpectations = expectations.stream()
    .filter(e -> e != null && e.getName() != null && e.getCallOrder() != null)
    .sorted((a, b) -> Integer.compare(a.getCallOrder(), b.getCallOrder()))
    .collect(Collectors.toList());

// 4. mapToDouble + average - 求平均分
result.setAverageFinalScore(runs.isEmpty() ? 0.0 : 
    runs.stream()
        .mapToDouble(EvalRunResult::getFinalScore)
        .average()
        .orElse(0.0));

// 5. 链式操作完整示例
runs.stream()
    .filter(EvalRunResult::isPassed)      // 过滤通过的
    .map(EvalRunResult::getFinalScore)    // 提取分数
    .filter(score -> score > 0.8)         // 再过滤高分
    .count();                             // 计数
```

---

## Stream vs WebFlux

**重要！** Stream 和 WebFlux 的 Mono/Flux 很像，但有区别：

| 特性 | Stream | WebFlux (Flux/Mono) |
|------|--------|---------------------|
| 数据源 | 集合 | 异步数据流 |
| 执行时机 | 立即执行 | 订阅后执行 |
| 线程 | 当前线程 | 异步线程池 |
| 用途 | 集合处理 | 响应式编程 |

```java
// Stream - 同步
List<Integer> result = numbers.stream()
    .map(x -> x * 2)
    .collect(Collectors.toList());

// WebFlux - 异步
Mono<List<Integer>> result = Flux.fromIterable(numbers)
    .map(x -> x * 2)
    .collectList();
```

---

## 对比总结

### 传统 for 循环 vs Stream

| 操作 | 传统写法 | Stream 写法 |
|------|---------|------------|
| 过滤 | `if (条件) { ... }` | `.filter(x -> 条件)` |
| 转换 | `list.add(transform(x))` | `.map(x -> transform(x))` |
| 计数 | `count++` | `.count()` |
| 求和 | `sum += x` | `.reduce(0, Integer::sum)` |
| 收集 | `result.add(x)` | `.collect(toList())` |

---

## 最佳实践

### ✅ 推荐

```java
// 简单操作
list.stream().filter(s -> s != null).count()

// 方法引用
list.stream().map(Person::getName).collect(toList())

// 链式不超过 3 步
list.stream()
    .filter(x -> x > 0)
    .map(x -> x * 2)
    .collect(toList())
```

### ❌ 不推荐

```java
// 链式太长
list.stream()
    .filter(...)
    .map(...)
    .flatMap(...)
    .filter(...)
    .map(...)
    .collect(...)

// 复杂逻辑
list.stream()
    .filter(x -> {
        // 十几行逻辑...
    })
```

---

## 常用 Collectors

```java
// 收集到 List
list.stream().collect(Collectors.toList())

// 收集到 Set（去重）
list.stream().collect(Collectors.toSet())

// 收集到 Map
map.stream().collect(Collectors.toMap(
    Entry::getKey, 
    Entry::getValue
))

// 拼接字符串
list.stream().collect(Collectors.joining(", "))

// 分组
list.stream().collect(Collectors.groupingBy(Person::getAge))

// 分区
list.stream().collect(Collectors.partitioningBy(Person::isAdult))
```

---

## 关联

- [[java-lambda-expression|Lambda 表达式]]
- [[java-generics|泛型]]
- [[java-spring-webflux-reactive|WebFlux 响应式编程]]
- [[java-optional|Optional]]
