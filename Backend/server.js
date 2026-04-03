require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://elysianblog.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy does not allow this origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});