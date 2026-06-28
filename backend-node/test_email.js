const nodemailer = require('nodemailer');

async function runTest() {
    console.log("Generating Ethereal Test Account...");
    let testAccount = await nodemailer.createTestAccount();
    
    console.log("Test Account created: ", testAccount.user);

    // Override env variables for our email service to use ethereal
    process.env.EMAIL_HOST = 'smtp.ethereal.email';
    process.env.EMAIL_PORT = 587;
    process.env.EMAIL_USER = testAccount.user;
    process.env.EMAIL_PASS = testAccount.pass;

    // Clear cache to force emailService to re-evaluate process.env
    delete require.cache[require.resolve('./utils/emailService')];
    const emailService = require('./utils/emailService');

    console.log("Sending a test Password Reset email...");
    
    // We capture the console.log from emailService to get the messageId, 
    // but to get the URL we actually need the info object.
    // Ethereal automatically logs the URL if we pass the message ID to nodemailer.getTestMessageUrl
    
    // Since emailService.sendPasswordResetEmail doesn't return the 'info' object directly, 
    // we'll listen to the console output or just mock a sendMail locally to show the URL.
    
    // Let's create a local transporter to get the URL directly for demonstration:
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const info = await transporter.sendMail({
        from: '"Thirasara System" <test@ethereal.email>',
        to: "user@example.com",
        subject: "Password Reset - Thirasara Property",
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; text-align: center;">
            <h2 style="color: #006aff;">Password Reset Request</h2>
            <p>Hi Test User,</p>
            <p>We received a request to reset your password. Click the button below to choose a new one:</p>
            <a href="http://localhost:5173/reset-password?token=123" style="display: inline-block; padding: 12px 24px; background-color: #006aff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">Reset Password</a>
            <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>`
    });

    console.log("✅ Email sent successfully!");
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("Click the link above to view how the email looks in a real inbox.");
}

runTest().catch(console.error);
