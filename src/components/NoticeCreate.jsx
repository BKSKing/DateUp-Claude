import React, { useState } from 'react';
import { supabase, uploadToCloudinary } from '../config';
import { Upload, FileText, Image, Send, AlertCircle } from 'lucide-react';

const TAGS = [
  { value: 'general',   label: 'General',   emoji: '📋' },
  { value: 'urgent',    label: 'Urgent',     emoji: '🚨' },
  { value: 'important', label: 'Important',  emoji: '⚠️' },
  { value: 'event',     label: 'Event',      emoji: '🎉' },
];

export default function NoticeCreate({ session, orgData, refreshOrg }) {
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [tag, setTag]                   = useState('general');
  const [imageFile, setImageFile]       = useState(null);
  const [pdfFile, setPdfFile]           = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [success, setSuccess]           = useState(false);

  const quota = orgData?.notice_count ?? 0;
  const quotaPct = Math.min((quota / 50) * 100, 100);
  const quotaReached = quota >= 50;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup) { alert('Please select a group'); return; }
    if (quotaReached)   { alert('Monthly limit of 50 notices reached!'); return; }

    setUploading(true);
    try {
      let imageUrl = '';
      let pdfUrl   = '';

      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);
      if (pdfFile)   pdfUrl   = await uploadToCloudinary(pdfFile);

      const { error } = await supabase.from('notices').insert({
        org_id:    session.user.id,
        org_name:  orgData.name,
        group_id:  selectedGroup,
        title,
        description,
        tag,
        image_url: imageUrl,
        pdf_url:   pdfUrl,
        views:     0,
      });
      if (error) throw error;

      // Increment notice count
      await supabase.from('organizations')
        .update({ notice_count: quota + 1 })
        .eq('id', session.user.id);

      setTitle('');
      setDescription('');
      setSelectedGroup('');
      setTag('general');
      setImageFile(null);
      setPdfFile(null);
      setSuccess(true);
      refreshOrg();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 className="text-head text-2xl" style={{ marginBottom: 8 }}>Create Notice</h2>
      <p className="text-muted" style={{ marginBottom: 28 }}>
        Publish a notice to your group members
      </p>

      {/* Quota */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 28
      }}>
        <div className="flex-between">
          <span className="text-sm text-muted">Monthly Notices</span>
          <span className="text-sm" style={{ color: quotaReached ? '#FC8181' : 'var(--orange)', fontWeight: 600 }}>
            {quota} / 50
          </span>
        </div>
        <div className="quota-bar-bg" style={{ marginTop: 10 }}>
          <div
            className="quota-bar-fill"
            style={{ width: `${quotaPct}%`, background: quotaReached ? '#EF4444' : undefined }}
          />
        </div>
        {quotaReached && (
          <p className="text-sm" style={{ color: '#FC8181', marginTop: 10 }}>
            ⚠️ Monthly limit reached. Upgrade to continue posting.
          </p>
        )}
      </div>

      {success && (
        <div style={{
          background: 'rgba(72,187,120,0.12)',
          border: '1px solid rgba(72,187,120,0.3)',
          borderRadius: 12,
          padding: '14px 18px',
          color: '#68D391',
          marginBottom: 24,
          fontWeight: 600
        }}>
          ✅ Notice published successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label className="input-label">Notice Title *</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Holiday Schedule Update"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label className="input-label">Description *</label>
          <textarea
            className="textarea"
            placeholder="Write the full notice content here..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={5}
          />
        </div>

        {/* Group + Tag */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div>
            <label className="input-label">Select Group *</label>
            <select
              className="select"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              required
            >
              <option value="">Choose a group...</option>
              {orgData?.groups?.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {(!orgData?.groups || orgData.groups.length === 0) && (
              <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                No groups yet. Create groups in "Manage Groups" tab.
              </p>
            )}
          </div>

          <div>
            <label className="input-label">Tag *</label>
            <select
              className="select"
              value={tag}
              onChange={e => setTag(e.target.value)}
            >
              {TAGS.map(t => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Uploads */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          {/* Image */}
          <div>
            <label className="input-label">Image (optional)</label>
            <label className={`upload-zone${imageFile ? ' has-file' : ''}`}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => setImageFile(e.target.files[0] || null)}
              />
              <Image size={28} />
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>
                {imageFile ? `✓ ${imageFile.name}` : 'Click to upload image'}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>JPG, PNG, WEBP</div>
            </label>
          </div>

          {/* PDF */}
          <div>
            <label className="input-label">PDF (optional)</label>
            <label className={`upload-zone${pdfFile ? ' has-file' : ''}`}>
              <input
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={e => setPdfFile(e.target.files[0] || null)}
              />
              <FileText size={28} />
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>
                {pdfFile ? `✓ ${pdfFile.name}` : 'Click to upload PDF'}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>PDF only</div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={uploading || quotaReached}
          style={{ fontSize: 16, padding: '16px' }}
        >
          <Send size={18} />
          {uploading ? 'Publishing...' : 'Publish Notice'}
        </button>
      </form>
    </div>
  );
}
