<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

require_once __DIR__ . '/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Logout
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    exit();
}

// Get user's items and profile
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Please login first']);
        exit();
    }
    
    $user_id = $_SESSION['user_id'];
    
    // Get user info
    $user_sql = "SELECT id, username, email, full_name, phone, address, created_at FROM users WHERE id = $user_id";
    $user_result = $conn->query($user_sql);
    $user = $user_result->fetch_assoc();
    
    // Get user's items
    $items_sql = "SELECT id, title, description, type, category, status, location, image_path, created_at 
                  FROM items WHERE user_id = $user_id ORDER BY created_at DESC";
    $items_result = $conn->query($items_sql);
    
    $items = [];
    if ($items_result->num_rows > 0) {
        while ($row = $items_result->fetch_assoc()) {
            $items[] = $row;
        }
    }
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'items' => $items
    ]);
}
?>
