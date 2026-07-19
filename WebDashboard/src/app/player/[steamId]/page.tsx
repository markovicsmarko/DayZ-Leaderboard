import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Trophy, Shield, Coins, Clock, Target, Crosshair, Key, ArrowLeft, Heart, Skull, Activity } from 'lucide-react';
import settings from '@/config/settings.json';

interface PageProps {
  params: {
    steamId: string;
  };
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { steamId } = params;

  // Fetch player details and relations directly from database (Next.js Server Component)
  const player = await prisma.player.findUnique({
    where: { steamId },
    include: {
      killsAsKiller: {
        where: { isSuicide: false, isAi: false },
        orderBy: { timestamp: 'desc' },
        take: 10
      },
      killsAsVictim: {
        orderBy: { timestamp: 'desc' },
        take: 10
      },
      pveKills: {
        orderBy: { timestamp: 'desc' },
        take: 20
      },
      dnaLogs: {
        orderBy: { timestamp: 'desc' },
        take: 15
      }
    }
  });

  if (!player) {
    return notFound();
  }

  // Calculate aggregates
  const pvpKills = await prisma.kill.count({
    where: { killerId: steamId, isSuicide: false, isAi: false }
  });
  
  const deaths = await prisma.kill.count({
    where: { victimId: steamId }
  });

  const zombieKills = player.pveKills.filter(k => k.targetType === 'zombie').length;
  const animalKills = player.pveKills.filter(k => k.targetType === 'animal').length;
  const aiKills = player.pveKills.filter(k => k.targetType === 'ai').length;
  
  const kdRatio = deaths > 0 ? parseFloat((pvpKills / deaths).toFixed(2)) : pvpKills;

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  // Compile a unified player activity history list
  const historyList: any[] = [];
  
  player.killsAsKiller.forEach(k => {
    historyList.push({
      id: `kill-${k.id}`,
      type: 'pvp_kill',
      timestamp: k.timestamp,
      title: `Killed ${k.victimName}`,
      desc: `Weapon: ${k.weapon} from ${k.distance.toFixed(1)}m`
    });
  });

  player.killsAsVictim.forEach(k => {
    historyList.push({
      id: `death-${k.id}`,
      type: 'pvp_death',
      timestamp: k.timestamp,
      title: k.isSuicide ? 'Committed suicide' : `Killed by ${k.killerName || 'Expansion AI/Environment'}`,
      desc: k.isSuicide ? '' : `Weapon: ${k.weapon} from ${k.distance.toFixed(1)}m`
    });
  });

  player.pveKills.forEach(k => {
    let cleanName = k.className.replace('Animal_', '').replace('ZombieBase', 'Zombie');
    if (k.className.includes('UrsusArctos')) cleanName = 'Brown Bear';
    if (k.className.includes('CanisLupus')) cleanName = 'Wolf';
    
    historyList.push({
      id: `pve-${k.id}`,
      type: 'pve',
      timestamp: k.timestamp,
      title: `Hunted ${cleanName}`,
      desc: `Type: ${k.targetType}`
    });
  });

  player.dnaLogs.forEach(log => {
    let cleanName = log.targetClass.replace('DNA_Crate_', 'Loot Crate ').replace('DNA_KeycardReader_', 'Safehouse Reader ');
    historyList.push({
      id: `dna-${log.id}`,
      type: 'dna',
      timestamp: log.timestamp,
      title: `Unlocked ${cleanName}`,
      desc: settings.privacy.show_event_positions ? `Position: ${log.position}` : ''
    });
  });

  // Sort history chronologically
  historyList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const cappedHistory = historyList.slice(0, 15);

