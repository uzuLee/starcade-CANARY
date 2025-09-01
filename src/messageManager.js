const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, 'messages');
let messageCache = {
    general: [],
    jokes: [],
    game_hints: {}
};

const loadMessages = () => {
    try {
        // Load general messages
        const generalPath = path.join(MESSAGES_DIR, 'general.js');
        delete require.cache[require.resolve(generalPath)];
        messageCache.general = require(generalPath).generalMessages;

        // Load jokes
        const jokesPath = path.join(MESSAGES_DIR, 'general_jokes.js');
        delete require.cache[require.resolve(jokesPath)];
        messageCache.jokes = require(jokesPath).generalJokes;

        // Load game hints
        const hintsDir = path.join(MESSAGES_DIR, 'game_hints');
        const hintFiles = fs.readdirSync(hintsDir).filter(file => file.endsWith('.js'));
        messageCache.game_hints = {}; // Reset hints
        for (const file of hintFiles) {
            const topic = path.basename(file, '.js');
            const hintPath = path.join(hintsDir, file);
            delete require.cache[require.resolve(hintPath)];
            messageCache.game_hints[topic] = require(hintPath).gameHints;
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
    fs.watch(MESSAGES_DIR, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.js')) {
            console.log(`Detected change in ${filename}, reloading messages...`);
            loadMessages();
        }
    });
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