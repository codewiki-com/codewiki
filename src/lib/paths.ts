import type { Progress, Plan, QuizProgress, TopicProgress } from '@/lib/prefs';
import { passed } from '@/lib/score';

export type TopicState = 'done' | 'cur' | 'lock' | 'open';
export type CheckpointState = 'passed' | 'open' | 'locked';

export interface LearningPathProgress {
  done: number;
  total: number;
  /** One-based current milestone number. A completed path remains on its final milestone. */
  milestone: number;
  states: Record<string, TopicState>;
  checkpoints: Record<string, CheckpointState>;
}

export interface ProgressPath {
  milestones: { id: string; topics: string[]; checkpoint: string }[];
}

function topicEntry(progress: Progress, id: string): TopicProgress | undefined {
  const topics = progress?.topics;
  if (!topics || typeof topics !== 'object' || Array.isArray(topics)) return undefined;
  const entry = topics[id];
  return entry && typeof entry === 'object' ? entry : undefined;
}

function quizEntry(progress: Progress, id: string): QuizProgress | undefined {
  const quizzes = progress?.quizzes;
  if (!quizzes || typeof quizzes !== 'object' || Array.isArray(quizzes)) return undefined;
  const entry = quizzes[id];
  return entry && typeof entry === 'object' ? entry : undefined;
}

function checkpointPassed(progress: Progress, id: string): boolean {
  const result = quizEntry(progress, id);
  return Boolean(result && passed(Number(result.score), Number(result.total)));
}

function topicDone(progress: Progress, id: string): boolean {
  return typeof topicEntry(progress, id)?.completedAt === 'string';
}

/** Browser-local completion projected onto the path's checkpoint gates. */
export function pathProgress(path: ProgressPath, progress: Progress): LearningPathProgress {
  const current = path.milestones.findIndex((milestone) => !checkpointPassed(progress, milestone.checkpoint));
  const states: Record<string, TopicState> = {};
  const checkpoints: Record<string, CheckpointState> = {};
  let done = 0;

  path.milestones.forEach((milestone, milestoneIndex) => {
    const isPassed = checkpointPassed(progress, milestone.checkpoint);
    checkpoints[milestone.id] = isPassed
      ? 'passed'
      : current !== -1 && milestoneIndex === current
        ? 'open'
        : 'locked';

    const firstPending = milestone.topics.find((id) => !topicDone(progress, id));
    for (const id of milestone.topics) {
      if (topicDone(progress, id)) {
        states[id] = 'done';
        done += 1;
      } else if (current !== -1 && milestoneIndex > current) {
        states[id] = 'lock';
      } else if (milestoneIndex === current && id === firstPending) {
        states[id] = 'cur';
      } else {
        states[id] = 'open';
      }
    }
  });

  const total = path.milestones.reduce((sum, milestone) => sum + milestone.topics.length, 0);
  return {
    done,
    total,
    milestone: current === -1 ? path.milestones.length : current + 1,
    states,
    checkpoints,
  };
}

/** The next curriculum step, before the page resolves whether that planned route is authored. */
export function nextStep(
  path: ProgressPath,
  progress: Progress,
): { kind: 'topic' | 'checkpoint'; id: string } {
  const current = path.milestones.findIndex((milestone) => !checkpointPassed(progress, milestone.checkpoint));
  const milestone = path.milestones[current === -1 ? path.milestones.length - 1 : current]!;
  const topic = milestone.topics.find((id) => !topicDone(progress, id));
  return topic ? { kind: 'topic', id: topic } : { kind: 'checkpoint', id: milestone.checkpoint };
}

/** Calendar weeks at the selected daily study plan, rounded up to a useful whole week. */
export function weeksLeft(minutesLeft: number, plan: Plan): number {
  return Math.ceil(Math.max(0, minutesLeft) / (plan * 7));
}
