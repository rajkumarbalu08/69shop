/**
 * 69Shop.in - XSS Input Sanitization Utility
 * Prevents Cross-Site Scripting attacks on all user inputs
 *
 * Usage:
 *   <script src="/js/xss-sanitizer.js"></script>
 *   // Auto-initializes on DOMContentLoaded
 *   // Manual: XSSSanitizer.sanitize(userInput)
 */
(function(global) {
    'use strict';

    const HTML_ENTITY_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#96;'
    };

    const DANGEROUS_PATTERNS = [
        /javascript\s*:/gi,
        /on\w+\s*=/gi,
        /data\s*:\s*text\/html/gi,
        /vbscript\s*:/gi,
        /expression\s*\(/gi
    ];

    /**
     * Escapes HTML special characters to prevent XSS
     */
    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"'\/`]/g, function(char) {
            return HTML_ENTITY_MAP[char];
        });
    }

    /**
     * Strips dangerous HTML tags and attributes
     */
    function stripDangerousTags(str) {
        if (typeof str !== 'string') return str;
        // Remove script, iframe, object, embed, link, style tags
        str = str.replace(/<\s*\/?\s*(script|iframe|object|embed|link|style|form|base)[^>]*>/gi, '');
        // Remove event handlers from any remaining tags
        str = str.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
        str = str.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
        return str;
    }

    /**
     * Removes dangerous URI schemes
     */
    function sanitizeURI(str) {
        if (typeof str !== 'string') return str;
        for (var i = 0; i < DANGEROUS_PATTERNS.length; i++) {
            str = str.replace(DANGEROUS_PATTERNS[i], '');
        }
        return str;
    }

    /**
     * Full sanitization: escape HTML + strip dangerous content
     */
    function sanitize(input) {
        if (typeof input !== 'string') return input;
        if (!input.trim()) return input;
        var result = stripDangerousTags(input);
        result = sanitizeURI(result);
        result = escapeHTML(result);
        return result;
    }

    /**
     * Light sanitization: only strip dangerous tags/patterns, keep HTML entities
     * Use for content that may contain safe HTML (e.g., product descriptions from sellers)
     */
    function sanitizeLight(input) {
        if (typeof input !== 'string') return input;
        var result = stripDangerousTags(input);
        result = sanitizeURI(result);
        return result;
    }

    /**
     * Sanitize a plain text field (no HTML allowed)
     */
    function sanitizePlainText(input) {
        if (typeof input !== 'string') return input;
        return escapeHTML(input.trim());
    }

    /**
     * Sanitize a URL input
     */
    function sanitizeURL(url) {
        if (typeof url !== 'string') return '';
        url = url.trim();
        // Only allow http, https, mailto protocols
        if (!/^(https?:\/\/|mailto:|\/|#)/i.test(url)) {
            return '';
        }
        return sanitizeURI(url);
    }

    /**
     * Sanitize an object's string values recursively
     */
    function sanitizeObject(obj) {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'string') return sanitize(obj);
        if (Array.isArray(obj)) {
            return obj.map(function(item) { return sanitizeObject(item); });
        }
        if (typeof obj === 'object') {
            var sanitized = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    }

    /**
     * Auto-sanitize all form inputs on submit
     */
    function protectForms() {
        document.addEventListener('submit', function(e) {
            var form = e.target;
            if (!form || form.tagName !== 'FORM') return;

            var inputs = form.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], input:not([type]), textarea');
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                if (input.value) {
                    input.value = stripDangerousTags(sanitizeURI(input.value));
                }
            }
        }, true);
    }

    /**
     * Sanitize innerHTML assignments (monkey-patch for safety)
     * Call this to wrap a specific element's innerHTML setter
     */
    function protectElement(element) {
        if (!element || !element.nodeType) return;
        var originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (!originalInnerHTML) return;

        Object.defineProperty(element, 'innerHTML', {
            set: function(value) {
                var sanitized = sanitizeLight(value);
                originalInnerHTML.set.call(this, sanitized);
            },
            get: function() {
                return originalInnerHTML.get.call(this);
            }
        });
    }

    /**
     * Initialize auto-protection
     */
    function init() {
        protectForms();

        // Add paste sanitization to inputs
        document.addEventListener('paste', function(e) {
            var target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                var clipboardData = e.clipboardData || window.clipboardData;
                if (clipboardData) {
                    var text = clipboardData.getData('text/plain');
                    if (text && text !== stripDangerousTags(sanitizeURI(text))) {
                        e.preventDefault();
                        var clean = stripDangerousTags(sanitizeURI(text));
                        document.execCommand('insertText', false, clean);
                    }
                }
            }
        }, true);
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API
    global.XSSSanitizer = {
        sanitize: sanitize,
        sanitizeLight: sanitizeLight,
        sanitizePlainText: sanitizePlainText,
        sanitizeURL: sanitizeURL,
        sanitizeObject: sanitizeObject,
        escapeHTML: escapeHTML,
        stripDangerousTags: stripDangerousTags,
        protectElement: protectElement
    };

})(window);
