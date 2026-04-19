// Dashboard page functionality
document.addEventListener('DOMContentLoaded', function() {
    requireLogin();
    loadDashboard();
});

async function loadDashboard() {
    const user = getUser();
    document.getElementById('user-name').textContent = user.username;

    const result = await apiCall('user_dashboard.php');

    if (result.success) {
        displayProfile(result.user);
        displayItems(result.items);
        loadMessages();
    } else {
        console.error('Failed to load dashboard:', result.message);
    }
}

function displayProfile(user) {
    const container = document.getElementById('profile-info');
    
    container.innerHTML = `
        <div class="profile-field">
            <div class="profile-field-label">Username</div>
            <div class="profile-field-value">${user.username}</div>
        </div>
        <div class="profile-field">
            <div class="profile-field-label">Full Name</div>
            <div class="profile-field-value">${user.full_name}</div>
        </div>
        <div class="profile-field">
            <div class="profile-field-label">Email</div>
            <div class="profile-field-value">${user.email}</div>
        </div>
        ${user.phone ? `
        <div class="profile-field">
            <div class="profile-field-label">Phone</div>
            <div class="profile-field-value">${user.phone}</div>
        </div>
        ` : ''}
        ${user.address ? `
        <div class="profile-field">
            <div class="profile-field-label">Address</div>
            <div class="profile-field-value">${user.address}</div>
        </div>
        ` : ''}
        <div class="profile-field">
            <div class="profile-field-label">Member Since</div>
            <div class="profile-field-value">${new Date(user.created_at).toLocaleDateString()}</div>
        </div>
    `;
}

function displayItems(items) {
    const container = document.getElementById('posted-items');

    if (items.length === 0) {
        container.innerHTML = '<p>You have no posted items yet. <a href="post-item.html">Post one now!</a></p>';
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        
        // Determine status display
        let statusColor, statusEmoji;
        if (item.status === 'active') {
            statusColor = '#90EE90';
            statusEmoji = '🟢';
        } else if (item.status === 'resolved') {
            statusColor = '#FFD700';
            statusEmoji = '✅';
        } else if (item.status === 'closed') {
            statusColor = '#FFB6C6';
            statusEmoji = '❌';
        } else {
            statusColor = '#CCCCCC';
            statusEmoji = '❓';
        }

        // Build action buttons
        let actionButtons = '';
        if (item.status === 'active') {
            actionButtons = `
                <button class="status-btn" onclick="markItemResolved(${item.id})" style="background-color: #FFD700; color: black;">
                    ✅ Mark as Found/Resolved
                </button>
                <button class="status-btn" onclick="markItemClosed(${item.id})" style="background-color: #FF6B6B;">
                    ❌ Close Item
                </button>
            `;
        } else {
            actionButtons = `
                <button class="status-btn" onclick="markItemActive(${item.id})" style="background-color: #90EE90; color: black;">
                    🟢 Reopen Item
                </button>
            `;
        }

        itemRow.innerHTML = `
            <div class="item-row-title">${item.title}</div>
            <div class="item-row-meta">
                <strong>${item.type.toUpperCase()}</strong> - ${item.category} 
                <span style="background-color: ${statusColor}; color: black; padding: 5px 10px; border-radius: 4px; margin-left: 10px; font-weight: bold;">
                    ${statusEmoji} ${item.status}
                </span>
            </div>
            <div class="item-row-meta">
                📍 Location: ${item.location} | 📅 Posted: ${new Date(item.created_at).toLocaleDateString()}
            </div>
            <div class="item-row-actions">
                ${actionButtons}
            </div>
        `;
        container.appendChild(itemRow);
    });
}

async function markItemResolved(itemId) {
    if (!confirm('Mark this item as Found/Resolved?')) return;
    
    const result = await apiCall('update_item_status.php', 'POST', {
        item_id: itemId,
        status: 'resolved'
    });

    if (result.success) {
        alert('✅ Item marked as Found/Resolved!');
        loadDashboard();
    } else {
        alert('❌ Error: ' + result.message);
    }
}

async function markItemClosed(itemId) {
    if (!confirm('Close this item? It will no longer appear in active listings.')) return;
    
    const result = await apiCall('update_item_status.php', 'POST', {
        item_id: itemId,
        status: 'closed'
    });

    if (result.success) {
        alert('✅ Item closed!');
        loadDashboard();
    } else {
        alert('❌ Error: ' + result.message);
    }
}

