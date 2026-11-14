const express = require('express');
const path = require('path');
const postsRouter = require('./routes/posts');
const { authRouter } = require('./lib/auth');

const app = express();
const PORT = Number(process.env.PORT || 7104);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 'loopback'); // only the local nginx may set X-Forwarded-*

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Serve editor static files
app.use(express.static(path.join(__dirname, 'public')));

// Editor sign-in ("Sign in with Manage") and the posts API
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

// Serve editor page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Loopback only: nginx is the public entry point.
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Minis editor server running on 127.0.0.1:${PORT}`);
    console.log(`Data: ${process.env.MANAGE_API_URL ? 'Manage (bmb-data primary)' : 'Manage NOT configured'}; sign-in ${process.env.MINIS_SESSION_SECRET ? 'configured' : 'NOT configured'}`);
});
