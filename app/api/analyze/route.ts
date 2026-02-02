import { NextResponse, type NextRequest } from 'next/server';
import { analyzeText, buildPersonalizedScript } from '@/app/lib/analyze';
import { getUserIdFromRequest, newUserId, setUserIdCookie } from '@/app/lib/identity';
import { addUniqueStressors, getUserMemory, upsertUserMemory } from '@/app/lib/memory';
import { logEvent } from '@/app/lib/events';

export const runtime = 'nodejs';

type AnalyzeRequest = {
  text?: string;
  name?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as AnalyzeRequest;
  const text = (body.text ?? '').trim();

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const existingUid = getUserIdFromRequest(req);
  const uid = existingUid ?? newUserId();

  const memory = await getUserMemory(uid);
  const analysis = analyzeText(text);

  const nameFromReq = (body.name ?? '').trim() || undefined;
  const name =
    nameFromReq ??
    memory.profile.name ??
    analysis.inferredName ??
    undefined;

  const lastMemoryNudge =
    memory.stressors[0] ??
    memory.turns.at(-1)?.extractedStressors?.[0] ??
    undefined;

  const script = buildPersonalizedScript({
    name,
    text,
    analysis,
    lastMemoryNudge,
  });

  const now = Date.now();

  await upsertUserMemory(uid, (m) => {
    const nextStressors = addUniqueStressors(m.stressors, analysis.stressors);
    const nextTurns = [
      ...m.turns,
      {
        ts: now,
        userText: text,
        aiText: script.replyText,
        emotion: analysis.emotion,
        situation: analysis.situation,
        extractedStressors: analysis.stressors,
      },
    ].slice(-30);

    return {
      ...m,
      lastSeenAt: now,
      profile: { ...m.profile, ...(name ? { name } : {}) },
      stressors: nextStressors,
      turns: nextTurns,
    };
  });

  await logEvent({
    ts: now,
    uid,
    type: 'session_start',
    meta: { emotion: analysis.emotion, situation: analysis.situation },
  });

  const res = NextResponse.json({
    reply: script.replyText,
    voiceText: script.voiceText,
    meditation: script.meditationText,
    tags: script.tags,
    offer: { priceUsdMonthly: 9.9, cta: '전담 AI 코치와 무제한 대화하기' },
  });

  if (!existingUid) setUserIdCookie(res, uid);
  return res;
}

