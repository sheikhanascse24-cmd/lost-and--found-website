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
    // Check if user is logged in
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Please login first']);
        exit();
    }
    
    $user_id = $_SESSION['user_id'];
    $title = $conn->real_escape_string($_POST['title'] ?? '');
    $description = $conn->real_escape_string($_POST['description'] ?? '');
    $category = $conn->real_escape_string($_POST['category'] ?? '');
    $type = in_array($_POST['type'] ?? '', ['lost', 'found']) ? $_POST['type'] : 'lost';
    $location = $conn->real_escape_string($_POST['location'] ?? '');
    $date_occurred = $_POST['date_occurred'] ?? date('Y-m-d');
    
    if (empty($title) || empty($description) || empty($category)) {
        echo json_encode(['success' => false, 'message' => 'Title, description, and category are required']);
        exit();
    }
    
    $image_path = null;
    
    // Handle file upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../uploads/';
        
        // Create uploads directory if it doesn't exist
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $file_tmp = $_FILES['image']['tmp_name'];
        $file_name = basename($_FILES['image']['name']);
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        // Validate file type
        $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
        if (!in_array($file_ext, $allowed_types)) {
            echo json_encode(['success' => false, 'message' => 'Only image files are allowed']);
            exit();
        }
        
        // Create unique filename
        $unique_name = uniqid() . '.' . $file_ext;
        $upload_path = $upload_dir . $unique_name;
        
        if (move_uploaded_file($file_tmp, $upload_path)) {
            $image_path = 'uploads/' . $unique_name;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
            exit();
        }
    }
    
    // Insert item into database
    $insert_sql = "INSERT INTO items (user_id, title, description, category, type, location, date_occurred, image_path) 
                   VALUES ($user_id, '$title', '$description', '$category', '$type', '$location', '$date_occurred', " . 
                   ($image_path ? "'$image_path'" : "NULL") . ")";
    
    if ($conn->query($insert_sql) === TRUE) {
        $item_id = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Item posted successfully',
            'item_id' => $item_id
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to post item: ' . $conn->error]);
    }
}
?>
