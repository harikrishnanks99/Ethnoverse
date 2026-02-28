import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, Search as SearchIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 20px',
            backgroundColor: 'var(--color-navbar-bg)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            marginBottom: '20px',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                <Link to="/" style={{ color: 'var(--color-text-dark)' }}>Ethnoverse</Link>
            </div>

            <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {user ? (
                    <>
                        <Link to="/search" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <SearchIcon size={18} /> Search
                        </Link>
                        <Link to="/communities">Communities</Link>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                            <User size={18} /> {user.username}
                        </span>
                        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.9rem' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-secondary">Login</Link>
                        <Link to="/register" className="btn btn-primary">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
