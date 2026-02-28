import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Mic, BookOpen, FileText as FileTextIcon,
  CloudUpload, Plus, Bold, Italic, List,
  Send, RefreshCw, CheckCircle, AlertTriangle, Loader, ArrowRight
} from 'lucide-react';

/* ─── Step config ─────────────────────────────────── */
const STEPS = [
  { num: 1, label: 'Type' },
  { num: 2, label: 'Upload' },
  { num: 3, label: 'Preview' },
  { num: 4, label: 'Verify' },
  { num: 5, label: 'Submit' },
];

/* ─── Content type cards (from reference image) ───── */
const TYPES = [
  {
    id: 'audio',
    icon: <Mic size={28} color="#3b82f6" />,
    iconBg: '#eff6ff',
    title: 'Audio Recording',
    desc: 'Oral histories, folklore recitations, or linguistic samples from native speakers.',
    accept: 'audio/*',
  },
  {
    id: 'handwriting',
    icon: <BookOpen size={28} color="#a855f7" />,
    iconBg: '#faf5ff',
    title: 'Handwritten Doc',
    desc: 'Scanned manuscripts, letters, or ancient scriptures requiring OCR processing.',
    accept: 'image/*',
  },
  {
    id: 'text',
    icon: <FileTextIcon size={28} color="#ef4444" />,
    iconBg: '#fef2f2',
    title: 'Text Knowledge',
    desc: 'Direct digital entry of traditional knowledge, recipes, or community laws.',
    accept: null,
  },
];

/* ─── Helper: current active step number ─────────── */
const getActiveStep = (file, submitting, transcribedText) => {
  if (submitting) return 5;
  if (transcribedText) return 4;
  if (file) return 3;
  return 1;
};

