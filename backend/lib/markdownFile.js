const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

function escapeYamlString(str) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function readPost(contentDir, id) {
    const filePath = path.join(contentDir, `${id}.md`);
    const raw = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(raw);
    return { ...data, content: content.trim() };
}

async function writePost(contentDir, postData) {
    const { id, title, date, time, tags, content } = postData;

    const frontmatter = [
        '---',
        `id: ${id}`,
        `title: ${escapeYamlString(title)}`,
        `date: "${date}"`,
        `time: "${time}"`,
        `tags: ${JSON.stringify(tags)}`,
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

module.exports = { readPost, writePost, deletePost, postExists, listPosts };
