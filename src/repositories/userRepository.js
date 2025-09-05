/**
 * @file User-related data access and manipulation functions.
 */
const { client } = require('../redisClient');
const { getConnectionStatus } = require('./socketRepository');

// Redis Key Prefixes for user data organization.
const USER_KEY_PREFIX = 'user:';
const FRIENDS_KEY_PREFIX = 'friends:';
const USER_EMAIL_TO_ID_KEY = 'user:email:id';
const USER_NAME_TO_ID_KEY = 'user:name:id';

/**
 * Converts a user object into a format suitable for storing in a Redis hash.
 * Complex fields like arrays and objects are stringified.
 * @param {object} user - The user object.
 * @returns {object} A flat object for Redis HSET.
 */
const userToRedisHash = (user) => {
    const userCopy = { ...user };
    delete userCopy.friends; // Friends are managed in a separate Redis Set.
    const hash = {};
    for (const key in userCopy) {
        const value = userCopy[key];
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            hash[key] = JSON.stringify(value);
        } else if (value !== null && value !== undefined) {
            hash[key] = String(value);
        } else {
            hash[key] = '';
        }
    }
    return hash;
};

/**
 * Converts a Redis hash back into a user object.
 * Stringified fields are parsed back into their original types.
 * @param {object} hash - The Redis hash object.
 * @returns {object} The reconstructed user object.
 */
const redisHashToUser = async (hash) => {
    const user = {};
    for (const key in hash) {
        const value = hash[key];
        if (['achievements', 'unlockedTitles', 'unlockedEffects', 'unlockedCardEffects', 'unlockedProfileDecorations', 'unlockedCardDecorations', 'friendRequests', 'pendingRequests', 'displayedAchievements'].includes(key)) {
            try {
                user[key] = JSON.parse(value);
            } catch (e) {
                user[key] = [];
                console.warn(`Failed to parse JSON for field ${key}:`, value, e);
            }
        } else if (key === 'isMaster') {
            user[key] = (value === 'true');
        } else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
                user[key] = JSON.parse(value);
            } catch (e) {
                user[key] = value;
            }
        } else if (key === 'money') {
            user[key] = Number(value); // money 필드는 숫자로 변환
        } else {
            user[key] = value;
        }
    }
    // Ensure essential array fields are initialized to prevent errors.
    user.achievements = user.achievements || [];
    user.unlockedTitles = user.unlockedTitles || [];
    user.unlockedEffects = user.unlockedEffects || [];
    user.unlockedCardEffects = user.unlockedCardEffects || [];
    user.unlockedProfileDecorations = user.unlockedProfileDecorations || [];
    user.unlockedCardDecorations = user.unlockedCardDecorations || [];
    user.unlockedThemes = user.unlockedThemes || [];
    user.friendRequests = user.friendRequests || [];
    user.pendingRequests = user.pendingRequests || [];
    user.displayedAchievements = user.displayedAchievements || [];
    return user;
};

/**
 * Retrieves a user's friends list, populating their online and connection status.
 * @param {string} userId - The ID of the user whose friends to retrieve.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of friend objects.
 */
const getFriendsWithStatus = async (userId) => {
    const friendIds = await client.sMembers(`${FRIENDS_KEY_PREFIX}${userId}`);
    if (!friendIds || friendIds.length === 0) return [];

    const friendsWithStatus = [];
    for (const friendId of friendIds) {
        const friendUserHash = await client.hGetAll(`${USER_KEY_PREFIX}${friendId}`);
        if (Object.keys(friendUserHash).length > 0) {
            friendsWithStatus.push({
                id: friendId,
                name: friendUserHash.name,
                avatar: friendUserHash.avatar,
                onlineStatus: friendUserHash.onlineStatus,
                connectionStatus: await getConnectionStatus(friendId),
                birthday: friendUserHash.birthday,
                cardEffect: friendUserHash.cardEffect,
                cardDecoration: friendUserHash.cardDecoration,
            });
        }
    }
    return friendsWithStatus;
};

/**
 * Retrieves a single user by their ID, email, or name.
 * @param {string} identifier - The user's ID, email, or name.
 * @returns {Promise<object|null>} A promise that resolves to the user object or null if not found.
 */
async function getUser(identifier) {
    if (!identifier) return null;
    let userId = identifier;

    // If the identifier is not a UUID, it could be an email or name.
    if (!identifier.includes('-')) {
        const emailId = await client.get(`${USER_EMAIL_TO_ID_KEY}:${identifier.toLowerCase()}`);
        if (emailId) {
            userId = emailId;
        } else {
            const nameId = await client.get(`${USER_NAME_TO_ID_KEY}:${identifier}`);
            if (nameId) {
                userId = nameId;
            } else {
                return null;
            }
        }
    }
    if (!userId) return null;

    const userHash = await client.hGetAll(`${USER_KEY_PREFIX}${userId}`);
    if (Object.keys(userHash).length === 0) {
        return null;
    }

    const user = await redisHashToUser(userHash);
    user.friends = await getFriendsWithStatus(userId); // Populate friends list with status.

    return user;
}

