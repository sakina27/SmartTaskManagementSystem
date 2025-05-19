import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="home-box">
                <h1>Welcome to <span>Smart Task Manager</span></h1>
                <p>Manage your tasks smarter and faster ✨</p>
                <div className="button-group">
                    <button onClick={() => navigate('/login')}>Login</button>
                    <button onClick={() => navigate('/register')}>Register</button>
                </div>
            </div>
        </div>
    );
}

export default Home;
