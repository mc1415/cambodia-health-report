document.addEventListener('DOMContentLoaded', () => {
    // !! IMPORTANT: Change these to your own secure credentials !!
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "12345";

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Store a simple flag in local storage to indicate a successful login
            localStorage.setItem('isLoggedIn', 'true');
            // Redirect to the admin dashboard
            window.location.href = 'admin.html';
        } else {
            errorMessage.textContent = 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។';
            errorMessage.style.display = 'block';
        }
    });
});