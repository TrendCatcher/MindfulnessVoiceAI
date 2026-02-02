import { analyzeText, buildPersonalizedScript } from '@/app/lib/analyze';

function testScienceFeatures() {
    console.log('--- Testing Science-backed Features ---');

    // Test 1: High Burnout -> Check Micro-Action & Low Resilience Score
    const burnoutText = "너무 지치고 번아웃 왔어. 아무것도 하기 싫어.";
    const analysis1 = analyzeText(burnoutText);
    const script1 = buildPersonalizedScript({ text: burnoutText, analysis: analysis1 });

    console.log(`[Test 1] Input: "${burnoutText}"`);
    console.log(`Emotion: ${analysis1.emotion}`);
    console.log(`Resilience Score: ${script1.resilienceScore}`); // Should be low (e.g., 0)

    if (script1.meditationText.includes('긴급 회복 가이드')) {
        console.log('✅ Micro-Action Triggered: PASS');
    } else {
        console.error('❌ Micro-Action Failed: ' + script1.meditationText.slice(0, 50));
    }

    if (script1.resilienceScore !== undefined && script1.resilienceScore <= 20) {
        console.log('✅ Resilience Score Logic (Low): PASS');
    } else {
        console.error(`❌ Resilience Score Logic Failed: ${script1.resilienceScore}`);
    }

    console.log('---------------------------------------');

    // Test 2: General Stress -> Check Standard Guide & Higher Score
    const normalText = "오늘 회의가 좀 힘들었어.";
    const analysis2 = analyzeText(normalText);
    const script2 = buildPersonalizedScript({ text: normalText, analysis: analysis2 });

    console.log(`[Test 2] Input: "${normalText}"`);
    console.log(`Emotion: ${analysis2.emotion}`);
    console.log(`Resilience Score: ${script2.resilienceScore}`);

    if (!script2.meditationText.includes('긴급 회복 가이드')) {
        console.log('✅ Standard Meditation Triggered: PASS');
    } else {
        console.error('❌ Should NOT be Micro-Action');
    }

    if (script2.resilienceScore !== undefined && script2.resilienceScore > 20) {
        console.log('✅ Resilience Score Logic (Normal): PASS');
    } else {
        console.error(`❌ Resilience Score Logic Failed: ${script2.resilienceScore}`);
    }
}

testScienceFeatures();
