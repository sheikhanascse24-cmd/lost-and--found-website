<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

require_once __DIR__ . '/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Send message
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Please login first']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['receiver_id']) || empty($data['message_text'])) {
        echo json_encode(['success' => false, 'message' => 'Receiver ID and message are required']);
        exit();
    }
    
    $sender_id = $_SESSION['user_id'];
    $receiver_id = (int)$data['receiver_id'];
    $message_text = $conn->real_escape_string($data['message_text']);
    $item_id = isset($data['item_id']) ? (int)$data['item_id'] : null;
    
    // Prevent sending message to self
    if ($sender_id == $receiver_id) {
        echo json_encode(['success' => false, 'message' => 'Cannot send message to yourself']);
        exit();
    }
    
    $sql = "INSERT INTO messages (sender_id, receiver_id, item_id, message_text) 
            VALUES ($sender_id, $receiver_id, " . ($item_id ? $item_id : "NULL") . ", '$message_text')";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => true, 'message' => 'Message sent successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send message']);
    }
}

// Get messages
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Please login first']);
        exit();
    }
    
    $user_id = $_SESSION['user_id'];
    $conversation_with = isset($_GET['conversation_with']) ? (int)$_GET['conversation_with'] : null;
    
    if ($conversation_with) {
        // Get conversation between two users
        $sql = "SELECT m.id, m.sender_id, m.receiver_id, m.message_text, m.read_status, m.created_at,
                       u.username, u.full_name
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE (m.sender_id = $user_id AND m.receiver_id = $conversation_with) 
                   OR (m.sender_id = $conversation_with AND m.receiver_id = $user_id)
                ORDER BY m.created_at DESC
                LIMIT 50";
    } else {
        // Get all conversations
        $sql = "SELECT DISTINCT 
                       CASE WHEN sender_id = $user_id THEN receiver_id ELSE sender_id END as other_user_id,
                       (SELECT full_name FROM users WHERE id = 
                           CASE WHEN sender_id = $user_id THEN receiver_id ELSE sender_id END
                       ) as other_user_name,
                       MAX(created_at) as last_message_time,
                       SUM(CASE WHEN receiver_id = $user_id AND read_status = 0 THEN 1 ELSE 0 END) as unread_count
                FROM messages
                WHERE sender_id = $user_id OR receiver_id = $user_id
                GROUP BY other_user_id
                ORDER BY last_message_time DESC";
    }
    
    $result = $conn->query($sql);
    $messages = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $messages[] = $row;
        }
    }
    
    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
}
?>
