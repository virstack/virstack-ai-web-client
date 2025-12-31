var VirstackAIWebUIWidget = (() => {
  // virstack_ai_web_ui.js
  (function() {
    "use strict";
    class VirstackAIWebUIWidget {
      constructor(config = {}) {
        this.config = {
          tokenUrl: config.tokenUrl || "",
          iconUrl: config.iconUrl || "",
          iconEmoji: config.iconEmoji || "\u{1F916}",
          position: config.position || "bottom-right",
          primaryColor: config.primaryColor || "#667eea",
          secondaryColor: config.secondaryColor || "#764ba2",
          buttonSize: config.buttonSize || 70,
          activeButtonSize: config.activeButtonSize || config.buttonSize * 1.2 || 84,
          ...config
        };
        this.virstackWebClient = null;
        this.isCallActive = false;
        this.elements = {};
        this.cachedToken = null;
        this.init();
      }
      init() {
        this.injectStyles();
        this.createWidget();
        this.attachEventListeners();
        this.showInitialHint();
      }
      injectStyles() {
        const styleId = "virstack-widget-styles";
        if (document.getElementById(styleId)) return;
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
                .virstack-widget {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .virstack-widget.position-bottom-left {
                    left: 24px;
                    right: auto;
                }

                .virstack-widget.position-top-right {
                    top: 24px;
                    bottom: auto;
                }

                .virstack-widget.position-top-left {
                    top: 24px;
                    left: 24px;
                    bottom: auto;
                    right: auto;
                }

                .virstack-widget-button {
                    width: var(--virstack-button-size, 70px);
                    height: var(--virstack-button-size, 70px);
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--virstack-primary, #667eea) 0%, var(--virstack-secondary, #764ba2) 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: visible;
                }

                /* When using image icon, hide the gradient background */
                .virstack-widget-button.has-image-icon {
                    background: transparent;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .virstack-widget-button.has-image-icon:hover {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                }

                .virstack-widget-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                }

                .virstack-widget-button.active {
                    width: var(--virstack-active-button-size, 84px);
                    height: var(--virstack-active-button-size, 84px);
                }

                /* Emoji icon styles */
                .virstack-widget-icon-emoji {
                    font-size: calc(var(--virstack-button-size, 70px) * 0.45);
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 2;
                    line-height: 1;
                }

                .virstack-widget-button.active .virstack-widget-icon-emoji {
                    font-size: calc(var(--virstack-active-button-size, 84px) * 0.45);
                }

                /* Image icon styles - fills the button as a circle */
                .virstack-widget-icon-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: all 0.3s ease;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 2;
                    border-radius: 50%;
                    pointer-events: none;
                }

                .virstack-widget-button.active .virstack-widget-icon-image {
                    width: 100%;
                    height: 100%;
                }

                /* Hide icon when voice bars are active */
                .virstack-widget-button .virstack-voice-bars.active ~ .virstack-widget-icon-emoji,
                .virstack-widget-button .virstack-voice-bars.active ~ .virstack-widget-icon-image {
                    opacity: 0;
                }

                .virstack-widget-button::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--virstack-primary, #667eea) 0%, var(--virstack-secondary, #764ba2) 100%);
                    animation: virstack-pulse 1.5s ease-out infinite;
                    z-index: 0;
                }

                .virstack-widget-button.active::before,
                .virstack-widget-button.connecting::before,
                .virstack-widget-button.has-image-icon::before {
                    display: none;
                }

                @keyframes virstack-pulse {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.7;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.8);
                        opacity: 0;
                    }
                }

                .virstack-siri-waves {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    display: none;
                }

                .virstack-widget-button.active .virstack-siri-waves {
                    display: block;
                }

                .virstack-wave-circle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    border: 2px solid rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    animation: virstack-wave-expand 2s ease-out infinite;
                }

                .virstack-wave-circle:nth-child(1) { animation-delay: 0s; }
                .virstack-wave-circle:nth-child(2) { animation-delay: 0.4s; }
                .virstack-wave-circle:nth-child(3) { animation-delay: 0.8s; }
                .virstack-wave-circle:nth-child(4) { animation-delay: 1.2s; }

                @keyframes virstack-wave-expand {
                    0% {
                        width: var(--virstack-active-button-size, 84px);
                        height: var(--virstack-active-button-size, 84px);
                        opacity: 0.8;
                    }
                    100% {
                        width: calc(var(--virstack-active-button-size, 84px) * 2);
                        height: calc(var(--virstack-active-button-size, 84px) * 2);
                        opacity: 0;
                    }
                }

                .virstack-voice-bars {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    gap: 3px;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 3;
                }

                .virstack-voice-bars.active {
                    opacity: 1;
                }

                .virstack-voice-bar {
                    width: calc(var(--virstack-button-size, 70px) * 0.045);
                    background: white;
                    border-radius: 2px;
                    animation: virstack-voice-activity 0.6s ease-in-out infinite alternate;
                }

                .virstack-voice-bar:nth-child(1) { height: calc(var(--virstack-button-size, 70px) * 0.18); animation-delay: 0s; }
                .virstack-voice-bar:nth-child(2) { height: calc(var(--virstack-button-size, 70px) * 0.30); animation-delay: 0.1s; }
                .virstack-voice-bar:nth-child(3) { height: calc(var(--virstack-button-size, 70px) * 0.42); animation-delay: 0.2s; }
                .virstack-voice-bar:nth-child(4) { height: calc(var(--virstack-button-size, 70px) * 0.30); animation-delay: 0.3s; }
                .virstack-voice-bar:nth-child(5) { height: calc(var(--virstack-button-size, 70px) * 0.18); animation-delay: 0.4s; }

                @keyframes virstack-voice-activity {
                    0% {
                        transform: scaleY(0.3);
                        opacity: 0.6;
                    }
                    100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                }

                .virstack-status-tooltip {
                    position: absolute;
                    bottom: 100%;
                    right: 0;
                    margin-bottom: 12px;
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 13px;
                    white-space: nowrap;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s ease;
                    pointer-events: none;
                    backdrop-filter: blur(10px);
                }

                .virstack-status-tooltip.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .virstack-status-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    right: 20px;
                    border: 6px solid transparent;
                    border-top-color: rgba(0, 0, 0, 0.85);
                }

                .virstack-end-call-button {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(10px);
                    margin-bottom: 16px;
                    background: #ff3b30;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 24px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                    box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
                    white-space: nowrap;
                }

                .virstack-end-call-button.show {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                    pointer-events: auto;
                }

                .virstack-end-call-button:hover {
                    background: #ff2d21;
                    box-shadow: 0 6px 16px rgba(255, 59, 48, 0.4);
                }

                .virstack-widget-button.connecting {
                    animation: virstack-connecting-pulse 1.5s ease-in-out infinite;
                }

                @keyframes virstack-connecting-pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                }
            `;
        document.head.appendChild(style);
      }
      isImageUrl(url) {
        if (!url) return false;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
          return true;
        }
        const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp"];
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
      }
      createIconElement() {
        const iconUrl = this.config.iconUrl;
        if (this.isImageUrl(iconUrl)) {
          const img = document.createElement("img");
          img.src = iconUrl;
          img.alt = "AI Assistant";
          img.className = "virstack-widget-icon-image";
          img.id = "virstackWidgetIcon";
          img.draggable = false;
          img.onerror = () => {
            console.warn("Virstack Widget: Failed to load icon image, falling back to emoji");
            const parent = img.parentElement;
            if (parent) {
              const emoji = document.createElement("span");
              emoji.className = "virstack-widget-icon-emoji";
              emoji.id = "virstackWidgetIcon";
              emoji.textContent = this.config.iconEmoji;
              parent.replaceChild(emoji, img);
              this.elements.icon = emoji;
              if (this.elements.button) {
                this.elements.button.classList.remove("has-image-icon");
              }
            }
          };
          return img.outerHTML;
        } else if (iconUrl) {
          return `<span class="virstack-widget-icon-emoji" id="virstackWidgetIcon">${iconUrl}</span>`;
        } else {
          return `<span class="virstack-widget-icon-emoji" id="virstackWidgetIcon">${this.config.iconEmoji}</span>`;
        }
      }
      createWidget() {
        const container = document.createElement("div");
        container.className = `virstack-widget position-${this.config.position}`;
        container.style.setProperty("--virstack-primary", this.config.primaryColor);
        container.style.setProperty("--virstack-secondary", this.config.secondaryColor);
        container.style.setProperty("--virstack-button-size", `${this.config.buttonSize}px`);
        container.style.setProperty("--virstack-active-button-size", `${this.config.activeButtonSize}px`);
        const iconElement = this.createIconElement();
        container.innerHTML = `
                <div class="virstack-status-tooltip" id="virstackStatusTooltip"></div>
                <button class="virstack-end-call-button" id="virstackEndCallBtn">End Call</button>
                
                <button class="virstack-widget-button" id="virstackWidgetButton">
                    <div class="virstack-siri-waves">
                        <div class="virstack-wave-circle"></div>
                        <div class="virstack-wave-circle"></div>
                        <div class="virstack-wave-circle"></div>
                        <div class="virstack-wave-circle"></div>
                    </div>
                    
                    <div class="virstack-voice-bars" id="virstackVoiceBars">
                        <div class="virstack-voice-bar"></div>
                        <div class="virstack-voice-bar"></div>
                        <div class="virstack-voice-bar"></div>
                        <div class="virstack-voice-bar"></div>
                        <div class="virstack-voice-bar"></div>
                    </div>
                    
                    ${iconElement}
                </button>
            `;
        document.body.appendChild(container);
        this.elements = {
          container,
          button: document.getElementById("virstackWidgetButton"),
          icon: document.getElementById("virstackWidgetIcon"),
          voiceBars: document.getElementById("virstackVoiceBars"),
          tooltip: document.getElementById("virstackStatusTooltip"),
          endCallBtn: document.getElementById("virstackEndCallBtn")
        };
        if (this.isImageUrl(this.config.iconUrl)) {
          this.elements.button.classList.add("has-image-icon");
        }
      }
      attachEventListeners() {
        this.elements.button.addEventListener("click", () => this.toggleCall());
        this.elements.endCallBtn.addEventListener("click", () => this.endCall());
        window.addEventListener("beforeunload", () => {
          if (this.isCallActive && this.virstackWebClient) {
            this.virstackWebClient.stopCall();
          }
        });
      }
      showStatus(message, duration = 3e3) {
        this.elements.tooltip.textContent = message;
        this.elements.tooltip.classList.add("show");
        setTimeout(() => {
          this.elements.tooltip.classList.remove("show");
        }, duration);
      }
      async fetchAccessToken() {
        if (!this.config.tokenUrl) {
          throw new Error("Token URL not configured");
        }
        try {
          const response = await fetch(this.config.tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const token = data.accessToken || data.token || data.access_token;
          if (!token) {
            throw new Error('No token found in response. Expected { accessToken: "..." } or { token: "..." }');
          }
          return token;
        } catch (error) {
          console.error("Virstack Widget: Error fetching access token:", error);
          throw error;
        }
      }
      async toggleCall() {
        if (this.isCallActive) {
          this.endCall();
        } else {
          await this.startCall();
        }
      }
      async startCall() {
        if (this.isCallActive) return;
        if (!this.config.tokenUrl) {
          this.showStatus("Token URL not configured");
          console.error("Virstack Widget: Token URL is required");
          return;
        }
        try {
          this.elements.button.classList.add("connecting");
          this.showStatus("Authenticating...", 1e4);
          const accessToken = await this.fetchAccessToken();
          this.showStatus("Connecting...", 1e4);
          if (!window.VirstackAIWebClient) {
            throw new Error("VirstackAIWebClient library not loaded");
          }
          this.virstackWebClient = new window.VirstackAIWebClient.VirstackAIWebClient();
          this.virstackWebClient.on("call_started", () => {
            console.log("Virstack: Call started successfully");
            this.isCallActive = true;
            this.elements.button.classList.remove("connecting");
            this.elements.button.classList.add("active");
            this.elements.endCallBtn.classList.add("show");
            this.showStatus("Connected - Listening", 2e3);
          });
          this.virstackWebClient.on("error", (error) => {
            console.error("Virstack: Call error:", error);
            this.resetCallState();
            this.showStatus("Connection failed");
          });
          this.virstackWebClient.on("disconnected", () => {
            console.log("Virstack: Call disconnected");
            this.resetCallState();
            this.showStatus("Call ended");
          });
          this.virstackWebClient.on("call_ended", () => {
            console.log("Virstack: Call ended by AI");
            this.resetCallState();
            this.showStatus("Call ended");
          });
          this.virstackWebClient.on("hangup", () => {
            console.log("Virstack: Call hangup");
            this.resetCallState();
            this.showStatus("Call ended");
          });
          this.virstackWebClient.on("agent_started_speaking", () => {
            console.log("Virstack: Agent started speaking");
            this.showAgentSpeaking();
          });
          this.virstackWebClient.on("agent_stopped_speaking", () => {
            console.log("Virstack: Agent stopped speaking");
            this.hideAgentSpeaking();
          });
          this.virstackWebClient.on("user_started_speaking", () => {
            console.log("Virstack: User started speaking");
            this.showUserSpeaking();
          });
          this.virstackWebClient.on("user_stopped_speaking", () => {
            console.log("Virstack: User stopped speaking");
            this.hideUserSpeaking();
          });
          this.virstackWebClient.on("ai_speaking_start", () => {
            console.log("Virstack: AI speaking (legacy event)");
            this.showAgentSpeaking();
          });
          this.virstackWebClient.on("ai_speaking_end", () => {
            console.log("Virstack: AI stopped speaking (legacy event)");
            this.hideAgentSpeaking();
          });
          await this.virstackWebClient.startCall({
            accessToken
          });
        } catch (error) {
          console.error("Virstack: Error starting call:", error);
          this.resetCallState();
          if (error.message.includes("fetch token")) {
            this.showStatus("Failed to get access token");
          } else {
            this.showStatus("Failed to connect");
          }
        }
      }
      endCall() {
        if (!this.isCallActive) return;
        try {
          if (this.virstackWebClient) {
            this.virstackWebClient.stopCall();
          }
          this.resetCallState();
          this.showStatus("Call ended");
        } catch (error) {
          console.error("Virstack: Error ending call:", error);
          this.resetCallState();
        }
      }
      resetCallState() {
        this.isCallActive = false;
        this.elements.button.classList.remove("active", "connecting");
        this.elements.endCallBtn.classList.remove("show");
        this.elements.voiceBars.classList.remove("active");
      }
      showAgentSpeaking() {
        this.elements.voiceBars.classList.add("active");
        console.log("Showing agent speaking animation");
      }
      hideAgentSpeaking() {
        this.elements.voiceBars.classList.remove("active");
        console.log("Hiding agent speaking animation");
      }
      showUserSpeaking() {
        this.elements.voiceBars.classList.add("active");
        console.log("Showing user speaking animation");
      }
      hideUserSpeaking() {
        this.elements.voiceBars.classList.remove("active");
        console.log("Hiding user speaking animation");
      }
      showInitialHint() {
        setTimeout(() => {
          if (!this.isCallActive) {
            this.showStatus("Click to talk with AI", 3e3);
          }
        }, 1e3);
      }
      // Method to update icon dynamically
      setIcon(iconUrl) {
        this.config.iconUrl = iconUrl;
        const oldIcon = this.elements.icon;
        if (oldIcon && oldIcon.parentElement) {
          const newIconHtml = this.createIconElement();
          const temp = document.createElement("div");
          temp.innerHTML = newIconHtml;
          const newIcon = temp.firstChild;
          oldIcon.parentElement.replaceChild(newIcon, oldIcon);
          this.elements.icon = newIcon;
          if (this.isImageUrl(iconUrl)) {
            this.elements.button.classList.add("has-image-icon");
          } else {
            this.elements.button.classList.remove("has-image-icon");
          }
        }
      }
      // Method to update button size dynamically
      setButtonSize(size, activeSize) {
        this.config.buttonSize = size;
        this.config.activeButtonSize = activeSize || size * 1.2;
        this.elements.container.style.setProperty("--virstack-button-size", `${size}px`);
        this.elements.container.style.setProperty("--virstack-active-button-size", `${this.config.activeButtonSize}px`);
      }
      destroy() {
        if (this.isCallActive) {
          this.endCall();
        }
        if (this.elements.container) {
          this.elements.container.remove();
        }
      }
    }
    function autoInit() {
      const scripts = document.querySelectorAll("script[data-virstack-widget]");
      scripts.forEach((script) => {
        const buttonSize = parseInt(script.getAttribute("data-button-size")) || 70;
        const config = {
          tokenUrl: script.getAttribute("data-token-url") || "",
          iconUrl: script.getAttribute("data-icon-url") || "",
          iconEmoji: script.getAttribute("data-icon-emoji") || "\u{1F916}",
          position: script.getAttribute("data-position") || "bottom-right",
          primaryColor: script.getAttribute("data-primary-color") || "#667eea",
          secondaryColor: script.getAttribute("data-secondary-color") || "#764ba2",
          buttonSize,
          activeButtonSize: parseInt(script.getAttribute("data-active-button-size")) || buttonSize * 1.2
        };
        new VirstackAIWebUIWidget(config);
      });
    }
    window.VirstackAIWebUIWidget = VirstackAIWebUIWidget;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit);
    } else {
      autoInit();
    }
  })();
})();
