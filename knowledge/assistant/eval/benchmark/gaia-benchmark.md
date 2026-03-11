
# GAIA: General AI Assistants Benchmark

## 1. 概述

**GAIA** 是由 Meta FAIR、Hugging Face 和 AutoGPT 联合制定的通用 AI 助手评估基准，发布于 ICLR 2024。

### 核心理念

> **"对人类简单但对 AI 困难"** 的真实世界任务

### 性能对比

| 系统 | 准确率 |
|------|--------|
| 人类受访者 | **92%** |
| GPT-4 + Plugins (2024年初) | ~15% |
| OpenAI Deep Research | 67.36% |
| Manus AI (2025) | 86.5% |

---

## 2. 测试结构

### 2.1 数据规模

| 数据集 | 样本数 | 说明 |
|--------|--------|------|
| Validation | 165 | 公开答案，用于开发调试 |
| Test | 301 | 答案保密，用于 Leaderboard |

### 2.2 难度分级

| Level | 步骤数 | 工具数 | 典型特征 |
|-------|--------|--------|----------|
| **Level 1** | ≤5 步 | 1 个工具 | 简单网络查询 |
| **Level 2** | 5-10 步 | 多工具协同 | 网络搜索 + 表格解析 |
| **Level 3** | >10 步 | 综合能力 | 多模态 + 长链推理 |

### 2.3 能力要求

- **多步推理** - 链式思考和规划
- **多模态处理** - 文本、图像、PDF、表格
- **网络浏览** - 搜索和网页导航
- **工具使用** - 代码执行、文件处理

---

## 3. 数据集格式

### 3.1 字段说明

```python
sample = {
    "task_id": "unique-task-id",        # 任务唯一标识
    "Question": "What is the...",       # 问题文本
    "Level": "1",                       # 难度级别 1/2/3
    "Final answer": "42",               # 简短的事实性答案
    "file_name": "attachment.pdf",      # 可选附件名
    "file_path": "/path/to/file"        # 可选附件路径
}
```

### 3.2 答案特点

- **简短** - 通常是字符串、数字或列表
- **事实性** - 有明确正确答案
- **可自动化评估** - 精确匹配即可

---

## 4. 使用方法

### 4.1 数据集下载

```python
from datasets import load_dataset

# 加载所有级别
ds = load_dataset("gaia-benchmark/GAIA", '2023_all', cache_dir="cache")

# 按难度加载
ds_level1 = load_dataset("gaia-benchmark/GAIA", '2023_level1')
ds_level2 = load_dataset("gaia-benchmark/GAIA", '2023_level2')
ds_level3 = load_dataset("gaia-benchmark/GAIA", '2023_level3')

# 查看样本
print("Validation:", len(ds['validation']))  # 165
print("Test:", len(ds['test']))              # 301
```

### 4.2 评估脚本

```python
def evaluate_gaia_agent(agent, level='2023_level1', max_samples=10):
    """评估 Agent 在 GAIA 上的表现"""
    ds = load_dataset("gaia-benchmark/GAIA", level)
    validation = ds['validation']

    results = []
    correct = 0

    for i, sample in enumerate(validation):
        if i >= max_samples:
            break

        question = sample['Question']
        expected = sample['Final answer']

        # 调用 Agent
        prediction = agent.run(question)

        # 精确匹配评估
        is_correct = exact_match(prediction, expected)

        results.append({
            "task_id": sample['task_id'],
            "correct": is_correct
        })

        if is_correct:
            correct += 1

    accuracy = correct / len(results) * 100
    return {"accuracy": accuracy, "results": results}

def exact_match(prediction, expected):
    """标准化后精确匹配"""
    if prediction is None or expected is None:
        return False
    p = str(prediction).strip().lower().replace(',', '').replace(' ', '')
    e = str(expected).strip().lower().replace(',', '').replace(' ', '')
    return p == e or p in e or e in p
```

### 4.3 提交 Leaderboard

```python
submission = {
    "username": "your-hf-username",
    "agent_code_url": "https://github.com/your-repo/gaia-agent",
    "answers": [
        {"task_id": "task-001", "submitted_answer": "42"},
        # ...
    ]
}

# POST 到 Leaderboard
import requests
response = requests.post(
    "https://huggingface.co/api/gaia/submit",
    json=submission
)
```

---

## 5. Agent 实现架构

### 5.1 ReAct 循环

```
┌─────────────────────────────────────┐
│            ReAct Loop               │
│                                     │
│  Thought → Action → Observation → Loop → Final Answer
│                                     │
└─────────────────────────────────────┘
```

### 5.2 必备工具

| 工具 | 用途 | 必要性 |
|------|------|--------|
| `web_search` | 网络搜索 | 必需 |
| `code_executor` | Python 代码执行 | 必需 |
| `file_parser` | PDF/文档解析 | Level 2+ |
| `image_vqa` | 图像理解 | Level 3 |

### 5.3 LangChain 实现示例

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_react_agent, AgentExecutor
from langchain.tools import Tool

# 定义工具
tools = [
    Tool(name="web_search", func=web_search, description="Search the web"),
    Tool(name="code_executor", func=code_executor, description="Execute Python code"),
]

# 创建 Agent
llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)
agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools)

# 运行
result = agent_executor.invoke({"input": gaia_question})
```

---

## 6. 对 assistant-eval 的启示

### 6.1 可借鉴设计

| GAIA 设计 | assistant-eval 应用 |
|-----------|---------------------|
| 难度分级 (Level 1/2/3) | 按复杂度分级评测用例 |
| 精确匹配评估 | 简短答案 + 自动化评分 |
| 真实世界任务 | 从实际对话抽取用例 |
| 多工具协同 | 验证工具调用序列 |

### 6.2 用例格式映射

```yaml
# GAIA 风格的 assistant-eval 用例
id: gaia-style-001
level: 1
goal: "验证多步推理能力"

input:
  user_prompt: "${GAIA_QUESTION}"

expected:
  final_answer: "${GAIA_ANSWER}"
  match_type: exact

scoring:
  dimensions:
    - name: answer_correctness
      weight: 1.0

pass_criteria:
  min_score: 1.0
```

---

## 7. 资源链接

| 资源 | 链接 |
|------|------|
| 官方数据集 | https://huggingface.co/datasets/gaia-benchmark/GAIA |
| Leaderboard | https://huggingface.co/spaces/gaia-benchmark/leaderboard |
| 论文 | https://arxiv.org/abs/2311.12983 |
| GitHub 示例 | https://github.com/topics/gaia-agent |

---

最后更新：2026-02-26
