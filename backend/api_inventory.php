<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$playerId = $_SESSION['player_id'];

try {
    require_once 'connection.php';
    
    if (!isset($pdo)) {
        $pdo = new PDO('mysql:host=127.0.0.1;dbname=kursor_souls;charset=utf8', 'root', '');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    $stmt = $pdo->prepare("SELECT inventory.*, item_templates.icon_path, item_templates.equip_path FROM inventory LEFT JOIN item_templates ON inventory.item_name = item_templates.name WHERE inventory.player_id = ?");
    $stmt->execute([$playerId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'inventory' => $items]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>