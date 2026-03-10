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

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT inventory.*, item_templates.icon_path, item_templates.equip_path, item_templates.base_stats_json as tpl_stats FROM inventory LEFT JOIN item_templates ON inventory.item_name = item_templates.name WHERE inventory.player_id = ?");
        $stmt->execute([$playerId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'inventory' => $items]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';

        if ($action === 'equip') {
            $itemId  = (int)($data['item_id'] ?? 0);
            $slotCat = strtolower(trim($data['slot'] ?? ''));
            if (!$itemId || !$slotCat) { echo json_encode(['success' => false, 'error' => 'Invalid data']); exit; }
            $stmtCheck = $pdo->prepare("SELECT id FROM inventory WHERE id = ? AND player_id = ?");
            $stmtCheck->execute([$itemId, $playerId]);
            if (!$stmtCheck->fetch()) { echo json_encode(['success' => false, 'error' => 'Item not found']); exit; }
            $pdo->prepare("UPDATE inventory SET is_equipped = 0 WHERE player_id = ? AND LOWER(category) = ? AND is_equipped = 1")->execute([$playerId, $slotCat]);
            $pdo->prepare("UPDATE inventory SET is_equipped = 1 WHERE id = ? AND player_id = ?")->execute([$itemId, $playerId]);
            echo json_encode(['success' => true]);

        } elseif ($action === 'unequip') {
            $itemId = (int)($data['item_id'] ?? 0);
            if (!$itemId) { echo json_encode(['success' => false, 'error' => 'Invalid data']); exit; }
            $pdo->prepare("UPDATE inventory SET is_equipped = 0 WHERE id = ? AND player_id = ?")->execute([$itemId, $playerId]);
            echo json_encode(['success' => true]);

        } elseif ($action === 'add_item') {
            $itemName = trim($data['item_name'] ?? '');
            $rarity   = $data['rarity']   ?? 'Common';
            $category = $data['category'] ?? 'Core';
            if (!$itemName) { echo json_encode(['success' => false, 'error' => 'Invalid item']); exit; }
            $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM inventory WHERE player_id = ? AND is_equipped = 0");
            $stmtCount->execute([$playerId]);
            if ((int)$stmtCount->fetchColumn() >= 20) { echo json_encode(['success' => false, 'error' => 'Inventory full']); exit; }
            $pdo->prepare("INSERT INTO inventory (player_id, item_name, rarity, item_type, category, is_equipped) VALUES (?, ?, ?, 'Drop', ?, 0)")
                ->execute([$playerId, $itemName, $rarity, $category]);
            echo json_encode(['success' => true]);

        } elseif ($action === 'add_gold') {
            $amount = (int)($data['amount'] ?? 0);
            if ($amount <= 0) { echo json_encode(['success' => false, 'error' => 'Invalid amount']); exit; }
            $pdo->prepare("UPDATE players SET gold = gold + ? WHERE id = ?")->execute([$amount, $playerId]);
            $newGold = $pdo->prepare("SELECT gold FROM players WHERE id = ?");
            $newGold->execute([$playerId]);
            echo json_encode(['success' => true, 'new_gold' => (int)$newGold->fetchColumn()]);

        } elseif ($action === 'check_space') {
            $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM inventory WHERE player_id = ? AND is_equipped = 0");
            $stmtCount->execute([$playerId]);
            $used = (int)$stmtCount->fetchColumn();
            echo json_encode(['success' => true, 'used' => $used, 'max' => 20, 'has_space' => $used < 20]);

        } else {
            echo json_encode(['success' => false, 'error' => 'Unknown action']);
        }
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB: ' . $e->getMessage()]);
}
?>
