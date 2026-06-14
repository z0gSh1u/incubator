# Directory-Based Stars Storage Refactor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the collection pipeline from "Agent-dependent batch processing" to "Python-only one-shot sync", storing each repo as a directory with raw README and metadata JSON.

**Architecture:** A single Python script `sync_stars.py` replaces `fetch_stars.py` + `save_repos.py`. It iterates all starred repos via GitHub API, creates `stars/{owner}/{repo}/` directories with `meta.json` + `README.md`, and skips existing directories for incremental updates. No LLM involvement during collection. The searcher SKILL.md is updated to read from the new directory structure.

**Tech Stack:** Python 3.9+, PyGithub, pathlib, json

---

## File Structure

```
.claude/skills/
├── github-stars-collector/
│   ├── SKILL.md                          # MODIFY: new workflow docs
│   └── scripts/
│       ├── sync_stars.py                 # CREATE: new all-in-one script
│       ├── fetch_stars.py                # DELETE (replaced by sync_stars.py)
│       └── save_repos.py                # DELETE (replaced by sync_stars.py)
├── github-stars-searcher/
│   └── SKILL.md                          # MODIFY: new data source path
└── data/
    ├── .env                              # KEEP
    ├── .env.example                      # KEEP
    ├── github-stars.md                   # DELETE (replaced by directory structure)
    └── stars/                            # CREATE: new data directory
        └── {owner}/
            └── {repo}/
                ├── meta.json
                └── README.md
```

---

### Task 1: Create `sync_stars.py`

**Files:**
- Create: `.claude/skills/github-stars-collector/scripts/sync_stars.py`

- [ ] **Step 1: Write `sync_stars.py`**

```python
#!/usr/bin/env python3
"""
Sync all GitHub starred repositories to local directory structure.
Each repo is stored as stars/{owner}/{repo}/ with meta.json and README.md.
Skips repos that already exist (incremental sync).
"""

import json
import sys
from pathlib import Path

try:
    from github import Github
except ImportError:
    print(json.dumps({"error": "PyGithub not installed. Run: pip install PyGithub"}))
    sys.exit(1)


README_TRUNCATE = 2000


def load_env(env_path: Path) -> dict:
    """Load environment variables from .env file."""
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars


def get_existing_repos(stars_dir: Path) -> set:
    """Get set of existing repo full_names from directory structure."""
    existing = set()
    if not stars_dir.exists():
        return existing
    for owner_dir in stars_dir.iterdir():
        if not owner_dir.is_dir():
            continue
        for repo_dir in owner_dir.iterdir():
            if repo_dir.is_dir() and (repo_dir / "meta.json").exists():
                existing.add(f"{owner_dir.name}/{repo_dir.name}")
    return existing


def save_repo(stars_dir: Path, repo) -> bool:
    """Save a single repo to directory structure. Returns True if saved."""
    owner = repo.owner.login
    repo_name = repo.name
    repo_dir = stars_dir / owner / repo_name

    if repo_dir.exists() and (repo_dir / "meta.json").exists():
        return False

    repo_dir.mkdir(parents=True, exist_ok=True)

    meta = {
        "full_name": repo.full_name,
        "description": repo.description or "",
        "language": repo.language or "",
        "stars": repo.stargazers_count,
        "url": repo.html_url,
        "topics": repo.get_topics(),
    }

    with open(repo_dir / "meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    readme_content = ""
    try:
        readme_file = repo.get_readme()
        if readme_file:
            decoded = readme_file.decoded_content.decode("utf-8")
            readme_content = decoded[:README_TRUNCATE]
    except Exception:
        pass

    if readme_content:
        with open(repo_dir / "README.md", "w", encoding="utf-8") as f:
            f.write(readme_content)

    return True


def main():
    base_dir = Path.cwd()
    data_dir = base_dir / ".claude" / "skills" / "data"
    stars_dir = data_dir / "stars"
    env_file = data_dir / ".env"

    stars_dir.mkdir(parents=True, exist_ok=True)

    env_vars = load_env(env_file)
    token = env_vars.get("GITHUB_TOKEN")

    if not token:
        print(json.dumps({"error": "GITHUB_TOKEN not found in .claude/skills/data/.env"}))
        sys.exit(1)

    try:
        g = Github(token)
        user = g.get_user()
    except Exception as e:
        print(json.dumps({"error": f"Failed to connect to GitHub: {str(e)}"}))
        sys.exit(1)

    try:
        starred_list = list(user.get_starred())
    except Exception as e:
        print(json.dumps({"error": f"Failed to fetch starred repos: {str(e)}"}))
        sys.exit(1)

    existing = get_existing_repos(stars_dir)
    new_repos = [r for r in starred_list if r.full_name not in existing]

    added = 0
    skipped = 0
    errors = []

    for i, repo in enumerate(new_repos):
        try:
            if save_repo(stars_dir, repo):
                added += 1
            else:
                skipped += 1
        except Exception as e:
            errors.append({"repo": repo.full_name, "error": str(e)})

        if (i + 1) % 50 == 0:
            print(json.dumps({
                "progress": f"{i + 1}/{len(new_repos)}",
                "added_so_far": added,
                "errors_so_far": len(errors),
            }))

    total = len(existing) + added

    print(json.dumps({
        "status": "success",
        "total_starred": len(starred_list),
        "already_exists": len(existing),
        "newly_added": added,
        "skipped": skipped,
        "errors": errors,
        "total_in_db": total,
        "stars_dir": str(stars_dir),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Verify script syntax**

Run: `python -c "import py_compile; py_compile.compile('.claude/skills/github-stars-collector/scripts/sync_stars.py', doraise=True)"`
Expected: No output (success)

---

### Task 2: Update collector SKILL.md

**Files:**
- Modify: `.claude/skills/github-stars-collector/SKILL.md`

- [ ] **Step 1: Rewrite SKILL.md**

Replace entire content with:

```markdown
---
name: github-stars-collector
description: Sync GitHub starred repositories to local directory structure for semantic search. Use when user wants to: (1) Initialize their GitHub Stars collection, (2) Update collection with newly starred repos. Runs as a single Python script — no LLM involvement, fast and reliable.
---

