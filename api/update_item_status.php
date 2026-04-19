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
    
    if (empty($data['item_id']) || empty($data['status'])) {
        echo json_encode(['success' => false, 'message' => 'Item ID and status are required']);
        exit();
    }

    $item_id = (int)$data['item_id'];
    $status = $conn->real_escape_string($data['status']);
    $user_id = $_SESSION['user_id'];

    // Verify the item belongs to the user
    $check_sql = "SELECT id, user_id FROM items WHERE id = $item_id";
    $check_result = $conn->query($check_sql);

    if ($check_result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit();
    }

    $item = $check_result->fetch_assoc();
    if ($item['user_id'] != $user_id) {
        echo json_encode(['success' => false, 'message' => 'You can only update your own items']);
        exit();
    }

    // Valid statuses - use only what's in database ENUM
    $valid_statuses = ['active', 'resolved', 'closed'];
    if (!in_array($status, $valid_statuses)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit();
    }

    // Update status
    $update_sql = "UPDATE items SET status = '$status', updated_at = CURRENT_TIMESTAMP WHERE id = $item_id";
    
    if ($conn->query($update_sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Item status updated successfully',
            'new_status' => $status
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update status: ' . $conn->error]);
    }
}
?>
