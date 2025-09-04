const createAuthMiddleware = require('./middleware/auth.js');
const { v4: uuidv4 } = require('uuid');

const { evaluateAchievements, getAllAchievementDefinitions } = require('./achievementManager');
const { getGames } = require('./gameManager');

module.exports = (app, { userRepository, scoreRepository, redisManager }, jwtSecret) => {
    const authMiddleware = createAuthMiddleware(jwtSecret);
    app.get('/api/achievements', (req, res) => {
        try {
            const definitions = getAllAchievementDefinitions();
            res.json({ success: true, achievements: definitions });
        } catch (error) {
            console.error('Error fetching achievement definitions:', error);
            res.status(500).json({ success: false, message: '도전과제 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });

    app.post('/api/scores', async (req, res) => {
        const { gameId, score, userId, options, timestamp } = req.body;

        const newScore = {
            id: uuidv4(),
            gameId,
            score,
            userId,
            options: options || {},
            timestamp: timestamp || new Date().toISOString(),
        };

        await scoreRepository.addScore(newScore);
        await redisManager.persistScore(gameId, newScore.id);

        let unlockedAchievements = [];
        let newlyUnlockedEffects = [];
        let newlyUnlockedTitles = [];
        let currencyGained = 0;
        let finalUser = null;

        if (userId !== 'anonymous') {
            const currentUser = await userRepository.getUser(userId);
            if (currentUser) {
                const achievementResult = evaluateAchievements(currentUser, { gameId, ...options }, { score, ...options });
                const userToSave = achievementResult.updatedUser;

                // Grant currency based on score
                currencyGained = Math.floor(score / 100);
                if (currencyGained > 0) {
                    userToSave.money = (userToSave.money || 0) + currencyGained;
                }

                if (JSON.stringify(currentUser) !== JSON.stringify(userToSave)) {
                    await userRepository.saveUser(userToSave);
                    await redisManager.persistUser(userToSave.id);
                }
                
                finalUser = userToSave;
                unlockedAchievements = achievementResult.unlockedAchievements;
                newlyUnlockedEffects = achievementResult.newlyUnlockedEffects;
                newlyUnlockedTitles = achievementResult.newlyUnlockedTitles;
            }
        }

        res.json({ success: true, score: newScore, unlockedAchievements, newlyUnlockedEffects, newlyUnlockedTitles, currencyGained, user: finalUser });
    });

    app.get('/api/scores/:gameId', async (req, res) => {
        const { gameId } = req.params;
        try {
            let scores = await scoreRepository.getScores(gameId);
            // Sort by score descending
            scores.sort((a, b) => b.score - a.score);

            // Populate user details for each score entry
            const scoresWithUserDetails = [];
            for (const scoreEntry of scores) {
                const userDetails = await userRepository.getUser(scoreEntry.userId);
                if (userDetails) {
                    scoresWithUserDetails.push({
                        ...scoreEntry,
                        userName: userDetails.name,
                        userAvatar: userDetails.avatar,
                        userBirthday: userDetails.birthday,
                        cardEffect: userDetails.cardEffect,
                        cardDecoration: userDetails.cardDecoration,
                    });
                } else {
                    const isAnonymous = scoreEntry.userId === 'anonymous';
                    scoresWithUserDetails.push({
                        ...scoreEntry,
                        userName: isAnonymous ? '익명' : '삭제된 계정',
                        userAvatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${isAnonymous ? 'anonymous' : 'deleted'}`,
                        userBirthday: null,
                    });
                }
            }

            res.json({ success: true, scores: scoresWithUserDetails });
        } catch (error) {
            console.error('Error fetching scores:', error);
            res.status(500).json({ success: false, message: '점수를 불러오는 중 오류가 발생했습니다.' });
        }
    });

    app.delete('/api/scores/:scoreId', authMiddleware, async (req, res) => {
        if (!req.user || !req.user.isMaster) {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }
        const { scoreId } = req.params;
        const allGames = getGames();
        let scoreDeleted = false;
        for (const game of allGames) {
            const scores = await scoreRepository.getScores(game.id);
            const scoreIndex = scores.findIndex(s => s.id === scoreId);
            if (scoreIndex > -1) {
                scores.splice(scoreIndex, 1);
                await scoreRepository.saveScoresForGame(game.id, scores);
                await redisManager.persistGameScores(game.id);
                scoreDeleted = true;
                break;
            }
        }
        if (scoreDeleted) {
            res.json({ success: true, message: '랭킹이 삭제되었습니다.' });
        } else {
            res.status(404).json({ success: false, message: '해당 랭킹을 찾을 수 없습니다.' });
        }
    });
};