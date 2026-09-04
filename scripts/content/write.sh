#!/usr/bin/env bash
# Orchestrate Codex content-writing runs, gate their files, journal outcomes and commit exact outputs.

if ((BASH_VERSINFO[0] < 4 || (BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] < 3))); then
  echo "write.sh needs bash 4.3 or newer (this is ${BASH_VERSION:-unknown})" >&2
  exit 1
fi

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

KIND=''
JOBS=4
DRY_RUN=0
IDS=()

CODEX_BIN="${CODEX_BIN:-codex}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.6-sol}"
CODEX_TIMEOUT="${CODEX_TIMEOUT:-3600}"
COMMIT_EVERY="${COMMIT_EVERY:-10}"
MARK_RETRY_SLEEP="${MARK_RETRY_SLEEP:-2}"
KILL_GRACE="${KILL_GRACE:-10}"

WRITE_ROOT='reports/write'
INFLIGHT_DIR="$WRITE_ROOT/.inflight"
OK_DIR="$WRITE_ROOT/.written"
RUN_LOG="$WRITE_ROOT/run.log"
STATE_FILE='reports/polish/state.json'

usage() {
  cat <<'EOF'
usage: pnpm content:write --kind quiz|kata|interview|path|cheatsheet --id <id>
                          [--id <id> ...] [--n 4] [--dry-run]

  --kind KIND  output kind to write
  --id ID      topic, track or scoped output id; repeat to run a batch
  --n N        maximum concurrent Codex sessions (default 4)
  --dry-run    print rendered briefs and exact Codex command; touch nothing
EOF
}

while (($# > 0)); do
  case "$1" in
    --kind)
      KIND="${2:-}"
      case "$KIND" in quiz | kata | interview | path | cheatsheet) ;; *) echo "unknown kind: $KIND" >&2; exit 2 ;; esac
      shift 2
      ;;
    --id)
      [[ -n ${2:-} ]] || { echo "--id needs a value" >&2; exit 2; }
      IDS+=("$2")
      shift 2
      ;;
    --n)
      JOBS="${2:-}"
      [[ $JOBS =~ ^[1-9][0-9]*$ ]] || { echo "--n takes a positive integer" >&2; exit 2; }
      shift 2
      ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -n $KIND ]] || { echo "--kind is required" >&2; usage >&2; exit 2; }