Sync your GitHub Stars to local directory structure.

## Prerequisites

1. **Install Python dependencies**
   ```bash
   pip install PyGithub
   ```

2. **Configure GitHub Token**
   - Create Personal Access Token: GitHub Settings > Developer settings > Personal access tokens
   - Required permission: `public_repo`
   - Add token to `.claude/skills/data/.env`:
     ```
     GITHUB_TOKEN=ghp_your_token_here
     ```

## Workflow

A single command syncs all starred repos:

```bash
python .claude/skills/github-stars-collector/scripts/sync_stars.py
```

The script:
1. Fetches all starred repos via GitHub API
2. Creates `stars/{owner}/{repo}/` for each new repo
3. Saves `meta.json` (description, language, stars, url, topics)
4. Saves `README.md` (truncated to first 2000 chars)
5. Skips repos that already exist (incremental)

Progress is reported every 50 repos. No user interaction needed.

### Success output
```json
{
  "status": "success",
  "total_starred": 1234,
  "already_exists": 1000,
  "newly_added": 234,
  "skipped": 0,
  "errors": [],
  "total_in_db": 1234,
  "stars_dir": "/path/to/.claude/skills/data/stars"
}
```

### Error output
```json
{"error": "GITHUB_TOKEN not found in .claude/skills/data/.env"}
{"error": "Failed to connect to GitHub: ..."}
```

## Data Structure

```
.claude/skills/data/stars/
├── facebook/
│   └── react/
│       ├── meta.json     # {"full_name": "facebook/react", "description": "...", ...}
│       └── README.md     # First 2000 chars of README
├── vuejs/
│   └── core/
│       ├── meta.json
│       └── README.md
└── ...
```

## Error Handling

