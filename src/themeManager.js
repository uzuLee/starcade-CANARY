const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const THEMES_DIR = path.join(__dirname, 'themes');

let allThemes = [];

function loadThemes() {
    try {
        const themeFiles = fs.readdirSync(THEMES_DIR).filter(file => file.endsWith('.js'));

        const themes = [];
        for (const file of themeFiles) {
            const filePath = path.join(THEMES_DIR, file);
            delete require.cache[require.resolve(filePath)];
            const themeModule = require(filePath);

            if (themeModule && themeModule.id) {
                themes.push(themeModule);
            }
        }
        allThemes = themes;
        console.log('Successfully loaded all themes.');
    } catch (error) {
        console.error("Error loading themes:", error);
        allThemes = [];
    }
}

loadThemes();

if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch(path.join(THEMES_DIR, '**', '*.js'), {
        persistent: true,
        ignoreInitial: true,
    });

    const reload = (filePath) => {
        console.log(`Detected change in ${filePath}, reloading themes...`);
        loadThemes();
    };

    watcher.on('add', reload).on('change', reload).on('unlink', reload);
}

const getAllThemes = () => {
    return allThemes;
};

module.exports = { getAllThemes };
