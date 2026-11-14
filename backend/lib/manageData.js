// Minis content in bmb-data, through Manage's data API (the PRIMARY copy).
//   minis.post.<id>  markdown document per post
//   minis.metadata   landing-page index (JSON array)
// A post and the index are written in ONE transaction (one commit in bmb-data).
// Uses MANAGE_API_URL + MANAGE_API_TOKEN, written into this app's env file by Manage.

const API = () => process.env.MANAGE_API_URL;
const TOKEN = () => process.env.MANAGE_API_TOKEN;

async function call(method, path, body) {
    if (!API() || !TOKEN()) throw Object.assign(new Error('Manage data access is not configured'), { status: 503 });
    const r = await fetch(`${API()}/data${path}`, {
        method,
        headers: { Authorization: `Bearer ${TOKEN()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000)
    });
    const payload = await r.json().catch(() => ({}));
    if (!r.ok) {
        const err = new Error(payload.message || `Manage responded ${r.status}`);
        err.status = r.status;
        err.code = payload.code;
        throw err;
    }
    return { status: r.status, body: payload };
}

async function getMetadata() {
    return (await call('GET', '/resources/minis.metadata')).body.data;
}

async function getPostMarkdown(id) {
    try {
        return (await call('GET', `/resources/minis.post.${encodeURIComponent(id)}`)).body.data;
    } catch (err) {
        if (err.status === 404) return null;
        throw err;
    }
}

/** Save a post + the new index atomically. Resolves { pending } (true = committed, push pending). */
async function savePost(id, markdown, metadata) {
    const r = await call('POST', '/transactions', {
        changes: [
            { key: `minis.post.${id}`, data: markdown },
            { key: 'minis.metadata', data: metadata }
        ]
    });
    return { pending: r.status === 202 };
}

async function removePost(id, metadata) {
    const r = await call('POST', '/transactions', {
        changes: [
            { key: `minis.post.${id}`, delete: true },
            { key: 'minis.metadata', data: metadata }
        ]
    });
    return { pending: r.status === 202 };
}

module.exports = { getMetadata, getPostMarkdown, savePost, removePost };
