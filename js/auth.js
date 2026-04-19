// Authentication helper functions

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user !== null;
}

function getUser() {
    return JSON.parse(localStorage.getItem('user'));
}

function saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('user');
    location.href = 'index.html';
}

function requireLogin() {
    if (!checkAuth()) {
        alert('Please login to access this page');
        window.location.href = 'login.html';
    }
}

function updateNavbar() {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (checkAuth()) {
        const user = getUser();
        navAuth.innerHTML = `
            <a href="dashboard.html">Dashboard</a> | 
            <a href="#" onclick="logout(); return false;">Logout</a>
        `;
    } else {
        navAuth.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbar);
} else {
    updateNavbar();
}

// API helper function
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const fullUrl = `api/${endpoint}`;
    console.log('🔗 API Call:', fullUrl, 'Method:', method);
    
    try {
        const response = await fetch(fullUrl, options);
        console.log('📡 Response Status:', response.status, response.statusText);
        console.log('📡 Response Headers:', response.headers);
        
        // Get response as text first to debug
        const responseText = await response.text();
        console.log('📄 Response Text:', responseText);
        
        // Try to parse as JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('❌ Response was:', responseText);
            return { success: false, message: 'Invalid response from server' };
        }
        
        console.log('✅ API Response:', result);
        return result;
        
    } catch (error) {
        console.error('❌ FETCH ERROR:', error);
        console.error('❌ Error Name:', error.name);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Error Stack:', error.stack);
        
        return { success: false, message: 'Network error - check console' };
    }
}

// API helper for form data (multipart)
async function apiCallFormData(endpoint, formData) {
    try {
        const response = await fetch(`api/${endpoint}`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Network error' };
    }
}
