const NEW_PASSWORD_MIN = 15;
const BCRYPT_MAX_BYTES = 72;

function validNewPassword(password) {
    return typeof password === 'string'
        && [...password].length >= NEW_PASSWORD_MIN
        && Buffer.byteLength(password, 'utf8') <= BCRYPT_MAX_BYTES;
}

const newPasswordMessage = 'Password must be at least 15 characters and at most 72 UTF-8 bytes.';

module.exports = { validNewPassword, newPasswordMessage };