async function markItemActive(itemId) {
    if (!confirm('Reopen this item to active status?')) return;
    
    const result = await apiCall('update_item_status.php', 'POST', {
        item_id: itemId,
        status: 'active'
    });

    if (result.success) {
        alert('✅ Item reopened!');
        loadDashboard();
    } else {
        alert('❌ Error: ' + result.message);
    }
}

async function loadMessages() {
    const container = document.getElementById('messages-list');

    const result = await apiCall('messages.php');
    
    console.log('Messages API Response:', result); // Debug logging

    if (result.success && result.messages && result.messages.length > 0) {
        container.innerHTML = '';
        result.messages.slice(0, 5).forEach(msg => {
            const msgRow = document.createElement('div');
            msgRow.className = 'message-row';
            msgRow.style.cursor = 'pointer';
            msgRow.onclick = () => {
                openMessageConversation(msg.other_user_id, msg.other_user_name);
            };
            
            const lastMessageTime = new Date(msg.last_message_time).toLocaleString();
            const unreadBadge = msg.unread_count > 0 ? `<strong>(<span style="color: red;">${msg.unread_count} unread</span>)</strong>` : '';
            
            msgRow.innerHTML = `
                <div class="message-sender">${msg.other_user_name} ${unreadBadge}</div>
                <div class="message-text">
                    Click to view conversation
                </div>
                <div class="message-time">
                    Last: ${lastMessageTime}
                </div>
            `;
            container.appendChild(msgRow);
        });
    } else {
        console.log('No messages found or API error:', result); // Debug logging
        container.innerHTML = '<p>No messages yet. <a href="feed.html">Browse items</a> to start conversations!</p>';
    }
}

async function openMessageConversation(userId, userName) {
    // Create a modal/popup for viewing conversation
    const modal = document.createElement('div');
    modal.id = 'message-modal';
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
        max-height: 600px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 5px 30px rgba(0,0,0,0.3);
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 1rem;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f5f5f5;
        border-radius: 10px 10px 0 0;
    `;
    header.innerHTML = `
        <h3 style="margin: 0;">${userName}</h3>
        <button onclick="document.getElementById('message-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
    `;
    
    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'modal-messages';
    messagesDiv.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        background: #f9f9f9;
    `;
    messagesDiv.innerHTML = '<p>Loading messages...</p>';
    
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
        padding: 1rem;
        border-top: 1px solid #ddd;
        display: flex;
        gap: 0.5rem;
    `;
    inputArea.innerHTML = `
        <input type="text" id="modal-message-input" placeholder="Type a message..." style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
        <button onclick="sendModalMessage(${userId})" style="padding: 0.75rem 1.5rem; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer;">Send</button>
    `;
    
    modalContent.appendChild(header);
    modalContent.appendChild(messagesDiv);
    modalContent.appendChild(inputArea);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Load messages
    const result = await apiCall(`messages.php?conversation_with=${userId}`);
    
    if (result.success && result.messages.length > 0) {
        const currentUser = getUser();
        messagesDiv.innerHTML = '';
        
        result.messages.reverse().forEach(msg => {
            const msgEl = document.createElement('div');
            msgEl.style.cssText = `
                margin-bottom: 1rem;
                display: flex;
                justify-content: ${msg.sender_id == currentUser.id ? 'flex-end' : 'flex-start'};
            `;
            
            const msgBubble = document.createElement('div');
            msgBubble.style.cssText = `
                max-width: 70%;
                padding: 0.75rem 1rem;
                border-radius: 15px;
                ${msg.sender_id == currentUser.id 
                    ? 'background: #4A90E2; color: white; border-radius: 15px 15px 0 15px;'
                    : 'background: #e0e0e0; color: #333; border-radius: 15px 15px 15px 0;'}
            `;
            msgBubble.textContent = msg.message_text;
            
            msgEl.appendChild(msgBubble);
            messagesDiv.appendChild(msgEl);
        });
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } else {
        messagesDiv.innerHTML = '<p style="text-align: center; color: #888;">No messages yet. Start the conversation!</p>';
    }
    
    document.getElementById('modal-message-input').focus();
}

async function sendModalMessage(userId) {
    const input = document.getElementById('modal-message-input');
    const messageText = input.value.trim();
    
    if (!messageText) {
        alert('Please enter a message');
        return;
    }
    
    const result = await apiCall('messages.php', 'POST', {
        receiver_id: userId,
        message_text: messageText
    });
    
    if (result.success) {
        input.value = '';
        // Reload the conversation
        const userName = document.querySelector('#message-modal h3').textContent;
        document.getElementById('message-modal').remove();
        openMessageConversation(userId, userName);
    } else {
        alert('Failed to send message: ' + result.message);
    }
}
