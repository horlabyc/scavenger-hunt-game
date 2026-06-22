import { NextResponse } from 'next/server';
import { findByCode } from '@/lib/config';
import { computeScoreAndPercent, getGameState, getProgress, MAX_SCORE } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code') || '';
  const identity = findByCode(code);
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [game, completedTaskIds] = await Promise.all([
    getGameState(),
    getProgress(identity.groupId),
  ]);

  const stats = computeScoreAndPercent(completedTaskIds);

  return NextResponse.json({
    status: game.status,
    startedAt: game.startedAt,
    completedTaskIds,
    maxScore: MAX_SCORE,
    ...stats,
  });
}
