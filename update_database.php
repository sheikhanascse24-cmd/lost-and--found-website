<?php
require_once __DIR__ . '/api/db_connection.php';

// Update the status ENUM to include 'collected' and 'found'
$sql = "ALTER TABLE items MODIFY COLUMN status ENUM('active', 'resolved', 'closed', 'collected', 'found') DEFAULT 'active'";

if ($conn->query($sql) === TRUE) {
    echo json_encode([
        'success' => true,
        'message' => '✅ Database schema updated successfully!',
        'change' => 'Added "collected" and "found" statuses to items table'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => '❌ Error updating database',
        'error' => $conn->error
    ]);
}
?>
