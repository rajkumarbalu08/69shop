#!/usr/bin/env node

const admin = require('firebase-admin');

function normalizeEmail(value) {
    return (value || '').toString().trim().toLowerCase();
}

function collectAliases(data = {}, docId) {
    const aliases = new Set();
    [data.originalEmail, data.email, docId]
        .filter(Boolean)
        .forEach((alias) => aliases.add(alias));
    (Array.isArray(data.aliases) ? data.aliases : [])
        .filter(Boolean)
        .forEach((alias) => aliases.add(alias));
    return Array.from(aliases);
}

function inferProjectId() {
    if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
    if (process.env.GCP_PROJECT) return process.env.GCP_PROJECT;
    if (process.env.FIREBASE_CONFIG) {
        try {
            const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
            if (parsed.projectId) return parsed.projectId;
        } catch (error) {
            // ignore malformed config
        }
    }
    return null;
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        fix: false,
        projectId: inferProjectId(),
        silent: false
    };

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--fix' || arg === '-f') {
            options.fix = true;
        } else if (arg === '--silent') {
            options.silent = true;
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg.startsWith('--project=')) {
            options.projectId = arg.split('=')[1];
        } else if (arg === '--project' || arg === '-p') {
            options.projectId = args[i + 1];
            i += 1;
        } else {
            options.unknown = options.unknown || [];
            options.unknown.push(arg);
        }
    }

    return options;
}

function printUsage() {
    console.log('Admin audit usage:');
    console.log('  node scripts/admin-audit.js [--fix] [--project <id>] [--silent]');
    console.log('Requires GOOGLE_APPLICATION_CREDENTIALS or equivalent admin access.');
}

function initFirebase(projectId) {
    if (admin.apps.length) {
        return admin.firestore();
    }
    const options = projectId ? { projectId } : undefined;
    admin.initializeApp(options);
    return admin.firestore();
}

function summarizeIssues(records) {
    return {
        total: records.length,
        idMismatches: records.filter((entry) => !entry.isNormalizedId).length,
        emailMismatches: records.filter((entry) => !entry.isEmailNormalized).length,
        duplicates: records.filter((entry) => entry.isDuplicate).length
    };
}

async function fixDocument(docSnap, db, context) {
    const data = docSnap.data() || {};
    const currentId = docSnap.id;
    const normalizedId = normalizeEmail(data.email || currentId);
    if (!normalizedId) {
        console.warn(`Skipping ${currentId}: missing email`);
        return { skipped: true };
    }

    const aliasList = collectAliases(data, currentId);
    const normalizedPayload = {
        ...data,
        email: normalizedId,
        originalEmail: data.originalEmail || data.email || currentId,
        aliases: aliasList,
        normalizedAt: admin.firestore.FieldValue.serverTimestamp(),
        normalizedBy: 'admin-audit-script'
    };

    if (currentId === normalizedId) {
        await docSnap.ref.set(normalizedPayload, { merge: true });
        if (!context.silent) {
            console.log(`✔ Updated metadata for ${currentId}`);
        }
        return { updated: true };
    }

    const targetRef = db.collection('admins').doc(normalizedId);
    const existing = await targetRef.get();
    if (existing.exists) {
        const existingData = existing.data() || {};
        const mergedAliases = new Set([...(existingData.aliases || []), ...aliasList]);
        await targetRef.set({
            ...existingData,
            ...normalizedPayload,
            aliases: Array.from(mergedAliases),
            addedAt: existingData.addedAt || normalizedPayload.addedAt || admin.firestore.FieldValue.serverTimestamp(),
            addedBy: normalizedPayload.addedBy || existingData.addedBy || null,
            role: normalizedPayload.role || existingData.role || 'admin',
            isActive: normalizedPayload.isActive ?? existingData.isActive ?? true
        }, { merge: true });
        if (!context.silent) {
            console.log(`✔ Merged ${currentId} into ${normalizedId}`);
        }
    } else {
        await targetRef.set(normalizedPayload, { merge: true });
        if (!context.silent) {
            console.log(`✔ Migrated ${currentId} → ${normalizedId}`);
        }
    }
    await docSnap.ref.delete();
    return { migrated: true };
}

async function runAudit() {
    const options = parseArgs();
    if (options.help) {
        printUsage();
        process.exit(0);
    }
    if (options.unknown) {
        console.warn('Ignoring unknown arguments:', options.unknown.join(', '));
    }

    const db = initFirebase(options.projectId);
    const snapshot = await db.collection('admins').get();
    if (snapshot.empty) {
        console.log('No admin documents found.');
        return { total: 0 };
    }

    const normalizedMap = new Map();
    const reports = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        const normalizedId = normalizeEmail(data.email || doc.id);
        const record = {
            id: doc.id,
            normalizedId,
            emailField: data.email || null,
            role: data.role || 'admin',
            isNormalizedId: doc.id === normalizedId,
            isEmailNormalized: !!data.email && data.email === normalizedId
        };
        if (!normalizedMap.has(normalizedId)) {
            normalizedMap.set(normalizedId, []);
        }
        normalizedMap.get(normalizedId).push(doc.id);
        return record;
    });

    reports.forEach((record) => {
        const bucket = normalizedMap.get(record.normalizedId) || [];
        record.isDuplicate = bucket.length > 1;
    });

    const flagged = reports.filter((record) => !record.isNormalizedId || !record.isEmailNormalized || record.isDuplicate);

    if (!flagged.length) {
        console.log('All admin documents are normalized.');
    } else {
        console.log('\n⚠ Found admin inconsistencies:', flagged.length);
        console.table(flagged.map((entry) => ({
            id: entry.id,
            normalizedId: entry.normalizedId,
            emailField: entry.emailField,
            role: entry.role,
            duplicate: entry.isDuplicate
        })));
    }

    if (options.fix && flagged.length) {
        console.log('\nAttempting to fix issues...');
        for (const doc of snapshot.docs) {
            const data = doc.data() || {};
            const normalizedId = normalizeEmail(data.email || doc.id);
            const hasIssue = doc.id !== normalizedId || (data.email && data.email !== normalizedId);
            const duplicates = (normalizedMap.get(normalizedId) || []).length > 1;
            if (!hasIssue && !duplicates) {
                continue;
            }
            await fixDocument(doc, db, options);
        }
    }

    const summary = summarizeIssues(flagged);
    console.log('\nSummary:', summary);
    return summary;
}

runAudit()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Admin audit failed:', error.message);
        process.exit(1);
    });