((${#IDS[@]} > 0)) || { echo "--id is required" >&2; usage >&2; exit 2; }
[[ $COMMIT_EVERY =~ ^[1-9][0-9]*$ ]] || { echo "COMMIT_EVERY must be a positive integer" >&2; exit 2; }

CODEX_CMD=(
  "$CODEX_BIN" exec
  --dangerously-bypass-approvals-and-sandbox
  -m "$CODEX_MODEL"
  -c model_reasoning_effort=xhigh
  -C "$REPO_ROOT"
  -
)

brief() {
  pnpm exec tsx scripts/content/lib/write-brief.ts --kind "$KIND" --id "$1"
}

if ((DRY_RUN)); then
  printf '=== selected (%d) ===\n%s\n\n' "${#IDS[@]}" "${IDS[*]}"
  for id in "${IDS[@]}"; do
    printf '=== %s brief for %s ===\n' "$KIND" "$id"
    brief "$id"
    printf '\n=== codex command ===\n'
    printf '%q ' "${CODEX_CMD[@]}"
    printf '< rendered-%s-%s-brief.md\n\n' "$KIND" "${id//\//__}"
  done
  exit 0
fi

log() {
  local line
  line="$(date -u '+%Y-%m-%dT%H:%M:%SZ') $*"
  printf '%s\n' "$line"
  printf '%s\n' "$line" >>"$RUN_LOG"
}

mark() {
  local attempt
  for attempt in 1 2 3; do
    if pnpm exec tsx scripts/content/mark.ts "$@" >>"$RUN_LOG" 2>&1; then return 0; fi
    if ((attempt < 3)); then sleep "$MARK_RETRY_SLEEP"; fi
  done
  log "error journal write failed after 3 attempts: mark $*"
  return 1
}

flat_of() {
  local value="${1//\//__}"
  printf '%s' "${value//:/__}"
}

finish_failed() {
  local id="$1" flat="$2" reason="$3" key="write:$KIND:$1"
  if ! mark fail "$key" polished "$reason"; then
    log "error $id: the failure could not be recorded"
  fi
  rm -f "$INFLIGHT_DIR/$flat" "$INFLIGHT_DIR/$flat.pid"
  log "finish $KIND $id failed: $reason"
}

write_one() {
  local id="$1" flat dir key last reason status detail codex_pid check_failed
  flat="$(flat_of "$id")"
  dir="$WRITE_ROOT/$KIND/$flat"
  key="write:$KIND:$id"
  reason=''
  mkdir -p "$dir"
  printf '%s\n' "$id" >"$INFLIGHT_DIR/$flat"
  log "start $KIND $id"

  if ! mark start "$key" polished; then
    rm -f "$INFLIGHT_DIR/$flat"
    log "finish $KIND $id failed: the journal is unwritable"
    return 0
  fi
  if ! brief "$id" >"$dir/brief.md" 2>"$dir/runner.log"; then
    finish_failed "$id" "$flat" "brief render failed, see $dir/runner.log"
    return 0
  fi

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
  elif [[ $last == "WRITE FAILED $id:"* ]]; then
    reason="$last"
  elif [[ $last != "WRITE DONE $id" ]]; then
    reason="codex did not report done (last line: ${last:-empty})"
  fi

  check_failed=0
  detail=''
  if ! pnpm --silent content:check --kind "$KIND" "$id" >"$dir/check.log" 2>&1; then
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
  if ! mark ok "$key" polished; then
    rm -f "$INFLIGHT_DIR/$flat"
    log "finish $KIND $id failed: content passed, but the journal is unwritable"
    return 0
  fi
  if ! pnpm exec tsx scripts/content/lib/write-brief.ts --kind "$KIND" --id "$id" --outputs >"$OK_DIR/$flat"; then
    finish_failed "$id" "$flat" "could not enumerate produced files"
    return 0
  fi
  printf '# %s\n' "$id" >>"$OK_DIR/$flat"
  rm -f "$INFLIGHT_DIR/$flat"
  log "finish $KIND $id ok"
}

commit_batch() {
  local -a ids=("$@") add=() staged=()
  local id flat file
  for id in "${ids[@]}"; do
    flat="$(flat_of "$id")"
    while IFS= read -r file; do
      [[ -n $file && $file != '# '* ]] && add+=("$file")
    done <"$OK_DIR/$flat"
  done
  [[ -e $STATE_FILE ]] && add+=("$STATE_FILE")
  if ((${#add[@]} == 0)); then
    log "warn no produced files found for ${ids[*]}"
    return 0
  fi
  if ! git add -A -- "${add[@]}"; then
    log "error could not stage produced files for ${ids[*]}"
    return 1
  fi
  while IFS= read -r -d '' file; do staged+=("$file"); done \
    < <(git diff --cached --name-only --no-renames -z -- "${add[@]}")
  if ((${#staged[@]} == 0)); then
    log "note no changes to commit for ${ids[*]}"
    return 0
  fi
  if ! git -c user.name="codewiki" -c user.email="tomchen.org@gmail.com" \
    commit -q -m "content: write $KIND batch (${ids[*]})" -- "${staged[@]}"; then
    log "error commit failed for ${ids[*]}; their changes remain in the worktree"
    return 1
  fi
  log "commit $KIND ${ids[*]}"
}

commit_successes() {
  local -a batch=()
  local id flat
  local failures=0
  for id in "${IDS[@]}"; do
    flat="$(flat_of "$id")"
    [[ -f $OK_DIR/$flat ]] || continue
    batch+=("$id")
    if ((${#batch[@]} == COMMIT_EVERY)); then
      commit_batch "${batch[@]}" || failures=$((failures + 1))
      batch=()
    fi
  done
  if ((${#batch[@]} > 0)); then commit_batch "${batch[@]}" || failures=$((failures + 1)); fi
  return "$failures"
}

any_alive() {
  local pid
  for pid in "$@"; do kill -0 "$pid" 2>/dev/null && return 0; done
  return 1
}

await_gone() {
  local grace="$1"
  shift
  local pid
  while ((grace > 0)) && any_alive "$@"; do sleep 1; grace=$((grace - 1)); done
  any_alive "$@" || return 0
  for pid in "$@"; do kill -KILL "$pid" 2>/dev/null || true; done
}

on_signal() {
  local workers_text file id pid
  local -a workers=() sessions=()
  trap - INT TERM
  log 'interrupted, stopping the write pool'
  workers_text="$(jobs -pr || true)"
  if [[ -n $workers_text ]]; then
    mapfile -t workers <<<"$workers_text"
    kill "${workers[@]}" 2>/dev/null || true
  fi
  for file in "$INFLIGHT_DIR"/*.pid; do
    [[ -e $file ]] || continue
    pid="$(<"$file")"
    if [[ -n $pid ]]; then
      if kill -TERM "-$pid" 2>/dev/null; then sessions+=("-$pid");
      else kill -TERM "$pid" 2>/dev/null || true; sessions+=("$pid"); fi
    fi
    rm -f "$file"
  done
  for pid in ${workers[@]+"${workers[@]}"}; do wait "$pid" 2>/dev/null || true; done
  if ((${#sessions[@]} > 0)); then await_gone "$KILL_GRACE" "${sessions[@]}"; fi
  for file in "$INFLIGHT_DIR"/*; do
    [[ -e $file && $file != *.pid ]] || continue
    id="$(<"$file")"
    mark fail "write:$KIND:$id" polished interrupted || true
    rm -f "$file"
  done
  commit_successes || true
  exit 130
}

mkdir -p "$WRITE_ROOT" "$INFLIGHT_DIR" "$OK_DIR"
for file in "$INFLIGHT_DIR"/* "$OK_DIR"/*; do [[ -e $file ]] && rm -f "$file"; done
trap on_signal INT TERM

log "run start: ${#IDS[@]} $KIND ids, $JOBS at a time, model $CODEX_MODEL"
for id in "${IDS[@]}"; do
  while (($(jobs -pr | wc -l) >= JOBS)); do wait -n || true; done
  write_one "$id" &
done
while (($(jobs -pr | wc -l) > 0)); do wait -n || true; done

commit_failures=0
commit_successes || commit_failures=$?
written="$(find "$OK_DIR" -maxdepth 1 -type f | wc -l)"
log "run done: $written of ${#IDS[@]} $KIND ids written"
if ((commit_failures > 0)); then
  log "error $commit_failures content batch commits failed"
  exit 1
fi
