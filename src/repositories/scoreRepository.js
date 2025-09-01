/**
 * @file Manages game scores in Redis.
 */
const { client } = require('../redisClient');

// Redis Key Prefix for scores.
const SCORE_KEY_PREFIX = 'score:';

/**
 * Adds a new score for a specific game.
 * Scores for each game are stored in a single Redis key as a JSON stringified array.
 * @param {object} score - The score object to add.
 * @returns {Promise<object>} The added score object.
 */
async function addScore(score) {
    const scoreKey = `${SCORE_KEY_PREFIX}${score.gameId}`;
    const scoresJson = await client.get(scoreKey);
    const scores = scoresJson ? JSON.parse(scoresJson) : [];
    scores.push(score);
    await client.set(scoreKey, JSON.stringify(scores));
    return score;
}

/**
 * Retrieves all scores for a specific game.
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of score objects.
 */
async function getScores(gameId) {
    const scoresJson = await client.get(`${SCORE_KEY_PREFIX}${gameId}`);
    return scoresJson ? JSON.parse(scoresJson) : [];
}

/**
 * Retrieves all scores for all games.
 * Used for persisting data to the JSON file.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of all score objects.
 */
async function getAllScores() {
    const scoreKeys = await client.keys(`${SCORE_KEY_PREFIX}*`);
    let allScores = [];
    for (const key of scoreKeys) {
        const scoresJson = await client.get(key);
        if (scoresJson) {
            allScores = allScores.concat(JSON.parse(scoresJson));
        }
    }
    return allScores;
}

async function saveScoresForGame(gameId, scores) {
    const scoreKey = `${SCORE_KEY_PREFIX}${gameId}`;
    await client.set(scoreKey, JSON.stringify(scores));
}

module.exports = {
    addScore,
    getScores,
    getAllScores,
    saveScoresForGame,
    SCORE_KEY_PREFIX,
};