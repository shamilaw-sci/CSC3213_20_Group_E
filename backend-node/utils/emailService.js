const nodemailer = require('nodemailer');
const path = require('path');
const logger = require('./logger');

const port = parseInt(process.env.EMAIL_PORT || '465', 10);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            logger.warn('Email not sent because EMAIL_USER or EMAIL_PASS is missing');
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
            attachments: [{
                filename: 'logo.jpeg',
                path: path.join(__dirname, '../../frontend-react/public/logo.jpeg'),
                cid: 'thirasaralogo' // same cid value as in the html img src
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Email sent', { to, subject, response: info.response });
    } catch (error) {
        logger.error('Failed to send email', error);
    }
};

const getBaseHtmlTemplate = (title, content) => {
    const logoUrl = 'cid:thirasaralogo';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); margin: 0 auto;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                                <img src="${logoUrl}" alt="Thirasara Property" style="max-height: 70px; width: auto; border-radius: 8px;" />
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px; line-height: 1.6; font-size: 16px;">
                                ${content}
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px 40px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">&copy; ${new Date().getFullYear()} Thirasara Property. All rights reserved.</p>
                                <p style="margin: 0; color: #94a3b8; font-size: 13px;">Find your dream property in Sri Lanka</p>
                                <div style="margin-top: 20px;">
                                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 600;">Visit our website</a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

const sendWelcomeEmail = (email, name) => {
    const subject = "Welcome to Thirasara Property! 🏡";
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const content = `
        <h1 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Thirasara, ${name}!</h1>
        <p style="color: #475569; margin-bottom: 20px;">We are thrilled to have you on board. You've just unlocked access to Sri Lanka's most premium real estate platform.</p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
            <h3 style="color: #1e3a8a; margin-top: 0; margin-bottom: 10px; font-size: 16px;">What you can do now:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 8px;">Explore high-end properties on our Interactive Map</li>
                <li style="margin-bottom: 8px;">Calculate your buying power using our Financial Engine</li>
                <li>Compare properties side-by-side to make the best decision</li>
            </ul>
        </div>
        
        <p style="margin-bottom: 30px;">Ready to find your dream property?</p>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="${clientUrl}/buy" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Start Exploring</a>
        </div>
    `;
    return sendEmail(email, subject, getBaseHtmlTemplate("Welcome to Thirasara Property", content));
};

const sendPaymentReceipt = (email, propertyTitle, amount) => {
    const subject = "Payment Receipt - Thirasara Property 🧾";
    const content = `
        <h1 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px; font-weight: 800;">Payment Successful!</h1>
        <p style="color: #475569; margin-bottom: 20px;">Thank you for your payment. We have successfully received your listing fee.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Property Listing</td>
                    <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">${propertyTitle}</td>
                </tr>
                <tr>
                    <td style="padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Amount Paid</td>
                    <td style="padding-top: 12px; border-top: 1px solid #e2e8f0; color: #059669; font-weight: 700; font-size: 18px; text-align: right;">Rs. ${amount.toLocaleString()}</td>
                </tr>
            </table>
        </div>
        
        <p style="color: #475569; margin-bottom: 10px;"><strong>What happens next?</strong></p>
        <p style="color: #64748b; font-size: 15px; margin-top: 0;">Your property is now pending administrative review. This usually takes less than 24 hours. We will notify you via email as soon as it goes live on the platform.</p>
    `;
    return sendEmail(email, subject, getBaseHtmlTemplate("Payment Receipt", content));
};

const sendListingStatusEmail = (email, propertyTitle, status, reason = '') => {
    const isApproved = status === 'Active';
    const subject = `Your Property is ${isApproved ? 'Approved!' : 'Requires Attention'}`;
    const badgeColor = isApproved ? '#059669' : '#dc2626';
    const badgeBg = isApproved ? '#d1fae5' : '#fee2e2';
    
    const content = `
        <h1 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px; font-weight: 800;">Listing Status Update</h1>
        <p style="color: #475569; margin-bottom: 20px;">Your property listing <strong>"${propertyTitle}"</strong> has been reviewed by our administrative team.</p>
        
        <div style="margin: 30px 0; text-align: center;">
            <span style="display: inline-block; padding: 8px 16px; background-color: ${badgeBg}; color: ${badgeColor}; border-radius: 20px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">
                ${status}
            </span>
        </div>

        ${!isApproved && reason ? `
        <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <h3 style="color: #be123c; margin-top: 0; margin-bottom: 8px; font-size: 15px;">Reason for rejection:</h3>
            <p style="margin: 0; color: #9f1239;">${reason}</p>
        </div>
        ` : ''}
        
        <p style="color: #475569;">
            ${isApproved 
                ? 'Great news! Your property is now <strong>live</strong> and visible to thousands of potential buyers on our interactive map. Good luck with your sale!' 
                : 'Please log in to your seller dashboard, make the necessary corrections outlined above, and resubmit your listing.'}
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
        </div>
    `;
    return sendEmail(email, subject, getBaseHtmlTemplate("Listing Status Update", content));
};

const sendPasswordResetEmail = (email, name, resetLink) => {
    const subject = 'Reset Your Password - Thirasara Property 🔒';
    const content = `
        <h1 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px; font-weight: 800;">Password Reset Request</h1>
        <p style="color: #475569; margin-bottom: 20px;">Hi ${name},</p>
        <p style="color: #475569; margin-bottom: 20px;">We received a request to reset the password for your Thirasara Property account. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Reset Password</a>
        </div>
        
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">This link will securely expire in 15 minutes.</p>
    `;
    return sendEmail(email, subject, getBaseHtmlTemplate("Password Reset", content));
};

const sendSavedSearchAlertEmail = (email, searchTitle, property) => {
    const subject = `New match for your saved search "${searchTitle}"`;
    const content = `
        <h2 style="color: #1e293b;">A new property matches your saved search!</h2>
        <p style="color: #475569;">Your saved search "<strong>${searchTitle}</strong>" has a new match:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">${property.title}</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">${property.type || ''} &middot; Rs. ${Number(property.price || 0).toLocaleString()}</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Log in to Thirasara to view the full listing and photos.</p>
    `;
    return sendEmail(email, subject, getBaseHtmlTemplate("New Match Found", content));
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPaymentReceipt,
    sendListingStatusEmail,
    sendPasswordResetEmail,
    sendSavedSearchAlertEmail,
};
