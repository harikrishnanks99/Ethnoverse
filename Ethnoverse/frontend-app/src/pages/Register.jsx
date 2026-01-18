import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError("Passwords don't match");
            return;
        }

        try {
            await register(formData);
            navigate('/login'); // Redirect to login after success
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--color-shadow)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register</h2>
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                    <label>Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div>
                    <label>Confirm Password</label>
                    <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
            </form>
        </div>
    );
};

export default Register;
