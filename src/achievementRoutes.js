const { getAllAchievementDefinitions } = require('./achievementManager');

module.exports = (app) => {
    app.get('/api/achievements', (req, res) => {
        console.log('GET /api/achievements route hit');
        try {
            const definitions = getAllAchievementDefinitions();
            console.log('Successfully got achievement definitions.');
            res.json({ success: true, achievements: definitions });
        } catch (error) {
            console.error('Error fetching achievement definitions:', error);
            res.status(500).json({ success: false, message: '도전과제 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });
};