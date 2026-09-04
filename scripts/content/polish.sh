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
# Environment: CODEX_BIN, CODEX_MODEL, CODEX_TIMEOUT (seconds), COMMIT_EVERY,
# MARK_RETRY_SLEEP (seconds), KILL_GRACE (seconds).

# The job pool uses `wait -n`, which arrived in bash 4.3; macOS still ships 3.2 as
# /bin/bash, where this script would fail deep into a run instead of at the door.
if ((BASH_VERSINFO[0] < 4 || (BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] < 3))); then
  echo "polish.sh needs bash 4.3 or newer (this is ${BASH_VERSION:-unknown})" >&2
  exit 1
fi

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
# Pause between journal write attempts, and the grace a killed Codex session gets.
MARK_RETRY_SLEEP="${MARK_RETRY_SLEEP:-2}"
KILL_GRACE="${KILL_GRACE:-10}"

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
#
# A dropped write is not cosmetic: a topic committed but never recorded is polished again
# on the next run, an hour of Codex for nothing, and a dropped failure loses an attempt
# count and weakens the thrice-failed cutoff. So the call is retried, and a write that
# still does not land fails the caller, which then leaves the topic out of the batch.
mark() {
  local attempt
  for attempt in 1 2 3; do
    if pnpm exec tsx scripts/content/mark.ts "$@" >>"$RUN_LOG" 2>&1; then
      return 0
    fi
    if ((attempt < 3)); then
      sleep "$MARK_RETRY_SLEEP"
    fi
  done
  log "error journal write failed after 3 attempts: mark $*"
  return 1
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
  echo "could not select topics; see the error above (is content/tiers.yaml generated?)" >&2
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
  if ! mark fail "$id" polished "$reason"; then
    log "error $id: the failure could not be recorded in the journal"
  fi
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
    # Extraction is a bonus step: an unrecorded one costs a re-extraction, nothing more.
    if ! mark ok "$id" extracted; then
      log "warn $id: content:extract succeeded but could not be recorded"
    fi
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
  local flat dir lint_report last reason status detail codex_pid check_failed
  flat="$(flat_of "$id")"
  dir="$POLISH_ROOT/$flat"
  lint_report="$LINT_ROOT/$flat.json"
  reason=''

  mkdir -p "$dir"
  printf '%s\n' "$id" >"$INFLIGHT_DIR/$flat"
  log "start $id"
  # A topic whose start cannot be recorded is not worth an hour of Codex: the journal
  # would not know it ran, so the run would repeat it anyway.
  if ! mark start "$id" polished; then
    rm -f "$INFLIGHT_DIR/$flat"
    log "finish $id failed: the journal is unwritable, skipping the topic"
    return 0
  fi

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

  # The gate has two halves and a topic needs both: Codex must have reported `POLISH DONE`
  # and `pnpm content:check` must pass. A check that passes on its own proves nothing about
  # this session — a missing binary (127), a timeout (124) or an OOM kill (137) leaves the
  # topic exactly as it was, and the already-shipped files may well still pass. The check
  # runs even after Codex failed, so the recorded reason can say which half went wrong.
  local check_args=("$id")
  if ((NO_LINKS)); then
    check_args+=(--no-links)
  fi
  check_failed=0
  detail=''
  if ! pnpm --silent content:check "${check_args[@]}" >"$dir/check.log" 2>&1; then
    check_failed=1
    detail="$(grep -m 3 '^  ' "$dir/check.log" | tr '\n' ';' || true)"
  fi
  if ((check_failed)); then
    finish_failed "$id" "$flat" "${reason:+$reason; }content:check failed: ${detail:-see $dir/check.log}"
    return 0
  fi
  if [[ -n $reason ]]; then
    finish_failed "$id" "$flat" "codex failed: $reason; content:check passed but codex never reported done"
    return 0
  fi

  # The gate covers alignment too, so a passing check settles both steps. The topic joins
  # the batch only once the journal agrees it is done, so a commit can never claim more
  # than the journal knows.
  if ! mark ok "$id" polished || ! mark ok "$id" aligned; then
    rm -f "$INFLIGHT_DIR/$flat"
    log "finish $id failed: polished, but the journal is unwritable; leaving it uncommitted"
    return 0
  fi
  run_extract "$id" "$dir"
  printf '%s\n' "$id" >>"$OK_LIST"
  rm -f "$INFLIGHT_DIR/$flat"
  log "finish $id ok"
}

