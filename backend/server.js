const express = require('express');
const path = require('path');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 7004;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Serve editor static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Minis editor server running on port ${PORT}`);
    console.log(`Editor: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/posts`);
});
