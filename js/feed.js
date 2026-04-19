// Feed page functionality - Twitter-like items with comments
let currentPage = 1;
let currentItemForClaim = null;

document.addEventListener('DOMContentLoaded', function() {
    updateAuthStatus();
    
    const filterForm = document.getElementById('filter-form');
    const claimModal = document.getElementById('claim-modal');
    const closeBtn = claimModal.querySelector('.close');
    const claimForm = document.getElementById('claim-form');

    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            currentPage = 1;
            loadFeed();
        });

        filterForm.addEventListener('reset', function() {
            currentPage = 1;
            loadFeed();
        });
    }

    // Modal close
    closeBtn.addEventListener('click', function() {
        claimModal.classList.remove('show');
    });

    window.addEventListener('click', function(event) {
        if (event.target === claimModal) {
            claimModal.classList.remove('show');
        }
    });

    // Claim form submit
    claimForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitClaim();
    });

    // Load feed on initial page load
    loadFeed();
});

async function loadFeed() {
    const container = document.getElementById('feed-container');
    const filterType = document.querySelector('input[name="filter_type"]:checked').value;
    const category = document.getElementById('filter-category').value;
    const search = document.getElementById('search-input').value;

    let url = `api/get_items.php?page=${currentPage}`;
    if (filterType) url += `&type=${filterType}`;
    if (category) url += `&category=${category}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    container.innerHTML = '<p class="loading">Loading items...</p>';

    const result = await apiCall(url);

    if (result.success) {
        if (result.items.length > 0) {
            container.innerHTML = '';
            result.items.forEach(item => {
                const feedPost = createFeedPost(item);
                container.appendChild(feedPost);
            });
            renderPagination(result.total_pages, result.page);
        } else {
            container.innerHTML = '<p class="loading">No items found. Try different filters!</p>';
            document.getElementById('pagination-container').innerHTML = '';
        }
    } else {
        container.innerHTML = '<p class="loading">Error loading items. Please try again.</p>';
    }
}

function createFeedPost(item) {
    const post = document.createElement('div');
    post.className = 'feed-post';
    if (item.status === 'resolved') {
        post.classList.add('resolved');
    }

    const imageUrl = item.image_path ? item.image_path : 'https://via.placeholder.com/500x300?text=No+Image';
    const profilePicUrl = item.profile_picture ? item.profile_picture : 'https://via.placeholder.com/48x48?text=' + item.username[0].toUpperCase();
    
    const createdDate = new Date(item.created_at);
    const timeAgo = getTimeAgo(createdDate);
    
    // Calculate when the item will be hidden (2 days after being marked resolved)
    let expirationText = '';
    let isExpiringSoon = false;
    if (item.status === 'resolved') {
        const resolvedDate = new Date(item.updated_at);
        const expirationDate = new Date(resolvedDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const timeUntilExpiration = expirationDate - new Date();
        
        if (timeUntilExpiration > 0) {
            const hoursLeft = Math.floor(timeUntilExpiration / (1000 * 60 * 60));
            const daysLeft = Math.floor(timeUntilExpiration / (1000 * 60 * 60 * 24));
            
            if (daysLeft > 0) {
                expirationText = `🕐 Will disappear in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
            } else if (hoursLeft > 0) {
                expirationText = `🕐 Will disappear in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`;
                isExpiringSoon = true;
            } else {
                expirationText = '🕐 Disappearing soon...';
                isExpiringSoon = true;
            }
        }
    }

    const postHTML = `
        <div class="post-header" onclick="viewUserProfile(${item.user_id})">
            <img src="${profilePicUrl}" alt="${item.username}" class="post-user-avatar" onerror="this.src='https://via.placeholder.com/48x48?text=${item.username[0]}'">
            <div class="post-user-info">
                <div class="post-user-name">${item.full_name}</div>
                <div class="post-user-handle">@${item.username}</div>
            </div>
            <div class="post-meta">
                <span class="post-status ${item.type}">${item.type.toUpperCase()}</span>
                <span class="post-status status-badge" style="background-color: ${item.status === 'resolved' ? '#FFD700' : item.status === 'closed' ? '#FFB6C6' : '#90EE90'}; color: black;">
                    ${item.status === 'resolved' ? '✅ Resolved' : item.status === 'closed' ? '❌ Closed' : '🟢 Active'}
                </span>
                <span>${timeAgo}</span>
            </div>
        </div>

        <div class="post-content" onclick="viewItemDetail(${item.id})">
            <div class="post-title">${item.title}</div>
            <div class="post-description">${item.description}</div>
            ${imageUrl !== '' ? `<img src="${imageUrl}" alt="${item.title}" class="post-image" onerror="this.style.display='none'">` : ''}
            <div class="post-tags">
                <span class="post-tag">📍 ${item.location}</span>
                <span class="post-tag">🏷️ ${item.category}</span>
                <span class="post-tag">📅 ${new Date(item.date_occurred).toLocaleDateString()}</span>
            </div>
            ${item.status === 'resolved' ? `<div class="post-expiration ${isExpiringSoon ? 'expiring-soon' : ''}">${expirationText}</div>` : ''}
        </div>

        <div class="post-actions">
            <button class="action-btn" onclick="openCommentModal(event, ${item.id}, ${item.user_id})" ${item.status === 'resolved' ? 'disabled' : ''}>
                💬 Comment
            </button>
            <button class="action-btn claim" onclick="openClaimModal(event, ${item.id}, ${item.user_id})" ${item.status === 'resolved' ? 'disabled' : ''}>
                ✓ Claim
            </button>
            <button class="action-btn" onclick="viewItemDetail(${item.id})">
                👁️ View
            </button>
        </div>

        <div class="post-comments" id="comments-${item.id}">
            <div class="comments-header">Comments & Claims</div>
            <div id="comments-list-${item.id}" class="comments-list">
                <p class="no-comments">Loading comments...</p>
            </div>
        </div>
    `;

    post.innerHTML = postHTML;

    // Load comments for this item
    loadComments(item.id);

    return post;
}

