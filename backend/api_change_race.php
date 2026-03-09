<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['race']) || !isset($data['sprite_path'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

$playerId = $_SESSION['player_id'];
$race = $data['race'];
$sprite = $data['sprite_path'];

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=kursor_souls', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try {
        $stmt = $pdo->prepare("UPDATE players SET race = ?, sprite_path = ? WHERE id = ?");
        $stmt->execute([$race, $sprite, $playerId]);
    } catch (PDOException $e) {
        if ($e->getCode() == '42S22') { 
            $stmt = $pdo->prepare("UPDATE players SET race = ?, sprite = ? WHERE id = ?");
            $stmt->execute([$race, $sprite, $playerId]);
        } else {
            throw $e;
        }
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>