import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            // Use a hard-replace instead of a soft React Router navigate.
            // This ensures the old login page DOM (including any stale overlays or
            // backdrop layers) is fully torn down before the dashboard mounts.
            window.location.replace('/');
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--color-shadow)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username or Email</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
            </form>
        </div>
    );
};

export default Login;
