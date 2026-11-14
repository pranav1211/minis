// Minis posts API.
//
// bmb-data (through Manage) is the PRIMARY copy: a post's markdown and the landing
// index (metadata.json) are written there first, in ONE transaction. Only after that
// succeeds does this server update its content/ backup, generate the post page, and
// push the backup. If Manage refuses or is down, nothing local changes.
// Reads come from bmb-data; the local backup is used only if Manage is unreachable.

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { parsePost, buildPostMarkdown, writePostFile, deletePost } = require('../lib/markdownFile');
const { metadataEntry, updatedIndex } = require('../lib/metadataIndex');
const { requireEditor } = require('../lib/auth');
const { writePostPage, deletePostPage } = require('../lib/htmlGenerator');
const manage = require('../lib/manageData');
const { backupPost } = require('../lib/backupPush');

const router = express.Router();

const CONTENT_DIR = path.resolve(__dirname, '..', '..', 'content', 'posts');
const METADATA_FILE = path.resolve(__dirname, '..', '..', 'content', 'metadata.json');
const ID_RE = /^mini_[a-z0-9]{6}$/;
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function getISTDateTime() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const pad = (n) => String(n).padStart(2, '0');
    return {
        date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
    };
}

function newId(existing) {
    let id;
    do {
        id = 'mini_';
        for (let i = 0; i < 6; i++) id += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    } while (existing.has(id));
    return id;
}

const parseTags = (tags) =>
    Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : String(tags || '').split(',').map((t) => t.trim()).filter(Boolean);

/** Index from bmb-data; local backup only when Manage cannot be reached. */
async function readIndex() {
    try {
        return { posts: await manage.getMetadata(), source: 'bmb-data' };
    } catch (err) {
        if (err.status && err.status < 500 && err.status !== 503) throw err;
        console.error('Manage unreachable, serving the local backup index:', err.message);
        return { posts: JSON.parse(await fs.readFile(METADATA_FILE, 'utf8')), source: 'backup' };
    }
}

async function readPostRaw(id) {
    try {
        return await manage.getPostMarkdown(id);
    } catch (err) {
        if (err.status && err.status < 500 && err.status !== 503) throw err;
        try { return await fs.readFile(path.join(CONTENT_DIR, `${id}.md`), 'utf8'); } catch { return null; }
    }
}

/** After bmb-data accepted the change: backup files, page, push. */
async function applyLocally(postData, markdown, index, action) {
    await writePostFile(CONTENT_DIR, postData.id, markdown);
    await fs.writeFile(METADATA_FILE, JSON.stringify(index, null, 2), 'utf8');
    await writePostPage(postData).catch((err) => console.error('HTML page generation failed:', err.message));
    backupPost(postData.id, action);
}

function manageError(res, err, what) {
    console.error(`${what} failed in bmb-data:`, err.message);
    const status = err.status === 409 ? 409 : err.status === 400 ? 400 : 502;
    return res.status(status).json({ error: `${what} was not saved: ${err.message}`, code: err.code || null });
}

// GET /api/posts - all posts (landing index)
router.get('/', async (req, res) => {
    try {
        const { posts, source } = await readIndex();
        res.set('X-Minis-Source', source).json({ posts });
    } catch (err) {
        console.error('Error reading index:', err);
        res.status(500).json({ error: 'Failed to read posts' });
    }
});

// GET /api/posts/search?q=
router.get('/search', async (req, res) => {
    try {
        const query = String(req.query.q || '').toLowerCase().trim();
        if (!query) return res.json({ posts: [] });
        const { posts } = await readIndex();
        res.json({ posts: posts.filter((p) => String(p.title).toLowerCase().includes(query)) });
    } catch (err) {
        console.error('Error searching posts:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// GET /api/posts/:id - one post with full markdown
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!ID_RE.test(id)) return res.status(404).json({ error: 'Post not found' });
        const raw = await readPostRaw(id);
        if (raw === null) return res.status(404).json({ error: 'Post not found' });
        const post = parsePost(raw);
        res.json({ post: { ...post, rawMarkdown: post.content } });
    } catch (err) {
        console.error('Error reading post:', err);
        res.status(500).json({ error: 'Failed to read post' });
    }
});

// POST /api/posts - create
router.post('/', requireEditor, async (req, res) => {
    const { title, content, tags } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'Content is required' });
    let index;
    try {
        index = await manage.getMetadata();
    } catch (err) {
        return manageError(res, err, 'Post');
    }
    const id = newId(new Set(index.map((p) => p.id)));
    const { date, time } = getISTDateTime();
    const postData = { id, title: String(title).trim(), date, time, tags: parseTags(tags), content: String(content).trim() };
    const markdown = buildPostMarkdown(postData);
    const next = updatedIndex(index, { entry: await metadataEntry(markdown) });
    try {
        const saved = await manage.savePost(id, markdown, next);
        await applyLocally(postData, markdown, next, 'create');
        res.json({ success: true, id, post: postData, ...(saved.pending ? { pending: true } : {}) });
    } catch (err) {
        return manageError(res, err, 'Post');
    }
});

// PUT /api/posts/:id - update (date/time preserved)
router.put('/:id', requireEditor, async (req, res) => {
    const { id } = req.params;
    const { title, content, tags } = req.body || {};
    if (!ID_RE.test(id)) return res.status(404).json({ error: 'Post not found' });
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'Content is required' });
    let index;
    let existing;
    try {
        index = await manage.getMetadata();
        existing = await manage.getPostMarkdown(id);
    } catch (err) {
        return manageError(res, err, 'Post');
    }
    if (existing === null) return res.status(404).json({ error: 'Post not found' });
    const before = parsePost(existing);
    const postData = { id, title: String(title).trim(), date: before.date, time: before.time, tags: parseTags(tags), content: String(content).trim() };
    const markdown = buildPostMarkdown(postData);
    const next = updatedIndex(index, { entry: await metadataEntry(markdown) });
    try {
        const saved = await manage.savePost(id, markdown, next);
        await applyLocally(postData, markdown, next, 'update');
        res.json({ success: true, post: postData, ...(saved.pending ? { pending: true } : {}) });
    } catch (err) {
        return manageError(res, err, 'Post');
    }
});

// DELETE /api/posts/:id
router.delete('/:id', requireEditor, async (req, res) => {
    const { id } = req.params;
    if (!ID_RE.test(id)) return res.status(404).json({ error: 'Post not found' });
    let index;
    try {
        index = await manage.getMetadata();
        if ((await manage.getPostMarkdown(id)) === null) return res.status(404).json({ error: 'Post not found' });
    } catch (err) {
        return manageError(res, err, 'Delete');
    }
    const next = updatedIndex(index, { removeId: id });
    try {
        await manage.removePost(id, next);
    } catch (err) {
        return manageError(res, err, 'Delete');
    }
    await deletePost(CONTENT_DIR, id).catch(() => {});
    await fs.writeFile(METADATA_FILE, JSON.stringify(next, null, 2), 'utf8');
    await deletePostPage(id).catch((err) => console.error('HTML page deletion failed:', err.message));
    backupPost(id, 'delete');
    res.json({ success: true });
});

module.exports = router;
