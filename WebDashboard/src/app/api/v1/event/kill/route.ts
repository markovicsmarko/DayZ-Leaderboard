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

    if (!settings.features.pvp.enabled) {
      return NextResponse.json({ success: true, message: 'PvP tracking is disabled.' });
    }

    // 2. Parse Payload
    const body = await request.json();
    const {
      victimSteamId,
      victimBohemiaId,
      victimName,
      killerSteamId,
      killerBohemiaId,
      killerName,
      weapon,
      distance,
      isSuicide,
      isAi
    } = body;

    if (!victimSteamId || !victimBohemiaId || !victimName) {
      return NextResponse.json({ error: 'Missing required victim fields.' }, { status: 400 });
    }

    // 3. Ensure Victim exists in Player DB
    await prisma.player.upsert({
      where: { steamId: victimSteamId },
      update: { bohemiaId: victimBohemiaId, playerName: victimName },
      create: { steamId: victimSteamId, bohemiaId: victimBohemiaId, playerName: victimName }
    });

    const isPvP = killerSteamId && killerSteamId !== 'AI' && !isSuicide && !isAi;

    // 4. Ensure Killer exists in Player DB if PvP
    if (isPvP && killerSteamId) {
      await prisma.player.upsert({
        where: { steamId: killerSteamId },
        update: { bohemiaId: killerBohemiaId || undefined, playerName: killerName || undefined },
        create: { steamId: killerSteamId, bohemiaId: killerBohemiaId || '', playerName: killerName || '' }
      });
    }

    // 5. Log the Kill
    const kill = await prisma.kill.create({
      data: {
        victimId: victimSteamId,
        victimBohemiaId,
        victimName,
        killerId: isPvP ? killerSteamId : null,
        killerBohemiaId: killerBohemiaId || null,
        killerName: killerName || null,
        weapon: weapon || 'Unknown',
        distance: distance || 0.0,
        isSuicide: !!isSuicide,
        isAi: !!isAi,
      }
    });

    // 6. Check and update Longest Kill record for the player
    if (isPvP && killerSteamId && distance) {
      const killerPlayer = await prisma.player.findUnique({ where: { steamId: killerSteamId } });
      if (killerPlayer && distance > killerPlayer.longestKill) {
        await prisma.player.update({
          where: { steamId: killerSteamId },
          data: { longestKill: distance }
        });
      }
    }

    return NextResponse.json({ success: true, kill });

  } catch (error: any) {
    console.error('[KillAPI] Kill logging error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while logging the kill.' }, { status: 500 });
  }
}
