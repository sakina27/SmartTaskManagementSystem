import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone, FaTasks, FaGoogle, FaSignOutAlt, FaPlus, FaRegCommentDots, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import './TaskManager.css';

function TaskManager() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [userId, setUserId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [chunks, setChunks] = useState([]);
    const mediaRecorderRef = useRef(null);
    const [commentText, setCommentText] = useState('');
    const [commentsMap, setCommentsMap] = useState({});
    const [expandedTasks, setExpandedTasks] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentContent, setEditedCommentContent] = useState('');
    const [activeView, setActiveView] = useState('create-task');

    useEffect(() => {
        const savedUserId = localStorage.getItem('userId');
        const savedAccessToken = localStorage.getItem('accessToken');
        if (savedUserId) setUserId(savedUserId);
        if (savedAccessToken) setAccessToken(savedAccessToken);
    }, []);

    useEffect(() => {
        if (userId && activeView === 'show-tasks') {
            fetchTasks();
        }
    }, [userId, activeView]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`https://taskmanager.com:30443/api/tasks/user/${userId}`);
            setTasks(res.data);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            alert("Error fetching tasks");
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (taskId) => {
        try {
            const res = await axios.get(`https://taskmanager.com:30443/api/comments/task/${taskId}`);
            setCommentsMap(prev => ({ ...prev, [taskId]: res.data }));
        } catch (err) {
            console.error("Failed to fetch comments:", err);
        }
    };

    const toggleComments = async (taskId) => {
        const expanded = expandedTasks[taskId];
        setExpandedTasks(prev => ({ ...prev, [taskId]: !expanded }));
        if (!expanded) await fetchComments(taskId);
    };

    const handleAddComment = async (taskId) => {
        if (!commentText.trim()) return;
        try {
            await axios.post(`https://taskmanager.com:30443/api/comments`, {
                taskId,
                userId,
                content: commentText
            });
            setCommentText('');
            await fetchComments(taskId);
        } catch (err) {
            console.error("Failed to post comment:", err);
            alert("Failed to post comment");
        }
    };

    const handleDeleteComment = async (commentId, taskId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await axios.delete(`https://taskmanager.com:30443/api/comments/${commentId}`);
            await fetchComments(taskId);
        } catch (err) {
            console.error("Failed to delete comment:", err);
            alert("Failed to delete comment");
        }
    };

    const startEditing = (comment) => {
        setEditingCommentId(comment.id);
        setEditedCommentContent(comment.content);
    };

    const cancelEditing = () => {
        setEditingCommentId(null);
        setEditedCommentContent('');
    };

    const handleUpdateComment = async (comment, taskId) => {
        try {
            await axios.put(`https://taskmanager.com:30443/api/comments/${comment.id}`, {
                ...comment,
                content: editedCommentContent
            });
            cancelEditing();
            await fetchComments(taskId);
        } catch (err) {
            console.error("Failed to update comment:", err);
            alert("Failed to update comment");
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post('https://taskmanager.com:30443/api/tasks', {
                title,
                description,
                dueDate,
                priority,
                status: 'Incomplete',
                userId
            });
            alert("Task added successfully!");
            setTitle('');
            setDescription('');
            setDueDate('');
            setPriority('medium');
            setActiveView('show-tasks');
            
        } catch (err) {
            console.error("Failed to add task:", err);
            alert("Failed to add task");
        }
    };

    const handleFetchFromGoogleCalendar = async () => {
        if (!accessToken || !userId) {
            alert("Access token or user ID missing");
            return;
        }

        try {
            await axios.get(`https://taskmanager.com:30443/api/tasks/fetch-google-calendar`, {
                params: { accessToken, userId }
            });
            alert("Fetched tasks from Google Calendar!");
            setActiveView('show-tasks');
        } catch (err) {
            console.error("Failed to fetch from Google Calendar:", err);
            alert("Failed to fetch from Google Calendar");
        }
    };

    const handleAnalyzeDescription = async () => {
        if (!description) return;
        try {
            setLoading(true);
            const res = await axios.post('https://taskmanager.com:5001/text-to-task', { text: description });
            const extracted = res.data.task;
            if (extracted) {
                if (extracted.description) setDescription(extracted.description);
                if (extracted.dueDate) setDueDate(extracted.dueDate);
                if (extracted.priority) setPriority(extracted.priority.toLowerCase());
                alert("Fields auto-filled from description!");
            } else {
                alert("NLP service did not return a valid task.");
            }
        } catch (err) {
            console.error("NLP analysis failed:", err);
            alert("Failed to analyze task description.");
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            setChunks([]);

            mediaRecorderRef.current.ondataavailable = (e) => {
                setChunks((prev) => [...prev, e.data]);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.wav");

                try {
                    setLoading(true);
                    const nlpRes = await axios.post("https://taskmanager.com:5001/audio-to-task", formData);
                    const extractedTask = nlpRes.data.task;
                    if (extractedTask) {
                        if (extractedTask.title) setTitle(extractedTask.title);
                        if (extractedTask.description) setDescription(extractedTask.description);
                        if (extractedTask.dueDate) setDueDate(extractedTask.dueDate);
                        if (extractedTask.priority) setPriority(extractedTask.priority.toLowerCase());
                        alert("Fields auto-filled from audio input!");
                    } else {
                        alert("NLP service did not return a valid task.");
                    }
                } catch (err) {
                    console.error("Error processing audio task:", err);
                    alert("Failed to process audio input.");
                } finally {
                    setLoading(false);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied or error:", err);
            alert("Microphone access denied or error.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    const toggleTaskStatus = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'Complete' ? 'Incomplete' : 'Complete';
        try {
            await axios.patch(`https://taskmanager.com:30443/api/tasks/${taskId}`, { status: newStatus });
            fetchTasks();
        } catch (err) {
            console.error('Failed to update task status:', err);
            alert('Failed to update task status');
        }
    };
    
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    // Helper for rendering priority badge
    const renderPriorityBadge = (priority) => (
        <span className={`priority-badge priority-${priority}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
    );

    // Helper for rendering status chip
    const renderStatusChip = (status) => (
        <span className={`status-chip status-${status.toLowerCase()}`}>
            {status === "Complete" ? <FaCheckCircle style={{marginRight: 4}}/> : <FaRegCircle style={{marginRight: 4}}/>}
            {status}
        </span>
    );

    // Helper for rendering avatar (first letter of userId or 'U')
    const renderAvatar = (userName) => (
        <span className="avatar">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
        </span>
    );

    return (
        <div className="task-container">
            {/* Navigation Bar */}
            <div className="navbar glass">
                <div className="logo">
                    <FaTasks style={{color: "#7f53ac", fontSize: "2rem"}} />
                    <span>Task Magic</span>
                </div>
                <div className="nav-links">
                    <button
                        className={activeView === 'create-task' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => setActiveView('create-task')}
                        title="Create Task"
                    >
                        <FaPlus /> <span className="hide-mobile">Create</span>
                    </button>
                    <button
                        className={activeView === 'show-tasks' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => {
                            setActiveView('show-tasks');
                            fetchTasks();
                        }}
                        title="Show Tasks"
                    >
                        <FaTasks /> <span className="hide-mobile">Tasks</span>
                    </button>
                    <button
                        className={activeView === 'google-calendar' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => {
                            setActiveView('google-calendar');
                            handleFetchFromGoogleCalendar();
                        }}
                        title="Fetch from Google Calendar"
                    >
                        <FaGoogle /> <span className="hide-mobile">Google</span>
                    </button>
                    <button className="nav-btn logout" onClick={handleLogout} title="Logout">
                        <FaSignOutAlt /> <span className="hide-mobile">Logout</span>
                    </button>
                </div>
            </div>

            {/* Create Task View */}
            {activeView === 'create-task' && (
                <div className="task-form glass">
                    <h2>
                        <FaPlus style={{color: "#7f53ac", marginRight: 8}} />
                        Create Task
                    </h2>
                    <form onSubmit={handleAddTask}>
                        <input
                            type="text"
                            placeholder="Task Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={handleAnalyzeDescription}
                            disabled={!description || loading}
                            className="btn-secondary"
                        >
                            ✨ AI Analyze
                        </button>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    required
                                    className="input-field"
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Adding...' : 'Add Task'}
                        </button>
                    </form>
                    <div className="audio-input card glass">
                        <h3>
                            <FaMicrophone style={{marginRight: 8, color: "#7f53ac"}} />
                            Or Create Task via Voice
                        </h3>
                        <button onClick={handleRecording} className={`mic-button ${isRecording ? 'recording' : ''}`}>
                            <FaMicrophone />
                            {isRecording ? ' Stop Recording' : ' Start Recording'}
                        </button>
                    </div>
                </div>
            )}

            {/* Show Tasks View */}
            {activeView === 'show-tasks' && (
                <div className="task-list glass">
                    <h3>
                        <FaTasks style={{marginRight: 8, color: "#7f53ac"}} />
                        Tasks
                    </h3>
                    {loading ? (
                        <p>Loading tasks...</p>
                    ) : tasks.length === 0 ? (
                        <p>No tasks found.</p>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className={`task-card priority-${task.priority} glass-card`}>
                                <h4>
                                    {task.title}
                                    {renderPriorityBadge(task.priority)}
                                </h4>
                                <p className="description">{task.description}</p>
                                <p className="due-date">
                                    <strong>Due:</strong> {task.dueDate}
                                </p>
                                <p>
                                    <strong>Status:</strong> {renderStatusChip(task.status)}
                                </p>
                                <div className="task-actions">
                                    <button
                                        onClick={() => toggleTaskStatus(task.id, task.status)}
                                        className="btn-secondary"
                                    >
                                        {task.status === 'Complete' ? 'Mark Incomplete' : 'Mark Complete'}
                                    </button>
                                    <button
                                        onClick={() => toggleComments(task.id)}
                                        className="btn-secondary"
                                        style={{ marginLeft: '8px' }}
                                    >
                                        <FaRegCommentDots style={{marginRight: 4}}/>
                                        {expandedTasks[task.id] ? 'Hide Comments' : 'Show Comments'}
                                    </button>
                                </div>
                                {expandedTasks[task.id] && (
                                    <div className="comments-section glass">
                                        <div className="comments-list">
                                            {commentsMap[task.id]?.length ? (
                                                commentsMap[task.id].map((comment, idx) => (
                                                    <div key={comment.id} className="comment-item">
                                                        <div className="comment-header">
                                                            {renderAvatar(comment.userName)}
                                                            <span className="timestamp">
                                                                🗓️ {new Date(comment.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        {editingCommentId === comment.id ? (
                                                            <>
                                                                <textarea
                                                                    value={editedCommentContent}
                                                                    onChange={(e) => setEditedCommentContent(e.target.value)}
                                                                    placeholder="Edit your comment..."
                                                                />
                                                                <div className="comment-actions">
                                                                    <button onClick={() => handleUpdateComment(comment, task.id)}>Save</button>
                                                                    <button onClick={cancelEditing}>Cancel</button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p>{comment.content}</p>
                                                                <div className="comment-actions">
                                                                    <button onClick={() => startEditing(comment)}>Edit</button>
                                                                    <button onClick={() => handleDeleteComment(comment.id, task.id)}>Delete</button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p>No comments yet.</p>
                                            )}
                                        </div>
                                        <div className="add-comment">
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                            />
                                            <button onClick={() => handleAddComment(task.id)}>Post</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default TaskManager;

