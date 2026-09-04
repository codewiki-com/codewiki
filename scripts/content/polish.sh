#!/usr/bin/env bash
#
# The polish runner: orchestration only.
#
# Codex does the content work. This script decides which topics are next, renders the
# Codex brief for each of them, feeds it to `codex exec`, gates the result with
# `pnpm content:check` — the independent judge, because Codex's own "done" line is a
# claim, not evidence — records progress in the pipeline journal and commits in batches.
# It never writes an article and never edits `reports/polish/state.json` itself: every
# journal write goes through `scripts/content/mark.ts`, so the JSON stays valid even when
# a run is interrupted mid-topic.
#
# Usage:
#   pnpm content:polish [--tier 1|2|3] [--n 4] [--only {track}/{slug} ...]
#                       [--max 20] [--dry-run] [--no-links]
#
# Environment: CODEX_BIN, CODEX_MODEL, CODEX_TIMEOUT (seconds), COMMIT_EVERY.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# --------------------------------------------------------------------------
# Settings
# --------------------------------------------------------------------------

TIER=''
JOBS=4
MAX=20
DRY_RUN=0
NO_LINKS=0
ONLY=()

CODEX_BIN="${CODEX_BIN:-codex}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.6-sol}"
# One topic is a long autonomous session; an hour is generous but not unbounded.
CODEX_TIMEOUT="${CODEX_TIMEOUT:-3600}"
# Commit this many finished topics at a time, so a long run leaves reviewable history.
COMMIT_EVERY="${COMMIT_EVERY:-10}"

POLISH_ROOT='reports/polish'
LINT_ROOT='reports/lint'
STATE_FILE="$POLISH_ROOT/state.json"
RUN_LOG="$POLISH_ROOT/run.log"
INFLIGHT_DIR="$POLISH_ROOT/.inflight"
OK_LIST="$POLISH_ROOT/.polished"

usage() {
  cat <<'EOF'
usage: pnpm content:polish [--tier 1|2|3] [--n 4] [--only {track}/{slug} ...]
                           [--max 20] [--dry-run] [--no-links]

  --tier N    consider one tier only
  --n N       topics polished in parallel (default 4)
  --only ...  consider only these topic ids, in tier order
  --max N     stop after selecting this many topics (default 20)
  --dry-run   render and print the brief for the first selected topic, run nothing
  --no-links  skip the network link checks in the gate
EOF
}

# --------------------------------------------------------------------------
# Arguments
# --------------------------------------------------------------------------

