// User profile page functionality
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    currentUserId = urlParams.get('id');

    if (!currentUserId) {
        document.querySelector('.container').innerHTML = '<p>User not found.</p>';
        return;
    }

    // Load user profile
    await loadUserProfile(currentUserId);
});

async function loadUserProfile(userId) {
    const result = await apiCall(`get_user_profile.php?user_id=${userId}`);

    if (result.success) {
        displayProfile(result.user);
        displayUserItems(result.items);
        
        // Show message button if logged in and viewing another user
        if (checkAuth()) {
            const currentUser = getUser();
            if (currentUser.id != userId) {
                document.getElementById('message-card').style.display = 'block';
            }
        }
    } else {
        document.querySelector('.profile-container').innerHTML = '<p>User not found.</p>';
    }
}

function displayProfile(user) {
    // Profile picture
    if (user.profile_picture) {
        document.getElementById('profile-pic').src = user.profile_picture;
    }

    // Basic info
    document.getElementById('profile-name').textContent = user.full_name || 'User';
    document.getElementById('profile-username').textContent = '@' + (user.username || 'user');
    document.getElementById('profile-bio').textContent = user.bio || '';

    // Personal Information
    document.getElementById('detail-phone').textContent = user.phone || 'Not provided';
    document.getElementById('detail-address').textContent = user.address || 'Not provided';
    document.getElementById('detail-email').textContent = user.email || 'Not provided';
    document.getElementById('detail-joined').textContent = new Date(user.created_at).toLocaleDateString();

    // Education Details
    document.getElementById('detail-branch').textContent = user.branch || 'Not provided';
    document.getElementById('detail-semester').textContent = user.semester ? `${user.semester}${getSemesterSuffix(user.semester)}` : 'Not provided';
    document.getElementById('detail-section').textContent = user.section ? `Section ${user.section}` : 'Not provided';
}

function getSemesterSuffix(semester) {
    const num = parseInt(semester);
    if (num === 1) return 'st Semester';
    if (num === 2) return 'nd Semester';
    if (num === 3) return 'rd Semester';
    return 'th Semester';
}

function displayUserItems(items) {
    const container = document.getElementById('user-items');

    if (items.length === 0) {
        container.innerHTML = '<p class="no-items">This user has not posted any items yet.</p>';
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'user-item-card';
        itemCard.onclick = () => viewItemDetail(item.id);

        const description = item.description.length > 100 
            ? item.description.substring(0, 100) + '...' 
            : item.description;

        itemCard.innerHTML = `
            <div class="item-card-header">
                <span class="item-card-title">${item.title}</span>
                <span class="item-card-type ${item.type}">${item.type.toUpperCase()}</span>
            </div>
            <div class="item-card-meta">
                <span>🏷️ ${item.category}</span>
                <span>📍 ${item.location}</span>
                <span>📅 ${new Date(item.date_occurred).toLocaleDateString()}</span>
            </div>
            <div class="item-card-description">${description}</div>
            <div class="item-card-footer">
                <span>Posted ${new Date(item.created_at).toLocaleDateString()}</span>
                <span class="item-status">${item.status.toUpperCase()}</span>
            </div>
        `;

        container.appendChild(itemCard);
    });
}

function viewItemDetail(itemId) {
    window.location.href = `item-detail.html?id=${itemId}`;
}

function openMessageToUser() {
    if (!checkAuth()) {
        alert('Please login to send messages');
        window.location.href = 'login.html';
        return;
    }

    const currentUser = getUser();
    if (currentUser.id == currentUserId) {
        alert('Cannot message yourself!');
        return;
    }

    // Create a simple message modal
    const modal = document.createElement('div');
    modal.id = 'send-message-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 10px;
        width: 90%;
        max-width: 500px;
        padding: 2rem;
        box-shadow: 0 5px 30px rgba(0,0,0,0.3);
    `;
    
    const userName = document.getElementById('profile-name').textContent;
    
    modalContent.innerHTML = `
        <h3>Send Message to ${userName}</h3>
        <textarea id="message-text-input" placeholder="Type your message..." style="width: 100%; min-height: 150px; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; font-family: Arial, sans-serif; font-size: 0.95rem; margin: 1rem 0;"></textarea>
        <div style="display: flex; gap: 1rem;">
            <button onclick="sendNewMessage(${currentUserId})" style="flex: 1; padding: 0.75rem; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer;">Send Message</button>
            <button onclick="document.getElementById('send-message-modal').remove()" style="flex: 1; padding: 0.75rem; background: #ddd; color: #333; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    document.getElementById('message-text-input').focus();
}

async function sendNewMessage(receiverId) {
    const messageText = document.getElementById('message-text-input').value.trim();
    
    if (!messageText) {
        alert('Please enter a message');
        return;
    }
    
    const result = await apiCall('messages.php', 'POST', {
        receiver_id: receiverId,
        message_text: messageText
    });
    
    if (result.success) {
        alert('Message sent successfully!');
        document.getElementById('send-message-modal').remove();
    } else {
        alert('Failed to send message: ' + result.message);
    }
}

async function sendMessage(receiverId, messageText) {
    const result = await apiCall('api/messages.php', 'POST', {
        receiver_id: receiverId,
        message_text: messageText
    });

    if (result.success) {
        alert('Message sent successfully!');
    } else {
        alert('Failed to send message: ' + result.message);
    }
}
