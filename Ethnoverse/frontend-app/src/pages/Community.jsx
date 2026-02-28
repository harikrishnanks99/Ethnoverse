import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Upload, Share2, Activity, ShieldCheck, Users, FileText,
  Mic, Image as ImageIcon, FileImage, ChevronRight, Globe,
  BookOpen, ArrowLeft, Star, Search, Crown, Shield, User, Trash2, Edit3, X
} from 'lucide-react';
import ContentFeed from '../components/ContentFeed';
import CommunityGraph from '../components/CommunityGraph';

/* ─── Banner images by community index ──────────────────── */
const BANNERS = [
  'https://images.unsplash.com/photo-1590481831872-4d0fb6ea22c6?w=1400&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1400&q=80',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1400&q=80',
  'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=1400&q=80',
];

const TABS = [
  { id: 'feed',    label: 'Community Feed',  icon: <Activity size={16} /> },
  { id: 'graph',   label: 'Knowledge Graph', icon: <Share2 size={16} /> },
  { id: 'members', label: 'Members',         icon: <Users size={16} /> },
  { id: 'about',   label: 'About',           icon: <BookOpen size={16} /> },
];

/* ─── Stat pill component ───────────────────────────────── */
const StatPill = ({ icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    backgroundColor: 'white', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '14px 20px', flex: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px',
      backgroundColor: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {React.cloneElement(icon, { size: 20, color })}
    </div>
    <div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-dark)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '3px' }}>
        {label}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════ */
