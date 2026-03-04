---
title: Skill 仓库后端设计
tags:
  - skill
  - mcp
  - assistant-mcp
  - design
status: draft
created_at: 2026-02-25
updated_at: 2026-02-25
authors:
  - mcp-dev
related:
  - skill-package-version-ui-discussion.md
---

# Skill 仓库后端设计（assistant-mcp）

## 1. 背景与目标

### 1.1 问题陈述

当前 `skills/` 目录存在以下问题：

| 问题 | 现状 |
|------|------|
| 混合存储 | 开发态（目录）和发布态（.skill 文件）混在一起 |
| 版本管理混乱 | 只有 xiaoyu-dev 有多版本，其他 skill 无版本管理 |
| 元数据缺失 | 无统一的 skill 注册表 |
| 升级机制缺失 | Agent 无法自主升级 skill |

### 1.2 设计目标

1. **目录结构优化**：分离开发态与发布态
2. **MCP 工具支持**：让 Agent 可以查看和升级 skill
3. **HTTP API 支持**：为 Desktop 提供管理接口
4. **Agent 自升级**：实现 Agent 的自我进化能力

### 1.3 核心价值

**Agent 自升级 skill** 是一个关键能力：
- Agent 可以通过 MCP 工具查看可用的 skill 版本
- Agent 可以主动升级到新版本 skill
- 实现 Agent 的自我进化

## 2. 设计原则

遵循 assistant-mcp 的核心设计模式：**文档为真相 + Formatter 补充索引**

| 层次 | 职责 | 实现方式 |
|------|------|----------|
| **文件层** | 权威数据源 | 目录结构 + SKILL.md frontmatter |
| **解析层** | 格式转换 | `YamlParserService` 解析 frontmatter |
| **服务层** | 业务逻辑 | `SkillService` 扫描、聚合、升级 |
| **访问层** | MCP + HTTP | 复用同一服务 |

## 3. 目录结构设计

### 3.1 新目录结构

```
skills/
├── dev/                              # 开发态（源码）
│   ├── xiaoyu-dev/
│   │   ├── SKILL.md                  # frontmatter: name, description, skill_version
│   │   └── references/               # 参考文档
│   ├── event-hub/
│   │   └── SKILL.md
│   └── daily-kickoff/
│       └── SKILL.md
│
└── releases/                         # 发布态（安装包）
    └── xiaoyu-dev/
        ├── 1.0.0/
        │   └── xiaoyu-dev-1.0.0.skill    # ZIP 包
        ├── 1.0.1/
        │   └── xiaoyu-dev-1.0.1.skill
        └── 1.0.3/
            └── xiaoyu-dev-1.0.3.skill
```

### 3.2 SKILL.md Frontmatter 规范

```yaml
---
name: xiaoyu-dev
description: xiaoyu 项目开发 skill。用于 assistant-agent / assistant-mcp / assistant-eval / assistant-desktop 的功能开发、缺陷修复、重构与联调。
metadata:
  skill_version: "1.0.3"
  spec_version: "1.0"
  author: "claude-code"
  created_at: "2026-02-01"
  updated_at: "2026-02-24"
---
```

### 3.3 .skill 包格式

`.skill` 文件是 ZIP 格式的安装包，包含：

```
xiaoyu-dev-1.0.3.skill (ZIP)
├── SKILL.md              # 技能定义
├── references/           # 参考文档（可选）
│   ├── SPEC.md
│   └── WORKTREE_WORKFLOW.md
└── manifest.json         # 元数据清单
```

`manifest.json` 示例：

```json
{
  "name": "xiaoyu-dev",
  "version": "1.0.3",
  "description": "xiaoyu 项目开发 skill",
  "author": "claude-code",
  "created_at": "2026-02-24T19:13:00+08:00",
  "files": [
    "SKILL.md",
    "references/SPEC.md",
    "references/WORKTREE_WORKFLOW.md"
  ]
}
```

## 4. API 设计

### 4.1 MCP 工具

| 工具名 | 用途 | 首版 |
|--------|------|------|
| `skill_list` | 列出所有 skill（按 skill 聚合） | ✅ |
| `skill_info` | 获取单个 skill 详情 | ✅ |
| `skill_upgrade` | 升级 skill 到指定版本 | ⏳ 二期 |

#### 4.1.1 skill_list

**用途**：Agent 查看仓库中有哪些 skill 可用

**参数**：无

**返回格式**：

```
📚 技能仓库

---JSON---
{
  "ok": true,
  "skills": [
    {
      "name": "xiaoyu-dev",
      "description": "xiaoyu 项目开发 skill",
      "installed_version": "1.0.3",
      "latest_version": "1.0.3",
      "version_count": 3,
      "versions": ["1.0.3", "1.0.2", "1.0.1", "1.0.0"],
      "has_update": false
    },
    {
      "name": "event-hub",
      "description": "多智能体消息总线",
      "installed_version": null,
      "latest_version": "dev",
      "version_count": 1,
      "versions": ["dev"],
      "has_update": false
    }
  ]
}
---END-JSON---
```

