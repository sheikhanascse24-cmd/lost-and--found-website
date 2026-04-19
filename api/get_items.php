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
    $type = isset($_GET['type']) ? $conn->real_escape_string($_GET['type']) : '';
    $category = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : '';
    $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
    $status = isset($_GET['status']) ? $conn->real_escape_string($_GET['status']) : '';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 12;
    $offset = ($page - 1) * $limit;
    
    $where_clauses = [];
    
    // If status is empty, show ALL items (active, resolved, closed)
    // If status='active', show only active items
    // If status is specific, show only that status
    if (!empty($status)) {
        if ($status === 'active') {
            // Show active items and recently resolved items (within 2 days)
            $where_clauses[] = "(i.status = 'active' OR (i.status = 'resolved' AND i.updated_at > DATE_SUB(NOW(), INTERVAL 2 DAY)))";
        } else {
            $where_clauses[] = "i.status = '$status'";
        }
    }
    // If no status specified, show ALL items (no status filter)
    
    if (!empty($type) && in_array($type, ['lost', 'found'])) {
        $where_clauses[] = "i.type = '$type'";
    }
    
    if (!empty($category)) {
        $where_clauses[] = "i.category = '$category'";
    }
    
    if (!empty($search)) {
        $where_clauses[] = "MATCH(i.title, i.description) AGAINST ('$search' IN BOOLEAN MODE)";
    }
    
    $where = !empty($where_clauses) ? implode(' AND ', $where_clauses) : '1=1';
    
    // Get total count
    $count_sql = "SELECT COUNT(*) as total FROM items i WHERE $where";
    $count_result = $conn->query($count_sql);
    $total_items = $count_result->fetch_assoc()['total'];
    
    // Get items
    $sql = "SELECT i.id, i.title, i.description, i.category, i.type, i.location, 
                   i.date_occurred, i.image_path, i.created_at, i.status,
                   u.id as user_id, u.username, u.full_name, u.phone
            FROM items i
            JOIN users u ON i.user_id = u.id
            WHERE $where
            ORDER BY i.created_at DESC
            LIMIT $limit OFFSET $offset";
    
    $result = $conn->query($sql);
    
    $items = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
    }
    
    echo json_encode([
        'success' => true,
        'items' => $items,
        'total' => $total_items,
        'page' => $page,
        'per_page' => $limit,
        'total_pages' => ceil($total_items / $limit)
    ]);
}
?>