const Community = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [newRule, setNewRule] = useState('');
  const [joined, setJoined] = useState(false);
  const [stats, setStats] = useState({ members: 0, entries: 0, audio: 0, docs: 0 });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const bannerUrl = BANNERS[parseInt(id) % BANNERS.length] || BANNERS[0];

  const fetchData = async () => {
    try {
      const resC = await api.get('http://localhost:8001/communities/');
      const found = resC.data.find(c => c.id === parseInt(id));
      setCommunity(found);
      
      if (found) {
        // Fetch Rules
        try {
          const resR = await api.get(`http://localhost:8001/communities/${id}/rules`);
          setRules(resR.data);
        } catch (_) { /* rules endpoint optional */ }
        
        // Fetch real stats
        try {
            const [membersRes, contentRes] = await Promise.all([
                api.get(`http://localhost:8001/communities/${id}/members`),
                api.get('http://localhost:8002/content')
            ]);
            
            const members = membersRes.data || [];
            const allContent = contentRes.data || [];
            
            // Filter content to only this community. Handle type coercion if ID types mismatch.
            const communityContent = allContent.filter(item => 
                String(item.metadata?.community_id) === String(id)
            );
            
            let audioCount = 0;
            let docCount = 0;
            
            communityContent.forEach(item => {
                const type = item.metadata?.content_type || 'text';
                if (type === 'audio') audioCount++;
                else docCount++;
            });
            
            setStats({
                members: members.length,
                entries: communityContent.length,
                audio: audioCount,
                docs: docCount
            });
            
        } catch (err) {
            console.error("Failed to fetch community stats:", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch community details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      await api.post(`http://localhost:8001/communities/${id}/rules`, { rule_text: newRule, action: 'flag' });
      setNewRule('');
      fetchData();
    } catch (_) { alert('Failed to add rule'); }
  };

  const handleDeleteCommunity = async () => {
    if (window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
      try {
        await api.delete(`http://localhost:8001/communities/${id}`);
        navigate('/communities');
      } catch (err) {
        console.error("Failed to delete community:", err);
        alert('Failed to delete community. Please try again.');
      }
    }
  };

  const openEditModal = () => {
      setEditDesc(community.description || '');
      setEditProfileImage(community.profile_image || '');
      setEditBannerImage(community.banner_image || '');
      setIsEditModalOpen(true);
  };

  const handleSaveCommunity = async (e) => {
      e.preventDefault();
      setSaveLoading(true);
      try {
          const res = await api.put(`http://localhost:8001/communities/${id}`, {
              name: community.name,
              description: editDesc,
              profile_image: editProfileImage || null,
              banner_image: editBannerImage || null
          });
          setCommunity(res.data);
          setIsEditModalOpen(false);
      } catch (err) {
          console.error("Failed to update community:", err);
          alert("Could not update community.");
      } finally {
          setSaveLoading(false);
      }
  };

  const isOwner = user && community && community.owner_id === user.id;

  /* ── Loading state ─────────────────────────────────── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', color: 'var(--color-text-muted)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontWeight: 500 }}>Loading community…</span>
    </div>
  );

  if (!community) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>Community not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/communities')}>← Back to Communities</button>
    </div>
  );

  /* ── Derived display values ────────────────────────── */
  const initials = community.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const actualBannerUrl = community.banner_image || bannerUrl;

  /* ── Render ────────────────────────────────────────── */
  return (
    <div style={{ margin: '-32px', minHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--color-background)' }}>

      {/* ── Hero Banner ────────────────────────────── */}
      <div style={{
        position: 'relative', height: '240px',
        backgroundImage: `url(${actualBannerUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        {/* Dark gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,15,40,0.3) 0%, rgba(10,15,40,0.75) 100%)' }} />

        {/* Back button */}
        <button
          onClick={() => navigate('/communities')}
          style={{
            position: 'absolute', top: '20px', left: '28px',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px',
            color: 'white', fontWeight: 600, fontSize: '0.85rem', padding: '8px 14px',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} /> Communities
        </button>

        {/* Region tag */}
        <div style={{
          position: 'absolute', top: '20px', right: '28px',
          backgroundColor: '#CC9933', color: 'white',
          padding: '6px 14px', borderRadius: '6px',
          fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          GLOBAL
        </div>

        {/* Community avatar overlapping banner */}
        <div style={{
          position: 'absolute', bottom: '-36px', left: '36px',
          width: '80px', height: '80px', borderRadius: '20px',
          backgroundColor: 'var(--color-primary)',
          border: '4px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '1.6rem', fontWeight: 800,
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          backgroundImage: community.profile_image ? `url(${community.profile_image})` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center'
        }}>
          {!community.profile_image && initials}
        </div>
      </div>

      {/* ── Profile Bar ────────────────────────────── */}
      <div style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--color-border)',
        padding: '0 36px',
      }}>
        {/* Name + actions row */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          paddingTop: '48px', paddingBottom: '20px',
        }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 4px' }}>
              {community.name}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> {community.description || 'A community dedicated to preserving cultural heritage.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isOwner && (
                <button
                  onClick={openEditModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                    cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'white',
                    color: 'var(--color-text-dark)', border: '1px solid var(--color-border)',
                  }}
                >
                  <Edit3 size={15} /> Edit Theme
                </button>
            )}
            <button
              onClick={() => setJoined(j => !j)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 22px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: joined ? 'white' : 'var(--color-secondary)',
                color: joined ? 'var(--color-text-dark)' : 'white',
                border: joined ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <Star size={15} fill={joined ? '#f59e0b' : 'none'} color={joined ? '#f59e0b' : 'white'} />
              {joined ? 'Joined' : 'Join'}
            </button>
            <Link
              to={`/communities/${id}/upload`}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 22px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                backgroundColor: 'var(--color-primary)', color: 'white',
                textDecoration: 'none', transition: 'opacity 0.2s',
              }}
            >
              <Upload size={15} /> Upload
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '12px 18px', background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────── */}
      <div style={{ padding: '28px 36px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* ── Main Column ──────────────────────────── */}
        <div>
          {/* Stat cards row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <StatPill icon={<Users />}    label="Members" value={stats.members.toLocaleString()} color="#3b82f6" />
            <StatPill icon={<FileText />} label="Entries"  value={stats.entries.toLocaleString()}  color="#a855f7" />
            <StatPill icon={<Mic />}      label="Audio"    value={stats.audio.toLocaleString()}  color="#f59e0b" />
            <StatPill icon={<FileImage />}label="Docs"     value={stats.docs.toLocaleString()}  color="#10b981" />
          </div>

          {/* Tab content */}
          {activeTab === 'feed'    && <ContentFeed    communityId={community.id} />}
          {activeTab === 'graph'   && <CommunityGraph  communityId={community.id} />}
          {activeTab === 'members' && <MembersPanel     communityId={community.id} memberCount={stats.members} />}
          {activeTab === 'about'   && <AboutPanel       community={community} />}
        </div>

        {/* ── Right Sidebar ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Guidelines */}
          <div style={{
            backgroundColor: 'white', border: '1px solid var(--color-border)',
            borderRadius: '16px', padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: '0 0 14px' }}>
              <ShieldCheck size={18} color="var(--color-primary)" /> Community Guidelines
            </h3>
            {rules.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
                No guidelines set yet.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                {rules.map((rule, i) => (
                  <li key={rule.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    padding: '8px 0', borderBottom: i < rules.length - 1 ? '1px solid var(--color-border)' : 'none',
                    fontSize: '0.85rem', color: 'var(--color-text-dark)', lineHeight: 1.5,
                  }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, minWidth: '18px' }}>{i + 1}.</span>
                    {rule.rule_text}
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddRule} style={{ display: 'flex', gap: '6px' }}>
              <input
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                placeholder="Add a guideline…"
                required
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid var(--color-border)', fontSize: '0.8rem',
                  fontFamily: 'inherit', outline: 'none', margin: 0,
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '8px' }}>
                Add
              </button>
            </form>
          </div>

          {/* Quick actions */}
          <div style={{
            backgroundColor: 'white', border: '1px solid var(--color-border)',
            borderRadius: '16px', padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: '0 0 12px' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ActionItem icon={<Upload size={15} />} label="Upload Contribution" to={`/communities/${id}/upload`} primary />
              <ActionItem icon={<Share2 size={15} />} label="View Knowledge Graph" onClick={() => setActiveTab('graph')} />
              <ActionItem icon={<BookOpen size={15} />} label="Browse Archive" to="/search" />
              <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
              <ActionItem icon={<Trash2 size={15} />} label="Delete Community" onClick={handleDeleteCommunity} destructive />
            </div>
          </div>

        </div>
      </div>
      
      {/* ── Edit Settings Modal ────────────────────── */}
      {isEditModalOpen && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '20px', padding: '32px',
                width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                <button 
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                >
                    <X size={24} />
                </button>
                
                <h2 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', fontSize: '1.75rem', fontWeight: 800 }}>Edit Community</h2>
                
                <form onSubmit={handleSaveCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Description</label>
                        <textarea 
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Community description..."
                            rows={3}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', resize: 'vertical' }}
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Profile Avatar Image URL</label>
                        <input 
                            type="url" 
                            value={editProfileImage}
                            onChange={(e) => setEditProfileImage(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem' }}
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Banner Cover Image URL</label>
                        <input 
                            type="url" 
                            value={editBannerImage}
                            onChange={(e) => setEditBannerImage(e.target.value)}
                            placeholder="https://example.com/banner.jpg"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button 
                            type="button" 
                            onClick={() => setIsEditModalOpen(false)}
                            style={{ padding: '12px 24px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={saveLoading}
                            style={{ padding: '12px 24px', backgroundColor: 'var(--color-primary)', border: 'none', borderRadius: '8px', cursor: saveLoading ? 'not-allowed' : 'pointer', fontWeight: 600, color: 'white', opacity: saveLoading ? 0.7 : 1 }}
                        >
                            {saveLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────── */

const AboutPanel = ({ community }) => (
  <div style={{
    backgroundColor: 'white', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '28px',
  }}>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--color-text-dark)' }}>
      About {community.name}
    </h2>
    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, margin: '0 0 24px' }}>
      {community.description || 'This community is dedicated to the preservation and sharing of cultural heritage, oral histories, and ancestral knowledge within the Ethnoverse network.'}
    </p>
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {[
        { label: 'Community ID', value: `#${community.id}` },
        { label: 'Status', value: 'Active' },
        { label: 'Focus', value: 'Cultural Heritage' },
        { label: 'Network', value: 'ETHNOVERSE Global' },
      ].map(({ label, value }) => (
        <div key={label}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>{value}</div>
        </div>
      ))}
    </div>
  </div>
);

const ActionItem = ({ icon, label, to, onClick, primary, destructive }) => {
  let bgColor = '#f8fafc';
  let textColor = 'var(--color-text-dark)';
  let borderColor = '1px solid var(--color-border)';

  if (primary) {
    bgColor = 'var(--color-primary)';
    textColor = 'white';
    borderColor = 'none';
  } else if (destructive) {
    bgColor = '#fef2f2';
    textColor = '#ef4444';
    borderColor = '1px solid #fecaca';
  }

  const style = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '10px',
    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s', textDecoration: 'none',
    justifyContent: 'space-between',
    backgroundColor: bgColor,
    color: textColor,
    border: borderColor,
  };

  const inner = (
    <>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{icon}{label}</span>
      <ChevronRight size={14} />
    </>
  );

  if (to) return <Link to={to} style={style}>{inner}</Link>;
  return <button onClick={onClick} style={{ ...style, width: '100%' }}>{inner}</button>;
};

/* ── Role config ─────────────────────────────────────── */
const ROLE_CONFIG = {
  owner:     { label: 'Owner',     bg: '#fef3c7', color: '#b45309', icon: <Crown size={12} /> },
  admin:     { label: 'Admin',     bg: '#ede9fe', color: '#7c3aed', icon: <Shield size={12} /> },
  moderator: { label: 'Moderator', bg: '#e0f2fe', color: '#0369a1', icon: <Shield size={12} /> },
  member:    { label: 'Member',    bg: '#f1f5f9', color: '#475569', icon: <User size={12} /> },
};

/* ── Members Panel ───────────────────────────────────── */
const MembersPanel = ({ communityId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(`http://localhost:8001/communities/${communityId}/members`);
        setMembers(res.data);
      } catch (e) {
        console.error('Failed to fetch members:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [communityId]);

  const filtered = members.filter(m =>
    m.username.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: 'var(--color-text-dark)', fontSize: '0.95rem' }}>
          {loading ? 'Loading…' : `${members.length} Member${members.length !== 1 ? 's' : ''}`}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: 'white', border: '1px solid var(--color-border)',
          borderRadius: '10px', padding: '8px 14px', flex: '0 1 300px',
        }}>
          <Search size={15} color="var(--color-text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            style={{ border: 'none', outline: 'none', background: 'none', fontSize: '0.85rem', fontFamily: 'inherit', flex: 1, margin: 0, padding: 0 }}
          />
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#e2e8f0', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ width: '80%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{ backgroundColor: 'white', border: '1px dashed var(--color-border)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Users size={40} style={{ marginBottom: '16px', opacity: 0.25 }} />
          <p style={{ fontWeight: 600, margin: '0 0 6px', color: 'var(--color-text-dark)' }}>Members not available</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>Make sure the auth service is running on port 8001.</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ backgroundColor: 'white', border: '1px dashed var(--color-border)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Users size={40} style={{ marginBottom: '16px', opacity: 0.25 }} />
          <h3 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--color-text-dark)' }}>
            {search ? 'No members match your search' : 'No members yet'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>
            {search ? 'Try a different name or role.' : 'Be the first to join this community!'}
          </p>
        </div>
      )}

      {/* Member card grid */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {filtered.map(member => {
            const role   = member.role?.toLowerCase() || 'member';
            const conf   = ROLE_CONFIG[role] || ROLE_CONFIG.member;
            const initials = member.username.slice(0, 2).toUpperCase();
            const hue    = (member.user_id * 47) % 360;
            return (
              <div
                key={member.membership_id}
                style={{
                  backgroundColor: 'white', border: '1px solid var(--color-border)',
                  borderRadius: '14px', padding: '18px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${hue},60%,50%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: '1rem',
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-dark)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.email}
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    backgroundColor: conf.bg, color: conf.color,
                    padding: '3px 9px', borderRadius: '20px',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {conf.icon} {conf.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Community;
