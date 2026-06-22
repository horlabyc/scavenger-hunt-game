import { NextResponse } from 'next/server';
import { isAdminPassword } from '@/lib/admin';
import { getGameState, setStatus } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let password = '';
  let action = '';
  try {
    const body = await req.json();
    password = body?.password ?? '';
    action = body?.action ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!isAdminPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  if (action === 'start') {
    await setStatus('running');
  } else if (action === 'stop') {
    await setStatus('stopped');
  } else {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  const game = await getGameState();
  return NextResponse.json({ status: game.status, startedAt: game.startedAt });
}
