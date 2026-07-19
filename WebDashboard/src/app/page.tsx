'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Trophy, Shield, Clock, Coins, Target, Crosshair, RefreshCw, Key, Bot } from 'lucide-react';
import settings from '@/config/settings.json';

interface LeaderboardPlayer {
  steamId: string;
  bohemiaId: string;
  playerName: string;
  playTime: number;
  bankBalance: number;
  longestHit: number;
  longestKill: number;
  pvpKills: number;
  deaths: number;
  kdRatio: number;
  zombieKills: number;
  animalKills: number;
  aiKills: number;
  dnaOpenings: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('kills');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Redirect to install if database is not set up
  useEffect(() => {
    fetch('/api/install')
      .then((res) => res.json())
      .then((data) => {
        if (!data.installed) {
          router.push('/install');
        }
      })
      .catch(() => {});
  }, [router]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch leaderboard data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/leaderboard?sort=${sortBy}&search=${encodeURIComponent(debouncedSearch)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) {
          setPlayers(data.leaderboard);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sortBy, debouncedSearch]);

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div>
      <div className="leaderboard-header">
        <div>
          <h1 className="page-title">SERVER LEADERBOARD</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Real-time player rankings, PvP stats, bank wealth, and achievements.
          </p>
        </div>
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search Player or SteamID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Sort By</span>
        {settings.features.playtime.enabled && (
          <button
            className={`filter-btn ${sortBy === 'playtime' ? 'active' : ''}`}
            onClick={() => setSortBy('playtime')}
          >
            <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Playtime
          </button>
        )}
        {settings.features.bank.enabled && (
          <button
            className={`filter-btn ${sortBy === 'bank' ? 'active' : ''}`}
            onClick={() => setSortBy('bank')}
          >
            <Coins size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Bank Wealth
          </button>
        )}
        {settings.features.pvp.enabled && (
          <button
            className={`filter-btn ${sortBy === 'kills' ? 'active' : ''}`}
            onClick={() => setSortBy('kills')}
          >
            <Trophy size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            PvP Kills
          </button>
        )}
        {settings.features.zombie.enabled && (
          <button
            className={`filter-btn ${sortBy === 'zombie' ? 'active' : ''}`}
            onClick={() => setSortBy('zombie')}
          >
            <Shield size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Infected Kills
          </button>
        )}
        {settings.features.ai.enabled && (
          <button
            className={`filter-btn ${sortBy === 'ai' ? 'active' : ''}`}
            onClick={() => setSortBy('ai')}
          >
            <Bot size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            AI Kills
          </button>
        )}
        {settings.features.dna.enabled && (
          <button
            className={`filter-btn ${sortBy === 'dna' ? 'active' : ''}`}
            onClick={() => setSortBy('dna')}
          >
            <Key size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            DNA Raids
          </button>
        )}
        {settings.features.longest_kill.enabled && (
          <button
            className={`filter-btn ${sortBy === 'longest_kill' ? 'active' : ''}`}
            onClick={() => setSortBy('longest_kill')}
          >
            <Target size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Longest Kill
          </button>
        )}
        {settings.features.longest_hit.enabled && (
          <button
            className={`filter-btn ${sortBy === 'longest_hit' ? 'active' : ''}`}
            onClick={() => setSortBy('longest_hit')}
          >
            <Crosshair size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Longest Hit
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <RefreshCw className="animate-spin" size={36} style={{ color: 'var(--accent-color)' }} />
        </div>
      ) : players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          No stats recorded yet.
        </div>
      ) : (
        <div className="table-responsive glass-panel" style={{ padding: 0 }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                {settings.features.playtime.enabled && (
                  <th onClick={() => setSortBy('playtime')} className="sortable-header">
                    Playtime {sortBy === 'playtime' && <span className="sort-icon">▼</span>}
                  </th>
                )}
                {settings.features.bank.enabled && (
                  <th onClick={() => setSortBy('bank')} className="sortable-header">
                    Bank Balance {sortBy === 'bank' && <span className="sort-icon">▼</span>}
                  </th>
                )}
                {settings.features.pvp.enabled && (
                  <th onClick={() => setSortBy('kills')} className="sortable-header">
                    PvP K/D {sortBy === 'kills' && <span className="sort-icon">▼</span>}
                  </th>
                )}
                {settings.features.zombie.enabled && (
                  <th onClick={() => setSortBy('zombie')} className="sortable-header">
                    Zombie Kills {sortBy === 'zombie' && <span className="sort-icon">▼</span>}
                  </th>
                )}
                {settings.features.ai.enabled && (
                  <th onClick={() => setSortBy('ai')} className="sortable-header">
                    AI Kills {sortBy === 'ai' && <span className="sort-icon">▼</span>}
                  </th>
                )}
                {settings.features.dna.enabled && (
                  <th onClick={() => setSortBy('dna')} className="sortable-header">
                    DNA Openings {sortBy === 'dna' && <span className="sort-icon">▼</span>}
                  </th>
                )}
                {settings.features.longest_kill.enabled && (
                  <th onClick={() => setSortBy('longest_kill')} className="sortable-header">
                    Longest Kill {sortBy === 'longest_kill' && <span className="sort-icon">▼</span>}
                  </th>
                )}
                {settings.features.longest_hit.enabled && (
                  <th onClick={() => setSortBy('longest_hit')} className="sortable-header">
                    Longest Hit {sortBy === 'longest_hit' && <span className="sort-icon">▼</span>}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => {
                const rank = index + 1;
                let rankClass = 'rank-other';
                if (rank === 1) rankClass = 'rank-1';
                else if (rank === 2) rankClass = 'rank-2';
                else if (rank === 3) rankClass = 'rank-3';

                return (
                  <tr key={player.steamId}>
                    <td>
                      <span className={`rank-badge ${rankClass}`}>{rank}</span>
                    </td>
                    <td>
                      <div className="player-name-cell">
                        <Link href={`/player/${player.steamId}`} className="player-link">
                          {player.playerName}
                        </Link>
                        <span className="player-uid">Steam: {player.steamId}</span>
                      </div>
                    </td>
                    {settings.features.playtime.enabled && <td>{formatPlayTime(player.playTime)}</td>}
                    {settings.features.bank.enabled && (
                      <td>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                          {formatMoney(player.bankBalance)}
                        </span>
                      </td>
                    )}
                    {settings.features.pvp.enabled && (
                      <td>
                        <span style={{ fontWeight: 600 }}>{player.pvpKills}</span>
                        <span style={{ color: 'var(--text-secondary)' }}> / {player.deaths}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Ratio: <span style={{ color: player.kdRatio >= 1 ? 'var(--accent-color)' : 'var(--text-secondary)' }}>{player.kdRatio}</span>
                        </div>
                      </td>
                    )}
                    {settings.features.zombie.enabled && <td>{player.zombieKills}</td>}
                    {settings.features.ai.enabled && <td>{player.aiKills}</td>}
                    {settings.features.dna.enabled && (
                      <td>
                        <span style={{ color: player.dnaOpenings > 0 ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: player.dnaOpenings > 0 ? 600 : 400 }}>
                          {player.dnaOpenings}
                        </span>
                      </td>
                    )}
                    {settings.features.longest_kill.enabled && <td>{player.longestKill > 0 ? `${player.longestKill.toFixed(1)}m` : '-'}</td>}
                    {settings.features.longest_hit.enabled && <td>{player.longestHit > 0 ? `${player.longestHit.toFixed(1)}m` : '-'}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
