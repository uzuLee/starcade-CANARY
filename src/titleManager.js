const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const ACHIEVEMENTS_DIR = path.join(__dirname, 'achievements');

let allTitles = [];

function loadTitles() {
    try {
        const achievementFolders = fs.readdirSync(ACHIEVEMENTS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const uniqueTitles = new Set();

        for (const folder of achievementFolders) {
            const indexPath = path.join(ACHIEVEMENTS_DIR, folder, 'index.js');
            if (fs.existsSync(indexPath)) {
                // Temporarily clear cache to ensure latest version is loaded
                delete require.cache[require.resolve(indexPath)];
                const achievementModule = require(indexPath).default;
                
                if (achievementModule && achievementModule.rewards && Array.isArray(achievementModule.rewards)) {
                    achievementModule.rewards.forEach(reward => {
                        if (reward.type === 'title' && reward.titleId) {
                            uniqueTitles.add(reward.titleId);
                        }
                    });
                }
            }
        }
        allTitles = Array.from(uniqueTitles);
        console.log('Successfully loaded all titles.', allTitles);
    } catch (error) {
        console.error("Error loading titles:", error);
        allTitles = [];
    }
}

loadTitles();

// Watch for changes in the achievements directory if not in production
if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch(path.join(ACHIEVEMENTS_DIR, '**', 'index.js'), {
        persistent: true,
        ignoreInitial: true,
    });

    const reload = (filePath) => {
        console.log(`Detected change in ${filePath}, reloading titles...`);
        loadTitles();
    };

    watcher.on('add', reload).on('change', reload).on('unlink', reload);
}

const getAllTitles = () => {
    return allTitles;
};

module.exports = { getAllTitles };