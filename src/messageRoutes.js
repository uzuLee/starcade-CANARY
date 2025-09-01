const { getRandomMessage } = require('./messageManager');

module.exports = (app) => {
    app.get('/api/messages', (req, res) => {
        try {
            const { topic } = req.query;
            const message = getRandomMessage(topic);
            res.json({ success: true, message });
        } catch (error) {
            console.error('Error fetching message:', error);
            res.status(500).json({ success: false, message: '메시지를 불러오는 중 오류가 발생했습니다.' });
        }
    });
};