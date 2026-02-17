import React, { useState } from 'react';
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
  const [orgName, setOrgName]         = useState('');
  const [authenticated, setAuth]      = useState(false);
  const [loading, setLoading]         = useState(false);
  const [selected, setSelected]       = useState(null);
  const [notFound, setNotFound]       = useState(false);

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
    setOrgName(data[0]?.org_name ?? 'Organization');
    setAuth(true);
    setLoading(false);
  };

  const openNotice = async (notice) => {
    setSelected(notice);
    // Increment views
    await supabase
      .from('notices')
      .update({ views: (notice.views || 0) + 1 })
      .eq('id', notice.id);
    // Update local state
    setNotices(prev =>
      prev.map(n => n.id === notice.id ? { ...n, views: (n.views || 0) + 1 } : n)
    );
  };

  // ── GROUP ID ENTRY PAGE ───────────────────────
  if (!authenticated) {
    return (
      <div className="page-center viewer-bg" style={{ minHeight: '100vh' }}>
        <div className="card-glass anim-fadeup" style={{ maxWidth: 440, width: '100%' }}>
          {/* Logo */}
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
            <p className="text-muted" style={{ marginTop: 8 }}>
              Enter your Group ID to access notices
            </p>
          </div>

          <form onSubmit={handleAccess}>
            <label className="input-label">Group ID</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. DU-ABCD-EF12-GH34"
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              required
              style={{ textAlign: 'center', fontSize: 16, letterSpacing: '0.06em', marginBottom: 16 }}
            />

            {notFound && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '12px 16px',
                color: '#FC8181',
                fontSize: 14,
                marginBottom: 16,
                textAlign: 'center'
              }}>
                ❌ Invalid Group ID or no notices found
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ fontSize: 16, padding: '15px' }}
            >
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

  // ── FEED ─────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="flex-row">
            <Bell color="var(--orange)" size={24} />
            <div>
              <div className="logo" style={{ fontSize: 20 }}>Date<span className="logo-dot">Up</span></div>
              <div className="text-xs text-muted">{orgName}</div>
            </div>
          </div>
          <div className="flex-row" style={{ gap: 10 }}>
            <div style={{
              background: 'rgba(255,107,43,0.12)',
              border: '1px solid rgba(255,107,43,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              color: 'var(--orange)',
              fontFamily: 'var(--font-head)',
              fontWeight: 600
            }}>
              {notices.length} notice{notices.length !== 1 ? 's' : ''}
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={() => { setAuth(false); setGroupId(''); setNotices([]); }}
            >
              Change Group
            </button>
          </div>
        </div>
      </header>

      {/* Feed */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px' }}>
        <h2 className="text-head" style={{ fontSize: 18, marginBottom: 20, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>
          Latest Notices
        </h2>

        <div className="feed anim-fadein">
          {notices.map((notice, idx) => {
            const meta = TAG_META[notice.tag] || TAG_META.general;
            return (
              <div
                key={notice.id}
                className="card-notice anim-fadeup"
                style={{ animationDelay: `${idx * 70}ms` }}
                onClick={() => openNotice(notice)}
              >
                {/* Top row */}
                <div className="flex-between">
                  <div className="flex-row" style={{ gap: 8 }}>
                    <span className={`tag ${meta.cls}`}>
                      {meta.emoji} {meta.label}
                    </span>
                  </div>
                  <ChevronRight size={18} color="var(--gray-400)" />
                </div>

                {/* Image */}
                {notice.image_url && (
                  <img
                    src={notice.image_url}
                    alt={notice.title}
                    className="notice-image"
                  />
                )}

                {/* Title + desc */}
                <div className="notice-title">{notice.title}</div>
                <p className="notice-desc">{notice.description}</p>

                {/* Meta */}
                <div className="notice-meta">
                  <span><Eye size={13} /> {notice.views || 0}</span>
                  <span><Calendar size={13} />
                    {new Date(notice.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                  </span>
                  {notice.pdf_url && (
                    <span style={{ color: '#F6AD55' }}>📎 PDF attached</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {notices.length === 0 && (
          <div className="empty-state">
            <Bell size={48} />
            <h3>No notices yet</h3>
            <p className="text-sm">Check back soon for updates from your organization.</p>
          </div>
        )}
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
              {/* Tag */}
              {(() => {
                const meta = TAG_META[selected.tag] || TAG_META.general;
                return (
                  <span className={`tag ${meta.cls}`} style={{ marginBottom: 16, display: 'inline-flex' }}>
                    {meta.emoji} {meta.label}
                  </span>
                );
              })()}

              {/* Title */}
              <h2 className="text-head" style={{ fontSize: 22, margin: '12px 0 14px', lineHeight: 1.3 }}>
                {selected.title}
              </h2>

              {/* Image */}
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

              {/* Description */}
              <p style={{
                fontSize: 15,
                lineHeight: 1.8,
                color: 'rgba(255,255,255,0.8)',
                whiteSpace: 'pre-wrap',
                marginBottom: 24
              }}>
                {selected.description}
              </p>

              {/* PDF Download */}
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

              {/* Footer */}
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
