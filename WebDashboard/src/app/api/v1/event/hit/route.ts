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

    if (!settings.features.longest_hit.enabled) {
      return NextResponse.json({ success: true, message: 'Hit tracking is disabled.' });
    }

    // 2. Parse Payload
    const body = await request.json();
    const {
      attackerSteamId,
      attackerBohemiaId,
      attackerName,
      victimSteamId,
      victimBohemiaId,
      victimName,
      distance
    } = body;

    if (!attackerSteamId || !attackerBohemiaId || !victimSteamId || !distance) {
      return NextResponse.json({ error: 'Missing required hit log fields.' }, { status: 400 });
    }

    // 3. Ensure Attacker exists
    await prisma.player.upsert({
      where: { steamId: attackerSteamId },
      update: { bohemiaId: attackerBohemiaId, playerName: attackerName },
      create: { steamId: attackerSteamId, bohemiaId: attackerBohemiaId, playerName: attackerName }
    });

    // 4. Ensure Victim exists
    await prisma.player.upsert({
      where: { steamId: victimSteamId },
      update: { bohemiaId: victimBohemiaId, playerName: victimName },
      create: { steamId: victimSteamId, bohemiaId: victimBohemiaId, playerName: victimName }
    });

    // 5. Save the Hit Log
    const hit = await prisma.hitLog.create({
      data: {
        attackerId: attackerSteamId,
        attackerBohemiaId,
        attackerName,
        victimId: victimSteamId,
        victimBohemiaId,
        victimName,
        distance: distance || 0.0
      }
    });

    // 6. Check and update Longest Hit record for the player
    const attackerPlayer = await prisma.player.findUnique({ where: { steamId: attackerSteamId } });
    if (attackerPlayer && distance > attackerPlayer.longestHit) {
      await prisma.player.update({
        where: { steamId: attackerSteamId },
        data: { longestHit: distance }
      });
    }

    return NextResponse.json({ success: true, hit });

  } catch (error: any) {
    console.error('[HitAPI] Hit logging error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while logging the hit.' }, { status: 500 });
  }
}
