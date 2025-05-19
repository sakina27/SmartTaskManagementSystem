import React, { useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate } from "react-router-dom"; // Correct import
import { GoogleOAuthProvider } from "@react-oauth/google";

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import TaskManager from "./TaskManager";
import Dashboard from "./Dashboard";
import './Home.css';

// 🔐 Set token globally (only if exists)
const setAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
};

function AppContent() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const currentPath = window.location.pathname;

        if (!token && currentPath !== '/register' && currentPath !== '/login') {
            navigate('/login');
        }

        setAuthToken(); // Ensure token is set when app loads
    }, [navigate]);


    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
    );
}

function App() {
    return (
        <GoogleOAuthProvider clientId="514348104125-th0ffk0ro6l1tsfv9bglu76l35b2malg.apps.googleusercontent.com">
            <AppContent />
        </GoogleOAuthProvider>
    );
}

export default App;
