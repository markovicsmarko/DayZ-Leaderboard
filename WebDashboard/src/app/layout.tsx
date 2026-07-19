import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Trophy, Activity, Github } from 'lucide-react';
import settings from '@/config/settings.json';

export const metadata: Metadata = {
  title: 'DayZ Leaderboard & Player Stats',
  description: 'Track PvP kills, longest shots, playtimes, bank accounts, and DNA Safehouse raids in real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout-container">
          <header className="navbar">
            <Link href="/" className="nav-logo">
              <Trophy className="logo-glow" size={24} />
              <span>DAYZ<span className="logo-glow">LEADERBOARD</span></span>
            </Link>
            <nav className="nav-links">
              <Link href="/" className="nav-link">
                <Trophy size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Leaderboard
              </Link>
              {settings.features.live_feed.enabled && (
                <Link href="/events" className="nav-link">
                  <Activity size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Live Feed
                </Link>
              )}
            </nav>
          </header>
          
          <main className="main-content">
            {children}
          </main>

          <footer className="footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <p>&copy; {new Date().getFullYear()} DayZ Leaderboard System. All statistics updated in real-time.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Developed by{' '}
              <a href="https://github.com/markovicsmarko" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
                Marko
              </a>{' '}
              &bull; Contact:{' '}
              <a href="mailto:markovicsmarkoo@gmail.com" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                markovicsmarkoo@gmail.com
              </a>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '0.25rem', textAlign: 'center', maxWidth: '600px' }}>
              This website is a community project and is not affiliated with, authorized, or endorsed by Bohemia Interactive a.s. DayZ and Bohemia Interactive are trademarks or registered trademarks of Bohemia Interactive a.s.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
