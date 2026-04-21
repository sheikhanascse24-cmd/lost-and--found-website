// Messages page functionality
let currentConversationWith = null;

document.addEventListener('DOMContentLoaded', function() {
    requireLogin();
    
    // Check if user_id parameter is provided (from profile click)
    const url = new URL(window.location.href);
    const userId = url.searchParams.get('user_id');
    
    loadConversations();
    
    // If user_id is provided, open that conversation
    if (userId) {
        // Fetch user name from the conversations list
        setTimeout(() => {
            const conversations = document.querySelectorAll('.conversation-item');
            let found = false;
            conversations.forEach(conv => {
                const userIdAttr = conv.getAttribute('data-user-id');
                if (userIdAttr == userId) {
                    const userName = conv.querySelector('.conversation-name').textContent;
                    openConversation(userId, userName);
                    conv.classList.add('active');
                    found = true;
                }
            });
            
            // If conversation doesn't exist yet, create new one
            if (!found && userId) {
                createNewConversation(userId);
            }
        }, 500);
    }
    
    // Auto-refresh conversations every 3 seconds
    setInterval(loadConversations, 3000);
});

async function loadConversations() {
    const result = await apiCall('messages.php');

    if (result.success && result.messages.length > 0) {
        const container = document.getElementById('conversations-list');
        container.innerHTML = '';
        
        result.messages.forEach(msg => {
            const conversationDiv = document.createElement('div');
            conversationDiv.className = 'conversation-item';
            conversationDiv.setAttribute('data-user-id', msg.other_user_id);
            if (currentConversationWith == msg.other_user_id) {
                conversationDiv.classList.add('active');
            }
            
            const unreadBadge = msg.unread_count > 0 ? `<span class="unread-badge">${msg.unread_count}</span>` : '';
            const lastMessageTime = new Date(msg.last_message_time).toLocaleString();
            
            conversationDiv.innerHTML = `
                <div class="conversation-content" onclick="openConversation(${msg.other_user_id}, '${msg.other_user_name}')">
                    <div class="conversation-name">${msg.other_user_name}</div>
                    <div class="conversation-time">${lastMessageTime}</div>
                </div>
                ${unreadBadge}
            `;
            
            container.appendChild(conversationDiv);
        });
    } else if (result.success) {
        document.getElementById('conversations-list').innerHTML = '<p>No conversations yet.</p>';
    }
}

async function openConversation(userId, userName) {
    currentConversationWith = userId;
    
    // Update header with user name and clear chat button
    document.getElementById('chat-header').innerHTML = `
        <div style="flex: 1; display: flex; align-items: center;">
            <img src="https://via.placeholder.com/40x40?text=${userName[0]}" alt="${userName}" class="chat-avatar" style="cursor: pointer; margin-right: 10px;" onclick="viewUserProfile(${userId})">
            <h3 style="cursor: pointer; display: inline-block;" onclick="viewUserProfile(${userId})">${userName}</h3>
        </div>
        <button onclick="clearChat()" class="btn btn-danger" style="background-color: #FF6B6B; padding: 0.5rem 1rem; font-size: 0.9rem;">🗑️ Clear Chat</button>
    `;
    
    // Show message input
    document.getElementById('message-input-area').style.display = 'flex';
    
    // Load conversation
    const result = await apiCall(`messages.php?conversation_with=${userId}`);
    const messagesContainer = document.getElementById('messages-chat');
    
    if (result.success && result.messages.length > 0) {
        const currentUser = getUser();
        messagesContainer.innerHTML = '';
        
        // Reverse to show oldest first
        result.messages.reverse().forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = msg.sender_id == currentUser.id ? 'message sent' : 'message received';
            
            const senderName = msg.sender_id == currentUser.id ? 'You' : msg.full_name;
            const messageTime = new Date(msg.created_at).toLocaleTimeString();
            
            let deleteBtn = '';
            if (msg.sender_id == currentUser.id) {
                deleteBtn = `<button onclick="deleteMessage(${msg.id})" class="delete-msg-btn" title="Delete message">✕</button>`;
            }
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${msg.message_text}</div>
                    <div class="message-time">${messageTime}</div>
                </div>
                ${deleteBtn}
            `;
            
            messagesContainer.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        messagesContainer.innerHTML = '<p class="empty-chat">No messages yet. Start the conversation!</p>';
    }
    
    // Update conversations list styling
    loadConversations();
}

async function createNewConversation(userId) {
    // Fetch user details to get name
    const userResult = await apiCall(`get_user.php?id=${userId}`);
    if (userResult.success) {
        openConversation(userId, userResult.user.full_name);
    }
}

async function sendMessage() {
    if (!currentConversationWith) {
        alert('Please select a conversation first');
        return;
    }
    
    const messageText = document.getElementById('message-text').value.trim();
    
    if (!messageText) {
        alert('Please enter a message');
        return;
    }
    
    const result = await apiCall('messages.php', 'POST', {
        receiver_id: currentConversationWith,
        message_text: messageText
    });
    
    if (result.success) {
        document.getElementById('message-text').value = '';
        
        // Reload conversation
        const convName = document.querySelector('.conversation-item.active .conversation-name')?.textContent || 'User';
        await openConversation(currentConversationWith, convName);
    } else {
        alert('❌ Error sending message: ' + result.message);
    }
}

function viewUserProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}

async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;
    
    const result = await apiCall('delete_message.php', 'POST', {
        message_id: messageId
    });

    if (result.success) {
        // Reload conversation to show updated messages
        const convName = document.querySelector('.conversation-item.active .conversation-name')?.textContent || 'User';
        await openConversation(currentConversationWith, convName);
    } else {
        alert('❌ Error: ' + result.message);
    }
}

async function clearChat() {
    if (!confirm('Are you sure you want to delete all messages in this conversation? This action cannot be undone.')) return;
    
    const result = await apiCall('clear_chat.php', 'POST', {
        other_user_id: currentConversationWith
    });

    if (result.success) {
        alert('✅ Chat cleared successfully!');
        // Reload conversation
        const convName = document.querySelector('.conversation-item.active .conversation-name')?.textContent || 'User';
        await openConversation(currentConversationWith, convName);
    } else {
        alert('❌ Error: ' + result.message);
    }
}
