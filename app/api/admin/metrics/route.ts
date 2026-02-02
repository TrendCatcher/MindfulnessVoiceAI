import { NextResponse } from 'next/server';
import { computeDashboardMetrics, computeBurnoutMetrics } from '@/app/lib/events';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const dashboardMetrics = await computeDashboardMetrics();
        const burnoutMetrics = await computeBurnoutMetrics();

        return NextResponse.json({
            ...dashboardMetrics,
            ...burnoutMetrics,
        });
    } catch (error) {
        console.error('Failed to compute metrics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
