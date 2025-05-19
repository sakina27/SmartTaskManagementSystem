import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone } from 'react-icons/fa';
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

    useEffect(() => {
        const savedUserId = localStorage.getItem('userId');
        const savedAccessToken = localStorage.getItem('accessToken');
        if (savedUserId) setUserId(savedUserId);
        if (savedAccessToken) setAccessToken(savedAccessToken);
    }, []);

    useEffect(() => {
        if (userId) fetchTasks();
    }, [userId]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8081/api/tasks/user/${userId}`);
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
            const res = await axios.get(`http://localhost:8083/api/comments/task/${taskId}`);
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
            await axios.post(`http://localhost:8083/api/comments`, {
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
            await axios.delete(`http://localhost:8083/api/comments/${commentId}`);
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
            await axios.put(`http://localhost:8083/api/comments/${comment.id}`, {
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
            await axios.post('http://localhost:8081/api/tasks', {
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
            fetchTasks();
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
            await axios.get(`http://localhost:8081/api/tasks/fetch-google-calendar`, {
                params: { accessToken, userId }
            });
            alert("Fetched tasks from Google Calendar!");
            fetchTasks();
        } catch (err) {
            console.error("Failed to fetch from Google Calendar:", err);
            alert("Failed to fetch from Google Calendar");
        }
    };

    const handleAnalyzeDescription = async () => {
        if (!description) return;
        try {
            setLoading(true);
            const res = await axios.post('http://localhost:5001/text-to-task', { text: description });
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
                    const nlpRes = await axios.post("http://localhost:5001/audio-to-task", formData);
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
            await axios.patch(`http://localhost:8081/api/tasks/${taskId}`, { status: newStatus });
            fetchTasks();
        } catch (err) {
            console.error('Failed to update task status:', err);
            alert('Failed to update task status');
        }
    };

    return (
        <div className="task-container">
            <div className="task-form card">
                <h2>Create New Task</h2>
                <form onSubmit={handleAddTask}>
                    <input
                        type="text"
                        placeholder="Task Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="input-field"
                    />
                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="textarea-field"
                    />
                    <button
                        type="button"
                        onClick={handleAnalyzeDescription}
                        disabled={!description || loading}
                        className="btn-secondary"
                    >
                        Analyze Description with AI
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

                <div className="audio-input card">
                    <h3>Or Create Task via Voice</h3>
                    <button onClick={handleRecording} className={`mic-button ${isRecording ? 'recording' : ''}`}>
                        <FaMicrophone />
                        {isRecording ? ' Stop Recording' : ' Start Recording'}
                    </button>
                </div>

                <div className="google-sync card">
                    <h3>Google Calendar Sync</h3>
                    <input
                        type="text"
                        placeholder="Access Token"
                        value={accessToken}
                        disabled
                        className="input-field"
                    />
                    <button onClick={handleFetchFromGoogleCalendar} disabled={loading} className="btn-secondary">
                        Fetch from Google Calendar
                    </button>
                </div>
            </div>

            <div className="task-list">
                <h3>Tasks for User ID: <span className="user-id">{userId}</span></h3>
                {loading ? (
                    <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks found.</p>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} className={`task-card priority-${task.priority.toLowerCase()}`}>
                            <h4>{task.title}</h4>
                            <p className="description">{task.description}</p>
                            <p className="due-date"><strong>Due:</strong> {task.dueDate}</p>
                            <p className="priority"><strong>Priority:</strong> <span>{task.priority}</span></p>
                            <button onClick={() => toggleComments(task.id)}>
                                {expandedTasks[task.id] ? 'Hide Comments' : 'Show Comments'}
                            </button>

                            {expandedTasks[task.id] && (
                                <div className="comments-section">
                                    <div className="comments-list">
                                        {commentsMap[task.id]?.length ? (
                                            commentsMap[task.id].map((comment) => (
                                                <div key={comment.id} className="comment-item">
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
                                                            <p className="timestamp">🗓️ {new Date(comment.createdAt).toLocaleString()}</p>
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
                            <p><strong>Status:</strong> {task.status}</p>
                            <button onClick={() => toggleTaskStatus(task.id, task.status)} className="btn-secondary">
                                Mark as {task.status === 'Complete' ? 'Incomplete' : 'Complete'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TaskManager;
