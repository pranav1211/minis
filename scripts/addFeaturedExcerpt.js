const fs = require('fs').promises;
const path = require('path');
const matter = require(path.resolve(__dirname, '..', 'backend', 'node_modules', 'gray-matter'));
const { generateFeaturedExcerpt } = require('../backend/lib/excerpt');

const CONTENT_DIR = path.resolve(__dirname, '..', 'content', 'posts');

function escapeYamlString(str) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function rebuildFrontmatter(data, featuredExcerpt) {
    const lines = ['---'];
    lines.push(`id: ${data.id}`);
    lines.push(`title: ${escapeYamlString(data.title)}`);
    lines.push(`date: "${data.date}"`);
    lines.push(`time: "${data.time}"`);
    lines.push(`tags: ${JSON.stringify(data.tags || [])}`);
    lines.push(`featuredExcerpt: ${escapeYamlString(featuredExcerpt)}`);
    lines.push('---');
    return lines.join('\n');
}

(async () => {
    const files = (await fs.readdir(CONTENT_DIR)).filter(f => f.endsWith('.md'));
    let updated = 0;
    let skipped = 0;

    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file);
        const raw = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(raw);

        const trimmedContent = content.trim();
        const excerpt = generateFeaturedExcerpt(trimmedContent);

        if (data.featuredExcerpt === excerpt) {
            skipped++;
            console.log(`skip   ${file} (unchanged)`);
            continue;
        }

        const frontmatter = rebuildFrontmatter(data, excerpt);
        const fileContent = frontmatter + '\n\n' + trimmedContent + '\n';
        await fs.writeFile(filePath, fileContent, 'utf8');
        updated++;
        console.log(`update ${file} (${excerpt.length} chars)`);
    }

    console.log(`\nDone. ${updated} updated, ${skipped} skipped.`);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
