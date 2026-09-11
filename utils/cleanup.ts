import fs from 'fs';
import path from 'path';

// Folders to wipe before starting a test run. This includes Playwright's own
// report folders and the custom folders used for cached auth/session storage.
const dirsToClean: string[] = ['.auth', 'blob-report', 'playwright-report'];

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
