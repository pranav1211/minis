const path = require('path');

const CONTENT_DIR = path.resolve(__dirname, '..', 'content', 'posts');
const METADATA_FILE = path.resolve(__dirname, '..', 'content', 'metadata.json');

// Use the backend lib directly
const metadataIndexPath = path.resolve(__dirname, '..', 'backend', 'lib', 'metadataIndex.js');
const { regenerateMetadata } = require(metadataIndexPath);

async function main() {
    console.log('Generating metadata.json from .md files...');
    const posts = await regenerateMetadata(CONTENT_DIR, METADATA_FILE);
    console.log(`Generated metadata.json with ${posts.length} posts`);
    posts.forEach(p => console.log(`  ${p.id} - ${p.title} (${p.date})`));
}

main().catch(err => {
    console.error('Error generating metadata:', err);
    process.exit(1);
});
