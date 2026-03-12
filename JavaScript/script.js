// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    if (hamburger && navMenu) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}));

// Tab Switching for Flight Search
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and update aria-selected
        tabBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        
        // Add active class to clicked tab
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        
        // Handle return date visibility based on selected tab
        const returnInput = document.getElementById('return');
        if (returnInput) {
            if (btn.dataset.tab === 'one-way') {
                returnInput.disabled = true;
                returnInput.placeholder = 'Not required';
                returnInput.removeAttribute('required');
            } else {
                returnInput.disabled = false;
                returnInput.placeholder = '';
                if (btn.dataset.tab === 'round-trip') {
                    returnInput.setAttribute('required', 'required');
                }
            }
        }
    });
});

// Auth Modal
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeBtn = document.querySelector('.close');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Open modal
if (loginBtn && authModal) {
    loginBtn.addEventListener('click', () => {
        authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        const firstInput = loginForm.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    });
}

if (signupBtn && authModal) {
    signupBtn.addEventListener('click', () => {
        authModal.style.display = 'flex';
        
        // Switch to signup tab
        authTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        authTabs[1].classList.add('active');
        authTabs[1].setAttribute('aria-selected', 'true');
        
        if (loginForm) loginForm.classList.add('hidden');
        if (signupForm) signupForm.classList.remove('hidden');
        
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        const firstInput = signupForm.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    });
}

// Close modal
if (closeBtn && authModal) {
    closeBtn.addEventListener('click', () => {
        authModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Switch between login and signup tabs
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        authTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        
        // Add active class to clicked tab
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        
        // Show corresponding form
        if (tab.dataset.tab === 'login') {
            if (loginForm) loginForm.classList.remove('hidden');
            if (signupForm) signupForm.classList.add('hidden');
        } else {
            if (loginForm) loginForm.classList.add('hidden');
            if (signupForm) signupForm.classList.remove('hidden');
        }
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal && authModal.style.display === 'flex') {
        authModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Password validation
function validatePassword(password) {
    return password.length >= 8;
}

// Show error message
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');
    
    if (input && errorElement) {
        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        input.setAttribute('aria-invalid', 'true');
    }
}

// Clear error message
function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');
    
    if (input && errorElement) {
        input.classList.remove('error');
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        input.setAttribute('aria-invalid', 'false');
    }
}

// Form Submission - Flight Search
const flightSearchForm = document.getElementById('flightSearchForm');
if (flightSearchForm) {
    flightSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        const departure = document.getElementById('departure').value;
        
        if (!from || !to || !departure) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        showNotification('Searching for flights...', 'info');
        
        // In a real application, you would process the form data here
        setTimeout(() => {
            showNotification('Flight search completed!', 'success');
        }, 2000);
    });
}

// Login Form Validation
if (loginForm) {
    // Clear errors on input
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail) {
        loginEmail.addEventListener('input', () => clearError('loginEmail'));
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('input', () => clearError('loginPassword'));
    }
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let hasError = false;
        
        // Validate email
        const email = document.getElementById('loginEmail').value;
        if (!email) {
            showError('loginEmail', 'Email is required');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError('loginEmail', 'Please enter a valid email address');
            hasError = true;
        } else {
            clearError('loginEmail');
        }
        
        // Validate password
        const password = document.getElementById('loginPassword').value;
        if (!password) {
            showError('loginPassword', 'Password is required');
            hasError = true;
        } else {
            clearError('loginPassword');
        }
        
        if (!hasError) {
            showNotification('Login successful!', 'success');
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Reset form
            loginForm.reset();
        }
    });
}

// Signup Form Validation
if (signupForm) {
    // Clear errors on input
    const signupName = document.getElementById('signupName');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupConfirmPassword = document.getElementById('signupConfirmPassword');
    
    if (signupName) {
        signupName.addEventListener('input', () => clearError('signupName'));
    }
    
    if (signupEmail) {
        signupEmail.addEventListener('input', () => clearError('signupEmail'));
    }
    
    if (signupPassword) {
        signupPassword.addEventListener('input', () => clearError('signupPassword'));
    }
    
    if (signupConfirmPassword) {
        signupConfirmPassword.addEventListener('input', () => clearError('signupConfirmPassword'));
    }
    
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let hasError = false;
        
        // Validate name
        const name = document.getElementById('signupName').value.trim();
        if (!name) {
            showError('signupName', 'Full name is required');
            hasError = true;
        } else if (name.length < 2) {
            showError('signupName', 'Name must be at least 2 characters');
            hasError = true;
        } else {
            clearError('signupName');
        }
        
        // Validate email
        const email = document.getElementById('signupEmail').value;
        if (!email) {
            showError('signupEmail', 'Email is required');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError('signupEmail', 'Please enter a valid email address');
            hasError = true;
        } else {
            clearError('signupEmail');
        }
        
        // Validate password
        const password = document.getElementById('signupPassword').value;
        if (!password) {
            showError('signupPassword', 'Password is required');
            hasError = true;
        } else if (!validatePassword(password)) {
            showError('signupPassword', 'Password must be at least 8 characters');
            hasError = true;
        } else {
            clearError('signupPassword');
        }
        
        // Validate confirm password
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        if (!confirmPassword) {
            showError('signupConfirmPassword', 'Please confirm your password');
            hasError = true;
        } else if (password !== confirmPassword) {
            showError('signupConfirmPassword', 'Passwords do not match');
            hasError = true;
        } else {
            clearError('signupConfirmPassword');
        }
        
        if (!hasError) {
            showNotification('Account created successfully!', 'success');
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Reset form
            signupForm.reset();
            
            // Switch back to login tab
            authTabs.forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            });
            authTabs[0].classList.add('active');
            authTabs[0].setAttribute('aria-selected', 'true');
            
            if (loginForm) loginForm.classList.remove('hidden');
            if (signupForm) signupForm.classList.add('hidden');
        }
    });
}

// Notification System
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.classList.remove('hidden');
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Hide after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 300);
    }, 5000);
}

// Set minimum date for flight search to today
const today = new Date().toISOString().split('T')[0];
const departureInput = document.getElementById('departure');
const returnInput = document.getElementById('return');

if (departureInput) {
    departureInput.min = today;
    
    // Update return min date when departure changes
    departureInput.addEventListener('change', (e) => {
        if (returnInput) {
            returnInput.min = e.target.value;
            
            // If return date is before new departure date, clear it
            if (returnInput.value && returnInput.value < e.target.value) {
                returnInput.value = '';
            }
        }
    });
}

if (returnInput) {
    returnInput.min = today;
}

// Destination card interactions
document.querySelectorAll('.destination-card .btn-secondary').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const destination = e.target.closest('.destination-card').querySelector('h3').textContent;
        const toInput = document.getElementById('to');
        
        if (toInput) {
            toInput.value = destination;
        }
        
        // Scroll to search form
        const searchSection = document.getElementById('booking');
        if (searchSection) {
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 70;
            const targetPosition = searchSection.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Focus on from input after scroll
            setTimeout(() => {
                const fromInput = document.getElementById('from');
                if (fromInput) {
                    fromInput.focus();
                }
            }, 500);
        }
        
        showNotification(`Searching for flights to ${destination}`, 'info');
    });
});

// Smooth scroll for all internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 70;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Lazy loading images fallback for older browsers
if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    console.log('Native lazy loading supported');
} else {
    // Fallback for older browsers
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', () => {
    // Set initial aria-expanded state for hamburger
    if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
    }
    
    // Set initial aria-selected for tabs
    tabBtns.forEach((btn, index) => {
        btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    });
    
    authTabs.forEach((tab, index) => {
        tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    });
});