// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import './LoginPage.css'; // Create this CSS file

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear any previous errors
        try {
            const res = await login(email, password);
            if (res.success) {
                navigate('/'); // Redirect to dashboard on success
            } else {
                // If login function returns success: false, display its message
                setError(res.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            // Catch network errors or errors thrown by the login function
            setError(err.response?.data?.message || 'An unexpected error occurred during login.');
            console.error('Login error:', err); // Log the full error for debugging
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card">
                <h2>Login to LIMS</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
