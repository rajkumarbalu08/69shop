const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 120000;

function deriveKey(secret, saltBuffer) {
    if (!secret || typeof secret !== 'string') {
        throw new Error('Encryption secret missing. Provide MAIL_CONFIG_KEY.');
    }
    return crypto.pbkdf2Sync(secret, saltBuffer, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

function encryptObject(data, secret) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(secret, salt);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        ciphertext: ciphertext.toString('base64')
    };
}

function decryptObject(payload, secret) {
    if (!payload || !payload.ciphertext) {
        throw new Error('Encrypted payload missing.');
    }
    const salt = Buffer.from(payload.salt, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const key = deriveKey(secret, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
}

function resolveMailConfig(runtimeConfig = {}, options = {}) {
    const directConfig = runtimeConfig.mail || {};
    if (hasAllMailFields(directConfig)) {
        return directConfig;
    }

    const secretsPath = options.secretsPath || path.join(__dirname, '..', 'secrets', 'mail.config.enc.json');
    if (!fs.existsSync(secretsPath)) {
        return directConfig;
    }

    const secretKey = options.secretKey || process.env.MAIL_CONFIG_KEY;
    if (!secretKey) {
        throw new Error('MAIL_CONFIG_KEY not set. Required to decrypt mail config.');
    }

    const fileContents = fs.readFileSync(secretsPath, 'utf8');
    const encryptedPayload = JSON.parse(fileContents);
    const decrypted = decryptObject(encryptedPayload, secretKey);
    return { ...directConfig, ...decrypted };
}

function hasAllMailFields(config) {
    const required = ['host', 'user', 'pass', 'to'];
    return required.every((key) => Boolean(config && config[key]));
}

function writeEncryptedFile(data, secret, targetPath) {
    const payload = encryptObject(data, secret);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2));
    return payload;
}

module.exports = {
    encryptObject,
    decryptObject,
    resolveMailConfig,
    writeEncryptedFile,
    hasAllMailFields
};
