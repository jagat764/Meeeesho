// Meesho Auto Bot - Frontend JavaScript (Mobile Optimized)

class MeeshoBotUI {
    constructor() {
        this.phone = '';
        this.offer = 0;
        this.otpTimer = null;
        this.otpTimeout = 60;
        this.sessionData = null;
        
        // DOM Elements
        this.phoneInput = document.getElementById('phoneInput');
        this.checkBtn = document.getElementById('checkBtn');
        this.checkResult = document.getElementById('checkResult');
        
        this.otpInput = document.getElementById('otpInput');
        this.verifyBtn = document.getElementById('verifyBtn');
        this.verifyResult = document.getElementById('verifyResult');
        this.otpPhoneDisplay = document.getElementById('otpPhoneDisplay');
        this.resendBtn = document.getElementById('resendOtpBtn');
        this.otpTimerDisplay = document.getElementById('otpTimer');
        
        this.step1 = document.getElementById('step1');
        this.step2 = document.getElementById('step2');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Session Display Elements
        this.sessionCard = document.getElementById('sessionCard');
        this.sessionPhone = document.getElementById('sessionPhone');
        this.sessionOffer = document.getElementById('sessionOffer');
        this.sessionUserId = document.getElementById('sessionUserId');
        this.sessionToken = document.getElementById('sessionToken');
        this.sessionJson = document.getElementById('sessionJson');
        this.copySessionBtn = document.getElementById('copySessionBtn');
        this.closeSessionBtn = document.getElementById('closeSessionBtn');
        this.newRegistrationBtn = document.getElementById('newRegistrationBtn');
        
        // Mobile optimization: auto-focus on input
        this.phoneInput.focus();
        
        // Bind events
        this.bindEvents();
    }
    
