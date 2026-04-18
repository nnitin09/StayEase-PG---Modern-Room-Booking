// Auth page logic
(function() {
    let isLogin = true;
    let authForm, toggleBtn, authTitle, authSubtitle, nameField, submitBtn;

    function init() {
        authForm = document.getElementById('auth-form');
        toggleBtn = document.getElementById('toggle-auth');
        authTitle = document.getElementById('auth-title');
        authSubtitle = document.getElementById('auth-subtitle');
        nameField = document.getElementById('name-field');
        submitBtn = document.getElementById('submit-btn');
        const sendOtpBtn = document.getElementById('send-otp-btn');
        const otpField = document.getElementById('otp-field');

        // Reset Password elements
        const forgotPasswordBtn = document.getElementById('forgot-password-btn');
        const resetModal = document.getElementById('reset-modal');
        const closeReset = document.getElementById('close-reset');
        const step1 = document.getElementById('reset-step-1');
        const step2 = document.getElementById('reset-step-2');
        const sendResetOtpBtn = document.getElementById('send-reset-otp');
        const confirmResetBtn = document.getElementById('confirm-reset');

        if (!authForm || !toggleBtn) return;

        // Forgot Password Modal Toggle
        if (forgotPasswordBtn && resetModal && closeReset) {
            forgotPasswordBtn.onclick = () => {
                resetModal.classList.remove('hidden');
                step1.classList.remove('hidden');
                step2.classList.add('hidden');
            };
            closeReset.onclick = () => resetModal.classList.add('hidden');
        }

        // Send Reset OTP
        if (sendResetOtpBtn) {
            sendResetOtpBtn.onclick = async () => {
                const email = document.getElementById('reset-email').value;
                if (!email) return alert('Enter email');
                try {
                    sendResetOtpBtn.disabled = true;
                    sendResetOtpBtn.textContent = 'Sending...';
                    const data = await API.requestPasswordReset(email);
                    if (data.demoOtp) alert(`DEMO: Reset OTP is ${data.demoOtp}`);
                    else alert('Reset OTP sent to email');
                    step1.classList.add('hidden');
                    step2.classList.remove('hidden');
                } catch (err) {
                    alert(err.message);
                } finally {
                    sendResetOtpBtn.disabled = false;
                    sendResetOtpBtn.textContent = 'Send OTP';
                }
            };
        }

        // Confirm Reset
        if (confirmResetBtn) {
            confirmResetBtn.onclick = async () => {
                const email = document.getElementById('reset-email').value;
                const otp = document.getElementById('reset-otp').value;
                const newPassword = document.getElementById('reset-new-password').value;
                if (!otp || !newPassword) return alert('Fill all fields');
                try {
                    confirmResetBtn.disabled = true;
                    confirmResetBtn.textContent = 'Resetting...';
                    await API.confirmPasswordReset(email, otp, newPassword);
                    alert('Password reset successful! You can now login.');
                    resetModal.classList.add('hidden');
                } catch (err) {
                    alert(err.message);
                } finally {
                    confirmResetBtn.disabled = false;
                    confirmResetBtn.textContent = 'Reset Password';
                }
            };
        }

        toggleBtn.addEventListener('click', () => {
            const container = document.getElementById('auth-container');
            container.style.transform = 'scale(0.98) translateY(5px)';
            container.style.opacity = '0.5';

            setTimeout(() => {
                isLogin = !isLogin;
                authTitle.textContent = isLogin ? 'Welcome Back' : 'Create Account';
                authSubtitle.textContent = isLogin ? 'Login to manage your stay' : 'Join StayEase today';
                submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
                toggleBtn.textContent = isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In";
                
                nameField.classList.toggle('hidden', isLogin);
                sendOtpBtn.classList.toggle('hidden', isLogin);
                otpField.classList.toggle('hidden', isLogin);

                const nameInput = document.getElementById('auth-name');
                const otpInput = document.getElementById('auth-otp');
                if (nameInput) nameInput.required = !isLogin;
                if (otpInput) otpInput.required = !isLogin;

                container.style.transform = 'scale(1) translateY(0)';
                container.style.opacity = '1';
                
                if (window.lucide) window.lucide.createIcons();
            }, 300);
        });

        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', async () => {
                const email = document.getElementById('auth-email').value;
                if (!email) {
                    alert('Please enter your email first.');
                    return;
                }

                try {
                    sendOtpBtn.disabled = true;
                    sendOtpBtn.textContent = 'Sending...';
                    const data = await API.sendOTP(email);
                    
                    if (data.demoOtp) {
                        alert(`DEMO MODE: Since no email config is found, your OTP is: ${data.demoOtp}. Please enter it below.`);
                    } else {
                        alert('OTP sent! Please check your email inbox.');
                    }
                    
                    sendOtpBtn.textContent = 'Resend OTP';
                } catch (err) {
                    alert(err.message);
                } finally {
                    sendOtpBtn.disabled = false;
                }
            });
        }

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const name = document.getElementById('auth-name').value;
            const otp = document.getElementById('auth-otp')?.value;

            try {
                if (isLogin) {
                    if (!window.API) throw new Error('API service not found');

                    const data = await API.login({ email, password });
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('isAdmin', data.user.role === 'admin' ? 'true' : 'false');
                    
                    // Redirect back to booking if we came from there
                    const redirect = new URLSearchParams(window.location.search).get('redirect');
                    window.location.href = redirect || '/dashboard.html';
                } else {
                    if (!window.API) throw new Error('API service not found');
                    if (!otp) throw new Error('Please enter the OTP sent to your email.');
                    
                    await API.signup({ name, email, password, otp });
                    alert('Account verified and created! Please login.');
                    toggleBtn.click();
                }
            } catch (err) {
                alert(err.message);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
