const allAchievementsArray = require('./achievements');
console.log('achievementManager.js: Loaded achievements index.');
const { getAllEffects } = require('./effectManager');
console.log('achievementManager.js: Loaded effectManager.');
const { getAllCardEffects } = require('./cardEffectManager');
console.log('achievementManager.js: Loaded cardEffectManager.');
const { getAllProfileDecorations } = require('./profileDecorationManager');
console.log('achievementManager.js: Loaded profileDecorationManager.');
const { getAllCardDecorations } = require('./cardDecorationManager');
console.log('achievementManager.js: Loaded cardDecorationManager.');

const achievements = allAchievementsArray.reduce((obj, item) => {
    if (item && item.id) {
        obj[item.id] = item;
    }
    return obj;
}, {});
console.log('achievementManager.js: Created achievements object.');

const evaluateAchievements = (currentUser, gameData, scoreData) => {
    if (!currentUser) return { unlockedAchievements: [], newlyUnlockedEffects: [], newlyUnlockedTitles: [] };

    const updatedUser = { ...currentUser };
    updatedUser.achievements = updatedUser.achievements || [];
    updatedUser.unlockedEffects = updatedUser.unlockedEffects || [];
    updatedUser.unlockedTitles = updatedUser.unlockedTitles || [];
    const unlockedAchievements = [];
    const newlyUnlockedEffects = [];
    const newlyUnlockedTitles = [];

    for (const achievementId in achievements) {
        const achievement = achievements[achievementId];
        let evaluationResult = achievement.evaluate(updatedUser, gameData, scoreData);

        const userAchievementIndex = updatedUser.achievements.findIndex(ua => ua.id === achievement.id);
        let userAchievement = userAchievementIndex !== -1 ? { ...updatedUser.achievements[userAchievementIndex] } : null;

        if (evaluationResult.isUnlocked) {
            const isNewlyUnlocked = !userAchievement;
            const hasNewTier = evaluationResult.newTierUnlocked && userAchievement?.tier?.name !== evaluationResult.tier?.name;

            if (isNewlyUnlocked || hasNewTier) {
                if (isNewlyUnlocked) {
                    userAchievement = {
                        id: achievement.id,
                        progress: evaluationResult.progress,
                        tier: evaluationResult.tier || null,
                        unlockedAt: new Date().toISOString(),
                    };
                    updatedUser.achievements.push(userAchievement);
                    unlockedAchievements.push({ ...achievement, ...userAchievement, isNew: true });
                } else { // hasNewTier
                    userAchievement.progress = evaluationResult.progress;
                    userAchievement.tier = evaluationResult.tier;
                    userAchievement.unlockedAt = new Date().toISOString();
                    updatedUser.achievements[userAchievementIndex] = userAchievement;
                    unlockedAchievements.push({ ...achievement, ...userAchievement, isNewTier: true });
                }

                // Check for rewards
                if (achievement.rewards && Array.isArray(achievement.rewards)) {
                    achievement.rewards.forEach(reward => {
                        if (reward.type === 'profileEffect') {
                            const effectDef = getAllEffects().find(e => e.id === reward.effectId);
                            if (effectDef && effectDef.isUnlockable !== false && !updatedUser.unlockedEffects.includes(reward.effectId)) {
                                updatedUser.unlockedEffects.push(reward.effectId);
                                newlyUnlockedEffects.push(reward.effectId);
                            }
                        }
                        if (reward.type === 'cardEffect') {
                            const effectDef = getAllCardEffects().find(e => e.id === reward.effectId);
                            if (effectDef && effectDef.isUnlockable !== false && !updatedUser.unlockedCardEffects.includes(reward.effectId)) {
                                updatedUser.unlockedCardEffects.push(reward.effectId);
                                // newlyUnlockedCardEffects.push(reward.effectId); // This is not returned currently
                            }
                        }
                        if (reward.type === 'profileDecoration') {
                            const decoDef = getAllProfileDecorations().find(d => d.id === reward.decorationId);
                            if (decoDef && decoDef.isUnlockable !== false && !updatedUser.unlockedProfileDecorations.includes(reward.decorationId)) {
                                updatedUser.unlockedProfileDecorations.push(reward.decorationId);
                                // newlyUnlockedProfileDecorations.push(reward.decorationId); // This is not returned currently
                            }
                        }
                        if (reward.type === 'cardDecoration') {
                            const decoDef = getAllCardDecorations().find(d => d.id === reward.decorationId);
                            if (decoDef && decoDef.isUnlockable !== false && !updatedUser.unlockedCardDecorations.includes(reward.decorationId)) {
                                updatedUser.unlockedCardDecorations.push(reward.decorationId);
                                // newlyUnlockedCardDecorations.push(reward.decorationId); // This is not returned currently
                            }
                        }
                        if (reward.type === 'title') {
                            const titleId = reward.titleId;
                            if (titleId && !updatedUser.unlockedTitles.includes(titleId)) {
                                updatedUser.unlockedTitles.push(titleId);
                                newlyUnlockedTitles.push(titleId);
                            }
                        }
                    });
                }
            } else if (userAchievement && userAchievement.progress !== evaluationResult.progress) {
                // Handle progress updates for already unlocked achievements without a tier change
                userAchievement.progress = evaluationResult.progress;
                updatedUser.achievements[userAchievementIndex] = userAchievement;
            }
        }
    }
    return { updatedUser, unlockedAchievements, newlyUnlockedEffects, newlyUnlockedTitles };
};

const getAllAchievementDefinitions = () => {
    console.log('getAllAchievementDefinitions called.');
    try {
        const result = Object.values(achievements).map(({ evaluate, ...rest }) => rest);
        console.log(`getAllAchievementDefinitions returning ${result.length} definitions.`);
        return result;
    } catch (e) {
        console.error('Error in getAllAchievementDefinitions:', e);
        return [];
    }
};

module.exports = { evaluateAchievements, getAllAchievementDefinitions };