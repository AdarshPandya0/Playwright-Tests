import fs from 'fs';
import path from 'path';

async function globalSetup() {
    // List all the folders we want to completely wipe before the tests start
    const dirsToClean = ['.auth', 'blob-report', 'playwright-report'];
    
    for (const dir of dirsToClean) {
        const dirPath = path.resolve(dir);
        if (fs.existsSync(dirPath)) {
            // recursive: true deletes the folder and all its contents safely
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`Cleared stale directory: ${dir}`);
        }
    }
    
    // Recreate the empty .auth folder so the workers can write their states
    fs.mkdirSync(path.resolve('.auth'));
}

export default globalSetup;