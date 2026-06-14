# Starbacks: GitHub Starred 仓库语义搜索 Skill 集

[English](README.md) | 简体中文

一套收集你 Star 的 GitHub 仓库信息，然后从中进行语义搜索的 Skills。

<div align="center">
  <img src="demo.png" alt="Starbacks Demo" style="width: 600px;">
</div>

## 动机

GitHub 自带的 Star 搜索功能非常有限：只能通过仓库名称或基础关键词进行检索。当你 Star 的仓库达到成百上千个时，想要找到记忆中某个特定的库会变得异常困难。

Starbacks 利用 GitHub API 收集你 Star 的仓库信息，生成结构化的 Markdown 文件。随后基于这些数据，借助 Claude Code / OpenCode 实现语义搜索，让你能通过自然语言查询找回所需的那个仓库。

## 安装与配置

- 安装 Python 依赖

  ```bash
  uv sync
  ```

  然后重启终端，确保使用所创建的带 PyGitHub 包的 venv。

- 配置 GitHub Token

  前往 [GitHub PAT 生成页](https://github.com/settings/personal-access-tokens) 创建一个新的 Personal Access Token (PAT)，选择 `Public repositories` access，并增加 `Starring` Permission。

  随后将 Token 添加到 `.claude/skills/data/.env` 文件中：

  ```
  GITHUB_TOKEN=github_pat_xxx
  ```

## 使用

### 首次使用：收集数据

运行 `github-stars-collector` Skill：

```
/github-stars-collector
```

等待完成，数据会保存到 `.claude/skills/data/stars/` 目录结构中。

### 日常使用：搜索

运行 `github-stars-searcher` Skill：

```
/github-stars-searcher 帮我找到用于数据可视化的 React 库
```

### 更新数据库

当你 star 了新的仓库后，再次运行 `github-stars-collector` 来获取新增的仓库：

```
/github-stars-collector
```

collector 支持增量更新，只处理新 star 的仓库。

## 数据格式

数据保存在 `.claude/skills/data/stars/` 目录结构中，每个仓库包含：

- `meta.json` - 仓库元数据（名称、描述、语言、Stars 数、Topics、URL）
- `README.md` - README 前 2000 字符
