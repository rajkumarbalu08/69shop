/* ===================================================
   69SHOP.IN — Product Q&A Module
   Customers ask questions, sellers/community answer.
   =================================================== */

(function () {
    'use strict';

    let _db = null;
    let _auth = null;

    function init({ db, auth }) {
        if (db) _db = db;
        if (auth) _auth = auth;
    }

    /**
     * Ask a new question about a product.
     */
    async function askQuestion({ productId, productName, sellerId, questionText }) {
        if (!_db || !_auth?.currentUser) throw new Error('Login required to ask questions');
        if (!productId || !questionText?.trim()) throw new Error('Missing required fields');

        const user = _auth.currentUser;
        const docRef = await _db.collection('productQuestions').add({
            productId,
            productName: productName || '',
            sellerId: sellerId || '',
            questionText: questionText.trim(),
            askedBy: user.uid,
            askedByName: user.displayName || user.email?.split('@')[0] || 'Customer',
            answers: [],
            answerCount: 0,
            helpful: 0,
            status: 'open',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return docRef.id;
    }

    /**
     * Answer a question (seller or community).
     */
    async function answerQuestion(questionId, answerText) {
        if (!_db || !_auth?.currentUser) throw new Error('Login required to answer');
        if (!questionId || !answerText?.trim()) throw new Error('Missing required fields');

        const user = _auth.currentUser;

        // Get the question to check sellerId
        const qDoc = await _db.collection('productQuestions').doc(questionId).get();
        if (!qDoc.exists) throw new Error('Question not found');

        const qData = qDoc.data();
        const isSeller = qData.sellerId && user.uid === qData.sellerId;

        const answer = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            text: answerText.trim(),
            answeredBy: user.uid,
            answeredByName: user.displayName || user.email?.split('@')[0] || 'User',
            isSeller: isSeller,
            helpful: 0,
            createdAt: new Date().toISOString()
        };

        await _db.collection('productQuestions').doc(questionId).update({
            answers: firebase.firestore.FieldValue.arrayUnion(answer),
            answerCount: firebase.firestore.FieldValue.increment(1),
            status: 'answered'
        });

        return answer;
    }

    /**
     * Load all questions for a product.
     */
    async function loadQuestions(productId, limit) {
        if (!_db) return [];

        let query = _db.collection('productQuestions')
            .where('productId', '==', productId)
            .orderBy('createdAt', 'desc');

        if (limit) query = query.limit(limit);

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Mark a question as helpful.
     */
    async function markHelpful(questionId) {
        if (!_db) return;
        await _db.collection('productQuestions').doc(questionId).update({
            helpful: firebase.firestore.FieldValue.increment(1)
        });
    }

    /**
     * Render Q&A section HTML for the product page.
     */
    function renderQASection(questions, { productId, sellerId, isLoggedIn }) {
        const questionsHtml = questions.length === 0
            ? '<div class="qa-empty"><i class="fas fa-question-circle"></i><p>No questions yet. Be the first to ask!</p></div>'
            : questions.map(q => renderQuestionCard(q, sellerId, isLoggedIn)).join('');

        return `
            <div class="qa-header">
                <div class="qa-title">
                    <i class="fas fa-question-circle"></i>
                    <h2>Questions & Answers</h2>
                    <span class="qa-count">${questions.length}</span>
                </div>
                <button class="btn-ask-question" onclick="ProductQA._openAskModal()">
                    <i class="fas fa-plus"></i> Ask a Question
                </button>
            </div>
            <div class="qa-list" id="qaList">${questionsHtml}</div>
        `;
    }

    function renderQuestionCard(q, sellerId, isLoggedIn) {
        const timeAgo = formatTimeAgo(q.createdAt);
        const answersHtml = (q.answers || []).map(a => {
            const badge = a.isSeller
                ? '<span class="qa-seller-badge"><i class="fas fa-store"></i> Seller</span>'
                : '';
            return `
                <div class="qa-answer ${a.isSeller ? 'seller-answer' : ''}">
                    <div class="qa-answer-header">
                        <strong>${a.answeredByName}</strong> ${badge}
                        <span class="qa-time">${formatTimeAgo(a.createdAt)}</span>
                    </div>
                    <p>${a.text}</p>
                </div>
            `;
        }).join('');

        const answerForm = isLoggedIn ? `
            <div class="qa-answer-form" id="answerForm_${q.id}" style="display:none;">
                <input type="text" class="qa-answer-input" id="answerInput_${q.id}" placeholder="Write your answer...">
                <button class="qa-submit-answer" onclick="ProductQA._submitAnswer('${q.id}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>` : '';

        return `
            <div class="qa-card" data-qa-id="${q.id}">
                <div class="qa-question">
                    <div class="qa-q-icon">Q</div>
                    <div class="qa-q-content">
                        <p class="qa-q-text">${q.questionText}</p>
                        <div class="qa-q-meta">
                            <span>${q.askedByName}</span>
                            <span class="qa-dot">·</span>
                            <span>${timeAgo}</span>
                            <span class="qa-dot">·</span>
                            <span>${q.answerCount || 0} answer${(q.answerCount || 0) !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                <div class="qa-answers">${answersHtml}</div>
                <div class="qa-actions">
                    <button class="qa-action-btn" onclick="ProductQA._toggleAnswerForm('${q.id}')">
                        <i class="fas fa-reply"></i> Answer
                    </button>
                    <button class="qa-action-btn" onclick="ProductQA._markHelpful('${q.id}')">
                        <i class="fas fa-thumbs-up"></i> Helpful (${q.helpful || 0})
                    </button>
                </div>
                ${answerForm}
            </div>
        `;
    }

    function formatTimeAgo(timestamp) {
        if (!timestamp) return '';
        let date;
        if (timestamp.toDate) date = timestamp.toDate();
        else if (typeof timestamp === 'string') date = new Date(timestamp);
        else date = new Date(timestamp);

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 30) return diffDays + 'd ago';
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // Internal handlers exposed for onclick
    function _openAskModal() {
        const modal = document.getElementById('qaAskModal');
        if (modal) modal.classList.add('show');
    }

    function _closeAskModal() {
        const modal = document.getElementById('qaAskModal');
        if (modal) modal.classList.remove('show');
        const input = document.getElementById('qaQuestionInput');
        if (input) input.value = '';
    }

    function _toggleAnswerForm(questionId) {
        const form = document.getElementById('answerForm_' + questionId);
        if (form) {
            const isVisible = form.style.display !== 'none';
            form.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                form.querySelector('input')?.focus();
            }
        }
    }

    async function _submitQuestion(productId, productName, sellerId) {
        const input = document.getElementById('qaQuestionInput');
        const text = input?.value?.trim();
        if (!text) return;

        try {
            await askQuestion({ productId, productName, sellerId, questionText: text });
            _closeAskModal();
            // Reload questions
            if (typeof window._reloadProductQA === 'function') window._reloadProductQA();
        } catch (err) {
            console.error('Failed to ask question:', err);
            alert(err.message || 'Failed to submit question');
        }
    }

    async function _submitAnswer(questionId) {
        const input = document.getElementById('answerInput_' + questionId);
        const text = input?.value?.trim();
        if (!text) return;

        try {
            await answerQuestion(questionId, text);
            input.value = '';
            // Reload questions
            if (typeof window._reloadProductQA === 'function') window._reloadProductQA();
        } catch (err) {
            console.error('Failed to answer:', err);
            alert(err.message || 'Failed to submit answer');
        }
    }

    async function _markHelpful(questionId) {
        try {
            await markHelpful(questionId);
            const card = document.querySelector(`[data-qa-id="${questionId}"]`);
            if (card) {
                const btn = card.querySelector('.qa-action-btn:last-child');
                if (btn) {
                    const count = parseInt(btn.textContent.match(/\d+/)?.[0] || '0') + 1;
                    btn.innerHTML = `<i class="fas fa-thumbs-up"></i> Helpful (${count})`;
                }
            }
        } catch (err) {
            console.error('Failed to mark helpful:', err);
        }
    }

    // Expose module
    window.ProductQA = {
        init,
        askQuestion,
        answerQuestion,
        loadQuestions,
        markHelpful,
        renderQASection,
        _openAskModal,
        _closeAskModal,
        _toggleAnswerForm,
        _submitQuestion,
        _submitAnswer,
        _markHelpful
    };
})();
