const createAuthMiddleware = require('./middleware/auth.js');
const { getAllCardEffects } = require('./cardEffectManager');
const { getAllProfileDecorations } = require('./profileDecorationManager');
const { getAllCardDecorations } = require('./cardDecorationManager');
const { getAllEffects } = require('./effectManager');

module.exports = (app, redisManager, jwtSecret) => {
    const optionalAuthMiddleware = createAuthMiddleware(jwtSecret, true);

    app.get('/api/card-effects', optionalAuthMiddleware, (req, res) => {
        try {
            let definitions = getAllCardEffects();
            if (!req.user || !req.user.isMaster) {
                definitions = definitions.filter(d => d.isUnlockable !== false);
            }
            res.json({ success: true, cardEffects: definitions });
        } catch (error) {
            console.error('Error fetching card effect definitions:', error);
            res.status(500).json({ success: false, message: '카드 효과 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });

    app.get('/api/card-decorations', optionalAuthMiddleware, (req, res) => {
        try {
            let definitions = getAllCardDecorations();
            if (!req.user || !req.user.isMaster) {
                definitions = definitions.filter(d => d.isUnlockable !== false);
            }
            res.json({ success: true, cardDecorations: definitions });
        } catch (error) {
            console.error('Error fetching card decoration definitions:', error);
            res.status(500).json({ success: false, message: '카드 장식 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });

    app.get('/api/profile-decorations', optionalAuthMiddleware, (req, res) => {
        try {
            let definitions = getAllProfileDecorations();
            if (!req.user || !req.user.isMaster) {
                definitions = definitions.filter(d => d.isUnlockable !== false);
            }
            res.json({ success: true, profileDecorations: definitions });
        } catch (error) {
            console.error('Error fetching profile decoration definitions:', error);
            res.status(500).json({ success: false, message: '프로필 장식 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });

    app.get('/api/profile-effects', optionalAuthMiddleware, (req, res) => {
        try {
            let definitions = getAllEffects();
            if (!req.user || !req.user.isMaster) {
                definitions = definitions.filter(d => d.isUnlockable !== false);
            }
            res.json({ success: true, profileEffects: definitions });
        } catch (error) {
            console.error('Error fetching profile effect definitions:', error);
            res.status(500).json({ success: false, message: '프로필 효과 목록을 불러오는 중 오류가 발생했습니다.' });
        }
    });
};