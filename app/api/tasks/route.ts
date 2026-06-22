import { NextResponse } from 'next/server';
import { findByCode, TASK_SCORE_BY_ID } from '@/lib/config';
import { computeScoreAndPercent, getGameState, MAX_SCORE, toggleTask } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let code = '';
  let taskId = '';
  let done = false;
  try {
    const body = await req.json();
    code = typeof body?.code === 'string' ? body.code : '';
    taskId = typeof body?.taskId === 'string' ? body.taskId : '';
    done = Boolean(body?.done);
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const identity = findByCode(code);
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!identity.isLead) {
    return NextResponse.json({ error: 'Only the team lead can mark tasks.' }, { status: 403 });
  }
  if (!(taskId in TASK_SCORE_BY_ID)) {
    return NextResponse.json({ error: 'Unknown task.' }, { status: 400 });
  }

  const game = await getGameState();
  if (game.status !== 'running') {
    const message =
      game.status === 'stopped'
        ? 'The game has ended. Tasks can no longer be changed.'
        : 'The game has not started yet.';
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const { completedTaskIds, completedAtById } = await toggleTask(identity.groupId, taskId, done);
  const stats = computeScoreAndPercent(completedTaskIds);

  return NextResponse.json({ completedTaskIds, completedAtById, maxScore: MAX_SCORE, ...stats });
}
