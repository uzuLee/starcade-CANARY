const createAuthMiddleware = require('./middleware/auth.js');
const { getAllCardEffects } = require('./cardEffectManager');
const { getAllProfileDecorations } = require('./profileDecorationManager');
const { getAllCardDecorations } = require('./cardDecorationManager');
const { getAllEffects } = require('./effectManager');
const { getAllBundles } = require('./bundleManager');
const { getAllThemes } = require('./themeManager');
const userRepository = require('./repositories/userRepository');

module.exports = (app, redisManager, jwtSecret) => {
    const optionalAuthMiddleware = createAuthMiddleware(jwtSecret, true);

    const itemManagers = {
        profileEffect: getAllEffects,
        profileDecoration: getAllProfileDecorations,
        cardEffect: getAllCardEffects,
        cardDecoration: getAllCardDecorations,
        bundle: getAllBundles,
        theme: getAllThemes,
    };

    const createRoute = (path, manager) => {
        app.get(path, optionalAuthMiddleware, (req, res) => {
            try {
                let definitions = manager();
                if (!req.isCanary) {
                    definitions = definitions.filter(d => d.isReleased);
                }
                if (!req.user || !req.user.isMaster) {
                    definitions = definitions.filter(d => d.isUnlockable !== false);
                }
                const key = path.split('/').pop().replace(/-(\w)/g, (match, letter) => letter.toUpperCase());
                res.json({ success: true, [key]: definitions });
            } catch (error) {
                console.error(`Error fetching ${path}:`, error);
                res.status(500).json({ success: false, message: '데이터를 불러오는 중 오류가 발생했습니다.' });
            }
        });
    };

    createRoute('/api/card-effects', getAllCardEffects);
    createRoute('/api/profile-decorations', getAllProfileDecorations);
    createRoute('/api/card-decorations', getAllCardDecorations);
    createRoute('/api/profile-effects', getAllEffects);
    createRoute('/api/bundles', getAllBundles);
    createRoute('/api/themes', getAllThemes);

    const authMiddleware = createAuthMiddleware(jwtSecret, false); // Not optional for buying

    app.post('/api/shop/buy', authMiddleware, async (req, res) => {
        const { itemId, itemType } = req.body;
        const userId = req.user.id;

        if (!itemId || !itemType) {
            return res.status(400).json({ success: false, message: '아이템 정보가 누락되었습니다.' });
        }

        const getManager = itemManagers[itemType];
        if (!getManager) {
            return res.status(400).json({ success: false, message: '알 수 없는 아이템 타입입니다.' });
        }

        try {
            const user = await userRepository.getUser(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }

            const item = getManager().find(i => i.id === itemId);
            if (!item || !item.isForSale) {
                return res.status(404).json({ success: false, message: '판매 중인 아이템이 아닙니다.' });
            }

            if (user.money < item.price) {
                return res.status(403).json({ success: false, message: '코인이 부족합니다.' });
            }

            // TODO: Add more robust ownership checks
            user.money -= item.price;
            await userRepository.addTransaction(userId, {
                description: `${item.name} 구매`,
                amount: -item.price,
                type: 'spend'
            });

            if (itemType === 'bundle') {
                for (const subItem of item.items) {
                    const unlockedListKey = `unlocked${subItem.type.charAt(0).toUpperCase() + subItem.type.slice(1)}s`;
                    if (!user[unlockedListKey]) {
                        user[unlockedListKey] = [];
                    }
                    if (!user[unlockedListKey].includes(subItem.id)) {
                        user[unlockedListKey].push(subItem.id);
                    }
                }
            } else if (itemType === 'theme') {
                if (!user.unlockedThemes) {
                    user.unlockedThemes = [];
                }
                if (!user.unlockedThemes.includes(item.id)) {
                    user.unlockedThemes.push(item.id);
                }
            } else { // It's a regular cosmetic
                const unlockedListKey = `unlocked${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s`;
                if (!user[unlockedListKey]) {
                    user[unlockedListKey] = [];
                }
                 if (!user[unlockedListKey].includes(item.id)) {
                    user[unlockedListKey].push(item.id);
                }
            }

            await userRepository.saveUser(user);

            res.json({ success: true, message: '구매에 성공했습니다!', user });

        } catch (error) {
            console.error(`Error purchasing item ${itemId} for user ${userId}:`, error);
            res.status(500).json({ success: false, message: '아이템 구매 중 오류가 발생했습니다.' });
        }
    });
};