import { cpSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = resolve(__dirname, '..', '..', 'content', 'posts');
const dest = resolve(__dirname, '..', 'src', 'content', 'posts');

if (!existsSync(source)) {
    console.error(`Source directory not found: ${source}`);
    process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(source, dest, { recursive: true });
console.log(`Copied content from ${source} to ${dest}`);
