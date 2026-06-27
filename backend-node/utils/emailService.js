const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 465,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️ Email not sent: EMAIL_USER or EMAIL_PASS is missing in .env");
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent: ${info.response}`);
    } catch (error) {
        console.error("❌ Failed to send email:", error.message);
    }
};

const sendWelcomeEmail = (email, name) => {
    const subject = "Welcome to Thirasara Property!";
    const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto;">
            <h2 style="color: #2563eb;">Welcome to Thirasara Property, ${name}!</h2>
            <p>Thank you for registering with us. We are thrilled to have you on board.</p>
            <p>You can now explore premium lands, calculate your financial feasibility, and save your favorite properties.</p>
            <p>Happy exploring!</p>
            <p>Best Regards,<br/><strong>The Thirasara Team</strong></p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

const sendPaymentReceipt = (email, propertyTitle, amount) => {
    const subject = "Payment Receipt - Thirasara Property Listing";
    const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto;">
            <h2 style="color: #10b981;">Payment Successful!</h2>
            <p>We have successfully received your payment of <strong>Rs. ${amount.toLocaleString()}</strong> for listing: <strong>${propertyTitle}</strong>.</p>
            <p>Your property is now pending administrative approval. We will notify you once it's live on the map.</p>
            <p>Thank you for doing business with us.</p>
            <p>Best Regards,<br/><strong>The Thirasara Team</strong></p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

const sendListingStatusEmail = (email, propertyTitle, status, reason = '') => {
    const isApproved = status === 'Active';
    const subject = `Your Property Listing is ${isApproved ? 'Approved!' : 'Rejected'}`;
    const color = isApproved ? '#10b981' : '#ef4444';
    
    const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto;">
            <h2 style="color: ${color};">Listing ${status}</h2>
            <p>Your property listing: <strong>${propertyTitle}</strong> has been <strong>${status}</strong> by our administrators.</p>
            ${!isApproved && reason ? `<p style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 5px;">Reason: ${reason}</p>` : ''}
            ${isApproved ? '<p>Your property is now live and visible to buyers on the map!</p>' : '<p>Please log in to your dashboard to make the necessary corrections.</p>'}
            <p>Best Regards,<br/><strong>The Thirasara Team</strong></p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

const sendPasswordResetEmail = (email, name, resetLink) => {
    const subject = 'Password Reset - Thirasara Property';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; text-align: center;">
            <h2 style="color: #006aff;">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to choose a new one:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #006aff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">Reset Password</a>
            <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPaymentReceipt,
    sendListingStatusEmail,
    sendPasswordResetEmail
};
