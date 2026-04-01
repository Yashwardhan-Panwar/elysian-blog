// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { FaHeart } from 'react-icons/fa';
import { useAuth, AuthProvider } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import CreatePostModal from './components/CreatePostModal';
import api from './services/api';
import './App.css';

// ---------- Helper Functions ----------
const generateCommentId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

// ---------- Comment Component ----------
const CommentItem = ({ comment }) => (
  <div className="comment-item">
    <div className="comment-avatar">👤</div>
    <div className="comment-content">
      <div className="comment-author">{comment.author}</div>
      <div className="comment-text">{comment.text}</div>
      <div className="comment-time">{comment.timestamp || 'just now'}</div>
    </div>
  </div>
);

// ---------- Post Card Component ----------
const PostCard = ({ post, onLike, onAddComment, onShare, onDelete }) => {
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const author = newCommentAuthor.trim() || "Voyager";
    onAddComment(post.id, {
      author,
      text: newCommentText.trim(),
      timestamp: "just now"
    });
    setNewCommentText('');
    setNewCommentAuthor('');
    setShowComments(true);
  };

  const handleShareClick = async () => {
    setIsSharing(true);
    await onShare(post);
    setTimeout(() => setIsSharing(false), 800);
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <h2 className="post-title">{post.title}</h2>
        <div className="post-meta">
          ✦ {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="post-content">
        <p>{post.content}</p>
      </div>

      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${post.liked ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
          aria-label="Like post"
        >
          {post.liked ? <FaHeart className="icon heart-icon" /> : <FiHeart className="icon" />}
          <span>{post.likeCount}</span>
        </button>

        <button 
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
          aria-label="Comments"
        >
          <FiMessageCircle className="icon" />
          <span>{post.comments.length}</span>
        </button>

        <button 
          className={`action-btn share-btn ${isSharing ? 'sharing' : ''}`}
          onClick={handleShareClick}
          aria-label="Share post"
        >
          <FiShare2 className="icon" />
          <span>Share</span>
        </button>

        {onDelete && (
          <button 
            className="action-btn delete-btn"
            onClick={onDelete}
            aria-label="Delete post"
          >
            🗑️
          </button>
        )}
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {post.comments.length === 0 ? (
              <div className="no-comments">✨ No comments yet. Start the conversation.</div>
            ) : (
              post.comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>

          <form className="comment-form" onSubmit={handleSubmitComment}>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={newCommentAuthor}
              onChange={(e) => setNewCommentAuthor(e.target.value)}
              className="comment-input author-input"
            />
            <div className="comment-input-group">
              <textarea
                placeholder="Write a thoughtful comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows="2"
                className="comment-textarea"
                required
              />
              <button type="submit" className="submit-comment-btn">Post</button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
};

// ---------- Main Blog Content (logged in) ----------
const BlogContent = () => {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return { ...post, liked: res.data.liked, likeCount: res.data.likeCount };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Like error', err);
    }
  };

  const handleAddComment = async (postId, commentData) => {
    try {
      const res = await api.post(`/posts/${postId}/comments`, commentData);
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return { ...post, comments: [...post.comments, res.data] };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Comment error', err);
    }
  };

  const handleShare = async (post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this article: "${post.title}" on Elysian Blog`,
          url: window.location.href,
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      // Fallback: copy to clipboard
      const dummyUrl = `${window.location.origin}/post/${post.id}`;
      navigator.clipboard.writeText(dummyUrl).catch(() => {});
      alert('Link copied to clipboard!');
    }
    // Optionally call backend to track share
    // await api.post(`/posts/${post.id}/share`);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Loading posts...</p></div>;
  }

  return (
    <>
      <header className="blog-header">
        <div className="header-content">
          <h1 className="logo">⟁ Elysian Chronicles</h1>
          <p className="tagline">where ideas root deep & stories grow wild</p>
          <div className="user-info">
            <span>Hello, {user?.name}</span>
            {user?.role === 'admin' && <span className="admin-badge">Admin</span>}
            <button onClick={() => setShowCreateModal(true)} className="create-post-btn">
              + New Post
            </button>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      <main className="blog-main">
        {posts.length === 0 ? (
          <div className="no-posts">No posts yet. Be the first to create one!</div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onAddComment={handleAddComment}
              onShare={handleShare}
              onDelete={user?.role === 'admin' ? () => handleDeletePost(post.id) : null}
            />
          ))
        )}
      </main>
      <footer className="blog-footer">
        <div className="footer-inner">
          <p>🌿 Mindful discourse — backend ready. Every like, comment & share is API-ready.</p>
          <p className="footer-note">© 2025 Elysian Chronicles | Dark Green Gradient Sanctuary</p>
        </div>
      </footer>
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </>
  );
};

// ---------- Main App (handles auth state) ----------
function App() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading...</p></div>;

  if (!user) {
    return (
      <div className="app-container">
        <div className="dynamic-background"></div>
        <div className="login-prompt">
          <h2>Welcome to Elysian Chronicles</h2>
          <button onClick={() => setShowAuth(true)}>Login / Sign Up</button>
        </div>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="dynamic-background"></div>
      <BlogContent />
    </div>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}