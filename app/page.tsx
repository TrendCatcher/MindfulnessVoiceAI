'use client';

import { useState } from 'react';
import {
    Container,
    Center,
    Stack,
    Paper,
    Title,
    Text,
    Button,
    Textarea,
    Group,
    Box,
    Loader,
    ActionIcon,
    Progress,
} from '@mantine/core';

type AnalyzeResponse = {
    reply: string;
    voiceText: string;
    meditation: string;
    tags: { emotionLabel: string; situationLabel: string };
    offer: { priceUsdMonthly: number; cta: string };
    resilienceScore?: number;
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
            utter.rate = 0.85; // slower
            utter.pitch = 0.9; // deeper/calmer
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
        <>
            {/* Background Ambient Effects */}
            <div className="background-ambient">
                <div className="ambient-orb ambient-orb-1"></div>
                <div className="ambient-orb ambient-orb-2"></div>
            </div>

            <Center mih="100vh" py={{ base: 'xl', md: '3rem' }}>
                <Container size="sm" w="100%" px={{ base: 'md', sm: 'lg', md: 'xl' }}>

                    {/* IDLE 상태 - 입력 폼 */}
                    {status === 'IDLE' && (
                        <Stack gap="xl" align="center" className="animate-fade-in">
                            {/* 헤더 타이틀 */}
                            <Stack gap="md" align="center">
                                <Title
                                    order={1}
                                    ta="center"
                                    fz={{ base: '2rem', sm: '2.5rem', md: '3rem' }}
                                    fw={700}
                                    style={{ lineHeight: 1.2 }}
                                >

                                    <Text
                                        component="span"
                                        c="white"
                                        fz={{ base: '1.5rem', sm: '2rem', md: '2.5rem' }}
                                        fw={500}
                                    >
                                        당신의 번아웃을 치유합니다.
                                    </Text>
                                </Title>

                                <Text
                                    c="dimmed"
                                    size="lg"
                                    ta="center"
                                    maw={500}
                                    lh={1.8}
                                >
                                    상사의 무리한 피드백, 끝없는 야근, 관계의 피로...
                                    <br />
                                    지금 겪고 있는 스트레스를 털어놓으세요.
                                    <br />
                                    AI 전문 심리 코치가 실시간으로 듣고 위로해드립니다.
                                </Text>
                            </Stack>

                            {/* 입력 폼 카드 */}
                            <Paper
                                className="glass-paper"
                                shadow="xl"
                                p={{ base: 'md', sm: 'lg', md: 'xl' }}
                                radius="lg"
                                w="100%"
                            >
                                <Stack gap="md">
                                    <Textarea
                                        placeholder="예: 오늘 회의에서 내 의견이 묵살당해서 너무 비참했어..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        minRows={4}
                                        maxRows={6}
                                        autosize
                                        variant="unstyled"
                                        size="lg"
                                        styles={{
                                            input: {
                                                color: 'white',
                                                fontSize: '1.1rem',
                                                '&::placeholder': {
                                                    color: 'rgba(255, 255, 255, 0.4)',
                                                },
                                            },
                                        }}
                                    />

                                    <Box
                                        pt="md"
                                        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
                                    >
                                        <Group justify="space-between" align="center">
                                            <Button
                                                variant="subtle"
                                                color="gray"
                                                onClick={startVoiceInput}
                                                disabled={isRecording}
                                                leftSection={isRecording ? '🎙️' : '🎤'}
                                            >
                                                {isRecording ? '듣는 중...' : '음성으로 말하기'}
                                            </Button>

                                            <Button
                                                variant="gradient"
                                                gradient={{ from: 'cyan', to: 'violet', deg: 90 }}
                                                size="md"
                                                radius="md"
                                                onClick={handleSubmit}
                                                disabled={!input.trim()}
                                            >
                                                상담 시작하기
                                            </Button>
                                        </Group>
                                    </Box>

                                    {error && (
                                        <Text c="red.4" size="sm">
                                            {error}
                                        </Text>
                                    )}
                                </Stack>
                            </Paper>
                        </Stack>
                    )}

                    {/* ANALYZING 상태 - 로딩 */}
                    {status === 'ANALYZING' && (
                        <Center mih="50vh">
                            <Stack gap="xl" align="center" className="animate-pulse-slow">
                                <Box
                                    w={96}
                                    h={96}
                                    style={{
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                                        filter: 'blur(20px)',
                                    }}
                                />
                                <Stack gap="xs" align="center">
                                    <Title order={2} fw={300} c="white">
                                        당신의 감정을 분석하고 있습니다...
                                    </Title>
                                    <Text c="dimmed" size="sm">
                                        심리학적 프롬프트 적용 중
                                    </Text>
                                </Stack>
                            </Stack>
                        </Center>
                    )}

                    {/* SPEAKING 상태 - AI 응답 */}
                    {status === 'SPEAKING' && aiResponse && (
                        <Paper
                            className="glass-paper animate-fade-in-up"
                            shadow="xl"
                            p={{ base: 'lg', md: 'xl' }}
                            radius="lg"
                            w="100%"
                        >
                            <Stack gap="lg" align="center">
                                {/* AI 아이콘 */}
                                <Box pos="relative">
                                    <Box
                                        w={128}
                                        h={128}
                                        style={{
                                            borderRadius: '50%',
                                            border: '2px solid #7c3aed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text fz={48}>🧘</Text>
                                    </Box>
                                    <Box
                                        pos="absolute"
                                        top={0}
                                        left={0}
                                        w="100%"
                                        h="100%"
                                        className="animate-ping"
                                        style={{
                                            borderRadius: '50%',
                                            border: '2px solid #7c3aed',
                                            opacity: 0.2,
                                        }}
                                    />
                                </Box>

                                {/* 응답 헤더 */}
                                <Stack gap={4} align="center">
                                    <Text
                                        variant="gradient"
                                        gradient={{ from: 'violet', to: 'cyan' }}
                                        fw={500}
                                        size="xl"
                                    >
                                        Burnout Buddy's Reply
                                    </Text>
                                    <Text c="dimmed" size="sm">
                                        {aiResponse.tags.situationLabel} · {aiResponse.tags.emotionLabel}
                                    </Text>

                                    {/* Resilience Badge */}
                                    {aiResponse.resilienceScore !== undefined && (
                                        <Group gap="xs" mt="xs">
                                            <Text size="xs" c="teal.3" fw={700}>회복탄력성 지수 (CD-RISC)</Text>
                                            <Progress
                                                value={aiResponse.resilienceScore}
                                                color="teal"
                                                size="sm"
                                                w={100}
                                                radius="xl"
                                            />
                                            <Text size="xs" c="white">{aiResponse.resilienceScore}점</Text>
                                        </Group>
                                    )}
                                </Stack>

                                {/* 응답 본문 */}
                                <Text
                                    c="white"
                                    size="lg"
                                    ta="center"
                                    lh={1.8}
                                    style={{ whiteSpace: 'pre-line' }}
                                    maw={500}
                                >
                                    {aiResponse.reply}
                                </Text>

                                {/* 명상 가이드 */}
                                <Paper
                                    bg="rgba(0, 0, 0, 0.3)"
                                    p="lg"
                                    radius="lg"
                                    w="100%"
                                    withBorder
                                    style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                                >
                                    <Stack gap="xs">
                                        <Text c="dimmed" size="xs">
                                            1분 명상 가이드
                                        </Text>
                                        <Text c="gray.3" size="sm" style={{ whiteSpace: 'pre-line' }}>
                                            {aiResponse.meditation}
                                        </Text>
                                    </Stack>
                                </Paper>

                                {/* 오디오 플레이어 */}
                                <Paper
                                    bg="dark.8"
                                    radius="xl"
                                    p="sm"
                                    w="100%"
                                >
                                    <Group gap="md" align="center">
                                        <Text c="dimmed" size="xs">▶ 0:00 / 1:00</Text>
                                        <Progress
                                            value={33}
                                            color="violet"
                                            radius="xl"
                                            size="xs"
                                            style={{ flex: 1 }}
                                        />
                                        <Button
                                            variant="subtle"
                                            color="gray"
                                            size="xs"
                                            onClick={() => speak(aiResponse.voiceText)}
                                        >
                                            다시 듣기
                                        </Button>
                                    </Group>
                                </Paper>

                                {/* CTA 버튼 */}
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'cyan', to: 'violet', deg: 90 }}
                                    size="lg"
                                    radius="md"
                                    fullWidth
                                    onClick={startCheckout}
                                >
                                    {aiResponse.offer.cta} (${aiResponse.offer.priceUsdMonthly}/month)
                                </Button>

                                {/* 새 대화 시작 */}
                                <Button
                                    variant="transparent"
                                    c="dimmed"
                                    size="sm"
                                    onClick={endSession}
                                    td="underline"
                                >
                                    새로운 대화 시작하기
                                </Button>
                            </Stack>
                        </Paper>
                    )}

                </Container>
            </Center>

            {/* Footer */}
            <Box
                pos="fixed"
                bottom={16}
                left={0}
                right={0}
                ta="center"
                style={{ pointerEvents: 'none' }}
            >
                <Text c="dark.5" size="xs">
                    © 2030 Burnout Buddy MVP. Early Access.
                </Text>
            </Box>

            {/* Awareness Spike Notification (Toast-like or Fixed Bottom) */}
            <div className="animate-fade-in" style={{ position: 'fixed', bottom: '50px', right: '20px', zIndex: 1000, maxWidth: '300px' }}>
                <Paper p="md" radius="md" bg="rgba(50, 50, 50, 0.9)" withBorder>
                    <Text size="xs" c="cyan.3" fw={700} mb="xs">💡 Awareness Spike Tip</Text>
                    <Text size="sm" c="white">
                        처음 마음챙김을 할 때 스트레스가 더 크게 느껴질 수 있어요. <br />
                        그건 "나빠지는 것"이 아니라, "알아차리기 시작한 것"입니다. 안심하세요.
                    </Text>
                </Paper>
            </div>
        </>
    );
}
