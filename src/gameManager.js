const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const GAMES_DIR = path.join(__dirname, 'games');

let gamesCache = null;

const loadGames = () => {
    try {
        const gameFiles = fs.readdirSync(GAMES_DIR).filter(file => file.endsWith('.js'));
        const games = gameFiles.map(file => {
            const gamePath = path.join(GAMES_DIR, file);
            // Clear cache for the specific file to get updates
            delete require.cache[require.resolve(gamePath)];
            return require(gamePath);
        });
        gamesCache = games.sort((a, b) => a.name.localeCompare(b.name));
        console.log('Successfully loaded games:', gamesCache.map(g => g.name).join(', '));
    } catch (error) {
        console.error("Error loading games from files:", error);
        gamesCache = [];
    }
};

// Load games on initial startup
loadGames();

// Watch for changes in the games directory if not in production
if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch(path.join(GAMES_DIR, '**', '*.js'), {
        persistent: true,
        ignoreInitial: true,
    });

    const reload = (filePath) => {
        console.log(`Detected change in ${filePath}, reloading games...`);
        loadGames();
    };

    watcher.on('add', reload).on('change', reload).on('unlink', reload);
}

const getGames = () => {
    // In a real production environment, you might not want to reload on every call,
    // but for this dynamic setup, we can reload to catch changes instantly.
    // The watch mechanism above is more efficient.
    return gamesCache;
};

module.exports = { getGames };