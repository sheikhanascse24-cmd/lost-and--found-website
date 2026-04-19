// Register page functionality
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('register-message');

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const full_name = document.getElementById('full_name').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const branch = document.getElementById('branch').value;
            const semester = document.getElementById('semester').value;
            const section = document.getElementById('section').value;
            const profilePictureFile = document.getElementById('profile_picture').files[0];

            // Validate required fields
            if (!full_name.trim()) {
                messageDiv.textContent = 'Full Name is required';
                messageDiv.className = 'message error';
                return;
            }

            if (!phone.trim()) {
                messageDiv.textContent = 'Phone Number is required';
                messageDiv.className = 'message error';
                return;
            }

            if (!email.trim()) {
                messageDiv.textContent = 'Email Address is required';
                messageDiv.className = 'message error';
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                messageDiv.textContent = 'Please enter a valid email address';
                messageDiv.className = 'message error';
                return;
            }

            if (!password.trim()) {
                messageDiv.textContent = 'Password is required';
                messageDiv.className = 'message error';
                return;
            }

            if (password.length < 6) {
                messageDiv.textContent = 'Password must be at least 6 characters';
                messageDiv.className = 'message error';
                return;
            }

            // Debug: Log password being submitted
            console.log('🔐 Password Debug Info:');
            console.log('📝 Password entered: ' + password);
            console.log('⚠️ Note: Password will be HASHED in database for security');
            console.log('✅ Same password will work for login');
            console.log('═══════════════════════════════════════');

            if (!branch.trim()) {
                messageDiv.textContent = 'Branch is required';
                messageDiv.className = 'message error';
                return;
            }

            if (!semester) {
                messageDiv.textContent = 'Semester is required';
                messageDiv.className = 'message error';
                return;
            }

            if (!section.trim()) {
                messageDiv.textContent = 'Section is required';
                messageDiv.className = 'message error';
                return;
            }

            messageDiv.textContent = 'Registering...';
            messageDiv.className = 'message info';

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('full_name', full_name);
            formData.append('phone', phone);
            formData.append('address', address);
            formData.append('branch', branch);
            formData.append('semester', semester);
            formData.append('section', section);
            if (profilePictureFile) {
                formData.append('profile_picture', profilePictureFile);
            }

            try {
                const response = await fetch('api/register.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                console.log('📨 Registration Response:', result);

                if (result.success) {
                    messageDiv.innerHTML = `
                        <strong>✅ Registration Successful!</strong><br>
                        <small>Password has been securely hashed and saved.</small><br>
                        <small>You can now login with the same password.</small><br>
                        <small style="color: #666;">Redirecting to login in 2 seconds...</small>
                    `;
                    messageDiv.className = 'message success';
                    console.log('✅ User registered successfully');
                    console.log('🔑 Password verification: When you login with the same password, it will match the hash');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageDiv.textContent = result.message || 'Registration failed';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                messageDiv.textContent = 'Network error. Please try again.';
                messageDiv.className = 'message error';
            }
        });
    }
});
