'use client';

import { useEffect } from 'react';

export default function SuccessPage() {
  useEffect(() => {
    // MVP smoke test: log success after redirect
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checkout_succeeded', meta: { source: 'redirect' } }),
    }).catch(() => { });
  }, []);

  return (
    <main className="main-container relative overflow-hidden">
      <div className="max-w-2xl mx-auto glass-panel p-10 text-center animate-fade-in-up">
        <h1 className="text-3xl font-semibold mb-3">결제가 완료됐습니다</h1>
        <p className="text-gray-300 mb-6">
          Burnout Buddy AI가 이제 당신의 “전담 AI 코치”로 함께할게요.
        </p>
        <a className="btn-primary inline-block" href="/">
          홈으로 돌아가기
        </a>
      </div>
    </main>
  );
}

