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
    
    if (empty($data['item_id'])) {
        echo json_encode(['success' => false, 'message' => 'Item ID is required']);
        exit();
    }

    $item_id = (int)$data['item_id'];
    $user_id = $_SESSION['user_id'];

    // Verify the item belongs to the user
    $check_sql = "SELECT id, user_id, image_path FROM items WHERE id = $item_id";
    $check_result = $conn->query($check_sql);

    if ($check_result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit();
    }

    $item = $check_result->fetch_assoc();
    if ($item['user_id'] != $user_id) {
        echo json_encode(['success' => false, 'message' => 'You can only delete your own items']);
        exit();
    }

    // Delete the item
    $delete_sql = "DELETE FROM items WHERE id = $item_id";
    
    if ($conn->query($delete_sql)) {
        // Delete the image file if it exists
        if ($item['image_path'] && file_exists(__DIR__ . '/../' . $item['image_path'])) {
            unlink(__DIR__ . '/../' . $item['image_path']);
        }

        echo json_encode(['success' => true, 'message' => 'Item deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error deleting item: ' . $conn->error]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
