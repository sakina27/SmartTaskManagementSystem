import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userServiceApi, taskServiceApi, commentServiceApi, notificationServiceApi } from './axiosInstance';
 // Import the custom axios instance
import './Login.css'; // Reuse the same CSS for styling

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        // Basic password validation (min length 6)
        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        // Email validation (basic)
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            alert('Please enter a valid email address (e.g., name@domain.com)');
            return;
        }

        setLoading(true);

        try {
            // Use axiosInstance to send the registration request
            const res = await userServiceApi.post('/users/register', {
                name,
                email,
                password
            });

            alert('Registration successful! Please login.');
            localStorage.removeItem('authToken'); // Ensure no token in localStorage
            navigate('/login'); // Navigate to the login page
        } catch (err) {
            alert('Registration failed: ' + (err.response?.data?.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="form-card">
                <h2>Create a New Account</h2>
                <form onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
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
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p>Already have an account? <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: 'blue' }}>Login</span></p>
            </div>
        </div>
    );
}

export default Register;
