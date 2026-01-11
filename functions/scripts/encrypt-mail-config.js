#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { writeEncryptedFile } = require('../utils/secretVault');

const secretKey = process.env.MAIL_CONFIG_KEY;
if (!secretKey) {
    console.error('MAIL_CONFIG_KEY env variable is required.');
    process.exit(1);
}

const plaintextPath = path.join(__dirname, '..', 'secrets', 'mail.config.json');
const encryptedPath = path.join(__dirname, '..', 'secrets', 'mail.config.enc.json');

if (!fs.existsSync(plaintextPath)) {
    console.error(`Create ${plaintextPath} with your SMTP config before encrypting.`);
    process.exit(1);
}

const raw = fs.readFileSync(plaintextPath, 'utf8');
let config;
try {
    config = JSON.parse(raw);
} catch (error) {
    console.error('mail.config.json must be valid JSON.');
    process.exit(1);
}

writeEncryptedFile(config, secretKey, encryptedPath);
console.info(`Encrypted mail config saved to ${encryptedPath}.`);
