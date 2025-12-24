(function() {
    'use strict';

    class VirstackAIWebUIWidget {
        constructor(config = {}) {
            this.config = {
                tokenUrl: config.tokenUrl || '',
                agentImageUrl: config.agentImageUrl || 'https://static2.typecast.ai/ta_preset/images/female_training.jpg',
                title: config.title || 'Talk to Our AI Agent',
                description: config.description || 'Need help? Our AI assistant is here to provide fast and accurate support. Call now and get instant assistance!',
                containerId: config.containerId || null,
                primaryColor: config.primaryColor || '#0ea5e9',
                secondaryColor: config.secondaryColor || '#0284c7',
                ...config
            };

            this.virstackWebClient = null;
            this.isCallActive = false;
            this.elements = {};

            this.init();
        }

        init() {
            this.injectStyles();
            this.createWidget();
            this.attachEventListeners();
        }

        injectStyles() {
            const styleId = 'virstack-widget-styles';
            if (document.getElementById(styleId)) return;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .virstack-widget {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .virstack-widget * {
                    box-sizing: border-box;
                }
                .virstack-card {
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    // max-width: 520px;
                    width: 100%;
                    transition: box-shadow 0.3s ease;
                }
                .virstack-card:hover {
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);
                }
                .virstack-card.active {
                    box-shadow: 0 8px 32px rgba(14, 165, 233, 0.2), 0 2px 4px rgba(0, 0, 0, 0.06);
                }
                .virstack-agent-image-container {
                    flex-shrink: 0;
                    position: relative;
                }
                .virstack-agent-image {
                    width: 120px;
                    height: 140px;
                    border-radius: 12px;
                    object-fit: cover;
                    display: block;
                }
                .virstack-agent-placeholder {
                    width: 120px;
                    height: 140px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                }
                .virstack-speaking-indicator {
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--virstack-primary, #0ea5e9);
                    padding: 4px 12px;
                    border-radius: 12px;
                    display: flex;
                    gap: 3px;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .virstack-speaking-indicator.active {
                    opacity: 1;
                }
                .virstack-speaking-bar {
                    width: 3px;
                    background: white;
                    border-radius: 2px;
                    animation: virstack-voice-activity 0.6s ease-in-out infinite alternate;
                }
                .virstack-speaking-bar:nth-child(1) { height: 8px; animation-delay: 0s; }
                .virstack-speaking-bar:nth-child(2) { height: 14px; animation-delay: 0.1s; }
                .virstack-speaking-bar:nth-child(3) { height: 10px; animation-delay: 0.2s; }
                .virstack-speaking-bar:nth-child(4) { height: 14px; animation-delay: 0.3s; }
                .virstack-speaking-bar:nth-child(5) { height: 8px; animation-delay: 0.4s; }
                @keyframes virstack-voice-activity {
                    0% { transform: scaleY(0.4); opacity: 0.7; }
                    100% { transform: scaleY(1); opacity: 1; }
                }
                .virstack-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .virstack-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    line-height: 1.3;
                }
                .virstack-description {
                    font-size: 14px;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.5;
                }
                .virstack-divider {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 4px 0;
                }
                .virstack-button-container {
                    display: flex;
                    justify-content: flex-end;
                }
                .virstack-call-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, var(--virstack-primary, #0ea5e9) 0%, var(--virstack-secondary, #0284c7) 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 24px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
                }
                .virstack-call-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
                }
                .virstack-call-button:active {
                    transform: translateY(0);
                }
                .virstack-call-button.connecting {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                }
                .virstack-call-button.active {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }
                .virstack-call-button.active:hover {
                    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
                }
                .virstack-call-icon {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                .virstack-status-text {
                    font-size: 12px;
                    color: #64748b;
                    text-align: right;
                    min-height: 18px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .virstack-status-text.show { opacity: 1; }
                .virstack-status-text.connected { color: #22c55e; }
                .virstack-status-text.connecting { color: #f59e0b; }
                .virstack-status-text.error { color: #ef4444; }
                @media (max-width: 520px) {
                    .virstack-card {
                        flex-direction: column;
                        text-align: center;
                    }
                    .virstack-button-container { justify-content: center; }
                    .virstack-status-text { text-align: center; }
                }
            `;
            document.head.appendChild(style);
        }

        createWidget() {
            const wrapper = document.createElement('div');
            wrapper.className = 'virstack-widget';
            wrapper.style.setProperty('--virstack-primary', this.config.primaryColor);
            wrapper.style.setProperty('--virstack-secondary', this.config.secondaryColor);

            const imageElement = this.config.agentImageUrl
                ? `<img src="${this.config.agentImageUrl}" alt="AI Agent" class="virstack-agent-image">`
                : `<div class="virstack-agent-placeholder">🤖</div>`;

            wrapper.innerHTML = `
                <div class="virstack-card">
                    <div class="virstack-agent-image-container">
                        ${imageElement}
                        <div class="virstack-speaking-indicator">
                            <div class="virstack-speaking-bar"></div>
                            <div class="virstack-speaking-bar"></div>
                            <div class="virstack-speaking-bar"></div>
                            <div class="virstack-speaking-bar"></div>
                            <div class="virstack-speaking-bar"></div>
                        </div>
                    </div>
                    <div class="virstack-content">
                        <h3 class="virstack-title">${this.config.title}</h3>
                        <p class="virstack-description">${this.config.description}</p>
                        <div class="virstack-divider"></div>
                        <div class="virstack-button-container">
                            <button class="virstack-call-button">
                                <svg class="virstack-call-icon" viewBox="0 0 24 24">
                                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                                </svg>
                                <span class="virstack-button-text">Call Now</span>
                            </button>
                        </div>
                        <div class="virstack-status-text"></div>
                    </div>
                </div>
            `;

            // If containerId is provided, insert INTO that container
            // Otherwise append to body
            if (this.config.containerId) {
                const targetContainer = document.getElementById(this.config.containerId);
                if (targetContainer) {
                    targetContainer.appendChild(wrapper);
                } else {
                    console.error('Virstack Widget: Container not found:', this.config.containerId);
                    document.body.appendChild(wrapper);
                }
            } else {
                document.body.appendChild(wrapper);
            }

            this.elements = {
                container: wrapper,
                card: wrapper.querySelector('.virstack-card'),
                callButton: wrapper.querySelector('.virstack-call-button'),
                buttonText: wrapper.querySelector('.virstack-button-text'),
                callIcon: wrapper.querySelector('.virstack-call-icon'),
                speakingIndicator: wrapper.querySelector('.virstack-speaking-indicator'),
                statusText: wrapper.querySelector('.virstack-status-text')
            };
        }

        attachEventListeners() {
            this.elements.callButton.addEventListener('click', () => this.toggleCall());
            window.addEventListener('beforeunload', () => {
                if (this.isCallActive && this.virstackWebClient) {
                    this.virstackWebClient.stopCall();
                }
            });
        }

        showStatus(message, type = 'default', duration = 3000) {
            this.elements.statusText.textContent = message;
            this.elements.statusText.className = 'virstack-status-text show';
            if (type !== 'default') this.elements.statusText.classList.add(type);
            if (duration > 0) {
                setTimeout(() => this.elements.statusText.classList.remove('show'), duration);
            }
        }

        updateButtonState(state) {
            const button = this.elements.callButton;
            const buttonText = this.elements.buttonText;
            const icon = this.elements.callIcon;
            button.classList.remove('connecting', 'active');

            switch (state) {
                case 'idle':
                    buttonText.textContent = 'Call Now';
                    icon.innerHTML = '<path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>';
                    break;
                case 'connecting':
                    button.classList.add('connecting');
                    buttonText.textContent = 'Connecting...';
                    break;
                case 'active':
                    button.classList.add('active');
                    buttonText.textContent = 'End Call';
                    icon.innerHTML = '<path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>';
                    break;
            }
        }

        async fetchAccessToken() {
            if (!this.config.tokenUrl) throw new Error('Token URL not configured');
            const response = await fetch(this.config.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`Failed to fetch token: ${response.status}`);
            const data = await response.json();
            const token = data.accessToken || data.token || data.access_token;
            if (!token) throw new Error('No token found in response');
            return token;
        }

        async toggleCall() {
            if (this.isCallActive) this.endCall();
            else await this.startCall();
        }

        async startCall() {
            if (this.isCallActive) return;
            if (!this.config.tokenUrl) {
                this.showStatus('Token URL not configured', 'error');
                return;
            }

            try {
                this.updateButtonState('connecting');
                this.showStatus('Authenticating...', 'connecting', 10000);
                const accessToken = await this.fetchAccessToken();
                this.showStatus('Connecting...', 'connecting', 10000);

                if (!window.VirstackAIWebClient) throw new Error('VirstackAIWebClient library not loaded');

                this.virstackWebClient = new window.VirstackAIWebClient.VirstackAIWebClient();

                this.virstackWebClient.on('call_started', () => {
                    this.isCallActive = true;
                    this.updateButtonState('active');
                    this.elements.card.classList.add('active');
                    this.showStatus('Connected - Listening', 'connected', 2000);
                });

                this.virstackWebClient.on('error', () => {
                    this.resetCallState();
                    this.showStatus('Connection failed', 'error');
                });

                this.virstackWebClient.on('disconnected', () => {
                    this.resetCallState();
                    this.showStatus('Call ended', 'default');
                });

                this.virstackWebClient.on('call_ended', () => {
                    this.resetCallState();
                    this.showStatus('Call ended', 'default');
                });

                this.virstackWebClient.on('hangup', () => {
                    this.resetCallState();
                    this.showStatus('Call ended', 'default');
                });

                this.virstackWebClient.on('agent_started_speaking', () => this.showSpeaking());
                this.virstackWebClient.on('agent_stopped_speaking', () => this.hideSpeaking());
                this.virstackWebClient.on('user_started_speaking', () => this.showSpeaking());
                this.virstackWebClient.on('user_stopped_speaking', () => this.hideSpeaking());
                this.virstackWebClient.on('ai_speaking_start', () => this.showSpeaking());
                this.virstackWebClient.on('ai_speaking_end', () => this.hideSpeaking());

                await this.virstackWebClient.startCall({ accessToken });

            } catch (error) {
                console.error('Virstack: Error starting call:', error);
                this.resetCallState();
                this.showStatus(error.message.includes('token') ? 'Failed to get access token' : 'Failed to connect', 'error');
            }
        }

        endCall() {
            if (!this.isCallActive) return;
            try {
                if (this.virstackWebClient) this.virstackWebClient.stopCall();
                this.resetCallState();
                this.showStatus('Call ended', 'default');
            } catch (error) {
                this.resetCallState();
            }
        }

        resetCallState() {
            this.isCallActive = false;
            this.updateButtonState('idle');
            this.elements.card.classList.remove('active');
            this.hideSpeaking();
        }

        showSpeaking() { this.elements.speakingIndicator.classList.add('active'); }
        hideSpeaking() { this.elements.speakingIndicator.classList.remove('active'); }

        destroy() {
            if (this.isCallActive) this.endCall();
            if (this.elements.container) this.elements.container.remove();
        }
    }

    function autoInit() {
        const scripts = document.querySelectorAll('script[data-virstack-widget]');
        scripts.forEach(script => {
            new VirstackAIWebUIWidget({
                tokenUrl: script.getAttribute('data-token-url') || '',
                agentImageUrl: script.getAttribute('data-agent-image-url') || 'https://static2.typecast.ai/ta_preset/images/female_training.jpg',
                title: script.getAttribute('data-title') || 'Talk to Our AI Agent',
                description: script.getAttribute('data-description') || 'Need help? Our AI assistant is here to provide fast and accurate support. Call now and get instant assistance!',
                containerId: script.getAttribute('data-container-id') || null,
                primaryColor: script.getAttribute('data-primary-color') || '#0ea5e9',
                secondaryColor: script.getAttribute('data-secondary-color') || '#0284c7'
            });
        });
    }

    window.VirstackAIWebUIWidget = VirstackAIWebUIWidget;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
})();
