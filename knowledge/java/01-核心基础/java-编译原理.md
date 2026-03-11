
# Java 编译原理与 JVM

> Java 是**编译 + 解释**型语言，核心是"一次编译，到处运行"

---

## 编译过程

```
.java 源代码 ──► .class 字节码 ──► JVM 执行
     │              │              │
   编译           中间文件      跨平台运行
  (javac)                      (任何系统)
```

---

## 文件类型对比

| 文件 | 说明 | 是否人读 |
|------|------|---------|
| `.java` | Java 源代码文件 | ✅ 是 |
| `.class` | 编译后的字节码文件 | ❌ 否 |

---

## JVM 是什么？

**JVM = Java Virtual Machine（Java 虚拟机）**

```
┌─────────────────────────────────┐
│   Windows / Mac / Linux         │  ← 操作系统
├─────────────────────────────────┤
│   JVM (Java 虚拟机)             │  ← 翻译官
├─────────────────────────────────┤
│   .class 字节码                 │  ← 通用中间语言
└─────────────────────────────────┘
```

**JVM 的作用**：把 `.class` 字节码"翻译"成当前操作系统能理解的指令

---

## Java vs Python

| 对比项 | Python | Java |
|--------|--------|------|
| 执行方式 | 解释执行 | 编译 + 解释 |
| 跨平台 | 需要 Python 环境 | 需要 JVM |
| 运行速度 | 较慢 | 较快（有 JIT 优化） |
| 类型检查 | 运行时 | 编译时 |

---

## 跨平台的秘密

> **一次编译，到处运行（Write Once, Run Any）**

因为 `.class` 是通用格式，不同系统只要有对应的 JVM 就能运行：

```
HelloWorld.java
      │
      ▼ javac (编译一次)
HelloWorld.class
      │
      ├────► Windows JVM ──► Windows 执行
      ├────► Mac JVM ──► Mac 执行
      └────► Linux JVM ──► Linux 执行
```

---

## 示例

```java
// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}

// 编译
javac HelloWorld.java

// 生成
HelloWorld.class

// 运行
java HelloWorld
```

---

## 关联

- [[java-static-keyword|static 关键字]]
- [[java-variables-and-types|变量与数据类型]]
- JVM 内存模型
- JIT 编译优化
