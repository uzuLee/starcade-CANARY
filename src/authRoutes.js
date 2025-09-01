const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const { selectTemplate } = require('./emailTemplateSelector');
const { sendVerificationEmail } = require('./mailer');
const { evaluateAchievements, getAllAchievementDefinitions } = require('./achievementManager');
const { isTodayBirthday } = require('./priorityManager');
const { getAllEffects } = require('./effectManager.js');
const { getAllTitles } = require('./titleManager.js');
const { getAllCardEffects } = require('./cardEffectManager.js');
const { getAllProfileDecorations } = require('./profileDecorationManager.js');
const { getAllCardDecorations } = require('./cardDecorationManager.js');

// Function to generate a random nickname
const generateRandomNickname = () => {
    const adjectives = ["빛나는", "용감한", "신비로운", "재빠른", "현명한", "강력한", "고요한", "날카로운", "따뜻한", "차가운"];
    const nouns = ["별", "늑대", "바람", "강", "산", "나무", "불꽃", "그림자", "폭풍", "천둥"];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900); // 100-999
    return `${randomAdj}${randomNoun}${randomNumber}`;
};

// Helper function to load email templates
const loadEmailTemplate = async (templateName, replacements) => {
    let content = await fs.readFile(`${__dirname}/emails/${templateName}`, 'utf8');
    for (const key in replacements) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }
    return content;
};

const checkBirthdayAndGrantRewards = async (user) => {
    // Do not grant rewards if the user has disabled the effect, or if it's not their birthday.
    if (user.settings?.enableBirthdayEffect === false || !user.birthday || !isTodayBirthday(user.birthday)) {
        return { user, newlyUnlockedTitles: [], newlyUnlockedEffects: [] };
    }

    const happyBirthdayAchievement = user.achievements.find(a => a.id === 'happyBirthday');
    const currentYear = new Date().getFullYear();

    // Check if the achievement was already granted this year.
    if (happyBirthdayAchievement && happyBirthdayAchievement.progress === currentYear) {
        return { user, newlyUnlockedTitles: [], newlyUnlockedEffects: [] };
    }

    const result = evaluateAchievements(user, { gameId: 'system', event: 'birthdayLogin' }, { isBirthday: true, year: currentYear });
    return { user: result.updatedUser, newlyUnlockedTitles: result.newlyUnlockedTitles, newlyUnlockedEffects: result.newlyUnlockedEffects };
};

const { client } = require('./redisClient');

