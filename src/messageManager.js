const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const MESSAGES_DIR = path.join(__dirname, 'messages');
let messageCache = {
    general: [],
    jokes: [],
    game_hints: {}
};

const loadMessages = () => {
    try {
        // Reset cache before loading
        messageCache = { general: [], jokes: [], game_hints: {} };

        // Load general messages
        const generalPath = path.join(MESSAGES_DIR, 'general.js');
        if (fs.existsSync(generalPath)) {
            delete require.cache[require.resolve(generalPath)];
            messageCache.general = require(generalPath).generalMessages;
        }

        // Load jokes
        const jokesPath = path.join(MESSAGES_DIR, 'general_jokes.js');
        if (fs.existsSync(jokesPath)) {
            delete require.cache[require.resolve(jokesPath)];
            messageCache.jokes = require(jokesPath).generalJokes;
        }

        // Load game hints
        const hintsDir = path.join(MESSAGES_DIR, 'game_hints');
        if (fs.existsSync(hintsDir)) {
            const hintFiles = fs.readdirSync(hintsDir).filter(file => file.endsWith('.js'));
            for (const file of hintFiles) {
                const topic = path.basename(file, '.js');
                const hintPath = path.join(hintsDir, file);
                delete require.cache[require.resolve(hintPath)];
                messageCache.game_hints[topic] = require(hintPath).gameHints;
            }
        }
        console.log('Successfully loaded messages.');
    } catch (error) {
        console.error("Error loading messages:", error);
        messageCache = { general: [], jokes: [], game_hints: {} };
    }
};

// Initial load
loadMessages();

// Watch for changes if not in production
if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch(path.join(MESSAGES_DIR, '**', '*.js'), {
        persistent: true,
        ignoreInitial: true,
    });

    const reload = (filePath) => {
        console.log(`Detected change in ${filePath}, reloading messages...`);
        loadMessages();
    };

    watcher.on('add', reload).on('change', reload).on('unlink', reload);
}

const getRandomMessage = (topic) => {
    let pool = [...messageCache.general, ...messageCache.jokes];
    if (topic && messageCache.game_hints[topic]) {
        pool = [...pool, ...messageCache.game_hints[topic]];
    }
    if (pool.length === 0) {
        return "Starcade에 오신 것을 환영합니다!";
    }
    return pool[Math.floor(Math.random() * pool.length)];
};

module.exports = { getRandomMessage };
