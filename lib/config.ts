import type { CodeLookup, Group, Task } from './types';

/**
 * ============================================================================
 *  SCAVENGER HUNT CONTENT  —  edit everything in this file.
 * ============================================================================
 *  This is the ONLY place game content lives. Replace the SAMPLE data below
 *  with your real groups, members, codes and tasks before the retreat.
 *
 *  Rules:
 *   - Every `code` MUST be unique across ALL groups and people (leads + members).
 *   - Each group has exactly one `lead`. The lead is the ONLY person who can
 *     mark tasks as done. Members are view-only.
 *   - `tasks` are shared by every group; each task has a point `score`.
 *   - The admin password is NOT here — set it via the ADMIN_PASSWORD env var.
 * ============================================================================
 */

/** How long the hunt runs once started, in milliseconds (1 hour). */
export const GAME_DURATION_MS = 60 * 60 * 1000;

// The first person listed in each group is auto-assigned as the team lead, and is
// always part of (a member of) the group's roster.
// Codes follow the pattern SB-<group><member>, e.g. SB-101 (group 1, person 1).
export const GROUPS: Group[] = [
  {
    id: 'trailblazers',
    name: 'The Trailblazers',
    lead: { name: 'Cherish Ortswen', code: 'SB-101' },
    members: [
      { name: 'Winifred Aidelokhai', code: 'SB-102' },
      { name: 'Abolarinwa Mistura Ajoke', code: 'SB-103' },
      { name: 'Julian Oti', code: 'SB-104' },
      { name: 'Emmanuel Igunnu', code: 'SB-105' },
    ],
  },
  {
    id: 'pathfinders',
    name: 'The Pathfinders',
    lead: { name: 'Kelvin Esekhile', code: 'SB-201' },
    members: [
      { name: 'Ikem Kenechi', code: 'SB-202' },
      { name: 'Isaac Emmanuel', code: 'SB-203' },
      { name: 'Oluwadamilola Oluduro', code: 'SB-204' },
      { name: 'Olaleye-Ige Tomiwa', code: 'SB-205' },
    ],
  },
  {
    id: 'explorers',
    name: 'The Explorers',
    lead: { name: 'Patience Uka', code: 'SB-301' },
    members: [
      { name: 'Adesewa Oreniyi', code: 'SB-302' },
      { name: 'Hammed Akogun', code: 'SB-303' },
      { name: 'Manuchimso Oliver', code: 'SB-304' },
      { name: 'Seviyon Fatunji', code: 'SB-305' },
    ],
  },
  {
    id: 'navigators',
    name: 'The Navigators',
    lead: { name: 'Pius Oladoyin', code: 'SB-401' },
    members: [
      { name: 'Olasubomi Oduntan', code: 'SB-402' },
      { name: 'Zainab Giwa', code: 'SB-403' },
      { name: 'Tolu Daniel Adeyemi', code: 'SB-404' },
      { name: 'Makinde Akinola', code: 'SB-405' },
    ],
  },
  {
    id: 'voyagers',
    name: 'The Voyagers',
    lead: { name: 'Faith Ogechi Okpo', code: 'SB-501' },
    members: [
      { name: 'Agu Izunna Norbert', code: 'SB-502' },
      { name: 'Maxwell Michael Chibuike', code: 'SB-503' },
      { name: 'Omotola Shelle', code: 'SB-504' },
      { name: 'Yusuf Ajide', code: 'SB-505' },
    ],
  },
  {
    id: 'pioneers',
    name: 'The Pioneers',
    lead: { name: 'Ariyo Apakama', code: 'SB-601' },
    members: [
      { name: 'Esther Nigiwan', code: 'SB-602' },
      { name: 'Fidelis Nwaefuna', code: 'SB-603' },
      { name: 'Onyedikachi Nwabugwu', code: 'SB-604' },
      { name: 'Abdulmatin Sanni', code: 'SB-605' },
    ],
  },
  {
    id: 'adventurers',
    name: 'The Adventurers',
    lead: { name: 'Damilola Oyelere', code: 'SB-701' },
    members: [
      { name: 'Obanijesu Adeyemo', code: 'SB-702' },
      { name: 'Oladejo Romoke', code: 'SB-703' },
      { name: 'Kassim Eshemogie', code: 'SB-704' }
    ],
  },
];

export const TASKS: Task[] = [
  {
    id: 't1',
    category: 'PHOTO',
    title: 'Snap with the CEO',
    description: 'Get a fun photo with Mallick, make it memorable and unique!',
    score: 15,
  },
  {
    id: 't2',
    category: 'PHOTO',
    title: 'Snap with the CTO',
    description: 'Capture a photo with Kelechi.',
    score: 15,
  },
  {
    id: 't3',
    category: 'PHOTO',
    title: 'Find someone in a blue t-shirt',
    description: 'Track down a colleague rocking a blue tee and get a pic together.',
    score: 10,
  },
  {
    id: 't4',
    category: 'PHOTO',
    title: 'Team jumping shot',
    description: 'Get your entire team in the air at the same time. All feet off the ground!',
    score: 5,
  },
  {
    id: 't5',
    category: 'PHOTO',
    title: 'Recreate the company logo',
    description: 'Use your bodies or props to recreate the company logo in a photo.',
    score: 10,
  },
  {
    id: 't6',
    category: 'PHOTO',
    title: '5 departments, 1 photo',
    description: 'Get at least one person from 5 different departments in a single shot.',
    score: 5,
  },
  {
    id: 't7',
    category: 'AUTOGRAPH',
    title: 'Get Autographs',
    description: 'Collect autographs from 3 people outside your group!',
    score: 10,
  },
  {
    id: 't8',
    category: 'FIND',
    title: 'Hotel scavenger shot',
    description: 'Find and photograph a fire extinguisher.',
    score: 10,
  },
  {
    id: 't9',
    category: 'FIND',
    title: 'Picture by the pool',
    description: 'Take a cool picture by the pool — bonus point if it is with your sunglasses!',
    score: 10,
  },
  {
    id: 't10',
    category: 'FIND',
    title: 'Rainbow Objects',
    description: 'Find an object for every color of the rainbow and line them up and take their pictures',
    score: 10,
  },
];

// ---------------------------------------------------------------------------
//  Derived helpers (no need to edit below this line)
// ---------------------------------------------------------------------------

/** Total points available across all tasks. */
export const TOTAL_SCORE = TASKS.reduce((sum, t) => sum + t.score, 0);

/** Map of taskId -> score, for fast scoring. */
export const TASK_SCORE_BY_ID: Record<string, number> = Object.fromEntries(
  TASKS.map((t) => [t.id, t.score]),
);

/** Build a code -> identity lookup once at module load. */
export const CODE_INDEX: Record<string, CodeLookup> = (() => {
  const index: Record<string, CodeLookup> = {};
  for (const group of GROUPS) {
    const register = (person: { name: string; code: string }, isLead: boolean) => {
      const key = person.code.trim().toUpperCase();
      index[key] = { groupId: group.id, groupName: group.name, name: person.name, isLead };
    };
    register(group.lead, true);
    group.members.forEach((m) => register(m, false));
  }
  return index;
})();

/** Look up a participant by their entered code (case-insensitive). */
export function findByCode(code: string): CodeLookup | null {
  if (!code) return null;
  return CODE_INDEX[code.trim().toUpperCase()] ?? null;
}

/** Get a group by id. */
export function getGroup(groupId: string): Group | undefined {
  return GROUPS.find((g) => g.id === groupId);
}
