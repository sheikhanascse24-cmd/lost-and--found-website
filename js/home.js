// Home page functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Update post button based on login status
    const postBtn = document.getElementById('post-btn');
    if (postBtn && !checkAuth()) {
        postBtn.href = 'login.html';
    }

    const container = document.getElementById('recent-items-container');

    if (container) {
        const result = await apiCall('get_items.php?page=1&status=active');

        if (result.success && result.items.length > 0) {
            container.innerHTML = '';
            result.items.slice(0, 6).forEach(item => {
                const itemCard = createItemCard(item);
                container.appendChild(itemCard);
            });
        } else {
            container.innerHTML = '<p>No items posted yet.</p>';
        }
    }
});

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
        window.location.href = `item-detail.html?id=${item.id}`;
    });

    const imageUrl = item.image_path ? item.image_path : 'https://via.placeholder.com/250x200?text=No+Image';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${item.title}" class="item-image" onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'">
        <div class="item-info">
            <div class="item-type ${item.type}">${item.type.toUpperCase()}</div>
            <h3 class="item-title">${item.title}</h3>
            <p class="item-category"><strong>Category:</strong> ${item.category}</p>
            <p class="item-location"><strong>Location:</strong> ${item.location}</p>
            <p class="item-date">Posted: ${new Date(item.created_at).toLocaleDateString()}</p>
        </div>
    `;

    return card;
}
