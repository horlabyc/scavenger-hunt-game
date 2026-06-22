import { NextResponse } from 'next/server';
import { findByCode, getGroup, TASKS } from '@/lib/config';
import type { RosterMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let code = '';
  try {
    const body = await req.json();
    code = typeof body?.code === 'string' ? body.code : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const identity = findByCode(code);
  if (!identity) {
    return NextResponse.json({ error: 'That code was not recognized. Please try again.' }, { status: 401 });
  }

  const group = getGroup(identity.groupId);
  if (!group) {
    return NextResponse.json({ error: 'Group not found.' }, { status: 500 });
  }

  const roster: RosterMember[] = [
    { name: group.lead.name, isLead: true },
    ...group.members.map((m) => ({ name: m.name, isLead: false })),
  ];

  return NextResponse.json({
    groupId: identity.groupId,
    groupName: identity.groupName,
    you: identity.name,
    isLead: identity.isLead,
    roster,
    tasks: TASKS.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      score: t.score,
    })),
  });
}
