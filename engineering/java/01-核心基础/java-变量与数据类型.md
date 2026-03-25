
# 变量与数据类型

> Java 是**静态类型**语言，Python 是**动态类型**语言

---

## 核心区别：静态类型 vs 动态类型

### Python（动态类型）
```python
# 不需要声明类型，运行时推断
x = 10          # x 是 int
x = "hello"     # x 变成 str（可以随便改！）
x = [1, 2, 3]   # x 又变成 list
```

### Java（静态类型）
```java
// 必须声明类型，编译时检查
int x = 10;         // x 只能是 int
// x = "hello";     // ❌ 编译错误！类型不匹配
String y = "hello"; // y 只能是 String
```

---

## 8 种基本数据类型

Java 有 **8 种基本类型**（Primitive Types），Python 没有这个概念！

| 类型 | 大小 | 范围 | Python 对应 | 示例 |
|------|------|------|------------|------|
| `byte` | 1 字节 | -128 ~ 127 | int | `byte b = 100;` |
| `short` | 2 字节 | -32768 ~ 32767 | int | `short s = 1000;` |
| `int` | 4 字节 | ±21 亿 | int | `int i = 100000;` |
| `long` | 8 字节 | 超大整数 | int | `long l = 100000L;` |
| `float` | 4 字节 | 单精度浮点 | float | `float f = 3.14f;` |
| `double` | 8 字节 | 双精度浮点 | float | `double d = 3.14;` |
| `char` | 2 字节 | 单个字符 | str | `char c = 'A';` |
| `boolean` | - | true/false | bool | `boolean b = true;` |

---

## 详细对比

### 整数类型

```java
// Java - 需要指定具体类型
int age = 25;                    // 最常用
long population = 1400000000L;   // 大数要加 L
byte small = 10;                 // 小范围节省内存

// Python - 统一用 int
age = 25
population = 1400000000  # 自动处理大数
```

**实际开发建议**：普通整数统一用 `int`，除非有特殊原因（如超大数用 `long`）

---

### 浮点类型

```java
// Java - 默认是 double
float f = 3.14f;    // 必须加 f，否则编译错误！
double d = 3.14;    // 默认双精度

// Python - 统一用 float
pi = 3.14  # 就是 float
```

---

### 字符类型

```java
// Java - char 是基本类型
char c1 = 'A';        // 单引号！
char c2 = '中';       // 支持 Unicode
// char c3 = "A";     // ❌ 双引号是 String！

// Python - 没有 char，只有 str
c1 = 'A'
c2 = "A"             # 单双引号都可以
```

---

### 布尔类型

```java
// Java - boolean 只有两个值
boolean isPassed = true;
boolean isEmpty = false;
// boolean b = 1;     // ❌ 不能用数字代替！

// Python - bool 是 int 的子类
is_passed = True
is_empty = False
# bool(1) == True    # ✅ 可以！
```

---

## 引用类型 vs 值类型

### Java 的两种类型

```java
// 值类型（基本类型）- 直接存储值
int a = 10;
int b = a;      // 复制值
b = 20;
System.out.println(a);  // 输出：10（a 不受影响）

// 引用类型（对象）- 存储引用
String s1 = "hello";
String s2 = s1;     // 复制引用
s2 = "world";
System.out.println(s1);  // 输出：hello
```

### Python 全是引用类型

```python
# Python 中一切皆对象
a = 10
b = a
b = 20
print(a)  # 输出：10（整数是不可变对象）

# 列表是可变对象
list1 = [1, 2, 3]
list2 = list1
list2.append(4)
print(list1)  # 输出：[1, 2, 3, 4]（受影响！）
```

---

## 类型转换

### Java 类型转换

```java
// 自动转换（小 → 大）
int i = 100;
long l = i;       // ✅ 自动转换
double d = i;     // ✅ 自动转换

// 强制转换（大 → 小）
double d = 3.14;
int i = (int) d;  // ✅ 强制转换，结果：3（丢失小数）
```

### Python 类型转换

```python
# 显式转换
d = 3.14
i = int(d)      # 结果：3

f = float(10)   # 结果：10.0
s = str(100)    # 结果："100"
```

---

## 字符串类型

### Java String

```java
// String 是引用类型，不是基本类型！
String s1 = "hello";

// 字符串不可变
String s = "hello";
s = s + " world";  // 创建了新对象

// 常用方法
String name = "Tom";
int len = name.length();           // 3
String upper = name.toUpperCase(); // "TOM"
char c = name.charAt(0);           // 'T'
boolean eq = name.equals("Tom");   // true（不能用 ==）
```

### Python String

```python
# str 也是不可变
s = "hello"
s = s + " world"

# 常用方法
name = "Tom"
len(name)              # 3
name.upper()           # "TOM"
name[0]                # 'T'
name == "Tom"          # True（可以用 ==）
```

---

## 对比总结表

| 特性 | Java | Python |
|------|------|--------|
| 类型系统 | 静态类型（编译时检查） | 动态类型（运行时检查） |
| 基本类型 | 8 种（int/double/boolean 等） | 无（一切皆对象） |
| 变量声明 | `int x = 10;` | `x = 10` |
| 字符串 | `String`（引用类型） | `str`（对象） |
| 字符 | `char c = 'A'` | 无（`str` 长度为 1） |
| 布尔 | `boolean b = true` | `bool b = True` |
| 类型转换 | `(int) 3.14` | `int(3.14)` |
| 字符串比较 | `s1.equals(s2)` | `s1 == s2` |
| 命名规范 | 驼峰 `userName` | 下划线 `user_name` |

---

## 常见错误

```java
// ❌ 错误示例
int x = 10.5;      // 10.5 是 double，不能赋值给 int
float f = 3.14;    // 3.14 是 double，需要 3.14f
char c = "A";      // 双引号是 String，需要 'A'
boolean b = 1;     // boolean 只能是 true/false

// ✅ 正确写法
int x = (int) 10.5;
float f = 3.14f;
char c = 'A';
boolean b = true;
```

---

## 关联

- [[java-compilation-and-jvm|Java 编译原理]]
- [[java-classes-and-objects|类与对象]]
- [[java-operators-and-expressions|运算符和表达式]]