/**
 * Retrieves all users from the database.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of all user objects.
 */
async function getAllUsers() {
    const userKeys = await client.keys(`${USER_KEY_PREFIX}*`);
    // Filter out keys that are not direct user hashes (e.g., email/name mappings).
    const actualUserKeys = userKeys.filter(key => key.split(':').length === 2);

    const users = [];
    for (const key of actualUserKeys) {
        const userHash = await client.hGetAll(key);
        if (Object.keys(userHash).length > 0) {
            const user = await redisHashToUser(userHash);
            user.friends = await getFriendsWithStatus(user.id);
            users.push(user);
        }
    }
    return users;
}

/**
 * Saves a user object to Redis.
 * This includes the main user hash and the email/name to ID mappings.
 * @param {object} user - The user object to save.
 * @returns {Promise<object>} A promise that resolves to the saved user object.
 */
async function saveUser(user) {
    const userKey = `${USER_KEY_PREFIX}${user.id}`;
    // If the username is being changed, remove the old name-to-ID mapping.
    const oldUserHash = await client.hGetAll(userKey);
    if (oldUserHash && oldUserHash.name && oldUserHash.name !== user.name) {
        await client.del(`${USER_NAME_TO_ID_KEY}:${oldUserHash.name}`);
    }

    const userHashData = userToRedisHash(user);
    
    if (!userHashData.onlineStatus) {
        userHashData.onlineStatus = 'online';
    }
    await client.hSet(userKey, userHashData);
    await client.set(`${USER_EMAIL_TO_ID_KEY}:${(user.email ?? '').toLowerCase()}`, user.id);
    await client.set(`${USER_NAME_TO_ID_KEY}:${user.name ?? ''}`, user.id);
    return user;
}

/**
 * Deletes a user and all their associated data from Redis.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the user was deleted, false otherwise.
 */
async function deleteUser(userId) {
    const user = await getUser(userId);
    if (!user) return false;

    // Remove the user from all friends' lists.
    const friendIds = await client.sMembers(`${FRIENDS_KEY_PREFIX}${userId}`);
    for (const friendId of friendIds) {
        await client.sRem(`${FRIENDS_KEY_PREFIX}${friendId}`, userId);
    }
    await client.del(`${FRIENDS_KEY_PREFIX}${userId}`);

    // Delete the main user data and mappings.
    await client.del(`${USER_KEY_PREFIX}${userId}`);
    await client.del(`${USER_EMAIL_TO_ID_KEY}:${user.email.toLowerCase()}`);
    await client.del(`${USER_NAME_TO_ID_KEY}:${user.name}`);
    
    return true;
}

/**
 * Creates a bidirectional friendship between two users.
 * @param {string} userId - The ID of the first user.
 * @param {string} friendId - The ID of the second user.
 */
async function addFriend(userId, friendId) {
    await client.sAdd(`${FRIENDS_KEY_PREFIX}${userId}`, friendId);
    await client.sAdd(`${FRIENDS_KEY_PREFIX}${friendId}`, userId);
}

/**
 * Removes a friendship between two users.
 * @param {string} userId - The ID of the first user.
 * @param {string} friendId - The ID of the second user.
 */
async function removeFriend(userId, friendId) {
    await client.sRem(`${FRIENDS_KEY_PREFIX}${userId}`, friendId);
    await client.sRem(`${FRIENDS_KEY_PREFIX}${friendId}`, userId);
}

/**
 * Sets the connection status for a user.
 * @param {string} userId - The user's ID.
 * @param {string} connectionStatus - The new connection status (e.g., 'connected', 'disconnected').
 */
async function setConnectionStatus(userId, connectionStatus) {
    await client.hSet(`${USER_KEY_PREFIX}${userId}`, 'connectionStatus', connectionStatus);
}

/**
 * Sets the preferred online status for a user.
 * @param {string} userId - The user's ID.
 * @param {string} onlineStatus - The new online status (e.g., 'online', 'away').
 */
async function setOnlineStatus(userId, onlineStatus) {
    await client.hSet(`${USER_KEY_PREFIX}${userId}`, 'onlineStatus', onlineStatus);
}

module.exports = {
    getUser,
    getAllUsers,
    saveUser,
    deleteUser,
    addFriend,
    removeFriend,
    getFriendsWithStatus,
    setConnectionStatus,
    setOnlineStatus,
    userToRedisHash,
    redisHashToUser,
    FRIENDS_KEY_PREFIX,
};