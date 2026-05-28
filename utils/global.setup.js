import fs from 'fs';
import path from 'path';

async function globalSetup() {
    const authDirPath = path.resolve('.auth');
    
    // If the folder exists from a previous run, delete it and everything inside
    if (fs.existsSync(authDirPath)) {
        fs.rmSync(authDirPath, { recursive: true, force: true });
        console.log('Cleared stale auth states.');
    }
    
    // Recreate the empty folder so the workers can write to it
    fs.mkdirSync(authDirPath);
}

export default globalSetup;