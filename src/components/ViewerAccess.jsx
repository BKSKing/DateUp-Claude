import React, { useState, useEffect } from 'react'; // Added useEffect
import { supabase } from '../config'; 
import { Bell, X, Download, Eye, Calendar, ArrowLeft, ChevronRight } from 'lucide-react';

const TAG_META = {
  general:   { emoji: '📋', cls: 'tag-general',   label: 'General'   },
  urgent:    { emoji: '🚨', cls: 'tag-urgent',    label: 'Urgent'    },
  important: { emoji: '⚠️', cls: 'tag-important', label: 'Important' },
  event:     { emoji: '🎉', cls: 'tag-event',     label: 'Event'     },
};

export default function ViewerAccess({ onBack }) {
  const [groupId, setGroupId]         = useState('');
  const [notices, setNotices]         = useState([]);
  const [orgData, setOrgData]         = useState(null); 
  const [authenticated, setAuth]      = useState(false);
  const [loading, setLoading]         = useState(false);
  const [selected, setSelected]       = useState(null);
  const [notFound, setNotFound]       = useState(false);

  // --- Theme Change Logic ---
  useEffect(() => {
    if (orgData?.custom_branding && orgData?.theme_colors) {
      // document.documentElement color variables ko override karta hai
      document.documentElement.style.setProperty('--orange', orgData.theme_colors.primary);
      document.documentElement.style.setProperty('--orange-dark', orgData.theme_colors.secondary || orgData.theme_colors.primary);
    }
  }, [orgData]);

  const handleAccess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);

    const trimmedId = groupId.trim().toUpperCase();

    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('group_id', trimmedId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setNotices(data);
    
    // Branding info ko pehli notice se nikal kar store karna
    setOrgData({
      org_name: data[0]?.org_name,
      org_logo: data[0]?.org_logo,
      custom_branding: data[0]?.custom_branding,
      theme_colors: data[0]?.theme_colors // Make sure this exists in your DB
    });
    
    setAuth(true);
    setLoading(false);
  };

  const openNotice = async (notice) => {
    setSelected(notice);
    await supabase
      .from('notices')
      .update({ views: (notice.views || 0) + 1 })
      .eq('id', notice.id);
           
    setNotices(prev => 
      prev.map(n => n.id === notice.id ? { ...n, views: (n.views || 0) + 1 } : n)
    );
  };

  if (!authenticated) {
    return (
      <div className="page-center viewer-bg" style={{ minHeight: '100vh' }}>
        <div className="card-glass anim-fadeup" style={{ maxWidth: 440, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 68, height: 68,
              background: 'linear-gradient(135deg, var(--orange), var(--orange-dark))',
              borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: 'var(--shadow-orange)'
            }}>
              <Bell color="white" size={32} />
            </div>
            <div className="logo" style={{ fontSize: 34 }}>Date<span className="logo-dot">Up</span></div>
            <p className="text-muted" style={{ marginTop: 8 }}>Enter your Group ID</p>
          </div>

          <form onSubmit={handleAccess}>
            <input 
              className="input"
              type="text" 
              placeholder="e.g. DU-ABCD-EF12" 
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              required
              style={{ textAlign: 'center', marginBottom: 16 }}
            />
            {notFound && <div className="error-box">❌ Invalid Group ID</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Checking...' : 'Access Notices →'}
            </button>
          </form>
          <hr className="divider" />
          <button className="btn btn-secondary btn-full" onClick={onBack}>
            <ArrowLeft size={16} /> Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <header className="header">
        <div className="header-inner">
          <div className="flex-row">
            {/* Custom Branding Logic */}
            {!orgData?.custom_branding && (
              <div className="logo" style={{ fontSize: 20 }}>
                Date<span className="logo-dot">Up</span>
              </div>
            )}
            {orgData?.custom_branding && orgData?.org_logo && (
              <img 
                 src={orgData.org_logo} 
                 alt={orgData.org_name} 
                 style={{ height: 32, objectFit: 'contain' }} 
               />
            )}
            
            <div style={{ marginLeft: 8 }}>
              <div className="text-xs text-muted" style={{ fontWeight: 600 }}>{orgData?.org_name}</div>
            </div>
          </div>
          
          <div className="flex-row" style={{ gap: 10 }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={() => { 
                setAuth(false); 
                setGroupId(''); 
                setNotices([]); 
                // Reset colors back to default when exiting
                document.documentElement.style.removeProperty('--orange');
                document.documentElement.style.removeProperty('--orange-dark');
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px' }}>
        <div className="feed anim-fadein">
          {notices.map((notice) => {
            const meta = TAG_META[notice.tag] || TAG_META.general;
            return (
              <div key={notice.id} className="card-notice anim-fadeup" onClick={() => openNotice(notice)}>
                <div className="flex-between">
                  <span className={`tag ${meta.cls}`}>{meta.emoji} {meta.label}</span>
                  <ChevronRight size={18} color="var(--gray-400)" />
                </div>
                {notice.image_url && <img src={notice.image_url} alt="" className="notice-image" />}
                <div className="notice-title">{notice.title}</div>
                <p className="notice-desc">{notice.description}</p>
                <div className="notice-meta">
                  <span><Eye size={13} /> {notice.views || 0}</span>
                  <span><Calendar size={13} /> {new Date(notice.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Notice Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="text-head" style={{ fontSize: 17 }}>Notice Detail</div>
              <button 
                onClick={() => setSelected(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  width: 34, height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--gray-400)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {(() => {
                const meta = TAG_META[selected.tag] || TAG_META.general;
                return (
                  <span className={`tag ${meta.cls}`} style={{ marginBottom: 16, display: 'inline-flex' }}>
                    {meta.emoji} {meta.label}
                  </span>
                );
              })()}

              <h2 className="text-head" style={{ fontSize: 22, margin: '12px 0 14px', lineHeight: 1.3 }}>
                {selected.title}
              </h2>

              {selected.image_url && (
                <img 
                  src={selected.image_url} 
                  alt={selected.title} 
                  style={{ 
                    width: '100%', 
                    borderRadius: 14, 
                    marginBottom: 20, 
                    maxHeight: 360, 
                    objectFit: 'cover' 
                  }} 
                />
              )}

              <p style={{ 
                fontSize: 15, 
                lineHeight: 1.8, 
                color: 'rgba(255,255,255,0.8)', 
                whiteSpace: 'pre-wrap',
                marginBottom: 24 
              }}>
                {selected.description}
              </p>

              {selected.pdf_url && (
                <a 
                  href={selected.pdf_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', marginBottom: 24 }}
                >
                  <Download size={17} />
                  Download PDF
                </a>
              )}

              <hr className="divider" />
              <div className="notice-meta" style={{ fontSize: 13 }}>
                <span>👤 {selected.org_name}</span>
                <span><Eye size={14} /> {selected.views || 0} views</span>
                <span>
                  <Calendar size={14} /> 
                  {new Date(selected.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


