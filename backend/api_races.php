<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

require_once 'connection.php';

if (!isset($pdo)) {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=kursor_souls', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}

$action = $_GET['action'] ?? '';
$playerId = $_SESSION['player_id'];

if ($action == 'get') {
    $stmt = $pdo->prepare("SELECT race_name FROM player_unlocked_races WHERE player_id = ?");
    $stmt->execute([$playerId]);
    $unlocked = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['success' => true, 'unlocked' => $unlocked]);
} 
elseif ($action == 'change') {
    $data = json_decode(file_get_contents('php://input'), true);
    $newRace = $data['race'];
    $sprite = $data['sprite_path'];

    $stmt = $pdo->prepare("UPDATE players SET race = ?, sprite_path = ? WHERE id = ?");
    $stmt->execute([$newRace, $sprite, $playerId]);
    echo json_encode(['success' => true]);
}
elseif ($action == 'craft') {
    $data = json_decode(file_get_contents('php://input'), true);
    $raceToUnlock = $data['race'];
    
    $fragmentNamePt = "Fragmento de " . $raceToUnlock;
    $fragmentNameEn = $raceToUnlock . " Fragment";

    $check = $pdo->prepare("SELECT id FROM player_unlocked_races WHERE player_id = ? AND race_name = ?");
    $check->execute([$playerId, $raceToUnlock]);
    
    if ($check->rowCount() > 0) {
        echo json_encode(['success' => false, 'error' => 'You already possess the knowledge of this soul.']);
        exit;
    }

    $checkFrags = $pdo->prepare("SELECT id FROM inventory WHERE player_id = ? AND (item_name = ? OR item_name = ?) LIMIT 5");
    $checkFrags->execute([$playerId, $fragmentNamePt, $fragmentNameEn]);
    $fragments = $checkFrags->fetchAll(PDO::FETCH_ASSOC);

    if (count($fragments) < 5) {
        echo json_encode(['success' => false, 'error' => 'Insufficient fragments in inventory!']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $fragIds = array_column($fragments, 'id');
        $inQuery = implode(',', array_fill(0, count($fragIds), '?'));
        
        $delStmt = $pdo->prepare("DELETE FROM inventory WHERE id IN ($inQuery)");
        $delStmt->execute($fragIds);

        $stmt = $pdo->prepare("INSERT INTO player_unlocked_races (player_id, race_name) VALUES (?, ?)");
        $stmt->execute([$playerId, $raceToUnlock]);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Transmutation failed on the server: ' . $e->getMessage()]);
    }
}
?>