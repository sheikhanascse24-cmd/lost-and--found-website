<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require_once __DIR__ . '/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Please login first']);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['other_user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Other user ID is required']);
        exit();
    }

    $other_user_id = (int)$data['other_user_id'];
    $user_id = $_SESSION['user_id'];

    // Delete all messages in the conversation between these two users
    $delete_sql = "DELETE FROM messages 
                   WHERE (sender_id = $user_id AND receiver_id = $other_user_id)
                      OR (sender_id = $other_user_id AND receiver_id = $user_id)";
    
    if ($conn->query($delete_sql)) {
        echo json_encode(['success' => true, 'message' => 'Chat cleared successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error clearing chat: ' . $conn->error]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
