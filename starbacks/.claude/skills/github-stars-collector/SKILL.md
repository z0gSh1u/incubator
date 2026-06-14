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
6. Handles GitHub API rate limits automatically

Progress is reported every 50 repos. No user interaction needed.

### Success output
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
- Rate limits are handled automatically with sleep/retry
