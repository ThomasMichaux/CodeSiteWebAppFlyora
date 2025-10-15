// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Tab Switching for Flight Search
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs
        tabBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked tab
        btn.classList.add('active');
        
        // Handle return date visibility based on selected tab
        const returnInput = document.getElementById('return');
        if (btn.dataset.tab === 'one-way') {
            returnInput.disabled = true;
            returnInput.placeholder = 'Not required';
        } else {
            returnInput.disabled = false;
            returnInput.placeholder = '';
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
loginBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
});

signupBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
    // Switch to signup tab
    authTabs[0].classList.remove('active');
    authTabs[1].classList.add('active');
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
});

// Close modal
closeBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Switch between login and signup tabs
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        authTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding form
        if (tab.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
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

// Form Submission
const flightSearchForm = document.getElementById('flightSearchForm');
flightSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Searching for flights...', 'info');
    // In a real application, you would process the form data here
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Login successful!', 'success');
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Account created successfully!', 'success');
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Notification System
function showNotification(message, type) {
    const notification = document.getElementById('notification');
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
document.getElementById('departure').min = today;
document.getElementById('return').min = today;

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
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = searchSection.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
        
        showNotification(`Searching for flights to ${destination}`, 'info');
    });
});