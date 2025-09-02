const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'service.starcade@gmail.com',
        pass: 'ktex nidg jilt zrgl'
    }
});

/**
 * Sends a verification email.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain text body.
 * @param {string} html - HTML body.
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendVerificationEmail = async (to, subject, text, html) => {
    const mailOptions = {
        from: '"Starcade Service" <starcade.service@stellatic.dev>',
        to,
        subject,
        text,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: '인증 코드가 이메일로 전송되었습니다.' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: '인증 코드 전송에 실패했습니다.' };
    }
};

module.exports = {
    sendVerificationEmail,
    transporter // transporter도 함께 내보냅니다.
};
transporter도 함께 내보냅니다.
};
