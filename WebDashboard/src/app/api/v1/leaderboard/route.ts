import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'kills'; // 'kills', 'playtime', 'bank', 'longest_kill', 'longest_hit', 'zombie', 'dna'
    const search = searchParams.get('search') || '';

    // Fetch players with relations to aggregate statistics
    const players = await prisma.player.findMany({
      where: search ? {
        OR: [
          { playerName: { contains: search } },
          { steamId: { contains: search } },
          { bohemiaId: { contains: search } }
        ]
      } : undefined,
      include: {
        killsAsKiller: {
          where: { isSuicide: false, isAi: false },
          select: { id: true }
        },
        killsAsVictim: {
          select: { id: true }
        },
        pveKills: {
          select: { targetType: true }
        },
        dnaLogs: {
          select: { id: true }
        }
      }
    });

    // Map and aggregate stats
    let leaderboard = players.map(p => {
      const pvpKills = p.killsAsKiller.length;
      const deaths = p.killsAsVictim.length;
      const zombieKills = p.pveKills.filter(k => k.targetType === 'zombie').length;
      const animalKills = p.pveKills.filter(k => k.targetType === 'animal').length;
      const aiKills = p.pveKills.filter(k => k.targetType === 'ai').length;
      const dnaOpenings = p.dnaLogs.length;

      return {
        steamId: p.steamId,
        bohemiaId: p.bohemiaId,
        playerName: p.playerName,
        playTime: p.playTime, // in seconds
        bankBalance: p.bankBalance,
        longestHit: p.longestHit,
        longestKill: p.longestKill,
        pvpKills,
        deaths,
        kdRatio: deaths > 0 ? parseFloat((pvpKills / deaths).toFixed(2)) : pvpKills,
        zombieKills,
        animalKills,
        aiKills,
        dnaOpenings
      };
    });

    // Apply sorting
    leaderboard.sort((a, b) => {
      switch (sortBy) {
        case 'playtime':
          return b.playTime - a.playTime;
        case 'bank':
          return b.bankBalance - a.bankBalance;
        case 'longest_kill':
          return b.longestKill - a.longestKill;
        case 'longest_hit':
          return b.longestHit - a.longestHit;
        case 'zombie':
          return b.zombieKills - a.zombieKills;
        case 'ai':
          return b.aiKills - a.aiKills;
        case 'dna':
          return b.dnaOpenings - a.dnaOpenings;
        case 'kills':
        default:
          return b.pvpKills - a.pvpKills;
      }
    });

    // Cap at 100 top players for performance
    const cappedLeaderboard = leaderboard.slice(0, 100);

    return NextResponse.json({ leaderboard: cappedLeaderboard });

  } catch (error: any) {
    console.error('[LeaderboardAPI] Error fetching leaderboard:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while fetching the leaderboard.' }, { status: 500 });
  }
}
