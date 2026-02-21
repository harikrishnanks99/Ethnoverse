import React, { useState, useEffect } from 'react';
import { Search, Filter, Mic, Image as ImageIcon, Hexagon, Activity, CheckCircle, Navigation, Clock, BookOpen, User, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Contributions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
        try {
            setLoading(true);
            // Fetch raw documents/content from the AI Agent backend SQLite store
            const res = await api.get('http://localhost:8002/content');
            const data = res.data || [];
            
            // Filter by current user if user auth provides an ID or username
            // We assume the metadata stores user_id or uploader
            const userContent = data.filter(doc => {
                const metadata = doc.metadata || {};
                // Handle various property names that might be used for the uploader
                return metadata.user_id === user?.id || 
                       metadata.user_id === user?.username ||
                       metadata.uploader === user?.username ||
                       metadata.user_id === String(user?.id);
            });
            
            // Map the SQLite Document schema (page_content, metadata) to the frontend grid
            const mappedResults = userContent.map((doc, index) => {
                const source = doc.metadata?.source || 'direct_text';
                const isAudio = source === 'audio_transcription' || source === 'audio';
                const isImage = source === 'image' || source === 'handwriting_ocr';
                
                return {
                    id: doc.id || index,
                    title: doc.metadata?.title || `Contribution #${index + 1}`,
                    type: doc.metadata?.source || 'Text Record',
                    affiliation: doc.metadata?.community_id ? `Community ${doc.metadata.community_id}` : 'Global Archive',
                    status: 'VERIFIED',
                    time: doc.metadata?.date_recorded || new Date().toLocaleDateString(),
                    icon: isAudio ? <Mic size={16}/> : (isImage ? <ImageIcon size={16}/> : <BookOpen size={16}/>),
                    color: isAudio ? '#3b82f6' : (isImage ? '#a855f7' : '#10b981'),
                    bg: isAudio ? '#eff6ff' : (isImage ? '#faf5ff' : '#ecfdf5'),
                    // Store the raw content to display or use later
                    rawContent: doc.page_content,
                    fileUrl: doc.metadata?.file_url,
                    source: source
                };
            });
            
            setResults(mappedResults);
        } catch (err) {
            console.error("Failed to fetch user contributions:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };
    
    if (user) {
        fetchContent();
    } else {
        setLoading(false);
    }
  }, [user]);

  const handleDelete = async (id, e) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to delete this contribution? This action cannot be undone.")) return;
      
      try {
          setDeletingId(id);
          await api.delete(`http://localhost:8002/content/${id}`);
          // Remove from results locally
          setResults(prev => prev.filter(item => item.id !== id));
      } catch (err) {
          console.error("Failed to delete contribution:", err);
          alert("Could not delete the contribution. Please try again.");
      } finally {
          setDeletingId(null);
      }
  };

  // Filter based on search query
  const filteredResults = results.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.rawContent && r.rawContent.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          My Contributions
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', margin: 0, maxWidth: '800px', lineHeight: 1.6 }}>
          Review the oral histories, texts, and cultural artifacts you have helped preserve in the Ethnoverse network.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px' }}>
        
        {/* Main Results Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: '12px', padding: '6px 16px', width: '300px', border: '1px solid var(--color-border)', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
              <Search color="#94a3b8" size={18} />
              <input 
                type="text" 
                placeholder="Search my uploads..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', padding: '8px 12px', outline: 'none', fontSize: '0.95rem', color: 'var(--color-text-dark)' }}
              />
            </div>

            <button style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              border: '1px solid var(--color-border)', borderRadius: '8px', 
              background: 'white', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-dark)'
            }}>
              <Filter size={16} /> Filter Status
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            
            {loading ? (
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                    <Activity size={32} style={{ marginBottom: '16px', animation: 'spin 2s linear infinite' }} />
                    <p style={{ fontWeight: 600 }}>Loading your contributions...</p>
                </div>
            ) : filteredResults.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '60px 40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <BookOpen size={32} />
                    </div>
                    {searchQuery ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>No contributions found matching your search.</p>
                    ) : (
                        <>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-dark)' }}>No Contributions Yet</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: '0 0 24px' }}>You haven't uploaded any artifacts to the network.</p>
                            <button onClick={() => navigate('/communities')} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600 }}>
                                Find a Community to Upload To
                            </button>
                        </>
                    )}
                </div>
            ) : (
                filteredResults.map((result) => (
                  <div key={result.id} style={{ 
                        backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)',
                        overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer',
                        boxShadow: 'var(--color-shadow)', display: 'flex', flexDirection: 'column',
                        opacity: deletingId === result.id ? 0.5 : 1
                  }}>
                    <div style={{ height: '140px', backgroundColor: result.bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hexagon size={48} color={result.color} style={{ opacity: 0.2 }} />
                      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                         <span style={{ 
                            backgroundColor: result.status === 'VERIFIED' ? '#dcfce7' : (result.status === 'PEER REVIEW' ? '#fef3c7' : '#f1f5f9'), 
                            color: result.status === 'VERIFIED' ? '#166534' : (result.status === 'PEER REVIEW' ? '#92400e' : '#475569'), 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' 
                        }}>
                            {result.status === 'VERIFIED' && <CheckCircle size={10} style={{marginRight: '4px', display:'inline'}} />}
                            {result.status === 'PEER REVIEW' && <Activity size={10} style={{marginRight: '4px', display:'inline'}} />}
                            {result.status}
                        </span>
                        
                        <button 
                            onClick={(e) => handleDelete(result.id, e)}
                            disabled={deletingId === result.id}
                            style={{
                                background: 'white', border: 'none', borderRadius: '4px', padding: '4px 6px',
                                cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', opacity: deletingId === result.id ? 0.5 : 1
                            }}
                            title="Delete Contribution"
                        >
                            <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: result.color }}>
                        {result.icon}
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{result.type}</span>
                      </div>
                      
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--color-text-dark)', lineHeight: 1.3 }}>
                        {result.title}
                      </h3>
                      
                      {result.fileUrl && (
                          <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            {(result.source === 'handwriting_ocr' || result.source === 'image') && (
                              <img src={result.fileUrl} alt="Source Document" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            )}
                            {(result.source === 'audio_transcription' || result.source === 'audio' || result.fileUrl.includes('/audio/')) && (
                              <audio controls src={result.fileUrl} style={{ width: '100%', display: 'block', margin: '0' }} />
                            )}
                          </div>
                      )}
                      
                      {result.rawContent && (
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              "<i>{result.rawContent}</i>"
                          </p>
                      )}
                      
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          <Navigation size={14} /> {result.affiliation}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          <Clock size={14} /> {result.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Profile Sidebar */}
        <div>
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', padding: '24px', 
            border: '1px solid var(--color-border)', marginBottom: '24px',
            textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 16px', fontSize: '2rem', fontWeight: 800 
            }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : <User size={40} />}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--color-text-dark)' }}>
                {user?.username || 'Contributor'}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 20px' }}>
                Archivist Level 2
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {results.length}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Artifacts
                    </span>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                        {results.filter(r => r.status === 'VERIFIED').length}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Verified
                    </span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributions;
