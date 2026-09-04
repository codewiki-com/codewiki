/**
 * Durable progress of the polish pipeline.
 *
 * Polishing the corpus is a long, resumable job spread over many runs: a topic is
 * imported, linted, polished, aligned, extracted and finally committed, and any of those
 * steps can fail. The runner therefore keeps one small journal — `reports/polish/state.json`,
 * the one report that is committed — recording how far every topic got, how often it
 * failed and why. {@link nextTopics} turns that journal plus the tier list into the next
 * batch of work, so an interrupted run resumes exactly where it stopped and a topic that
 * keeps failing is set aside for a human instead of retried forever.
 *
 * The journal is a plain JSON object keyed by topic id, written atomically so a crash
 * mid-write cannot leave a half-file that would lose the whole run's progress.
 */
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { repoPath } from './paths';

/** The pipeline steps, in the order a topic passes through them. */
export const STEPS = ['imported', 'linted', 'polished', 'aligned', 'extracted', 'committed'] as const;

export type Step = (typeof STEPS)[number];

/** A topic is set aside once it has failed this many times. */
export const MAX_ATTEMPTS = 3;

/** Repository-relative location of the journal; the only committed report. */
export const STATE_PATH = 'reports/polish/state.json';

export interface TopicState {
  /**
   * The furthest step this topic has completed. Meaningful only once `finishedAt` is
   * set: a topic whose very first attempt failed has never completed anything.
   */
  step: Step;
  /** ISO timestamp of the first attempt on this topic. */
  startedAt?: string;
  /** ISO timestamp of the most recent successful step; absent until one succeeds. */
  finishedAt?: string;
  /** Failed attempts, counted over the whole pipeline and never reset. */
  attempts: number;
  /** Why the most recent attempt failed; cleared by the next success. */
  lastError?: string;
}

export interface PipelineState {
  version: 1;
  topics: Record<string, TopicState>;
}

/** Tier number to topic ids, i.e. the `tiers` block of `content/tiers.yaml`. */
export type TierLists = Record<string, readonly string[]>;

export interface NextOptions {
  /** Consider one tier only. */
  tier?: 1 | 2 | 3;
  /** Consider only these ids, keeping tier order. */
  only?: readonly string[];
}

/** A journal with no topics in it. */
export function emptyState(): PipelineState {
  return { version: 1, topics: {} };
}

/** Position of a step in {@link STEPS}; later steps compare greater. */
export function stepIndex(step: Step): number {
  return STEPS.indexOf(step);
}

/**
 * Read the journal at `file`. A missing or unreadable file yields an empty journal:
 * the pipeline has to be able to start from nothing, and a corrupt journal costs a
 * re-run of already-finished work but never a crash.
 */
export async function loadState(file: string = repoPath(STATE_PATH)): Promise<PipelineState> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    return emptyState();
  }
  try {
    const parsed = JSON.parse(text) as Partial<PipelineState>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.topics !== 'object') return emptyState();
    return { version: 1, topics: (parsed.topics ?? {}) as Record<string, TopicState> };
  } catch {
    return emptyState();
  }
}

/**
 * Write the journal to `file`, creating its directory.
 *
 * The write goes to a sibling temp file and is then renamed over the target, which is
 * atomic on every platform we run on: a reader either sees the previous journal or the
 * new one, never a truncated file, and no temp file survives the call.
 */
export async function saveState(state: PipelineState, file: string = repoPath(STATE_PATH)): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`);
    await rename(temp, file);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}

/**
 * Record the outcome of one step for one topic, returning the updated journal.
 *
 * The input is left untouched, so a caller keeps whatever it had until it decides to
 * save. A success moves the topic to `step` and clears the last error; a failure counts
 * an attempt and records the reason but leaves the recorded step alone, because a step
 * that failed has not been completed.
 */
export function markStep(
  state: PipelineState,
  id: string,
  step: Step,
  ok: boolean,
  error?: string,
): PipelineState {
  const now = new Date().toISOString();
  const previous = state.topics[id];
  const base: TopicState = previous ?? { step: STEPS[0], attempts: 0, startedAt: now };
  const entry: TopicState = { ...base, startedAt: base.startedAt ?? now };
  if (ok) {
    entry.step = step;
    entry.finishedAt = now;
    delete entry.lastError;
  } else {
    entry.attempts += 1;
    entry.lastError = error ?? 'failed';
  }
  return { version: 1, topics: { ...state.topics, [id]: entry } };
}

/**
 * The next `n` topics to work on: those that have not reached `targetStep` yet and have
 * not been set aside after {@link MAX_ATTEMPTS} failures, in tier order (tier 1 first,
 * then the order the tier list itself gives).
 */
export function nextTopics(
  tiers: TierLists,
  state: PipelineState,
  n: number,
  targetStep: Step,
  options: NextOptions = {},
): string[] {
  const allowed = options.only ? new Set(options.only) : null;
  const wanted = options.tier ? [String(options.tier)] : ['1', '2', '3'];
  const target = stepIndex(targetStep);
  const out: string[] = [];
  for (const tier of wanted) {
    for (const id of tiers[tier] ?? []) {
      if (out.length >= n) return out;
      if (allowed && !allowed.has(id)) continue;
      const entry = state.topics[id];
      if (entry) {
        if (entry.attempts >= MAX_ATTEMPTS) continue;
        // Without a finish timestamp the recorded step is only a placeholder: the topic
        // has attempted something and completed nothing.
        if (entry.finishedAt && stepIndex(entry.step) >= target) continue;
      }
      out.push(id);
    }
  }
  return out;
}
