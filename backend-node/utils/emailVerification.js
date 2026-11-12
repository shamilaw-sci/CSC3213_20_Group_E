const { createHash, randomBytes } = require('node:crypto');
const supabase = require('../config/supabase');
const { sendEmail } = require('./emailService');

const enabled = () => process.env.EMAIL_VERIFICATION_ENABLED === 'true';
const digest = token => '\\x' + createHash('sha256').update(token).digest('hex');

async function sendChallenge(user, purpose, target = user.email) {
    const token = randomBytes(32).toString('hex');
    const link = new URL('/verify-email', process.env.CLIENT_URL || 'http://localhost:5173');
    link.hash = token;

    const { data, error } = await supabase.rpc('issue_email_challenge', {
        p_user_id: user.id,
        p_purpose: purpose,
        p_current_email: user.email,
        p_target_email: target,
        p_token_digest: digest(token)
    });
    if (error) throw error;
    if (data) await sendEmail(target, 'Verify your Thirasara email', `Open this link to confirm your email: <a href="${link.href}">${link.href}</a>. It expires in 30 minutes.`, true);
    return data === true;
}

async function confirmChallenge(token) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
    const { data, error } = await supabase.rpc('consume_email_challenge', { p_token_digest: digest(token) });
    if (error) throw error;
    if (typeof data !== 'string') return false;
    if (data) {
        await sendEmail(data, 'Your Thirasara email was changed',
            'The sign-in email for your Thirasara account has changed. If you did not request this, contact support.', true)
            .catch(() => console.error('email_change_notification_failed'));
    }
    return true;
}

module.exports = { enabled, sendChallenge, confirmChallenge };
