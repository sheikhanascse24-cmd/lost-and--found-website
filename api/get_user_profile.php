<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

require_once __DIR__ . '/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    if ($user_id === 0) {
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit();
    }

    // Get user profile
    $user_sql = "SELECT id, username, email, full_name, phone, address, profile_picture, 
                        branch, semester, section, bio, created_at 
                 FROM users WHERE id = $user_id";
    $user_result = $conn->query($user_sql);

    if ($user_result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit();
    }

    $user = $user_result->fetch_assoc();

    // Get user's posted items
    $items_sql = "SELECT id, title, description, category, type, location, date_occurred, 
                         image_path, status, created_at 
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
