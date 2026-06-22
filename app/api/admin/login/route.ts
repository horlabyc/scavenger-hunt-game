import { NextResponse } from 'next/server';
import { isAdminPassword } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let password = '';
  try {
    const body = await req.json();
    password = body?.password ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!isAdminPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
