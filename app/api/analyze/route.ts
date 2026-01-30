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

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { text } = body;

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Analyzing text:", text);

    return NextResponse.json({
        sentiment: "Stress Detected",
        reply: "정말 힘드셨겠어요. 상사의 피드백이 단순히 업무에 대한 것이 아니라 인격적인 비난처럼 느껴지면 누구나 자존감이 떨어질 수 있습니다. 하지만 그 피드백이 당신의 가치를 정의하지 않는다는 걸 기억하세요.",
        action: "breathing_exercise"
    });
}
