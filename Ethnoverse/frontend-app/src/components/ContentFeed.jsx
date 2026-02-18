import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { FileAudio, FileText, FileImage, Image as ImageIcon, ChevronDown, ChevronUp, Mic, User } from 'lucide-react';

/* ── Type config ─────────────────────────────────────── */
const TYPE_CONFIG = {
  audio_transcription: { icon: <Mic size={18} />,      bg: '#eff6ff', color: '#3b82f6', label: 'Audio' },
  handwriting_ocr:     { icon: <FileImage size={18} />, bg: '#faf5ff', color: '#a855f7', label: 'Handwritten Doc' },
  image:               { icon: <ImageIcon size={18} />, bg: '#fef2f2', color: '#ef4444', label: 'Image' },
  text_with_image:     { icon: <ImageIcon size={18} />, bg: '#fef2f2', color: '#ef4444', label: 'Text with Image' },
  default:             { icon: <FileText size={18} />,  bg: '#f0fdf4', color: '#10b981', label: 'Text' },
};

const getType = (source) => TYPE_CONFIG[source] || TYPE_CONFIG.default;

/* ── Skeleton loader ────────────────────────────────── */
const Skeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {[1, 2, 3].map(i => (
      <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--color-border)', animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#e2e8f0', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '40%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '10px' }} />
            <div style={{ width: '100%', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ width: '80%', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ── Single feed card ───────────────────────────────── */
const FeedCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const source   = item.metadata?.source || 'default';
  const typeConf = getType(source);
  const text     = item.page_content || '';
  const truncated = text.length > 280;
  const displayText = expanded || !truncated ? text : text.slice(0, 280) + '…';

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '16px', padding: '20px',
      border: '1px solid var(--color-border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* Type icon */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          backgroundColor: typeConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {React.cloneElement(typeConf.icon, { color: typeConf.color })}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* User avatar */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                backgroundColor: 'var(--color-primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700,
              }}>
                {(item.metadata?.user_id || 'A')[0].toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
                {item.metadata?.user_id || 'Anonymous'}
              </span>
            </div>
            {/* Type badge */}
            <span style={{
              backgroundColor: typeConf.bg, color: typeConf.color,
              border: `1px solid ${typeConf.color}30`,
              padding: '3px 10px', borderRadius: '20px',
              fontSize: '0.72rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              {React.cloneElement(typeConf.icon, { size: 11, color: typeConf.color })} {typeConf.label}
            </span>
          </div>

          {/* Content text */}
          <p style={{ margin: '0 0 12px', fontSize: '0.9rem', lineHeight: 1.7, color: '#374151', wordBreak: 'break-word' }}>
            {displayText}
          </p>

          {/* Read more toggle */}
          {truncated && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'none', border: 'none', color: 'var(--color-primary)',
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px',
              }}
            >
              {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
            </button>
          )}

          {/* Media preview */}
          {item.metadata?.file_url && (
            <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              {(source === 'audio_transcription' || source === 'audio' || item.metadata.file_url.includes('/audio/')) && (
                <audio controls src={item.metadata.file_url} style={{ width: '100%', display: 'block' }} />
              )}
              {(source === 'handwriting_ocr' || source === 'image' || source === 'text_with_image') && (
                <img src={item.metadata.file_url} alt="Source media" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main component ─────────────────────────────────── */
const ContentFeed = ({ communityId }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.get(`http://localhost:8002/content/${communityId}`);
        setContent(response.data);
      } catch (error) {
        console.error('Failed to fetch community content:', error);
      } finally {
        setLoading(false);
      }
    };
    if (communityId) fetchContent();
  }, [communityId]);

  if (loading) return <Skeleton />;

  if (content.length === 0) return (
    <div style={{
      backgroundColor: 'white', border: '1px dashed var(--color-border)',
      borderRadius: '16px', padding: '56px 24px',
      textAlign: 'center', color: 'var(--color-text-muted)',
    }}>
      <FileText size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
      <h3 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--color-text-dark)' }}>No content yet</h3>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>Be the first to share knowledge with this community!</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontWeight: 700, color: 'var(--color-text-dark)', fontSize: '0.9rem' }}>
          {content.length} Contribution{content.length !== 1 ? 's' : ''}
        </span>
      </div>
      {content.map((item, i) => <FeedCard key={i} item={item} />)}
    </div>
  );
};

export default ContentFeed;
