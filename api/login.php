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
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['email']) || empty($data['password'])) {
        echo json_encode(['success' => false, 'message' => 'Email and password required']);
        exit();
    }
    
    $email = $conn->real_escape_string($data['email']);
    
    $sql = "SELECT id, username, email, password, full_name FROM users WHERE email = '$email'";
    $result = $conn->query($sql);
    
    // User not found
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'User not found', 'debug' => 'No user found with email: ' . $email]);
        exit();
    }
    
    // User found, check password
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        if (password_verify($data['password'], $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['full_name'] = $user['full_name'];
            
            echo json_encode([
                'success' => true, 
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'full_name' => $user['full_name']
                ]
            ]);
        } else {
            // Wrong password
            echo json_encode(['success' => false, 'message' => 'Invalid password', 'debug' => 'Password does not match']);
        }
    }
}
?>
