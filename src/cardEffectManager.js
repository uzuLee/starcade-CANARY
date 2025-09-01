const fs = require('fs');
const path = require('path');

const EFFECTS_DIR = path.join(__dirname, 'cardEffects');

let allEffects = [];

function loadCardEffects() {
    try {
        const effectFolders = fs.readdirSync(EFFECTS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const effects = [];
        for (const folder of effectFolders) {
            const indexPath = path.join(EFFECTS_DIR, folder, 'index.js');
            if (fs.existsSync(indexPath)) {
                delete require.cache[require.resolve(indexPath)];
                const effectModule = require(indexPath).default;
                if (effectModule && effectModule.id) {
                    effects.push(effectModule);
                }
            }
        }
        allEffects = effects;
        console.log('Successfully loaded all card effects.');
    } catch (error) {
        console.error("Error loading card effects:", error);
        allEffects = [];
    }
}

loadCardEffects();

if (process.env.NODE_ENV !== 'production') {
    fs.watch(EFFECTS_DIR, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('index.js')) {
            console.log(`Detected change in ${filename}, reloading card effects...`);
            loadCardEffects();
        }
    });
}

const getAllCardEffects = () => {
    return allEffects;
};

module.exports = { getAllCardEffects };
