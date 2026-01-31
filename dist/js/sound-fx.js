/**
 * 69SHOP.IN - Sound Effects System
 * Subtle audio feedback for user interactions
 */

(function() {
    'use strict';

    const SoundFX = {
        config: {
            enabled: true,
            volume: 0.3,
            muted: false,
            storageKey: '69shop_sound_enabled'
        },

        // Audio context and buffers
        audioContext: null,
        sounds: {},
        oscillators: {},

        /**
         * Sound definitions using Web Audio API
         * These are generated programmatically - no external files needed
         */
        soundDefs: {
            // Add to cart - satisfying pop
            addToCart: {
                type: 'pop',
                frequency: 600,
                duration: 0.15,
                attack: 0.01,
                decay: 0.14
            },
            
            // Remove from cart - subtle woosh down
            removeFromCart: {
                type: 'woosh',
                frequency: 400,
                endFrequency: 200,
                duration: 0.2
            },
            
            // Click/tap - subtle tick
            click: {
                type: 'tick',
                frequency: 1200,
                duration: 0.05
            },
            
            // Hover - very subtle
            hover: {
                type: 'tick',
                frequency: 800,
                duration: 0.03,
                volume: 0.1
            },
            
            // Success - cheerful ding
            success: {
                type: 'chime',
                frequencies: [523, 659, 784], // C5, E5, G5
                duration: 0.4
            },
            
            // Error - gentle buzz
            error: {
                type: 'buzz',
                frequency: 200,
                duration: 0.3
            },
            
            // Notification - soft bell
            notification: {
                type: 'bell',
                frequency: 880,
                duration: 0.5
            },
            
            // Checkout - celebratory
            checkout: {
                type: 'fanfare',
                frequencies: [523, 587, 659, 784],
                duration: 0.6
            },
            
            // Toggle switch
            toggle: {
                type: 'switch',
                frequency: 500,
                duration: 0.08
            },
            
            // Wishlist heart
            wishlist: {
                type: 'heartbeat',
                frequency: 300,
                duration: 0.3
            },
            
            // Scroll snap
            scroll: {
                type: 'tick',
                frequency: 600,
                duration: 0.02,
                volume: 0.05
            },
            
            // Modal open
            modalOpen: {
                type: 'woosh',
                frequency: 300,
                endFrequency: 500,
                duration: 0.15
            },
            
            // Modal close
            modalClose: {
                type: 'woosh',
                frequency: 500,
                endFrequency: 300,
                duration: 0.12
            }
        },

        /**
         * Initialize sound system
         */
        init() {
            // Load preference from storage
            const savedPref = localStorage.getItem(this.config.storageKey);
            if (savedPref !== null) {
                this.config.enabled = savedPref === 'true';
            }

            // Create audio context on first user interaction
            this.setupUserInteractionHandler();
            
            // Bind to common events
            this.bindEvents();
            
            // Create toggle UI
            this.createSoundToggle();
            
            console.log(`🔊 SoundFX initialized (${this.config.enabled ? 'enabled' : 'disabled'})`);
        },

        /**
         * Setup audio context on user interaction
         */
        setupUserInteractionHandler() {
            const initAudio = () => {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                document.removeEventListener('click', initAudio);
                document.removeEventListener('touchstart', initAudio);
            };

            document.addEventListener('click', initAudio, { once: true });
            document.addEventListener('touchstart', initAudio, { once: true });
        },

        /**
         * Play a sound
         */
        play(soundName, options = {}) {
            if (!this.config.enabled || this.config.muted) return;
            if (!this.audioContext) return;
            
            const soundDef = this.soundDefs[soundName];
            if (!soundDef) return;

            try {
                const volume = (options.volume ?? soundDef.volume ?? this.config.volume);
                
                switch (soundDef.type) {
                    case 'pop':
                        this.playPop(soundDef, volume);
                        break;
                    case 'tick':
                        this.playTick(soundDef, volume);
                        break;
                    case 'woosh':
                        this.playWoosh(soundDef, volume);
                        break;
                    case 'chime':
                        this.playChime(soundDef, volume);
                        break;
                    case 'buzz':
                        this.playBuzz(soundDef, volume);
                        break;
                    case 'bell':
                        this.playBell(soundDef, volume);
                        break;
                    case 'fanfare':
                        this.playFanfare(soundDef, volume);
                        break;
                    case 'switch':
                        this.playSwitch(soundDef, volume);
                        break;
                    case 'heartbeat':
                        this.playHeartbeat(soundDef, volume);
                        break;
                    default:
                        this.playTick(soundDef, volume);
                }
            } catch (error) {
                // Silently fail - sounds are enhancement only
            }
        },

        /**
         * Pop sound - for add to cart
         */
        playPop(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(def.frequency, now);
            osc.frequency.exponentialRampToValueAtTime(def.frequency * 1.5, now + def.attack);
            osc.frequency.exponentialRampToValueAtTime(def.frequency * 0.5, now + def.duration);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + def.attack);
            gain.gain.exponentialRampToValueAtTime(0.001, now + def.duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + def.duration);
        },

        /**
         * Tick sound - subtle click
         */
        playTick(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(def.frequency, now);
            
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + def.duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + def.duration);
        },

        /**
         * Woosh sound - for transitions
         */
        playWoosh(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // White noise filtered
            const bufferSize = ctx.sampleRate * def.duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(def.frequency, now);
            filter.frequency.linearRampToValueAtTime(def.endFrequency, now + def.duration);
            filter.Q.value = 1;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + def.duration);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            noise.start(now);
            noise.stop(now + def.duration);
        },

        /**
         * Chime sound - for success
         */
        playChime(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            def.frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                
                const startTime = now + (i * 0.1);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + def.duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(startTime);
                osc.stop(startTime + def.duration);
            });
        },

        /**
         * Buzz sound - for errors
         */
        playBuzz(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(def.frequency, now);
            
            // Vibrato
            const vibrato = ctx.createOscillator();
            const vibratoGain = ctx.createGain();
            vibrato.frequency.value = 20;
            vibratoGain.gain.value = 10;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibrato.start(now);
            vibrato.stop(now + def.duration);
            
            gain.gain.setValueAtTime(volume * 0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + def.duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + def.duration);
        },

        /**
         * Bell sound - for notifications
         */
        playBell(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(def.frequency, now);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(def.frequency * 2.4, now); // Harmonic
            
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + def.duration);
            
            const gain2 = ctx.createGain();
            gain2.gain.value = 0.3;
            
            osc1.connect(gain);
            osc2.connect(gain2);
            gain2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + def.duration);
            osc2.stop(now + def.duration);
        },

        /**
         * Fanfare - for checkout success
         */
        playFanfare(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            def.frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                
                const startTime = now + (i * 0.12);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.03);
                gain.gain.setValueAtTime(volume * 0.6, startTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + def.duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(startTime);
                osc.stop(startTime + def.duration);
            });
        },

        /**
         * Switch sound - for toggles
         */
        playSwitch(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(def.frequency, now);
            osc.frequency.setValueAtTime(def.frequency * 1.2, now + def.duration / 2);
            
            gain.gain.setValueAtTime(volume * 0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + def.duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + def.duration);
        },

        /**
         * Heartbeat - for wishlist
         */
        playHeartbeat(def, volume) {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // Two beats
            [0, 0.15].forEach(delay => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(def.frequency, now + delay);
                osc.frequency.exponentialRampToValueAtTime(def.frequency * 0.8, now + delay + 0.1);
                
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(volume, now + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(now + delay);
                osc.stop(now + delay + 0.15);
            });
        },

        /**
         * Bind to common events
         */
        bindEvents() {
            // Add to cart buttons
            document.addEventListener('click', (e) => {
                const target = e.target;
                
                // Add to cart
                if (target.closest('.add-to-cart, .btn-add-cart, [data-action="add-to-cart"]')) {
                    this.play('addToCart');
                }
                
                // Remove from cart
                if (target.closest('.remove-item, .btn-remove, [data-action="remove"]')) {
                    this.play('removeFromCart');
                }
                
                // Wishlist
                if (target.closest('.wishlist-btn, .btn-wishlist, [data-action="wishlist"]')) {
                    this.play('wishlist');
                }
                
                // Checkout
                if (target.closest('.checkout-btn, .btn-checkout, [data-action="checkout"]')) {
                    this.play('checkout');
                }
                
                // Toggle switches
                if (target.closest('input[type="checkbox"], .toggle-switch')) {
                    this.play('toggle');
                }
                
                // General buttons (subtle)
                if (target.closest('button, .btn') && !target.closest('[data-no-sound]')) {
                    // Don't double-play for specific actions
                    if (!target.closest('.add-to-cart, .wishlist-btn, .checkout-btn, .remove-item')) {
                        this.play('click');
                    }
                }
            });

            // Success/Error notifications
            const originalShowNotification = window.showNotification;
            if (typeof originalShowNotification === 'function') {
                window.showNotification = (message, type) => {
                    if (type === 'success') this.play('success');
                    else if (type === 'error') this.play('error');
                    else this.play('notification');
                    return originalShowNotification(message, type);
                };
            }

            // Modal events
            document.addEventListener('modalOpen', () => this.play('modalOpen'));
            document.addEventListener('modalClose', () => this.play('modalClose'));
        },

        /**
         * Create sound toggle UI
         */
        createSoundToggle() {
            const toggle = document.createElement('div');
            toggle.className = 'sound-toggle';
            toggle.id = 'soundToggle';
            toggle.innerHTML = `
                <button class="sound-toggle-btn" title="Toggle sounds">
                    <i class="fas ${this.config.enabled ? 'fa-volume-up' : 'fa-volume-mute'}"></i>
                </button>
            `;
            
            toggle.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                z-index: 1000;
            `;
            
            const btnStyle = `
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: none;
                background: var(--white, #fff);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
                cursor: pointer;
                color: var(--primary-black, #1A1A1A);
                font-size: 1rem;
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(toggle);
            
            const btn = toggle.querySelector('button');
            btn.style.cssText = btnStyle;
            
            btn.addEventListener('click', () => {
                this.config.enabled = !this.config.enabled;
                localStorage.setItem(this.config.storageKey, this.config.enabled);
                btn.innerHTML = `<i class="fas ${this.config.enabled ? 'fa-volume-up' : 'fa-volume-mute'}"></i>`;
                
                if (this.config.enabled) {
                    this.play('toggle');
                }
            });
        },

        /**
         * Enable/disable sounds
         */
        setEnabled(enabled) {
            this.config.enabled = enabled;
            localStorage.setItem(this.config.storageKey, enabled);
        },

        /**
         * Mute/unmute (temporary)
         */
        setMuted(muted) {
            this.config.muted = muted;
        },

        /**
         * Set volume (0-1)
         */
        setVolume(volume) {
            this.config.volume = Math.max(0, Math.min(1, volume));
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SoundFX.init());
    } else {
        SoundFX.init();
    }

    // Expose globally
    window.SoundFX = SoundFX;

})();
