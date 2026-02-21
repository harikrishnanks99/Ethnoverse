import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Activity, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Communities = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Community Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchCommunities = async () => {
        try {
            setLoading(true);
            // Fetch directly from the SQLite-backed Auth Service on port 8000
            const res = await api.get('http://localhost:8001/communities/');
            const nodes = res.data || [];
            
            // Map the SQLite response (CommunityOut schema) to the frontend grid
            const communityNodes = nodes.map(n => ({
                    id: n.id,
                    name: n.name || 'Unknown Community',
                    tag: 'GLOBAL', 
                    desc: n.description || 'A community dedicated to preserving cultural heritage and oral histories within the Ethnoverse network.',
                    members: Math.floor(Math.random() * 1000) + 100, 
                    entries: Math.floor(Math.random() * 500) + 50,   
                    image: n.banner_image || 'https://images.unsplash.com/photo-1590481831872-4d0fb6ea22c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                    profile_image: n.profile_image
                }));
            
            setCommunities(communityNodes);
        } catch (err) {
            console.error("Failed to fetch communities from backend:", err);
            // Fallback to empty state on failure
            setCommunities([]);
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCreateCommunity = async (e) => {
      e.preventDefault();
      setCreateError('');
      setCreateLoading(true);

      if (!newCommName.trim()) {
          setCreateError('Community name is required.');
          setCreateLoading(false);
          return;
      }

      try {
          const res = await api.post('http://localhost:8001/communities/', {
              name: newCommName,
              description: newCommDesc,
              is_public: isPublic
          });
          
          if (res.data) {
              // Close modal and reset form
              setIsModalOpen(false);
              setNewCommName('');
              setNewCommDesc('');
              setIsPublic(true);
              // Refresh communities list
              fetchCommunities();
          }
      } catch (err) {
          console.error("Failed to create community:", err);
          setCreateError(err.response?.data?.detail || "Failed to create community. Please try again.");
      } finally {
          setCreateLoading(false);
      }
  };

  // Filter based on search query
  const filteredCommunities = communities.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          Communities
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', margin: 0, maxWidth: '800px', lineHeight: 1.6 }}>
          Connect with global indigenous knowledge keepers, access decentralized archives, and collaborate on cultural preservation projects.
        </p>
      </div>

      {/* Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        
        {/* Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '6px 16px', width: '400px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
          <Search size={20} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search communities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', padding: '10px 0', outline: 'none', fontSize: '0.95rem', color: 'var(--color-text-dark)' }}
          />
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Filter size={20} color="#64748b" />
          </button>
        </div>

        {/* Create Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          backgroundColor: 'var(--color-primary)', color: 'white', 
          border: 'none', padding: '12px 24px', borderRadius: '12px', 
          fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(26, 35, 126, 0.2)'
        }}>
           <Plus size={18} /> Create Community
        </button>
      </div>

      {/* Communities Grid */}
      {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              <Activity size={32} style={{ marginBottom: '16px', animation: 'spin 2s linear infinite' }} />
              <p style={{ fontWeight: 600 }}>Loading Communities from Neo4j...</p>
          </div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            
            {filteredCommunities.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>No communities found matching your search.</p>
                </div>
            ) : (
                filteredCommunities.map((community) => (
                  <div key={community.id} style={{ 
                    backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', 

            overflow: 'hidden', display: 'flex', flexDirection: 'column', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)', transition: 'transform 0.2s',
            cursor: 'default'
          }}>
            {/* Hero Image & Tag */}
            <div style={{ height: '160px', position: 'relative', backgroundColor: '#e2e8f0', backgroundImage: `url(${community.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
               <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: '#CC9933', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                 {community.tag}
               </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Title & Desc */}
              <h2 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-dark)', lineHeight: 1.3 }}>{community.name}</h2>
              <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1 }}>{community.desc}</p>

              {/* Stats Box */}
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>MEMBERS</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 800 }}>{community.members}</span>
                </div>
                <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>ENTRIES</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 800 }}>{community.entries}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => navigate(`/communities/${community.id}`)}
                  style={{ 
                    flex: 1, backgroundColor: 'var(--color-primary)', color: 'white', 
                    border: 'none', padding: '12px', borderRadius: '8px', 
                    fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s'
                  }}
                >
                  View Community
                </button>
              </div>
            </div>
          </div>
        )))}

        {/* Missing Something Card */}
         <div 
            onClick={() => setIsModalOpen(true)}
            style={{ 
            borderRadius: '16px', border: '2px dashed #cbd5e1', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', minHeight: '400px'
         }}>
             <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Plus size={32} />
             </div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: '0 0 8px 0', textAlign: 'center' }}>Missing something?</h3>
             <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, textAlign: 'center' }}>Start a new preservation collective</p>
         </div>

      </div>
      )}

      {/* Create Community Modal */}
      {isModalOpen && (
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
                    onClick={() => setIsModalOpen(false)}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                >
                    <X size={24} />
                </button>
                
                <h2 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', fontSize: '1.75rem', fontWeight: 800 }}>Create Community</h2>
                
                {createError && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                        {createError}
                    </div>
                )}

                <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155' }}>Community Name *</label>
                        <input 
                            type="text" 
                            value={newCommName}
                            onChange={(e) => setNewCommName(e.target.value)}
                            placeholder="e.g., Kalaripayattu Masters"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem' }}
                            required
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155' }}>Description</label>
                        <textarea 
                            value={newCommDesc}
                            onChange={(e) => setNewCommDesc(e.target.value)}
                            placeholder="What is the purpose of this community?"
                            rows={4}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                            type="checkbox" 
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="isPublic" style={{ cursor: 'pointer', color: '#475569', fontWeight: 500 }}>Make community public</label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            style={{ padding: '12px 24px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={createLoading}
                            style={{ padding: '12px 24px', backgroundColor: 'var(--color-primary)', border: 'none', borderRadius: '8px', cursor: createLoading ? 'not-allowed' : 'pointer', fontWeight: 600, color: 'white', opacity: createLoading ? 0.7 : 1 }}
                        >
                            {createLoading ? 'Creating...' : 'Create Community'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Communities;
