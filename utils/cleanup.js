// utils/cleanup.js
import fs from 'fs';
import path from 'path';

// List all the folders that needs to be wiped before starting the tests. This includes Playwright's own report folder and any custom folders you use for auth/session storage.
const dirsToClean = ['.auth', 'blob-report', 'playwright-report'];

for (const dir of dirsToClean) {
    const dirPath = path.resolve(dir);
    if (fs.existsSync(dirPath)) {
        // recursive: true deletes the folder and all its contents safely
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`Cleared stale directory: ${dir}`);
    }
}

// Recreate the empty .auth folder so the parallel workers can write to it instantly
fs.mkdirSync(path.resolve('.auth'));
console.log('Cleanup complete! Starting parallel shards.');
