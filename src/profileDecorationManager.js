const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const DECORATIONS_DIR = path.join(__dirname, 'profileDecorations');

let allDecorations = [];

function loadDecorations() {
    try {
        const decorationFolders = fs.readdirSync(DECORATIONS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const decorations = [];
        for (const folder of decorationFolders) {
            const indexPath = path.join(DECORATIONS_DIR, folder, 'index.js');
            if (fs.existsSync(indexPath)) {
                delete require.cache[require.resolve(indexPath)];
                const decorationModule = require(indexPath);
                if (decorationModule && decorationModule.id) {
                    decorations.push(decorationModule);
                }
            }
        }
        allDecorations = decorations;
        console.log('Successfully loaded all profile decorations.');
    } catch (error) {
        console.error("Error loading profile decorations:", error);
        allDecorations = [];
    }
}

loadDecorations();

if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch(path.join(DECORATIONS_DIR, '**', 'index.js'), {
        persistent: true,
        ignoreInitial: true,
    });

    const reload = (filePath) => {
        console.log(`Detected change in ${filePath}, reloading profile decorations...`);
        loadDecorations();
    };

    watcher.on('add', reload).on('change', reload).on('unlink', reload);
}

const getAllProfileDecorations = () => {
    return allDecorations;
};

module.exports = { getAllProfileDecorations };
