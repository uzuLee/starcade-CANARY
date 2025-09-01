const { readDb, writeDb } = require('./db');
const createAuthMiddleware = require('./middleware/auth.js');
const { getAllEffects } = require('./effectManager.js');
const { getAllTitles } = require('./titleManager.js');
const { getAllAchievementDefinitions } = require('./achievementManager.js');
const { getAllCardEffects } = require('./cardEffectManager.js');
const { getAllProfileDecorations } = require('./profileDecorationManager.js');
const { getAllCardDecorations } = require('./cardDecorationManager.js');
const { client } = require('./redisClient');
const scoreRepository = require('./repositories/scoreRepository');

module.exports = (app, io, { userRepository, socketRepository, redisManager }, jwtSecret) => {
    const authMiddleware = createAuthMiddleware(jwtSecret);
    const optionalAuthMiddleware = createAuthMiddleware(jwtSecret, true);

    const { getPriorityCosmetics } = require('./priorityManager.js');

        app.get('/api/users', authMiddleware, async (req, res) => {
        const requestingUser = req.user;
        if (!requestingUser || !requestingUser.isMaster) {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }
        const allUsers = await userRepository.getAllUsers();
        console.log('All users:', allUsers);
        res.json({ success: true, users: allUsers });
    });

    app.get('/api/users/:id', optionalAuthMiddleware, async (req, res) => {
        const id = decodeURIComponent(req.params.id);
        const requestingUser = req.user;
        
        const targetUser = await userRepository.getUser(id);

        if (!targetUser) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        let displayUser = { ...targetUser };
        const priorityCosmetics = getPriorityCosmetics(targetUser);
        if (priorityCosmetics.profileDecoration) displayUser.profileDecoration = priorityCosmetics.profileDecoration;
        if (priorityCosmetics.cardDecoration) displayUser.cardDecoration = priorityCosmetics.cardDecoration;
        if (priorityCosmetics.cardEffect) displayUser.cardEffect = priorityCosmetics.cardEffect;
        if (priorityCosmetics.title) displayUser.title = priorityCosmetics.title;

        if (displayUser.isMaster) {
            const allAchievements = getAllAchievementDefinitions().map(def => ({
                id: def.id,
                name: def.name,
                description: def.description,
                icon: def.icon,
                progress: 1,
                tier: def.tiers ? def.tiers[def.tiers.length - 1] : null,
                unlockedAt: new Date().toISOString(),
            }));

            displayUser = { 
                ...displayUser, 
                achievements: allAchievements,
                unlockedEffects: getAllEffects().map(e => e.id),
                unlockedTitles: getAllTitles(),
                unlockedCardEffects: getAllCardEffects().map(e => e.id),
                unlockedProfileDecorations: getAllProfileDecorations().map(d => d.id),
                unlockedCardDecorations: getAllCardDecorations().map(d => d.id),
            };
        }

        if (requestingUser && requestingUser.isMaster) {
            const masterView = { 
                ...displayUser, 
                settings: {
                    title: targetUser.title,
                    profileEffect: targetUser.profileEffect,
                    profileDecoration: targetUser.profileDecoration,
                    cardEffect: targetUser.cardEffect,
                    cardDecoration: targetUser.cardDecoration,
                }
            };
            return res.status(200).json({ success: true, user: masterView });
        }

        if (requestingUser && requestingUser.id === targetUser.id) {
            return res.status(200).json({ success: true, user: displayUser });
        }

        const limitedUser = {
            id: displayUser.id,
            name: displayUser.name,
            avatar: displayUser.avatar,
            onlineStatus: await socketRepository.getDisplayStatus(displayUser.id, displayUser.onlineStatus),
            connectionStatus: await socketRepository.getConnectionStatus(displayUser.id),
            profileVisibility: displayUser.profileVisibility,
            description: displayUser.description,
            achievements: displayUser.achievements,
            displayedAchievements: displayUser.displayedAchievements,
            profileEffect: displayUser.profileEffect,
            unlockedEffects: displayUser.unlockedEffects,
            birthday: displayUser.birthday,
            title: displayUser.title,
            profileDecoration: displayUser.profileDecoration,
        };

        switch (targetUser.profileVisibility) {
            case 'public':
                return res.status(200).json({ success: true, user: limitedUser });

            case 'friends-only':
                const isFriend = requestingUser && targetUser.friends.some(f => f.id === requestingUser.id);
                if (isFriend) {
                    return res.status(200).json({ success: true, user: limitedUser });
                } else {
                    return res.status(200).json({
                        success: true,
                        user: { id: targetUser.id, name: targetUser.name, avatar: targetUser.avatar, onlineStatus: await socketRepository.getDisplayStatus(targetUser.id, targetUser.onlineStatus), profileVisibility: targetUser.profileVisibility, }
                    });
                }

            case 'private':
            default:
                return res.status(200).json({
                    success: true,
                    user: { id: targetUser.id, name: targetUser.name, avatar: targetUser.avatar, onlineStatus: await socketRepository.getDisplayStatus(targetUser.id, targetUser.onlineStatus), profileVisibility: targetUser.profileVisibility, }
                });
        }
    });

    app.post('/api/users/:id', authMiddleware, async (req, res) => {
        const { id } = req.params;
        const updatedData = req.body;
        const requestingUser = req.user;

        if (!requestingUser.isMaster && requestingUser.id !== id) {
            return res.status(403).json({ success: false, message: '권한이 없습니다. 자신의 프로필만 수정할 수 있습니다.' });
        }

        let userToUpdate = await userRepository.getUser(id);
        if (!userToUpdate) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        if (updatedData.name && updatedData.name !== userToUpdate.name) {
            const existingUser = await userRepository.getUser(updatedData.name);
            if (existingUser && existingUser.id !== id) {
                return res.status(400).json({ success: false, message: '이미 사용 중인 닉네임입니다.' });
            }
        }

        if (updatedData.title !== undefined) {
            if (!Array.isArray(userToUpdate.unlockedTitles)) {
                userToUpdate.unlockedTitles = [];
            }
            if (updatedData.title !== '' && !userToUpdate.unlockedTitles.includes(updatedData.title) && !requestingUser.isMaster) {
                return res.status(403).json({ success: false, message: '보유하지 않은 칭호입니다.' });
            }
        }

        if (updatedData.birthday !== undefined) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (updatedData.birthday !== '' && !dateRegex.test(updatedData.birthday)) {
                return res.status(400).json({ success: false, message: '잘못된 생일 형식입니다. (YYYY-MM-DD)' });
            }
            if (updatedData.birthday) {
                const [year, month, day] = updatedData.birthday.split('-').map(Number);
                if (year < 1900) {
                    return res.status(400).json({ success: false, message: '유효하지 않은 연도입니다.' });
                }
                const date = new Date(year, month - 1, day);
                if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
                    return res.status(400).json({ success: false, message: '유효하지 않은 날짜입니다.' });
                }
                if (date > new Date()) {
                    return res.status(400).json({ success: false, message: '생일은 미래 날짜일 수 없습니다.' });
                }
            }
        }

        if (updatedData.settings) {
            userToUpdate.settings = { ...userToUpdate.settings, ...updatedData.settings };
            delete updatedData.settings; // Remove settings from updatedData to avoid overwriting the whole object
        }

        userToUpdate = { ...userToUpdate, ...updatedData };
        await userRepository.saveUser(userToUpdate);
        await redisManager.persistUser(userToUpdate.id);
        
        // Re-fetch the user to get the latest full data
        const finalUser = await userRepository.getUser(id);

        res.json({ success: true, user: finalUser });
    });

    app.get('/api/users/:id/friends', authMiddleware, async (req, res) => {
        const requestingUser = req.user;
        const userId = decodeURIComponent(req.params.id);

        if (requestingUser.isMaster && requestingUser.id === userId) {
            const allUsers = await userRepository.getAllUsers();
            const friendsFormatted = [];
            for (const u of allUsers) {
                if (u.id === requestingUser.id) continue;
                friendsFormatted.push({
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar,
                    onlineStatus: u.onlineStatus,
                    connectionStatus: u.connectionStatus,
                });
            }
            return res.status(200).json({ success: true, friends: friendsFormatted });
        }

        const friends = await userRepository.getFriendsWithStatus(userId);
        res.json({ success: true, friends });
    });

    app.delete('/api/users/:id', authMiddleware, async (req, res) => {
        const { id } = req.params;
        const { rankingAction = 'rename' } = req.body;
        const requestingUser = req.user;

        if (!requestingUser.isMaster) {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }

        if (rankingAction === 'delete') {
            const scoreKeys = await client.keys(`${scoreRepository.SCORE_KEY_PREFIX}*`);
            for (const key of scoreKeys) {
                const gameId = key.substring(scoreRepository.SCORE_KEY_PREFIX.length);
                const scores = await scoreRepository.getScores(gameId);
                const initialLength = scores.length;
                const newScores = scores.filter(s => s.userId !== id);
                if (newScores.length < initialLength) {
                    await scoreRepository.saveScoresForGame(gameId, newScores);
                    await redisManager.persistGameScores(gameId);
                }
            }
        }

        const deleted = await userRepository.deleteUser(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        await redisManager.removeUserFromDb(id);

        res.json({ success: true, message: '사용자가 성공적으로 삭제되었습니다.' });
    });

    // ... (rest of the file remains the same)
};