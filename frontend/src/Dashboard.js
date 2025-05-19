import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For navigation
import "./Dashboard.css";

function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const navigate = useNavigate(); // Initialize navigate

    // Fetch tasks on page load
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get("http://localhost:8081/api/tasks");
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:8081/api/tasks", {
                title,
                description
            });
            alert("Task created!");
            setTitle("");
            setDescription("");
            fetchTasks(); // Refresh task list
        } catch (err) {
            console.error("Task creation failed", err);
            alert("Failed to create task.");
        }
    };

    const handleLogout = () => {
        // Remove token from localStorage to log out
        localStorage.removeItem("authToken");

        // Redirect user to login page
        navigate("/login");
    };

    return (
        <div className="dashboard-container">
            <h2>Your Dashboard</h2>

            {/* Logout button */}
            <button onClick={handleLogout} className="logout-btn">
                Logout
            </button>

            <div className="task-form">
                <h3>Create New Task</h3>
                <form onSubmit={handleCreateTask}>
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    <button type="submit">Create Task</button>
                </form>
            </div>

            <div className="task-list">
                <h3>Task Overview</h3>
                {tasks.length === 0 ? (
                    <p>No tasks found.</p>
                ) : (
                    <ul>
                        {tasks.map((task) => (
                            <li key={task.id}>
                                <h4>{task.title}</h4>
                                <p>{task.description}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
