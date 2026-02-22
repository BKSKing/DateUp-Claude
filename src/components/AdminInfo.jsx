import React, { useState, useEffect } from 'react';
import { supabase } from '../config';
import { Trash2, Eye, Calendar, Tag, FileText, Image, TrendingUp, Mail, Zap } from 'lucide-react';

const TAG_META = {
  general:   { emoji: '📋', cls: 'tag-general'   },
  urgent:    { emoji: '🚨', cls: 'tag-urgent'    },
  important: { emoji: '⚠️', cls: 'tag-important' },
  event:     { emoji: '🎉', cls: 'tag-event'     },
};

export default function AdminInfo({ session, orgData }) {
  const [notices, setNotices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState('');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('org_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error) setNotices(data || []);
    setLoading(false);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Delete this notice permanently?')) return;
    setDeleting(noticeId);

    const { error } = await supabase.from('notices').delete().eq('id', noticeId);
    if (error) alert('Error: ' + error.message);
    else {
      setNotices(prev => prev.filter(n => n.id !== noticeId));
      if (orgData?.notice_count > 0) {
        await supabase.from('organizations')
          .update({ notice_count: orgData.notice_count - 1 })
          .eq('id', session.user.id);
      }
    }
    setDeleting('');
  };

  const totalViews  = notices.reduce((s, n) => s + (n.views || 0), 0);
  const thisMonth   = notices.filter(n => {
    const d = new Date(n.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p className="text-muted" style={{ marginTop: 16 }}>Loading your notices...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 className="text-head text-2xl" style={{ marginBottom: 8 }}>Admin Info</h2>
      <p className="text-muted" style={{ marginBottom: 28 }}>
        Overview of your notices and engagement stats
      </p>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-num">{notices.length}</div>
          <div className="stat-label">Total Notices</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{totalViews}</div>
          <div className="stat-label">Total Views</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{thisMonth}<span style={{ fontSize: 20 }}>/50</span></div>
          <div className="stat-label">This Month</div>
        </div>
      </div>

      {/* Support Card */}
      <div className="card" style={{ 
        marginBottom: 32, 
        padding: '20px', 
        background: 'rgba(255,255,255,0.03)', 
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 4 }}>Need Help?</h3>
          <p className="text-sm text-muted">
            {orgData?.subscription_plan === 'professional' 
              ? '🚀 Priority support - 2hr response time' 
              : '📧 Email support - 24-48hr response'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href = 'mailto:support@example.com'}>
          Contact Support
        </button>
      </div>

      {/* Notices List */}
      {notices.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No notices yet</h3>
          <p className="text-sm">Create your first notice to see it here.</p>
        </div>
      ) : (
        <div className="flex-col" style={{ gap: 14 }}>
          {notices.map((notice, idx) => {
            const meta = TAG_META[notice.tag] || TAG_META.general;
            const groupName = orgData?.groups?.find(g => g.id === notice.group_id)?.name ?? notice.group_id;

            return (
              <div
                key={notice.id}
                className="anim-fadeup"
                style={{
                  background: 'var(--navy-mid)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  animationDelay: `${idx * 50}ms`
                }}
              >
                {/* Thumbnail */}
                {notice.image_url ? (
                  <img
                    src={notice.image_url}
                    alt=""
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 72, height: 72,
                    background: 'rgba(255,107,43,0.1)',
                    border: '1px solid rgba(255,107,43,0.2)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <FileText color="var(--orange)" size={28} />
                  </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex-row" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className={`tag ${meta.cls}`}>{meta.emoji} {notice.tag}</span>
                    <span style={{
                      fontSize: 12, color: 'var(--gray-400)', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '2px 10px'
                    }}>
                      👥 {groupName}
                    </span>
                  </div>

                  <div className="text-head" style={{ fontSize: 16, marginBottom: 6 }}>{notice.title}</div>
                  <p className="text-sm text-muted" style={{
                    lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {notice.description}
                  </p>

                  <div className="notice-meta" style={{ marginTop: 12 }}>
                    <span><Eye size={13} /> {notice.views || 0} views</span>
                    <span>
                      <Calendar size={13} />
                      {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(notice.id)}
                  disabled={deleting === notice.id}
                  style={{ flexShrink: 0, padding: '10px 14px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

