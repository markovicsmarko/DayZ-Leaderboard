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

    console.log('[Auth Debug - Sync] token:', token ? '***' : 'null');
    console.log('[Auth Debug - Sync] expected key:', getApiKey() ? '***' : 'null');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Missing token.' }, { status: 401 });
    }

    if (token !== getApiKey()) {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401 });
    }

    // 2. Parse Payload
    const body = await request.json();
    const { steamId, bohemiaId, playerName, addedPlayTime, bankBalance, position, addedZombieKills, addedAnimalKills } = body;

    if (!steamId || !bohemiaId || !playerName) {
      return NextResponse.json({ error: 'Missing required sync fields.' }, { status: 400 });
    }

    // 3. Upsert Player Stats in Database
    // Increment playtime and update current state (bank balance, last location)
    // 3. Prepare update/create data dynamically based on settings
    const updateData: any = {
      bohemiaId,
      playerName,
    };
    
    const createData: any = {
      steamId,
      bohemiaId,
      playerName,
      lastPosition: position || '0 0 0',
    };

    if (settings.features.playtime.enabled) {
      updateData.playTime = { increment: addedPlayTime || 0 };
      createData.playTime = addedPlayTime || 0;
    } else {
      createData.playTime = 0;
    }

    if (settings.features.bank.enabled) {
      if (bankBalance !== undefined) {
        updateData.bankBalance = bankBalance;
      }
      createData.bankBalance = bankBalance || 0;
    } else {
      createData.bankBalance = 0;
    }

    if (position) {
      updateData.lastPosition = position;
    }

    const player = await prisma.player.upsert({
      where: { steamId },
      update: updateData,
      create: createData,
    });

    // Process batched PvE kills efficiently
    if (settings.features.zombie.enabled && addedZombieKills && addedZombieKills > 0) {
      const zombieRecords = Array.from({ length: Math.min(addedZombieKills, 100) }).map(() => ({
        killerId: steamId,
        killerBohemiaId: bohemiaId,
        killerName: playerName,
        targetType: 'zombie',
        className: 'ZombieBase'
      }));
      await prisma.pveKill.createMany({ data: zombieRecords });
    }

    if (settings.features.zombie.enabled && addedAnimalKills && addedAnimalKills > 0) {
      const animalRecords = Array.from({ length: Math.min(addedAnimalKills, 50) }).map(() => ({
        killerId: steamId,
        killerBohemiaId: bohemiaId,
        killerName: playerName,
        targetType: 'animal',
        className: 'AnimalBase'
      }));
      await prisma.pveKill.createMany({ data: animalRecords });
    }

    return NextResponse.json({ success: true, player });

  } catch (error: any) {
    console.error('[SyncAPI] Sync error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during synchronization.' }, { status: 500 });
  }
}
