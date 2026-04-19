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
    $item_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($item_id === 0) {
        echo json_encode(['success' => false, 'message' => 'Item ID is required']);
        exit();
    }
    
    $sql = "SELECT i.id, i.title, i.description, i.category, i.type, i.location, 
                   i.date_occurred, i.image_path, i.created_at, i.status,
                   u.id as user_id, u.username, u.full_name, u.phone, u.email
            FROM items i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = $item_id";
    
    $result = $conn->query($sql);
    
    if ($result->num_rows === 1) {
        $item = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'item' => $item
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
    }
}
?>
