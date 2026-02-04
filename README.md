# Burnout Buddy AI (MVP)

2030 직장인을 위한 즉각적 AI 마음챙김 웹서비스 MVP. 사용자의 감정을 분석하고 개인화된 마음챙김 스크립트를 생성하여 음성으로 제공합니다.

---

## 🚀 Tech Stack

### Frontend / Framework
- **Next.js 14 (App Router)**: 고성능 React 프레임워크
- **React 18**: 사용자 인터페이스 구축
- **TypeScript**: 정적 타이핑을 통한 코드 안정성 확보

### UI / Styling
- **Mantine UI (v8)**: 모던한 React 컴포넌트 라이브러리
- **PostCSS**: Mantine과 최적화된 스타일링 환경
- **Recharts**: 데이터 시각화 (Admin 대시보드 사용)

### Features & Integrations
- **Web Speech API (TTS)**: 브라우저 기본 음성 합성 기술 활용
- **Stripe**: Payment Links를 통한 빠른 결제 구현
- **File-based DB**: MVP 단계를 위한 로컬 JSON 데이터 관리 (`data/`)

---

## ✨ 핵심 기능 (Core Features)

1.  **AI 감정 분석 & 스크립트 생성**: 사용자의 텍스트/음성 입력을 분석하여 맞춤형 명상/위로 스크립트 생성 (`/api/analyze`)
2.  **공감 보이스 (TTS)**: 생성된 스크립트를 따뜻한 목소리로 재생
3.  **수익화 모델**: 세션 종료 후 **$9.9/month** 구독 결제 유도 (Stripe)
4.  **Admin 대시보드**: Retention 및 Conversion 지표 확인 (`/admin`)

---

## 📂 프로젝트 구조 (Project Structure)

```text
/app
  ├── /admin       - 관리자 대시보드
  ├── /api         - 감정 분석 및 데이터 처리 API
  ├── /lib         - 공통 유틸리티 및 데이터 접근 로직
  └── page.tsx     - 서비스 메인 랜딩 (분석/재생)
/data
  ├── memory.json  - 사용자 대화 내역 및 스트레스 요인 데이터
  └── events.json  - 로그 및 분석용 서비스 이벤트 데이터
/scripts           - 프로젝트 관리 및 유틸리티 스크립트
```

---

## 🛠️ 로컬 실행 방법

1.  **의존성 설치**
    ```bash
    npm install
    ```

2.  **환경변수 설정**
    - `.env.example`을 복사하여 `.env.local` 생성 후 필수 값 (`STRIPE_PAYMENT_LINK_URL`, `ADMIN_KEY`) 입력

3.  **개발 서버 실행**
    ```bash
    npm run dev
    ```

---

## 📈 데이터 저장 방식

MVP 단계에서는 개발 속도와 단순함을 위해 파일 기반 저장을 사용합니다.
- `data/memory.json`: 최근 대화, 스트레스 요인 등 사용자별 기록
- `data/events.json`: 리텐션/전환 지표 측정을 위한 이벤트 로그

