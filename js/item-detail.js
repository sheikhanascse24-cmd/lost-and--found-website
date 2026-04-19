// Item detail page functionality
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) {
        document.getElementById('item-detail-container').innerHTML = '<p>No item specified.</p>';
        return;
    }

    const result = await apiCall(`get_item.php?id=${itemId}`);

    if (result.success) {
        displayItemDetail(result.item);
    } else {
        document.getElementById('item-detail-container').innerHTML = '<p>Item not found.</p>';
    }
});

function displayItemDetail(item) {
    const container = document.getElementById('item-detail-container');
    const imageUrl = item.image_path ? item.image_path : 'https://via.placeholder.com/500x400?text=No+Image';

    let contactHtml = `
        <div class="contact-section">
            <h3>Contact Item Details</h3>
            <div class="contact-info">
                <p><strong>Posted by:</strong> ${item.full_name} (@${item.username})</p>
                ${item.phone ? `<p><strong>Phone:</strong> ${item.phone}</p>` : ''}
                ${item.email ? `<p><strong>Email:</strong> ${item.email}</p>` : ''}
            </div>
    `;

    if (checkAuth()) {
        const user = getUser();
        if (user.id != item.user_id) {
            contactHtml += `
                <button onclick="openMessageModal(${item.user_id}, ${item.id}, '${item.full_name}')" class="btn btn-primary btn-full">
                    Send Message
                </button>
            `;
        }
    } else {
        contactHtml += `
            <p><a href="login.html" class="btn btn-primary btn-full">Login to Message</a></p>
        `;
    }

    contactHtml += '</div>';

    container.innerHTML = `
        <div class="item-detail-grid">
            <div>
                <img src="${imageUrl}" alt="${item.title}" class="item-detail-image">
            </div>
            <div class="item-detail-info">
                <h1>${item.title}</h1>
                <div class="item-detail-meta">
                    <div class="detail-meta-item">
                        <span class="detail-label">Type:</span>
                        <span class="item-type ${item.type}">${item.type.toUpperCase()}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-label">Category:</span>
                        <span>${item.category}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-label">Location:</span>
                        <span>${item.location}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-label">Date:</span>
                        <span>${new Date(item.date_occurred).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-label">Posted:</span>
                        <span>${new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-label">Status:</span>
                        <span>${item.status}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="item-detail-description">
            <h3>Description</h3>
            <p>${item.description}</p>
        </div>

        ${contactHtml}
    `;
}

function openMessageModal(receiverId, itemId, receiverName) {
    const messageText = prompt(`Send a message to ${receiverName}:`);
    
    if (messageText) {
        sendMessage(receiverId, itemId, messageText);
    }
}

async function sendMessage(receiverId, itemId, messageText) {
    const result = await apiCall('messages.php', 'POST', {
        receiver_id: receiverId,
        item_id: itemId,
        message_text: messageText
    });

    if (result.success) {
        alert('Message sent successfully!');
    } else {
        alert('Failed to send message. ' + result.message);
    }
}
