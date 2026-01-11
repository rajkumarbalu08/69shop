const path = require('path');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { resolveMailConfig } = require('./utils/secretVault');

admin.initializeApp();

const REGION = 'asia-south1';
const MAIL_SECRETS_PATH = path.join(__dirname, 'secrets', 'mail.config.enc.json');
let cachedTransporter = null;

function assertMailConfig(mailConfig) {
    const required = ['host', 'user', 'pass', 'to'];
    const missing = required.filter((key) => !mailConfig[key]);
    if (missing.length) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            `Missing mail configuration: ${missing.join(', ')}. ` +
            'Set Firebase runtime config via `firebase functions:config:set mail.host="smtp.gmail.com" mail.port="465" mail.secure="true" mail.user="support@69shop.in" mail.pass="<APP_PASSWORD>" mail.to="bookings@69shop.in" mail.from="support@69shop.in"` or provide an encrypted config.'
        );
    }
}

function getTransporter(mailConfig) {
    if (!cachedTransporter) {
        assertMailConfig(mailConfig);
        cachedTransporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port ? Number(mailConfig.port) : 465,
            secure: mailConfig.secure !== 'false',
            auth: {
                user: mailConfig.user,
                pass: mailConfig.pass
            }
        });
    }
    return cachedTransporter;
}

function formatLabel(key) {
    return key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^./, (char) => char.toUpperCase());
}

function normalizeValue(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}

function buildHtmlTable(details = {}) {
    const rows = Object.entries(details)
        .filter(([key]) => !['recordId'].includes(key))
        .map(([key, value]) => `
            <tr>
                <td style="padding:8px 12px;border:1px solid #e5e5e5;background:#fafafa;font-weight:600;color:#222;">${formatLabel(key)}</td>
                <td style="padding:8px 12px;border:1px solid #e5e5e5;">${normalizeValue(value) || '-'}</td>
            </tr>
        `)
        .join('');

    return `
        <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;margin-top:16px;">
            <tbody>${rows}</tbody>
        </table>
    `;
}

function getMailConfigOrThrow() {
    try {
        const runtimeConfig = functions.config();
        const secretKey = process.env.MAIL_CONFIG_KEY || runtimeConfig?.secrets?.mail_key;
        const config = resolveMailConfig(runtimeConfig, {
            secretsPath: MAIL_SECRETS_PATH,
            secretKey
        });
        assertMailConfig(config);
        return config;
    } catch (error) {
        functions.logger.error('Mail config error', error);
        const message = error.message || 'Mail configuration unavailable.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }
}

exports.sendServiceEmail = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
        const mailConfig = getMailConfigOrThrow();

        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', 'Payload is missing.');
        }

        const service = data.service;
        if (!service) {
            throw new functions.https.HttpsError('invalid-argument', 'Service name is required.');
        }

        const submittedAt = data.submittedAt || new Date().toISOString();
        const contact = data.contact || {};
        const requesterName = contact.name || 'Client';
        const requesterEmail = contact.email || mailConfig.to;

        const transporter = getTransporter(mailConfig);
        const subject = `[${service}] concierge brief from ${requesterName}`;
        const htmlContent = `
            <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;line-height:1.6;">
                <h2 style="margin-bottom:4px;">New ${service} enquiry</h2>
                <p style="margin-top:0;color:#666;">Submitted at ${submittedAt}</p>
                <div style="margin-top:12px;padding:12px;border-left:4px solid #0066ff;background:#f5f7ff;">
                    <p style="margin:0;font-size:15px;">
                        <strong>Requester:</strong> ${requesterName}<br>
                        <strong>Email:</strong> ${contact.email || '-'}<br>
                        <strong>Phone:</strong> ${contact.phone || '-'}<br>
                        <strong>City:</strong> ${contact.city || '-'}
                    </p>
                </div>
                ${buildHtmlTable(data.details || data)}
            </div>
        `;

        const mailOptions = {
            from: mailConfig.from || mailConfig.user,
            to: mailConfig.to,
            replyTo: requesterEmail,
            subject,
            text: `New ${service} enquiry from ${requesterName} (email: ${contact.email || '-'}). Submitted at ${submittedAt}.` +
                '\n\nDetails:\n' + normalizeValue(data.details || data),
            html: htmlContent
        };

        try {
            await transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            functions.logger.error('Unable to send concierge email', error);
            throw new functions.https.HttpsError('internal', 'Unable to send email right now.');
        }
    });
