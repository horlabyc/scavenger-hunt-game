export type GameStatus = 'not_started' | 'running' | 'stopped';

export interface Person {
  name: string;
  code: string;
}

export interface Group {
  id: string;
  name: string;
  lead: Person;
  members: Person[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  score: number;
}

export interface CodeLookup {
  groupId: string;
  groupName: string;
  name: string;
  isLead: boolean;
}

export interface GameStateDoc {
  _id: string;
  status: GameStatus;
  startedAt: Date | null;
}

export interface ProgressDoc {
  _id: string; // groupId
  completedTaskIds: string[];
  /** Map of taskId -> when that task was marked done. */
  completedAtById?: Record<string, Date>;
  updatedAt: Date;
  /** When this group finished ALL tasks (null until/unless fully complete). */
  completedAt?: Date | null;
}

/** A roster entry as returned to the client (no codes leaked). */
export interface RosterMember {
  name: string;
  isLead: boolean;
}