#### 4.1.2 skill_info

**用途**：Agent 查看某个 skill 的详细信息

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | skill 名称 |

**返回格式**：

```
📖 技能详情：xiaoyu-dev

描述：xiaoyu 项目开发 skill
当前版本：1.0.3
最新版本：1.0.3

可用版本：
- 1.0.3 (latest, released)
- 1.0.1 (released)
- 1.0.0 (released)

---JSON---
{
  "ok": true,
  "name": "xiaoyu-dev",
  "description": "xiaoyu 项目开发 skill",
  "installed_version": "1.0.3",
  "latest_version": "1.0.3",
  "versions": [
    {
      "version": "1.0.3",
      "status": "released",
      "file_name": "xiaoyu-dev-1.0.3.skill",
      "file_size": 12123,
      "updated_at": "2026-02-24T19:13:00+08:00"
    },
    {
      "version": "1.0.1",
      "status": "released",
      "file_name": "xiaoyu-dev-1.0.1.skill",
      "file_size": 9419,
      "updated_at": "2026-02-24T11:41:00+08:00"
    },
    {
      "version": "1.0.0",
      "status": "released",
      "file_name": "xiaoyu-dev-1.0.0.skill",
      "file_size": 17014,
      "updated_at": "2026-02-21T10:50:00+08:00"
    }
  ]
}
---END-JSON---
```

#### 4.1.3 skill_upgrade（二期）

**用途**：Agent 主动升级 skill

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | skill 名称 |
| `version` | string | 否 | 目标版本（默认最新版） |

**返回格式**：

```
✅ 技能升级成功

技能：xiaoyu-dev
旧版本：1.0.1
新版本：1.0.3

---JSON---
{
  "ok": true,
  "name": "xiaoyu-dev",
  "from_version": "1.0.1",
  "to_version": "1.0.3",
  "installed_at": "2026-02-25T15:30:00+08:00"
}
---END-JSON---
```

### 4.2 HTTP API

| API | 方法 | 用途 | 首版 |
|-----|------|------|------|
| `/api/skills` | GET | 获取 skill 列表 | ✅ |
| `/api/skills/{name}` | GET | 获取 skill 详情 | ✅ |
| `/api/skills/{name}/upgrade` | POST | 升级 skill | ⏳ 二期 |
| `/api/skills/{name}/{version}/readme` | GET | 获取 skill README | ⏳ 二期 |

#### 4.2.1 GET /api/skills

**响应**：

```json
{
  "ok": true,
  "data": {
    "skills": [
      {
        "name": "xiaoyu-dev",
        "description": "xiaoyu 项目开发 skill",
        "installedVersion": "1.0.3",
        "latestVersion": "1.0.3",
        "versionCount": 3,
        "versions": ["1.0.3", "1.0.2", "1.0.1", "1.0.0"],
        "hasUpdate": false
      }
    ]
  }
}
```

## 5. 数据模型

### 5.1 Java Record

```java
/**
 * Skill 聚合摘要
 */
public record SkillSummary(
    String name,
    String description,
    String installedVersion,
    String latestVersion,
    int versionCount,
    List<String> versions,
    boolean hasUpdate
) {}

/**
 * Skill 版本信息
 */
public record SkillVersion(
    String version,
    String status,          // "development" | "released"
    String fileName,
    String filePath,
    Long fileSize,
    String updatedAt
) {}

/**
 * Skill 详情
 */
public record SkillDetail(
    String name,
    String description,
    String installedVersion,
    String latestVersion,
    List<SkillVersion> versions
) {}
```

### 5.2 与 desktop-dev 的数据契约

前端需要的最小字段集：

| 字段 | 列表 | 详情 | 说明 |
|------|------|------|------|
| `name` | ✅ | ✅ | skill 名称 |
| `description` | ✅ | ✅ | 描述（单行） |
| `latestVersion` | ✅ | ✅ | 最新版本 |
| `versionCount` | ✅ | ✅ | 版本数量 |
| `versions` | ✅ | ✅ | 版本列表 |
| `installedVersion` | ⏳ | ⏳ | 当前安装版本（二期） |
| `hasUpdate` | ⏳ | ⏳ | 是否有更新（二期） |

## 6. 服务层设计

### 6.1 SkillService

