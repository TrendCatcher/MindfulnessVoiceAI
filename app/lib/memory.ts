import { readJsonFile, writeJsonFile } from '@/app/lib/storage';

export type MemoryTurn = {
  ts: number;
  userText: string;
  aiText: string;
  emotion: string;
  situation: string;
  extractedStressors: string[];
};

export type UserMemory = {
  uid: string;
  createdAt: number;
  lastSeenAt: number;
  profile: {
    name?: string;
  };
  stressors: string[];
  turns: MemoryTurn[];
};

type MemoryDb = {
  version: 1;
  users: Record<string, UserMemory>;
};

const MEMORY_FILE = 'memory.json';

function emptyDb(): MemoryDb {
  return { version: 1, users: {} };
}

export async function getUserMemory(uid: string): Promise<UserMemory> {
  const db = await readJsonFile<MemoryDb>(MEMORY_FILE, emptyDb());
  const existing = db.users[uid];
  if (existing) return existing;

  const now = Date.now();
  const created: UserMemory = {
    uid,
    createdAt: now,
    lastSeenAt: now,
    profile: {},
    stressors: [],
    turns: [],
  };

  db.users[uid] = created;
  await writeJsonFile(MEMORY_FILE, db);
  return created;
}

export async function upsertUserMemory(uid: string, patcher: (mem: UserMemory) => UserMemory) {
  const db = await readJsonFile<MemoryDb>(MEMORY_FILE, emptyDb());
  const base = db.users[uid] ?? (await getUserMemory(uid));
  const next = patcher({ ...base });
  db.users[uid] = next;
  await writeJsonFile(MEMORY_FILE, db);
  return next;
}

export function addUniqueStressors(existing: string[], incoming: string[]) {
  const set = new Set(existing);
  for (const s of incoming) {
    const t = s.trim();
    if (!t) continue;
    if (t.length > 60) continue;
    set.add(t);
  }
  return Array.from(set).slice(0, 30);
}

