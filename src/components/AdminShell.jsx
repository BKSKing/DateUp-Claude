import React, { useState, useEffect } from 'react';
import { supabase } from '../config';
import { Bell, Plus, Users, BarChart2, LogOut, ChevronDown } from 'lucide-react';
import NoticeCreate from './NoticeCreate';
import GroupManager from './GroupManager';
import AdminInfo from './AdminInfo';

export default function AdminShell({ session, onSwitchToViewer }) {
  const [tab, setTab] = useState('create');
  const [orgData, setOrgData] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Auth form state
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (session?.user) fetchOrgData();
    else setLoadingOrg(false);
  }, [session]);

  const fetchOrgData = async () => {
    setLoadingOrg(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!error) setOrgData(data);
    setLoadingOrg(false);
  };

  // --- SSO LOGIC ---
  const handleSSOLogin = async (provider) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider, // 'google' | 'azure' | 'github'
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Create org row
        const { error: orgError } = await supabase.from('organizations').insert({
          id: data.user.id,
          name: orgName,
          email: email,
          notice_count: 0,
          groups: []
        });
        if (orgError) throw orgError;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOrgData(null);
  };

  // ── NOT LOGGED IN ──────────────────────────────
  if (!session) {
    return (
      <div className="page-center viewer-bg" style={{ minHeight: '100vh' }}>
        <div className="card-glass anim-fadeup" style={{ maxWidth: 440, width: '100%' }}>
          {/* Logo */}
          <div className="text-center mb-32">
            <div className="logo" style={{ fontSize: 38, marginBottom: 6 }}>
              Date<span className="logo-dot">Up</span>
            </div>
            <p className="text-muted">Admin & Organization Portal</p>
          </div>

          {/* Toggle */}
          <div className="tabs mb-24" style={{ width: '100%' }}>
            <button
              className={`tab${!isSignup ? ' active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => { setIsSignup(false); setAuthError(''); }}
            >Login</button>
            <button
              className={`tab${isSignup ? ' active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => { setIsSignup(true); setAuthError(''); }}
            >Sign Up</button>
          </div>

          <form onSubmit={handleAuth} className="flex-col" style={{ gap: 16 }}>
            {isSignup && (
              <div>
                <label className="input-label">Organization Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. ABC College, XYZ Society"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="input-label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="admin@org.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {authError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '12px 16px',
                color: '#FC8181',
                fontSize: 14
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full mt-8"
              disabled={authLoading}
            >
              {authLoading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
            </button>
          </form>

          {/* --- SSO BUTTONS SECTION --- */}
          <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
             <hr style={{ opacity: 0.1 }} />
             <span style={{ 
               position: 'absolute', 
               top: '50%', 
               left: '50%', 
               transform: 'translate(-50%, -50%)',
               background: 'var(--glass-bg)',
               padding: '0 10px',
               fontSize: 12,
               color: 'var(--text-muted)'
             }}>OR</span>
          </div>

          <div className="flex-col" style={{ gap: 10 }}>
            <button 
              className="btn btn-secondary btn-full" 
              onClick={() => handleSSOLogin('google')}
              disabled={authLoading}
            >
              <img src="https://www.google.com" style={{ width: 14, marginRight: 8 }} alt=""/>
              Continue with Google
            </button>
            <button 
              className="btn btn-secondary btn-full" 
              onClick={() => handleSSOLogin('azure')}
              disabled={authLoading}
            >
              <img src="https://microsoft.com" style={{ width: 14, marginRight: 8 }} alt=""/>
              Continue with Microsoft
            </button>
          </div>

          <hr className="divider" />
          <button
            className="btn btn-secondary btn-full"
            onClick={onSwitchToViewer}
          >
            Enter as Viewer →
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING ORG ────────────────────────────────
  if (loadingOrg) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span className="text-muted">Loading your workspace...</span>
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="flex-row gap-12">
            <Bell color="var(--orange)" size={26} />
            <div>
              <div className="logo" style={{ fontSize: 22 }}>Date<span className="logo-dot">Up</span></div>
              {orgData && (
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                  {orgData.name}
                </div>
              )}
            </div>
          </div>

          <div className="flex-row" style={{ gap: 10 }}>
            <button className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: 13 }} onClick={onSwitchToViewer}>
              Viewer View
            </button>
            <button className="btn btn-icon" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 24px' }}>
          <div className="container" style={{ padding: 0 }}>
            <div className="tabs" style={{ width: 'fit-content' }}>
              <button className={`tab${tab === 'create' ? ' active' : ''}`} onClick={() => setTab('create')}>
                <Plus size={15} /> Create Notice
              </button>
              <button className={`tab${tab === 'groups' ? ' active' : ''}`} onClick={() => setTab('groups')}>
                <Users size={15} /> Manage Groups
              </button>
              <button className={`tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>
                <BarChart2 size={15} /> Admin Info
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>
        {tab === 'create' && (
          <NoticeCreate
            session={session}
            orgData={orgData}
            refreshOrg={fetchOrgData}
          />
        )}
        {tab === 'groups' && (
          <GroupManager
            session={session}
            orgData={orgData}
            refreshOrg={fetchOrgData}
          />
        )}
        {tab === 'info' && (
          <AdminInfo
            session={session}
            orgData={orgData}
          />
        )}
      </main>
    </div>
  );
}

