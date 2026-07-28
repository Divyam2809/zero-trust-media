const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin for custom game engine clients, or no origin for cURL/Postman
    callback(null, origin || true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Endpoint 1: POST /api/login
// Simulates user login
app.post('/api/login', (req, res) => {
  // In a real application, you'd validate credentials here
  // For POC, we just set a mock JWT or auth state in an httpOnly cookie
  const token = 'mock_jwt_token_12345';
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  });
  res.json({ message: 'Login successful', token });
});

// Helper function to check auth
const requireAuth = (req, res, next) => {
  let token = req.cookies.auth_token;

  // If missing from cookies, check Authorization header (for Unity / non-browser clients)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Please log in first' });
  }

  req.user = { token }; // Attach user context
  next();
};

// Endpoint 2: GET /api/media/authorize-stream
app.get('/api/media/authorize-stream', requireAuth, (req, res) => {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId parameter' });
  }

  // Map videoId to actual CloudFront path
  const videoMap = {
    'video123': 'Nested Sequence 01.mp4',
    'video456': 'demo/dummy_video.mp4'
  };

  const assetPath = videoMap[videoId];

  if (!assetPath) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  let privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

  if (!cloudfrontDomain || !keyPairId || !privateKey) {
    return res.status(500).json({ error: 'CloudFront configuration missing' });
  }

  // Handle newline characters in the environment variable
  privateKey = privateKey.replace(/\\n/g, '\n');

  // encodeURIComponent ensures characters like + and spaces are converted correctly for S3
  const url = `${cloudfrontDomain}/${encodeURIComponent(assetPath)}`;

  // Set expiration time (e.g., valid for 5 minutes)
  const expiry = new Date().getTime() + 5 * 60 * 1000; // 5 minutes in ms

  try {
    // Generate Signed URL instead of Signed Cookies for local POC testing
    // This avoids cross-domain cookie blocking by the browser when running on localhost
    const signedUrl = getSignedUrl({
      url,
      keyPairId,
      privateKey,
      dateLessThan: new Date(expiry).toISOString(),
    });

    res.json({ 
      message: 'Stream authorized via Signed URL',
      streamUrl: signedUrl,
      expiresAt: new Date(expiry).toISOString()
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate stream authorization' });
  }
});

// Add a logout route for completeness
app.post('/api/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('CloudFront-Policy');
  res.clearCookie('CloudFront-Signature');
  res.clearCookie('CloudFront-Key-Pair-Id');
  res.json({ message: 'Logged out successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
