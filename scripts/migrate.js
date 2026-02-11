const fs = require('fs');
const path = require('path');

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CONTENT_DIR = path.resolve(__dirname, '..', 'content', 'posts');
const METADATA_FILE = path.resolve(__dirname, '..', 'content', 'metadata.json');

function generateId(usedIds) {
    let id;
    do {
        id = 'mini_';
        for (let i = 0; i < 6; i++) {
            id += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        }
    } while (usedIds.has(id));
    usedIds.add(id);
    return id;
}

function escapeYamlString(str) {
    if (str.includes('"') || str.includes(':') || str.includes('#')) {
        return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return `"${str}"`;
}

function migrate() {
    const rawData = fs.readFileSync(METADATA_FILE, 'utf8');
    const posts = JSON.parse(rawData);

    if (!fs.existsSync(CONTENT_DIR)) {
        fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }

    const usedIds = new Set();
    const mapping = [];

    for (const post of posts) {
        const newId = generateId(usedIds);

        const frontmatter = [
            '---',
            `id: ${newId}`,
            `title: ${escapeYamlString(post.title)}`,
            `date: "${post.date}"`,
            `time: "${post.time}"`,
            `tags: ${JSON.stringify(post.tags)}`,
            '---'
        ].join('\n');

        const markdown = post.rawMarkdown || '';
        const fileContent = frontmatter + '\n\n' + markdown + '\n';

        const filePath = path.join(CONTENT_DIR, `${newId}.md`);
        fs.writeFileSync(filePath, fileContent, 'utf8');

        mapping.push({
            oldId: post.id,
            newId: newId,
            title: post.title,
            date: post.date
        });

        console.log(`  ${post.id} -> ${newId} (${post.title})`);
    }

    console.log(`\nMigrated ${mapping.length} posts to ${CONTENT_DIR}`);
    console.log('\nID Mapping:');
    mapping.forEach(m => {
        console.log(`  ${m.oldId} -> ${m.newId}`);
    });

    // Verify
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    console.log(`\nVerification: ${files.length} .md files in ${CONTENT_DIR}`);
    if (files.length !== posts.length) {
        console.error(`ERROR: Expected ${posts.length} files, found ${files.length}`);
        process.exit(1);
    }
    console.log('Migration complete.');
}

migrate();
