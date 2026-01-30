import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
        audioUrl: "/mock-audio.mp3", // Placeholder
        status: "success"
    });
}
