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

    if (empty($data['item_id']) || empty($data['comment_text'])) {
        echo json_encode(['success' => false, 'message' => 'Item ID and comment text are required']);
        exit();
    }

    $user_id = $_SESSION['user_id'];
    $item_id = (int)$data['item_id'];
    $comment_text = $conn->real_escape_string($data['comment_text']);
    $is_claim = isset($data['is_claim']) && $data['is_claim'] ? 1 : 0;

    // Check item belongs to different user
    $check_sql = "SELECT user_id FROM items WHERE id = $item_id";
    $check_result = $conn->query($check_sql);

    if ($check_result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit();
    }

    $item = $check_result->fetch_assoc();
    if ($item['user_id'] == $user_id) {
        echo json_encode(['success' => false, 'message' => 'Cannot comment on your own items']);
        exit();
    }

    $insert_sql = "INSERT INTO responses (item_id, user_id, comment_text, is_claim) 
                   VALUES ($item_id, $user_id, '$comment_text', $is_claim)";

    if ($conn->query($insert_sql) === TRUE) {
        // If this is a claim, mark the item as resolved
        if ($is_claim) {
            $update_sql = "UPDATE items SET status = 'resolved', updated_at = NOW() WHERE id = $item_id";
            $conn->query($update_sql);
        }
        
        echo json_encode(['success' => true, 'message' => 'Comment posted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to post comment: ' . $conn->error]);
    }
}
?>
