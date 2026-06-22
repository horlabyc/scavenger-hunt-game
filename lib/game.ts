import { getDb } from './mongodb';
import { getGroup, GROUPS, TASKS, TASK_SCORE_BY_ID, TOTAL_SCORE } from './config';
import type { GameStateDoc, GameStatus, ProgressDoc } from './types';

const GAME_DOC_ID = 'state';

async function collections() {
  const db = await getDb();
  return {
    game: db.collection<GameStateDoc>('game'),
    progress: db.collection<ProgressDoc>('progress'),
  };
}

/** Read the current game state, defaulting to 'not_started'. */
export async function getGameState(): Promise<{ status: GameStatus; startedAt: Date | null }> {
  const { game } = await collections();
  const doc = await game.findOne({ _id: GAME_DOC_ID });
  return {
    status: doc?.status ?? 'not_started',
    startedAt: doc?.startedAt ?? null,
  };
}

/** Start or stop the game. Starting (re)sets the start time. */
export async function setStatus(status: GameStatus): Promise<void> {
  const { game } = await collections();
  const update: Partial<GameStateDoc> = { status };
  if (status === 'running') update.startedAt = new Date();
  await game.updateOne({ _id: GAME_DOC_ID }, { $set: update }, { upsert: true });
}

/** Completed task IDs for a single group. */
export async function getProgress(groupId: string): Promise<string[]> {
  const { progress } = await collections();
  const doc = await progress.findOne({ _id: groupId });
  return doc?.completedTaskIds ?? [];
}

/** Add or remove a task from a group's completed list. Returns the new list. */
export async function toggleTask(
  groupId: string,
  taskId: string,
  done: boolean,
): Promise<string[]> {
  const { progress } = await collections();
  const op = done ? { $addToSet: { completedTaskIds: taskId } } : { $pull: { completedTaskIds: taskId } };
  await progress.updateOne(
    { _id: groupId },
    { ...op, $set: { updatedAt: new Date() } },
    { upsert: true },
  );

  // Stamp (or clear) the all-tasks-complete time, used to decide the winner.
  const updated = await getProgress(groupId);
  const isComplete = computeScoreAndPercent(updated).completedCount === TASKS.length;
  const existing = await progress.findOne({ _id: groupId });
  if (isComplete && !existing?.completedAt) {
    await progress.updateOne({ _id: groupId }, { $set: { completedAt: new Date() } });
  } else if (!isComplete && existing?.completedAt) {
    await progress.updateOne({ _id: groupId }, { $set: { completedAt: null } });
  }

  return updated;
}

/** Derive score + completion percentage from a list of completed task IDs. */
export function computeScoreAndPercent(completedTaskIds: string[]): {
  score: number;
  percent: number;
  completedCount: number;
  totalTasks: number;
} {
  const validIds = completedTaskIds.filter((id) => id in TASK_SCORE_BY_ID);
  const score = validIds.reduce((sum, id) => sum + TASK_SCORE_BY_ID[id], 0);
  const totalTasks = TASKS.length;
  const completedCount = validIds.length;
  const percent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
  return { score, percent, completedCount, totalTasks };
}

export const MAX_SCORE = TOTAL_SCORE;

export interface OverviewGroup {
  groupId: string;
  groupName: string;
  leadName: string;
  memberCount: number;
  score: number;
  percent: number;
  completedCount: number;
  totalTasks: number;
  isComplete: boolean;
  completedAt: string | null;
}

/** Build the leaderboard for every group, ranked by score then finish time. */
export async function getOverview(): Promise<OverviewGroup[]> {
  const { progress } = await collections();
  const docs = await progress.find({}).toArray();
  const byId = new Map(docs.map((d) => [d._id, d]));

  const groups: OverviewGroup[] = GROUPS.map((g) => {
    const doc = byId.get(g.id);
    const completed = doc?.completedTaskIds ?? [];
    const stats = computeScoreAndPercent(completed);
    const isComplete = stats.completedCount === stats.totalTasks && stats.totalTasks > 0;
    return {
      groupId: g.id,
      groupName: g.name,
      leadName: g.lead.name,
      memberCount: g.members.length + 1,
      ...stats,
      isComplete,
      completedAt: isComplete && doc?.completedAt ? new Date(doc.completedAt).toISOString() : null,
    };
  });

  groups.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Equal score: a group that finished everything earlier ranks higher.
    if (a.completedAt && b.completedAt) return a.completedAt.localeCompare(b.completedAt);
    if (a.completedAt) return -1;
    if (b.completedAt) return 1;
    return b.completedCount - a.completedCount;
  });
  return groups;
}

/** The winning group: whoever completed ALL tasks at the earliest time. */
export function getWinner(groups: OverviewGroup[]): OverviewGroup | null {
  const finished = groups.filter((g) => g.isComplete && g.completedAt);
  if (finished.length === 0) return null;
  return finished.reduce((best, g) =>
    (g.completedAt as string).localeCompare(best.completedAt as string) < 0 ? g : best,
  );
}

/** Detailed view of one group: roster + each task's done state + stats. */
export async function getGroupDetail(groupId: string) {
  const group = getGroup(groupId);
  if (!group) return null;

  const completed = await getProgress(groupId);
  const completedSet = new Set(completed);
  const stats = computeScoreAndPercent(completed);

  return {
    groupId: group.id,
    groupName: group.name,
    leadName: group.lead.name,
    roster: [
      { name: group.lead.name, isLead: true },
      ...group.members.map((m) => ({ name: m.name, isLead: false })),
    ],
    tasks: TASKS.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      score: t.score,
      done: completedSet.has(t.id),
    })),
    maxScore: TOTAL_SCORE,
    ...stats,
  };
}