# --------------------------------------------------------------------------
# Batch commits
# --------------------------------------------------------------------------

committed=0
commit_failures=0

# The files one finished topic owns, if they are on disk.
#
# A polish pass writes more than the article pair: `prompts/polish-topic.md` §9 asks for a
# quiz bank next to it, and `content:extract` validates that bank. Anything shared between
# topics — the interview banks, the glossary, the proposals — is added by `commit_pending`,
# not here.
topic_paths() {
  local id="$1" track slug file
  track="${id%%/*}"
  slug="${id#*/}"
  for file in \
    "src/content/topics/$track/$slug.en.mdx" \
    "src/content/topics/$track/$slug.zh.mdx" \
    "src/content/quizzes/$track/$slug.yaml"; do
    if [[ -e $file ]]; then
      printf '%s\n' "$file"
    fi
  done
}

# Commit the topics finished since the last commit, once there are COMMIT_EVERY of them
# or when the run is over (`commit_pending 1`).
#
# Only the batch's own paths are staged. A batch commit runs while up to JOBS-1 Codex
# sessions are still writing under `src/content`, so staging that directory would sweep a
# half-written topic — and any unrelated edit in the working tree — into a commit that
# claims to be about the finished ids.
commit_pending() {
  local force="$1"
  local -a done_ids=() batch=() add=() tracks=() staged=() excludes=()
  local pending path id track
  if [[ -f $OK_LIST ]]; then
    mapfile -t done_ids <"$OK_LIST"
  fi
  pending=$((${#done_ids[@]} - committed))
  ((pending > 0)) || return 0
  if ((force == 0 && pending < COMMIT_EVERY)); then
    return 0
  fi
  batch=("${done_ids[@]:committed:pending}")
  for id in "${batch[@]}"; do
    track="${id%%/*}"
    if [[ " ${tracks[*]-} " != *" $track "* ]]; then
      tracks+=("$track")
    fi
    while IFS= read -r path; do
      add+=("$path")
    done < <(topic_paths "$id")
  done
  # The interview bank of every track in the batch: one file per track, appended to.
  for track in "${tracks[@]}"; do
    path="src/content/interview/$track.yaml"
    if [[ -e $path ]]; then
      add+=("$path")
    fi
  done
  # The rest of what a polish pass touches: merged glossary terms, the proposals Codex
  # leaves for the extractor, and the journal that records exactly this batch.
  for path in src/content/glossary content/glossary-proposals "$STATE_FILE"; do
    if [[ -e $path ]]; then
      add+=("$path")
    fi
  done
  if ((${#add[@]} == 0)); then
    log "warn no files to stage for ${batch[*]}"
    committed=${#done_ids[@]}
    return 0
  fi
  # Anything staged outside those paths belongs to someone else and stays where it is.
  for path in "${add[@]}"; do
    excludes+=(":(exclude)$path")
  done
  if [[ -n "$(git diff --cached --name-only -- "${excludes[@]}")" ]]; then
    log "note the index holds staged changes from outside this run; they stay out of the batch"
  fi
  if ! git add -A -- "${add[@]}"; then
    log "error could not stage ${add[*]}"
    commit_failures=$((commit_failures + 1))
    return 0
  fi
  # The commit pathspec is built from what is actually staged, never from the paths asked
  # for: `git commit -- <path>` aborts on a path git knows nothing about, and an empty
  # `content/glossary-proposals` directory — created by Codex and never written to — is
  # exactly that. One such path would fail every commit for the rest of the run.
  while IFS= read -r -d '' path; do
    staged+=("$path")
  done < <(git diff --cached --name-only --no-renames -z -- "${add[@]}")
  if ((${#staged[@]} == 0)); then
    log "note nothing to commit after ${batch[*]}"
    committed=${#done_ids[@]}
    return 0
  fi
  if git commit -q -m "content: polish batch (${batch[*]})" -- "${staged[@]}"; then
    log "commit ${batch[*]}"
  else
    log "error commit failed for ${batch[*]}; their changes are still in the working tree"
    commit_failures=$((commit_failures + 1))
    return 0
  fi
  committed=${#done_ids[@]}
}

# --------------------------------------------------------------------------
# Interruption
# --------------------------------------------------------------------------

# Whether any of the given pids is still around.
any_alive() {
  local pid
  for pid in "$@"; do
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  done
  return 1
}

# Wait up to `grace` seconds for processes that are not our children to go away, then
# insist with SIGKILL.
#
# `kill -0` is the only handle on a `timeout` session: it lives in its own process group
# and was started by a worker, so this shell cannot `wait` for it. A negative pid asks
# about the whole group, which is what the session actually is. Nothing may be committed
# while one of them can still write, which is what the wait is for.
await_gone() {
  local grace="$1"
  shift
  local pid
  while ((grace > 0)) && any_alive "$@"; do
    sleep 1
    grace=$((grace - 1))
  done
  any_alive "$@" || return 0
  # Still there after the grace: stop asking.
  for pid in "$@"; do
    kill -KILL "$pid" 2>/dev/null || true
  done
  grace=5
  while ((grace > 0)) && any_alive "$@"; do
    sleep 1
    grace=$((grace - 1))
  done
  return 0
}

# Ctrl-C during a run leaves topics half-written: record them as failed attempts so the
# next run treats them as unfinished work rather than as never started.
on_signal() {
  local pids file id pid
  local -a workers=() sessions=()
  trap - INT TERM
  log "interrupted, stopping the pool"
  # The workers first, so none of them reaches the gate on a half-written topic, then the
  # Codex sessions: `timeout` puts each of them in a process group of its own, so killing
  # the worker leaves the session behind, still writing to the repository.
  pids="$(jobs -pr || true)"
  if [[ -n $pids ]]; then
    mapfile -t workers <<<"$pids"
    kill "${workers[@]}" 2>/dev/null || true
  fi
  for file in "$INFLIGHT_DIR"/*.pid; do
    [[ -e $file ]] || continue
    pid="$(cat "$file")"
    if [[ -n $pid ]]; then
      # `timeout` makes itself the leader of a new process group, so the session it
      # started is only reachable through that group; the bare pid is the fallback for a
      # `timeout` that could not.
      if kill -TERM "-$pid" 2>/dev/null; then
        sessions+=("-$pid")
      else
        kill -TERM "$pid" 2>/dev/null || true
        sessions+=("$pid")
      fi
    fi
    rm -f "$file"
  done
  # Only once everything that was signalled is actually gone may the pending batch be
  # committed: a session killed mid-write would otherwise have its half-written MDX
  # committed by the very commit meant to preserve the interrupted run.
  # `${a[@]}` on an empty array is an unbound variable under `set -u` before bash 4.4.
  for pid in ${workers[@]+"${workers[@]}"}; do
    wait "$pid" 2>/dev/null || true
  done
  if ((${#sessions[@]} > 0)); then
    await_gone "$KILL_GRACE" "${sessions[@]}"
  fi
  for file in "$INFLIGHT_DIR"/*; do
    [[ -e $file && $file != *.pid ]] || continue
    id="$(cat "$file")"
    if ! mark fail "$id" polished 'interrupted'; then
      log "error $id: the interruption could not be recorded in the journal"
    fi
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

# Polished work that could not be committed is work at risk: say so and fail the run.
if ((commit_failures > 0)); then
  log "error a batch commit failed ($commit_failures attempts); commit the working tree by hand"
  exit 1
fi
