import React, { useState, useEffect } from 'react';
import { Search, Filter, Mic, Image as ImageIcon, Hexagon, ArrowRight, PlayCircle, BookOpen, Clock, Activity, CheckCircle, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const SearchArchive = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
        try {
            setLoading(true);
            // Fetch raw documents/content from the AI Agent backend SQLite store
            const res = await api.get('http://localhost:8002/content');
            const data = res.data || [];
            
            // Map the SQLite Document schema (page_content, metadata) to the frontend grid
            const mappedResults = data.map((doc, index) => {
                const source = doc.metadata?.source || 'direct_text';
                const isAudio = source === 'audio_transcription' || source === 'audio';
                const isImage = source === 'image' || source === 'handwriting_ocr' || source === 'text_with_image';
                
                return {
                    id: doc.id || index,
                    title: doc.metadata?.title || `Archive Document #${index + 1}`,
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
            console.error("Failed to fetch archive content:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };
    
    fetchContent();
  }, []);

  // Filter based on search query
  const filteredResults = results.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.rawContent && r.rawContent.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Hero Search Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--color-primary), #0D163F)', 
        borderRadius: '24px', padding: '60px 40px', color: 'white', marginBottom: '40px',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px' }}>
            Explore the Digital Archive
          </h1>
          
          <div style={{ 
            display: 'flex', alignItems: 'center', backgroundColor: 'white', 
            borderRadius: '16px', padding: '8px 8px 8px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
          }}>
            <Search color="#94a3b8" size={24} />
            <input 
              type="text" 
              placeholder="Ask about cultural knowledge, traditions, or specific communities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                flex: 1, border: 'none', padding: '16px', fontSize: '1.1rem', 
                outline: 'none', color: 'var(--color-text-dark)', background: 'transparent'
              }}
            />
            <button className="btn btn-primary" style={{ padding: '16px 32px', borderRadius: '12px', fontSize: '1rem' }}>
              Search Now
            </button>
          </div>
          
          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', marginRight: '8px' }}>Trending:</span>
            {['Oral Traditions', 'Medicinal Flora', 'Rituals', 'Dialects', 'Textiles'].map(tag => (
              <button key={tag} style={{ 
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
                color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem',
                cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'all 0.2s'
              }}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px' }}>
        
        {/* Main Results Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Discover Knowledge</h2>
            <button style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              border: '1px solid var(--color-border)', borderRadius: '8px', 
              background: 'white', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-dark)'
            }}>
              <Filter size={16} /> Sort & Filter
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            
            {loading ? (
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                    <Activity size={32} style={{ marginBottom: '16px', animation: 'spin 2s linear infinite' }} />
                    <p style={{ fontWeight: 600 }}>Loading raw archives from database...</p>
                </div>
            ) : filteredResults.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>No raw archives found matching your search.</p>
                </div>
            ) : (
                filteredResults.map((result) => (
                  <div key={result.id} style={{ 

                backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)',
                overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer',
                boxShadow: 'var(--color-shadow)', display: 'flex', flexDirection: 'column'
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
                        {(result.source === 'handwriting_ocr' || result.source === 'image' || result.source === 'text_with_image') && (
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
            )))}
          </div>
        </div>

        {/* Inspirational Sidebar */}
        <div>
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', 
            borderRadius: '16px', padding: '24px', marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--color-primary)' }}>Contribute Knowledge</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Help preserve your community's heritage by directly uploading oral histories, texts, or media.
            </p>
            <button onClick={() => navigate('/upload')} className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
              Start Upload <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 20px', color: 'var(--color-text-dark)' }}>Suggested Topics</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Language Preservation', val: 85, color: '#3b82f6' },
                { label: 'Traditional Medicine', val: 62, color: '#10b981' },
                { label: 'Ancestral Origins', val: 45, color: '#a855f7' },
                { label: 'Folklore & Myths', val: 30, color: '#f59e0b' }
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                    <span>{stat.label}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{stat.val}% full</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stat.val}%`, backgroundColor: stat.color, borderRadius: '3px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SearchArchive;
