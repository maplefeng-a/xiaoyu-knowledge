
# 接口与抽象类

> 定义规范和契约的两种方式

---

## 1. 抽象类（Abstract Class）

### 基本概念

```java
// 抽象类 - 不能被实例化
public abstract class Animal {
    protected String name;
    
    // 抽象方法 - 没有实现，子类必须实现
    public abstract void makeSound();
    
    // 普通方法 - 有实现，子类可以继承
    public void sleep() {
        System.out.println("Animal is sleeping");
    }
}

// 子类必须实现抽象方法
public class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("Woof!");
    }
}

// 使用
// Animal a = new Animal();  // ❌ 抽象类不能实例化
Animal a = new Dog();  // ✅
a.makeSound();  // 输出：Woof!
a.sleep();      // 输出：Animal is sleeping（继承的方法）
```

### 特点

| 特性 | 说明 |
|------|------|
| 关键字 | `abstract` |
| 实例化 | ❌ 不能直接 `new` |
| 抽象方法 | 没有方法体，子类必须实现 |
| 普通方法 | 可以有实现，子类继承 |
| 字段 | 可以有各种类型的字段 |
| 构造器 | 可以有构造器（子类调用） |
| 继承数量 | 只能继承一个抽象类 |

### 使用场景

- 多个类有共同的属性和方法
- 需要定义部分实现，部分由子类实现
- "是一个"（is-a）的关系

---

## 2. 接口（Interface）

### 基本概念

```java
// 接口 - 完全抽象的契约
public interface Flyable {
    // 方法默认是 public abstract
    void fly();
    
    // 可以有默认实现（Java 8+）
    default void land() {
        System.out.println("Landing...");
    }
    
    // 静态方法（Java 8+）
    static boolean canFly(String type) {
        return "bird".equals(type);
    }
}

// 类可以实现多个接口
public class Bird extends Animal implements Flyable, Swimmable {
    
    @Override
    public void fly() {
        System.out.println("Bird is flying");
    }
    
    @Override
    public void swim() {
        System.out.println("Bird is swimming");
    }
}

// 使用
Bird bird = new Bird();
bird.fly();   // 调用接口方法
bird.land();  // 调用默认方法
boolean can = Flyable.canFly("bird");  // 调用静态方法
```

### 特点

| 特性 | 说明 |
|------|------|
| 关键字 | `interface` |
| 实例化 | ❌ 不能直接 `new` |
| 方法 | 默认 `public abstract` |
| 默认方法 | `default` 关键字（Java 8+） |
| 静态方法 | `static` 关键字（Java 8+） |
| 字段 | 只能有 `public static final` 常量 |
| 实现数量 | 可以实现多个接口 |

### 使用场景

- 定义能力/行为契约
- 多个不相关的类实现相同的行为
- "能做什么"（can-do）的关系

---

## 3. 继承 vs 实现

### 关键字

```java
// 继承类 - 用 extends
public class Dog extends Animal {
    // ...
}

// 实现接口 - 用 implements
public class Bird implements Flyable {
    // ...
}

// 继承 + 实现
public class Bird extends Animal implements Flyable, Swimmable {
    // ...
}
```

### 对比表

| 特性 | 继承（extends） | 接口（implements） |
|------|----------------|-------------------|
| 关键字 | `extends` | `implements` |
| 数量 | 只能一个 | 可以多个 |
| 字段 | 可以继承字段 | 只能有常量 |
| 构造器 | 可以调用 | 没有构造器 |
| 设计目的 | "是一个"（is-a） | "能做什么"（can-do） |

---

## 4. 实际项目示例

### assistant-agent 中的接口

```java
// 定义 Agent 接口
public interface Agent {
    Mono<Msg> call(List<Msg> msgs);
    Flux<Event> stream(List<Msg> msgs, StreamOptions options);
}

// 实现类
public class ReActAgent implements Agent {
    @Override
    public Mono<Msg> call(List<Msg> msgs) {
        // 具体实现
    }
    
    @Override
    public Flux<Event> stream(List<Msg> msgs, StreamOptions options) {
        // 具体实现
    }
}
```

### Spring 中的接口

```java
// Spring 的 Repository 接口
public interface JpaRepository<T, ID> {
    Optional<T> findById(ID id);
    <S extends T> S save(S entity);
    void deleteById(ID id);
}

// 实现类（Spring 自动生成）
public interface UserRepository extends JpaRepository<User, Long> {
    // 继承所有方法
    // 可以添加自定义查询方法
    Optional<User> findByEmail(String email);
}
```

---

## 5. 抽象类 vs 接口 选择指南

```
需要定义什么？
    │
    ├── "是什么"（is-a）→ 抽象类
    │   （如：Dog 是 Animal）
    │
    ├── "能做什么"（can-do）→ 接口
    │   （如：Bird 能 Fly）
    │
    ├── 需要多个继承 → 接口
    │   （Java 只能单继承）
    │
    └── 需要字段状态 → 抽象类
        （接口只能有常量）
```

---

## 6. Java 8+ 接口新特性

### 默认方法

```java
public interface Collection {
    // 抽象方法
    void add(Object o);
    
    // 默认方法（Java 8+）
    default void forEach(Consumer<? super T> action) {
        for (T element : this) {
            action.accept(element);
        }
    }
}
```

### 静态方法

```java
public interface Utils {
    static String format(String str) {
        return str.trim().toUpperCase();
    }
}

// 使用
String result = Utils.format(" hello ");
```

---

## 7. 函数式接口

```java
// 只有一个抽象方法的接口
@FunctionalInterface
public interface Runnable {
    void run();
}

// 使用（Lambda 表达式）
Runnable r = () -> System.out.println("Hello");
new Thread(r).start();
```

**常见函数式接口**：
- `Runnable` - 无参数无返回
- `Callable<T>` - 无参数有返回
- `Consumer<T>` - 有参数无返回
- `Function<T,R>` - 有参数有返回
- `Supplier<T>` - 无参数有返回

---

## 关联

- [[java-classes-and-objects|类与对象]]
- [[java-inheritance-and-polymorphism|继承与多态]]
- [[java-lambda-and-stream|Lambda & Stream]]
