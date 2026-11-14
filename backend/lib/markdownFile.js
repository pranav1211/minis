const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { generateFeaturedExcerpt } = require('./excerpt');

function escapeYamlString(str) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function readPost(contentDir, id) {
    const filePath = path.join(contentDir, `${id}.md`);
    const raw = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(raw);
    return { ...data, content: content.trim() };
}

/** Parse a stored post document (frontmatter + markdown) into post data. */
function parsePost(raw) {
    const { data, content } = matter(raw);
    return { ...data, content: content.trim() };
}

/** The exact file text for a post (same format as before; bmb-data stores it verbatim). */
function buildPostMarkdown(postData) {
    const { id, title, date, time, tags, content } = postData;
    const featuredExcerpt = generateFeaturedExcerpt(content);
    const frontmatter = [
        '---',
        `id: ${id}`,
        `title: ${escapeYamlString(title)}`,
        `date: "${date}"`,
        `time: "${time}"`,
        `tags: ${JSON.stringify(tags)}`,
        `featuredExcerpt: ${escapeYamlString(featuredExcerpt)}`,
        '---'
    ].join('\n');
    return frontmatter + '\n\n' + content + '\n';
}

/** Local backup copy (content/ folder in this repo). */
async function writePostFile(contentDir, id, fileContent) {
    await fs.mkdir(contentDir, { recursive: true });
    await fs.writeFile(path.join(contentDir, `${id}.md`), fileContent, 'utf8');
}

async function writePost(contentDir, postData) {
    const { id, title, date, time, tags, content } = postData;
    const featuredExcerpt = generateFeaturedExcerpt(content);

    const frontmatter = [
        '---',
        `id: ${id}`,
        `title: ${escapeYamlString(title)}`,
        `date: "${date}"`,
        `time: "${time}"`,
        `tags: ${JSON.stringify(tags)}`,
        `featuredExcerpt: ${escapeYamlString(featuredExcerpt)}`,
        '---'
    ].join('\n');

    const fileContent = frontmatter + '\n\n' + content + '\n';
    const filePath = path.join(contentDir, `${id}.md`);
    await fs.writeFile(filePath, fileContent, 'utf8');
}

async function deletePost(contentDir, id) {
    const filePath = path.join(contentDir, `${id}.md`);
    await fs.unlink(filePath);
}

async function postExists(contentDir, id) {
    try {
        await fs.access(path.join(contentDir, `${id}.md`));
        return true;
    } catch {
        return false;
    }
}

async function listPosts(contentDir) {
    const files = await fs.readdir(contentDir);
    const posts = [];
    for (const file of files.filter(f => f.endsWith('.md'))) {
        const raw = await fs.readFile(path.join(contentDir, file), 'utf8');
        const { data } = matter(raw);
        posts.push(data);
    }
    return posts;
}

module.exports = { readPost, writePost, deletePost, postExists, listPosts, parsePost, buildPostMarkdown, writePostFile };
