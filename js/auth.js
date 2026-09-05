(function () {
    'use strict';

    const AUTH_KEY = 'flyora_users';
    const SESSION_KEY = 'flyora_session';
    const DEMO_EMAIL = 'demo@flyora.com';
    const DEMO_PASSWORD = 'Demo123!';

    const PBKDF2_ITERATIONS = 100000;
    const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

    let currentUser = null;
    let isSignUpMode = false;

    let storeReady = Promise.resolve();

    function initAuth() {
        checkSession();
        initAuthModal();
        initUserMenu();
        initSignOut();
        updateUI();

        storeReady = Promise.resolve()
            .then(migrateLegacyPasswords)
            .then(seedDemoAccount)
            .catch(function (err) {
                console.error('Account store could not be prepared:', err);
            });
    }

    function cryptoOrThrow() {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('SubtleCrypto unavailable - serve this page over http://localhost or https://');
        }
        return window.crypto;
    }

    function toHex(buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
            return b.toString(16).padStart(2, '0');
        }).join('');
    }

    function randomSalt() {
        const bytes = new Uint8Array(16);
        cryptoOrThrow().getRandomValues(bytes);
        return toHex(bytes);
    }

    function hashPassword(password, salt) {
        const subtle = cryptoOrThrow().subtle;
        const encoder = new TextEncoder();

        return subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
            .then(function (key) {
                return subtle.deriveBits({
                    name: 'PBKDF2',
                    salt: encoder.encode(salt),
                    iterations: PBKDF2_ITERATIONS,
                    hash: 'SHA-256'
                }, key, 256);
            })
            .then(toHex);
    }

    function verifyPassword(password, user) {
        if (!user.salt || !user.hash) return Promise.resolve(false);
        return hashPassword(password, user.salt).then(function (hash) {
            return hash === user.hash;
        });
    }

    function buildCredentials(password) {
        const salt = randomSalt();
        return hashPassword(password, salt).then(function (hash) {
            return { salt: salt, hash: hash };
        });
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

    function migrateLegacyPasswords() {
        const users = getUsers();
        const legacy = users.filter(function (u) { return typeof u.password === 'string'; });

        if (!legacy.length) return Promise.resolve();

        return Promise.all(legacy.map(function (user) {
            return buildCredentials(user.password).then(function (creds) {
                user.salt = creds.salt;
                user.hash = creds.hash;
                delete user.password;
            });
        })).then(function () {
            saveUsers(users);
        });
    }

    function seedDemoAccount() {
        const users = getUsers();
        const exists = users.some(function (u) { return u.email === DEMO_EMAIL; });
        if (exists) return Promise.resolve();

        return buildCredentials(DEMO_PASSWORD).then(function (creds) {
            const fresh = getUsers();
            if (fresh.some(function (u) { return u.email === DEMO_EMAIL; })) return;

            fresh.push({
                id: 'usr_demo',
                name: 'Demo User',
                email: DEMO_EMAIL,
                salt: creds.salt,
                hash: creds.hash,
                created: new Date().toISOString()
            });
            saveUsers(fresh);
        });
    }

    function checkSession() {
        const session = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (!session) return;

        let stored;
        try {
            stored = JSON.parse(session);
        } catch (e) {
            clearSession();
            return;
        }

        const expired = !stored || !stored.expires || stored.expires < Date.now();
        const orphaned = !expired && !findUser(stored.email);

        if (expired || orphaned) {
            clearSession();
            return;
        }

        currentUser = stored;
    }

    function saveSession(user, remember) {
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            expires: Date.now() + SESSION_TTL_MS
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

    function findUser(email) {
        const users = getUsers();
        for (let i = 0; i < users.length; i++) {
            if (users[i].email === email) {
                return users[i];
            }
        }
        return null;
    }

    function handleLogin(email, password, remember) {
        return storeReady.then(function () {
            const user = findUser(email);

            if (!user) {
                return { success: false, error: 'No account found with this email' };
            }

            return verifyPassword(password, user).then(function (matches) {
                if (!matches) {
                    return { success: false, error: 'Incorrect password' };
                }
                saveSession(user, remember);
                return { success: true, user: user };
            });
        });
    }

    function handleRegister(name, email, password) {
        return storeReady.then(function () {
            if (findUser(email)) {
                return { success: false, error: 'An account with this email already exists' };
            }
            return buildCredentials(password);
        }).then(function (creds) {
            if (!creds || creds.success === false) return creds;
            const users = getUsers();
            if (users.some(function (u) { return u.email === email; })) {
                return { success: false, error: 'An account with this email already exists' };
            }

            const newUser = {
                id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
                name: name,
                email: email,
                salt: creds.salt,
                hash: creds.hash,
                created: new Date().toISOString()
            };

            users.push(newUser);
            saveUsers(users);
            saveSession(newUser, true);

            return { success: true, user: newUser };
        });
    }

    function handleSignOut() {
        clearSession();
        closeUserMenu();
        updateUI();

        const authBtn = document.getElementById('auth-btn');
        closeModalIfOpen(authBtn);
        if (authBtn) authBtn.focus();

        notify('You have been signed out', 'info');
    }

    function closeModalIfOpen(focusTarget) {
        const overlay = document.querySelector('.modal-overlay.open');
        if (overlay && typeof window.closeModal === 'function') {
            window.closeModal(overlay, focusTarget);
        }
    }

    function validateEmail(email) {
        return window.isValidEmail(email);
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
        const group = input.closest('.form-group');
        if (!group) return;
        const errorEl = group.querySelector('.form-error');
        group.classList.add('error');
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    function clearFormErrors(form) {
        const groups = form.querySelectorAll('.form-group.error');
        for (let i = 0; i < groups.length; i++) {
            groups[i].classList.remove('error');
        }
        const inputs = form.querySelectorAll('.form-input.error');
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].classList.remove('error');
            inputs[i].removeAttribute('aria-invalid');
        }
        const errors = form.querySelectorAll('.form-error');
        for (let i = 0; i < errors.length; i++) {
            errors[i].textContent = '';
        }
    }

    function initAuthModal() {
        const form = document.getElementById('auth-form');
        const toggleLink = document.getElementById('auth-toggle-link');
        const authBtn = document.getElementById('auth-btn');

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

            const inputs = form.querySelectorAll('.form-input');
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener('input', function () {
                    const group = this.closest('.form-group');
                    if (group && group.classList.contains('error')) {
                        group.classList.remove('error');
                        this.classList.remove('error');
                        this.removeAttribute('aria-invalid');
                        const errorEl = group.querySelector('.form-error');
                        if (errorEl) {
                            errorEl.textContent = '';
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
        const modalTitle = document.getElementById('auth-modal-title');
        const form = document.getElementById('auth-form');
        const submitBtn = document.getElementById('auth-submit');
        const toggleLink = document.getElementById('auth-toggle-link');
        const toggleText = document.getElementById('auth-toggle-text');
        const nameField = document.getElementById('name-field');
        const confirmField = document.getElementById('confirm-field');
        const rememberField = document.getElementById('remember-field');
        const demoHint = document.getElementById('auth-demo-hint');

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
            const inputs = form.querySelectorAll('.form-input');
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].value = '';
            }
        }
    }

    function handleAuthSubmit(form) {
        clearFormErrors(form);

        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        let isValid = true;

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
            handleSignUp(email, password);
        } else {
            handleSignIn(email, password);
        }
    }

    function handleSignIn(email, password) {
        const rememberCheck = document.querySelector('#auth-form input[name="remember"]');
        const remember = rememberCheck ? rememberCheck.checked : false;
        const submitBtn = document.getElementById('auth-submit');

        setSubmitLoading(submitBtn, true);

        handleLogin(email, password, remember).then(function (result) {
            setSubmitLoading(submitBtn, false);

            if (result.success) {
                updateUI();
                closeModalIfOpen(document.getElementById('user-menu-toggle'));
                notify('Welcome back, ' + result.user.name + '!', 'success', 4000);
            } else {
                showFieldError(document.getElementById('auth-password'), result.error);
                notify(result.error, 'error');
            }
        }).catch(function (err) {
            setSubmitLoading(submitBtn, false);
            console.error('Sign-in failed:', err);
            notify('Sign-in is unavailable in this context. Serve the page over localhost or https.', 'error');
        });
    }

    function handleSignUp(email, password) {
        const nameInput = document.getElementById('auth-name');
        const confirmInput = document.getElementById('auth-confirm');
        const name = nameInput ? nameInput.value.trim() : '';
        const confirm = confirmInput ? confirmInput.value : '';
        let isValid = true;

        if (!name) {
            showFieldError(nameInput, 'Name is required');
            isValid = false;
        }

        const passwordError = validatePassword(password);
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

        const submitBtn = document.getElementById('auth-submit');
        setSubmitLoading(submitBtn, true);

        handleRegister(name, email, password).then(function (result) {
            setSubmitLoading(submitBtn, false);

            if (result.success) {
                updateUI();
                closeModalIfOpen(document.getElementById('user-menu-toggle'));
                notify('Account created! Welcome, ' + name + '!', 'success', 4000);
            } else {
                showFieldError(document.getElementById('auth-email'), result.error);
                notify(result.error, 'error');
            }
        }).catch(function (err) {
            setSubmitLoading(submitBtn, false);
            console.error('Registration failed:', err);
            notify('Account creation is unavailable in this context. Serve the page over localhost or https.', 'error');
        });
    }

    function notify(message, type, duration) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type, duration);
        }
    }

    function setSubmitLoading(btn, loading) {
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.textContent;
            btn.textContent = '';

            const spinner = document.createElement('span');
            spinner.className = 'spinner spinner-inline';
            btn.appendChild(spinner);
            btn.appendChild(document.createTextNode(' Please wait...'));
        } else {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || 'Sign In';
        }
    }

    function initUserMenu() {
        const toggle = document.getElementById('user-menu-toggle');
        if (toggle) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                if (expanded) {
                    closeUserMenu();
                } else {
                    openUserMenu();
                }
            });
        }

        document.addEventListener('click', function (e) {
            const menu = document.getElementById('user-menu');
            if (menu && !menu.contains(e.target)) {
                closeUserMenu();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;

            const wasOpen = toggle && toggle.getAttribute('aria-expanded') === 'true';
            closeUserMenu();
            if (wasOpen) toggle.focus();
        });
    }

    function openUserMenu() {
        const dropdown = document.getElementById('user-dropdown');
        const toggle = document.getElementById('user-menu-toggle');
        if (dropdown) dropdown.classList.add('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    function closeUserMenu() {
        const dropdown = document.getElementById('user-dropdown');
        const toggle = document.getElementById('user-menu-toggle');
        if (dropdown) dropdown.classList.remove('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    function initSignOut() {
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', function () {
                handleSignOut();
            });
        }
    }

    function updateUI() {
        const authContainer = document.querySelector('.auth-container');
        if (!authContainer) return;

        const authBtn = document.getElementById('auth-btn');
        const userMenu = document.getElementById('user-menu');

        if (!authBtn || !userMenu) return;

        if (isLoggedIn()) {
            authBtn.classList.add('hidden');
            userMenu.classList.remove('hidden');

            const avatar = document.getElementById('user-avatar');
            const nameEl = document.getElementById('user-display-name');
            const emailEl = document.getElementById('user-display-email');

            if (avatar) {
                avatar.textContent = getInitials(currentUser.name);
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
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    window.initAuth = initAuth;
    window.isLoggedIn = isLoggedIn;
    window.getCurrentUser = getCurrentUser;
    window.handleSignOut = handleSignOut;
    window.setAuthMode = setAuthMode;

})();