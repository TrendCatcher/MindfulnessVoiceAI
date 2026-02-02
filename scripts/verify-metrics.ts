import { computeDashboardMetrics, computeBurnoutMetrics } from '@/app/lib/events';

async function main() {
    console.log('--- Verifying Metrics ---');

    try {
        const dashboard = await computeDashboardMetrics();
        console.log('Dashboard Metrics:', JSON.stringify(dashboard, null, 2));

        const burnout = await computeBurnoutMetrics();
        console.log('Burnout Metrics:', JSON.stringify(burnout, null, 2));

        if (dashboard && burnout) {
            console.log('✅ Metrics computation successful.');
        } else {
            console.error('❌ Metrics computation returned null/undefined.');
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Error during metrics computation:', e);
        process.exit(1);
    }
}

main();
