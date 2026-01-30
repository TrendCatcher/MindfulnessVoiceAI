import { readJsonFile, writeJsonFile } from '@/app/lib/storage';

export type EventType =
  | 'session_start'
  | 'session_end'
  | 'checkout_clicked'
  | 'checkout_started'
  | 'checkout_succeeded';

export type AnalyticsEvent = {
  ts: number;
  uid: string;
  type: EventType;
  meta?: Record<string, unknown>;
};

type EventsDb = {
  version: 1;
  events: AnalyticsEvent[];
};

const EVENTS_FILE = 'events.json';

function emptyDb(): EventsDb {
  return { version: 1, events: [] };
}

export async function logEvent(event: AnalyticsEvent) {
  const db = await readJsonFile<EventsDb>(EVENTS_FILE, emptyDb());
  db.events.push(event);
  // keep size bounded for MVP
  if (db.events.length > 50_000) {
    db.events.splice(0, db.events.length - 50_000);
  }
  await writeJsonFile(EVENTS_FILE, db);
}

export async function listEvents(): Promise<AnalyticsEvent[]> {
  const db = await readJsonFile<EventsDb>(EVENTS_FILE, emptyDb());
  return db.events;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.getTime();
}

export type DashboardMetrics = {
  retention7d: { cohortSize: number; retained: number; rate: number };
  conversion7d: {
    sessions: number;
    checkoutStarted: number;
    checkoutSucceeded: number;
    rateBySession: number;
    rateByCheckoutStarted: number;
  };
};

export async function computeDashboardMetrics(): Promise<DashboardMetrics> {
  const events = await listEvents();

  const firstSessionByUid = new Map<string, number>();
  const sessionDaysByUid = new Map<string, Set<number>>();

  let sessions7d = 0;
  let checkoutStarted7d = 0;
  let checkoutSucceeded7d = 0;

  const windowStart = daysAgo(7);
  const now = Date.now();

  for (const e of events) {
    if (e.type === 'session_start') {
      if (!firstSessionByUid.has(e.uid)) firstSessionByUid.set(e.uid, e.ts);
      const day = startOfDay(e.ts);
      const set = sessionDaysByUid.get(e.uid) ?? new Set<number>();
      set.add(day);
      sessionDaysByUid.set(e.uid, set);
      if (e.ts >= windowStart && e.ts <= now) sessions7d += 1;
    }
    if (e.type === 'checkout_started' && e.ts >= windowStart && e.ts <= now) checkoutStarted7d += 1;
    if (e.type === 'checkout_succeeded' && e.ts >= windowStart && e.ts <= now) checkoutSucceeded7d += 1;
  }

  // 7-day retention: cohort = first session was 7~14 days ago, retained = had session in last 7 days
  const cohortStart = daysAgo(14);
  const cohortEnd = daysAgo(7);
  let cohortSize = 0;
  let retained = 0;

  for (const [uid, firstTs] of firstSessionByUid.entries()) {
    if (firstTs > cohortStart && firstTs <= cohortEnd) {
      cohortSize += 1;
      const days = sessionDaysByUid.get(uid) ?? new Set<number>();
      // retained if user had any session day in last 7 days (not necessarily different day logic; cohort already excludes new users)
      for (const d of days) {
        if (d >= cohortEnd) {
          retained += 1;
          break;
        }
      }
    }
  }

  const retentionRate = cohortSize === 0 ? 0 : retained / cohortSize;
  const rateBySession = sessions7d === 0 ? 0 : checkoutSucceeded7d / sessions7d;
  const rateByCheckout = checkoutStarted7d === 0 ? 0 : checkoutSucceeded7d / checkoutStarted7d;

  return {
    retention7d: { cohortSize, retained, rate: retentionRate },
    conversion7d: {
      sessions: sessions7d,
      checkoutStarted: checkoutStarted7d,
      checkoutSucceeded: checkoutSucceeded7d,
      rateBySession,
      rateByCheckoutStarted: rateByCheckout,
    },
  };
}