module.exports = (app, { userRepository, redisManager }, jwtSecret, config) => {

    const sendLoginCode = async (res, user) => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expirySeconds = 10 * 60;
        const verificationKey = `login_verification:${user.email}`;
        await client.set(verificationKey, JSON.stringify({ code }), { EX: expirySeconds });

        const mailSubject = '[Starcade] 로그인 인증 코드';
        const selectedTemplate = selectTemplate('registration_verification');
        const mailText = await loadEmailTemplate(selectedTemplate.text_template, { name: user.name, code });
        const mailHtml = await loadEmailTemplate(selectedTemplate.html_template, { name: user.name, code });

        try {
            await sendVerificationEmail(user.email, mailSubject, mailText, mailHtml);
            res.json({ success: true, message: '인증 코드가 이메일로 전송되었습니다.', email: user.email, name: user.name });
        } catch (error) {
            console.error('Error sending login code email:', error);
            await client.del(verificationKey);
            res.status(500).json({ success: false, message: '인증 코드 전송 중 오류가 발생했습니다.' });
        }
    };

    app.post('/api/request-registration-code', async (req, res) => {
        const { email, name: requestedName } = req.body;
        let name = requestedName;

        if (email) {
            const existingUser = await userRepository.getUser(email);
            if (existingUser) {
                return sendLoginCode(res, existingUser);
            }
        }

        if (!name) {
            let isUnique = false;
            while (!isUnique) {
                name = generateRandomNickname();
                if (!(await userRepository.getUser(name))) {
                    isUnique = true;
                }
            }
        }

        if (await userRepository.getUser(name)) {
            return res.status(400).json({ success: false, message: '이미 사용 중인 닉네임입니다.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expirySeconds = 10 * 60;
        const verificationKey = `registration_verification:${email}`;
        await client.set(verificationKey, JSON.stringify({ code, name }), { EX: expirySeconds });

        const mailSubject = '[Starcade] 회원가입 인증 코드';
        const selectedTemplate = selectTemplate('registration_verification');
        const mailText = await loadEmailTemplate(selectedTemplate.text_template, { name, code });
        const mailHtml = await loadEmailTemplate(selectedTemplate.html_template, { name, code });

        try {
            const emailResult = await sendVerificationEmail(email, mailSubject, mailText, mailHtml);
            if (emailResult.success) {
                res.json({ success: true, message: '인증 코드가 이메일로 전송되었습니다.', generatedName: name });
            } else {
                await client.del(verificationKey);
                res.status(500).json({ success: false, message: '인증 코드 전송에 실패했습니다.' });
            }
        } catch (error) {
            console.error('Error processing registration code request:', error);
            await client.del(verificationKey);
            res.status(500).json({ success: false, message: '인증 코드 전송 중 오류가 발생했습니다.' });
        }
    });

    app.post('/api/verify-registration-code', async (req, res) => {
        const { email, code } = req.body;
        const verificationKey = `registration_verification:${email}`;

        try {
            const storedCodeJSON = await client.get(verificationKey);
            if (!storedCodeJSON) {
                return res.status(400).json({ success: false, message: '유효하지 않거나 만료된 인증 코드입니다.' });
            }
            const storedCodeData = JSON.parse(storedCodeJSON);
            if (storedCodeData.code !== code) {
                return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' });
            }

            const { name } = storedCodeData;
            await client.del(verificationKey);

            if (await userRepository.getUser(email) || await userRepository.getUser(name)) {
                return res.status(400).json({ success: false, message: '이미 사용 중인 이메일 또는 닉네임입니다.' });
            }

            const newUser = {
                id: uuidv4(),
                email, name, 
                avatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(name)}`,
                friends: [], friendRequests: [], pendingRequests: [], achievements: [],
                unlockedEffects: [], unlockedCardEffects: [], unlockedProfileDecorations: [], unlockedCardDecorations: [],
                profileVisibility: 'public', profileEffect: null, cardEffect: null, profileDecoration: null, cardDecoration: null,
                displayedAchievements: [], description: '', onlineStatus: 'online', connectionStatus: 'disconnected',
                title: '', unlockedTitles: [], birthday: null, isMaster: email === 'service.starcade@gmail.com', 
                settings: { arcadeMode: false },
            };
            await userRepository.saveUser(newUser);
            await redisManager.persistUser(newUser.id);
            
            const token = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: '7d' });
            res.json({ success: true, user: newUser, token });

        } catch (error) {
            console.error('Error verifying registration code:', error);
            await client.del(verificationKey);
            res.status(500).json({ success: false, message: '인증 코드 확인 중 오류가 발생했습니다.' });
        }
    });

    app.post('/api/request-login-code', async (req, res) => {
        const { identifier } = req.body;
        const user = await userRepository.getUser(identifier);
        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        return sendLoginCode(res, user);
    });

    app.post('/api/verify-login-code', async (req, res) => {
        const { email, code } = req.body;
        const verificationKey = `login_verification:${email}`;

        try {
            const storedCodeJSON = await client.get(verificationKey);
            if (!storedCodeJSON) {
                return res.status(400).json({ success: false, message: '유효하지 않거나 만료된 인증 코드입니다.' });
            }
            const storedCodeData = JSON.parse(storedCodeJSON);
            if (storedCodeData.code !== code) {
                return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' });
            }

            await client.del(verificationKey);

            const user = await userRepository.getUser(email);
            if (!user) {
                return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }
            user.isMaster = user.email === 'service.starcade@gmail.com';

            const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' });
            res.json({ success: true, user, token });

        } catch (error) {
            console.error('Error verifying login code:', error);
            await client.del(verificationKey);
            res.status(500).json({ success: false, message: '인증 코드 확인 중 오류가 발생했습니다.' });
        }
    });

    app.get('/api/session', async (req, res) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: '인증되지 않았습니다.' });
        }

        try {
            const decoded = jwt.verify(token, jwtSecret);
            let userForDb = await userRepository.getUser(decoded.id);

            if (userForDb) {
                userForDb.isMaster = userForDb.email === 'service.starcade@gmail.com';

                const today = new Date();
                const todayDate = today.toISOString().split('T')[0];
                const justLoggedIn = userForDb.lastLoginDate !== todayDate;
                let newlyUnlockedTitles = [];
                let newlyUnlockedEffects = [];

                if (justLoggedIn) {
                    userForDb.lastLoginDate = todayDate;
                    const lastLogin = userForDb.lastLoginDate ? new Date(userForDb.lastLoginDate) : null;
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);

                    userForDb.consecutiveLoginDays = (lastLogin && lastLogin.toDateString() === yesterday.toDateString()) 
                        ? (userForDb.consecutiveLoginDays || 0) + 1 
                        : 1;

                    const attendanceResult = evaluateAchievements(userForDb, { gameId: 'system', event: 'login' }, { consecutiveLoginDays: userForDb.consecutiveLoginDays });
                    userForDb = attendanceResult.updatedUser;
                    newlyUnlockedTitles.push(...attendanceResult.newlyUnlockedTitles);
                    newlyUnlockedEffects.push(...attendanceResult.newlyUnlockedEffects);

                    const birthdayResult = await checkBirthdayAndGrantRewards(userForDb);
                    userForDb = birthdayResult.user;
                    newlyUnlockedTitles.push(...birthdayResult.newlyUnlockedTitles);
                    newlyUnlockedEffects.push(...birthdayResult.newlyUnlockedEffects);

                    await userRepository.saveUser(userForDb);
                }

                let userForResponse = { ...userForDb, isBirthday: isTodayBirthday(userForDb.birthday) };

                if (userForResponse.isMaster) {
                    const allAchievements = getAllAchievementDefinitions().map(def => ({
                        id: def.id, name: def.name, description: def.description, icon: def.icon, progress: 1,
                        tier: def.tiers ? def.tiers[def.tiers.length - 1] : null, unlockedAt: new Date().toISOString(),
                    }));
        
                    userForResponse = { 
                        ...userForResponse, 
                        achievements: allAchievements,
                        unlockedEffects: getAllEffects().map(e => e.id),
                        unlockedTitles: getAllTitles(),
                        unlockedCardEffects: getAllCardEffects().map(e => e.id),
                        unlockedProfileDecorations: getAllProfileDecorations().map(d => d.id),
                        unlockedCardDecorations: getAllCardDecorations().map(d => d.id),
                    };
                }

                res.json({ success: true, user: userForResponse, newlyUnlockedTitles, newlyUnlockedEffects });

            } else {
                res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }
        } catch (error) {
            console.error('Session check error:', error);
            res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }
    });

    app.post('/api/logout', (req, res) => {
        res.json({ success: true, message: '로그아웃되었습니다.' });
    });

    app.get('/api/identifier-exists/:identifier', async (req, res) => {
        const { identifier } = req.params;
        const user = await userRepository.getUser(identifier);
        res.json({ exists: !!user });
    });
};