```java
@Service
public class SkillService {

    private final ServiceConfig config;
    private final FileStorageService storage;
    private final YamlParserService yamlParserService;

    private static final Path DEV_DIR = Path.of("dev");
    private static final Path RELEASES_DIR = Path.of("releases");

    /**
     * 获取 skill 列表（按 skill 聚合）
     */
    public Map<String, Object> listSkills() {
        Map<String, Object> result = new LinkedHashMap<>();
        List<SkillSummary> skills = new ArrayList<>();

        // 1. 扫描 dev/ 目录
        Map<String, SkillInfo> devSkills = scanDevSkills();

        // 2. 扫描 releases/ 目录
        Map<String, List<SkillVersion>> releasedSkills = scanReleasedSkills();

        // 3. 合并并聚合
        Set<String> allNames = new TreeSet<>();
        allNames.addAll(devSkills.keySet());
        allNames.addAll(releasedSkills.keySet());

        for (String name : allNames) {
            SkillInfo devInfo = devSkills.get(name);
            List<SkillVersion> versions = releasedSkills.getOrDefault(name, List.of());

            // 如果有开发态，添加 dev 版本
            if (devInfo != null) {
                versions.add(new SkillVersion("dev", "development",
                    null, "dev/" + name, null, devInfo.updatedAt()));
            }

            String latestVersion = versions.isEmpty() ? null : versions.get(0).version();

            skills.add(new SkillSummary(
                name,
                devInfo != null ? devInfo.description() : "",
                null,  // installedVersion - 二期
                latestVersion,
                versions.size(),
                versions.stream().map(SkillVersion::version).toList(),
                false  // hasUpdate - 二期
            ));
        }

        result.put("ok", true);
        result.put("skills", skills);
        return result;
    }

    /**
     * 获取单个 skill 详情
     */
    public Map<String, Object> getSkillDetail(String name) {
        // 类似 listSkills，但返回完整的版本信息
    }

    /**
     * 扫描开发态 skill
     */
    private Map<String, SkillInfo> scanDevSkills() {
        // 扫描 dev/ 目录，解析 SKILL.md frontmatter
    }

    /**
     * 扫描发布态 skill
     */
    private Map<String, List<SkillVersion>> scanReleasedSkills() {
        // 扫描 releases/ 目录，按 skill 聚合版本
    }
}
```

### 6.2 文件扫描逻辑

```java
private Map<String, SkillInfo> scanDevSkills() {
    Map<String, SkillInfo> result = new LinkedHashMap<>();
    Path devPath = config.getSkillsPath().resolve(DEV_DIR);

    if (!Files.exists(devPath)) {
        return result;
    }

    try {
        Files.list(devPath)
            .filter(Files::isDirectory)
            .forEach(skillDir -> {
                Path skillMdPath = skillDir.resolve("SKILL.md");
                if (Files.exists(skillMdPath)) {
                    try {
                        ParsedMarkdown parsed = yamlParserService.parse(skillMdPath);
                        String name = parsed.getString("name",
                            skillDir.getFileName().toString());
                        String description = parsed.getString("description", "");

                        @SuppressWarnings("unchecked")
                        Map<String, Object> metadata =
                            (Map<String, Object>) parsed.frontmatter().get("metadata");
                        String version = metadata != null
                            ? (String) metadata.get("skill_version")
                            : "dev";

                        long lastModified = Files.getLastModifiedTime(skillMdPath).toMillis();

                        result.put(name, new SkillInfo(
                            name, description, version,
                            Instant.ofEpochMilli(lastModified).toString()
                        ));
                    } catch (Exception e) {
                        log.warn("Failed to parse skill: {}", skillMdPath, e);
                    }
                }
            });
    } catch (IOException e) {
        log.error("Failed to scan dev skills", e);
    }

    return result;
}
```

## 7. MCP 工具实现

### 7.1 SkillToolDefinitions

```java
public class SkillToolDefinitions {

    public record ToolDefinition(String name, String description,
                                  Map<String, Object> schema) {
        public JsonSchema jsonSchema() { ... }
    }

    public static final ToolDefinition SKILL_LIST = new ToolDefinition(
        "skill_list",
        "List all available skills in the repository. Returns skills grouped by name with version information.",
        Map.of(
            "type", "object",
            "properties", Map.of(),
            "required", List.of()
        )
    );

    public static final ToolDefinition SKILL_INFO = new ToolDefinition(
        "skill_info",
        "Get detailed information about a specific skill, including all available versions.",
        Map.of(
            "type", "object",
            "properties", Map.of(
                "name", Map.of(
                    "type", "string",
                    "description", "Skill name (required)"
                )
            ),
            "required", List.of("name")
        )
    );

    public static final ToolDefinition SKILL_UPGRADE = new ToolDefinition(
        "skill_upgrade",
        "Upgrade a skill to a specific version. If version is not specified, upgrades to the latest.",
        Map.of(
            "type", "object",
            "properties", Map.of(
                "name", Map.of(
                    "type", "string",
                    "description", "Skill name (required)"
                ),
                "version", Map.of(
                    "type", "string",
                    "description", "Target version (optional, defaults to latest)"
                )
            ),
            "required", List.of("name")
        )
    );

    public static List<ToolDefinition> getAllTools() {
        return List.of(SKILL_LIST, SKILL_INFO, SKILL_UPGRADE);
    }
}
```

