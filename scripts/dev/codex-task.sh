#!/usr/bin/env bash
# Run one Codex implementation task from a brief file, non-interactively.
#
# Usage: scripts/dev/codex-task.sh <worktree> <brief.md> <log-file> [timeout-seconds]
#
# The brief is fed on stdin; Codex works inside <worktree> with approvals and the sandbox
# bypassed (the worktree is disposable). The last line of Codex's output is expected to be
# `TASK DONE` or `TASK FAILED: <reason>`; the exit code and that line are appended to the log.
set -euo pipefail
worktree=$1; brief=$2; log=$3; limit=${4:-3600}
model=${CODEX_MODEL:-gpt-5.6-sol}
{
  echo "start $(date -u +%FT%TZ) brief=$brief model=$model"
  set +e
  timeout "$limit" codex exec --dangerously-bypass-approvals-and-sandbox -m "$model" \
    -c model_reasoning_effort=xhigh -C "$worktree" - < "$brief"
  status=$?
  set -e
  echo "end $(date -u +%FT%TZ) exit=$status"
} >> "$log" 2>&1
