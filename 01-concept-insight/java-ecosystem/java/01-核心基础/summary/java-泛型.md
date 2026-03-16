
# Java 泛型（Generics）

> 泛型 = **类型参数化**。就像方法的参数，但是是**类型**的参数。

---

## 核心概念

### 为什么需要泛型？

**没有泛型的时代（Java 5 之前）**

```java
// 问题：可以放任何类型，不安全！
List list = new ArrayList();
list.add("Tom");      // ✅ String
list.add(25);         // ✅ Integer（但你不想要！）
list.add(new Dog());  // ✅ Dog（混乱了！）

// 取出来要强制转换，还可能出错
String name = (String) list.get(0);  // ✅
String str = (String) list.get(1);   // ❌ ClassCastException！
```

**有泛型后（Java 5+）**

```java
// 指定类型：只能放 String
List<String> list = new ArrayList<>();
list.add("Tom");      // ✅
list.add(25);         // ❌ 编译错误！

// 取出来不需要强制转换
String name = list.get(0);  // ✅ 自动就是 String

// 编译时就检查，安全！
```

---

## 泛型的本质

```
List<String>
     │
     └── <String> 就是类型参数

读作："List of String"
意思：这个 List 只能装 String
```

---

## 常见泛型示例

### 集合泛型

```java
// List - 列表
List<String> names = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();

// Set - 集合
Set<String> uniqueNames = new HashSet<>();

// Map - 键值对（两个类型参数）
Map<String, Integer> ages = new HashMap<>();
//   │       │
//   │       └── Value 类型
//   └── Key 类型

Map<String, User> userMap = new HashMap<>();
```

### 自定义泛型类

```java
public class Box<T> {
    private T content;
    
    public void set(T content) {
        this.content = content;
    }
    
    public T get() {
        return content;
    }
}

// 使用
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String s = stringBox.get();

Box<Integer> intBox = new Box<>();
intBox.set(100);
Integer i = intBox.get();
```

---

## 项目中的实际案例

### 案例 1：ApiResponse<T> - 泛型 Record

**文件**：`ApiResponse.java`

```java
// 泛型 record 定义
public record ApiResponse<T>(
    String code,
    String message,
    T data,              // ← T 是占位符，使用时指定具体类型
    String requestId
) {
    
    // 泛型静态方法
    public static <T> ApiResponse<T> success(T data, String requestId) {
        return new ApiResponse<>(SUCCESS_CODE, SUCCESS_MESSAGE, data, requestId);
    }
    
    public static <T> ApiResponse<T> error(ErrorCode errorCode, String requestId) {
        return new ApiResponse<>(errorCode.getCode(), errorCode.getMessage(), null, requestId);
    }
}
```

**实际使用**：

```java
// 场景 1：返回字符串数据
ApiResponse<String> resp1 = ApiResponse.success("操作成功", "req-123");
// T = String

// 场景 2：返回对象数据
EvalRunResult result = ...;
ApiResponse<EvalRunResult> resp2 = ApiResponse.success(result, "req-456");
// T = EvalRunResult

// 场景 3：返回列表数据
List<String> names = List.of("Tom", "Jerry");
ApiResponse<List<String>> resp3 = ApiResponse.success(names, "req-789");
// T = List<String>
```

**为什么用泛型？**

```java
// ❌ 没有泛型：需要多个类
public record ApiResponseString { String data; }
public record ApiResponseEvalRunResult { EvalRunResult data; }
// 无穷无尽...

// ✅ 有泛型：一个类搞定所有类型
public record ApiResponse<T> { T data; }
```

---

### 案例 2：readYaml - 泛型方法

**文件**：`CaseLoaderService.java`

```java
// 泛型方法
private <T> T readYaml(Resource resource, Class<T> type) {
    try (InputStream inputStream = resource.getInputStream()) {
        return yamlMapper.readValue(inputStream, type);
    } catch (IOException e) {
        throw new IllegalStateException("Failed to read yaml", e);
    }
}

// 实际使用
public EvalSuite loadSuite(String suiteId) {
    return readYaml(resources[0], EvalSuite.class);
    // T = EvalSuite
}

public EvalCase loadCase(String caseId) {
    EvalCase evalCase = readYaml(resources[0], EvalCase.class);
    // T = EvalCase
    return evalCase;
}
```

