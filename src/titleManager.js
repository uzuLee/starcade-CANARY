const allAchievements = require('./achievements');

const uniqueTitles = new Set();

allAchievements.forEach(achievementModule => {
    if (achievementModule && achievementModule.rewards && Array.isArray(achievementModule.rewards)) {
        achievementModule.rewards.forEach(reward => {
            if (reward.type === 'title' && reward.titleId) {
                uniqueTitles.add(reward.titleId);
            }
        });
    }
});

const allTitles = Array.from(uniqueTitles);

const getAllTitles = () => {
    return allTitles;
};

module.exports = { getAllTitles };