  return (
    <div>
      <Link href="/" className="btn btn-secondary" style={{ width: 'auto', marginBottom: '2rem', display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Back to Leaderboard
      </Link>

      <div className="profile-grid">
        {/* Left column: Avatar and Card */}
        <div className="glass-panel profile-card">
          <div className="profile-avatar">
            {player.playerName.substring(0, 2).toUpperCase()}
          </div>
          <h2 className="profile-name">{player.playerName}</h2>
          <div className="profile-ids">
            <span>Steam ID: {player.steamId}</span>
            <span>Bohemia ID: {player.bohemiaId}</span>
          </div>

          {(settings.features.playtime.enabled || settings.features.bank.enabled) && (
            <div className="profile-meta-row">
              {settings.features.playtime.enabled && (
                <div className="meta-box">
                  <div className="meta-label">Playtime</div>
                  <div className="meta-val">{formatPlayTime(player.playTime)}</div>
                </div>
              )}
              {settings.features.bank.enabled && (
                <div className="meta-box">
                  <div className="meta-label">Bank Wealth</div>
                  <div style={{ color: 'var(--accent-green)' }} className="meta-val">{formatMoney(player.bankBalance)}</div>
                </div>
              )}
            </div>
          )}

          {settings.privacy.show_last_position && (
            <div className="profile-meta-row" style={{ border: 'none', paddingTop: 0, marginTop: '0.5rem' }}>
              <div className="meta-box" style={{ gridColumn: 'span 2' }}>
                <div className="meta-label">Last Known Position</div>
                <div style={{ fontSize: '1rem', fontFamily: 'monospace' }} className="meta-val">{player.lastPosition}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Stats and activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Stats grid */}
          <div className="stats-grid">
            {settings.features.pvp.enabled && (
              <>
                <div className="stat-card">
                  <div className="stat-label">K/D Ratio</div>
                  <div className="stat-number" style={{ color: 'var(--accent-color)' }}>{kdRatio}</div>
                </div>
                <div className="stat-card red">
                  <div className="stat-label">PvP Kills / Deaths</div>
                  <div className="stat-number">{pvpKills} / {deaths}</div>
                </div>
              </>
            )}
            {settings.features.zombie.enabled && (
              <div className="stat-card green">
                <div className="stat-label">Zombie Kills</div>
                <div className="stat-number">{zombieKills}</div>
              </div>
            )}
            {settings.features.ai.enabled && (
              <div className="stat-card">
                <div className="stat-label">AI Kills</div>
                <div className="stat-number">{aiKills}</div>
              </div>
            )}
            {settings.features.longest_kill.enabled && (
              <div className="stat-card">
                <div className="stat-label">Longest Kill</div>
                <div className="stat-number" style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                  <Target size={16} style={{ color: 'var(--accent-red)' }} />
                  {player.longestKill > 0 ? `${player.longestKill.toFixed(1)}m` : '-'}
                </div>
              </div>
            )}
            {settings.features.longest_hit.enabled && (
              <div className="stat-card">
                <div className="stat-label">Longest Hit</div>
                <div className="stat-number" style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                  <Crosshair size={16} style={{ color: 'var(--accent-color)' }} />
                  {player.longestHit > 0 ? `${player.longestHit.toFixed(1)}m` : '-'}
                </div>
              </div>
            )}
            {settings.features.dna.enabled && (
              <div className="stat-card">
                <div className="stat-label">DNA Openings</div>
                <div className="stat-number" style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                  <Key size={16} style={{ color: 'var(--accent-color)' }} />
                  {player.dnaLogs.length}
                </div>
              </div>
            )}
            {settings.features.zombie.enabled && (
              <div className="stat-card">
                <div className="stat-label">Animals Hunted</div>
                <div className="stat-number">{animalKills}</div>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <Activity size={20} style={{ color: 'var(--accent-color)' }} />
              Recent Player Activity
            </h3>

            {cappedHistory.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No recent activity logged.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cappedHistory.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'rgba(0, 0, 0, 0.2)', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      borderLeft: `4px solid ${
                        item.type === 'pvp_kill' ? 'var(--accent-green)' : 
                        item.type === 'pvp_death' ? 'var(--accent-red)' : 
                        item.type === 'dna' ? 'var(--accent-color)' : 'var(--text-secondary)'
                      }`
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{item.desc}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
