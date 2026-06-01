import fs from 'fs';
import path from 'path';

const blobDir = path.resolve('blob-report');

let counter = 1;
if (fs.existsSync(blobDir)) {
    fs.readdirSync(blobDir).forEach(item => {
        const itemPath = path.join(blobDir, item);
        // If it's one of our sub-folders (like blob-report-1)
        if (fs.statSync(itemPath).isDirectory()) {
            fs.readdirSync(itemPath).forEach(file => {
                if (file.endsWith('.zip')) {
                    // Move the zip file up to the root blob-report folder and rename it safely.
                    fs.renameSync(path.join(itemPath, file), path.join(blobDir, `shard-${counter++}.zip`));
                }
            });
        }
    });
    console.log('All blobs successfully hoisted for merging');
}