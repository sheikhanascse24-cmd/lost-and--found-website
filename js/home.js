// Home page functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Update post button based on login status
    const postBtn = document.getElementById('post-btn');
    if (postBtn && !checkAuth()) {
        postBtn.href = 'login.html';
    }

    const container = document.getElementById('recent-items-container');

    if (container) {
        // Fetch both active and resolved items
        const result = await apiCall('get_items.php?page=1');

        if (result.success && result.items.length > 0) {
            // Filter out closed items
            const filteredItems = result.items.filter(item => item.status !== 'closed');
            
            container.innerHTML = '';
            filteredItems.slice(0, 6).forEach(item => {
                const itemCard = createItemCard(item);
                container.appendChild(itemCard);
            });
        } else {
            container.innerHTML = '<p>No items posted yet.</p>';
        }
    }
});

function createItemCard(item) {
    // Skip if item is closed
    if (item.status === 'closed') {
        return document.createElement('div');
    }

    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
        window.location.href = `item-detail.html?id=${item.id}`;
    });

    const imageUrl = item.image_path ? item.image_path : 'https://via.placeholder.com/250x200?text=No+Image';
    const statusColor = item.status === 'resolved' ? '#FFD700' : '#90EE90';
    const statusEmoji = item.status === 'resolved' ? '✅ Resolved' : '🟢 Active';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${item.title}" class="item-image" onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'">
        <div class="item-info">
            <div class="item-type-wrapper">
                <div class="item-type ${item.type}">${item.type.toUpperCase()}</div>
                <span class="item-status" style="background-color: ${statusColor}; color: black;">${statusEmoji}</span>
            </div>
            <h3 class="item-title">${item.title}</h3>
            <p class="item-category"><strong>Category:</strong> ${item.category}</p>
            <p class="item-location"><strong>Location:</strong> ${item.location}</p>
            <p class="item-date">Posted: ${new Date(item.created_at).toLocaleDateString()}</p>
        </div>
    `;

    return card;
}
