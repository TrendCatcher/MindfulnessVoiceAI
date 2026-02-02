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

// ============================================
// Burnout Metrics - 번아웃 감소 지표
// ============================================

// 감정 심각도 점수 (높을수록 심각)
const EMOTION_SEVERITY: Record<string, number> = {
  BURNOUT: 10,
  OVERWHELM: 9,
  ANXIETY: 8,
  ANGER: 7,
  SADNESS: 6,
  SHAME: 5,
  NEUTRAL: 2,
};

export type BurnoutMetrics = {
  avgEmotionImprovement: number; // 감정 개선율 (0~1)
  emotionDistribution: Record<string, number>; // 감정별 세션 수
  sessionCompletionRate: number; // 세션 완료율
  totalSessions: number;
  uniqueUsers: number;
  avgSessionsPerUser: number;
};

export async function computeBurnoutMetrics(): Promise<BurnoutMetrics> {
  const events = await listEvents();

  // 감정 분포 집계
  const emotionDistribution: Record<string, number> = {};

  // 사용자별 첫 세션과 마지막 세션 감정 추적
  const userFirstEmotion = new Map<string, { ts: number; emotion: string }>();
  const userLatestEmotion = new Map<string, { ts: number; emotion: string }>();

  let sessionStarts = 0;
  let sessionEnds = 0;
  const uniqueUsers = new Set<string>();

  for (const e of events) {
    if (e.type === 'session_start') {
      sessionStarts += 1;
      uniqueUsers.add(e.uid);

      const emotion = (e.meta?.emotion as string) ?? 'NEUTRAL';

      // 감정 분포 집계
      emotionDistribution[emotion] = (emotionDistribution[emotion] ?? 0) + 1;

      // 첫 세션 감정 기록
      const firstRecord = userFirstEmotion.get(e.uid);
      if (!firstRecord || e.ts < firstRecord.ts) {
        userFirstEmotion.set(e.uid, { ts: e.ts, emotion });
      }

      // 최신 세션 감정 기록
      const latestRecord = userLatestEmotion.get(e.uid);
      if (!latestRecord || e.ts > latestRecord.ts) {
        userLatestEmotion.set(e.uid, { ts: e.ts, emotion });
      }
    }

    if (e.type === 'session_end') {
      sessionEnds += 1;
    }
  }

  // 감정 개선율 계산 (첫 세션 vs 마지막 세션)
  let totalImprovement = 0;
  let usersWithMultipleSessions = 0;

  for (const [uid, first] of userFirstEmotion.entries()) {
    const latest = userLatestEmotion.get(uid);
    if (!latest || first.ts === latest.ts) continue; // 세션이 하나뿐인 사용자 제외

    usersWithMultipleSessions += 1;
    const firstSeverity = EMOTION_SEVERITY[first.emotion] ?? 5;
    const latestSeverity = EMOTION_SEVERITY[latest.emotion] ?? 5;

    // 심각도 감소 = 개선 (정규화: 10점 만점 기준)
    const improvement = (firstSeverity - latestSeverity) / 10;
    totalImprovement += improvement;
  }

  const avgEmotionImprovement = usersWithMultipleSessions > 0
    ? Math.max(0, Math.min(1, (totalImprovement / usersWithMultipleSessions + 0.5))) // 0~1 범위로 정규화
    : 0;

  // 세션 완료율
  const sessionCompletionRate = sessionStarts > 0
    ? sessionEnds / sessionStarts
    : 0;

  // 사용자당 평균 세션 수
  const avgSessionsPerUser = uniqueUsers.size > 0
    ? sessionStarts / uniqueUsers.size
    : 0;

  return {
    avgEmotionImprovement,
    emotionDistribution,
    sessionCompletionRate,
    totalSessions: sessionStarts,
    uniqueUsers: uniqueUsers.size,
    avgSessionsPerUser,
  };
}
