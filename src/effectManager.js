const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const EFFECTS_DIR = path.join(__dirname, 'profileEffects'); // 경로 변경

let allEffects = [];

function loadEffects() {
    try {
        const effectFolders = fs.readdirSync(EFFECTS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const effects = [];
        for (const folder of effectFolders) {
            const indexPath = path.join(EFFECTS_DIR, folder, 'index.js');
            if (fs.existsSync(indexPath)) {
                delete require.cache[require.resolve(indexPath)];
                const effectModule = require(indexPath); // default export가 아님
                if (effectModule && effectModule.id) {
                    effects.push(effectModule);
                }
            }
        }
        allEffects = effects;
        console.log('Successfully loaded all profile effects.');
    } catch (error) {
        console.error("Error loading effects:", error);
        allEffects = [];
    }
}

loadEffects();

if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch(path.join(EFFECTS_DIR, '**', 'index.js'), {
        persistent: true,
        ignoreInitial: true,
    });

    const reload = (filePath) => {
        console.log(`Detected change in ${filePath}, reloading profile effects...`);
        loadEffects();
    };

    watcher.on('add', reload).on('change', reload).on('unlink', reload);
}

const getAllEffects = () => {
    return allEffects;
};

module.exports = { getAllEffects };