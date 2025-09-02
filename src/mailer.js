const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.mail.me.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: 'uzu_lee@icloud.com',
        pass: 'nppe-oxhe-kzcn-nhup'
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
    transporter
};