- `PyGithub not installed`: Run `pip install PyGithub`
- `GITHUB_TOKEN not found`: Add token to `.claude/skills/data/.env`
- `Failed to connect to GitHub`: Check token validity and network
- Individual repo errors are collected and reported in `errors` array without stopping the sync
```

---

### Task 3: Update searcher SKILL.md

**Files:**
- Modify: `.claude/skills/github-stars-searcher/SKILL.md`

- [ ] **Step 1: Rewrite SKILL.md**

Replace entire content with:

```markdown
---
name: github-stars-searcher
description: Search through your GitHub Stars collection using semantic understanding. Use when user wants to: (1) Find a previously starred repository, (2) Search for repos by functionality or use case, (3) Browse their starred repositories with natural language queries like "authentication library" or "image processing tool". Requires github-stars-collector to be run first to build the database.
---

Search your GitHub Stars collection using semantic understanding.

## Workflow

1. Check if data exists at `.claude/skills/data/stars/`
2. If not found, prompt user to run `github-stars-collector` first
3. Scan all `meta.json` files to build a repo index
4. Parse user's natural language query to understand intent
5. Match repositories across multiple dimensions:
   - Repository name and description
   - Topics and language
   - README content (read `README.md` for promising candidates)
6. For top candidates, read `README.md` for deeper semantic matching
7. Return top 5-10 most relevant repositories with matching reasons

## Search Strategy

**Phase 1 - Metadata scan (fast):** Read all `meta.json` files. Filter by description, topics, language, and name relevance.

**Phase 2 - README deep dive (accurate):** For the top 20-30 candidates from Phase 1, read their `README.md` files and do precise semantic matching against the user's query.

## Data Source

Data is generated by `github-stars-collector` and stored in `.claude/skills/data/stars/`.

Directory structure:
```
stars/{owner}/{repo}/
├── meta.json     # {"full_name", "description", "language", "stars", "url", "topics"}
└── README.md     # Truncated README content
```

## First-Time Usage

If the data directory doesn't exist, guide user to run:

```
/github-stars-collector
```

## Output Format

For each matching repository, return:

- Repository name with link
- Brief description
- Why it matches the query
- Key information (language, stars)

Example:

```
**owner/repo-name** - [Python | ⭐ 1.2k]
Description: Authentication library for web apps
Matched because: You're looking for authentication tools, and this library handles OAuth and JWT tokens.
Link: https://github.com/owner/repo-name
```
```

---

### Task 4: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update AGENTS.md**

Remove references to `fetch_stars.py`, `save_repos.py`, `github-stars.md`, and batch processing. Update to reflect new `sync_stars.py` and directory-based storage. The key changes:
- Replace `fetch_stars.py` and `save_repos.py` sections with `sync_stars.py`
- Replace `github-stars.md` data format with directory structure
- Remove batch processing patterns (offset/limit)
- Update test command to `python .claude/skills/github-stars-collector/scripts/sync_stars.py`

---

### Task 5: Clean up old files

**Files:**
- Delete: `.claude/skills/github-stars-collector/scripts/fetch_stars.py`
- Delete: `.claude/skills/github-stars-collector/scripts/save_repos.py`
- Delete: `.claude/skills/data/github-stars.md`

- [ ] **Step 1: Delete old scripts and data file**

```bash
rm .claude/skills/github-stars-collector/scripts/fetch_stars.py
rm .claude/skills/github-stars-collector/scripts/save_repos.py
rm .claude/skills/data/github-stars.md
```

---

### Task 6: Smoke test

- [ ] **Step 1: Run sync_stars.py with real token**

```bash
cd /Users/zhuoxu/workspace/starbacks && source .venv/bin/activate && python .claude/skills/github-stars-collector/scripts/sync_stars.py
```

Expected: JSON output with `"status": "success"` and `"newly_added": > 0`.

- [ ] **Step 2: Verify directory structure**

```bash
ls .claude/skills/data/stars/ | head -10
```

Expected: Owner directories listed.

```bash
cat .claude/skills/data/stars/*/meta.json 2>/dev/null | head -5
```

Wait, that won't work with the nested structure. Use:

```bash
ls .claude/skills/data/stars/*/*/meta.json | head -3
```

Expected: At least a few `meta.json` paths listed.

- [ ] **Step 3: Run again to verify incremental skip**

```bash
python .claude/skills/github-stars-collector/scripts/sync_stars.py
```

Expected: `"newly_added": 0`, `"already_exists": <same total as before>`.
