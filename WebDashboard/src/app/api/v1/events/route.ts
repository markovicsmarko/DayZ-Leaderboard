import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch recent events of all types
    const [kills, pveKills, dnaLogs] = await Promise.all([
      prisma.kill.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.pveKill.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.dnaLog.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
      })
    ]);

    // Format all events into a unified structure
    const formattedKills = kills.map(k => ({
      id: `kill-${k.id}`,
      type: 'kill',
      timestamp: k.timestamp,
      payload: {
        victimName: k.victimName,
        victimSteamId: k.victimId,
        killerName: k.killerName,
        killerSteamId: k.killerId,
        weapon: k.weapon,
        distance: k.distance,
        isSuicide: k.isSuicide,
        isAi: k.isAi
      }
    }));

    const formattedPve = pveKills.map(k => ({
      id: `pve-${k.id}`,
      type: 'pve',
      timestamp: k.timestamp,
      payload: {
        killerName: k.killerName,
        killerSteamId: k.killerId,
        targetType: k.targetType,
        className: k.className
      }
    }));

    const formattedDna = dnaLogs.map(log => ({
      id: `dna-${log.id}`,
      type: 'dna',
      timestamp: log.timestamp,
      payload: {
        playerName: log.playerName,
        playerSteamId: log.playerId,
        action: log.action,
        targetClass: log.targetClass,
        position: log.position
      }
    }));

    // Merge and sort chronologically
    const allEvents = [...formattedKills, ...formattedPve, ...formattedDna]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30); // Cap at 30 events

    return NextResponse.json({ events: allEvents });

  } catch (error: any) {
    console.error('[EventsAPI] Error fetching recent events:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while fetching events.' }, { status: 500 });
  }
}
