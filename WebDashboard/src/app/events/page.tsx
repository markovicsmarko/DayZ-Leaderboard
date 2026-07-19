'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Key, Target, RefreshCw, Crosshair } from 'lucide-react';
import settings from '@/config/settings.json';

interface EventItem {
  id: string;
  type: string; // 'kill' | 'pve' | 'dna'
  timestamp: string;
  payload: {
    victimName?: string;
    victimSteamId?: string;
    killerName?: string;
    killerSteamId?: string;
    playerName?: string;
    playerSteamId?: string;
    weapon?: string;
    distance?: number;
    isSuicide?: boolean;
    isAi?: boolean;
    targetType?: string;
    className?: string;
    action?: string;
    targetClass?: string;
    position?: string;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    setLoading(true);
    fetch('/api/v1/events')
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setEvents(data.events);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!settings.features.live_feed.enabled) return;
    fetchEvents();
    // Poll every 15 seconds
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!settings.features.live_feed.enabled) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', maxWidth: '600px', margin: '0 auto' }} className="glass-panel">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--accent-red)' }}>Feature Disabled</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          The Live Event Feed is currently disabled by the server administrator.
        </p>
        <Link href="/" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getCleanClassName = (name: string) => {
    if (!name) return 'Unknown';
    // Translate animal classes
    if (name.includes('UrsusArctos')) return 'Brown Bear';
    if (name.includes('CanisLupus')) return 'Wolf';
    if (name.includes('CervusElaphus')) return 'Red Deer';
    if (name.includes('CapreolusCapreolus')) return 'Roe Deer';
    if (name.includes('SusScrofa')) return 'Wild Boar';
    if (name.includes('OvisAries')) return 'Sheep';
    if (name.includes('CapraHircus')) return 'Goat';
    if (name.includes('GallusGallus')) return 'Chicken';
    
    // Clean up DNA Crate/Vaults
    if (name.includes('DNA_Crate_Red')) return 'Red Loot Crate';
    if (name.includes('DNA_Crate_Blue')) return 'Blue Loot Crate';
    if (name.includes('DNA_Crate_Green')) return 'Green Loot Crate';
    if (name.includes('DNA_Crate_Purple')) return 'Purple Loot Crate';
    if (name.includes('DNA_Crate_Yellow')) return 'Yellow Loot Crate';
    if (name.includes('DNA_Crate_Orange')) return 'Orange Loot Crate';
    
    if (name.includes('KeycardReader_Red')) return 'Red Safehouse Keypad';
    if (name.includes('KeycardReader_Blue')) return 'Blue Safehouse Keypad';
    if (name.includes('KeycardReader_Green')) return 'Green Safehouse Keypad';
    if (name.includes('KeycardReader_Purple')) return 'Purple Safehouse Keypad';
    
    return name.replace('Animal_', '').replace('DNA_', '').replace('Action', '');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">LIVE EVENT FEED</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Real-time feed of player deaths, crate openings, and safehouse raids on the server.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={fetchEvents}
          disabled={loading}
          style={{ width: 'auto', padding: '0.6rem 1rem' }}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> Refresh
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <RefreshCw className="animate-spin" size={36} style={{ color: 'var(--accent-color)' }} />
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          No events recorded in the last sessions.
        </div>
      ) : (
        <div className="event-feed">
          {events.map((event) => {
            const time = formatTime(event.timestamp);

            if (event.type === 'kill') {
              const { victimName, victimSteamId, killerName, killerSteamId, weapon, distance, isSuicide, isAi } = event.payload;

              return (
                <div key={event.id} className="event-card">
                  <div className="event-icon-wrapper event-icon-kill">
                    <Target size={20} />
                  </div>
                  <div className="event-details">
                    <div className="event-title">
                      {isSuicide ? (
                        <>
                          <Link href={`/player/${victimSteamId}`} className="highlight">{victimName}</Link> committed suicide.
                        </>
                      ) : killerSteamId ? (
                        <>
                          <Link href={`/player/${killerSteamId}`} className="highlight">{killerName}</Link> killed{' '}
                          <Link href={`/player/${victimSteamId}`} className="highlight-red">{victimName}</Link> with{' '}
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{weapon}</span> from{' '}
                          <span className="highlight">{distance?.toFixed(1)}m</span>.
                        </>
                      ) : isAi ? (
                        <>
                          An <span style={{ color: '#f43f5e', fontWeight: 600 }}>Expansion AI</span> killed{' '}
                          <Link href={`/player/${victimSteamId}`} className="highlight-red">{victimName}</Link>.
                        </>
                      ) : (
                        <>
                          <Link href={`/player/${victimSteamId}`} className="highlight-red">{victimName}</Link> died of environmental causes.
                        </>
                      )}
                    </div>
                    <div className="event-time">{time} &bull; PvP Kill</div>
                  </div>
                </div>
              );
            }

            if (event.type === 'pve') {
              const { killerName, killerSteamId, targetType, className } = event.payload;
              const targetName = getCleanClassName(className || '');
              
              return (
                <div key={event.id} className="event-card">
                  <div className="event-icon-wrapper event-icon-pve">
                    <Shield size={20} />
                  </div>
                  <div className="event-details">
                    <div className="event-title">
                      <Link href={`/player/${killerSteamId}`} className="highlight">{killerName}</Link> hunted down a{' '}
                      <span style={{ fontWeight: 600 }}>{targetName}</span> ({targetType}).
                    </div>
                    <div className="event-time">{time} &bull; PvE Hunter</div>
                  </div>
                </div>
              );
            }

            if (event.type === 'dna') {
              const { playerName, playerSteamId, targetClass } = event.payload;
              const nameClean = getCleanClassName(targetClass || '');
              const isCrate = targetClass?.includes('Crate');

              return (
                <div key={event.id} className="event-card">
                  <div className="event-icon-wrapper event-icon-dna">
                    <Key size={20} />
                  </div>
                  <div className="event-details">
                    <div className="event-title">
                      <Link href={`/player/${playerSteamId}`} className="highlight">{playerName}</Link>{' '}
                      successfully unlocked and raided a <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{nameClean}</span>.
                    </div>
                    <div className="event-time">{time} &bull; {isCrate ? 'Crate Opening' : 'Safehouse Unlock'}</div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
