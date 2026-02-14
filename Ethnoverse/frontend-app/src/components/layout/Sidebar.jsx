import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Network, FileText, Settings, Plus, Search, Star, Bot } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'
        }}>
          EV
        </div>
        <h1 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', margin: 0, fontWeight: 800 }}>ETHNOVERSE</h1>
      </div>

      <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <SidebarLink to="/communities" icon={<Users size={20} />} label="Communities" />
        <SidebarLink to="/knowledge-graph" icon={<Network size={20} />} label="Knowledge Graph" />
        <SidebarLink to="/search" icon={<Search size={20} />} label="Search Archive" />
        <SidebarLink to="/semantic-search" icon={<Bot size={20} />} label="Semantic AI Search" />
        <SidebarLink to="/contributions" icon={<Star size={20} />} label="My Contributions" />
        
        <div style={{ marginTop: 'auto', marginBottom: '16px' }}>
          <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" />
        </div>
      </nav>
    </aside>
  );
};

const SidebarLink = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
        backgroundColor: isActive ? 'var(--color-border)' : 'transparent',
        fontWeight: isActive ? 600 : 500,
        textDecoration: 'none',
        transition: 'all 0.2s'
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
};

export default Sidebar;
