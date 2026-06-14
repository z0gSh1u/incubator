#!/usr/bin/env python3
"""
Sync all GitHub starred repositories to local directory structure.
Each repo is stored as stars/{owner}/{repo}/ with meta.json and README.md.
Skips repos that already exist (incremental sync).
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Set

try:
    from github import Auth, Github, GithubException
    from github.Repository import Repository
except ImportError:
    print(json.dumps({"error": "PyGithub not installed. Run: pip install PyGithub"}))
    sys.exit(1)


README_TRUNCATE = 2000
RATE_LIMIT_BUFFER = 100
RATE_LIMIT_SLEEP = 60


def load_env(env_path: Path) -> dict[str, str]:
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


def get_existing_repos(stars_dir: Path) -> Set[str]:
    """Get set of existing repo full_names from directory structure."""
    existing: Set[str] = set()
    if not stars_dir.exists():
        return existing
    for owner_dir in stars_dir.iterdir():
        if not owner_dir.is_dir():
            continue
        for repo_dir in owner_dir.iterdir():
            if repo_dir.is_dir() and (repo_dir / "meta.json").exists():
                existing.add(f"{owner_dir.name}/{repo_dir.name}")
    return existing


def wait_if_rate_limited(g: Github) -> None:
    """Sleep if approaching GitHub API rate limit."""
    remaining = g.get_rate_limit().core.remaining
    if remaining < RATE_LIMIT_BUFFER:
        reset_time = g.get_rate_limit().core.reset
        sleep_seconds = max((reset_time - datetime.now(timezone.utc)).total_seconds(), RATE_LIMIT_SLEEP)
        print(json.dumps({
            "rate_limit": "pausing",
            "remaining": remaining,
            "sleep_seconds": int(sleep_seconds),
        }))
        time.sleep(sleep_seconds)


def save_repo(stars_dir: Path, repo: Repository) -> bool:
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
    except GithubException:
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
        g = Github(auth=Auth.Token(token))
        user = g.get_user()
    except Exception as e:
        print(json.dumps({"error": f"Failed to connect to GitHub: {str(e)}"}))
        sys.exit(1)

    existing = get_existing_repos(stars_dir)

    added = 0
    skipped = 0
    errors = []
    processed = 0

    for repo in user.get_starred():
        if repo.full_name in existing:
            continue

        wait_if_rate_limited(g)

        try:
            if save_repo(stars_dir, repo):
                added += 1
            else:
                skipped += 1
        except Exception as e:
            errors.append({"repo": repo.full_name, "error": str(e)})

        processed += 1
        if processed % 50 == 0:
            print(json.dumps({
                "progress": f"{processed} processed",
                "added_so_far": added,
                "errors_so_far": len(errors),
            }))

    total = len(existing) + added

    print(json.dumps({
        "status": "success",
        "already_exists": len(existing),
        "newly_added": added,
        "skipped": skipped,
        "errors": errors,
        "total_in_db": total,
        "stars_dir": str(stars_dir),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
