const { getGames } = require('./gameManager');

module.exports = (app) => {
    app.get('/api/games', (req, res) => {
        try {
            let games = getGames();
            // If the request is not from canary, filter for released games only
            if (!req.isCanary) {
                games = games.filter(g => g.isReleased);
            }
            res.json({ success: true, games });
        } catch (error) {
            console.error('Error fetching games:', error);
            res.status(500).json({ success: false, message: '게임 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });
};