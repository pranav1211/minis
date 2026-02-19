const { exec } = require('child_process');
const fs = require('fs');

function runShellScript(scriptPath = '/shellfiles/updateminis.sh') {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(scriptPath)) {
            console.log(`Shell script not found: ${scriptPath} (skipping)`);
            return resolve({ stdout: '', stderr: '', skipped: true });
        }

        exec(`sh "${scriptPath}"`, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Shell script error: ${error.message}`);
                return reject(error);
            }
            console.log(`Shell script output: ${stdout}`);
            resolve({ stdout, stderr });
        });
    });
}

module.exports = { runShellScript };