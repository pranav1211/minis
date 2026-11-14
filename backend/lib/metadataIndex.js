const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { generateFeaturedExcerpt } = require('./excerpt');

async function regenerateMetadata(contentDir, metadataFile) {
    const files = await fs.readdir(contentDir);
    const posts = [];

    for (const file of files.filter(f => f.endsWith('.md'))) {
        const raw = await fs.readFile(path.join(contentDir, file), 'utf8');
        const { data, content } = matter(raw);
        const trimmedContent = content.trim();

        posts.push({
            id: data.id,
            title: data.title,
            date: data.date,
            time: data.time,
            tags: data.tags || [],
            featuredExcerpt: data.featuredExcerpt || generateFeaturedExcerpt(trimmedContent),
            content: await marked.parse(trimmedContent),
            rawMarkdown: trimmedContent
        });
    }

    posts.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}:00`);
        const dateB = new Date(`${b.date}T${b.time}:00`);
        return dateB - dateA;
    });

    await fs.writeFile(metadataFile, JSON.stringify(posts, null, 2), 'utf8');
    return posts;
}

/** One index entry from a post's stored markdown (same shape regenerateMetadata produces). */
async function metadataEntry(raw) {
    const { data, content } = matter(raw);
    const trimmedContent = content.trim();
    return {
        id: data.id,
        title: data.title,
        date: data.date,
        time: data.time,
        tags: data.tags || [],
        featuredExcerpt: data.featuredExcerpt || generateFeaturedExcerpt(trimmedContent),
        content: await marked.parse(trimmedContent),
        rawMarkdown: trimmedContent
    };
}

const byNewest = (a, b) => new Date(`${b.date}T${b.time}:00`) - new Date(`${a.date}T${a.time}:00`);

/** New index with `entry` added/replaced (or `removeId` dropped), newest first. */
function updatedIndex(index, { entry = null, removeId = null } = {}) {
    const id = entry ? entry.id : removeId;
    const next = (Array.isArray(index) ? index : []).filter((p) => p.id !== id);
    if (entry) next.push(entry);
    return next.sort(byNewest);
}

module.exports = { regenerateMetadata, metadataEntry, updatedIndex };