async function loadComments(itemId) {
    const url = `api/get_comments.php?item_id=${itemId}`;
    const result = await apiCall(url);

    const commentsList = document.getElementById(`comments-list-${itemId}`);
    
    if (result.success && result.comments && result.comments.length > 0) {
        commentsList.innerHTML = '';
        result.comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = `comment ${comment.is_claim ? 'claim-badge' : ''}`;
            
            const commentDate = new Date(comment.created_at);
            const timeAgo = getTimeAgo(commentDate);
            
            const profilePic = comment.profile_picture ? comment.profile_picture : 'https://via.placeholder.com/32x32?text=' + comment.username[0];

            commentDiv.innerHTML = `
                <div class="comment-user">
                    <img src="${profilePic}" alt="${comment.username}" class="comment-avatar" onerror="this.src='https://via.placeholder.com/32x32?text=${comment.username[0]}'">
                    <div class="comment-info">
                        <span class="comment-name">${comment.full_name}</span>
                        <span class="comment-handle">@${comment.username}</span>
                    </div>
                    <div class="comment-time">${timeAgo}</div>
                </div>
                <div class="comment-text">${comment.comment_text}</div>
            `;

            commentsList.appendChild(commentDiv);
        });
    } else {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
    }
}

function openCommentModal(event, itemId, userId) {
    event.stopPropagation();
    
    if (!checkAuth()) {
        alert('Please login to comment');
        window.location.href = 'login.html';
        return;
    }

    // Check if item is resolved
    const itemElement = event.target.closest('.feed-post');
    if (itemElement && itemElement.classList.contains('resolved')) {
        alert('This item has been claimed and is no longer accepting comments');
        return;
    }

    const user = getUser();
    if (user.id === userId) {
        alert('You cannot comment on your own items');
        return;
    }

    currentItemForClaim = { itemId, userId, isClaim: false };
    const modal = document.getElementById('claim-modal');
    const form = document.getElementById('claim-form');
    
    modal.querySelector('h2').textContent = 'Add Comment';
    document.getElementById('is-claim').checked = false;
    document.getElementById('claim-text').value = '';
    document.getElementById('claim-text').placeholder = 'Share your thoughts...';
    
    modal.classList.add('show');
}

function openClaimModal(event, itemId, userId) {
    event.stopPropagation();
    
    if (!checkAuth()) {
        alert('Please login to claim');
        window.location.href = 'login.html';
        return;
    }

    // Check if item is already resolved
    const itemElement = event.target.closest('.feed-post');
    if (itemElement && itemElement.classList.contains('resolved')) {
        alert('This item has already been claimed');
        return;
    }

    const user = getUser();
    if (user.id === userId) {
        alert('You cannot claim your own items');
        return;
    }

    currentItemForClaim = { itemId, userId, isClaim: true };
    const modal = document.getElementById('claim-modal');
    
    modal.querySelector('h2').textContent = 'Claim This Item';
    document.getElementById('is-claim').checked = true;
    document.getElementById('claim-text').value = '';
    document.getElementById('claim-text').placeholder = 'Explain why you believe you have this item...';
    
    modal.classList.add('show');
}

async function submitClaim() {
    const messageText = document.getElementById('claim-text').value;
    const isClaim = document.getElementById('is-claim').checked;

    if (!messageText.trim()) {
        alert('Please enter a message');
        return;
    }

    const result = await apiCall('api/add_comment.php', 'POST', {
        item_id: currentItemForClaim.itemId,
        comment_text: messageText,
        is_claim: isClaim
    });

    if (result.success) {
        alert('Comment posted successfully!');
        document.getElementById('claim-modal').classList.remove('show');
        loadComments(currentItemForClaim.itemId);
    } else {
        alert('Failed to post comment: ' + result.message);
    }
}

function viewItemDetail(itemId) {
    window.location.href = `item-detail.html?id=${itemId}`;
}

function viewUserProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    
    return Math.floor(seconds) + "s";
}

function updateAuthStatus() {
    const authStatus = document.getElementById('auth-status');
    if (checkAuth()) {
        const user = getUser();
        authStatus.innerHTML = `Logged in as <strong>@${user.username}</strong><br><a href="post-item.html" class="btn btn-primary" style="display: block; text-align: center; margin-top: 10px;">+ Post Item</a>`;
    } else {
        authStatus.innerHTML = `<a href="login.html" class="btn btn-primary" style="display: block; text-align: center;">Login to Post Items</a>`;
    }
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
            loadFeed();
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
                loadFeed();
                window.scrollTo(0, 0);
            });
            container.appendChild(link);
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
            loadFeed();
            window.scrollTo(0, 0);
        });
        container.appendChild(next);
    }
}
