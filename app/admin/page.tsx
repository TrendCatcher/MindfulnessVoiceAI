import { computeDashboardMetrics } from '@/app/lib/events';

export const runtime = 'nodejs';

function pct(n: number) {
  return `${Math.round(n * 1000) / 10}%`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const key = searchParams?.key ?? '';
  const adminKey = process.env.ADMIN_KEY ?? '';

  if (!adminKey || key !== adminKey) {
    return (
      <main className="main-container">
        <div className="max-w-2xl mx-auto glass-panel p-8 animate-fade-in-up">
          <h1 className="text-2xl font-semibold mb-2">Admin</h1>
          <p className="text-gray-400">
            접근이 제한되어 있습니다. `ADMIN_KEY`를 설정하고 `?key=...`로 접속하세요.
          </p>
        </div>
      </main>
    );
  }

  const m = await computeDashboardMetrics();

  return (
    <main className="main-container">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="glass-panel p-8 animate-fade-in-up">
          <h1 className="text-2xl font-semibold mb-1">Actionable Metrics</h1>
          <p className="text-gray-400 text-sm">Retention · Conversion only</p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-lg font-semibold mb-3">7일 리텐션</h2>
          <div className="text-gray-300 text-sm mb-2">
            코호트(첫 세션이 7~14일 전): {m.retention7d.cohortSize}명
          </div>
          <div className="text-gray-300 text-sm mb-2">
            재방문(최근 7일 내 세션): {m.retention7d.retained}명
          </div>
          <div className="text-white text-3xl font-semibold">
            {pct(m.retention7d.rate)}
          </div>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-lg font-semibold mb-3">7일 전환</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">세션 수</div>
              <div className="text-2xl text-white font-semibold">{m.conversion7d.sessions}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">Checkout 시작</div>
              <div className="text-2xl text-white font-semibold">{m.conversion7d.checkoutStarted}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">전환(결제 완료)</div>
              <div className="text-2xl text-white font-semibold">{m.conversion7d.checkoutSucceeded}</div>
            </div>
          </div>

          <div className="text-gray-300 text-sm mb-2">
            전환율(세션 대비): {pct(m.conversion7d.rateBySession)}
          </div>
          <div className="text-gray-300 text-sm">
            전환율(Checkout 시작 대비): {pct(m.conversion7d.rateByCheckoutStarted)}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            * MVP 스모크 테스트 기준. Payment Link 사용 시 “결제 완료 후 리디렉션”을 `/success`로 설정하면 전환 이벤트가 기록됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}

