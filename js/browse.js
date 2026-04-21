// Browse page functionality
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('filter-form');

    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            currentPage = 1;
            loadItems();
        });

        filterForm.addEventListener('reset', function() {
            currentPage = 1;
            loadItems();
        });
    }

    // Load items on initial page load
    loadItems();
});

async function loadItems() {
    const container = document.getElementById('items-container');
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;
    const search = document.getElementById('search-input').value;

    // Load ALL items (not just active) so we can show status
    let url = `get_items.php?page=${currentPage}`;
    if (type) url += `&type=${type}`;
    if (category) url += `&category=${category}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    container.innerHTML = '<p>Loading items...</p>';

    const result = await apiCall(url);

    if (result.success) {
        // Filter out closed items
        const filteredItems = result.items.filter(item => item.status !== 'closed');
        
        if (filteredItems.length > 0) {
            container.innerHTML = '';
            filteredItems.forEach(item => {
                const itemCard = createItemCard(item);
                container.appendChild(itemCard);
            });
            renderPagination(result.total_pages, result.page);
        } else {
            container.innerHTML = '<p>No items found matching your criteria.</p>';
            document.getElementById('pagination-container').innerHTML = '';
        }
    } else {
        container.innerHTML = '<p>Error loading items. Please try again.</p>';
    }
}

function createItemCard(item) {
    // Skip if item is closed
    if (item.status === 'closed') {
        return document.createElement('div');
    }

    const card = document.createElement('div');
    card.className = 'item-card';

    const imageUrl = item.image_path ? item.image_path : 'https://via.placeholder.com/250x200?text=No+Image';
    
    // Determine status badge (only active and resolved, never show closed)
    let statusHTML = '';
    let statusColor = '#90EE90';
    let statusEmoji = '🟢';
    let statusText = 'Active';

    if (item.status === 'resolved') {
        statusColor = '#FFD700';
        statusEmoji = '✅';
        statusText = 'Resolved';
    }

    statusHTML = `<span class="item-status" style="background-color: ${statusColor}; color: black; margin-left: 8px;">${statusEmoji} ${statusText}</span>`;
    
    // Check if current user is the owner
    const currentUser = getUser();
    const isOwner = currentUser && currentUser.id === item.user_id;
    
    // Add delete button only if user is the owner
    let deleteButtonHTML = '';
    if (isOwner) {
        deleteButtonHTML = `
            <div style="margin-top: 10px;">
                <button onclick="deleteItemFromBrowse(event, ${item.id})" style="background-color: #FF6B6B; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    🗑️ Delete Post
                </button>
            </div>
        `;
    }
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${item.title}" class="item-image" style="cursor: pointer;" onclick="window.location.href='item-detail.html?id=${item.id}'">
        <div class="item-info">
            <div class="item-type-wrapper">
                <div class="item-type ${item.type}">${item.type.toUpperCase()}</div>
                ${statusHTML}
            </div>
            <h3 class="item-title" style="cursor: pointer;" onclick="window.location.href='item-detail.html?id=${item.id}'">${item.title}</h3>
            <p class="item-category"><strong>Category:</strong> ${item.category}</p>
            <p class="item-location"><strong>Location:</strong> ${item.location}</p>
            <p class="item-date">Posted: ${new Date(item.created_at).toLocaleDateString()}</p>
            ${deleteButtonHTML}
        </div>
    `;

    return card;
}

function renderPagination(totalPages, currentPageNum) {
    const container = document.getElementById('pagination-container');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    if (currentPageNum > 1) {
        const prev = document.createElement('a');
        prev.href = '#';
        prev.textContent = '← Previous';
        prev.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = currentPageNum - 1;
            loadItems();
            window.scrollTo(0, 0);
        });
        container.appendChild(prev);
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPageNum) {
            const span = document.createElement('span');
            span.textContent = i;
            span.className = 'active';
            container.appendChild(span);
        } else if (i === 1 || i === totalPages || (i >= currentPageNum - 1 && i <= currentPageNum + 1)) {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = i;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                loadItems();
                window.scrollTo(0, 0);
            });
            container.appendChild(link);
        } else if (i === 2 || i === totalPages - 1) {
            const span = document.createElement('span');
            span.textContent = '...';
            container.appendChild(span);
        }
    }

    // Next button
    if (currentPageNum < totalPages) {
        const next = document.createElement('a');
        next.href = '#';
        next.textContent = 'Next →';
        next.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = currentPageNum + 1;
            loadItems();
            window.scrollTo(0, 0);
        });
        container.appendChild(next);
    }
}

async function deleteItemFromBrowse(event, itemId) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    
    const result = await apiCall('delete_item.php', 'POST', {
        item_id: itemId
    });

    if (result.success) {
        alert('✅ Post deleted successfully!');
        loadItems();
    } else {
        alert('❌ Error: ' + result.message);
    }
}
