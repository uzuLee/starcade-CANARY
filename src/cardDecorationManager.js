const fs = require('fs');
const path = require('path');

const DECORATIONS_DIR = path.join(__dirname, 'cardDecorations');

let allDecorations = [];

function loadCardDecorations() {
    try {
        const decorationFolders = fs.readdirSync(DECORATIONS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const decorations = [];
        for (const folder of decorationFolders) {
            const indexPath = path.join(DECORATIONS_DIR, folder, 'index.js');
            if (fs.existsSync(indexPath)) {
                delete require.cache[require.resolve(indexPath)];
                const decorationModule = require(indexPath).default;
                if (decorationModule && decorationModule.id) {
                    decorations.push(decorationModule);
                }
            }
        }
        allDecorations = decorations;
        console.log('Successfully loaded all card decorations.');
    } catch (error) {
        console.error("Error loading card decorations:", error);
        allDecorations = [];
    }
}

loadCardDecorations();

if (process.env.NODE_ENV !== 'production') {
    fs.watch(DECORATIONS_DIR, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('index.js')) {
            console.log(`Detected change in ${filename}, reloading card decorations...`);
            loadCardDecorations();
        }
    });
}

const getAllCardDecorations = () => {
    return allDecorations;
};

module.exports = { getAllCardDecorations };