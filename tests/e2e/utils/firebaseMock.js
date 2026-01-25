function mergeCollections(base = {}, overrides = {}) {
    const result = { ...base };
    Object.entries(overrides).forEach(([collection, docs]) => {
        result[collection] = {
            ...(result[collection] || {}),
            ...docs
        };
    });
    return result;
}

async function interceptFirebaseScripts(page) {
    await Promise.all([
        page.route('**/firebase-config.js', (route) => {
            route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.firebaseConfig = window.firebaseConfig || { apiKey: "test" };' });
        }),
        page.route('https://www.gstatic.com/firebasejs/**', (route) => {
            route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* firebase sdk mocked in tests */' });
        }),
        page.route('**/js/notifications.js', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.NotificationFeed = { init: () => ({ refresh() {} }) };'
            });
        }),
        page.route('**/js/seller-shell.js', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.SellerShell = { sync: async () => ({}) };'
            });
        }),
        page.route('**/js/admin-shell.js', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.AdminShell = { init: () => ({}) };'
            });
        })
    ]);
}

function runtimeInstaller({ config }) {
    const deepClone = (value) => JSON.parse(JSON.stringify(value || null));
    const collections = JSON.parse(JSON.stringify(config.collections || {}));
    const writes = [];
    const listeners = {};

    function getField(source = {}, path) {
        return path.split('.').reduce((cursor, segment) => (
            cursor && cursor[segment] !== undefined ? cursor[segment] : undefined
        ), source);
    }

    function applyFilters(name, filters = []) {
        const docs = Object.entries(collections[name] || {}).map(([id, data]) => ({
            id,
            data: () => deepClone(data),
            exists: data !== undefined && data !== null
        }));
        if (!filters.length) return docs;
        return docs.filter((doc) => filters.every(({ field, value }) => getField(doc.data(), field) === value));
    }

    function executeQuery(name, state = {}) {
        let docs = applyFilters(name, state.filters || []);
        if (state.orderBy) {
            const { field, direction } = state.orderBy;
            docs.sort((a, b) => {
                const aValue = getField(a.data(), field);
                const bValue = getField(b.data(), field);
                if (aValue === bValue) return 0;
                if (aValue === undefined) return 1;
                if (bValue === undefined) return -1;
                return direction === 'desc' ? (aValue < bValue ? 1 : -1) : (aValue > bValue ? 1 : -1);
            });
        }
        if (typeof state.limit === 'number') {
            docs = docs.slice(0, state.limit);
        }
        return docs;
    }

    function makeSnapshot(docs) {
        return {
            empty: docs.length === 0,
            docs
        };
    }

    function createDocRef(name, id) {
        const ensureDoc = () => {
            collections[name] = collections[name] || {};
            if (!collections[name][id]) {
                collections[name][id] = null;
            }
        };

        return {
            async get() {
                ensureDoc();
                const payload = collections[name][id];
                return {
                    id,
                    exists: payload !== null && payload !== undefined,
                    data: () => deepClone(payload)
                };
            },
            async set(data, options = {}) {
                ensureDoc();
                const next = options && options.merge
                    ? { ...(collections[name][id] || {}), ...deepClone(data) }
                    : deepClone(data);
                collections[name][id] = next;
                writes.push({ collection: name, id, type: 'set', payload: deepClone(data), options });
                notifyListeners(name);
            },
            async update(data) {
                ensureDoc();
                const current = collections[name][id] || {};
                collections[name][id] = { ...current, ...deepClone(data) };
                writes.push({ collection: name, id, type: 'update', payload: deepClone(data) });
                notifyListeners(name);
            },
            async delete() {
                ensureDoc();
                delete collections[name][id];
                writes.push({ collection: name, id, type: 'delete' });
                notifyListeners(name);
            }
        };
    }

    function notifyListeners(name) {
        if (!listeners[name]) return;
        listeners[name].forEach(({ state, callback }) => {
            const docs = executeQuery(name, state);
            callback(makeSnapshot(docs));
        });
    }

    function createQuery(name, state = { filters: [] }) {
        return {
            where(field, op, value) {
                if (op !== '==') {
                    throw new Error('Mock Firestore only supports == filters');
                }
                return createQuery(name, {
                    ...state,
                    filters: [...(state.filters || []), { field, value }]
                });
            },
            orderBy(field, direction = 'asc') {
                return createQuery(name, {
                    ...state,
                    orderBy: { field, direction }
                });
            },
            limit(size) {
                return createQuery(name, {
                    ...state,
                    limit: size
                });
            },
            async get() {
                const docs = executeQuery(name, state);
                return makeSnapshot(docs);
            },
            onSnapshot(callback) {
                listeners[name] = listeners[name] || [];
                listeners[name].push({ state, callback });
                const docs = executeQuery(name, state);
                callback(makeSnapshot(docs));
                return () => {
                    listeners[name] = (listeners[name] || []).filter((entry) => entry.callback !== callback);
                };
            }
        };
    }

    function createCollection(name) {
        const ensureCollection = () => {
            collections[name] = collections[name] || {};
        };
        ensureCollection();
        return {
            doc: (id) => createDocRef(name, id),
            async add(data) {
                ensureCollection();
                const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                collections[name][id] = deepClone(data);
                writes.push({ collection: name, id, type: 'add', payload: deepClone(data) });
                notifyListeners(name);
                return createDocRef(name, id);
            },
            where: (...args) => createQuery(name).where(...args),
            orderBy: (...args) => createQuery(name).orderBy(...args),
            limit: (...args) => createQuery(name).limit(...args),
            async get() {
                const docs = Object.entries(collections[name] || {}).map(([id, data]) => ({
                    id,
                    exists: data !== undefined && data !== null,
                    data: () => deepClone(data)
                }));
                return makeSnapshot(docs);
            }
        };
    }

    const firestoreInstance = {
        collection: (name) => createCollection(name)
    };

    const authUser = config.user || { uid: 'test-user', email: 'test@example.com', displayName: 'Test User' };
    const authInstance = {
        currentUser: authUser,
        onAuthStateChanged(callback) {
            setTimeout(() => callback(authUser), 0);
        },
        async signOut() {
            window.__mockSignOuts = (window.__mockSignOuts || 0) + 1;
        }
    };

    const authFn = () => authInstance;
    authFn.EmailAuthProvider = {
        credential: (email, password) => ({ email, password })
    };

    const firestoreFn = () => firestoreInstance;
    const fieldValue = {
        serverTimestamp: () => ({ __timestamp: Date.now() })
    };
    firestoreFn.FieldValue = fieldValue;

    const storageInstance = {
        ref: () => ({
            put: async () => {},
            getDownloadURL: async () => 'https://example.com/mock-file.png'
        })
    };

    window.firebase = {
        apps: [],
        initializeApp: () => {
            window.firebase.apps.push({ initialized: true });
        },
        auth: authFn,
        firestore: firestoreFn,
        storage: () => storageInstance
    };
    window.firebase.firestore.FieldValue = fieldValue;
    window.firebaseConfig = config.firebaseConfig || { apiKey: 'test-key', projectId: 'demo' };
    window.__mockWrites = writes;
    window.__mockCollections = collections;

    if (!window.NotificationFeed) {
        window.NotificationFeed = { init: () => ({ refresh() {} }) };
    }
    if (!window.SellerShell) {
        window.SellerShell = { sync: async () => ({}) };
    }
    if (!window.AdminShell) {
        window.AdminShell = { init: () => ({}) };
    }
}

async function mockFirebase(page, options = {}) {
    const baseConfig = {
        firebaseConfig: { apiKey: 'test-key', projectId: 'demo' },
        user: { uid: 'test-user', email: 'test@example.com', displayName: 'Test User' },
        collections: {}
    };
    const config = {
        ...baseConfig,
        ...options,
        user: { ...baseConfig.user, ...(options.user || {}) },
        collections: mergeCollections(baseConfig.collections, options.collections)
    };

    await interceptFirebaseScripts(page);
    await page.addInitScript(runtimeInstaller, { config });
}

module.exports = {
    mockFirebase
};
