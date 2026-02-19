const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { generateId } = require('../lib/idGenerator');
const { readPost, writePost, deletePost, postExists } = require('../lib/markdownFile');
const { regenerateMetadata } = require('../lib/metadataIndex');
const { verifyAuth } = require('../lib/auth');
const { runShellScript } = require('../lib/shellRunner');
const { writePostPage, deletePostPage } = require('../lib/htmlGenerator');

const router = express.Router();

const CONTENT_DIR = path.resolve(__dirname, '..', '..', 'content', 'posts');
const METADATA_FILE = path.resolve(__dirname, '..', '..', 'content', 'metadata.json');

function getISTDateTime() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
    };
}

// GET /api/posts - List all posts (from metadata.json)
router.get('/', async (req, res) => {
    try {
        const raw = await fs.readFile(METADATA_FILE, 'utf8');
        const posts = JSON.parse(raw);
        res.json({ posts });
    } catch (err) {
        console.error('Error reading metadata:', err);
        res.status(500).json({ error: 'Failed to read posts' });
    }
});

// GET /api/posts/search?q= - Search posts by title
router.get('/search', async (req, res) => {
    try {
        const query = (req.query.q || '').toLowerCase().trim();
        if (!query) {
            return res.json({ posts: [] });
        }

        const raw = await fs.readFile(METADATA_FILE, 'utf8');
        const posts = JSON.parse(raw);
        const filtered = posts.filter(p =>
            p.title.toLowerCase().includes(query)
        );
        res.json({ posts: filtered });
    } catch (err) {
        console.error('Error searching posts:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// GET /api/posts/:id - Get single post with full markdown
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exists = await postExists(CONTENT_DIR, id);
        if (!exists) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const post = await readPost(CONTENT_DIR, id);
        res.json({ post });
    } catch (err) {
        console.error('Error reading post:', err);
        res.status(500).json({ error: 'Failed to read post' });
    }
});

// POST /api/posts - Create new post
router.post('/', async (req, res) => {
    try {
        const { title, content, tags, password } = req.body;

        if (!verifyAuth(password)) {
            return res.status(401).json({ error: 'Invalid authentication key' });
        }
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const id = generateId(CONTENT_DIR);
        const { date, time } = getISTDateTime();

        const parsedTags = Array.isArray(tags)
            ? tags.map(t => t.trim()).filter(Boolean)
            : (tags || '').split(',').map(t => t.trim()).filter(Boolean);

        const postData = {
            id,
            title: title.trim(),
            date,
            time,
            tags: parsedTags,
            content: content.trim()
        };

        await writePost(CONTENT_DIR, postData);
        await regenerateMetadata(CONTENT_DIR, METADATA_FILE);
        writePostPage(postData).catch(err => {
            console.error('HTML page generation failed:', err.message);
        });

        // Run shell script (non-blocking, don't fail the request)
        runShellScript().catch(err => {
            console.error('Shell script failed:', err.message);
        });

        res.json({ success: true, id, post: postData });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// PUT /api/posts/:id - Update existing post
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags, password } = req.body;

        if (!verifyAuth(password)) {
            return res.status(401).json({ error: 'Invalid authentication key' });
        }

        const exists = await postExists(CONTENT_DIR, id);
        if (!exists) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Preserve original date and time
        const existingPost = await readPost(CONTENT_DIR, id);

        const parsedTags = Array.isArray(tags)
            ? tags.map(t => t.trim()).filter(Boolean)
            : (tags || '').split(',').map(t => t.trim()).filter(Boolean);

        const postData = {
            id,
            title: title.trim(),
            date: existingPost.date,
            time: existingPost.time,
            tags: parsedTags,
            content: content.trim()
        };

        await writePost(CONTENT_DIR, postData);
        await regenerateMetadata(CONTENT_DIR, METADATA_FILE);
        writePostPage(postData).catch(err => {
            console.error('HTML page generation failed:', err.message);
        });

        runShellScript().catch(err => {
            console.error('Shell script failed:', err.message);
        });

        res.json({ success: true, post: postData });
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!verifyAuth(password)) {
            return res.status(401).json({ error: 'Invalid authentication key' });
        }

        const exists = await postExists(CONTENT_DIR, id);
        if (!exists) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await deletePost(CONTENT_DIR, id);
        await regenerateMetadata(CONTENT_DIR, METADATA_FILE);
        deletePostPage(id).catch(err => {
            console.error('HTML page deletion failed:', err.message);
        });

        runShellScript().catch(err => {
            console.error('Shell script failed:', err.message);
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

module.exports = router;
