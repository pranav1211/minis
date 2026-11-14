// Backup copy of Minis content in THIS repo (content/ + the generated post pages),
// committed and pushed after bmb-data (the primary copy) has accepted the change.
// Exact paths only, no shell, serialized. Replaces /shellfiles/updateminis.sh.

const { execFile } = require('child_process');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
let chain = Promise.resolve();

function git(args) {
    return new Promise((resolve) => {
        execFile('git', ['-C', REPO, ...args], { timeout: 60000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (err, stdout, stderr) =>
            resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, stdout: String(stdout), stderr: String(stderr) })
        );
    });
}

/** Queue a backup commit + push of one post's files. Never throws; logs failures. */
function backupPost(id, action) {
    if (process.env.MINIS_BACKUP_PUSH === 'off') return Promise.resolve(); // tests / local runs
    const paths =[`content/posts/${id}.md`, 'content/metadata.json', `frontend/dist/post/${id}`];
    chain = chain.then(async () => {
        // -A limited to these exact paths stages edits and deletions of this post only.
        const add = await git(['add', '-A', '--', ...paths]);
        if (add.code !== 0) return console.error('[backup] git add failed:', add.stderr.trim());
        const staged = await git(['diff', '--cached', '--quiet']);
        if (staged.code === 0) return; // nothing changed
        const commit = await git(['-c', 'user.name=minis', '-c', 'user.email=minis@localhost', 'commit', '-q', '-m', `minis: ${action} ${id} (backup)`]);
        if (commit.code !== 0) return console.error('[backup] git commit failed:', commit.stderr.trim());
        const push = await git(['push', '-q', 'origin', 'HEAD:main']);
        if (push.code !== 0) console.error('[backup] git push failed (bmb-data already has the change):', push.stderr.trim());
    });
    return chain;
}

module.exports = { backupPost };