while (($# > 0)); do
  case "$1" in
    --tier)
      TIER="${2:-}"
      [[ $TIER == [123] ]] || { echo "--tier takes 1, 2 or 3" >&2; exit 2; }
      shift 2
      ;;
    --n)
      JOBS="${2:-}"
      [[ $JOBS =~ ^[1-9][0-9]*$ ]] || { echo "--n takes a positive integer" >&2; exit 2; }
      shift 2
      ;;
    --max)
      MAX="${2:-}"
      [[ $MAX =~ ^[1-9][0-9]*$ ]] || { echo "--max takes a positive integer" >&2; exit 2; }
      shift 2
      ;;
    --only)
      shift
      # Everything up to the next flag is a topic id.
      while (($# > 0)) && [[ $1 != -* ]]; do
        ONLY+=("$1")
        shift
      done
      ((${#ONLY[@]} > 0)) || { echo "--only needs at least one topic id" >&2; exit 2; }
      ;;
    --dry-run) DRY_RUN=1; shift ;;
    --no-links) NO_LINKS=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

CODEX_CMD=(
  "$CODEX_BIN" exec
  --dangerously-bypass-approvals-and-sandbox
  -m "$CODEX_MODEL"
  -c model_reasoning_effort=xhigh
  -C "$REPO_ROOT"
  -
)

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

# One timestamped line, on the terminal and in the run log.
log() {
  local line
  line="$(date -u '+%Y-%m-%dT%H:%M:%SZ') $*"
  printf '%s\n' "$line"
  printf '%s\n' "$line" >>"$RUN_LOG"
}

# Every journal write goes through mark.ts, which locks and rewrites the JSON.
mark() {
  if ! pnpm exec tsx scripts/content/mark.ts "$@" >>"$RUN_LOG" 2>&1; then
    log "warn journal write failed: mark $*"
  fi
}

# The report directory of a topic: `python/closures` -> `python__closures`.
flat_of() {
  printf '%s' "${1//\//__}"
}

# --------------------------------------------------------------------------
# Selection
# --------------------------------------------------------------------------

next_args=(--n "$MAX" --step polished)
if [[ -n $TIER ]]; then
  next_args+=(--tier "$TIER")
fi
if ((${#ONLY[@]} > 0)); then
  next_args+=(--only "${ONLY[@]}")
fi

selection="$(mktemp)"
trap 'rm -f "$selection"' EXIT
if ! pnpm exec tsx scripts/content/next.ts "${next_args[@]}" >"$selection"; then
  echo "could not select topics; is content/tiers.yaml generated?" >&2
  exit 1
fi
mapfile -t IDS <"$selection"
rm -f "$selection"
trap - EXIT

if ((${#IDS[@]} == 0)); then
  echo "nothing to polish: every selected topic is done or set aside"
  exit 0
fi

# --------------------------------------------------------------------------
# Dry run: show what the first topic would send, touch nothing
# --------------------------------------------------------------------------

if ((DRY_RUN)); then
  id="${IDS[0]}"
  flat="$(flat_of "$id")"
  lint_report="$LINT_ROOT/$flat.json"
  brief_args=("$id")
  if [[ -f $lint_report ]]; then
    brief_args+=(--lint-report "$lint_report")
  else
    echo "note: $lint_report is missing; a real run would create it with content:lint first" >&2
  fi
  printf '=== selected (%d) ===\n%s\n\n' "${#IDS[@]}" "${IDS[*]}"
  printf '=== brief for %s ===\n' "$id"
  pnpm exec tsx scripts/content/render-brief.ts "${brief_args[@]}"
  printf '\n=== codex command ===\n'
  printf '%q ' "${CODEX_CMD[@]}"
  printf '< %s/%s/brief.md\n' "$POLISH_ROOT" "$flat"
  exit 0
fi

# --------------------------------------------------------------------------
# One topic
# --------------------------------------------------------------------------

# Record a failure and close the topic out. Called from the worker only.
finish_failed() {
  local id="$1" flat="$2" reason="$3"
  mark fail "$id" polished "$reason"
  rm -f "$INFLIGHT_DIR/$flat"
  log "finish $id failed: $reason"
}

# Hand the polished topic to the term extractor, which lives on another branch for now.
run_extract() {
  local id="$1" dir="$2"
  if [[ ! -f scripts/content/extract.ts ]]; then
    log "note $id: content:extract is not in this checkout, skipping term extraction"
    return 0
  fi
  if pnpm --silent content:extract "$id" >"$dir/extract.log" 2>&1; then
    mark ok "$id" extracted
    return 0
  fi
  # A checkout that has the script entry but not the script says so in these two ways;
  # anything else is a real extraction failure and stays a warning.
  if grep -qiE 'missing script|err_module_not_found' "$dir/extract.log"; then
    log "note $id: content:extract is not in this checkout, skipping term extraction"
    return 0
  fi
  log "warn $id: content:extract failed, see $dir/extract.log"
}

# Polish one topic: brief -> Codex -> gate -> journal. Runs as a background job, so it
# reports every outcome itself and never exits non-zero.
polish_one() {
  local id="$1"
  local flat dir lint_report last reason status detail codex_pid
  flat="$(flat_of "$id")"
  dir="$POLISH_ROOT/$flat"
  lint_report="$LINT_ROOT/$flat.json"
  reason=''

  mkdir -p "$dir"
  printf '%s\n' "$id" >"$INFLIGHT_DIR/$flat"
  log "start $id"
  mark start "$id" polished

  # The lint report is an input of the brief, so make sure there is one.
  if [[ ! -f $lint_report ]]; then
    if ! pnpm --silent content:lint "$id" --no-links >>"$dir/runner.log" 2>&1; then
      finish_failed "$id" "$flat" "content:lint failed, see $dir/runner.log"
      return 0
    fi
  fi

  if ! pnpm exec tsx scripts/content/render-brief.ts "$id" --lint-report "$lint_report" \
    >"$dir/brief.md" 2>>"$dir/runner.log"; then
    finish_failed "$id" "$flat" "brief render failed, see $dir/runner.log"
    return 0
  fi

  # Codex runs in the background even though the worker only waits for it: `timeout`
  # puts the session in a process group of its own, so an interrupted run can only reach
  # it through its pid, which is why the pid is written down first.
  status=0
  timeout "$CODEX_TIMEOUT" "${CODEX_CMD[@]}" <"$dir/brief.md" >"$dir/codex.log" 2>&1 &
  codex_pid=$!
  printf '%s\n' "$codex_pid" >"$INFLIGHT_DIR/$flat.pid"
  wait "$codex_pid" || status=$?
  rm -f "$INFLIGHT_DIR/$flat.pid"
  last="$(grep -v '^[[:space:]]*$' "$dir/codex.log" 2>/dev/null | tail -n 1 || true)"
  if ((status == 124)); then
    reason="codex timed out after ${CODEX_TIMEOUT}s"
  elif ((status != 0)); then
    reason="codex exited $status"
  elif [[ $last == 'POLISH FAILED'* ]]; then
    reason="$last"
  elif [[ $last != "POLISH DONE $id" ]]; then
    reason="codex did not report done (last line: ${last:-empty})"
  fi

  # The gate. It is what decides, whatever Codex said about itself.
  local check_args=("$id")
  if ((NO_LINKS)); then
    check_args+=(--no-links)
  fi
  if ! pnpm --silent content:check "${check_args[@]}" >"$dir/check.log" 2>&1; then
    detail="$(grep -m 3 '^  ' "$dir/check.log" | tr '\n' ';' || true)"
    finish_failed "$id" "$flat" "${reason:+$reason; }content:check failed: ${detail:-see $dir/check.log}"
    return 0
  fi
  if [[ -n $reason ]]; then
    log "warn $id: the gate passed although $reason"
  fi

  # The gate covers alignment too, so a passing check settles both steps.
  mark ok "$id" polished
  mark ok "$id" aligned
  run_extract "$id" "$dir"
  printf '%s\n' "$id" >>"$OK_LIST"
  rm -f "$INFLIGHT_DIR/$flat"
  log "finish $id ok"
}

# --------------------------------------------------------------------------
# Batch commits
# --------------------------------------------------------------------------

committed=0

# Commit the topics finished since the last commit, once there are COMMIT_EVERY of them
# or when the run is over (`commit_pending 1`).
commit_pending() {
  local force="$1"
  local -a done_ids=() batch=() add=()
  local pending path
  if [[ -f $OK_LIST ]]; then
    mapfile -t done_ids <"$OK_LIST"
  fi
  pending=$((${#done_ids[@]} - committed))
  ((pending > 0)) || return 0
  if ((force == 0 && pending < COMMIT_EVERY)); then
    return 0
  fi
  batch=("${done_ids[@]:committed:pending}")
  for path in src/content content/glossary-proposals "$STATE_FILE"; do
    if [[ -e $path ]]; then
      add+=("$path")
    fi
  done
  if ((${#add[@]} == 0)); then
    return 0
  fi
  if ! git add -- "${add[@]}"; then
    log "warn could not stage ${add[*]}"
    return 0
  fi
  if git diff --cached --quiet; then
    log "note nothing to commit after ${batch[*]}"
  elif git commit -q -m "content: polish batch (${batch[*]})"; then
    log "commit ${batch[*]}"
  else
    log "warn commit failed for ${batch[*]}"
    return 0
  fi
  committed=${#done_ids[@]}
}

# --------------------------------------------------------------------------
# Interruption
# --------------------------------------------------------------------------

# Ctrl-C during a run leaves topics half-written: record them as failed attempts so the
# next run treats them as unfinished work rather than as never started.
on_signal() {
  local pids file id
  trap - INT TERM
  log "interrupted, stopping the pool"
  # The workers first, so none of them reaches the gate on a half-written topic, then the
  # Codex sessions: `timeout` puts each of them in a process group of its own, so killing
  # the worker leaves the session behind, still writing to the repository.
  pids="$(jobs -pr || true)"
  if [[ -n $pids ]]; then
    # shellcheck disable=SC2086 # a plain word list of pids is what kill wants
    kill $pids 2>/dev/null || true
  fi
  for file in "$INFLIGHT_DIR"/*.pid; do
    [[ -e $file ]] || continue
    kill -TERM "$(cat "$file")" 2>/dev/null || true
    rm -f "$file"
  done
  for file in "$INFLIGHT_DIR"/*; do
    [[ -e $file && $file != *.pid ]] || continue
    id="$(cat "$file")"
    mark fail "$id" polished 'interrupted'
    rm -f "$file"
    log "finish $id failed: interrupted"
  done
  commit_pending 1
  exit 130
}

# --------------------------------------------------------------------------
# The run
# --------------------------------------------------------------------------

mkdir -p "$POLISH_ROOT" "$INFLIGHT_DIR"
rm -f "$INFLIGHT_DIR"/* "$OK_LIST"
trap on_signal INT TERM

log "run start: ${#IDS[@]} topics, $JOBS at a time, model $CODEX_MODEL"

for topic in "${IDS[@]}"; do
  while (($(jobs -pr | wc -l) >= JOBS)); do
    wait -n || true
    commit_pending 0
  done
  polish_one "$topic" &
done

while (($(jobs -pr | wc -l) > 0)); do
  wait -n || true
  commit_pending 0
done
commit_pending 1

polished=0
if [[ -f $OK_LIST ]]; then
  polished="$(wc -l <"$OK_LIST")"
fi
log "run done: $polished of ${#IDS[@]} topics polished"
