// backend/routes/posts.js
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// In-memory posts store (replace with database later)
let posts = [
  {
    id: 1,
    title: "Whispers of the Emerald Canopy",
    content: "Beneath the ancient boughs, where light filters like liquid gold, the forest breathes in slow rhythm. Each leaf tells stories of resilience, of roots that hold the earth together. In a world rushing forward, the woods remind us to stand still and listen. Conservation isn't just an act — it's a conversation with nature itself.",
    likeCount: 24,
    likedBy: [],
    comments: [
      { id: 'c1', author: "Luna Moss", text: "This resonates so deeply! The emerald canopy is truly magical.", timestamp: "2025-03-30T10:00:00Z", userId: null },
      { id: 'c2', author: "ForestWanderer", text: "We need more voices like this. Beautiful writing.", timestamp: "2025-03-29T15:30:00Z", userId: null }
    ],
    authorId: 1,
    createdAt: new Date('2025-03-28')
  },
  {
    id: 2,
    title: "Digital Gardens: Cultivating Mindful Tech",
    content: "What if we treated our digital spaces like gardens? Prune distractions, water meaningful connections, and let ideas bloom. The internet can be a place of growth rather than noise. By curating feeds, engaging intentionally, and building communities, we design a digital ecosystem that nurtures creativity and calm.",
    likeCount: 47,
    likedBy: [],
    comments: [
      { id: 'c3', author: "PixelPioneer", text: "Love the garden metaphor! I've started unfollowing toxic accounts and it's liberating.", timestamp: "2025-03-28T12:00:00Z", userId: null }
    ],
    authorId: 1,
    createdAt: new Date('2025-03-27')
  },
  {
    id: 3,
    title: "Dark Green Aesthetic: Where Elegance Meets Earth",
    content: "The fusion of deep green and shadow creates a visual language of sophistication and nature. It's more than a color palette — it's a feeling of grounded luxury. From UI design to architecture, this palette evokes stability, growth, and a touch of mystery. Embrace the verdant darkness.",
    likeCount: 82,
    likedBy: [],
    comments: [
      { id: 'c4', author: "ChromaCult", text: "Dark green is absolutely timeless. Great insights on the psychological impact.", timestamp: "2025-03-26T09:00:00Z", userId: null },
      { id: 'c5', author: "DesignNomad", text: "Using this palette for my new portfolio, thanks for the inspiration!", timestamp: "2025-03-25T14:00:00Z", userId: null }
    ],
    authorId: 1,
    createdAt: new Date('2025-03-25')
  }
];

let nextPostId = 4;

// GET all posts (with like status for logged-in user)
router.get('/', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let userId = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {}
  }
  const postsWithLikeStatus = posts.map(post => ({
    ...post,
    liked: userId ? post.likedBy.includes(userId) : false
  }));
  res.json(postsWithLikeStatus);
});

// CREATE a new post (any authenticated user)
router.post('/', authMiddleware, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  const newPost = {
    id: nextPostId++,
    title,
    content,
    likeCount: 0,
    likedBy: [],
    comments: [],
    authorId: req.user.userId,
    createdAt: new Date()
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

// DELETE a post (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can delete posts' });
  }
  posts.splice(postIndex, 1);
  res.json({ message: 'Post deleted' });
});

// LIKE / UNLIKE a post
router.post('/:id/like', authMiddleware, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const userId = req.user.userId;
  const likedIndex = post.likedBy.indexOf(userId);
  if (likedIndex === -1) {
    post.likedBy.push(userId);
    post.likeCount++;
  } else {
    post.likedBy.splice(likedIndex, 1);
    post.likeCount--;
  }
  res.json({ liked: likedIndex === -1, likeCount: post.likeCount });
});

// ADD COMMENT
router.post('/:id/comments', authMiddleware, (req, res) => {
  const postId = parseInt(req.params.id);
  const { author, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text required' });
  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const newComment = {
    id: Date.now().toString(),
    author: author || 'Anonymous',
    text,
    timestamp: new Date().toISOString(),
    userId: req.user.userId
  };
  post.comments.push(newComment);
  res.status(201).json(newComment);
});

module.exports = router;