import React, { useState } from 'react';
import { supabase } from '../config';
import { Plus, Trash2, Copy, Check, Users } from 'lucide-react';

function generateGroupId(orgId) {
  const part1 = orgId.slice(0, 4).toUpperCase();
  const part2 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const part3 = Date.now().toString(36).slice(-4).toUpperCase();
  return `DU-${part1}-${part2}-${part3}`;
}

export default function GroupManager({ session, orgData, refreshOrg }) {
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating]   = useState(false);
  const [copiedId, setCopiedId]   = useState('');

  const groups = orgData?.groups ?? [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (groups.length >= 10) { alert('Max 10 groups allowed!'); return; }

    setCreating(true);
    const newGroup = {
      id:        generateGroupId(session.user.id),
      name:      groupName.trim(),
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('organizations')
      .update({ groups: [...groups, newGroup] })
      .eq('id', session.user.id);

    if (error) alert('Error: ' + error.message);
    else {
      setGroupName('');
      refreshOrg();
    }
    setCreating(false);
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Delete this group? Members using this ID will lose access.')) return;
    const updated = groups.filter(g => g.id !== groupId);
    const { error } = await supabase
      .from('organizations')
      .update({ groups: updated })
      .eq('id', session.user.id);

    if (error) alert('Error: ' + error.message);
    else refreshOrg();
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2200);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <div>
          <h2 className="text-head text-2xl">Manage Groups</h2>
          <p className="text-muted" style={{ marginTop: 4 }}>
            Create groups and share unique IDs with your members
          </p>
        </div>
        <div style={{
          background: 'rgba(255,107,43,0.12)',
          border: '1px solid rgba(255,107,43,0.25)',
          borderRadius: 10,
          padding: '8px 16px',
          color: 'var(--orange)',
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
          fontSize: 14
        }}>
          {groups.length} / 10
        </div>
      </div>

      {/* Create Group Form */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 16,
        padding: '24px',
        margin: '24px 0'
      }}>
        <h3 className="text-head" style={{ fontSize: 15, marginBottom: 14, color: 'var(--gray-400)' }}>
          CREATE NEW GROUP
        </h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12 }}>
          <input
            className="input"
            type="text"
            placeholder="Group name — e.g. Class A, HR Department"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating || groups.length >= 10}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={17} />
            {creating ? 'Creating...' : 'Add Group'}
          </button>
        </form>
      </div>

      {/* Groups List */}
      <div className="flex-col" style={{ gap: 14 }}>
        {groups.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No groups yet</h3>
            <p className="text-sm">Create your first group above. Each group gets a unique ID to share with members.</p>
          </div>
        )}

        {groups.map((group, idx) => (
          <div
            key={group.id}
            className="group-card anim-fadeup"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div style={{ flex: 1 }}>
              <div className="flex-row" style={{ gap: 10, marginBottom: 10 }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--orange), var(--orange-dark))',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-head)',
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div>
                  <div className="text-head" style={{ fontSize: 17 }}>{group.name}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                    Created {new Date(group.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* ID Box */}
              <div className="group-id-box">
                <span>{group.id}</span>
                <button
                  onClick={() => copyId(group.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedId === group.id ? '#68D391' : 'var(--orange)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    transition: 'color 0.2s'
                  }}
                  title="Copy ID"
                >
                  {copiedId === group.id ? <Check size={16} /> : <Copy size={16} />}
                </button>
                {copiedId === group.id && (
                  <span style={{ fontSize: 12, color: '#68D391', fontFamily: 'var(--font-body)' }}>
                    Copied!
                  </span>
                )}
              </div>

              <p className="text-xs text-muted" style={{ marginTop: 10 }}>
                📤 Share this ID with your group members so they can access notices
              </p>
            </div>

            <button
              className="btn btn-danger"
              onClick={() => handleDelete(group.id)}
              style={{ marginLeft: 20, flexShrink: 0 }}
              title="Delete group"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Info Box */}
      {groups.length > 0 && (
        <div style={{
          marginTop: 28,
          background: 'rgba(99,179,237,0.07)',
          border: '1px solid rgba(99,179,237,0.18)',
          borderRadius: 12,
          padding: '16px 20px',
          color: '#90CDF4',
          fontSize: 13,
          lineHeight: 1.7
        }}>
          <strong>ℹ️ How Group IDs work:</strong><br />
          Members open DateUp → Enter Viewer mode → Paste the Group ID → They see all notices for that group only. No account needed!
        </div>
      )}
    </div>
  );
}
