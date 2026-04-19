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
    $user_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($user_id === 0) {
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit();
    }

    // Get user info
    $sql = "SELECT id, username, email, full_name, phone, profile_picture, 
                   branch, semester, section, bio, created_at 
            FROM users WHERE id = $user_id";
    $result = $conn->query($sql);

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit();
    }

    $user = $result->fetch_assoc();

    echo json_encode([
        'success' => true,
        'user' => $user
    ]);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
