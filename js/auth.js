// Auth - Authentication module
(function () {
    'use strict';

    const AUTH_KEY = 'flyora_users';
    const SESSION_KEY = 'flyora_session';
    const DEMO_EMAIL = 'demo@flyora.com';
    const DEMO_PASSWORD = 'Demo123!';

    let currentUser = null;
    let isSignUpMode = false;

    function initAuth() {
        seedDemoAccount();
        checkSession();
        initAuthModal();
        initUserMenu();
        initSignOut();
        updateUI();
    }

    function seedDemoAccount() {
        const users = getUsers();
        var exists = users.some(function (u) { return u.email === DEMO_EMAIL; });
        if (!exists) {
            users.push({
                id: 'usr_demo',
                name: 'Demo User',
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                created: new Date().toISOString()
            });
            saveUsers(users);
        }
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
    }

    function checkSession() {
        var session = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (session) {
            try {
                currentUser = JSON.parse(session);
            } catch (e) {
                currentUser = null;
                localStorage.removeItem(SESSION_KEY);
                sessionStorage.removeItem(SESSION_KEY);
            }
        }
    }

    function saveSession(user, remember) {
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        if (remember) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        } else {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        }
    }

    function clearSession() {
        currentUser = null;
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
    }

    function isLoggedIn() {
        return currentUser !== null;
    }

    function getCurrentUser() {
        return currentUser;
    }

    function handleLogin(email, password, remember) {
        var users = getUsers();
        var user = null;

        for (var i = 0; i < users.length; i++) {
            if (users[i].email === email) {
                user = users[i];
                break;
            }
        }

        if (!user) {
            return { success: false, error: 'No account found with this email' };
        }

        if (user.password !== password) {
            return { success: false, error: 'Incorrect password' };
        }

        saveSession(user, remember);
        return { success: true, user: user };
    }

    function handleRegister(name, email, password) {
        var users = getUsers();

        for (var i = 0; i < users.length; i++) {
            if (users[i].email === email) {
                return { success: false, error: 'An account with this email already exists' };
            }
        }

        var newUser = {
            id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: name,
            email: email,
            password: password,
            created: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        saveSession(newUser, true);

        return { success: true, user: newUser };
    }

    function handleSignOut() {
        clearSession();
        closeUserMenu();
        updateUI();
        closeModalIfOpen();

        if (typeof showNotification === 'function') {
            showNotification('You have been signed out', 'info');
        }
    }

    function closeModalIfOpen() {
        var overlay = document.querySelector('.modal-overlay.open');
        if (overlay && typeof window.closeModal === 'function') {
            window.closeModal(overlay);
        }
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password) {
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
        if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
        if (!/[0-9]/.test(password)) return 'Password must contain a number';
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain a special character';
        return null;
    }

    function showFieldError(input, message) {
        var group = input.closest('.form-group');
        if (!group) return;
        var errorEl = group.querySelector('.form-error');
        group.classList.add('error');
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }
    }

    function clearFormErrors(form) {
        var groups = form.querySelectorAll('.form-group.error');
        for (var i = 0; i < groups.length; i++) {
            groups[i].classList.remove('error');
        }
        var inputs = form.querySelectorAll('.form-input.error');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].classList.remove('error');
            inputs[i].removeAttribute('aria-invalid');
        }
        var errors = form.querySelectorAll('.form-error.visible');
        for (var i = 0; i < errors.length; i++) {
            errors[i].textContent = '';
            errors[i].classList.remove('visible');
        }
    }

    function initAuthModal() {
        var form = document.getElementById('auth-form');
        var toggleLink = document.getElementById('auth-toggle-link');
        var modalTitle = document.getElementById('auth-modal-title');

        var authBtn = document.getElementById('auth-btn');
        if (authBtn) {
            authBtn.addEventListener('click', function (e) {
                e.preventDefault();
                setAuthMode('signin');
                if (typeof window.openModal === 'function') {
                    window.openModal('auth-modal');
                }
            });
        }

        if (toggleLink) {
            toggleLink.addEventListener('click', function (e) {
                e.preventDefault();
                toggleAuthMode();
            });
        }

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                handleAuthSubmit(form);
            });

            var inputs = form.querySelectorAll('.form-input');
            for (var i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener('input', function () {
                    var group = this.closest('.form-group');
                    if (group && group.classList.contains('error')) {
                        group.classList.remove('error');
                        this.classList.remove('error');
                        this.removeAttribute('aria-invalid');
                        var errorEl = group.querySelector('.form-error');
                        if (errorEl) {
                            errorEl.textContent = '';
                            errorEl.classList.remove('visible');
                        }
                    }
                });
            }
        }
    }

    function toggleAuthMode() {
        isSignUpMode = !isSignUpMode;
        updateAuthModalView();
    }

    function setAuthMode(mode) {
        isSignUpMode = mode === 'signup';
        updateAuthModalView();
    }

    function updateAuthModalView() {
        var modalTitle = document.getElementById('auth-modal-title');
        var form = document.getElementById('auth-form');
        var submitBtn = document.getElementById('auth-submit');
        var toggleLink = document.getElementById('auth-toggle-link');
        var toggleText = document.getElementById('auth-toggle-text');
        var nameField = document.getElementById('name-field');
        var confirmField = document.getElementById('confirm-field');
        var rememberField = document.getElementById('remember-field');
        var demoHint = document.getElementById('auth-demo-hint');

        if (isSignUpMode) {
            if (modalTitle) modalTitle.textContent = 'Create Account';
            if (submitBtn) submitBtn.textContent = 'Create Account';
            if (toggleText) toggleText.textContent = 'Already have an account?';
            if (toggleLink) toggleLink.textContent = 'Sign in';
            if (nameField) nameField.classList.remove('hidden');
            if (confirmField) confirmField.classList.remove('hidden');
            if (rememberField) rememberField.classList.add('hidden');
            if (demoHint) demoHint.classList.add('hidden');
        } else {
            if (modalTitle) modalTitle.textContent = 'Sign In';
            if (submitBtn) submitBtn.textContent = 'Sign In';
            if (toggleText) toggleText.textContent = 'Don\'t have an account?';
            if (toggleLink) toggleLink.textContent = 'Create one';
            if (nameField) nameField.classList.add('hidden');
            if (confirmField) confirmField.classList.add('hidden');
            if (rememberField) rememberField.classList.remove('hidden');
            if (demoHint) demoHint.classList.remove('hidden');
        }

        if (form) {
            clearFormErrors(form);
            var inputs = form.querySelectorAll('.form-input');
            for (var i = 0; i < inputs.length; i++) {
                inputs[i].value = '';
            }
        }
    }

    function handleAuthSubmit(form) {
        clearFormErrors(form);

        var emailInput = document.getElementById('auth-email');
        var passwordInput = document.getElementById('auth-password');
        var email = emailInput ? emailInput.value.trim() : '';
        var password = passwordInput ? passwordInput.value : '';
        var isValid = true;

        if (!email) {
            showFieldError(emailInput, 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        if (!password) {
            showFieldError(passwordInput, 'Password is required');
            isValid = false;
        }

        if (!isValid) return;

        if (isSignUpMode) {
            handleSignUp(form, email, password);
        } else {
            handleSignIn(form, email, password);
        }
    }

    function handleSignIn(form, email, password) {
        var rememberCheck = document.querySelector('#auth-form input[name="remember"]');
        var remember = rememberCheck ? rememberCheck.checked : false;
        var submitBtn = document.getElementById('auth-submit');

        setSubmitLoading(submitBtn, true);

        setTimeout(function () {
            var result = handleLogin(email, password, remember);
            setSubmitLoading(submitBtn, false);

            if (result.success) {
                var overlay = document.querySelector('.modal-overlay.open');
                if (overlay && typeof window.closeModal === 'function') {
                    window.closeModal(overlay);
                }
                updateUI();
                if (typeof showNotification === 'function') {
                    showNotification('Welcome back, ' + result.user.name + '!', 'success', 4000);
                }
            } else {
                var passwordInput = document.getElementById('auth-password');
                showFieldError(passwordInput, result.error);
                if (typeof showNotification === 'function') {
                    showNotification(result.error, 'error');
                }
            }
        }, 600);
    }

    function handleSignUp(form, email, password) {
        var nameInput = document.getElementById('auth-name');
        var confirmInput = document.getElementById('auth-confirm');
        var name = nameInput ? nameInput.value.trim() : '';
        var confirm = confirmInput ? confirmInput.value : '';
        var isValid = true;

        if (!name) {
            showFieldError(nameInput, 'Name is required');
            isValid = false;
        }

        var passwordError = validatePassword(password);
        if (passwordError) {
            showFieldError(document.getElementById('auth-password'), passwordError);
            isValid = false;
        }

        if (!confirm) {
            showFieldError(confirmInput, 'Please confirm your password');
            isValid = false;
        } else if (password !== confirm) {
            showFieldError(confirmInput, 'Passwords do not match');
            isValid = false;
        }

        if (!isValid) return;

        var submitBtn = document.getElementById('auth-submit');
        setSubmitLoading(submitBtn, true);

        setTimeout(function () {
            var result = handleRegister(name, email, password);
            setSubmitLoading(submitBtn, false);

            if (result.success) {
                var overlay = document.querySelector('.modal-overlay.open');
                if (overlay && typeof window.closeModal === 'function') {
                    window.closeModal(overlay);
                }
                updateUI();
                if (typeof showNotification === 'function') {
                    showNotification('Account created! Welcome, ' + name + '!', 'success', 4000);
                }
            } else {
                var emailInput = document.getElementById('auth-email');
                showFieldError(emailInput, result.error);
                if (typeof showNotification === 'function') {
                    showNotification(result.error, 'error');
                }
            }
        }, 800);
    }

    function setSubmitLoading(btn, loading) {
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.textContent;
            btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;border-top-color:white;border-color:rgba(255,255,255,0.3);border-top-color:white;display:inline-block;border-radius:50%;vertical-align:middle;margin-right:8px;animation:spin 0.8s linear infinite;"></span> Please wait...';
        } else {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || 'Sign In';
        }
    }

    function initUserMenu() {
        var toggle = document.getElementById('user-menu-toggle');
        if (toggle) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                var dropdown = document.getElementById('user-dropdown');
                var expanded = toggle.getAttribute('aria-expanded') === 'true';
                if (expanded) {
                    closeUserMenu();
                } else {
                    openUserMenu();
                }
            });
        }

        document.addEventListener('click', function (e) {
            var menu = document.getElementById('user-menu');
            if (menu && !menu.contains(e.target)) {
                closeUserMenu();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeUserMenu();
            }
        });
    }

    function openUserMenu() {
        var dropdown = document.getElementById('user-dropdown');
        var toggle = document.getElementById('user-menu-toggle');
        if (dropdown) dropdown.classList.add('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    function closeUserMenu() {
        var dropdown = document.getElementById('user-dropdown');
        var toggle = document.getElementById('user-menu-toggle');
        if (dropdown) dropdown.classList.remove('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    function initSignOut() {
        var signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', function () {
                handleSignOut();
            });
        }
    }

    function updateUI() {
        var authContainer = document.querySelector('.auth-container');
        if (!authContainer) return;

        var authBtn = document.getElementById('auth-btn');
        var userMenu = document.getElementById('user-menu');

        if (!authBtn || !userMenu) return;

        if (isLoggedIn()) {
            authBtn.classList.add('hidden');
            userMenu.classList.remove('hidden');

            var avatar = document.getElementById('user-avatar');
            var nameEl = document.getElementById('user-display-name');
            var emailEl = document.getElementById('user-display-email');

            if (avatar) {
                var initials = getInitials(currentUser.name);
                avatar.textContent = initials;
            }
            if (nameEl) nameEl.textContent = currentUser.name;
            if (emailEl) emailEl.textContent = currentUser.email;
        } else {
            authBtn.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    window.initAuth = initAuth;
    window.isLoggedIn = isLoggedIn;
    window.getCurrentUser = getCurrentUser;
    window.handleSignOut = handleSignOut;
    window.setAuthMode = setAuthMode;

})();