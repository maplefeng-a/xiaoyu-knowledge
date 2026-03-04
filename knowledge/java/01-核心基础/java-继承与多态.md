---
id: java-inheritance-and-polymorphism
type: concept
title: 继承与多态
status: active
aliases: []
tags:
  - java
  - 面向对象
  - 继承
  - 多态
refs: []
---

# 继承与多态

> 面向对象的核心特性

---

## 1. 继承（Inheritance）

```java
// 父类（基类）
public class Animal {
    protected String name;
    
    public void eat() {
        System.out.println("Animal is eating");
    }
}

// 子类（派生类）
public class Dog extends Animal {  // extends = 继承
    
    public Dog(String name) {
        this.name = name;  // 可以访问 protected 字段
    }
    
    // 方法重写（Override）
    @Override
    public void eat() {
        System.out.println("Dog is eating");
    }
    
    // 子类特有方法
    public void bark() {
        System.out.println("Woof!");
    }
}

// 使用
Dog dog = new Dog("Buddy");
dog.eat();   // 输出：Dog is eating（调用重写的方法）
dog.bark();  // 输出：Woof!
```

**Python 对比**：
```python
class Animal:
    def __init__(self, name):
        self.name = name
    
    def eat(self):
        print("Animal is eating")

class Dog(Animal):  # 继承
    def eat(self):  # 重写
        print("Dog is eating")
    
    def bark(self):
        print("Woof!")
```

---

## 2. 多态（Polymorphism）

```java
// 父类引用指向子类对象
Animal animal = new Dog("Buddy");  // ✅ 多态！
animal.eat();  // 输出：Dog is eating（实际调用 Dog 的方法）
// animal.bark();  // ❌ 编译错误！Animal 没有 bark 方法
```

**为什么有用？**
```java
// 可以创建不同类型的动物数组
Animal[] animals = new Animal[3];
animals[0] = new Dog("Buddy");
animals[1] = new Cat("Kitty");
animals[2] = new Bird("Tweety");

// 统一调用
for (Animal a : animals) {
    a.eat();  // 每个动物执行自己的 eat() 方法
}
```

---

## 3. 抽象类（Abstract Class）

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
```

---

## 4. 接口（Interface）

```java
// 接口 - 完全抽象的契约
public interface Flyable {
    // 方法默认是 public abstract
    void fly();
    
    // 可以有默认实现（Java 8+）
    default void land() {
        System.out.println("Landing...");
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
```

**Python 对比**：
```python
from abc import ABC, abstractmethod

class Flyable(ABC):
    @abstractmethod
    def fly(self):
        pass
    
    def land(self):  # 默认实现
        print("Landing...")

class Bird(Flyable):
    def fly(self):
        print("Bird is flying")
```

---

## 继承 vs 接口

| 特性 | 继承（extends） | 接口（implements） |
|------|----------------|-------------------|
| 关键字 | `extends` | `implements` |
| 数量 | 只能继承一个父类 | 可以实现多个接口 |
| 字段 | 可以继承字段 | 只能有常量（`public static final`） |
| 构造器 | 可以调用父类构造器 | 没有构造器 |
| 设计目的 | "是一个"（is-a） | "能做什么"（can-do） |

---

## 完整示例

```java
// 接口
public interface Pet {
    void play();
}

// 父类
public class Animal {
    protected String name;
    
    public void eat() {
        System.out.println("Animal is eating");
    }
}

// 子类 - 继承一个类，实现多个接口
public class Dog extends Animal implements Pet {
    
    public Dog(String name) {
        this.name = name;
    }
    
    @Override
    public void eat() {
        System.out.println("Dog is eating");
    }
    
    @Override
    public void play() {
        System.out.println("Dog is playing with ball");
    }
    
    public void bark() {
        System.out.println("Woof!");
    }
}
```

---

## @Override 注解

```java
public class Dog extends Animal {
    @Override  // 告诉编译器这是重写方法
    public void eat() {
        System.out.println("Dog is eating");
    }
}
```

**作用**：
- 告诉编译器这是重写父类的方法
- 如果父类没有这个方法，编译会报错
- 提高代码可读性

---

## 实际项目示例

### assistant-agent 中的继承

```java
// 父接口
public interface Agent {
    Mono<Msg> call(List<Msg> msgs);
}

// 实现类
public class ReActAgent implements Agent {
    @Override
    public Mono<Msg> call(List<Msg> msgs) {
        // 具体实现
    }
}
```

---

## 关联

- [[java-classes-and-objects|类与对象]]
- [[java-interface-and-abstract|接口与抽象类]]
- [[java-spring-bean-management|Spring Bean 对象管理]]
