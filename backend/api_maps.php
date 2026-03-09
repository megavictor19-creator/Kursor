<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=kursor_souls;charset=utf8', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT * FROM maps ORDER BY required_level ASC");
    $maps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'maps' => $maps]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>