// Post item page functionality
document.addEventListener('DOMContentLoaded', function() {
    requireLogin();

    const postForm = document.getElementById('post-item-form');
    const messageDiv = document.getElementById('post-message');

    if (postForm) {
        postForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const type = document.querySelector('input[name="type"]:checked').value;
            const location = document.getElementById('location').value;
            const date_occurred = document.getElementById('date_occurred').value;
            const imageFile = document.getElementById('image').files[0];

            messageDiv.textContent = 'Posting item...';
            messageDiv.className = 'message info';

            // Create FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('type', type);
            formData.append('location', location);
            formData.append('date_occurred', date_occurred);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const result = await apiCallFormData('post_item.php', formData);

            if (result.success) {
                messageDiv.textContent = 'Item posted successfully! Redirecting to dashboard...';
                messageDiv.className = 'message success';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                messageDiv.textContent = result.message || 'Failed to post item';
                messageDiv.className = 'message error';
            }
        });
    }
});
