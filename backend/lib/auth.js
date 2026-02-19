const fs = require('fs');

function getManageKey() {
    let key = process.env.managekey;
    if (!key) {
        try {
            const envContent = fs.readFileSync('/etc/environment', 'utf8');
            const line = envContent.split('\n').find(l => l.startsWith('managekey='));
            if (line) key = line.split('=')[1]?.trim();
        } catch {
            // /etc/environment not available (e.g., Windows dev)
        }
    }
    return key;
}

function verifyAuth(password) {
    const key = getManageKey();
    if (!key) return false;
    return password === key;
}

module.exports = { verifyAuth, getManageKey };
