const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

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

module.exports = { regenerateMetadata };