**为什么用泛型方法？**

```java
// ❌ 没有泛型：需要多个方法
private EvalSuite readSuiteYaml(Resource resource) { ... }
private EvalCase readCaseYaml(Resource resource) { ... }

// ✅ 有泛型：一个方法搞定
private <T> T readYaml(Resource resource, Class<T> type) { ... }
```

---

### 案例 3：集合泛型

```java
// EvalCase.java
public class EvalCase {
    private List<String> evidenceToCollect;  // ← 泛型
    private List<String> failureTags;        // ← 泛型
}

// EvalSuiteRunnerService.java
List<EvalRunResult> runs = new ArrayList<>();  // ← 泛型
Map<String, Integer> stats = new LinkedHashMap<>();  // ← 两个类型参数
```

---

## 泛型的好处

| 好处 | 说明 | 例子 |
|------|------|------|
| **类型安全** | 编译时检查类型 | 不会把 Integer 当 String |
| **消除强转** | 不需要 `(String)` | 直接 `list.get(0)` |
| **代码复用** | 一套代码处理多种类型 | `Box<T>` 可以装任何类型 |

---

## 泛型的常见写法

### 单个类型参数

```java
List<T>        // T = Type
Collection<E>  // E = Element
Set<K>         // K = Key
```

### 多个类型参数

```java
Map<K, V>      // K = Key, V = Value
Pair<K, V>     // 键值对
```

### 有限制的泛型

```java
// T 必须是 Number 的子类
<T extends Number> List<T>

// 例子
List<Integer> nums1 = ...;  // ✅
List<Double> nums2 = ...;   // ✅
List<String> nums3 = ...;   // ❌ String 不是 Number 子类
```

---

## 泛型 vs 数组

```java
// 数组 - 协变（不安全）
String[] strings = new String[10];
Object[] objects = strings;  // ✅ 编译通过
objects[0] = new Dog();      // ❌ 运行时错误！

// 泛型 - 不变（安全）
List<String> strings = new ArrayList<>();
List<Object> objects = strings;  // ❌ 编译错误！
```

**为什么？** 泛型在编译时检查，数组在运行时检查。

---

## 通配符（了解即可）

```java
// ? - 未知类型
List<?> list;  // 可以是 List<String>, List<Integer> 等

// ? extends T - T 或其子类
List<? extends Number> nums;  // List<Integer>, List<Double> 等

// ? super T - T 或其父类
List<? super Integer> ints;  // List<Integer>, List<Number>, List<Object>
```

**口诀**：PECS（Producer Extends, Consumer Super）

> 大部分情况用不到，知道存在就行

---

## 总结表

| 概念 | 示例 | 说明 |
|------|------|------|
| 泛型类 | `class Box<T>` | T 是类型参数 |
| 泛型接口 | `interface List<E>` | E 是元素类型 |
| 泛型方法 | `<T> T get()` | 方法有自己的类型参数 |
| 类型参数 | `<T>`, `<K,V>` | 占位符，使用时指定 |
| 通配符 | `<?>`, `<? extends T>` | 表示未知或有限制的类型 |

---

## 小测验

**问题**：下面哪些代码编译通过？

```java
// 1. ✅ 正确
List<String> list1 = new ArrayList<>();
list1.add("Hello");
String s = list1.get(0);

// 2. ❌ 错误
List<Integer> list2 = new ArrayList<>();
list2.add("Hello");  // ❌ String 不能放进 List<Integer>

// 3. ✅ 正确
Map<String, Integer> map = new HashMap<>();
map.put("age", 25);
int age = map.get("age");

// 4. ❌ 错误
List<Object> list3 = new ArrayList<String>();  // ❌ 泛型不变，不能这样赋值
```

---

## 关键理解

> **泛型的本质**：类型参数化，编译时检查类型安全
> 
> **核心就 3 点**：
> 1. `<T>` 是类型参数，编译时检查
> 2. `List<String>` 只能装 String
> 3. 不需要强制转换

---

## 关联

- [[java-lambda-expression|Lambda 表达式]]
- [[java-stream-api|Stream API]]
- [[java-classes-and-objects|类与对象]]
- [[java-collections|集合框架]]
