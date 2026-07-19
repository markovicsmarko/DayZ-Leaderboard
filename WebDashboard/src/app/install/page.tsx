'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Key, CheckCircle, AlertTriangle, Play, RefreshCw } from 'lucide-react';

export default function InstallPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  // Form Fields
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('3306');
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('dayz_leaderboard');
  const [apiKey, setApiKey] = useState('');

  // Read-only environment states (Vercel)
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [resolvedDbUrl, setResolvedDbUrl] = useState('');
  const [resolvedApiKey, setResolvedApiKey] = useState('');

  // Check if already installed on mount
  useEffect(() => {
    fetch('/api/install')
      .then((res) => res.json())
      .then((data) => {
        if (data.installed) {
          router.push('/');
        } else {
          generateApiKey();
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'DZLB_';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(result);
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarning('');
    setSuccess(false);

    try {
      const response = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, username, password, database, apiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isReadOnly) {
          setIsReadOnly(true);
          setResolvedDbUrl(data.databaseUrl);
          setResolvedApiKey(data.apiKey);
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } else {
        if (data.warning) {
          setWarning(data.warning);
        }
        setError(data.error || 'Setup failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during connection test.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-color)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '3rem auto' }}>
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          <Database size={48} />
        </div>
        <h1 className="form-title">Database Setup Wizard</h1>
        <p className="form-subtitle">Configure your MySQL database and generate access keys for your DayZ Server mod.</p>

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <div>
              <strong>Success!</strong> Database configured successfully. Tables created. Redirecting to Leaderboard...
            </div>
          </div>
        )}

        {error && !isReadOnly && (
          <div className="alert alert-danger" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} />
              <strong>Installation Error</strong>
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>{error}</p>
          </div>
        )}

        {warning && (
          <div className="alert alert-danger" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', color: '#fbbf24' }}>
            <AlertTriangle size={20} />
            <div>{warning}</div>
          </div>
        )}

        {isReadOnly ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div className="alert alert-success" style={{ background: 'rgba(0, 221, 255, 0.05)', border: '1px solid var(--accent-color)', color: 'var(--text-primary)', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--accent-color)' }} />
                <strong>Database Connection Verified!</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                We successfully connected to your database, but because your host (Vercel) is serverless/read-only, we cannot write config files. You must add these settings manually to your project environment variables.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-color)', fontSize: '1.1rem', marginBottom: '1rem' }}>Required Environment Variables</h3>
              
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Name: DATABASE_URL</label>
                <div className="input-group-action">
                  <input type="text" className="form-control" readOnly value={resolvedDbUrl} style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)' }} />
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                    navigator.clipboard.writeText(resolvedDbUrl);
                    alert('DATABASE_URL copied to clipboard!');
                  }}>Copy</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Name: API_KEY</label>
                <div className="input-group-action">
                  <input type="text" className="form-control" readOnly value={resolvedApiKey} style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)' }} />
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                    navigator.clipboard.writeText(resolvedApiKey);
                    alert('API_KEY copied to clipboard!');
                  }}>Copy</button>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1.2rem', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent-green)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>How to complete the setup:</h4>
              <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Log into your <strong>Vercel Dashboard</strong>.</li>
                <li>Go to <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</li>
                <li>Add the two variables shown above exactly as they are named.</li>
                <li>Go to the <strong>Deployments</strong> tab and trigger a <strong>Redeploy</strong> (or push a commit) to apply the variables.</li>
                <li>Ensure you copy the <strong>API_KEY</strong> and paste it in your DayZ Server's config.</li>
              </ol>
            </div>

            <button type="button" className="btn btn-primary" onClick={() => router.push('/')} style={{ marginTop: '0.5rem' }}>
              Bypass Setup & Check Leaderboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleInstall}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>MySQL Credentials</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Database Host</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={host} 
                  onChange={(e) => setHost(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Port</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={port} 
                  onChange={(e) => setPort(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Database Password"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Database Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={database} 
                onChange={(e) => setDatabase(e.target.value)} 
                required 
              />
            </div>

            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--accent-color)' }}>Security Settings</h3>

            <div className="form-group">
              <label className="form-label">DayZ Server API Key</label>
              <div className="input-group-action">
                <input 
                  type="text" 
                  className="form-control" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  required 
                  style={{ fontFamily: 'monospace' }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={generateApiKey}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Key size={16} /> Generate
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                Copy this key! You must put this key into your DayZ server profile folder config file: <code style={{ color: 'var(--accent-color)' }}>DayZLeaderboard/config.json</code>
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Testing Connection & Installing...
                </>
              ) : (
                <>
                  <Play size={18} /> Run Installation & Sync Database
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
