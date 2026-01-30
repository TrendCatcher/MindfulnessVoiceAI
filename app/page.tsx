'use client';

import { useState } from 'react';

type AnalyzeResponse = {
    reply: string;
    voiceText: string;
    meditation: string;
    tags: { emotionLabel: string; situationLabel: string };
    offer: { priceUsdMonthly: number; cta: string };
};

declare global {
    interface Window {
        webkitSpeechRecognition?: any;
        SpeechRecognition?: any;
    }
}

export default function Home() {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'ANALYZING' | 'SPEAKING'>('IDLE');
    const [aiResponse, setAiResponse] = useState<AnalyzeResponse | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const speak = (text: string) => {
        if (typeof window === 'undefined') return;
        if (!('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'ko-KR';
            utter.rate = 1.02;
            utter.pitch = 1.0;
            // Prefer Korean voice when available
            const voices = window.speechSynthesis.getVoices();
            const ko = voices.find((v) => (v.lang || '').toLowerCase().startsWith('ko'));
            if (ko) utter.voice = ko;
            window.speechSynthesis.speak(utter);
        } catch (e) {
            console.error(e);
        }
    };

    const startVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('이 브라우저는 음성 입력(Web Speech Recognition)을 지원하지 않습니다. 텍스트로 입력해 주세요.');
            return;
        }

        setError(null);
        const rec = new SpeechRecognition();
        rec.lang = 'ko-KR';
        rec.interimResults = true;
        rec.continuous = false;

        rec.onstart = () => setIsRecording(true);
        rec.onerror = (evt: any) => {
            console.error(evt);
            setIsRecording(false);
            setError('음성 인식에 문제가 발생했어요. 다시 시도해 주세요.');
        };
        rec.onend = () => setIsRecording(false);
        rec.onresult = (evt: any) => {
            const result = Array.from(evt.results)
                .map((r: any) => r[0]?.transcript ?? '')
                .join('');
            setInput(result);
        };

        rec.start();
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;

        setStatus('ANALYZING');
        setError(null);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input }),
            });
            const data = (await res.json()) as AnalyzeResponse;
            if (!res.ok) throw new Error((data as any)?.error ?? 'analyze failed');

            // "Thinking" effect
            setTimeout(() => {
                setAiResponse(data);
                setStatus('SPEAKING');
                speak(data.voiceText);
            }, 900);

        } catch (e) {
            console.error(e);
            setError('분석에 실패했어요. 잠시 후 다시 시도해 주세요.');
            setStatus('IDLE');
        }
    };

    const endSession = async () => {
        try {
            await fetch('/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'session_end' }),
            });
        } catch { }
        window.speechSynthesis?.cancel?.();
        setAiResponse(null);
        setInput('');
        setStatus('IDLE');
    };

    const startCheckout = async () => {
        try {
            await fetch('/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'checkout_clicked' }),
            });
        } catch { }

        const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: 'monthly' }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError('결제 페이지 생성에 실패했어요. Stripe 키 설정을 확인해 주세요.');
            return;
        }
        if (data?.url) window.location.href = data.url;
    };

    return (
        <main className="main-container relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-900 blur-[100px]"></div>
            </div>

            {status === 'IDLE' && (
                <div className="hero-section max-w-2xl mx-auto flex flex-col items-center animate-fade-in">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-center">
                        <span className="text-gradient">Software becomes labor.</span><br />
                        <span className="text-white text-4xl md:text-5xl mt-2 block font-medium">당신의 번아웃을 치유합니다.</span>
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl text-center mb-10 leading-relaxed">
                        상사의 무리한 피드백, 끝없는 야근, 관계의 피로...<br />
                        지금 겪고 있는 스트레스를 털어놓으세요.<br />
                        AI 전문 심리 코치가 실시간으로 듣고 위로해드립니다.
                    </p>

                    <div className="w-full glass-panel p-6 flex flex-col gap-4">
                        <textarea
                            className="w-full bg-transparent border-none text-white text-lg resize-none focus:ring-0 placeholder-gray-600 h-32"
                            placeholder="예: 오늘 회의에서 내 의견이 묵살당해서 너무 비참했어..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <div className="flex justify-between items-center border-t border-gray-800 pt-4">
                            <button
                                onClick={startVoiceInput}
                                className="text-gray-400 hover:text-white transition-colors"
                                disabled={isRecording}
                            >
                                {isRecording ? '🎙️ 듣는 중...' : '🎤 음성으로 말하기'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn-primary"
                                disabled={!input.trim()}
                            >
                                상담 시작하기
                            </button>
                        </div>
                        {error && (
                            <p className="text-sm text-red-300">{error}</p>
                        )}
                    </div>
                </div>
            )}

            {status === 'ANALYZING' && (
                <div className="flex flex-col items-center justify-center h-[50vh] animate-pulse-slow">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-xl mb-8 animate-pulse"></div>
                    <h2 className="text-2xl font-light text-white">당신의 감정을 분석하고 있습니다...</h2>
                    <p className="text-gray-500 mt-2">심리학적 프롬프트 적용 중</p>
                </div>
            )}

            {status === 'SPEAKING' && aiResponse && (
                <div className="max-w-2xl w-full mx-auto glass-panel p-8 flex flex-col items-center text-center animate-fade-in-up">
                    <div className="w-32 h-32 rounded-full border-2 border-purple-500 flex items-center justify-center mb-6 relative">
                        <div className="absolute w-full h-full rounded-full border-2 border-purple-500 animate-ping opacity-20"></div>
                        <span className="text-4xl">🧘</span>
                    </div>

                    <h3 className="text-xl text-purple-400 mb-2 font-medium">Burnout Buddy's Reply</h3>
                    <p className="text-sm text-gray-400 mb-6">{aiResponse.tags.situationLabel} · {aiResponse.tags.emotionLabel}</p>

                    <p className="text-white text-lg leading-relaxed mb-6 whitespace-pre-line">
                        {aiResponse.reply}
                    </p>

                    <div className="w-full text-left bg-black/30 rounded-2xl p-5 mb-6 border border-white/10">
                        <div className="text-xs text-gray-400 mb-2">1분 명상 가이드</div>
                        <div className="text-sm text-gray-200 whitespace-pre-line">{aiResponse.meditation}</div>
                    </div>

                    <div className="w-full bg-gray-900 rounded-full h-12 flex items-center px-4 mb-4">
                        <span className="text-xs text-gray-500">▶ 0:00 / 1:00</span>
                        {/* Fake Progress Bar */}
                        <div className="flex-1 mx-4 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="w-1/3 h-full bg-purple-500"></div>
                        </div>
                        <button
                            onClick={() => speak(aiResponse.voiceText)}
                            className="text-xs text-gray-300 hover:text-white"
                        >
                            다시 듣기
                        </button>
                    </div>

                    <button
                        onClick={startCheckout}
                        className="btn-primary w-full mb-4"
                    >
                        {aiResponse.offer.cta} (${aiResponse.offer.priceUsdMonthly}/month)
                    </button>

                    <button
                        onClick={endSession}
                        className="text-gray-400 hover:text-white underline text-sm"
                    >
                        새로운 대화 시작하기
                    </button>
                </div>
            )}

            <footer className="fixed bottom-4 text-center w-full text-xs text-gray-700 pointer-events-none">
                © 2030 Burnout Buddy MVP. Early Access.
            </footer>
        </main>
    );
}
