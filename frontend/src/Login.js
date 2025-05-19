import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userServiceApi, taskServiceApi, commentServiceApi, notificationServiceApi } from './axiosInstance';
import './Login.css';
import {GoogleLogin, useGoogleLogin} from '@react-oauth/google';
import axios from "axios";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await userServiceApi.post('/users/login', { email, password });
            const token = res.data.token;
            const user = res.data.user;  // user object from backend

            localStorage.setItem('authToken', token);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('accessToken', token); // Assuming same token for other uses

            alert('Login successful!');
            navigate('/tasks');
        } catch (err) {
            console.error(err);
            alert('Login failed: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        flow: 'implicit', // Or 'auth-code' if you want to go more secure
        scope: 'https://www.googleapis.com/auth/calendar.readonly email profile',
        onSuccess: async (tokenResponse) => {
            const accessToken = tokenResponse.access_token;

            try {
                // Optionally verify token with your backend or just store for use in task-service
                const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                const userInfo = userInfoRes.data;

                // Store access token and user info
                localStorage.setItem('authToken', accessToken); // If using same for auth (optional)
                localStorage.setItem('accessToken', accessToken); // Needed for calendar access
                localStorage.setItem('userId', userInfo.sub); // Use Google user ID as fallback user ID

                alert('Google login successful!');
                navigate('/tasks');
            } catch (error) {
                console.error('Google User Info Error:', error);
                alert('Failed to fetch user info');
            }
        },
        onError: (error) => {
            console.error('Google OAuth Error:', error);
            alert('Google OAuth failed');
        }
    });

    return (
        <div className="auth-container">
            <div className="form-card">
                <h2>Login to Your Account</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: '20px' }}>
                    <h4>Or Sign in with Google</h4>
                    <button onClick={() => loginWithGoogle()} style={{ padding: '10px', marginTop: '10px' }}>
                        Sign in with Google (Calendar Access)
                    </button>
                </div>

                <p>
                    Don't have an account?{' '}
                    <span
                        onClick={() => navigate('/register')}
                        style={{ cursor: 'pointer', color: 'blue' }}
                    >
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;
