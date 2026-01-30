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
  const situationLabel = koSituationLabel(analysis.situation);

  const memoryLine = lastMemoryNudge
    ? `그리고 ${who}, 지난번에 말씀하신 “${lastMemoryNudge}”도 계속 마음에 남아 있었겠어요.`
    : '';

  const validate = `${who}, 지금 느끼는 감정은 “${emotionLabel}”에 가까워 보여요. ${situationLabel}에서 이런 마음이 드는 건 아주 자연스러운 반응이에요.`;
  const reflect = `말해주신 내용(“${text}”)을 보면, 단순히 힘든 게 아니라 ‘내가 충분하지 않다’는 느낌까지 같이 올라왔을 수 있어요. ${memoryLine}`.trim();
  const reframe = `지금 이 순간에 필요한 건 문제를 ‘즉시 해결’하는 힘이 아니라, 내 마음을 다시 안전한 곳으로 데려오는 짧은 회복이에요.`;

  const meditation = [
    `1분 마음챙김(가이드)`,
    `- 0:00~0:15: 어깨 힘을 10%만 풀고, 숨을 코로 천천히 들이마셔요.`,
    `- 0:15~0:35: 들숨에 “괜찮아”, 날숨에 “놓아도 돼”라고 마음속으로 말해요.`,
    `- 0:35~0:55: 지금 몸에서 가장 긴장된 곳(턱/목/가슴)을 찾아, 그 부위에 숨을 보내요.`,
    `- 0:55~1:00: 마지막으로 한 문장만. “나는 지금 최선을 다하고 있고, 잠깐 쉬어갈 자격이 있다.”`,
  ].join('\n');

  const replyText = [validate, reflect, reframe].filter(Boolean).join('\n\n');
  const voiceText = `${validate} ${reflect} ${reframe} 이제 1분만 같이 호흡해볼까요? ${meditation.replaceAll('\n', ' ')}`;

  return {
    replyText,
    voiceText,
    meditationText: meditation,
    tags: { emotionLabel, situationLabel },
  };
}

