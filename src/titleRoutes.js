const { getAllTitles } = require('./titleManager');

module.exports = (app) => {
    app.get('/api/titles', (req, res) => {
        try {
            const titles = getAllTitles();
            res.json({ success: true, titles });
        } catch (error) {
            console.error('Error fetching titles:', error);
            res.status(500).json({ success: false, message: '칭호 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });
};