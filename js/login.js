// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            messageDiv.textContent = 'Logging in...';
            messageDiv.className = 'message info';

            const result = await apiCall('login.php', 'POST', {
                email: email,
                password: password
            });

            if (result.success) {
                saveUser(result.user);
                messageDiv.textContent = '✅ Login successful! Redirecting...';
                messageDiv.className = 'message success';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // User not found
                if (result.message === 'User not found') {
                    messageDiv.textContent = '❌ User not found';
                    console.error('❌ LOGIN ERROR:', result.message);
                    messageDiv.className = 'message error';
                }
                // Invalid password
                else if (result.message === 'Invalid password') {
                    messageDiv.textContent = '❌ Email or password is wrong';
                    console.error('❌ LOGIN ERROR:', result.message);
                    messageDiv.className = 'message error';
                }
                // Generic error
                else {
                    messageDiv.textContent = '❌ Email or password is wrong';
                    console.error('❌ LOGIN ERROR (Generic):', result.message);
                    messageDiv.className = 'message error';
                }
            }
        });
    }
});
