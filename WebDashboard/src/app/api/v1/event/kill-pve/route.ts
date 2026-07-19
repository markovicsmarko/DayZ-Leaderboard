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

    console.log('[Auth Debug - KillPvE] token:', token ? '***' : 'null');
    console.log('[Auth Debug - KillPvE] expected key:', getApiKey() ? '***' : 'null');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Missing token.' }, { status: 401 });
    }

    if (token !== getApiKey()) {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401 });
    }

    // 2. Parse Payload
    const body = await request.json();
    const { killerSteamId, killerBohemiaId, killerName, targetType, className } = body;

    if (!killerSteamId || !killerBohemiaId || !targetType || !className) {
      return NextResponse.json({ error: 'Missing required PvE kill fields.' }, { status: 400 });
    }

    // Check config features
    if (targetType === 'zombie' && !settings.features.zombie.enabled) {
      return NextResponse.json({ success: true, message: 'Zombie tracking is disabled.' });
    }
    if (targetType === 'ai' && !settings.features.ai.enabled) {
      return NextResponse.json({ success: true, message: 'AI tracking is disabled.' });
    }

    // 3. Ensure Killer exists in Player DB
    await prisma.player.upsert({
      where: { steamId: killerSteamId },
      update: { bohemiaId: killerBohemiaId, playerName: killerName },
      create: { steamId: killerSteamId, bohemiaId: killerBohemiaId, playerName: killerName }
    });

    // 4. Log the PvE Kill
    const pveKill = await prisma.pveKill.create({
      data: {
        killerId: killerSteamId,
        killerBohemiaId,
        killerName,
        targetType,
        className
      }
    });

    return NextResponse.json({ success: true, pveKill });

  } catch (error: any) {
    console.error('[PveKillAPI] PvE kill logging error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while logging the PvE kill.' }, { status: 500 });
  }
}
