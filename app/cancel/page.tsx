'use client';

export default function CancelPage() {
  return (
    <main className="main-container relative overflow-hidden">
      <div className="max-w-2xl mx-auto glass-panel p-10 text-center animate-fade-in-up">
        <h1 className="text-2xl font-semibold mb-3">결제가 취소되었습니다</h1>
        <p className="text-gray-300 mb-6">
          괜찮아요. 원하실 때 언제든 다시 시작할 수 있어요.
        </p>
        <a className="btn-primary inline-block" href="/">
          대화로 돌아가기
        </a>
      </div>
    </main>
  );
}

