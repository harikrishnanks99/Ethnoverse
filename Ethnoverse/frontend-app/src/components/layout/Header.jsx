import React from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user } = useAuth();
  
  // Dummy user data if not logged in for UI purposes
  const displayUser = user || { name: 'Dr. Elena K.', role: 'LEAD RESEARCHER' };

  return (
    <header style={{
      height: '80px',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
        <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="Search knowledge entries, communities, or nodes..." 
          style={{
            width: '100%',
            padding: '12px 16px 12px 48px',
            borderRadius: '24px',
            border: 'none',
            backgroundColor: 'var(--color-background)',
            fontSize: '0.95rem',
            margin: 0
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            background: 'var(--color-background)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-dark)'
          }}>
            <Bell size={20} />
          </button>
          <button style={{
            background: 'var(--color-background)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-dark)'
          }}>
            <MessageSquare size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--color-border)', paddingLeft: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-dark)' }}>{displayUser.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#B8860B', fontWeight: 600, letterSpacing: '0.5px' }}>{displayUser.role}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
            <img src="https://ui-avatars.com/api/?name=Elena+K&background=cbd5e1&color=334155" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
