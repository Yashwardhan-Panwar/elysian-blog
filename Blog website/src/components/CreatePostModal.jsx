import React, { useState } from 'react';
import api from '../services/api';
import './AuthModal.css'; // reuse styles

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/posts', { title, content });
      onPostCreated(res.data);
      onClose();
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>Create New Post</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Write your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="6"
            style={{ width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #3e7c5e', borderRadius: '20px', padding: '12px', marginBottom: '1rem' }}
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;