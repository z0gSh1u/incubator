# AGENTS.md

Agent development guidelines for the GitHub Stars Skills project.

## Project Overview

Claude Code Skills for collecting and searching GitHub Stars:
- `github-stars-collector`: Sync repositories from GitHub API to local directory structure
- `github-stars-searcher`: Semantic search through collected repositories

## Build & Test Commands

```bash
# Setup environment (venv already created)
source .venv/bin/activate
uv pip install -e .

# Test sync script
python .claude/skills/github-stars-collector/scripts/sync_stars.py
```

## Code Style Guidelines

### Python Version
- Minimum: Python 3.7
- Target: Python 3.9+ (for `list[...]` and `dict[...]`)
- Shebang: `#!/usr/bin/env python3`

### Import Organization
```python
# Order: standard library → third-party → local modules
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Set, List, Dict

# Third-party with error handling
try:
    from github import Github
except ImportError:
    print(json.dumps({"error": "PyGithub not installed"}))
    sys.exit(1)
```

### Type Hints
Use `typing` module for function signatures:
```python
def load_env(env_path: Path) -> dict:
def get_existing_repos(stars_dir: Path) -> Set[str]:
def save_repo(stars_dir: Path, repo) -> bool:
```

### Docstrings
All public functions must have docstrings:
```python
def load_env(env_path: Path) -> dict:
    """Load environment variables from .env file."""
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars
```

### Error Handling
**Use try/except with specific error handling:**
```python
# Runtime errors
try:
    g = Github(token)
    user = g.get_user()
except Exception as e:
    print(json.dumps({"error": f"Failed to connect to GitHub: {str(e)}"}))
    sys.exit(1)
```
**Exit codes:** `sys.exit(1)` for errors, implicit `0` for success

### Naming Conventions
- **Variables/Functions:** `snake_case`
- **Arguments:** `--kebab-case` (argparse convention)

### Formatting
- **Indentation:** 4 spaces (no tabs)
- **Spacing:** One blank line between functions
- **JSON output:** `ensure_ascii=False` for Unicode support

### File Operations
**Always use `pathlib.Path` with context managers:**
```python
from pathlib import Path

data_dir = base_dir / ".claude" / "skills"
data_dir.mkdir(parents=True, exist_ok=True)

with open(data_file, "r", encoding="utf-8") as f:
    content = f.read()
```

### Command-Line Interfaces
```python
parser = argparse.ArgumentParser(description="Fetch GitHub Stars for AI processing")
parser.add_argument(
    "--limit",
    type=int,
    default=5,
    help="Number of repos to return in this batch (default: 5)",
)
args = parser.parse_args()
```

## Script-Specific Patterns

### sync_stars.py
Syncs all GitHub starred repos to local directory structure.

**Directory structure:**
```
.claude/skills/data/stars/
├── facebook/
│   └── react/
│       ├── meta.json     # {"full_name", "description", "language", "stars", "url", "topics"}
│       └── README.md     # First 2000 chars of README
```

**meta.json format:**
```json
{
  "full_name": "facebook/react",
  "description": "The library for web and native user interfaces",
  "language": "JavaScript",
  "stars": 231000,
  "url": "https://github.com/facebook/react",
  "topics": ["javascript", "react", "ui"]
}
```

**Key functions:**
```python
def load_env(env_path: Path) -> dict[str, str]:
    """Load environment variables from .env file."""

def get_existing_repos(stars_dir: Path) -> Set[str]:
    """Get set of existing repo full_names from directory structure."""

def wait_if_rate_limited(g: Github) -> None:
    """Sleep if approaching GitHub API rate limit."""

def save_repo(stars_dir: Path, repo: Repository) -> bool:
    """Save a single repo to directory structure. Returns True if saved."""
```

**Incremental sync:**
- Scans `stars/` directory for existing repos (checks `meta.json` existence)
- Skips repos that already have a directory
- Only fetches and saves new repos
- Rate limit handling: sleeps when remaining API calls < 100

**Output JSON:**
```json
{
  "status": "success",
  "already_exists": 1000,
  "newly_added": 234,
  "skipped": 0,
  "errors": [],
  "total_in_db": 1234,
  "stars_dir": "/path/to/.claude/skills/data/stars"
}
```

## Data Format

All data stored as directory structure under `.claude/skills/data/stars/`.

**Each repo directory contains:**
- `meta.json`: Machine-readable metadata (JSON)
- `README.md`: First 2000 chars of README (plain text)

**meta.json fields:**
- `full_name` - "owner/repo-name"
- `description` - Repository description from GitHub
- `language` - Primary programming language
- `stars` - Star count (integer)
- `url` - GitHub URL
- `topics` - List of topic tags

**Search skill accepts Chinese queries** and matches against English fields from `meta.json` and `README.md` content.

## Project Structure

```
.claude/skills/
├── github-stars-collector/
│   ├── SKILL.md
│   └── scripts/
│       └── sync_stars.py
├── github-stars-searcher/
│   └── SKILL.md
└── data/
    ├── .env.example
    └── stars/
        └── {owner}/{repo}/
            ├── meta.json
            └── README.md
```

## Dependencies

**Required:** PyGithub >= 1.59.0

```bash
pip install PyGithub
```

## Configuration

### .claude/skills/data/.env
```bash
GITHUB_TOKEN=ghp_your_token_here
```

## Common Patterns

### Environment Variables
```python
def load_env(env_path: Path) -> dict:
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars
```

### Set Operations
```python
existing_repos = set()
existing_repos.add(repo_name)

if repo_name in existing_repos:
    # Already exists, skip
```
