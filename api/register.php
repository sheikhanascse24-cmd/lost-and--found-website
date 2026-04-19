<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require_once __DIR__ . '/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Register new user
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check all required fields
    if (empty($_POST['full_name']) || empty($_POST['email']) || empty($_POST['password']) || empty($_POST['phone']) || empty($_POST['branch']) || empty($_POST['semester']) || empty($_POST['section'])) {
        echo json_encode(['success' => false, 'message' => 'Full Name, Email Address, Password, Phone Number, Branch, Semester, and Section are required']);
        exit();
    }
    
    $full_name = $conn->real_escape_string($_POST['full_name']);
    $email = $conn->real_escape_string($_POST['email']);
    $phone = $conn->real_escape_string($_POST['phone']);
    $password = $_POST['password'];
    $branch = $conn->real_escape_string($_POST['branch']);
    $semester = $conn->real_escape_string($_POST['semester']);
    $section = $conn->real_escape_string($_POST['section']);
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Please enter a valid email address']);
        exit();
    }
    
    // Validate password length
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit();
    }
    
    // Hash password
    $password = password_hash($password, PASSWORD_BCRYPT);
    
    // Optional fields
    $username = isset($_POST['username']) && !empty($_POST['username']) ? $conn->real_escape_string($_POST['username']) : 'user_' . uniqid();
    $address = isset($_POST['address']) && !empty($_POST['address']) ? $conn->real_escape_string($_POST['address']) : '';
    
    // Check if user already exists
    $check_sql = "SELECT id FROM users WHERE email = '$email' OR username = '$username'";
    $result = $conn->query($check_sql);
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email or username already registered']);
        exit();
    }
    
    $profile_picture = null;
    
    // Handle profile picture upload
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../uploads/profiles/';
        
        // Create upload directory if it doesn't exist
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $file_tmp = $_FILES['profile_picture']['tmp_name'];
        $file_name = basename($_FILES['profile_picture']['name']);
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        // Validate file type
        $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
        if (!in_array($file_ext, $allowed_types)) {
            echo json_encode(['success' => false, 'message' => 'Only image files are allowed for profile picture']);
            exit();
        }
        
        // Create unique filename
        $unique_name = uniqid() . '.' . $file_ext;
        $upload_path = $upload_dir . $unique_name;
        
        if (move_uploaded_file($file_tmp, $upload_path)) {
            $profile_picture = 'uploads/profiles/' . $unique_name;
        }
    }
    
    // Insert new user
    $insert_sql = "INSERT INTO users (username, email, password, full_name, phone, address, branch, semester, section, profile_picture) 
                   VALUES ('$username', '$email', '$password', '$full_name', '$phone', '$address', '$branch', '$semester', '$section', " . 
                   ($profile_picture ? "'$profile_picture'" : "NULL") . ")";
    
    if ($conn->query($insert_sql) === TRUE) {
        $user_id = $conn->insert_id;
        
        // Debug: Log successful insertion
        error_log('✅ User registered successfully');
        error_log('👤 User ID: ' . $user_id);
        error_log('📧 Email: ' . $email);
        error_log('🔐 Password hash saved in database');
        error_log('═══════════════════════════════════════');
        
        echo json_encode([
            'success' => true, 
            'message' => 'Registration successful! Please login.',
            'debug' => 'Password has been securely hashed. Use the same password to login.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $conn->error]);
    }
}
?>
