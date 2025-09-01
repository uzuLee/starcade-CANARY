/**
 * @file Manages socket-to-user mappings and connection statuses in Redis.
 */
const { client } = require('../redisClient');

// Redis Key Prefixes for socket management.
const SOCKET_ID_TO_USER_ID_KEY = 'socket:id:user:id';
const USER_SOCKETS_SET_KEY_PREFIX = 'user:sockets:';

/**
 * Associates a socket ID with a user ID.
 * @param {string} userId - The user's ID.
 * @param {string} socketId - The client's socket ID.
 */
async function addSocketIdForUser(userId, socketId) {
    await client.set(`${SOCKET_ID_TO_USER_ID_KEY}:${socketId}`, userId);
    await client.sAdd(`${USER_SOCKETS_SET_KEY_PREFIX}${userId}`, socketId);
}

/**
 * Retrieves the user ID associated with a given socket ID.
 * @param {string} socketId - The client's socket ID.
 * @returns {Promise<string|null>} The user ID or null if not found.
 */
async function getUserIdFromSocketId(socketId) {
    return await client.get(`${SOCKET_ID_TO_USER_ID_KEY}:${socketId}`);
}

/**
 * Removes the association between a socket ID and a user ID.
 * @param {string} socketId - The client's socket ID.
 * @returns {Promise<string|null>} The user ID that was associated with the socket, or null.
 */
async function removeSocketId(socketId) {
    const userId = await getUserIdFromSocketId(socketId);
    if (userId) {
        await client.del(`${SOCKET_ID_TO_USER_ID_KEY}:${socketId}`);
        await client.sRem(`${USER_SOCKETS_SET_KEY_PREFIX}${userId}`, socketId);
    }
    return userId;
}

/**
 * Checks if a user has any active socket connections.
 * @param {string} userId - The user's ID.
 * @returns {Promise<'connected'|'disconnected'>} The user's connection status.
 */
async function getConnectionStatus(userId) {
    const socketCount = await client.sCard(`${USER_SOCKETS_SET_KEY_PREFIX}${userId}`);
    return socketCount > 0 ? 'connected' : 'disconnected';
}

/**
 * Determines the user's display status based on their connection and preference.
 * If disconnected, status is always 'offline'. Otherwise, it's their set preference.
 * @param {string} userId - The user's ID.
 * @param {string} userPreferenceStatus - The user's preferred online status (e.g., 'online', 'away').
 * @returns {Promise<string>} The calculated display status.
 */
async function getDisplayStatus(userId, userPreferenceStatus) {
    const connectionStatus = await getConnectionStatus(userId);
    if (connectionStatus === 'connected') {
        return userPreferenceStatus;
    }
    return 'offline';
}

module.exports = {
    addSocketIdForUser,
    getUserIdFromSocketId,
    removeSocketId,
    getConnectionStatus,
    getDisplayStatus,
};