### 7.2 SkillToolHandlers

```java
@Component
public class SkillToolHandlers {

    private static final String JSON_START = "\n\n---JSON---\n";
    private static final String JSON_END = "\n---END-JSON---";

    private final SkillService skillService;
    private final ObjectMapper objectMapper;

    /**
     * skill_list handler
     */
    public CallToolResult skillList(Map<String, Object> args) {
        try {
            Map<String, Object> result = skillService.listSkills();

            StringBuilder sb = new StringBuilder();
            sb.append("📚 技能仓库\n\n");

            @SuppressWarnings("unchecked")
            List<SkillSummary> skills = (List<SkillSummary>) result.get("skills");

            for (SkillSummary skill : skills) {
                sb.append("- **").append(skill.name()).append("**\n");
                sb.append("  - 描述: ").append(skill.description()).append("\n");
                sb.append("  - 最新版本: ").append(skill.latestVersion()).append("\n");
                sb.append("  - 版本数: ").append(skill.versionCount()).append("\n\n");
            }

            sb.append(JSON_START);
            sb.append(objectMapper.writeValueAsString(result));
            sb.append(JSON_END);

            return success(sb.toString());
        } catch (Exception e) {
            log.error("Failed to list skills", e);
            return error("Failed to list skills: %s", e.getMessage());
        }
    }

    /**
     * skill_info handler
     */
    public CallToolResult skillInfo(Map<String, Object> args) {
        // 实现类似
    }
}
```

## 8. 与 assistant-agent 的集成（二期）

### 8.1 安装目录

```
~/.assistant/skills/           # Agent 运行时加载的 skill
├── xiaoyu-dev/
│   ├── SKILL.md
│   └── references/
└── event-hub/
    └── SKILL.md
```

### 8.2 升级流程

```
┌─────────────┐     skill_upgrade      ┌─────────────────┐
│    Agent    │ ──────────────────────▶│   SkillService  │
└─────────────┘                        └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │ 解压 .skill 文件 │
                                       │ 到安装目录       │
                                       └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │ 更新安装记录     │
                                       └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │ Agent 重启后     │
                                       │ 自动加载新版本   │
                                       └─────────────────┘
```

### 8.3 安装记录

```yaml
# ~/.assistant/skills/installed.yaml
skills:
  xiaoyu-dev:
    installed_version: "1.0.3"
    installed_at: "2026-02-25T15:30:00+08:00"
    source: "releases/xiaoyu-dev/1.0.3"
  event-hub:
    installed_version: "dev"
    installed_at: "2026-02-20T10:00:00+08:00"
    source: "dev/event-hub"
```

## 9. 首版范围

### 9.1 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 目录结构优化 | ✅ 首版 | dev/ + releases/ 分离 |
| `skill_list` MCP 工具 | ✅ 首版 | 列出所有 skill |
| `skill_info` MCP 工具 | ✅ 首版 | 获取 skill 详情 |
| `GET /api/skills` | ✅ 首版 | HTTP API |
| `GET /api/skills/{name}` | ✅ 首版 | HTTP API |
| `skill_upgrade` MCP 工具 | ⏳ 二期 | 需要定义安装目录 |
| 安装记录管理 | ⏳ 二期 | |
| Agent 自动加载 | ⏳ 二期 | |

### 9.2 迁移计划

1. 创建 `skills/dev/` 和 `skills/releases/` 目录
2. 移动现有 skill 目录到 `dev/`
3. 移动现有 `.skill` 文件到 `releases/{name}/{version}/`
4. 更新打包脚本

## 10. 与 desktop-dev 的对齐

| 问题 | 结论 |
|------|------|
| 数据返回格式 | 按 skill 聚合，列表直接带 `versions[]` |
| 版本列表位置 | 列表接口直接返回 |
| 版本元信息字段 | `version`, `status`, `file_name`, `file_size`, `updated_at` |
| 首版功能 | 仅浏览（list + info） |
| 升级功能 | 二期 |

## 11. 参考资料

- [skill-package-version-ui-discussion.md](skill-package-version-ui-discussion.md) - 前端 UI 讨论稿
- [MessageService.java](../../../assistant-mcp/src/main/java/com/assistant/mcp/service/MessageService.java) - 参考实现
- [IndexContributor.java](../../../assistant-mcp/src/main/java/com/assistant/mcp/service/index/IndexContributor.java) - 索引模式
