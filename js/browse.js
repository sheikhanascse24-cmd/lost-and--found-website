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
        if (result.items.length > 0) {
            container.innerHTML = '';
            result.items.forEach(item => {
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
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
        window.location.href = `item-detail.html?id=${item.id}`;
    });

    const imageUrl = item.image_path ? item.image_path : 'https://via.placeholder.com/250x200?text=No+Image';
    
    // Determine status badge
    let statusHTML = '';
    let statusColor = '#90EE90';
    let statusEmoji = '🟢';
    let statusText = 'Active';

    if (item.status === 'resolved') {
        statusColor = '#FFD700';
        statusEmoji = '✅';
        statusText = 'Resolved';
    } else if (item.status === 'closed') {
        statusColor = '#FFB6C6';
        statusEmoji = '❌';
        statusText = 'Closed';
    }

    statusHTML = `<span class="item-status" style="background-color: ${statusColor}; color: black; margin-left: 8px;">${statusEmoji} ${statusText}</span>`;
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${item.title}" class="item-image">
        <div class="item-info">
            <div class="item-type-wrapper">
                <div class="item-type ${item.type}">${item.type.toUpperCase()}</div>
                ${statusHTML}
            </div>
            <h3 class="item-title">${item.title}</h3>
            <p class="item-category"><strong>Category:</strong> ${item.category}</p>
            <p class="item-location"><strong>Location:</strong> ${item.location}</p>
            <p class="item-date">Posted: ${new Date(item.created_at).toLocaleDateString()}</p>
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
