
# 类与对象

> Java 是纯面向对象语言，一切皆对象

---

## 核心概念对比

### Python 的类

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def say_hello(self):
        print(f"Hello, I'm {self.name}")

# 使用
p = Person("Tom", 25)
p.say_hello()
```

### Java 的类

```java
public class Person {
    // 成员变量（字段）
    private String name;
    private int age;
    
    // 构造器
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // 成员方法
    public void sayHello() {
        System.out.println("Hello, I'm " + name);
    }
    
    // Getter/Setter
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}

// 使用
Person p = new Person("Tom", 25);
p.sayHello();
```

---

## 关键区别

| 特性 | Python | Java |
|------|--------|------|
| 类定义 | `class Person:` | `public class Person {` |
| 构造器 | `__init__` | 构造器（与类同名） |
| 自我引用 | `self` | `this` |
| 变量声明 | 直接赋值 | 必须声明类型 |
| 访问控制 | 无（约定俗成） | `public`/`private`/`protected` |
| 对象创建 | `Person()` | `new Person()` |

---

## 类的结构

```java
public class Person {
    // 1. 成员变量（字段）
    private String name;
    private int age;
    
    // 2. 构造器
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // 3. 成员方法
    public void sayHello() {
        System.out.println("Hello, I'm " + name);
    }
    
    // 4. Getter/Setter
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}
```

---

## 访问修饰符

Java 有 **4 种访问控制**，Python 没有真正的私有！

| 修饰符 | 同类 | 同包 | 子类 | 其他类 |
|--------|------|------|------|--------|
| `private` | ✅ | ❌ | ❌ | ❌ |
| （默认） | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

**Python 对比**：
```python
# Python 只是约定俗成
class Person:
    def __init__(self):
        self.name = "Tom"      # 公开
        self._age = 25         # 约定：内部使用（但还是可以访问）
        self.__secret = "xxx"  # 名称修饰（但还是可以访问）
```

---

## 构造器

```java
public class Person {
    private String name;
    private int age;
    
    // 无参构造器
    public Person() {
        this.name = "Unknown";
        this.age = 0;
    }
    
    // 有参构造器
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // 构造器重载
    public Person(String name) {
        this(name, 0);  // 调用另一个构造器
    }
}

// 使用
Person p1 = new Person();           // "Unknown", 0
Person p2 = new Person("Tom", 25);  // "Tom", 25
Person p3 = new Person("Jerry");    // "Jerry", 0
```

---

## this 关键字

```java
public class Person {
    private String name;
    
    public Person(String name) {
        this.name = name;  // this.name = 成员变量，name = 参数
    }
    
    public void sayHello() {
        System.out.println(this.name);  // this 可以省略
    }
}
```

**为什么需要 `this`？**
- 区分成员变量和局部变量（参数）
- 在构造器中调用其他构造器：`this(...)`
- 返回当前对象：`return this;`

**常见错误**：
```java
public Person(String name) {
    name = name;   // ❌ 错误！这是参数赋值给参数
    // 正确：this.name = name;
}
```

---

## Getter/Setter

Java 通常不直接访问字段，而是通过方法：

```java
public class Person {
    private String name;
    
    // Getter
    public String getName() {
        return name;
    }
    
    // Setter
    public void setName(String name) {
        this.name = name;
    }
}

// 使用
Person p = new Person();
p.setName("Tom");      // ✅ 通过方法设置
String n = p.getName(); // ✅ 通过方法获取
// p.name = "Tom";     // ❌ private 不能直接访问
```

**Python 对比**：
```python
# Python 直接访问属性
p = Person()
p.name = "Tom"    # ✅ 直接访问
n = p.name        # ✅ 直接访问
```

---

## 实际项目示例

### EvalProperties.java

```java
@ConfigurationProperties(prefix = "eval")
public class EvalProperties {
    
    // 1. 成员变量（private）
    private String casesDir = "classpath:evals/cases";
    private Agent agent = new Agent();
    
    // 2. 无参构造器（Spring 需要）
    public EvalProperties() {}
    
    // 3. Getter/Setter（Spring 通过 setter 注入）
    public String getCasesDir() {
        return casesDir;
    }
    
    public void setCasesDir(String casesDir) {
        this.casesDir = casesDir;
    }
    
    // 4. 静态内部类
    public static class Agent {
        private String defaultUrl = "http://localhost:1107";
        
        public String getDefaultUrl() {
            return defaultUrl;
        }
        
        public void setDefaultUrl(String defaultUrl) {
            this.defaultUrl = defaultUrl;
        }
    }
}
```

---

## 常量 vs 配置项

| 特性 | 常量 (final) | 配置项 (可修改) |
|------|-------------|----------------|
| 值来源 | 代码中硬编码 | YAML/配置文件 |
| 能否修改 | ❌ 不能 | ✅ 可以（不同环境不同值） |
| 使用场景 | 固定不变的值 | 需要灵活配置的值 |
| 示例 | `DEFAULT_PAGE_SIZE` | `casesDir`, `agentUrl` |

**常量标准写法**：
```java
private static final int DEFAULT_PAGE_SIZE = 20;
```

**配置项写法**：
```java
@ConfigurationProperties(prefix = "eval")
public class EvalProperties {
    private String casesDir;  // 没有 final，因为要被 Spring 设置
    
    public void setCasesDir(String casesDir) {
        this.casesDir = casesDir;
    }
}
```

---

## 关联

- [[java-static-keyword|static 关键字]]
- [[java-variables-and-types|变量与数据类型]]
- [[java-inheritance-and-polymorphism|继承与多态]]
- [[java-spring-bean-management|Spring Bean 对象管理]]
