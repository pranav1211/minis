const fs = require('fs');
const path = require('path');

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 6;

function generateId(contentDir) {
    const existingIds = new Set(
        fs.readdirSync(contentDir)
            .filter(f => f.endsWith('.md'))
            .map(f => f.replace('.md', ''))
    );

    let id;
    do {
        id = 'mini_';
        for (let i = 0; i < ID_LENGTH; i++) {
            id += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        }
    } while (existingIds.has(id));

    return id;
}

module.exports = { generateId };
