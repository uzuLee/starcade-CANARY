/**
 * @file Manages data synchronization between Redis and the persistent db.json file.
 */
const { client } = require('./redisClient');
const { readDb, writeDb } = require('./db');
const userRepository = require('./repositories/userRepository');
const scoreRepository = require('./repositories/scoreRepository');

const redisManager = {
    /**
     * Loads all data from db.json into the Redis cache on server startup.
     * This overwrites any existing data in Redis.
     */
    async loadInitialDataFromDb() {
        const dbData = readDb();
        await client.flushDb();

        for (const user of dbData.users) {
            if (!user || typeof user.id === 'undefined' || typeof user.name === 'undefined') {
                console.warn('Skipping invalid user object from db.json:', user);
                continue;
            }
            await userRepository.saveUser(user);
        }

        // After all users are in hashes, create the friend sets
        for (const user of dbData.users) {
            if (user.friends && user.friends.length > 0) {
                const friendIds = user.friends.map(f => f.id);
                if (friendIds.length > 0) {
                    await client.sAdd(`${userRepository.FRIENDS_KEY_PREFIX}${user.id}`, friendIds);
                }
            }
        }

        for (const score of dbData.scores) {
            await scoreRepository.addScore(score);
        }
    },

    /**
     * Persists a single user's data from Redis to the db.json file.
     * @param {string} userId - The ID of the user to persist.
     */
    async persistUser(userId) {
        console.log(`Attempting to persist user ${userId} to db.json`);
        const user = await userRepository.getUser(userId);
        if (!user) {
            console.warn(`User ${userId} not found in Redis, cannot persist.`);
            return;
        }

        const dbData = readDb();
        const userIndex = dbData.users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            dbData.users[userIndex] = user;
        } else {
            dbData.users.push(user);
        }
        try {
            writeDb(dbData);
            console.log(`Successfully persisted user ${userId} to db.json`);
        } catch (error) {
            console.error(`Error writing user ${userId} to db.json:`, error);
        }
    },

    /**
     * Removes a user from the db.json file.
     * @param {string} userId - The ID of the user to remove.
     */
    async removeUserFromDb(userId) {
        const dbData = readDb();
        dbData.users = dbData.users.filter(u => u.id !== userId);
        writeDb(dbData);
    },

    /**
     * Persists a single score from Redis to the db.json file.
     * @param {string} gameId - The ID of the game the score belongs to.
     * @param {string} scoreId - The ID of the score to persist.
     */
    async persistScore(gameId, scoreId) {
        const scores = await scoreRepository.getScores(gameId);
        const score = scores.find(s => s.id === scoreId);
        if (!score) return;

        const dbData = readDb();
        const scoreIndex = dbData.scores.findIndex(s => s.id === scoreId);
        if (scoreIndex > -1) {
            dbData.scores[scoreIndex] = score;
        } else {
            dbData.scores.push(score);
        }
        writeDb(dbData);
    },

    async persistGameScores(gameId) {
        const scores = await scoreRepository.getScores(gameId);
        const dbData = readDb();
        // remove all scores for this game, then add them back
        dbData.scores = dbData.scores.filter(s => s.gameId !== gameId);
        dbData.scores.push(...scores);
        writeDb(dbData);
    }
};

module.exports = { redisManager };