    bindEvents() {
        this.checkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.checkNumber();
        });
        
        this.phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.checkNumber();
            }
        });
        
        this.verifyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.verifyOTP();
        });
        
        this.otpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.verifyOTP();
            }
        });
        
        this.resendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.resendOTP();
        });
        
        this.copySessionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.copySession();
        });
        
        this.closeSessionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeSession();
        });
        
        this.newRegistrationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetForNewRegistration();
        });
        
        // Auto-focus OTP input when step 2 appears
        const observer = new MutationObserver(() => {
            if (this.step2.style.display !== 'none') {
                setTimeout(() => this.otpInput.focus(), 500);
            }
        });
        observer.observe(this.step2, { attributes: true, attributeFilter: ['style'] });
    }
    
    showProgress(show, text = 'Processing...', percentage = 0) {
        if (show) {
            this.progressBar.style.display = 'block';
            this.progressFill.style.width = Math.min(percentage, 100) + '%';
            this.progressText.textContent = text;
        } else {
            this.progressBar.style.display = 'none';
        }
    }
    
    showResult(element, type, message) {
        element.className = `result-box show ${type}`;
        element.innerHTML = message;
        // Auto-hide after 10 seconds for success messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (element.classList.contains('show')) {
                    element.classList.remove('show');
                }
            }, 10000);
        }
    }
    
    hideResult(element) {
        element.className = 'result-box';
        element.innerHTML = '';
    }
    
    showSession(sessionData, phone, offer) {
        this.sessionData = sessionData;
        
        // Fill summary
        this.sessionPhone.textContent = phone;
        this.sessionOffer.textContent = `₹${offer} OFF`;
        this.sessionUserId.textContent = sessionData.user_id || 'N/A';
        this.sessionToken.textContent = sessionData.xo_token ? sessionData.xo_token.substring(0, 16) + '...' : 'N/A';
        
        // Fill JSON
        const jsonStr = JSON.stringify(sessionData, null, 2);
        this.sessionJson.textContent = jsonStr;
        
        // Apply Prism highlighting
        if (window.Prism) {
            Prism.highlightElement(this.sessionJson);
        }
        
        // Show session card, hide registration steps
        this.sessionCard.style.display = 'block';
        this.step1.style.display = 'none';
        this.step2.style.display = 'none';
        this.progressBar.style.display = 'none';
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Scroll to session card with smooth animation
        setTimeout(() => {
            this.sessionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
    
    closeSession() {
        this.sessionCard.style.display = 'none';
        this.resetForNewRegistration();
    }
    
    resetForNewRegistration() {
        this.sessionCard.style.display = 'none';
        this.step1.style.display = 'flex';
        this.step2.style.display = 'none';
        this.phoneInput.value = '';
        this.otpInput.value = '';
        this.hideResult(this.checkResult);
        this.hideResult(this.verifyResult);
        this.verifyBtn.disabled = false;
        this.verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify';
        this.stopOTPTimer();
        this.phone = '';
        this.offer = 0;
        this.sessionData = null;
        
        // Focus on phone input
        setTimeout(() => this.phoneInput.focus(), 300);
    }
    
    async copySession() {
        try {
            const jsonStr = JSON.stringify(this.sessionData, null, 2);
            
            // Use modern clipboard API with fallback
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(jsonStr);
            } else {
                // Fallback for older devices
                const textarea = document.createElement('textarea');
                textarea.value = jsonStr;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            
            // Show feedback
            const originalText = this.copySessionBtn.innerHTML;
            this.copySessionBtn.innerHTML = '<i class="fas fa-check"></i> <span class="btn-text">Copied!</span>';
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
            
            setTimeout(() => {
                this.copySessionBtn.innerHTML = originalText;
            }, 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            // Show error feedback
            const originalText = this.copySessionBtn.innerHTML;
            this.copySessionBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span class="btn-text">Failed</span>';
            setTimeout(() => {
                this.copySessionBtn.innerHTML = originalText;
            }, 2000);
        }
    }
    
    async checkNumber() {
        const phone = this.phoneInput.value.trim();
        
        if (!phone || phone.length !== 10 || !phone.match(/^\d+$/)) {
            this.showResult(this.checkResult, 'error', 
                '❌ Please enter a valid 10-digit phone number');
            // Shake animation
            this.phoneInput.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                this.phoneInput.style.animation = '';
            }, 500);
            return;
        }
        
        this.phone = phone;
        this.checkBtn.disabled = true;
        this.checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        this.hideResult(this.checkResult);
        this.showProgress(true, '🔍 Checking number & hunting offers...', 20);
        
        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.offer = data.offer;
                this.showResult(this.checkResult, 'success', 
                    `✅ ${data.message}<br>🎁 ₹${this.offer} OFF offer found!`);
                
                // Move to step 2 with animation
                setTimeout(() => {
                    this.step1.style.display = 'none';
                    this.step2.style.display = 'flex';
                    this.otpPhoneDisplay.textContent = `📱 +91 ${this.phone}`;
                    this.showProgress(false);
                    
                    // Send OTP automatically after a short delay
                    setTimeout(() => this.sendOTP(), 500);
                }, 500);
            } else {
                this.showResult(this.checkResult, 'error', `❌ ${data.message}`);
                this.showProgress(false);
            }
        } catch (error) {
            this.showResult(this.checkResult, 'error', `❌ Network error: ${error.message}`);
            this.showProgress(false);
        } finally {
            this.checkBtn.disabled = false;
            this.checkBtn.innerHTML = '<i class="fas fa-search"></i> Check';
        }
    }
    
    async sendOTP() {
        this.showProgress(true, '📨 Sending OTP...', 40);
        this.resendBtn.disabled = true;
        
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: this.phone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showResult(this.verifyResult, 'info', 
                    `📨 ${data.message}<br>Please check your phone for the OTP`);
                this.startOTPTimer();
                // Focus on OTP input
                setTimeout(() => this.otpInput.focus(), 300);
            } else {
                this.showResult(this.verifyResult, 'error', `❌ ${data.message}`);
                this.resendBtn.disabled = false;
            }
        } catch (error) {
            this.showResult(this.verifyResult, 'error', `❌ Network error: ${error.message}`);
            this.resendBtn.disabled = false;
        } finally {
            this.showProgress(false);
        }
    }
    
    async resendOTP() {
        this.hideResult(this.verifyResult);
        this.resendBtn.disabled = true;
        await this.sendOTP();
    }
    
    async verifyOTP() {
        const otp = this.otpInput.value.trim();
        
        if (!otp || otp.length < 4) {
            this.showResult(this.verifyResult, 'error', '❌ Please enter a valid OTP (4-6 digits)');
            this.otpInput.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                this.otpInput.style.animation = '';
            }, 500);
            return;
        }
        
        this.verifyBtn.disabled = true;
        this.verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        this.hideResult(this.verifyResult);
        this.showProgress(true, '🔐 Verifying OTP & registering...', 60);
        
        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: this.phone,
                    otp: otp,
                    offer: this.offer
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showProgress(false);
                this.verifyBtn.disabled = false;
                this.verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify';
                this.stopOTPTimer();
                
                // Show success with animation
                this.showResult(this.verifyResult, 'success', 
                    `✅ ${data.message}<br>🎉 Registration successful!`);
                
                // Show session data after a short delay
                setTimeout(() => {
                    this.showSession(data.session, data.phone, data.offer);
                }, 500);
            } else {
                this.showResult(this.verifyResult, 'error', `❌ ${data.message}`);
                this.showProgress(false);
                this.verifyBtn.disabled = false;
                this.verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify';
            }
        } catch (error) {
            this.showResult(this.verifyResult, 'error', `❌ Network error: ${error.message}`);
            this.verifyBtn.disabled = false;
            this.verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify';
        }
    }
    
    startOTPTimer() {
        let timeLeft = this.otpTimeout;
        this.otpTimerDisplay.textContent = `⏱️ ${timeLeft}s`;
        
        if (this.otpTimer) clearInterval(this.otpTimer);
        
        this.otpTimer = setInterval(() => {
            timeLeft--;
            this.otpTimerDisplay.textContent = `⏱️ ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(this.otpTimer);
                this.otpTimer = null;
                this.otpTimerDisplay.textContent = '⏱️ Expired';
                this.resendBtn.disabled = false;
            }
        }, 1000);
    }
    
    stopOTPTimer() {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
            this.otpTimer = null;
        }
        this.otpTimerDisplay.textContent = '';
    }
}

// Add shake animation for mobile feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(style);

// Initialize the UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MeeshoBotUI();
});
