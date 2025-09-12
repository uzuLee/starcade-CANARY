const allGames = require('./games');

const getGames = () => {
    // Sorting can be done once if the list is static, or here if it needs to be fresh.
    return allGames.sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = { getGames };
