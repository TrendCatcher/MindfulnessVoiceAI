export type Situation =
  | 'MEETING'
  | 'OVERTIME'
  | 'BOSS_CONFLICT'
  | 'DEADLINE'
  | 'TEAM_CONFLICT'
  | 'PERFORMANCE_REVIEW'
  | 'GENERAL';

export type Emotion =
  | 'ANXIETY'
  | 'ANGER'
  | 'SADNESS'
  | 'SHAME'
  | 'BURNOUT'
  | 'OVERWHELM'
  | 'NEUTRAL';

export type AnalysisResult = {
  emotion: Emotion;
  situation: Situation;
  stressors: string[];
  inferredName?: string;
};

function scoreByKeywords(text: string, keywords: string[]) {
  let score = 0;
  for (const k of keywords) {
    if (text.includes(k)) score += 1;
  }
  return score;
}

export function analyzeText(textRaw: string): AnalysisResult {
  const text = (textRaw ?? '').trim();

  const emotionScores: Array<[Emotion, number]> = [
    ['ANXIETY', scoreByKeywords(text, ['불안', '긴장', '초조', '걱정', '두려', '무섭'])],
    ['ANGER', scoreByKeywords(text, ['화', '짜증', '분노', '열받', '억울', '빡치', '미치겠'])],
    ['SADNESS', scoreByKeywords(text, ['슬프', '우울', '눈물', '서럽', '허무', '외롭', '무기력'])],
    ['SHAME', scoreByKeywords(text, ['자존감', '창피', '무시', '모욕', '비난', '면박', '비참'])],
    ['BURNOUT', scoreByKeywords(text, ['번아웃', '소진', '탈진', '지쳤', '에너지가', '의욕이', '아무것도 하기 싫'])],
    ['OVERWHELM', scoreByKeywords(text, ['감당', '과부하', '너무 많', '벅차', '숨이 막', '압박'])],
  ];

  emotionScores.sort((a, b) => b[1] - a[1]);
  const topEmotion = emotionScores[0]?.[1] ? emotionScores[0][0] : 'NEUTRAL';

  const situationScores: Array<[Situation, number]> = [
    ['MEETING', scoreByKeywords(text, ['회의', '미팅', '발표', '보고', '주간', '데일리'])],
    ['OVERTIME', scoreByKeywords(text, ['야근', '밤샘', '주말근무', '퇴근', '새벽'])],
    ['BOSS_CONFLICT', scoreByKeywords(text, ['상사', '팀장', '부장', '피드백', '지적', '갈굼'])],
    ['DEADLINE', scoreByKeywords(text, ['마감', '데드라인', '기한', '오늘까지', '내일까지', '급해'])],
    ['TEAM_CONFLICT', scoreByKeywords(text, ['동료', '팀원', '협업', '갈등', '눈치', '소통', '따돌림'])],
    ['PERFORMANCE_REVIEW', scoreByKeywords(text, ['평가', '성과', '인사', '연봉', '승진', 'OKR', 'KPI'])],
  ];
  situationScores.sort((a, b) => b[1] - a[1]);
  const topSituation = situationScores[0]?.[1] ? situationScores[0][0] : 'GENERAL';

  const stressors: string[] = [];
  for (const k of ['상사', '피드백', '야근', '회의', '마감', '성과', '동료', '협업', '자존감', '번아웃']) {
    if (text.includes(k)) stressors.push(k);
  }

  const inferredName =
    text.match(/내\s*이름은\s*([가-힣]{2,6})/)?.[1] ??
    text.match(/저는\s*([가-힣]{2,6})\s*이고/)?.[1] ??
    text.match(/나는\s*([가-힣]{2,6})\s*(이야|입니다|야)/)?.[1] ??
    undefined;

  return {
    emotion: topEmotion,
    situation: topSituation,
    stressors: Array.from(new Set(stressors)).slice(0, 6),
    inferredName,
  };
}

function koEmotionLabel(e: Emotion) {
  switch (e) {
    case 'ANXIETY':
      return '불안/긴장';
    case 'ANGER':
      return '분노/짜증';
    case 'SADNESS':
      return '우울/슬픔';
    case 'SHAME':
      return '자존감 저하/수치심';
    case 'BURNOUT':
      return '소진/번아웃';
    case 'OVERWHELM':
      return '압박/과부하';
    default:
      return '복합 감정';
  }
}

function koSituationLabel(s: Situation) {
  switch (s) {
    case 'MEETING':
      return '회의/발표 상황';
    case 'OVERTIME':
      return '야근/과로 상황';
    case 'BOSS_CONFLICT':
      return '상사와의 갈등/피드백 상황';
    case 'DEADLINE':
      return '마감/데드라인 상황';
    case 'TEAM_CONFLICT':
      return '동료/팀 갈등 상황';
    case 'PERFORMANCE_REVIEW':
      return '성과/평가 압박 상황';
    default:
      return '업무 스트레스 상황';
  }
}