/* ══════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════ */
const Upload = () => {
  const { id: communityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('audio');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [transcribedText, setTranscribedText] = useState('');
  const [contentId, setContentId] = useState('');
  const [fileUrl, setFileUrl] = useState(null);

  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const fileInputRef = useRef(null);

  const activeStep = getActiveStep(file, submitting, transcribedText);

  /* ── Handlers ──────────────────────────────────── */
  const processFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    // Only clear transcribed text if we are re-transcribing audio or OCR
    if (type !== 'text') {
      setTranscribedText('');
    }
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user.username);

      let response;
      if (type === 'audio') {
        response = await api.post('http://localhost:8000/transcribe/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setTranscribedText(response.data.transcription || response.data);
        setContentId(`audio_${selectedFile.name}`);
        setFileUrl(response.data.file_url);
      } else if (type === 'handwriting') {
        response = await api.post('http://localhost:8003/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setTranscribedText(response.data.ocr_text);
        setContentId(`ocr_${selectedFile.name}`);
        setFileUrl(response.data.file_url);
      } else if (type === 'text') {
        // Just upload the image without running OCR
        response = await api.post('http://localhost:8003/upload_image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setContentId(`text_image_${selectedFile.name}`);
        setFileUrl(response.data.file_url);
      }
    } catch (err) {
      console.error(err);
      alert('Processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [type, user]);

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setFile(null);
    setTranscribedText('');
    if (newType === 'text') {
      setContentId(`text_${Date.now()}`);
      setFileUrl(null);
    }
  };

  const handleSubmitToAgent = async () => {
    if (!transcribedText.trim()) {
      alert('Please enter or process some text first.');
      return;
    }
    setSubmitting(true);
    setShowLogs(true);
    setLogs([]);
    setResult(null);

    try {
      const payload = {
        text_content: transcribedText,
        user_id: user.username,
        content_id: contentId || `text_${Date.now()}`,
        content_type:
          type === 'audio' ? 'audio_transcription' : type === 'text' ? (fileUrl ? 'text_with_image' : 'direct_text') : 'handwriting_ocr',
        community_id: parseInt(communityId) || 0,
        file_url: fileUrl,
      };

      const response = await fetch('http://localhost:8002/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.body) throw new Error('ReadableStream not supported');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'status') setLogs(p => [...p, `[${event.stage.toUpperCase()}] ${event.message}`]);
            else if (event.type === 'result') { setResult(event.payload); setLogs(p => [...p, `[COMPLETE] Status: ${event.payload.status}`]); }
            else if (event.type === 'error') setLogs(p => [...p, `[ERROR] ${event.message}`]);
          } catch (e) { console.error('Parse error:', line, e); }
        }
      }
    } catch (err) {
      console.error(err);
      setLogs(p => [...p, `[SYSTEM ERROR] ${err.message}`]);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* ── Page Header ───────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 6px' }}>
          Upload Knowledge
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
          Contribute to the digital preservation of cultural heritage and ancestral wisdom.
        </p>
      </div>

      {/* ── Stepper ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px', position: 'relative' }}>
        {/* connector track */}
        <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }} />
        <div style={{
          position: 'absolute', top: '15px', left: '0',
          width: `${((activeStep - 1) / (STEPS.length - 1)) * 100}%`,
          height: '4px', backgroundColor: 'var(--color-primary)', zIndex: 1, transition: 'width 0.4s ease'
        }} />
        {STEPS.map((s) => {
          const done = s.num < activeStep;
          const current = s.num === activeStep;
          return (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 2 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: current || done ? 'var(--color-primary)' : 'white',
                color: current || done ? 'white' : '#cbd5e1',
                border: current || done ? 'none' : '2px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem',
                boxShadow: current ? '0 0 0 4px rgba(26,35,126,0.12)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <CheckCircle size={16} /> : s.num}
              </div>
              <span style={{
                fontSize: '0.78rem', fontWeight: current ? 700 : 500,
                color: current ? 'var(--color-primary)' : '#94a3b8',
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Choose Content Type ─────────── */}
      <section style={{ marginBottom: '32px' }}>
        <SectionHeading emoji="🎵" text="Step 1: Choose Content Type" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {TYPES.map((t) => (
            <TypeCard
              key={t.id}
              {...t}
              active={type === t.id}
              onClick={() => handleTypeChange(t.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Step 2: Upload Files ─────────────────── */}
      <section style={{ marginBottom: '32px' }}>
        <SectionHeading emoji="📄" text={type === 'text' ? "Step 2: Upload Image (Optional)" : "Step 2: Upload Files"} />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept={type === 'text' ? 'image/*' : TYPES.find(t => t.id === type)?.accept}
        />
          {/* Drop zone */}
          <div
            onClick={() => !file && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--color-primary)' : file ? '#86efac' : '#cbd5e1'}`,
              borderRadius: '16px',
              padding: '56px 40px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: dragOver ? 'rgba(26,35,126,0.03)' : file ? '#f0fdf4' : 'white',
              cursor: file ? 'default' : 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: file ? '#dcfce7' : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              {file
                ? <CheckCircle size={30} color="#16a34a" />
                : <CloudUpload size={30} color="var(--color-primary)" />}
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-dark)' }}>
              {file ? file.name : 'Drag and drop your files here'}
            </h3>
            {!file && (
              <>
                <p style={{ color: 'var(--color-text-muted)', margin: '0 0 4px', fontSize: '0.9rem' }}>
                  Supported formats: MP3, WAV, FLAC, JPG, PDF.
                </p>
                <p style={{ color: 'var(--color-text-muted)', margin: '0 0 24px', fontSize: '0.85rem' }}>
                  (Max 50MB per file)
                </p>
                <button
                  className="btn btn-primary"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  style={{ borderRadius: '28px', padding: '12px 32px', fontSize: '0.95rem', gap: '8px' }}
                >
                  <Plus size={18} /> Browse Files
                </button>
              </>
            )}
            {file && (
              <p style={{ color: '#16a34a', fontWeight: 500, margin: '8px 0 0', fontSize: '0.9rem' }}>
                File selected. AI is processing your file…
              </p>
            )}
          </div>
        </section>

      {/* ── Steps 3 & 4: Preview + Manual Verification side-by-side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>

        {/* Step 3: Transcription Preview */}
        <section>
          <SectionHeading emoji="📋" text="Step 3: Transcription Preview" small />
          <div style={{
            background: 'white', border: '1px solid var(--color-border)', borderRadius: '14px',
            minHeight: '260px', overflow: 'hidden', position: 'relative',
          }}>
            <textarea
              readOnly
              value={transcribedText}
              placeholder={
                type === 'text'
                  ? 'Start typing your knowledge entry below…'
                  : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea comm…'
              }
              style={{
                width: '100%', minHeight: '260px', padding: '20px',
                border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.7,
                color: transcribedText ? 'var(--color-text-dark)' : '#c6d1df',
                backgroundColor: 'transparent',
              }}
            />
            {/* Awaiting overlay */}
            {!transcribedText && !loading && type !== 'text' && (
              <div style={{
                position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: 'white', border: '1px solid var(--color-border)',
                borderRadius: '24px', padding: '8px 20px',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-dark)',
                letterSpacing: '0.04em', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <RefreshCw size={13} color="var(--color-primary)" />
                AWAITING FILE UPLOAD…
              </div>
            )}
            {loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.85)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px',
                  backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)',
                }}>
                  <RefreshCw size={14} /> PROCESSING FILE…
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Step 4: Manual Verification */}
        <section>
          <SectionHeading emoji="⚡" text="Step 4: Manual Verification" small />
          <div style={{
            background: 'white', border: '1px solid var(--color-border)', borderRadius: '14px',
            minHeight: '260px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex', gap: '6px', padding: '10px 14px',
              borderBottom: '1px solid var(--color-border)', backgroundColor: '#fafafa',
            }}>
              {[Bold, Italic, List].map((Icon, i) => (
                <button key={i} style={{
                  width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--color-border)', borderRadius: '5px', background: 'white',
                  cursor: 'pointer', color: 'var(--color-text-dark)',
                }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>

            <textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder={
                type === 'text'
                  ? 'Enter your text directly here…'
                  : 'The AI-generated transcription will appear here. You can manually edit or refine the text to ensure cultural and linguistic accuracy…'
              }
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none', padding: '16px',
                fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-dark)',
                minHeight: '200px',
              }}
            />
          </div>
        </section>
      </div>

      {/* ── Moderation Logs ───────────────────────── */}
      {showLogs && (
        <div style={{
          backgroundColor: '#1e293b', color: '#4ade80', borderRadius: '12px',
          padding: '24px', fontFamily: 'monospace', marginBottom: '32px',
        }}>
          <h3 style={{ color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
            Agent Moderation Logs {submitting && <Loader size={15} />}
          </h3>
          <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px' }}>
            {logs.map((log, i) => <div key={i} style={{ marginBottom: '6px', lineHeight: 1.5 }}>{log}</div>)}
          </div>
          {result && (
            <div style={{
              marginTop: '20px', padding: '20px', borderRadius: '8px',
              backgroundColor: result.status === 'ingested' || result.status === 'approved' ? '#dcfce7' : '#fee2e2',
              color: result.status === 'ingested' || result.status === 'approved' ? '#166534' : '#991b1b',
              border: '1px solid',
              borderColor: result.status === 'ingested' ? '#bbf7d0' : '#fecaca',
            }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 8px' }}>
                {result.status === 'ingested' || result.status === 'approved'
                  ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                Status: {result.status.toUpperCase()}
              </h3>
              <p style={{ margin: '0 0 16px' }}>{result.message}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => navigate('/knowledge-graph')} className="btn btn-primary">View in Graph</button>
                <button onClick={() => { setShowLogs(false); setFile(null); setTranscribedText(''); setResult(null); }} className="btn btn-secondary">Upload More</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Submit Button ─────────────────────────── */}
      {!showLogs && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmitToAgent}
            disabled={submitting || (!file && type !== 'text')}
            className="btn btn-primary"
            style={{
              padding: '14px 32px', borderRadius: '30px', fontSize: '1rem',
              gap: '10px', fontWeight: 700,
              opacity: (submitting || (!file && type !== 'text')) ? 0.55 : 1,
              cursor: (submitting || (!file && type !== 'text')) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (<><Loader size={16} /> Processing…</>) : (<>Submit for AI Moderation <ArrowRight size={18} /></>)}
          </button>
        </div>
      )}

      {/* ── Footer ───────────────────────────────── */}
      <div style={{ textAlign: 'center', marginTop: '48px', color: '#94a3b8', fontSize: '0.82rem' }}>
        © 2024 ETHNOVERSE – Global Heritage Preservation Initiative
      </div>
    </div>
  );
};

/* ── Sub-components ──────────────────────────────── */
const SectionHeading = ({ emoji, text, small }) => (
  <h3 style={{
    fontSize: small ? '1rem' : '1.1rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', gap: '8px',
    color: 'var(--color-text-dark)', marginBottom: '14px',
  }}>
    <span>{emoji}</span> {text}
  </h3>
);

const TypeCard = ({ icon, iconBg, title, desc, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: 'white',
      border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
      borderRadius: '16px', padding: '24px',
      cursor: 'pointer', transition: 'all 0.2s',
      boxShadow: active ? '0 4px 20px rgba(26,35,126,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
    }}
  >
    <div style={{
      width: '52px', height: '52px', borderRadius: '14px',
      backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '16px',
    }}>
      {icon}
    </div>
    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-dark)' }}>
      {title}
    </h4>
    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
      {desc}
    </p>
  </div>
);

export default Upload;
