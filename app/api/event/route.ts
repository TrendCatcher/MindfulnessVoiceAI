import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest, newUserId, setUserIdCookie } from '@/app/lib/identity';
import { logEvent, type EventType } from '@/app/lib/events';

export const runtime = 'nodejs';

type EventRequest = {
  type?: EventType;
  meta?: Record<string, unknown>;
};

const ALLOWED: Set<EventType> = new Set([
  'session_end',
  'checkout_clicked',
  'checkout_succeeded',
]);

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as EventRequest;
  const type = body.type;
  if (!type || !ALLOWED.has(type)) {
    return NextResponse.json({ error: 'invalid event type' }, { status: 400 });
  }

  const existingUid = getUserIdFromRequest(req);
  const uid = existingUid ?? newUserId();
  const now = Date.now();

  await logEvent({ ts: now, uid, type, meta: body.meta });

  const res = NextResponse.json({ ok: true });
  if (!existingUid) setUserIdCookie(res, uid);
  return res;
}

