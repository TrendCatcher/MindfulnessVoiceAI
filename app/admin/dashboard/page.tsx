'use client';

import { useEffect, useState } from 'react';
import { Container, Title, Text, Grid, Paper, Stack, Group, RingProgress, Center, Loader } from '@mantine/core';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

type Metrics = {
    retention7d: { cohortSize: number; retained: number; rate: number };
    conversion7d: {
        sessions: number;
        checkoutStarted: number;
        checkoutSucceeded: number;
        rateBySession: number;
        rateByCheckoutStarted: number;
    };
    avgEmotionImprovement: number;
    emotionDistribution: Record<string, number>;
    sessionCompletionRate: number;
    totalSessions: number;
    uniqueUsers: number;
    avgSessionsPerUser: number;
};

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/metrics')
            .then((res) => res.json())
            .then((data) => {
                setMetrics(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Center h="100vh">
                <Loader size="xl" variant="dots" color="violet" />
            </Center>
        );
    }

    if (!metrics) return <Center h="100vh">Failed to load data</Center>;

    // Data preparation for charts
    const emotionData = Object.entries(metrics.emotionDistribution).map(([name, value]) => ({
        name,
        value,
    }));

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

    const funnelData = [
        { name: 'Sessions', value: metrics.conversion7d.sessions },
        { name: 'Checkout Started', value: metrics.conversion7d.checkoutStarted },
        { name: 'Succeeded', value: metrics.conversion7d.checkoutSucceeded },
    ];

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Title order={1}>Admin Dashboard</Title>
                <Text c="dimmed">Real-time metrics for Burnout Buddy AI</Text>

                <Grid>
                    {/* Key Metrics Cards */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper shadow="sm" p="lg" radius="md" withBorder>
                            <Stack gap="xs">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                                    Retention (7-Day)
                                </Text>
                                <Group align="flex-end" gap="xs">
                                    <Text size="xl" fw={700} fz={32}>
                                        {(metrics.retention7d.rate * 100).toFixed(1)}%
                                    </Text>
                                    <Text c="teal" size="sm" fw={500}>
                                        {metrics.retention7d.retained} / {metrics.retention7d.cohortSize} Users
                                    </Text>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper shadow="sm" p="lg" radius="md" withBorder>
                            <Stack gap="xs">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                                    Conversion Rate
                                </Text>
                                <Group align="flex-end" gap="xs">
                                    <Text size="xl" fw={700} fz={32}>
                                        {(metrics.conversion7d.rateBySession * 100).toFixed(1)}%
                                    </Text>
                                    <Text c="dimmed" size="sm">
                                        Session to Payment
                                    </Text>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper shadow="sm" p="lg" radius="md" withBorder>
                            <Stack gap="xs">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                                    Avg Emotion Improvement
                                </Text>
                                <Group align="flex-end" gap="xs">
                                    <Text size="xl" fw={700} fz={32}>
                                        {metrics.avgEmotionImprovement.toFixed(2)}
                                    </Text>
                                    <Text c="teal" size="sm">
                                        / 1.0 Scale
                                    </Text>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    {/* Charts Row 1 */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper shadow="sm" p="lg" radius="md" withBorder h={400}>
                            <Title order={3} mb="lg">Conversion Funnel</Title>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={funnelData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper shadow="sm" p="lg" radius="md" withBorder h={400}>
                            <Title order={3} mb="lg">Emotion Distribution</Title>
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={emotionData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {emotionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Stack>
        </Container>
    );
}
