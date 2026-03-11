
# Java Lambda 表达式

> Lambda 是**匿名函数**，可以像数据一样传递。本质是**集合循环处理的简洁写法**。

---

## 核心概念

### 什么是 Lambda？

**简单说**：Lambda 是**简写**，不用定义方法名。

```java
// 传统写法 - 定义一个方法
public int add(int a, int b) {
    return a + b;
}

// Lambda 写法 - 不需要方法名
(a, b) -> a + b
```

### Lambda 语法拆解

```
(a, b) -> a + b
 │   │    │
 │   │    └── 方法体（返回值）
 │   └────── 箭头（固定写法）
 └────────── 参数列表
```

---

## 函数式接口

Lambda 必须依附于**函数式接口**（只有一个抽象方法的接口）。

### 常用函数式接口

| 接口 | 方法 | 用途 | 示例 |
|------|------|------|------|
| `Supplier<T>` | `T get()` | 无参有返回 | `() -> Math.random()` |
| `Consumer<T>` | `void accept(T)` | 有参无返回 | `s -> System.out.println(s)` |
| `Function<T,R>` | `R apply(T)` | 有参有返回 | `s -> s.length()` |
| `Predicate<T>` | `boolean test(T)` | 判断 | `s -> s.isEmpty()` |

---

## 语法简化

```java
// 1. 参数类型可以省略（编译器推断）
Function<String, Integer> f1 = (String s) -> s.length();
Function<String, Integer> f2 = (s) -> s.length();
Function<String, Integer> f3 = s -> s.length();  // 最简洁！

// 2. 单个参数可以省略括号
(s) -> s.length()
s -> s.length()  // ✅ 更简洁

// 3. 代码块只有一句可以省略花括号和 return
(s) -> { return s.length(); }
s -> s.length()  // ✅ 更简洁
```

---

## 方法引用（更简洁的 Lambda）

如果 Lambda 只是调用一个已有方法，可以用方法引用简化。

```java
// Lambda
Function<String, Integer> f1 = s -> s.length();

// 方法引用（等价，更简洁）
Function<String, Integer> f2 = String::length;

// Lambda
Consumer<String> c1 = s -> System.out.println(s);

// 方法引用（等价，更简洁）
Consumer<String> c2 = System.out::println;
```

### 方法引用格式

| 类型 | 语法 | 示例 |
|------|------|------|
| 静态方法 | `类::方法` | `Math::random` |
| 实例方法 | `对象::方法` | `list::add` |
| 类实例方法 | `类::方法` | `String::length` |
| 构造器 | `类::new` | `ArrayList::new` |

---

## 项目中的实际案例

### assistant-eval 项目

```java
// 1. anyMatch - 是否有任意一个元素符合条件
boolean hasWriteTool = toolCalls.stream()
    .anyMatch(tc -> isWriteTool(tc.getToolName()));

// 2. 方法引用 - filter
result.setPassedCases((int) runs.stream()
    .filter(EvalRunResult::isPassed)  // 等价于 run -> run.isPassed()
    .count());

// 3. 链式操作 - filter + sorted + collect
List<EvalToolExpectation> orderedExpectations = expectations.stream()
    .filter(e -> e != null && e.getName() != null && e.getCallOrder() != null)
    .sorted((a, b) -> Integer.compare(a.getCallOrder(), b.getCallOrder()))
    .collect(Collectors.toList());

// 4. mapToDouble + average
result.setAverageFinalScore(runs.isEmpty() ? 0.0 : 
    runs.stream()
        .mapToDouble(EvalRunResult::getFinalScore)
        .average()
        .orElse(0.0));
```

---

## Lambda vs 传统 for 循环

### 传统 for 循环

```java
// 1. 过滤 + 收集
List<String> result = new ArrayList<>();
for (String name : names) {
    if (name.length() > 3) {
        result.add(name.toUpperCase());
    }
}

// 2. 计数
int count = 0;
for (String name : names) {
    if (name.startsWith("T")) {
        count++;
    }
}
```

### Stream + Lambda

```java
// 1. 过滤 + 收集
List<String> result = names.stream()
    .filter(n -> n.length() > 3)
    .map(n -> n.toUpperCase())
    .collect(Collectors.toList());

// 2. 计数
long count = names.stream()
    .filter(n -> n.startsWith("T"))
    .count();
```

---

## 优缺点对比

| 维度 | 传统 for 循环 | Stream + Lambda |
|------|------------|----------------|
| **可读性** | ✅ 直观，容易懂 | ❌ 需要"翻译" |
| **简洁性** | ❌ 代码多 | ✅ 代码少 |
| **调试** | ✅ 容易打断点 | ❌ 链式不好调试 |
| **性能** | ✅ 略好 | ⚠️ 略差（可忽略） |
| **并行** | ❌ 需要手动 | ✅ `.parallelStream()` |

---

## 最佳实践

### ✅ 推荐用 Lambda

```java
// 简单操作，一目了然
list.stream().filter(s -> s != null).count()

// 方法引用，清晰简洁
list.stream().map(Person::getName).collect(toList())

// 链式不超过 3 步
list.stream()
    .filter(x -> x > 0)
    .map(x -> x * 2)
    .collect(toList())
```

### ❌ 不推荐用 Lambda

```java
// 链式太长（超过 5 步）
list.stream()
    .filter(...)
    .map(...)
    .flatMap(...)
    .filter(...)
    .map(...)
    .collect(...)

// Lambda 逻辑复杂
list.stream()
    .filter(x -> {
        // 十几行逻辑...
        if (...) {...}
        for (...) {...}
        return ...;
    })
```

---

## Python 对比

```python
# Python 的 lambda
add = lambda x, y: x + y
result = add(3, 5)  # 8

# 列表推导式
squares = [x**2 for x in numbers if x % 2 == 0]

# Java Lambda
BiFunction<Integer, Integer, Integer> add = (x, y) -> x + y;
int result = add.apply(3, 5);  # 8

// Stream
List<Integer> squares = numbers.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * n)
    .collect(Collectors.toList());
```

---

## 关键理解

> **Lambda 的本质**：集合循环处理的简洁写法
> 
> **不是银弹**：简单场景用 Lambda，复杂逻辑用传统 for 循环

---

## 关联

- [[java-stream-api|Stream API]]
- [[java-functional-interface|函数式接口]]
- [[java-generics|泛型]]
- [[java-spring-webflux-reactive|WebFlux 响应式编程]]
