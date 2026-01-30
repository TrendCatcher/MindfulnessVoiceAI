# Burnout Buddy AI (MVP)

2030 직장인을 위한 즉각적 AI 마음챙김 웹서비스 MVP.

## 핵심 플로우
- 랜딩(텍스트/음성 입력) → `/api/analyze` 감정/상황 분석 + 개인화 스크립트 생성
- 브라우저 TTS로 공감 보이스 재생(Web Speech Synthesis)
- 세션 종료 후 **$9.9/month** 결제 유도(Stripe Payment Link)
- `/admin`에서 **Retention / Conversion**만 확인

## 로컬 실행
1) 의존성 설치

```bash
npm install
```

2) 환경변수 설정
- `.env.example`을 복사해서 `.env.local`을 만들고 값 채우기

3) 개발 서버 실행

```bash
npm run dev
```

## 환경변수
- `STRIPE_PAYMENT_LINK_URL`: Stripe Dashboard에서 만든 Payment Link URL
- `ADMIN_KEY`: `/admin?key=...` 접근 키

## Stripe 설정(스모크 테스트)
Stripe Payment Link의 설정에서:
- After payment redirect URL: `http://localhost:3000/success`
- Cancel URL(선택): `http://localhost:3000/cancel`

> MVP에서는 빠른 검증을 위해 Payment Link를 사용합니다. Node/Stripe SDK 환경이 준비되면 Checkout Session + Webhook으로 전환 측정을 더 정확히 할 수 있습니다.

## 데이터 저장
개발/단일 인스턴스 MVP 기준으로 파일 기반 저장을 사용합니다.
- `data/memory.json`: 사용자 장기 기억(최근 대화, 스트레스 요인)
- `data/events.json`: 리텐션/전환 계산용 이벤트 로그

