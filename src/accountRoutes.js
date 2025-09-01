const fs = require('fs').promises;
const { selectTemplate } = require('./emailTemplateSelector');
const { transporter } = require('./mailer');
const createAuthMiddleware = require('./middleware/auth.js');
const { client } = require('./redisClient');
const scoreRepository = require('./repositories/scoreRepository');

// In-memory storage for verification codes (for simplicity)
const verificationCodes = new Map(); // Map: email -> { code: '...', expiry: Date }

// Helper function to load email templates
const loadEmailTemplate = async (templateName, replacements) => {
    let content = await fs.readFile(`${__dirname}/emails/${templateName}`, 'utf8');
    for (const key in replacements) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }
    return content;
};

module.exports = (app, { userRepository, redisManager }, jwtSecret) => {
    const authMiddleware = createAuthMiddleware(jwtSecret);

    app.post('/api/request-delete-code', authMiddleware, async (req, res) => {
        const user = req.user; // Get user from middleware
        const email = user.email;

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const expiry = Date.now() + 10 * 60 * 1000; // Code valid for 10 minutes
        verificationCodes.set(email, { code, expiry });

        const selectedTemplate = selectTemplate('account_deletion_verification');
        const mailOptions = {
            from: 'service.starcade@gmail.com',
            to: email,
            subject: '[Starcade] 계정 삭제 인증 코드',
            text: await loadEmailTemplate(selectedTemplate.text_template, { name: user.name, code }),
            html: await loadEmailTemplate(selectedTemplate.html_template, { name: user.name, code })
        };

        try {
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: '인증 코드가 이메일로 전송되었습니다.' });
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ success: false, message: '인증 코드 전송에 실패했습니다.' });
        }
    });

    app.post('/api/delete-account', authMiddleware, async (req, res) => {
        const { code, rankingAction = 'rename' } = req.body;
        const user = req.user; // Get user from middleware

        const userEmail = user.email;
        const storedCodeData = verificationCodes.get(userEmail);

        if (!storedCodeData || storedCodeData.code !== code || storedCodeData.expiry < Date.now()) {
            return res.status(400).json({ success: false, message: '유효하지 않거나 만료된 인증 코드입니다.' });
        }

        if (rankingAction === 'delete') {
            const scoreKeys = await client.keys(`${scoreRepository.SCORE_KEY_PREFIX}*`);
            for (const key of scoreKeys) {
                const gameId = key.substring(scoreRepository.SCORE_KEY_PREFIX.length);
                const scores = await scoreRepository.getScores(gameId);
                const initialLength = scores.length;
                const newScores = scores.filter(s => s.userId !== user.id);
                if (newScores.length < initialLength) {
                    await scoreRepository.saveScoresForGame(gameId, newScores);
                    await redisManager.persistGameScores(gameId);
                }
            }
        }

        // Delete user from redis
        const deleted = await userRepository.deleteUser(user.id);
        if (!deleted) {
            return res.status(500).json({ success: false, message: '계정 삭제에 실패했습니다.' });
        }
        await redisManager.removeUserFromDb(user.id);
        verificationCodes.delete(userEmail); // Clear the code after successful deletion

        res.json({ success: true, message: '계정이 성공적으로 삭제되었습니다.' });
    });
};