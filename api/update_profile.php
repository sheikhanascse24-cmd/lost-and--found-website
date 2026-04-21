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
    
    $user_id = $_SESSION['user_id'];
    
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = isset($data['username']) ? $conn->real_escape_string(trim($data['username'])) : '';
    $email = isset($data['email']) ? $conn->real_escape_string(trim($data['email'])) : '';
    $full_name = isset($data['full_name']) ? $conn->real_escape_string(trim($data['full_name'])) : '';
    
    // Validate required fields
    if (empty($username) || empty($email) || empty($full_name)) {
        echo json_encode(['success' => false, 'message' => 'Username, Email and Full Name are required']);
        exit();
    }
    
    // Check if email is valid
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit();
    }
    
    // Check if email is already used by another user
    $check_email_sql = "SELECT id FROM users WHERE email = '$email' AND id != $user_id";
    $check_result = $conn->query($check_email_sql);
    if ($check_result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email is already in use']);
        exit();
    }
    
    // Check if username is already used by another user
    $check_username_sql = "SELECT id FROM users WHERE username = '$username' AND id != $user_id";
    $check_result = $conn->query($check_username_sql);
    if ($check_result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Username is already in use']);
        exit();
    }
    
    // Update user profile
    $update_sql = "UPDATE users SET 
                   username = '$username',
                   email = '$email',
                   full_name = '$full_name',
                   updated_at = NOW()
                   WHERE id = $user_id";
    
    if ($conn->query($update_sql)) {
        // Get updated user info
        $user_sql = "SELECT id, username, email, full_name, phone, address, created_at FROM users WHERE id = $user_id";
        $user_result = $conn->query($user_sql);
        $user = $user_result->fetch_assoc();
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating profile: ' . $conn->error]);
    }
}
?>
