const messageCache = require('./messages');

const getRandomMessage = (topic) => {
    let pool = [...(messageCache.general || []), ...(messageCache.jokes || [])];
    if (topic && messageCache.game_hints && messageCache.game_hints[topic]) {
        pool = [...pool, ...messageCache.game_hints[topic]];
    }
    if (pool.length === 0) {
        return "Starcade에 오신 것을 환영합니다!";
    }
    return pool[Math.floor(Math.random() * pool.length)];
};

module.exports = { getRandomMessage };