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
    $item_id = isset($_GET['item_id']) ? (int)$_GET['item_id'] : 0;

    if ($item_id === 0) {
        echo json_encode(['success' => false, 'message' => 'Item ID is required']);
        exit();
    }

    $sql = "SELECT r.id, r.comment_text, r.is_claim, r.created_at,
                   u.id as user_id, u.username, u.full_name, u.profile_picture
            FROM responses r
            JOIN users u ON r.user_id = u.id
            WHERE r.item_id = $item_id
            ORDER BY r.created_at DESC";

    $result = $conn->query($sql);

    $comments = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $comments[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'comments' => $comments
    ]);
}
?>
