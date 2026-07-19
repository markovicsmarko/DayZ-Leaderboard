import { NextResponse } from 'next/server';
import { prisma, getApiKey } from '@/lib/db';
import settings from '@/config/settings.json';

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request
    const { searchParams } = new URL(request.url);
    const keyParam = searchParams.get('key');
    const authHeader = request.headers.get('Authorization');
    
    let token = '';
    if (authHeader) {
      token = authHeader.replace('Bearer ', '').trim();
    } else if (keyParam) {
      token = keyParam.trim();
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Missing token.' }, { status: 401 });
    }

    if (token !== getApiKey()) {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401 });
    }

    if (!settings.features.dna.enabled) {
      return NextResponse.json({ success: true, message: 'DNA raids tracking is disabled.' });
    }

    // 2. Parse Payload
    const body = await request.json();
    const { steamId, bohemiaId, playerName, action, targetClass, position } = body;

    if (!steamId || !bohemiaId || !action || !targetClass || !position) {
      return NextResponse.json({ error: 'Missing required DNA keycard log fields.' }, { status: 400 });
    }

    // 3. Ensure Player exists
    await prisma.player.upsert({
      where: { steamId },
      update: { bohemiaId, playerName },
      create: { steamId, bohemiaId, playerName }
    });

    // 4. Log the DNA Keycard usage
    const dnaLog = await prisma.dnaLog.create({
      data: {
        playerId: steamId,
        playerBohemiaId: bohemiaId,
        playerName,
        action,
        targetClass,
        position
      }
    });

    return NextResponse.json({ success: true, dnaLog });

  } catch (error: any) {
    console.error('[DnaAPI] DNA keycard event logging error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while logging the DNA keycard event.' }, { status: 500 });
  }
}
