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
    
    if (empty($data['message_id'])) {
        echo json_encode(['success' => false, 'message' => 'Message ID is required']);
        exit();
    }

    $message_id = (int)$data['message_id'];
    $user_id = $_SESSION['user_id'];

    // Verify the message belongs to the user (sender or receiver can delete)
    $check_sql = "SELECT id, sender_id, receiver_id FROM messages WHERE id = $message_id";
    $check_result = $conn->query($check_sql);

    if ($check_result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Message not found']);
        exit();
    }

    $message = $check_result->fetch_assoc();
    if ($message['sender_id'] != $user_id && $message['receiver_id'] != $user_id) {
        echo json_encode(['success' => false, 'message' => 'You can only delete your own messages']);
        exit();
    }

    // Delete the message
    $delete_sql = "DELETE FROM messages WHERE id = $message_id";
    
    if ($conn->query($delete_sql)) {
        echo json_encode(['success' => true, 'message' => 'Message deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error deleting message: ' . $conn->error]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