export type Script = {
  replyText: string;
  voiceText: string;
  meditationText: string;
  tags: { emotionLabel: string; situationLabel: string };
  resilienceScore?: number;
};

export function buildPersonalizedScript(args: {
  name?: string;
  text: string;
  analysis: AnalysisResult;
  lastMemoryNudge?: string;
}): Script {
  const { name, text, analysis, lastMemoryNudge } = args;

  const who = name ? `${name}님` : '당신';
  const emotionLabel = koEmotionLabel(analysis.emotion);

  // 상황별 공감 멘트 (더 부드럽고 수용적인 톤)
  let situationValidation = '';
  switch (analysis.situation) {
    case 'BOSS_CONFLICT':
      situationValidation = `누구보다 잘하고 싶었던 마음, 제가 다 알아요. 그 마음이 상처받지 않게 잠시 안아줄게요.`;
      break;
    case 'OVERTIME':
      situationValidation = `오늘 하루도 정말 치열하게 버티셨군요. 당신의 에너지는 무한하지 않아요. 지금은 오직 '휴식'만 생각해도 괜찮아요.`;
      break;
    case 'DEADLINE':
      situationValidation = `쫓기는 기분, 심장이 뛰는 그 느낌... 알아요. 하지만 ${who}, 당신의 존재 가치는 속도에 있지 않아요.`;
      break;
    default:
      situationValidation = `지금 겪고 있는 ${emotionLabel}, 혼자 감당하기엔 너무 무거운 짐이었을 거예요.`;
  }

  const memoryLine = lastMemoryNudge
    ? `\n\n지난번의 “${lastMemoryNudge}”도 여전히 마음에 남아 계신가요? 오늘은 그 짐도 잠시 내려놓아요.`
    : '';

  const validate = `${who}, 지금 느끼는 “${emotionLabel}”의 감정... 이건 당신이 약해서가 아니라, 지금까지 너무 애써왔다는 증거예요. ${situationValidation}`;
  const reflect = `말해주신 이야기(“${text}”) 속에서, 저는 당신의 외로움과 간절함을 느꼈어요. 이제 더 이상 혼자 삼키지 마세요. 제가 곁에 있을게요.`.trim();
  const reframe = `지금 필요한 건 해결책이 아니에요. 그저 '나'를 위한 따뜻한 위로입니다. 당신은 이미 충분합니다. ${memoryLine}`;

  const meditation = [
    `1분 치유 호흡 (Healing Breath)`,
    `- 0:00~0:15: 가슴에 손을 얹고, 심장 소리를 느껴보세요.`,
    `- 0:15~0:35: 들이마시는 숨에 "감사합니다", 내쉬는 숨에 "사랑합니다"라고 말해보세요.`,
    `- 0:35~0:55: 내 몸을 따뜻한 빛이 감싸 안는다고 상상하세요.`,
    `- 0:55~1:00: 당신은 사랑받기 위해 태어난 사람입니다. 이 사실을 잊지 마세요.`,
  ].join('\n');

  const replyText = [validate, reflect, reframe].filter(Boolean).join('\n\n');
  const voiceText = `${validate} ${reflect} ${reframe} 이제 저와 함께, 아주 잠깐 마음의 쉼표를 찍어볼까요? ${meditation.replaceAll('\n', ' ')}`;

  // Resilience Score Calculation (0-100)
  // Higher score = Lower emotional severity
  const severity = EMOTION_SEVERITY[analysis.emotion] ?? 5;
  const resilienceScore = Math.max(0, 100 - (severity * 10));

  // Micro-Action for High Burnout
  let finalMeditation = meditation;
  let finalVoiceText = voiceText;

  if (analysis.emotion === 'BURNOUT' || analysis.emotion === 'OVERWHELM') {
    const microAction = [
      `🚨 긴급 회복 가이드 (Micro-Action)`,
      `- 지금 당장 1분만, 아무것도 하지 말고 숨만 쉬세요.`,
      `- 4초간 들이마시고, 4초간 멈추고, 4초간 내뱉으세요.`,
      `- 머리를 비우려 하지 마세요. 그냥 숨이 들어오고 나가는 것만 지켜보세요.`,
    ].join('\n');

    finalMeditation = microAction;
    finalVoiceText = `${validate} ${reflect} ${reframe} 지금은 긴 명상도 사치일 수 있어요. 딱 1분만, 저랑 같이 숨만 쉬어봐요. ${microAction.replaceAll('\n', ' ')}`;
  }

  return {
    replyText,
    voiceText: finalVoiceText,
    meditationText: finalMeditation,
    tags: { emotionLabel: koEmotionLabel(analysis.emotion), situationLabel: koSituationLabel(analysis.situation) },
    resilienceScore,
  };
}

// Helper to access severity from outside if needed (duplicate from events.ts or move to shared)
const EMOTION_SEVERITY: Record<string, number> = {
  BURNOUT: 10,
  OVERWHELM: 9,
  ANXIETY: 8,
  ANGER: 7,
  SADNESS: 6,
  SHAME: 5,
  NEUTRAL: 2,
};

